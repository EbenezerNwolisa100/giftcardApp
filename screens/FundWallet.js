// import React, { useState, useEffect, useCallback } from "react"
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ActivityIndicator,
//   Alert,
//   StatusBar,
//   Dimensions,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   TextInput,
//   Image,
//   RefreshControl,
// } from "react-native"
// import { supabase } from "./supabaseClient" // Adjust path as needed
// import { useNavigation, useFocusEffect } from "@react-navigation/native"
// import { LinearGradient } from "expo-linear-gradient"
// import { Ionicons } from "@expo/vector-icons"
// import * as ImagePicker from "expo-image-picker"
// import Modal from "react-native-modal"
// import { useTheme } from "./ThemeContext" // Adjust path as needed

// const { width, height } = Dimensions.get("window")
// const HEADER_HEIGHT = 100 // Approximate height for the fixed header

// export default function FundWallet() {
//   const [amount, setAmount] = useState("")
//   const [paymentMethod, setPaymentMethod] = useState("paystack")
//   const [loading, setLoading] = useState(false)
//   const [paystackLoading, setPaystackLoading] = useState(false)
//   const [showPaystackModal, setShowPaystackModal] = useState(false)
//   const [bankDetails, setBankDetails] = useState(null)
//   const [bankDetailsLoading, setBankDetailsLoading] = useState(false)
//   const [proofImage, setProofImage] = useState(null)
//   const [feedback, setFeedback] = useState("")
//   const [processingFee, setProcessingFee] = useState(0)
//   const [refreshing, setRefreshing] = useState(false)

//   const navigation = useNavigation()
//   const { theme } = useTheme()

//   const fetchProcessingFee = useCallback(async () => {
//     const { data, error } = await supabase
//       .from("app_settings")
//       .select("value")
//       .eq("key", "processing_fee_flat")
//       .single()
//     if (data) setProcessingFee(Number(data.value))
//     if (error) console.log("Error fetching processing fee:", error)
//   }, [])

//   const fetchAdminBankDetails = useCallback(async () => {
//     setBankDetailsLoading(true)
//     const { data, error } = await supabase
//       .from("admin_bank_details")
//       .select("*")
//       .order("updated_at", { ascending: false })
//       .limit(1)
//       .single()
//     setBankDetails(data || null)
//     setBankDetailsLoading(false)
//     if (error) {
//       console.log("Error fetching admin bank details:", error)
//     }
//   }, [])

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true)
//     await Promise.all([fetchProcessingFee(), fetchAdminBankDetails()])
//     setRefreshing(false)
//   }, [fetchProcessingFee, fetchAdminBankDetails])

//   useEffect(() => {
//     fetchProcessingFee()
//   }, [fetchProcessingFee])

//   // Fetch admin bank details if manual transfer is selected
//   useFocusEffect(
//     React.useCallback(() => {
//       if (paymentMethod === "manual_transfer") {
//         fetchAdminBankDetails()
//       }
//     }, [paymentMethod, fetchAdminBankDetails]),
//   )

//   // Image picker for proof of payment
//   const pickImage = async () => {
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       quality: 0.7,
//     })
//     if (!result.canceled && result.assets && result.assets.length > 0) {
//       setProofImage(result.assets[0])
//     }
//   }

//   // Handle Paystack payment
//   const handlePaystack = async () => {
//     if (!amount || isNaN(amount) || Number(amount) <= 0) {
//       Alert.alert("Error", "Please enter a valid amount.")
//       return
//     }
//     setPaystackLoading(true)
//     // Simulate Paystack payment success after 2s
//     setTimeout(async () => {
//       setPaystackLoading(false)
//       setShowPaystackModal(false)
//       setFeedback("Paystack payment successful! Funding wallet...")

//       try {
//         const {
//           data: { user },
//         } = await supabase.auth.getUser()
//         if (!user) throw new Error("You must be logged in to fund your wallet.")
//         const enteredAmount = Number(amount) || 0
//         const fee = processingFee
//         const totalToPay = enteredAmount + fee
//         // Create wallet transaction
//         const { error: txError } = await supabase.from("wallet_transactions").insert([
//           {
//             user_id: user.id,
//             type: "fund",
//             amount: enteredAmount,
//             fee: fee,
//             status: "completed",
//             payment_method: "paystack",
//             reference: "ps_ref_" + Date.now(),
//             description: `Wallet funded via Paystack (fee: ₦${fee})`,
//           },
//         ])
//         if (txError) throw txError

