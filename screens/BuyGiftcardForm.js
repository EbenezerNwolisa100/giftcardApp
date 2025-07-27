// import React, { useState } from "react"
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Image,
//   ActivityIndicator,
//   Alert,
//   StatusBar,
//   Dimensions,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
// } from "react-native"
// import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native"
// import { supabase } from "./supabaseClient"
// import { LinearGradient } from "expo-linear-gradient"
// import { Ionicons } from "@expo/vector-icons"
// import * as ImagePicker from "expo-image-picker"
// import Modal from "react-native-modal"

// const { width, height } = Dimensions.get("window")

// // Update the email sending function to use your PHP endpoint
// const PHP_EMAIL_ENDPOINT = 'https://gibsoninterlining.com.ng/send_email.php'; // <-- Replace with your actual URL

// async function sendPurchaseEmails({ userEmail, userName, brand, variant, quantity, totalAmount }) {
//   const adminEmail = 'ebenezernwolisa100@gmail.com';
//   const subject = `Gift Card Purchase Confirmation`;
//   const userBody = `Dear ${userName || 'User'},\n\nYour purchase of ${quantity} ${brand.name} (${variant.name} - $${variant.value}) gift card(s) was successful.\nTotal: ₦${totalAmount.toLocaleString()}\n\nThank you for using our platform!`;
//   const adminBody = `Admin Notification:\n\nA user (${userName || userEmail}) just purchased ${quantity} ${brand.name} (${variant.name} - $${variant.value}) gift card(s).\nTotal: ₦${totalAmount.toLocaleString()}`;

//   try {
//     // Send to user
//     await fetch(PHP_EMAIL_ENDPOINT, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         to: userEmail,
//         subject,
//         body: userBody,
//       }),
//     });
//     // Send to admin
//     await fetch(PHP_EMAIL_ENDPOINT, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         to: adminEmail,
//         subject: 'New Gift Card Purchase',
//         body: adminBody,
//       }),
//     });
//   } catch (e) {
//     console.log('Failed to send email:', e);
//   }
// }

// export default function BuyGiftcardForm() {
//   const { brand, variant, quantity } = useRoute().params // 'brand' is now from giftcards_buy_brands, 'variant' includes name, rate, value
//   const navigation = useNavigation()
//   const [loading, setLoading] = useState(false)
//   const [userBalance, setUserBalance] = useState(0)

//   // Calculate total based on selected variant value and quantity
//   const calculateTotal = () => {
//     return variant.value * variant.rate * quantity
//   }

//   // Fetch user balance and admin bank details
//   useFocusEffect(
//     React.useCallback(() => {
//       ;(async () => {
//         const {
//           data: { user },
//         } = await supabase.auth.getUser()
//         if (user) {
//           // Get user balance
//           const { data: profile } = await supabase.from("profiles").select("balance").eq("id", user.id).single()
//           setUserBalance(profile?.balance || 0)
//         }
//       })()
//     }, []),
//   )

//   // Handle wallet payment
//   const handleWalletPayment = async () => {
//     const totalAmount = calculateTotal()

//     if (totalAmount > userBalance) {
//       Alert.alert("Insufficient Balance", "You don't have enough funds in your wallet. Please fund your wallet first.")
//       return
//     }

//     setLoading(true)

//     try {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser()
//       if (!user) throw new Error("You must be logged in to buy a gift card.")

//       // Deduct from wallet
//       const newBalance = userBalance - totalAmount
//       const { error: balanceError } = await supabase.from("profiles").update({ balance: newBalance }).eq("id", user.id)

//       if (balanceError) throw balanceError

//       // Create wallet transaction
//       const { error: walletTxError } = await supabase.from("wallet_transactions").insert([
//         {
//           user_id: user.id,
//           type: "purchase",
//           amount: totalAmount,
//           status: "completed",
//           payment_method: "wallet",
//           description: `Gift card purchase: ${brand.name} - ${variant.name} - $${variant.value} x${quantity}`,
//         },
//       ])

//       if (walletTxError) throw walletTxError

//       await completePurchase("wallet", { status: "completed" })
//     } catch (e) {
//       setLoading(false)
//       Alert.alert("Error", e.message || "Failed to process wallet payment.")
//     }
//   }

//   // Complete the purchase by assigning cards and creating transaction
//   const completePurchase = async (paymentMethod, additionalData = {}) => {
//     try {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser()
//       if (!user) throw new Error("You must be logged in.")

//       const totalAmount = calculateTotal()

