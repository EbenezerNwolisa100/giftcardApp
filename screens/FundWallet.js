import React, { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Image,
  RefreshControl,
} from "react-native"
import { supabase } from "./supabaseClient"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { WebView } from "react-native-webview"

import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import Modal from "react-native-modal"
import { useTheme } from "./ThemeContext"

const { width, height } = Dimensions.get("window")

// Flutterwave Configuration
const FLUTTERWAVE_PUBLIC_KEY = "FLWPUBK_TEST-5ffda8e1c4628295ae1144e4c4a88109-X" // Replace with your actual test public key
const FLUTTERWAVE_SECRET_KEY = "FLWSECK_TEST-969dac723950b37a2474e82bad8c5e06-X" // Replace with your actual test secret key

export default function FundWallet() {
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("flutterwave")
  const [loading, setLoading] = useState(false)
  const [flutterwaveLoading, setFlutterwaveLoading] = useState(false)
  const [showFlutterwaveModal, setShowFlutterwaveModal] = useState(false)
  const [bankDetails, setBankDetails] = useState(null)
  const [bankDetailsLoading, setBankDetailsLoading] = useState(false)
  const [proofImage, setProofImage] = useState(null)
  const [feedback, setFeedback] = useState("")
  const [processingFee, setProcessingFee] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [showFeeDetails, setShowFeeDetails] = useState(false)
  const [isProcessingFlutterwave, setIsProcessingFlutterwave] = useState(false)
  
  // Flutterwave WebView states
  const [showFlutterwaveWebView, setShowFlutterwaveWebView] = useState(false)
  const [flutterwaveUrl, setFlutterwaveUrl] = useState("")
  const [flutterwaveReference, setFlutterwaveReference] = useState("")
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false)
  const [hasNavigated, setHasNavigated] = useState(false)
  const [hasStartedVerification, setHasStartedVerification] = useState(false)
  const [isWebViewLoading, setIsWebViewLoading] = useState(false)
  const [currentWebViewUrl, setCurrentWebViewUrl] = useState("")
  const [successDetected, setSuccessDetected] = useState(false)
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false)
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState("")

  const navigation = useNavigation()
  const { theme, isDarkTheme } = useTheme()

  const fetchProcessingFee = useCallback(async () => {
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "processing_fee_flat")
      .single()
    if (data) setProcessingFee(Number(data.value))
    if (error) console.log("Error fetching processing fee:", error)
  }, [])

  const fetchAdminBankDetails = useCallback(async () => {
    setBankDetailsLoading(true)
    const { data, error } = await supabase
      .from("admin_bank_details")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()
    setBankDetails(data || null)
    setBankDetailsLoading(false)
    if (error) {
      console.log("Error fetching admin bank details:", error)
    }
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([fetchProcessingFee(), fetchAdminBankDetails()])
    setRefreshing(false)
  }, [fetchProcessingFee, fetchAdminBankDetails])



  useEffect(() => {
    fetchProcessingFee()
    
    // Cleanup function to reset states when component unmounts
    return () => {
      resetPaymentStates()
    }
  }, [fetchProcessingFee])

  useFocusEffect(
    React.useCallback(() => {
      if (paymentMethod === "manual_transfer") {
        fetchAdminBankDetails()
      }
    }, [paymentMethod, fetchAdminBankDetails]),
  )

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    })
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProofImage(result.assets[0])
    }
  }

  const generateFlutterwavePayment = async (amount, email) => {
    const reference = `fw_ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fee = processingFee || 0 // Ensure processing fee is not undefined
    const totalAmount = amount + fee
    
    try {
      // Call your PHP backend API to initialize Flutterwave payment
      const response = await fetch('https://wallet.qfundledger.com/flutterwave-api.php/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalAmount, // Send the total amount (including fee) - user pays this
          email: email,
          reference: reference,
          metadata: {
            amount: amount.toString(), // Base amount to be credited
            processing_fee: fee.toString(),
            total_amount: totalAmount.toString()
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log("Flutterwave payment initialized:", data);
        return {
          paymentUrl: data.data.payment_url,
          reference: data.data.reference || reference // Use Flutterwave's reference if available
        };
      } else {
        throw new Error(data.error || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Error initializing Flutterwave payment:', error);
      throw error;
    }
  }

  const resetPaymentStates = () => {
    setShowFlutterwaveWebView(false)
    setFlutterwaveUrl("")
    setFlutterwaveReference("")
    setIsVerifyingPayment(false)
    setHasStartedVerification(false)
    setHasNavigated(false)
    setFeedback("")
    setIsWebViewLoading(false)
    setCurrentWebViewUrl("")
    setSuccessDetected(false)
    setIsPaymentProcessing(false)
    setCurrentPaymentMethod("")
  }

  const handleFlutterwave = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount.")
      return
    }
    if (flutterwaveLoading || isProcessingFlutterwave) {
      return;
    }
    
    // Validate Flutterwave public key
    if (!FLUTTERWAVE_PUBLIC_KEY || FLUTTERWAVE_PUBLIC_KEY === "FLWPUBK_TEST-...") {
      Alert.alert("Error", "Flutterwave public key not configured. Please check your configuration.")
      return
    }
    
    console.log("Using Flutterwave public key:", FLUTTERWAVE_PUBLIC_KEY)
    console.log("Flutterwave public key length:", FLUTTERWAVE_PUBLIC_KEY.length)
    
    // Reset all payment states for new payment
    resetPaymentStates()
    
    setIsProcessingFlutterwave(true)
    setFlutterwaveLoading(true)
    setIsPaymentProcessing(true) // Start payment processing state
    setCurrentPaymentMethod("flutterwave") // Set current payment method
    setShowFlutterwaveModal(false)
    setFeedback("Initializing Flutterwave payment...")

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("You must be logged in to fund your wallet.")
      
      const enteredAmount = Number(amount) || 0
      
      // Generate Flutterwave payment URL
      const { paymentUrl, reference } = await generateFlutterwavePayment(enteredAmount, user.email)
      
      console.log("User email:", user.email) // Debug log
      console.log("Base amount:", enteredAmount) // Debug log
      console.log("Processing fee:", processingFee) // Debug log
      console.log("Total amount to pay:", enteredAmount + processingFee) // Debug log
      console.log("Payment URL:", paymentUrl) // Debug log
      
      // Store reference for verification
      setFlutterwaveReference(reference)
      setFlutterwaveUrl(paymentUrl)
      
      // Show Flutterwave WebView
      setShowFlutterwaveWebView(true)
      setFeedback("")
      
      // Set a timeout to prevent hanging
      setTimeout(() => {
        if (showFlutterwaveWebView && !hasNavigated && !isVerifyingPayment) {
          console.log('Payment timeout - closing WebView')
          handlePaymentFailure("Payment timeout - please try again")
        }
      }, 300000) // 5 minutes timeout
      
      // For debugging - you can check the console to see the generated URL
      
    } catch (e) {
      setFeedback("")
      setIsPaymentProcessing(false) // Stop payment processing on error
      Alert.alert("Error", e.message || "Failed to initialize payment.")
    } finally {
      setFlutterwaveLoading(false)
      setIsProcessingFlutterwave(false)
    }
  }

  const handleWebViewNavigationStateChange = (navState) => {
    const { url } = navState
    console.log("=== WEBVIEW NAVIGATION ===")
    console.log("WebView URL:", url)
    console.log("Current states - isVerifyingPayment:", isVerifyingPayment, "hasStartedVerification:", hasStartedVerification, "hasNavigated:", hasNavigated, "isWebViewLoading:", isWebViewLoading)
    
    // Track current URL
    setCurrentWebViewUrl(url)
    
    // Only process if we have a reference to track
    if (!flutterwaveReference) {
      console.log("No flutterwave reference available for tracking")
      return
    }
    
    console.log("Current flutterwave reference:", flutterwaveReference)
    
    // Prevent processing if already navigating or verifying
    if (hasNavigated || isVerifyingPayment || hasStartedVerification) {
      console.log("Already processing payment, ignoring navigation change")
      return
    }
    
    // IMMEDIATE SUCCESS DETECTION - Check for success URLs first, before anything else
    // This should catch the success URL before any error can be displayed
    if (url.includes('status=successful') || url.includes('status=success')) {
      console.log("=== IMMEDIATE SUCCESS DETECTION ===")
      console.log("Payment success detected in URL:", url)
      
      // Close WebView IMMEDIATELY to prevent any error screen from showing
      setShowFlutterwaveWebView(false)
      setIsWebViewLoading(false) // Stop loading state immediately
      setSuccessDetected(true) // Set success detected state
      
      // Extract transaction_id from URL if available
      const urlParams = new URLSearchParams(url.split('?')[1] || '')
      const transactionId = urlParams.get('transaction_id')
      const txRef = urlParams.get('tx_ref')
      
      console.log("URL params - transaction_id:", transactionId, "tx_ref:", txRef)
      
      // Process success immediately
      if (transactionId) {
        console.log("Found transaction ID:", transactionId)
        handlePaymentSuccess(transactionId)
      } else if (txRef && txRef === flutterwaveReference) {
        console.log("Found matching tx_ref:", txRef)
        handlePaymentSuccess()
      } else {
        handlePaymentSuccess()
      }
      return // Exit immediately to prevent any other processing
    }
    
    // Check for Flutterwave error pages - be more specific
    if (url.includes('error') || url.includes('failed') || url.includes('invalid')) {
      console.log("Flutterwave error detected in URL:", url)
      handlePaymentFailure("Payment failed - please try again")
      return
    }
    
    // Check for cancel/failed status
    if (url.includes('status=cancelled') || url.includes('status=cancel')) {
      console.log("Payment cancelled detected in URL:", url)
      handlePaymentFailure("Payment was cancelled")
      return
    } else if (url.includes('status=failed')) {
      console.log("Payment failed detected in URL:", url)
      handlePaymentFailure("Payment failed")
      return
    }
    
    // Prevent processing if WebView is still loading (for other URLs)
    if (isWebViewLoading) {
      console.log("WebView is still loading, ignoring navigation change")
      return
    }
    
    // Don't process other URLs - let user complete the payment flow
  }

  const handlePaymentSuccess = async (transactionId = null) => {
    // Prevent double processing
    if (isVerifyingPayment || hasStartedVerification || hasNavigated) {
      console.log('Payment verification already in progress or completed, skipping...')
      return
    }
    
    console.log('=== STARTING PAYMENT VERIFICATION ===')
    console.log('Transaction ID:', transactionId)
    console.log('Flutterwave Reference:', flutterwaveReference)
    console.log('Current hasNavigated state:', hasNavigated)
    
    setIsVerifyingPayment(true)
    setHasStartedVerification(true)
    
    try {
      setFeedback("Payment successful! Verifying transaction...")
      
      console.log('Starting payment verification...')
      console.log('Reference to verify:', flutterwaveReference)
      console.log('Transaction ID to verify:', transactionId)
      
      // Use transaction ID if available, otherwise use reference
      const requestData = {
        reference: transactionId || flutterwaveReference
      }
      
      console.log('Sending verification data:', requestData)
      
      // Verify the payment with your PHP backend API
      console.log('Making verification request to:', 'https://wallet.qfundledger.com/flutterwave-api.php/verify')
      console.log('Request data:', requestData)
      
      const verificationResponse = await fetch('https://wallet.qfundledger.com/flutterwave-api.php/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });
      
      console.log('Verification response status:', verificationResponse.status)
      console.log('Verification response headers:', verificationResponse.headers)
      
      const verificationData = await verificationResponse.json();
      console.log('Verification response data:', verificationData)
      
      if (!verificationData.success) {
        console.log('Verification failed with data:', verificationData)
        throw new Error(verificationData.error || 'Payment verification failed');
      }
      
      console.log('Payment verified:', verificationData.data);
      
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not found")
      
      const enteredAmount = Number(amount) || 0
      const fee = processingFee
      
      // Check if transaction already exists to prevent duplicates
      console.log('Checking for existing transaction with reference:', flutterwaveReference)
      const { data: existingTx, error: existingError } = await supabase
        .from("wallet_transactions")
        .select("id, amount, status, created_at")
        .eq("user_id", user.id)
        .eq("type", "fund")
        .eq("payment_method", "flutterwave")
        .eq("reference", flutterwaveReference)
        .limit(1)
      
      if (existingError) {
        console.log('Error checking existing transaction:', existingError)
      }
      
      console.log('Existing transaction check result:', existingTx)
      
      if (existingTx && existingTx.length > 0) {
        const existingTransaction = existingTx[0]
        console.log('Transaction already exists:', existingTransaction)
        
        // Navigate to success (WebView already closed)
        setHasNavigated(true)
        navigation.navigate("FundingResult", { 
          success: true,
          amount: enteredAmount,
          paymentMethod: "flutterwave"
        })
        return
      }
      
      // Create the transaction record
      console.log('Creating new transaction record with data:', {
        user_id: user.id,
        type: "fund",
        amount: enteredAmount,
        fee: fee,
        status: "completed",
        payment_method: "flutterwave",
        reference: flutterwaveReference,
        flutterwave_reference: flutterwaveReference,
        description: `Wallet funded via Flutterwave (fee: ₦${fee})`
      })
      
      const { data: txData, error: txError } = await supabase.from("wallet_transactions").insert([
        {
          user_id: user.id,
          type: "fund",
          amount: enteredAmount,
          fee: fee,
          status: "completed",
          payment_method: "flutterwave",
          reference: flutterwaveReference,
          flutterwave_reference: flutterwaveReference,
          description: `Wallet funded via Flutterwave (fee: ₦${fee})`,
        },
      ]).select().single()
      
      if (txError) {
        console.log('Error creating transaction:', txError)
        throw txError
      }
      
      console.log('Transaction created successfully:', txData)
      
      // Navigate to success (WebView already closed)
      console.log('Navigating to success page...')
      setHasNavigated(true)
      setIsPaymentProcessing(false) // Stop payment processing
      navigation.navigate("FundingResult", { 
        success: true,
        amount: enteredAmount,
        paymentMethod: "flutterwave"
      })
      
    } catch (e) {
      console.log('=== PAYMENT VERIFICATION ERROR ===')
      console.log('Error message:', e.message)
      console.log('Error stack:', e.stack)
      console.log('Current navigation state - hasNavigated:', hasNavigated)
      console.log('Current verification state - isVerifyingPayment:', isVerifyingPayment)
      console.log('Current verification state - hasStartedVerification:', hasStartedVerification)
      console.log('Flutterwave reference:', flutterwaveReference)
      console.log('Amount:', amount)
      console.log('Processing fee:', processingFee)
      
      // Only handle failure if we haven't already navigated
      if (!hasNavigated) {
        handlePaymentFailure(e.message)
      }
    } finally {
      setIsVerifyingPayment(false)
      console.log('Verification process completed, isVerifyingPayment set to false')
    }
  }

  const handlePaymentFailure = (errorMessage = "Payment was cancelled or failed") => {
    console.log('=== HANDLING PAYMENT FAILURE ===')
    console.log('Error message:', errorMessage)
    console.log('Current hasNavigated state:', hasNavigated)
    console.log('Current isVerifyingPayment state:', isVerifyingPayment)
    console.log('Current hasStartedVerification state:', hasStartedVerification)
    
    // Prevent multiple navigations
    if (hasNavigated) {
      console.log('Already navigated, skipping failure navigation')
      return
    }
    
    console.log('Closing WebView and resetting states...')
    setShowFlutterwaveWebView(false)
    setFeedback("")
    setIsVerifyingPayment(false)
    setHasStartedVerification(false)
    setIsPaymentProcessing(false) // Stop payment processing
    
    // Set hasNavigated to prevent further processing
    setHasNavigated(true)
    
    console.log('Navigating to failure page')
    // Navigate to failure page
    navigation.navigate("FundingResult", { 
      success: false,
      error: errorMessage,
      amount: Number(amount) || 0
    })
  }

  const handleManualTransfer = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount.")
      return
    }
    if (!proofImage) {
      Alert.alert("Error", "Please upload proof of payment.")
      return
    }
    if (loading) return;
    setLoading(true)
    setIsPaymentProcessing(true) // Start payment processing state
    setCurrentPaymentMethod("manual_transfer") // Set current payment method
    setFeedback("Uploading proof and submitting request...")

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("You must be logged in to fund your wallet.")
      const enteredAmount = Number(amount) || 0
      const fee = processingFee
      // For Manual Transfer: User pays enteredAmount + fee, but gets credited only enteredAmount
      const totalToPay = enteredAmount + fee
      const ext = proofImage.uri.split(".").pop()
      const fileName = `proofs/${user.id}_${Date.now()}.${ext}`
      const response = await fetch(proofImage.uri)
      const blob = await response.blob()
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("proofs")
        .upload(fileName, blob, { contentType: proofImage.type || "image/jpeg" })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("proofs").getPublicUrl(fileName)
      
      // Check if a similar pending transaction already exists to prevent duplicates
      const { data: existingTx } = await supabase
        .from("wallet_transactions")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", "fund")
        .eq("payment_method", "manual_transfer")
        .eq("amount", enteredAmount)
        .eq("status", "pending")
        .gte("created_at", new Date(Date.now() - 300000).toISOString()) // Check last 5 minutes
        .limit(1)
      
      if (existingTx && existingTx.length > 0) {
        throw new Error("A similar pending transaction already exists. Please wait for it to be processed.")
      }

      const { error: txError } = await supabase.from("wallet_transactions").insert([
        {
          user_id: user.id,
          type: "fund",
          amount: enteredAmount,
          fee: fee,
          status: "pending",
          payment_method: "manual_transfer",
          proof_of_payment_url: publicUrl,
          description: `Wallet funding via bank transfer (fee: ₦${fee})`,
        },
      ])
      if (txError) throw txError

      setLoading(false)
      setIsPaymentProcessing(false) // Stop payment processing
      setFeedback("")
      navigation.navigate("FundingResult", { 
        success: true,
        amount: enteredAmount,
        paymentMethod: "manual_transfer",
        status: "pending"
      })
    } catch (e) {
      setLoading(false)
      setIsPaymentProcessing(false) // Stop payment processing on error
      setFeedback("")
      navigation.navigate("FundingResult", { 
        success: false,
        error: e.message || "Failed to submit funding request.",
        amount: enteredAmount
      })
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    // Loading Overlay Styles
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    loadingContainer: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 30,
      alignItems: 'center',
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    loadingText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginTop: 16,
      textAlign: 'center',
    },
    loadingSubtext: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
    // Fixed Header Styles
    fixedHeader: {
      paddingHorizontal: 18,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 5 : 45,
      paddingBottom: 16,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerTitle: {
      color: theme.text,
      fontSize: 24,
      fontWeight: "bold",
      flex: 1,
      textAlign: "center",
    },
    backButton: {
      padding: 8,
      zIndex: 11,
    },
    placeholder: {
      width: 40,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 18,
      paddingBottom: Platform.OS === "ios" ? 85 + 20 : 70 + 20,
    },
    amountCard: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 24,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    amountLabel: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 12,
      color: theme.text,
    },
    amountInput: {
      fontSize: 18,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderRadius: 12,
      borderWidth: 1,
      backgroundColor: theme.surfaceSecondary,
      color: theme.text,
      borderColor: theme.border,
    },
    paymentSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 16,
      color: theme.text,
    },
    paymentMethods: {
      flexDirection: "row",
      gap: 12,
    },
    methodButton: {
      flex: 1,
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
      borderWidth: 2,
      backgroundColor: theme.surface,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    methodButtonActive: {
      borderColor: theme.accent,
      backgroundColor: theme.accent + "10",
    },
    methodButtonText: {
      fontSize: 14,
      fontWeight: "600",
      marginTop: 8,
      color: theme.text,
    },
    methodButtonTextActive: {
      color: theme.primary,
    },
    feedbackCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    feedbackText: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.textSecondary,
    },
    bankCard: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 24,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    bankTitle: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 16,
      color: theme.text,
    },
    bankDetails: {
      marginBottom: 16,
    },
    bankDetail: {
      fontSize: 14,
      marginBottom: 8,
      color: theme.textSecondary,
    },
    bankDetailValue: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },
    uploadButton: {
      backgroundColor: theme.accent,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 20,
      marginBottom: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    uploadText: {
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
      color: theme.primary,
    },
    imagePreview: {
      marginTop: 16,
    },
    previewText: {
      fontSize: 14,
      marginBottom: 12,
      color: theme.textSecondary,
    },
    previewImage: {
      width: 120,
      height: 120,
      borderRadius: 12,
    },
    submitButton: {
      backgroundColor: theme.accent,
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 32,
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    submitButtonDisabled: {
      opacity: 0.7,
    },
    submitButtonText: {
      fontSize: 18,
      fontWeight: "bold",
      marginRight: 8,
      color: theme.primary,
    },
    buttonIcon: {
      marginLeft: 4,
    },
    modalContent: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 24,
      alignItems: "center",
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    modalTitle: {
      fontWeight: "bold",
      fontSize: 18,
      marginBottom: 12,
      color: theme.text,
    },
    modalText: {
      marginBottom: 16,
      textAlign: "center",
      color: theme.textSecondary,
    },
    modalButton: {
      backgroundColor: theme.accent,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
      marginBottom: 8,
    },
    modalButtonText: {
      fontWeight: "bold",
      color: theme.primary,
    },
    modalCancel: {
      marginTop: 8,
      color: theme.accent,
    },
    feeDetailsContainer: {
      marginBottom: 16,
      paddingHorizontal: 5,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 13,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    // Skeleton Styles
    skeletonContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    skeletonFixedHeader: {
      paddingHorizontal: 18,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 5 : 45,
      paddingBottom: 16,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    skeletonAmountCard: {
      height: 150,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 20,
      marginHorizontal: 18,
      marginTop: 20,
      marginBottom: 24,
    },
    skeletonPaymentSection: {
      height: 120,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginHorizontal: 18,
      marginBottom: 24,
    },
    skeletonFeedbackCard: {
      height: 80,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginHorizontal: 18,
      marginBottom: 20,
    },
    skeletonBankCard: {
      height: 200,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 20,
      marginHorizontal: 18,
      marginBottom: 24,
    },
    skeletonSubmitButton: {
      height: 60,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginHorizontal: 18,
      marginBottom: 24,
    },
    // WebView Styles
    webViewContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    webViewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.surface,
    },
    webViewCloseButton: {
      padding: 8,
    },
    webViewTitle: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    webView: {
      flex: 1,
    },
    webViewLoading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
    },
    webViewLoadingText: {
      marginTop: 12,
      fontSize: 16,
    },

  })

  // FundWallet Skeleton Component
  const FundWalletSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />
      {/* Fixed Header Skeleton */}
      <View style={styles.skeletonFixedHeader}>
        <View style={{ width: 24, height: 24, backgroundColor: theme.surfaceSecondary, borderRadius: 12 }} />
        <View style={{ width: 150, height: 24, backgroundColor: theme.surfaceSecondary, borderRadius: 4 }} />
        <View style={{ width: 40, height: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Input Skeleton */}
        <View style={styles.skeletonAmountCard} />

        {/* Payment Method Selector Skeleton */}
        <View style={styles.skeletonPaymentSection} />

        {/* Submit Button Skeleton */}
        <View style={styles.skeletonSubmitButton} />
      </ScrollView>
    </View>
  );

  if (loading && !refreshing) { // Show skeleton only on initial load, not on pull-to-refresh
    return <FundWalletSkeleton />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />

      {/* Fixed Header */}
      <View
        style={{
          // backgroundColor: theme.primary,
          borderBottomColor: theme.border,
          shadowColor: theme.shadow,
          paddingHorizontal: 10,
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 5 : 45,
          paddingBottom: 10,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          // elevation: 8,
          zIndex: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TouchableOpacity
          style={{
            marginLeft: 0,
            padding: 6,
            borderRadius: 6,
          }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold' }}>Fund Wallet</Text>
        <View style={{ width: 32, height: 32 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.accent}
              colors={[theme.accent]}
              progressBackgroundColor={theme.surface}
            />
          }
        >
          {/* Amount Input */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Amount to Fund (₦)</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={(text) => {
                setAmount(text)
                // Show fee details when user starts typing
                if (text && Number(text) > 0) {
                  setShowFeeDetails(true)
                } else {
                  setShowFeeDetails(false)
                }
              }}
              keyboardType="numeric"
              placeholder="Enter amount"
              placeholderTextColor={theme.textMuted}
            />
          </View>

          {/* Processing Fee Display - Only show when user enters amount */}
          {showFeeDetails && (
            <View style={styles.feeDetailsContainer}>
              <Text style={{ color: theme.text, fontSize: 14, marginBottom: 4 }}>
                Processing Fee: ₦{processingFee.toLocaleString()}
              </Text>
              <Text style={{ color: theme.text, fontWeight: "bold", fontSize: 16 }}>
                Total to Pay: ₦{(Number(amount || 0) + processingFee).toLocaleString()}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
                You will be credited: ₦{Number(amount || 0).toLocaleString()}
              </Text>
            </View>
          )}

          {/* Payment Method Selector */}
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Select Payment Method</Text>
            <View style={styles.paymentMethods}>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  paymentMethod === "flutterwave" && styles.methodButtonActive,
                ]}
                onPress={() => {
                  setPaymentMethod("flutterwave")
                  setFeedback("You selected Flutterwave. You will pay the total amount (including fee) online and your wallet will be credited with the entered amount instantly.")
                }}
              >
                <Ionicons name="card" size={24} color={paymentMethod === "flutterwave" ? theme.primary : theme.text} />
                <Text
                  style={[
                    styles.methodButtonText,
                    paymentMethod === "flutterwave" && styles.methodButtonTextActive,
                  ]}
                >
                  Flutterwave
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodButton,
                  paymentMethod === "manual_transfer" && styles.methodButtonActive,
                ]}
                onPress={() => {
                  setPaymentMethod("manual_transfer")
                  setFeedback(
                    "You selected Manual Transfer. You must transfer the total amount (including fee) to the admin account and upload proof. Your wallet will be credited with the entered amount after admin approval.",
                  )
                }}
              >
                <Ionicons
                  name="business"
                  size={24}
                  color={paymentMethod === "manual_transfer" ? theme.primary : theme.text}
                />
                <Text
                  style={[
                    styles.methodButtonText,
                    paymentMethod === "manual_transfer" && styles.methodButtonTextActive,
                  ]}
                >
                  Bank Transfer
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Feedback */}
          {feedback ? (
            <View style={styles.feedbackCard}>
              <Text style={styles.feedbackText}>{feedback}</Text>
            </View>
          ) : null}

          {/* Manual Transfer Details */}
          {paymentMethod === "manual_transfer" && (
            <>
              {bankDetailsLoading ? (
                <Text style={{ color: theme.text, textAlign: "center", marginBottom: 16 }}>
                  Loading admin bank details...
                </Text>
              ) : bankDetails ? (
                <View style={styles.bankCard}>
                  <Text style={styles.bankTitle}>Transfer to:</Text>
                  <View style={styles.bankDetails}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={styles.bankDetail}>Bank:</Text>
                      <Text style={styles.bankDetailValue}>{bankDetails.bank_name}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={styles.bankDetail}>Account Name:</Text>
                      <Text style={styles.bankDetailValue}>{bankDetails.account_name}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={styles.bankDetail}>Account Number:</Text>
                      <Text style={styles.bankDetailValue}>{bankDetails.account_number}</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <Text
                  style={{
                    color: theme.error,
                    marginBottom: 16,
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  Admin bank details not available. Please contact support.
                </Text>
              )}
              {/* Prominent upload proof area */}
              <View
                style={[
                  styles.bankCard,
                  {
                    borderWidth: 2,
                    borderColor: theme.accent,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={pickImage}
                >
                  <Ionicons name="camera" size={24} color={theme.primary} />
                  <Text style={styles.uploadText}>
                    {proofImage ? "Change Proof of Payment" : "Tap to Upload Proof of Payment"}
                  </Text>
                </TouchableOpacity>
                {proofImage && (
                  <View style={styles.imagePreview}>
                    <Text style={[styles.previewText, { color: theme.textSecondary }]}>Proof of Payment:</Text>
                    <Image source={{ uri: proofImage.uri }} style={styles.previewImage} />
                  </View>
                )}
              </View>
            </>
          )}



          {/* Submit Button */}
          {paymentMethod === "flutterwave" ? (
            <TouchableOpacity
              style={[styles.submitButton, loading || flutterwaveLoading || isProcessingFlutterwave ? styles.submitButtonDisabled : null]}
              onPress={() => {
                if (!isProcessingFlutterwave) {
                  setShowFlutterwaveModal(true)
                }
              }}
              disabled={loading || flutterwaveLoading || isProcessingFlutterwave}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>Pay with Flutterwave</Text>
              <Ionicons name="arrow-forward" size={20} color={theme.primary} style={styles.buttonIcon} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitButton, loading || flutterwaveLoading ? styles.submitButtonDisabled : null]}
              onPress={handleManualTransfer}
              disabled={loading || flutterwaveLoading}
              activeOpacity={0.8}
            >
              {loading || flutterwaveLoading ? (
                <ActivityIndicator color={theme.primary} size="small" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Submit Proof & Request</Text>
                  <Ionicons name="arrow-forward" size={20} color={theme.primary} style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Flutterwave Modal */}
          <Modal 
            isVisible={showFlutterwaveModal} 
            onBackdropPress={() => setShowFlutterwaveModal(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Pay with Flutterwave</Text>
              <Text style={[styles.modalText, { color: theme.textSecondary }]}>
                This is a demo popup. Integrate your Flutterwave payment here.
              </Text>
              {flutterwaveLoading ? (
                <ActivityIndicator color={theme.accent} size="large" />
              ) : (
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.accent }]}
                  onPress={handleFlutterwave}
                  disabled={flutterwaveLoading || isProcessingFlutterwave}
                  activeOpacity={flutterwaveLoading || isProcessingFlutterwave ? 0.5 : 0.8}
                >
                  <Text style={[styles.modalButtonText, { color: theme.textContrast }]}>Simulate Flutterwave Payment</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowFlutterwaveModal(false)}>
                <Text style={[styles.modalCancel, { color: theme.accent }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Modal>

          {/* Flutterwave WebView */}
          <Modal 
            isVisible={showFlutterwaveWebView} 
            style={{ margin: 0 }}
            animationIn="slideInUp"
            animationOut="slideOutDown"
          >
            <View style={styles.webViewContainer}>
              {successDetected ? (
                // Show success processing message instead of WebView
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color={theme.accent} />
                  <Text style={[styles.webViewLoadingText, { color: theme.text }]}>
                    Payment successful! Processing...
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.webViewHeader}>
                    <TouchableOpacity
                      style={styles.webViewCloseButton}
                      onPress={() => {
                        console.log('User manually closed WebView')
                        resetPaymentStates()
                      }}
                    >
                      <Ionicons name="close" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.webViewTitle, { color: theme.text }]}>Flutterwave Payment</Text>
                    <View style={{ width: 40 }} />
                  </View>
                  <WebView
                    source={{ uri: flutterwaveUrl }}
                    style={styles.webView}
                    onNavigationStateChange={handleWebViewNavigationStateChange}
                    onShouldStartLoadWithRequest={(request) => {
                      const { url } = request
                      console.log('=== SHOULD START LOAD REQUEST ===')
                      console.log('Request URL:', url)
                      
                      // If this is a success URL, prevent loading and handle success immediately
                      if (url.includes('status=successful') || url.includes('status=success')) {
                        console.log('Preventing load of success URL to avoid 404 screen')
                        
                        // Close WebView immediately
                        setShowFlutterwaveWebView(false)
                        setIsWebViewLoading(false)
                        setSuccessDetected(true) // Set success detected state
                        
                        // Extract parameters and handle success
                        const urlParams = new URLSearchParams(url.split('?')[1] || '')
                        const transactionId = urlParams.get('transaction_id')
                        const txRef = urlParams.get('tx_ref')
                        
                        console.log("Prevented load URL params - transaction_id:", transactionId, "tx_ref:", txRef)
                        
                        if (transactionId) {
                          handlePaymentSuccess(transactionId)
                        } else if (txRef && txRef === flutterwaveReference) {
                          handlePaymentSuccess()
                        } else {
                          handlePaymentSuccess()
                        }
                        
                        return false // Prevent the WebView from loading this URL
                      }
                      
                      // Allow all other URLs to load normally
                      return true
                    }}
                    onError={(syntheticEvent) => {
                      const { nativeEvent } = syntheticEvent
                      console.log('WebView error:', nativeEvent)
                      if (!hasNavigated) {
                        handlePaymentFailure("Failed to load payment page")
                      }
                    }}
                    onHttpError={(syntheticEvent) => {
                      const { nativeEvent } = syntheticEvent
                      console.log('WebView HTTP error:', nativeEvent)
                      
                      // Check if the error URL contains success parameters
                      const errorUrl = nativeEvent.url || ''
                      console.log('HTTP error URL:', errorUrl)
                      
                      if (errorUrl.includes('status=successful') || errorUrl.includes('status=success')) {
                        console.log('Payment success detected in error URL despite HTTP error')
                        
                        // Close WebView immediately to prevent 404 screen from showing
                        setShowFlutterwaveWebView(false)
                        setSuccessDetected(true) // Set success detected state
                        
                        // Extract transaction_id from URL if available
                        const urlParams = new URLSearchParams(errorUrl.split('?')[1] || '')
                        const transactionId = urlParams.get('transaction_id')
                        
                        if (transactionId) {
                          console.log("Found transaction ID in error URL:", transactionId)
                          handlePaymentSuccess(transactionId)
                        } else {
                          handlePaymentSuccess()
                        }
                      } else if (!hasNavigated) {
                        handlePaymentFailure("Payment page error")
                      }
                    }}
                    onLoadStart={() => {
                      console.log('WebView started loading:', flutterwaveUrl)
                      setIsWebViewLoading(true)
                    }}
                    onLoadEnd={() => {
                      console.log('WebView finished loading')
                      // Check if the page has content
                      setTimeout(() => {
                        console.log('Checking if Flutterwave page loaded properly...')
                        setIsWebViewLoading(false)
                        
                        // Additional check for success parameters in current URL
                        if (showFlutterwaveWebView && !hasNavigated && !isVerifyingPayment) {
                          const currentUrl = currentWebViewUrl // Use the tracked current URL
                          console.log('Checking current URL for success parameters:', currentUrl)
                          
                          if (currentUrl.includes('status=successful') || currentUrl.includes('status=success')) {
                            console.log('Success detected in current URL after load')
                            const urlParams = new URLSearchParams(currentUrl.split('?')[1] || '')
                            const transactionId = urlParams.get('transaction_id')
                            const txRef = urlParams.get('tx_ref')
                            
                            console.log("Load end URL params - transaction_id:", transactionId, "tx_ref:", txRef)
                            
                            if (transactionId) {
                              handlePaymentSuccess(transactionId)
                            } else if (txRef && txRef === flutterwaveReference) {
                              handlePaymentSuccess()
                            } else {
                              handlePaymentSuccess()
                            }
                          }
                        }
                      }, 2000)
                    }}
                    startInLoadingState={true}
                    renderLoading={() => (
                      <View style={styles.webViewLoading}>
                        <ActivityIndicator size="large" color={theme.accent} />
                        <Text style={[styles.webViewLoadingText, { color: theme.text }]}>
                          Loading Flutterwave...
                        </Text>
                      </View>
                    )}
                    userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
                  />
                </>
              )}
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Payment Processing Loading Overlay */}
      {isPaymentProcessing && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={styles.loadingText}>
              {currentPaymentMethod === "flutterwave" 
                ? "Processing Payment" 
                : "Submitting Request"
              }
            </Text>
            <Text style={styles.loadingSubtext}>
              {currentPaymentMethod === "flutterwave"
                ? "Please wait while we process your payment..."
                : "Please wait while we submit your proof of payment..."
              }
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}