//         // Update user balance
//         const { data: profile } = await supabase.from("profiles").select("balance").eq("id", user.id).single()
//         const newBalance = (profile?.balance || 0) + enteredAmount
//         const { error: balanceError } = await supabase
//           .from("profiles")
//           .update({ balance: newBalance })
//           .eq("id", user.id)
//         if (balanceError) throw balanceError

//         Alert.alert("Success", "Wallet funded successfully!", [{ text: "OK", onPress: () => navigation.goBack() }])
//       } catch (e) {
//         Alert.alert("Error", e.message || "Failed to fund wallet.")
//       }
//       setFeedback("")
//     }, 2000)
//   }

//   // Handle manual transfer
//   const handleManualTransfer = async () => {
//     if (!amount || isNaN(amount) || Number(amount) <= 0) {
//       Alert.alert("Error", "Please enter a valid amount.")
//       return
//     }
//     if (!proofImage) {
//       Alert.alert("Error", "Please upload proof of payment.")
//       return
//     }
//     setLoading(true)
//     setFeedback("Uploading proof and submitting request...")

//     try {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser()
//       if (!user) throw new Error("You must be logged in to fund your wallet.")
//       const enteredAmount = Number(amount) || 0
//       const fee = processingFee
//       const totalToPay = enteredAmount + fee
//       // Upload image to Supabase Storage
//       const ext = proofImage.uri.split(".").pop()
//       const fileName = `proofs/${user.id}_${Date.now()}.${ext}`
//       const response = await fetch(proofImage.uri)
//       const blob = await response.blob()
//       const { data: uploadData, error: uploadError } = await supabase.storage
//         .from("proofs")
//         .upload(fileName, blob, { contentType: proofImage.type || "image/jpeg" })

//       if (uploadError) throw uploadError

//       const {
//         data: { publicUrl },
//       } = supabase.storage.from("proofs").getPublicUrl(fileName)
//       // Create wallet transaction
//       const { error: txError } = await supabase.from("wallet_transactions").insert([
//         {
//           user_id: user.id,
//           type: "fund",
//           amount: enteredAmount,
//           fee: fee,
//           status: "pending",
//           payment_method: "manual_transfer",
//           proof_of_payment_url: publicUrl,
//           description: `Wallet funding via bank transfer (fee: ₦${fee})`,
//         },
//       ])
//       if (txError) throw txError

//       setLoading(false)
//       setFeedback("")
//       Alert.alert("Success", "Funding request submitted! Awaiting admin approval.", [
//         { text: "OK", onPress: () => navigation.goBack() },
//       ])
//     } catch (e) {
//       setLoading(false)
//       setFeedback("")
//       Alert.alert("Error", e.message || "Failed to submit funding request.")
//     }
//   }

//   return (
//     <View style={[styles.container, { backgroundColor: theme.background }]}>
//       <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.primary} />

//       {/* Fixed Header */}
//       <View style={[styles.fixedHeader, { backgroundColor: theme.card }]}>
//         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
//           <Ionicons name="arrow-back" size={24} color={theme.text} />
//         </TouchableOpacity>
//         <Text style={[styles.headerTitle, { color: theme.text }]}>Fund Wallet</Text>
//         <View style={styles.placeholder} />
//       </View>

//       <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
//         <ScrollView
//           contentContainerStyle={[
//             styles.scrollContainer,
//             { paddingTop: HEADER_HEIGHT + 20 }, // Adjust padding to clear fixed header
//           ]}
//           showsVerticalScrollIndicator={false}
//           keyboardShouldPersistTaps="handled"
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={onRefresh}
//               tintColor={theme.accent}
//               colors={[theme.accent]}
//               progressBackgroundColor={theme.surface}
//             />
//           }
//         >
//           {/* Amount Input */}
//           <View style={[styles.amountCard, { backgroundColor: theme.card }]}>
//             <Text style={[styles.amountLabel, { color: theme.text }]}>Amount to Fund (₦)</Text>
//             <TextInput
//               style={[
//                 styles.amountInput,
//                 {
//                   backgroundColor: theme.surface,
//                   color: theme.text,
//                   borderColor: theme.border,
//                 },
//               ]}
//               value={amount}
//               onChangeText={setAmount}
//               keyboardType="numeric"
//               placeholder="Enter amount"
//               placeholderTextColor={theme.textSecondary}
//             />
//           </View>