//       // Get available cards for this specific variant and value
//       const { data: cardsToAssign, error: cardsError } = await supabase
//         .from("giftcards_buy")
//         .select("id, code")
//         .eq("buy_brand_id", brand.id) // Use buy_brand_id
//         .eq("variant_name", variant.name)
//         .eq("value", variant.value)
//         .eq("rate", variant.rate) // Ensure rate matches too
//         .eq("sold", false)
//         .is("assigned_to", null)
//         .limit(quantity)

//       if (cardsError) throw cardsError

//       if (!cardsToAssign || cardsToAssign.length < quantity) {
//         throw new Error(`Not enough cards available. Only ${cardsToAssign?.length || 0} cards available.`)
//       }

//       // Create transaction first
//       const { data: transactionData, error: transactionError } = await supabase
//         .from("giftcard_transactions")
//         .insert([
//           {
//             user_id: user.id,
//             type: "buy",
//             buy_brand_id: brand.id, // Link to the new buy_brand_id
//             variant_name: variant.name,
//             amount: variant.value * quantity, // Total USD value
//             rate: variant.rate,
//             total: totalAmount,
//             payment_method: paymentMethod,
//             quantity: quantity,
//             card_codes: cardsToAssign.map((c) => c.code),
//             image_url: brand.image_url, // Use brand image for transaction record
//             ...additionalData,
//           },
//         ])
//         .select()
//         .single()

//       if (transactionError) throw transactionError

//       // Assign cards to user
//       const { error: assignError } = await supabase
//         .from("giftcards_buy")
//         .update({
//           sold: true,
//           assigned_to: user.id,
//           assigned_at: new Date().toISOString(),
//           purchase_transaction_id: transactionData.id,
//         })
//         .in(
//           "id",
//           cardsToAssign.map((c) => c.id),
//         )

//       if (assignError) throw assignError

//       setLoading(false)

//       // Fetch user email and name
//       const {
//         data: { user: currentUser },
//       } = await supabase.auth.getUser();
//       let userEmail = '';
//       let userName = '';
//       if (currentUser) {
//         const { data: profile } = await supabase.from('profiles').select('email, full_name').eq('id', currentUser.id).single();
//         userEmail = profile?.email || '';
//         userName = profile?.full_name || '';
//       }
//       await sendPurchaseEmails({
//         userEmail,
//         userName,
//         brand,
//         variant,
//         quantity,
//         totalAmount,
//       });

//       const statusMessage =
//         additionalData.status === "pending"
//           ? "Your order has been placed and is awaiting admin approval!"
//           : "Gift card purchased successfully!"

//       Alert.alert("Success", statusMessage, [{ text: "OK", onPress: () => navigation.goBack() }])
//     } catch (e) {
//       setLoading(false)
//       Alert.alert("Error", e.message || "Failed to complete purchase.")
//     }
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#0E2148" />
//       <LinearGradient colors={["#0E2148", "#483AA0"]} style={styles.backgroundGradient} />
//       <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
//         <ScrollView
//           contentContainerStyle={styles.scrollContainer}
//           showsVerticalScrollIndicator={false}
//           keyboardShouldPersistTaps="handled"
//         >
//           {/* Header */}
//           <View style={styles.header}>
//             <TouchableOpacity
//               onPress={() => {
//                 if (navigation.canGoBack()) {
//                   navigation.goBack()
//                 } else {
//                   navigation.navigate("BuyGiftcard")
//                 }
//               }}
//               style={styles.backButton}
//             >
//               <Ionicons name="arrow-back" size={24} color="#fff" />
//             </TouchableOpacity>
//             <Text style={styles.headerTitle}>Complete Purchase</Text>
//             <View style={styles.placeholder} />
//           </View>

//           {/* Brand & Variant Info */}
//           <View style={styles.brandCard}>
//             <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.brandGradient}>
//               <View style={styles.brandImageContainer}>
//                 {brand.image_url ? (
//                   <Image source={{ uri: brand.image_url }} style={styles.brandImage} resizeMode="contain" />
//                 ) : (
//                   <View style={styles.brandImagePlaceholder}>
//                     <Text style={styles.brandImagePlaceholderText}>{brand.name[0]}</Text>
//                   </View>
//                 )}
//               </View>
//               <View style={styles.brandInfo}>
//                 <Text style={styles.brandName}>{brand.name}</Text>
//                 <Text style={styles.variantName}>
//                   {variant.name} - ${variant.value}
//                 </Text>
//                 <Text style={styles.rateText}>₦{variant.rate} per $1</Text>
//               </View>
//             </LinearGradient>
//           </View>

