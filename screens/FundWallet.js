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

// Paystack Configuration
const PAYSTACK_PUBLIC_KEY = "pk_test_2ba7130b0b7d2c18f74f7276a255f5e419962f9b" // Replace with your actual test public key
const PAYSTACK_SECRET_KEY = "sk_test_1e844224e04d7839ecb15be9cf2a063a8c1feadf" // Replace with your actual test secret key

export default function FundWallet() {
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("paystack")
  const [loading, setLoading] = useState(false)
  const [paystackLoading, setPaystackLoading] = useState(false)
  const [showPaystackModal, setShowPaystackModal] = useState(false)
  const [bankDetails, setBankDetails] = useState(null)
  const [bankDetailsLoading, setBankDetailsLoading] = useState(false)
  const [proofImage, setProofImage] = useState(null)
  const [feedback, setFeedback] = useState("")
  const [processingFee, setProcessingFee] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [showFeeDetails, setShowFeeDetails] = useState(false)
  const [isProcessingPaystack, setIsProcessingPaystack] = useState(false)
  
  // Paystack WebView states
  const [showPaystackWebView, setShowPaystackWebView] = useState(false)
  const [paystackUrl, setPaystackUrl] = useState("")
  const [paystackReference, setPaystackReference] = useState("")

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

  const generatePaystackUrl = async (amount, email) => {
    const reference = `ps_ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fee = processingFee || 0 // Ensure processing fee is not undefined
    const totalAmount = amount + fee
    
    // Create Paystack payment URL with proper encoding
    const params = new URLSearchParams({
      amount: (totalAmount * 100).toString(), // Paystack expects amount in kobo
      email: email,
      reference: reference,
      currency: 'NGN',
      'metadata[amount]': amount.toString(),
      'metadata[processing_fee]': fee.toString(),
      'metadata[total_amount]': totalAmount.toString()
    })
    
    const paystackUrl = `https://checkout.paystack.com/${PAYSTACK_PUBLIC_KEY}?${params.toString()}`
    
    console.log("Generated Paystack URL:", paystackUrl) // Debug log
    
    return { paystackUrl, reference }
  }

  const handlePaystack = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount.")
      return
    }
    if (paystackLoading || isProcessingPaystack) {
      return;
    }
    
    // Validate Paystack public key
    if (!PAYSTACK_PUBLIC_KEY || PAYSTACK_PUBLIC_KEY === "pk_test_...") {
      Alert.alert("Error", "Paystack public key not configured. Please check your configuration.")
      return
    }
    
    setIsProcessingPaystack(true)
    setPaystackLoading(true)
    setShowPaystackModal(false)
    setFeedback("Initializing Paystack payment...")

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("You must be logged in to fund your wallet.")
      
      const enteredAmount = Number(amount) || 0
      
      // Generate Paystack payment URL
      const { paystackUrl, reference } = await generatePaystackUrl(enteredAmount, user.email)
      
      console.log("User email:", user.email) // Debug log
      console.log("Amount:", enteredAmount) // Debug log
      console.log("Processing fee:", processingFee) // Debug log
      
      // Store reference for verification
      setPaystackReference(reference)
      setPaystackUrl(paystackUrl)
      
      // Show Paystack WebView
      setShowPaystackWebView(true)
      setFeedback("")
      
      // For debugging - you can check the console to see the generated URL
      
    } catch (e) {
      setFeedback("")
      Alert.alert("Error", e.message || "Failed to initialize payment.")
    } finally {
      setPaystackLoading(false)
      setIsProcessingPaystack(false)
    }
  }

  const handleWebViewNavigationStateChange = (navState) => {
    const { url } = navState
    console.log("WebView URL:", url) // Debug log
    
    // Only process if we have a reference to track
    if (!paystackReference) return
    
    // Check for Paystack error pages
    if (url.includes('error') || url.includes('failed') || url.includes('invalid')) {
      console.log("Paystack error detected in URL:", url)
      handlePaymentFailure("Payment failed - please try again")
      return
    }
    
    // For testing purposes, let's detect when user is on the Paystack success page
    // In production, you'd verify with Paystack API
    if (url.includes('paystack.com/success') || url.includes('transaction/success')) {
      // Payment successful - verify and process
      handlePaymentSuccess()
    } else if (url.includes('paystack.com/cancel') || url.includes('transaction/cancel')) {
      // Payment cancelled
      handlePaymentFailure("Payment was cancelled")
    }
    // Don't process other URLs - let user complete the payment flow
  }

  const handlePaymentSuccess = async () => {
    try {
      setFeedback("Payment successful! Verifying transaction...")
      
      // Here you would typically verify the payment with Paystack API
      // For now, we'll simulate success
      
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not found")
      
      const enteredAmount = Number(amount) || 0
      const fee = processingFee
      
      // Create the transaction record
      const { data: txData, error: txError } = await supabase.from("wallet_transactions").insert([
        {
          user_id: user.id,
          type: "fund",
          amount: enteredAmount,
          fee: fee,
          status: "completed",
          payment_method: "paystack",
          reference: paystackReference,
          description: `Wallet funded via Paystack (fee: ₦${fee})`,
        },
      ]).select().single()
      
      if (txError) throw txError
      
      // Close WebView and navigate to success
      setShowPaystackWebView(false)
      navigation.navigate("FundingResult", { 
        success: true,
        amount: enteredAmount,
        paymentMethod: "paystack"
      })
      
    } catch (e) {
      handlePaymentFailure(e.message)
    }
  }

  const handlePaymentFailure = (errorMessage = "Payment was cancelled or failed") => {
    setShowPaystackWebView(false)
    setFeedback("")
    Alert.alert("Payment Failed", errorMessage)
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
      setFeedback("")
      navigation.navigate("FundingResult", { 
        success: true,
        amount: enteredAmount,
        paymentMethod: "manual_transfer",
        status: "pending"
      })
    } catch (e) {
      setLoading(false)
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
    testButtonContainer: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      right: 20,
      zIndex: 1000,
    },
    testButton: {
      backgroundColor: theme.accent,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    testButtonText: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: 'bold',
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
                  paymentMethod === "paystack" && styles.methodButtonActive,
                ]}
                onPress={() => {
                  setPaymentMethod("paystack")
                  setFeedback("You selected Paystack. You will pay the total amount (including fee) online and your wallet will be credited with the entered amount instantly.")
                }}
              >
                <Ionicons name="card" size={24} color={paymentMethod === "paystack" ? theme.primary : theme.text} />
                <Text
                  style={[
                    styles.methodButtonText,
                    paymentMethod === "paystack" && styles.methodButtonTextActive,
                  ]}
                >
                  Paystack
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
          {paymentMethod === "paystack" ? (
            <TouchableOpacity
              style={[styles.submitButton, loading || paystackLoading || isProcessingPaystack ? styles.submitButtonDisabled : null]}
              onPress={() => {
                if (!isProcessingPaystack) {
                  setShowPaystackModal(true)
                }
              }}
              disabled={loading || paystackLoading || isProcessingPaystack}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>Pay with Paystack</Text>
              <Ionicons name="arrow-forward" size={20} color={theme.primary} style={styles.buttonIcon} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitButton, loading || paystackLoading ? styles.submitButtonDisabled : null]}
              onPress={handleManualTransfer}
              disabled={loading || paystackLoading}
              activeOpacity={0.8}
            >
              {loading || paystackLoading ? (
                <ActivityIndicator color={theme.primary} size="small" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Submit Proof & Request</Text>
                  <Ionicons name="arrow-forward" size={20} color={theme.primary} style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Paystack Modal */}
          <Modal 
            isVisible={showPaystackModal} 
            onBackdropPress={() => setShowPaystackModal(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Pay with Paystack</Text>
              <Text style={[styles.modalText, { color: theme.textSecondary }]}>
                This is a demo popup. Integrate your Paystack payment here.
              </Text>
              {paystackLoading ? (
                <ActivityIndicator color={theme.accent} size="large" />
              ) : (
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.accent }]}
                  onPress={handlePaystack}
                  disabled={paystackLoading || isProcessingPaystack}
                  activeOpacity={paystackLoading || isProcessingPaystack ? 0.5 : 0.8}
                >
                  <Text style={[styles.modalButtonText, { color: theme.textContrast }]}>Simulate Paystack Payment</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowPaystackModal(false)}>
                <Text style={[styles.modalCancel, { color: theme.accent }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Modal>

          {/* Paystack WebView */}
          <Modal 
            isVisible={showPaystackWebView} 
            style={{ margin: 0 }}
            animationIn="slideInUp"
            animationOut="slideOutDown"
          >
            <View style={styles.webViewContainer}>
              <View style={styles.webViewHeader}>
                <TouchableOpacity
                  style={styles.webViewCloseButton}
                  onPress={() => setShowPaystackWebView(false)}
                >
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.webViewTitle, { color: theme.text }]}>Paystack Payment</Text>
                <View style={{ width: 40 }} />
              </View>
              <WebView
                source={{ uri: paystackUrl }}
                style={styles.webView}
                onNavigationStateChange={handleWebViewNavigationStateChange}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent
                  console.log('WebView error:', nativeEvent)
                  handlePaymentFailure("Failed to load payment page")
                }}
                onHttpError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent
                  console.log('WebView HTTP error:', nativeEvent)
                  handlePaymentFailure("Payment page error")
                }}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={styles.webViewLoading}>
                    <ActivityIndicator size="large" color={theme.accent} />
                    <Text style={[styles.webViewLoadingText, { color: theme.text }]}>
                      Loading Paystack...
                    </Text>
                  </View>
                )}
              />
              {/* Test buttons for development */}
              <View style={styles.testButtonContainer}>
                <TouchableOpacity
                  style={styles.testButton}
                  onPress={handlePaymentSuccess}
                >
                  <Text style={styles.testButtonText}>Test: Simulate Payment Success</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.testButton, { marginTop: 8, backgroundColor: theme.warning }]}
                  onPress={() => {
                    setAmount("100") // Set a small test amount
                    setFeedback("Amount set to ₦100 for testing")
                  }}
                >
                  <Text style={styles.testButtonText}>Set Test Amount (₦100)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