//           {/* Processing Fee Display */}
//           <View style={{ marginBottom: 16 }}>
//             <Text style={{ color: theme.text }}>Processing Fee: ₦{processingFee.toLocaleString()}</Text>
//             <Text style={{ color: theme.text, fontWeight: "bold" }}>
//               Total to Pay: ₦{(Number(amount || 0) + processingFee).toLocaleString()}
//             </Text>
//           </View>

//           {/* Payment Method Selector */}
//           <View style={styles.paymentSection}>
//             <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Payment Method</Text>
//             <View style={styles.paymentMethods}>
//               <TouchableOpacity
//                 style={[
//                   styles.methodButton,
//                   {
//                     backgroundColor: theme.card,
//                     borderColor: paymentMethod === "paystack" ? theme.accent : theme.border,
//                   },
//                 ]}
//                 onPress={() => {
//                   setPaymentMethod("paystack")
//                   setFeedback("You selected Paystack. You will pay online and your wallet will be funded instantly.")
//                 }}
//               >
//                 <Ionicons name="card" size={24} color={paymentMethod === "paystack" ? theme.accent : theme.text} />
//                 <Text
//                   style={[
//                     styles.methodButtonText,
//                     {
//                       color: paymentMethod === "paystack" ? theme.accent : theme.text,
//                     },
//                   ]}
//                 >
//                   Paystack
//                 </Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={[
//                   styles.methodButton,
//                   {
//                     backgroundColor: theme.card,
//                     borderColor: paymentMethod === "manual_transfer" ? theme.accent : theme.border,
//                   },
//                 ]}
//                 onPress={() => {
//                   setPaymentMethod("manual_transfer")
//                   setFeedback(
//                     "You selected Manual Transfer. You must transfer to the admin account and upload proof. Your wallet will be funded after admin approval.",
//                   )
//                 }}
//               >
//                 <Ionicons
//                   name="bank"
//                   size={24}
//                   color={paymentMethod === "manual_transfer" ? theme.accent : theme.text}
//                 />
//                 <Text
//                   style={[
//                     styles.methodButtonText,
//                     {
//                       color: paymentMethod === "manual_transfer" ? theme.accent : theme.text,
//                     },
//                   ]}
//                 >
//                   Bank Transfer
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </View>

//           {/* Feedback */}
//           {feedback ? (
//             <View style={[styles.feedbackCard, { backgroundColor: theme.card }]}>
//               <Text style={[styles.feedbackText, { color: theme.text }]}>{feedback}</Text>
//             </View>
//           ) : null}