//           {/* Purchase Summary */}
//           <View style={styles.summaryContainer}>
//             <Text style={styles.sectionTitle}>Purchase Summary</Text>
//             <View style={styles.summaryCard}>
//               <View style={styles.summaryRow}>
//                 <Text style={styles.summaryLabel}>Card Value:</Text>
//                 <Text style={styles.summaryValue}>${variant.value}</Text>
//               </View>
//               <View style={styles.summaryRow}>
//                 <Text style={styles.summaryLabel}>Quantity:</Text>
//                 <Text style={styles.summaryValue}>{quantity}</Text>
//               </View>
//               <View style={styles.summaryRow}>
//                 <Text style={styles.summaryLabel}>Rate:</Text>
//                 <Text style={styles.summaryValue}>₦{variant.rate}</Text>
//               </View>
//               <View style={[styles.summaryRow, styles.totalRow]}>
//                 <Text style={styles.totalLabel}>Total Amount:</Text>
//                 <Text style={styles.totalValue}>₦{calculateTotal().toLocaleString()}</Text>
//               </View>
//             </View>
//           </View>

//           {/* Wallet Balance Display */}
//             <View style={styles.walletContainer}>
//               <Text style={styles.walletTitle}>Wallet Balance</Text>
//               <Text style={styles.walletBalance}>₦{userBalance.toLocaleString()}</Text>
//               <Text style={styles.walletStatus}>
//                 {calculateTotal() > userBalance ? "Insufficient balance" : "Sufficient balance"}
//               </Text>
//             </View>

//           {/* If balance is sufficient, show purchase button. If not, show fund wallet button */}
//           {variant && quantity > 0 && quantity <= variant.available_count && (
//             calculateTotal() <= userBalance ? (
//             <TouchableOpacity
//               style={[styles.purchaseButton, loading && styles.purchaseButtonDisabled]}
//                 onPress={handleWalletPayment}
//                 disabled={loading}
//               activeOpacity={0.8}
//             >
//               <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.buttonGradient}>
//                 {loading ? (
//                   <ActivityIndicator color="#fff" size="small" />
//                 ) : (
//                   <>
//                       <Text style={styles.purchaseButtonText}>Pay with Wallet</Text>
//                     <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
//                   </>
//                 )}
//               </LinearGradient>
//             </TouchableOpacity>
//             ) : (
//               <TouchableOpacity
//                 style={[styles.purchaseButton, styles.fundWalletButton]}
//                 onPress={() => navigation.navigate("BankDetails")}
//                 activeOpacity={0.8}
//               >
//                 <LinearGradient colors={["#E3D095", "#7965C1"]} style={styles.buttonGradient}>
//                   <Text style={[styles.purchaseButtonText, { color: "#483AA0" }]}>Fund Wallet</Text>
//                   <Ionicons name="wallet" size={20} color="#483AA0" style={styles.buttonIcon} />
//                 </LinearGradient>
//               </TouchableOpacity>
//             )
//           )}

