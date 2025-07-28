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

import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import Modal from "react-native-modal"
import { useTheme } from "./ThemeContext"

const { width, height } = Dimensions.get("window")

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

  const handlePaystack = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount.")
      return
    }
    setPaystackLoading(true)
    setTimeout(async () => {
      setPaystackLoading(false)
      setShowPaystackModal(false)
      setFeedback("Paystack payment successful! Funding wallet...")

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error("You must be logged in to fund your wallet.")
        const enteredAmount = Number(amount) || 0
        const fee = processingFee
        const totalToPay = enteredAmount + fee
        const { error: txError } = await supabase.from("wallet_transactions").insert([
          {
            user_id: user.id,
            type: "fund",
            amount: enteredAmount,
            fee: fee,
            status: "completed",
            payment_method: "paystack",
            reference: "ps_ref_" + Date.now(),
            description: `Wallet funded via Paystack (fee: ₦${fee})`,
          },
        ])
        if (txError) throw txError

        const { data: profile } = await supabase.from("profiles").select("balance").eq("id", user.id).single()
        const newBalance = (profile?.balance || 0) + enteredAmount
        const { error: balanceError } = await supabase
          .from("profiles")
          .update({ balance: newBalance })
          .eq("id", user.id)
        if (balanceError) throw balanceError

        navigation.navigate("FundingResult", { 
          success: true,
          amount: enteredAmount,
          paymentMethod: "paystack"
        })
      } catch (e) {
        navigation.navigate("FundingResult", { 
          success: false,
          error: e.message || "Failed to fund wallet.",
          amount: enteredAmount
        })
      }
      setFeedback("")
    }, 2000)
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
    setLoading(true)
    setFeedback("Uploading proof and submitting request...")

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("You must be logged in to fund your wallet.")
      const enteredAmount = Number(amount) || 0
      const fee = processingFee
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
                  setFeedback("You selected Paystack. You will pay online and your wallet will be funded instantly.")
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
                    "You selected Manual Transfer. You must transfer to the admin account and upload proof. Your wallet will be funded after admin approval.",
                  )
                }}
              >
                <Ionicons
                  name="bank"
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
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={() => setShowPaystackModal(true)}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>Pay with Paystack</Text>
              <Ionicons name="arrow-forward" size={20} color={theme.primary} style={styles.buttonIcon} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleManualTransfer}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
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
          <Modal isVisible={showPaystackModal} onBackdropPress={() => setShowPaystackModal(false)}>
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
                >
                  <Text style={[styles.modalButtonText, { color: theme.textContrast }]}>Simulate Paystack Payment</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowPaystackModal(false)}>
                <Text style={[styles.modalCancel, { color: theme.accent }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