//           {/* Manual Transfer Details */}
//           {paymentMethod === "manual_transfer" && (
//             <>
//               {bankDetailsLoading ? (
//                 <Text style={{ color: theme.text, textAlign: "center", marginBottom: 16 }}>
//                   Loading admin bank details...
//                 </Text>
//               ) : bankDetails ? (
//                 <View style={[styles.bankCard, { backgroundColor: theme.card }]}>
//                   <Text style={[styles.bankTitle, { color: theme.text }]}>Transfer to:</Text>
//                   <View style={styles.bankDetails}>
//                     <Text style={[styles.bankDetail, { color: theme.text }]}>Bank: {bankDetails.bank_name}</Text>
//                     <Text style={[styles.bankDetail, { color: theme.text }]}>
//                       Account Name: {bankDetails.account_name}
//                     </Text>
//                     <Text style={[styles.bankDetail, { color: theme.text }]}>
//                       Account Number: {bankDetails.account_number}
//                     </Text>
//                   </View>
//                 </View>
//               ) : (
//                 <Text
//                   style={{
//                     color: theme.error,
//                     marginBottom: 16,
//                     fontWeight: "bold",
//                     textAlign: "center",
//                   }}
//                 >
//                   Admin bank details not available. Please contact support.
//                 </Text>
//               )}
//               {/* Prominent upload proof area */}
//               <View
//                 style={[
//                   styles.bankCard,
//                   {
//                     backgroundColor: theme.card,
//                     borderWidth: 2,
//                     borderColor: theme.accent,
//                   },
//                 ]}
//               >
//                 <TouchableOpacity
//                   style={[
//                     styles.uploadButton,
//                     {
//                       borderWidth: 2,
//                       borderColor: theme.accent,
//                       backgroundColor: theme.surface,
//                     },
//                   ]}
//                   onPress={pickImage}
//                 >
//                   <LinearGradient colors={[theme.accent, theme.secondary]} style={styles.uploadGradient}>
//                     <Ionicons name="camera" size={24} color={theme.textContrast} />
//                     <Text style={[styles.uploadText, { fontSize: 16, color: theme.textContrast }]}>
//                       {proofImage ? "Change Proof of Payment" : "Tap to Upload Proof of Payment"}
//                     </Text>
//                   </LinearGradient>
//                 </TouchableOpacity>
//                 {proofImage && (
//                   <View style={styles.imagePreview}>
//                     <Text style={[styles.previewText, { color: theme.textSecondary }]}>Proof of Payment:</Text>
//                     <Image source={{ uri: proofImage.uri }} style={styles.previewImage} />
//                   </View>
//                 )}
//               </View>
//             </>
//           )}

//           {/* Submit Button */}
//           {paymentMethod === "paystack" ? (
//             <TouchableOpacity
//               style={[styles.submitButton, loading && styles.submitButtonDisabled, { shadowColor: theme.accent }]}
//               onPress={() => setShowPaystackModal(true)}
//               disabled={loading}
//               activeOpacity={0.8}
//             >
//               <LinearGradient colors={[theme.accent, theme.secondary]} style={styles.buttonGradient}>
//                 <Text style={[styles.submitButtonText, { color: theme.textContrast }]}>Pay with Paystack</Text>
//                 <Ionicons name="arrow-forward" size={20} color={theme.textContrast} style={styles.buttonIcon} />
//               </LinearGradient>
//             </TouchableOpacity>
//           ) : (
//             <TouchableOpacity
//               style={[styles.submitButton, loading && styles.submitButtonDisabled, { shadowColor: theme.accent }]}
//               onPress={handleManualTransfer}
//               disabled={loading}
//               activeOpacity={0.8}
//             >
//               <LinearGradient colors={[theme.accent, theme.secondary]} style={styles.buttonGradient}>
//                 {loading ? (
//                   <ActivityIndicator color={theme.textContrast} size="small" />
//                 ) : (
//                   <>
//                     <Text style={[styles.submitButtonText, { color: theme.textContrast }]}>Submit Proof & Request</Text>
//                     <Ionicons name="arrow-forward" size={20} color={theme.textContrast} style={styles.buttonIcon} />
//                   </>
//                 )}
//               </LinearGradient>
//             </TouchableOpacity>
//           )}