//           {/* Availability Warning */}
//           {variant && quantity > variant.available_count && (
//             <View style={styles.warningContainer}>
//               <Ionicons name="warning" size={20} color="#e17055" />
//               <Text style={styles.warningText}>
//                 Only {variant.available_count} cards available for {variant.name} - ${variant.value}. Please reduce
//                 quantity.
//               </Text>
//             </View>
//           )}
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#0E2148",
//   },
//   backgroundGradient: {
//     position: "absolute",
//     left: 0,
//     right: 0,
//     top: 0,
//     height: height,
//   },
//   keyboardAvoidingView: {
//     flex: 1,
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     paddingHorizontal: 20,
//     paddingBottom: 32,
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingTop: 40,
//     marginBottom: 32,
//   },
//   backButton: {
//     paddingVertical: 8,
//   },
//   headerTitle: {
//     color: "#fff",
//     fontSize: 20,
//     fontWeight: "bold",
//   },
//   placeholder: {
//     width: 40,
//   },
//   brandCard: {
//     borderRadius: 20,
//     overflow: "hidden",
//     marginBottom: 24,
//     elevation: 8,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//   },
//   brandGradient: {
//     flexDirection: "row",
//     alignItems: "center",
//     padding: 24,
//   },
//   brandImageContainer: {
//     width: 60,
//     height: 60,
//     borderRadius: 12,
//     backgroundColor: "#fff",
//     justifyContent: "center",
//     alignItems: "center",
//     marginRight: 16,
//   },
//   brandImage: {
//     width: 40,
//     height: 40,
//   },
//   brandImagePlaceholder: {
//     width: 40,
//     height: 40,
//     borderRadius: 8,
//     backgroundColor: "#0E2148",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   brandImagePlaceholderText: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//   },
//   brandInfo: {
//     flex: 1,
//   },
//   brandName: {
//     color: "#fff",
//     fontSize: 20,
//     fontWeight: "bold",
//     marginBottom: 4,
//   },
//   variantName: {
//     color: "#E3D095",
//     fontSize: 16,
//     fontWeight: "600",
//     marginBottom: 4,
//   },
//   rateText: {
//     color: "#E3D095",
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   selectionContainer: {
//     marginBottom: 24,
//   },
//   sectionTitle: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//     marginBottom: 16,
//   },
//   valueContainer: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 12,
//     marginBottom: 12,
//   },
//   valueChip: {
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 20,
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderWidth: 2,
//     borderColor: "rgba(255,255,255,0.2)",
//   },
//   valueChipSelected: {
//     backgroundColor: "#7965C1",
//     borderColor: "#7965C1",
//   },
//   valueText: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   valueTextSelected: {
//     color: "#fff",
//     fontWeight: "bold",
//   },
//   availabilityText: {
//     color: "#00b894",
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   summaryContainer: {
//     marginBottom: 24,
//   },
//   summaryCard: {
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 16,
//     padding: 20,
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.2)",
//   },
//   summaryRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   summaryLabel: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 16,
//   },
//   summaryValue: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   totalRow: {
//     borderTopWidth: 1,
//     borderTopColor: "rgba(255,255,255,0.2)",
//     paddingTop: 16,
//     marginTop: 8,
//     marginBottom: 0,
//   },
//   totalLabel: {
//     color: "#E3D095",
//     fontSize: 18,
//     fontWeight: "bold",
//   },
//   totalValue: {
//     color: "#E3D095",
//     fontSize: 20,
//     fontWeight: "bold",
//   },
//   paymentContainer: {
//     marginBottom: 24,
//   },
//   paymentMethods: {
//     flexDirection: "row",
//     gap: 12,
//   },
//   methodButton: {
//     flex: 1,
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 12,
//     padding: 16,
//     alignItems: "center",
//     borderWidth: 2,
//     borderColor: "rgba(255,255,255,0.2)",
//   },
//   methodButtonActive: {
//     backgroundColor: "#7965C1",
//     borderColor: "#7965C1",
//   },
//   methodText: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 14,
//     fontWeight: "600",
//     marginTop: 8,
//   },
//   methodTextActive: {
//     color: "#fff",
//     fontWeight: "bold",
//   },
//   walletContainer: {
//     backgroundColor: "rgba(0, 184, 148, 0.1)",
//     borderRadius: 16,
//     padding: 20,
//     marginBottom: 24,
//     borderWidth: 1,
//     borderColor: "rgba(0, 184, 148, 0.3)",
//     alignItems: "center",
//   },
//   walletTitle: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//     marginBottom: 8,
//   },
//   walletBalance: {
//     color: "#00b894",
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 4,
//   },
//   walletStatus: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 14,
//   },
//   feedbackContainer: {
//     backgroundColor: "rgba(227, 208, 149, 0.1)",
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 24,
//     borderWidth: 1,
//     borderColor: "rgba(227, 208, 149, 0.3)",
//   },
//   feedbackText: {
//     color: "#E3D095",
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   bankDetailsContainer: {
//     marginBottom: 24,
//   },
//   bankCard: {
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 16,
//     padding: 20,
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.2)",
//   },
//   bankLabel: {
//     color: "#fff",
//     fontSize: 16,
//     marginBottom: 8,
//   },
//   uploadButton: {
//     backgroundColor: "#7965C1",
//     borderRadius: 12,
//     padding: 16,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     marginTop: 16,
//   },
//   uploadText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//     marginLeft: 8,
//   },
//   proofImage: {
//     width: "100%",
//     height: 200,
//     borderRadius: 12,
//     marginTop: 16,
//   },
//   purchaseButton: {
//     borderRadius: 16,
//     overflow: "hidden",
//     marginBottom: 24,
//     elevation: 8,
//     shadowColor: "#7965C1",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//   },
//   purchaseButtonDisabled: {
//     opacity: 0.7,
//   },
//   buttonGradient: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 18,
//     paddingHorizontal: 32,
//   },
//   purchaseButtonText: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//     marginRight: 8,
//   },
//   buttonIcon: {
//     marginLeft: 4,
//   },
//   fundWalletButton: {
//     backgroundColor: "#E3D095",
//     borderColor: "#7965C1",
//     borderWidth: 2,
//   },
//   warningContainer: {
//     backgroundColor: "rgba(225, 112, 85, 0.1)",
//     borderRadius: 12,
//     padding: 16,
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 24,
//     borderWidth: 1,
//     borderColor: "rgba(225, 112, 85, 0.3)",
//   },
//   warningText: {
//     color: "#e17055",
//     fontSize: 14,
//     fontWeight: "600",
//     marginLeft: 12,
//     flex: 1,
//   },
//   modalContainer: {
//     backgroundColor: "#fff",
//     borderRadius: 20,
//     padding: 24,
//     alignItems: "center",
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: "#0E2148",
//     marginBottom: 16,
//   },
//   modalText: {
//     fontSize: 16,
//     color: "#0E2148",
//     marginBottom: 8,
//   },
//   modalSubtext: {
//     fontSize: 14,
//     color: "rgba(14, 33, 72, 0.7)",
//     textAlign: "center",
//     marginBottom: 24,
//   },
//   modalLoader: {
//     marginVertical: 20,
//   },
//   modalButtons: {
//     width: "100%",
//     gap: 12,
//   },
//   modalButton: {
//     backgroundColor: "#483AA0",
//     borderRadius: 12,
//     padding: 16,
//     alignItems: "center",
//   },
//   modalButtonText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   modalCancelButton: {
//     padding: 16,
//     alignItems: "center",
//   },
//   modalCancelText: {
//     color: "#483AA0",
//     fontSize: 16,
//     fontWeight: "600",
//   },
// })






"use client"
import { useState, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  RefreshControl,
} from "react-native"
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native"
import { supabase } from "./supabaseClient"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "./ThemeContext"
import Modal from "react-native-modal" // Import Modal for custom popup

const { width, height } = Dimensions.get("window")
const PHP_EMAIL_ENDPOINT = "https://gibsoninterlining.com.ng/send_email.php" // <-- Replace with your actual URL
const HEADER_HEIGHT_FORM = Platform.OS === 'android' ? StatusBar.currentHeight + 80 : 100; // Approximate height for fixed header

async function sendPurchaseEmails({ userEmail, userName, brand, variant, quantity, totalAmount }) {
  const adminEmail = "ebenezernwolisa100@gmail.com"
  const subject = `Gift Card Purchase Confirmation`
  const userBody = `Dear ${userName || "User"},\n\nYour purchase of ${quantity} ${brand.name} (${
    variant.name
  } - $${variant.value}) gift card(s) was successful.\nTotal: ₦${totalAmount.toLocaleString()}\n\nThank you for using our platform!`
  const adminBody = `Admin Notification:\n\nA user (${userName || userEmail}) just purchased ${quantity} ${
    brand.name
  } (${variant.name} - $${variant.value}) gift card(s).\nTotal: ₦${totalAmount.toLocaleString()}`

  try {
    await fetch(PHP_EMAIL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: userEmail,
        subject,
        body: userBody,
      }),
    })
    await fetch(PHP_EMAIL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: adminEmail,
        subject: "New Gift Card Purchase",
        body: adminBody,
      }),
    })
  } catch (e) {
    console.log("Failed to send email:", e)
  }
}