//           {/* Paystack Modal */}
//           <Modal isVisible={showPaystackModal} onBackdropPress={() => setShowPaystackModal(false)}>
//             <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
//               <Text style={[styles.modalTitle, { color: theme.text }]}>Pay with Paystack</Text>
//               <Text style={[styles.modalText, { color: theme.textSecondary }]}>
//                 This is a demo popup. Integrate your Paystack payment here.
//               </Text>
//               {paystackLoading ? (
//                 <ActivityIndicator color={theme.accent} size="large" />
//               ) : (
//                 <TouchableOpacity
//                   style={[styles.modalButton, { backgroundColor: theme.accent }]}
//                   onPress={handlePaystack}
//                 >
//                   <Text style={[styles.modalButtonText, { color: theme.textContrast }]}>Simulate Paystack Payment</Text>
//                 </TouchableOpacity>
//               )}
//               <TouchableOpacity onPress={() => setShowPaystackModal(false)}>
//                 <Text style={[styles.modalCancel, { color: theme.accent }]}>Cancel</Text>
//               </TouchableOpacity>
//             </View>
//           </Modal>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   fixedHeader: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     zIndex: 10,
//     height: HEADER_HEIGHT,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingHorizontal: 20,
//     paddingTop: StatusBar.currentHeight || 40, // Dynamic padding for status bar
//     borderBottomWidth: 1,
//     borderBottomColor: "rgba(0,0,0,0.1)", // Will be themed
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   backButton: {
//     position: "absolute",
//     left: 20,
//     top: StatusBar.currentHeight || 40, // Align with header content
//     paddingVertical: 8,
//     zIndex: 11,
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     flex: 1,
//     textAlign: "center",
//   },
//   placeholder: {
//     width: 24, // To balance the back button
//   },
//   keyboardAvoidingView: {
//     flex: 1,
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     paddingHorizontal: 20,
//     paddingBottom: 32,
//   },
//   amountCard: {
//     borderRadius: 16,
//     padding: 20,
//     marginBottom: 24,
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   amountLabel: {
//     fontSize: 16,
//     fontWeight: "bold",
//     marginBottom: 12,
//   },
//   amountInput: {
//     fontSize: 18,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 8,
//     borderWidth: 1,
//   },
//   paymentSection: {
//     marginBottom: 24,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: "bold",
//     marginBottom: 12,
//   },
//   paymentMethods: {
//     flexDirection: "row",
//     gap: 12,
//   },
//   methodButton: {
//     flex: 1,
//     borderRadius: 12,
//     padding: 16,
//     alignItems: "center",
//     borderWidth: 2,
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   methodButtonText: {
//     fontSize: 14,
//     fontWeight: "bold",
//     marginTop: 8,
//   },
//   feedbackCard: {
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 16,
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   feedbackText: {
//     fontSize: 14,
//     lineHeight: 20,
//   },
//   bankCard: {
//     borderRadius: 16,
//     padding: 20,
//     marginBottom: 24,
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   bankTitle: {
//     fontSize: 16,
//     fontWeight: "bold",
//     marginBottom: 12,
//   },
//   bankDetails: {
//     marginBottom: 16,
//   },
//   bankDetail: {
//     fontSize: 14,
//     marginBottom: 4,
//   },
//   uploadButton: {
//     borderRadius: 8,
//     overflow: "hidden",
//     marginBottom: 12,
//   },
//   uploadGradient: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//   },
//   uploadText: {
//     fontWeight: "bold",
//     marginLeft: 8,
//   },
//   imagePreview: {
//     marginTop: 12,
//   },
//   previewText: {
//     fontSize: 14,
//     marginBottom: 8,
//   },
//   previewImage: {
//     width: 120,
//     height: 120,
//     borderRadius: 8,
//   },
//   submitButton: {
//     borderRadius: 16,
//     overflow: "hidden",
//     marginTop: 8,
//     elevation: 8,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//   },
//   submitButtonDisabled: {
//     opacity: 0.7,
//   },
//   buttonGradient: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 18,
//     paddingHorizontal: 32,
//   },
//   submitButtonText: {
//     fontSize: 18,
//     fontWeight: "bold",
//     marginRight: 8,
//   },
//   buttonIcon: {
//     marginLeft: 4,
//   },
//   modalContent: {
//     borderRadius: 16,
//     padding: 24,
//     alignItems: "center",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   modalTitle: {
//     fontWeight: "bold",
//     fontSize: 18,
//     marginBottom: 12,
//   },
//   modalText: {
//     marginBottom: 16,
//     textAlign: "center",
//   },
//   modalButton: {
//     padding: 12,
//     borderRadius: 8,
//     marginBottom: 8,
//   },
//   modalButtonText: {
//     fontWeight: "bold",
//   },
//   modalCancel: {
//     marginTop: 8,
//   },
// })






"use client"

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
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import Modal from "react-native-modal"
import { useTheme } from "./ThemeContext"

const { width, height } = Dimensions.get("window")
const HEADER_HEIGHT_FUND = Platform.OS === "android" ? 90 : 100 // Approximate height for the fixed header

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

        Alert.alert("Success", "Wallet funded successfully!", [{ text: "OK", onPress: () => navigation.goBack() }])
      } catch (e) {
        Alert.alert("Error", e.message || "Failed to fund wallet.")
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
      Alert.alert("Success", "Funding request submitted! Awaiting admin approval.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ])
    } catch (e) {
      setLoading(false)
      setFeedback("")
      Alert.alert("Error", e.message || "Failed to submit funding request.")
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    fixedHeader: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      height: HEADER_HEIGHT_FUND,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 50,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    backButton: {
      position: "absolute",
      left: 20,
      top: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 50,
      paddingVertical: 8,
      zIndex: 11,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      flex: 1,
      textAlign: "center",
      color: theme.textContrast,
    },
    placeholder: {
      width: 24,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingBottom: Platform.OS === "ios" ? 85 + 20 : 70 + 20,
    },
    amountCard: {
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      backgroundColor: theme.card,
      marginTop: HEADER_HEIGHT_FUND + 20, // Offset for fixed header
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
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
    },
    paymentSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 12,
      color: theme.text,
    },
    paymentMethods: {
      flexDirection: "row",
      gap: 12,
    },
    methodButton: {
      flex: 1,
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      borderWidth: 2,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    methodButtonText: {
      fontSize: 14,
      fontWeight: "bold",
      marginTop: 8,
    },
    feedbackCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      backgroundColor: theme.card,
    },
    feedbackText: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.text,
    },
    bankCard: {
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      backgroundColor: theme.card,
    },
    bankTitle: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 12,
      color: theme.text,
    },
    bankDetails: {
      marginBottom: 16,
    },
    bankDetail: {
      fontSize: 14,
      marginBottom: 4,
    },
    uploadButton: {
      borderRadius: 8,
      overflow: "hidden",
      marginBottom: 12,
    },
    uploadGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    uploadText: {
      fontWeight: "bold",
      marginLeft: 8,
    },
    imagePreview: {
      marginTop: 12,
    },
    previewText: {
      fontSize: 14,
      marginBottom: 8,
    },
    previewImage: {
      width: 120,
      height: 120,
      borderRadius: 8,
    },
    submitButton: {
      borderRadius: 16,
      overflow: "hidden",
      marginTop: 8,
      elevation: 8,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    submitButtonDisabled: {
      opacity: 0.7,
    },
    buttonGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 18,
      paddingHorizontal: 32,
    },
    submitButtonText: {
      fontSize: 18,
      fontWeight: "bold",
      marginRight: 8,
    },
    buttonIcon: {
      marginLeft: 4,
    },
    modalContent: {
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    modalTitle: {
      fontWeight: "bold",
      fontSize: 18,
      marginBottom: 12,
    },
    modalText: {
      marginBottom: 16,
      textAlign: "center",
    },
    modalButton: {
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    modalButtonText: {
      fontWeight: "bold",
    },
    modalCancel: {
      marginTop: 8,
    },
    // Skeleton Styles
    skeletonContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    skeletonFixedHeader: {
      height: HEADER_HEIGHT_FUND,
      backgroundColor: theme.primary,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 10,
    },
    skeletonAmountCard: {
      height: 150, // Approximate height of amount card
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginHorizontal: 20,
      marginTop: 20,
      marginBottom: 24,
    },
    skeletonPaymentSection: {
      height: 120, // Approximate height of payment method section
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginHorizontal: 20,
      marginBottom: 24,
    },
    skeletonFeedbackCard: {
      height: 80, // Approximate height of feedback card
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 12,
      marginHorizontal: 20,
      marginBottom: 16,
    },
    skeletonBankCard: {
      height: 200, // Approximate height of bank details card
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginHorizontal: 20,
      marginBottom: 24,
    },
    skeletonSubmitButton: {
      height: 60,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginHorizontal: 20,
      marginBottom: 24,
    },
  })

  // FundWallet Skeleton Component
  const FundWalletSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />
      {/* Fixed Header Skeleton */}
      <View style={styles.skeletonFixedHeader}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 50, paddingBottom: 20, width: '100%' }}>
          <View style={{ width: 24, height: 24, backgroundColor: theme.surfaceSecondary, borderRadius: 12 }} /> {/* Back button placeholder */}
          <View style={[styles.headerTitle, { backgroundColor: theme.surfaceSecondary, width: 150, height: 24 }]} /> {/* Title placeholder */}
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingTop: HEADER_HEIGHT_FUND + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Input Skeleton */}
        <View style={styles.skeletonAmountCard} />

        {/* Payment Method Selector Skeleton */}
        <View style={styles.skeletonPaymentSection} />

        {/* Feedback Skeleton (optional) */}
        {/* <View style={styles.skeletonFeedbackCard} /> */}

        {/* Manual Transfer Details Skeleton (optional) */}
        {/* <View style={styles.skeletonBankCard} /> */}

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
      <View style={[styles.fixedHeader, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.textContrast} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fund Wallet</Text>
        <View style={styles.placeholder} />
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
              style={[
                styles.amountInput,
                {
                  backgroundColor: theme.surfaceSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="Enter amount"
              placeholderTextColor={theme.textMuted}
            />
          </View>

          {/* Processing Fee Display */}
          <View style={{ marginBottom: 16, paddingHorizontal: 5 }}>
            <Text style={{ color: theme.text }}>Processing Fee: ₦{processingFee.toLocaleString()}</Text>
            <Text style={{ color: theme.text, fontWeight: "bold" }}>
              Total to Pay: ₦{(Number(amount || 0) + processingFee).toLocaleString()}
            </Text>
          </View>

          {/* Payment Method Selector */}
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Select Payment Method</Text>
            <View style={styles.paymentMethods}>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  {
                    backgroundColor: theme.card,
                    borderColor: paymentMethod === "paystack" ? theme.accent : theme.border,
                  },
                ]}
                onPress={() => {
                  setPaymentMethod("paystack")
                  setFeedback("You selected Paystack. You will pay online and your wallet will be funded instantly.")
                }}
              >
                <Ionicons name="card" size={24} color={paymentMethod === "paystack" ? theme.accent : theme.text} />
                <Text
                  style={[
                    styles.methodButtonText,
                    {
                      color: paymentMethod === "paystack" ? theme.accent : theme.text,
                    },
                  ]}
                >
                  Paystack
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodButton,
                  {
                    backgroundColor: theme.card,
                    borderColor: paymentMethod === "manual_transfer" ? theme.accent : theme.border,
                  },
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
                  color={paymentMethod === "manual_transfer" ? theme.accent : theme.text}
                />
                <Text
                  style={[
                    styles.methodButtonText,
                    {
                      color: paymentMethod === "manual_transfer" ? theme.accent : theme.text,
                    },
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
                    <Text style={[styles.bankDetail, { color: theme.text }]}>Bank: {bankDetails.bank_name}</Text>
                    <Text style={[styles.bankDetail, { color: theme.text }]}>
                      Account Name: {bankDetails.account_name}
                    </Text>
                    <Text style={[styles.bankDetail, { color: theme.text }]}>
                      Account Number: {bankDetails.account_number}
                    </Text>
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
                  <LinearGradient colors={[theme.accent, theme.secondary]} style={styles.uploadGradient}>
                    <Ionicons name="camera" size={24} color={theme.textContrast} />
                    <Text style={[styles.uploadText, { fontSize: 16, color: theme.textContrast }]}>
                      {proofImage ? "Change Proof of Payment" : "Tap to Upload Proof of Payment"}
                    </Text>
                  </LinearGradient>
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
              style={[styles.submitButton, loading && styles.submitButtonDisabled, { shadowColor: theme.accent }]}
              onPress={() => setShowPaystackModal(true)}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient colors={[theme.accent, theme.secondary]} style={styles.buttonGradient}>
                <Text style={styles.submitButtonText}>Pay with Paystack</Text>
                <Ionicons name="arrow-forward" size={20} color={theme.textContrast} style={styles.buttonIcon} />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled, { shadowColor: theme.accent }]}
              onPress={handleManualTransfer}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient colors={[theme.accent, theme.secondary]} style={styles.buttonGradient}>
                {loading ? (
                  <ActivityIndicator color={theme.textContrast} size="small" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Submit Proof & Request</Text>
                    <Ionicons name="arrow-forward" size={20} color={theme.textContrast} style={styles.buttonIcon} />
                  </>
                )}
              </LinearGradient>
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