export default function BuyGiftcardForm() {
  const { theme, isDarkTheme } = useTheme()
  const { brand, variant, quantity } = useRoute().params
  const navigation = useNavigation()
  const [loading, setLoading] = useState(true) // Set to true initially for data fetching
  const [userBalance, setUserBalance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0) // State for unread notifications
  const [isInsufficientBalanceModalVisible, setIsInsufficientBalanceModalVisible] = useState(false); // State for custom modal

  const calculateTotal = () => {
    return variant.value * variant.rate * quantity
  }

  const fetchUserBalance = useCallback(async () => {
    setLoading(true); // Start loading for the entire screen
    setRefreshing(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile, error } = await supabase.from("profiles").select("balance").eq("id", user.id).single()
        if (error) {
          console.error("Supabase error fetching profile balance:", error);
          throw error;
        }
        setUserBalance(profile?.balance || 0)
        console.log("User balance fetched:", profile?.balance); // Log for debugging

        // Fetch unread notifications count
        const { count } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("read", false)
        setUnreadCount(count || 0)
      } else {
        console.log("User not logged in, cannot fetch balance.");
        setUserBalance(0); // Set balance to 0 if not logged in
      }
    } catch (e) {
      console.error("Error fetching user balance:", e)
      Alert.alert("Error", e.message || "Failed to load wallet balance.")
    } finally {
      setLoading(false); // End loading
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchUserBalance()
    }, [fetchUserBalance]),
  )

  const handleWalletPayment = async () => {
    const totalAmount = calculateTotal()
    if (totalAmount > userBalance) {
      setIsInsufficientBalanceModalVisible(true); // Show custom modal instead of Alert.alert
      return
    }
    setLoading(true) // This loading is for the button, separate from initial screen loading
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("You must be logged in to buy a gift card.")

      const newBalance = userBalance - totalAmount
      const { error: balanceError } = await supabase.from("profiles").update({ balance: newBalance }).eq("id", user.id)
      if (balanceError) throw balanceError

      const { error: walletTxError } = await supabase.from("wallet_transactions").insert([
        {
          user_id: user.id,
          type: "purchase",
          amount: totalAmount,
          status: "completed",
          payment_method: "wallet",
          description: `Gift card purchase: ${brand.name} - ${variant.name} - $${variant.value} x${quantity}`,
        },
      ])
      if (walletTxError) throw walletTxError

      await completePurchase("wallet", { status: "completed" })
    } catch (e) {
      setLoading(false)
      // Navigate to failure screen instead of showing alert
      navigation.navigate("TransactionFailure", {
        transactionType: "buy",
        errorMessage: e.message || "Failed to process wallet payment.",
        errorCode: e.code || "WALLET_ERROR",
        brand: brand,
        variant: variant,
        quantity: quantity,
        totalAmount: totalAmount
      })
    }
  }

  const completePurchase = async (paymentMethod, additionalData = {}) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("You must be logged in.")

      const totalAmount = calculateTotal()

      const { data: cardsToAssign, error: cardsError } = await supabase
        .from("giftcards_buy")
        .select("id, code")
        .eq("buy_brand_id", brand.id)
        .eq("variant_name", variant.name)
        .eq("value", variant.value)
        .eq("rate", variant.rate)
        .eq("sold", false)
        .is("assigned_to", null)
        .limit(quantity)
      if (cardsError) throw cardsError

      if (!cardsToAssign || cardsToAssign.length < quantity) {
        throw new Error(`Not enough cards available. Only ${cardsToAssign?.length || 0} cards available.`)
      }

      const { data: transactionData, error: transactionError } = await supabase
        .from("giftcard_transactions")
        .insert([
          {
            user_id: user.id,
            type: "buy",
            buy_brand_id: brand.id,
            variant_name: variant.name,
            amount: variant.value * quantity,
            rate: variant.rate,
            total: totalAmount,
            payment_method: paymentMethod,
            quantity: quantity,
            card_codes: cardsToAssign.map((c) => c.code),
            image_url: brand.image_url,
            ...additionalData,
          },
        ])
        .select()
        .single()
      if (transactionError) throw transactionError

      const { error: assignError } = await supabase
        .from("giftcards_buy")
        .update({
          sold: true,
          assigned_to: user.id,
          assigned_at: new Date().toISOString(),
          purchase_transaction_id: transactionData.id,
        })
        .in(
          "id",
          cardsToAssign.map((c) => c.id),
        )
      if (assignError) throw assignError

      setLoading(false)

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      let userEmail = ""
      let userName = ""
      if (currentUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", currentUser.id)
          .single()
        userEmail = profile?.email || ""
        userName = profile?.full_name || ""
      }

      await sendPurchaseEmails({
        userEmail,
        userName,
        brand,
        variant,
        quantity,
        totalAmount,
      })

      const statusMessage =
        additionalData.status === "pending"
          ? "Your order has been placed and is awaiting admin approval!"
          : "Gift card purchased successfully!"
      
      // Navigate to success screen instead of showing alert
      navigation.navigate("TransactionSuccess", {
        transactionType: "buy",
        transactionData: transactionData,
        brand: brand,
        variant: variant,
        quantity: quantity,
        totalAmount: totalAmount
      })
    } catch (e) {
      setLoading(false)
      // Navigate to failure screen instead of showing alert
      navigation.navigate("TransactionFailure", {
        transactionType: "buy",
        errorMessage: e.message || "Failed to complete purchase.",
        errorCode: e.code || "UNKNOWN_ERROR",
        brand: brand,
        variant: variant,
        quantity: quantity,
        totalAmount: totalAmount
      })
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.background,
    },
    loadingText: {
      color: theme.text,
      marginTop: 16,
      fontSize: 16,
      fontWeight: '500',
    },
    fixedHeader: {
      backgroundColor: theme.primary,
      paddingHorizontal: 24,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
      paddingBottom: 20,
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
    backButton: {
      padding: 8,
    },
    headerTitle: {
      color: theme.text,
      fontSize: 24,
      fontWeight: "bold",
      flex: 1,
      textAlign: "center",
      marginLeft: -40, // Counteract back button width to center title
    },
    notificationButton: {
      position: "relative",
      padding: 8,
    },
    notificationBadge: {
      position: "absolute",
      top: 0,
      right: 0,
      backgroundColor: theme.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: theme.primary,
    },
    notificationBadgeText: {
      color: theme.primary,
      fontSize: 10,
      fontWeight: "bold",
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 18,
      paddingBottom: Platform.OS === "ios" ? 85 + 20 : 70 + 20, // Account for tab bar height
      paddingTop: 0, // Space after fixed header
    },
    brandCard: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      overflow: "hidden",
      marginBottom: 24,
      elevation: 5,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      padding: 24,
    },
    brandImageContainer: {
      width: 60,
      height: 60,
      borderRadius: 12,
      backgroundColor: theme.background,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    brandImage: {
      width: 40,
      height: 40,
    },
    brandImagePlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: theme.accent,
      justifyContent: "center",
      alignItems: "center",
    },
    brandImagePlaceholderText: {
      color: theme.primary,
      fontSize: 18,
      fontWeight: "bold",
    },
    brandInfo: {
      flex: 1,
    },
    brandName: {
      color: theme.text,
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 4,
    },
    variantName: {
      color: theme.warning,
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
    },
    rateText: {
      color: theme.warning,
      fontSize: 14,
      fontWeight: "600",
    },
    summaryContainer: {
      marginBottom: 24,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 16,
    },
    summaryCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    summaryLabel: {
      color: theme.textSecondary,
      fontSize: 16,
    },
    summaryValue: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
    },
    totalRow: {
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 16,
      marginTop: 8,
      marginBottom: 0,
    },
    totalLabel: {
      color: theme.warning,
      fontSize: 18,
      fontWeight: "bold",
    },
    totalValue: {
      color: theme.warning,
      fontSize: 20,
      fontWeight: "bold",
    },
    walletContainer: {
      backgroundColor: theme.surface + "1A", // Tint of success
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.success,
      alignItems: "center",
    },
    walletTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
    },
    walletBalance: {
      color: theme.text,
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 4,
    },
    walletStatus: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    purchaseButton: {
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 24,
      elevation: 8,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      backgroundColor: theme.accent,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 18,
      paddingHorizontal: 32,
    },
    purchaseButtonDisabled: {
      opacity: 0.7,
    },
    purchaseButtonText: {
      color: theme.primary,
      fontSize: 18,
      fontWeight: "bold",
      marginRight: 8,
    },
    buttonIcon: {
      marginLeft: 4,
      color: theme.primary,
    },
    fundWalletButton: {
      backgroundColor: theme.surfaceSecondary,
      borderColor: theme.accent,
      borderWidth: 1,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    warningContainer: {
      backgroundColor: theme.error + "1A", // Tint of error
      borderRadius: 12,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.error,
    },
    warningText: {
      color: theme.error,
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 12,
      flex: 1,
    },
    // Skeleton Styles
    skeletonContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    skeletonFixedHeader: {
      height: HEADER_HEIGHT_FORM,
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
    skeletonBrandCard: {
      height: 120,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 20,
      marginHorizontal: 24,
      marginTop: 20,
      marginBottom: 24,
    },
    skeletonSectionTitle: {
      height: 20,
      width: '50%',
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 4,
      marginBottom: 16,
      alignSelf: 'flex-start',
      marginLeft: 24,
    },
    skeletonSummaryCard: {
      height: 200,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginBottom: 24,
      marginHorizontal: 24,
    },
    skeletonWalletContainer: {
      height: 120,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginBottom: 24,
      marginHorizontal: 24,
    },
    skeletonButton: {
      height: 60,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginBottom: 24,
      marginHorizontal: 24,
    },
    // Custom Modal Styles
    modalContent: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    modalIcon: {
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    modalText: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22,
    },
    modalButton: {
      backgroundColor: theme.accent,
      borderRadius: 12,
      paddingVertical: 16,
      width: '100%',
      alignItems: 'center',
      marginBottom: 12,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    modalButtonText: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    modalCancelButton: {
      paddingVertical: 10,
      width: '100%',
      alignItems: 'center',
    },
    modalCancelButtonText: {
      color: theme.textMuted,
      fontSize: 16,
      fontWeight: '600',
    },
  })

  // BuyGiftcardForm Skeleton Component
  const BuyGiftcardFormSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />
      {/* Fixed Header Skeleton */}
      <View style={styles.skeletonFixedHeader}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60, paddingBottom: 20, width: '100%' }}>
          <View style={{ width: 24, height: 24, backgroundColor: theme.surfaceSecondary, borderRadius: 12 }} /> {/* Back button placeholder */}
          <View style={[styles.headerTitle, { backgroundColor: theme.surfaceSecondary, width: 180, height: 24 }]} /> {/* Title placeholder */}
          <View style={[styles.notificationButton, { backgroundColor: theme.surfaceSecondary, borderRadius: 20, width: 40, height: 40 }]} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingTop: HEADER_HEIGHT_FORM + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand & Variant Info Skeleton */}
        <View style={styles.skeletonBrandCard} />

        {/* Purchase Summary Skeleton */}
        <View style={styles.skeletonSectionTitle} />
        <View style={styles.skeletonSummaryCard} />

        {/* Wallet Balance Display Skeleton */}
        <View style={styles.skeletonWalletContainer} />

        {/* Purchase/Fund Wallet Button Skeleton */}
        <View style={styles.skeletonButton} />
      </ScrollView>
    </View>
  );

  if (loading) {
    return <BuyGiftcardFormSkeleton />;
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
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold' }}>Complete Purchase</Text>
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
              onRefresh={fetchUserBalance}
              tintColor={theme.accent}
              colors={[theme.accent]}
              progressBackgroundColor={theme.surface}
            />
          }
        >
          {/* Brand & Variant Info */}
          <View style={styles.brandCard}>
            <View style={styles.brandImageContainer}>
              {brand.image_url ? (
                <Image source={{ uri: brand.image_url }} style={styles.brandImage} resizeMode="contain" />
              ) : (
                <View style={styles.brandImagePlaceholder}>
                  <Text style={styles.brandImagePlaceholderText}>{brand.name[0]}</Text>
                </View>
              )}
            </View>
            <View style={styles.brandInfo}>
              <Text style={styles.brandName}>{brand.name}</Text>
              <Text style={styles.variantName}>
                {variant.name} - ${variant.value}
              </Text>
              <Text style={styles.rateText}>₦{variant.rate} per $1</Text>
            </View>
          </View>

          {/* Purchase Summary */}
          <View style={styles.summaryContainer}>
            <Text style={styles.sectionTitle}>Purchase Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Card Value:</Text>
                <Text style={styles.summaryValue}>${variant.value}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Quantity:</Text>
                <Text style={styles.summaryValue}>{quantity}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Rate:</Text>
                <Text style={styles.summaryValue}>₦{variant.rate}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount:</Text>
                <Text style={styles.totalValue}>₦{calculateTotal().toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {/* Wallet Balance Display */}
          <View style={styles.walletContainer}>
            <Text style={styles.walletTitle}>Wallet Balance</Text>
            <Text style={styles.walletBalance}>₦{userBalance.toLocaleString()}</Text>
            <Text style={styles.walletStatus}>
              {calculateTotal() > userBalance ? "Insufficient balance" : "Sufficient balance"}
            </Text>
          </View>

          {/* If balance is sufficient, show purchase button. If not, show fund wallet button */}
          {variant &&
            quantity > 0 &&
            quantity <= variant.available_count &&
            (calculateTotal() <= userBalance ? (
              <TouchableOpacity
                style={[styles.purchaseButton, loading && styles.purchaseButtonDisabled]}
                onPress={handleWalletPayment}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={theme.primary} size="small" />
                ) : (
                  <>
                    <Text style={styles.purchaseButtonText}>Pay with Wallet</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color={theme.primary}
                      style={styles.buttonIcon}
                    />
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.purchaseButton, styles.fundWalletButton]}
                onPress={() => navigation.navigate("FundWallet")}
                activeOpacity={0.8}
              >
                <Text style={[styles.purchaseButtonText, { color: theme.accent }]}>
                  Fund Wallet
                </Text>
                <Ionicons
                  name="wallet"
                  size={20}
                  color={theme.accent}
                  style={styles.buttonIcon}
                />
              </TouchableOpacity>
            ))}

          {/* Availability Warning */}
          {variant && quantity > variant.available_count && (
            <View style={styles.warningContainer}>
              <Ionicons name="warning" size={20} color={theme.error} />
              <Text style={styles.warningText}>
                Only {variant.available_count} cards available for {variant.name} - ${variant.value}. Please reduce
                quantity.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Insufficient Balance Modal */}
      <Modal isVisible={isInsufficientBalanceModalVisible} onBackdropPress={() => setIsInsufficientBalanceModalVisible(false)}>
        <View style={styles.modalContent}>
          <Ionicons name="wallet-outline" size={48} color={theme.warning} style={styles.modalIcon} />
          <Text style={styles.modalTitle}>Insufficient Balance</Text>
          <Text style={styles.modalText}>
            You don't have enough funds in your wallet to complete this purchase.
            Please fund your wallet to proceed.
          </Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => {
              setIsInsufficientBalanceModalVisible(false);
              navigation.navigate("FundWallet"); // Navigate to Fund Wallet screen
            }}
          >
            <Text style={styles.modalButtonText}>Fund Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setIsInsufficientBalanceModalVisible(false)}
          >
            <Text style={styles.modalCancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  )
}
