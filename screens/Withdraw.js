// "use client"

// import { useState, useEffect } from "react"
// import {
//   View,
//   Text,
//   StyleSheet,
//   TextInput,
//   TouchableOpacity,
//   ActivityIndicator,
//   Alert,
//   StatusBar,
//   Dimensions,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   Modal,
// } from "react-native"
// import { supabase } from "./supabaseClient"
// import * as Crypto from "expo-crypto"
// import { useNavigation } from "@react-navigation/native"
// import { LinearGradient } from "expo-linear-gradient"
// import { Ionicons } from "@expo/vector-icons"
// import CustomDropdown from './CustomDropdown';

// const { width, height } = Dimensions.get("window")

// export default function Withdraw() {
//   const [loading, setLoading] = useState(true)
//   const [submitting, setSubmitting] = useState(false)
//   const [balance, setBalance] = useState(0)
//   const [bank, setBank] = useState(null)
//   const [amount, setAmount] = useState("")
//   const [pin, setPin] = useState("")
//   const [pinError, setPinError] = useState("")
//   const [showPin, setShowPin] = useState(false)
//   const [modalVisible, setModalVisible] = useState(false);
//   const [modalMessage, setModalMessage] = useState("");
//   const navigation = useNavigation()

//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true)
//       const {
//         data: { user },
//       } = await supabase.auth.getUser()
//       if (!user) {
//         setLoading(false)
//         return
//       }
//       // Get balance
//       const { data: profileData } = await supabase
//         .from("profiles")
//         .select("balance, transaction_pin")
//         .eq("id", user.id)
//         .single()
//       setBalance(profileData?.balance || 0)
//       // Get bank
//       const { data: bankData } = await supabase.from("user_banks").select("*").eq("user_id", user.id).single()
//       setBank(bankData)
//       setLoading(false)
//     }
//     fetchData()
//   }, [])

//   const validateForm = () => {
//     setPinError("")
//     if (!amount || isNaN(amount) || Number(amount) <= 0) {
//       setModalMessage("Please enter a valid amount.");
//       setModalVisible(true);
//       return false
//     }
//     if (Number(amount) > balance) {
//       setModalMessage("Amount exceeds available balance.");
//       setModalVisible(true);
//       return false
//     }
//     if (!bank) {
//       setModalMessage("Please add your bank details first.");
//       setModalVisible(true);
//       return false
//     }
//     if (!pin) {
//       setPinError("Enter your transaction PIN.")
//       return false
//     }
//     return true
//   }

//   const handleWithdraw = async () => {
//     if (!validateForm()) return

//     setSubmitting(true)
//     const {
//       data: { user },
//     } = await supabase.auth.getUser()
//     if (!user) {
//       setSubmitting(false)
//       return
//     }

//     try {
//       // Check PIN
//       const { data: profileData } = await supabase.from("profiles").select("transaction_pin").eq("id", user.id).single()
//       const pinHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin)
//       if (profileData.transaction_pin !== pinHash) {
//         setPinError("Incorrect PIN.")
//         setSubmitting(false)
//         return
//       }

//       // Deduct balance
//       const newBalance = balance - Number(amount)
//       const { error: balanceError } = await supabase.from("profiles").update({ balance: newBalance }).eq("id", user.id)
//       if (balanceError) throw balanceError

//       // Insert withdrawal
//       const { error: withdrawalError } = await supabase.from("withdrawals").insert({
//         user_id: user.id,
//         amount: Number(amount),
//         status: "pending",
//         type: "withdrawal",
//       })

//       if (withdrawalError) throw withdrawalError

//       setModalMessage("Withdrawal request submitted successfully!");
//       setModalVisible(true);

//       Alert.alert("Success", "Withdrawal request submitted successfully!", [
//         {
//           text: "View Transactions",
//           onPress: () => {
//             setAmount("")
//             setPin("")
//             navigation.navigate("Transactions")
//           },
//         },
//         {
//           text: "OK",
//           onPress: () => {
//             setAmount("")
//             setPin("")
//             navigation.goBack()
//           },
//         },
//       ])
//     } catch (error) {
//       setModalMessage(error.message);
//       setModalVisible(true);
//     }
//     setSubmitting(false)
//   }

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <StatusBar barStyle="light-content" backgroundColor="#0E2148" />
//         <ActivityIndicator size="large" color="#7965C1" />
//         <Text style={styles.loadingText}>Loading withdrawal details...</Text>
//       </View>
//     )
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
//             <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
//               <Ionicons name="arrow-back" size={24} color="#fff" />
//             </TouchableOpacity>
//             <Text style={styles.headerTitle}>Withdraw Funds</Text>
//             <View style={styles.placeholder} />
//           </View>

//           {/* Balance Card */}
//           <View style={styles.balanceCard}>
//             <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.balanceGradient}>
//               <View style={styles.balanceHeader}>
//                 <Ionicons name="wallet" size={24} color="#E3D095" />
//                 <Text style={styles.balanceLabel}>Available Balance</Text>
//               </View>
//               <Text style={styles.balanceAmount}>₦{balance.toLocaleString()}</Text>
//             </LinearGradient>
//           </View>

//           {/* Bank Details */}
//           {bank ? (
//             <View style={styles.bankCard}>
//               <View style={styles.bankHeader}>
//                 <Ionicons name="card" size={20} color="#7965C1" />
//                 <Text style={styles.bankHeaderText}>Bank Details</Text>
//                 <TouchableOpacity>
//                   <Ionicons name="pencil" size={16} color="#7965C1" />
//                 </TouchableOpacity>
//               </View>
//               <View style={styles.bankDetails}>
//                 <View style={styles.bankDetailRow}>
//                   <Text style={styles.bankDetailLabel}>Bank Name</Text>
//                   <Text style={styles.bankDetailValue}>{bank.bank_name}</Text>
//                 </View>
//                 <View style={styles.bankDetailRow}>
//                   <Text style={styles.bankDetailLabel}>Account Number</Text>
//                   <Text style={styles.bankDetailValue}>{bank.account_number}</Text>
//                 </View>
//                 <View style={styles.bankDetailRow}>
//                   <Text style={styles.bankDetailLabel}>Account Name</Text>
//                   <Text style={styles.bankDetailValue}>{bank.account_name}</Text>
//                 </View>
//               </View>
//             </View>
//           ) : (
//             <View style={styles.noBankCard}>
//               <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
//               <Text style={styles.noBankTitle}>No Bank Details Found</Text>
//               <Text style={styles.noBankSubtitle}>Please add your bank details in your profile to continue</Text>
//               <TouchableOpacity style={styles.addBankButton} onPress={() => navigation.navigate('BankDetails')}>
//                 <Text style={styles.addBankButtonText}>Add Bank Details</Text>
//               </TouchableOpacity>
//             </View>
//           )}

//           {/* Withdrawal Form */}
//           {bank && (
//             <View style={styles.formContainer}>
//               <View style={styles.inputContainer}>
//                 <Text style={styles.inputLabel}>Withdrawal Amount</Text>
//                 <View style={styles.inputWrapper}>
//                   <Ionicons name="cash" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
//                   <TextInput
//                     style={styles.input}
//                     placeholder="Enter amount to withdraw"
//                     placeholderTextColor="rgba(255,255,255,0.6)"
//                     value={amount}
//                     onChangeText={setAmount}
//                     keyboardType="numeric"
//                   />
//                 </View>
//                 {amount && !isNaN(amount) && Number(amount) > 0 && (
//                   <View style={styles.amountInfo}>
//                     <View style={styles.amountInfoRow}>
//                       <Text style={styles.amountInfoLabel}>Amount:</Text>
//                       <Text style={styles.amountInfoValue}>₦{Number(amount).toLocaleString()}</Text>
//                     </View>
//                     <View style={styles.amountInfoRow}>
//                       <Text style={styles.amountInfoLabel}>Processing Fee:</Text>
//                       <Text style={styles.amountInfoValue}>₦0</Text>
//                     </View>
//                     <View style={[styles.amountInfoRow, styles.totalRow]}>
//                       <Text style={styles.totalLabel}>You'll Receive:</Text>
//                       <Text style={styles.totalValue}>₦{Number(amount).toLocaleString()}</Text>
//                     </View>
//                   </View>
//                 )}
//               </View>

//               <View style={styles.inputContainer}>
//                 <Text style={styles.inputLabel}>Transaction PIN</Text>
//                 <View style={styles.inputWrapper}>
//                   <Ionicons name="lock-closed" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
//                   <TextInput
//                     style={styles.input}
//                     placeholder="Enter your 4-6 digit PIN"
//                     placeholderTextColor="rgba(255,255,255,0.6)"
//                     value={pin}
//                     onChangeText={setPin}
//                     keyboardType="numeric"
//                     secureTextEntry={!showPin}
//                     maxLength={6}
//                   />
//                   <TouchableOpacity onPress={() => setShowPin(!showPin)} style={styles.eyeButton}>
//                     <Ionicons
//                       name={showPin ? "eye-off-outline" : "eye-outline"}
//                       size={20}
//                       color="rgba(255,255,255,0.6)"
//                     />
//                   </TouchableOpacity>
//                 </View>
//                 {pinError ? <Text style={styles.errorText}>{pinError}</Text> : null}
//               </View>

//               {/* Withdraw Button */}
//               <TouchableOpacity
//                 style={[styles.withdrawButton, submitting && styles.withdrawButtonDisabled]}
//                 onPress={handleWithdraw}
//                 disabled={submitting}
//                 activeOpacity={0.8}
//               >
//                 <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.buttonGradient}>
//                   {submitting ? (
//                     <ActivityIndicator color="#fff" size="small" />
//                   ) : (
//                     <>
//                       <Text style={styles.withdrawButtonText}>Withdraw Funds</Text>
//                       <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
//                     </>
//                   )}
//                 </LinearGradient>
//               </TouchableOpacity>
//             </View>
//           )}

//           {/* Security Notice */}
//           <View style={styles.securityNotice}>
//             <Ionicons name="shield-checkmark" size={16} color="#E3D095" />
//             <Text style={styles.securityText}>Withdrawals are processed within 24 hours on business days</Text>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//       <Modal visible={modalVisible} transparent animationType="fade">
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalBox}>
//             <Text style={styles.modalMessage}>{modalMessage}</Text>
//             <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
//               <Text style={styles.modalButtonText}>OK</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
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
//   loadingContainer: {
//     flex: 1,
//     backgroundColor: "#0E2148",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   loadingText: {
//     color: "#fff",
//     fontSize: 16,
//     marginTop: 16,
//   },
//   keyboardAvoidingView: {
//     flex: 1,
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     paddingHorizontal: 15,
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingTop: 45,
//     marginBottom: 32,
//   },
//   backButton: {
//     padding: 0,
//   },
//   headerTitle: {
//     color: "#fff",
//     fontSize: 20,
//     fontWeight: "bold",
//   },
//   placeholder: {
//     width: 40,
//   },
//   balanceCard: {
//     borderRadius: 20,
//     overflow: "hidden",
//     marginBottom: 24,
//     elevation: 8,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//   },
//   balanceGradient: {
//     padding: 24,
//     alignItems: "center",
//   },
//   balanceHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   balanceLabel: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 16,
//     marginLeft: 8,
//   },
//   balanceAmount: {
//     color: "#fff",
//     fontSize: 32,
//     fontWeight: "bold",
//   },
//   bankCard: {
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 16,
//     padding: 20,
//     marginBottom: 24,
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.2)",
//   },
//   bankHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 16,
//   },
//   bankHeaderText: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//     flex: 1,
//     marginLeft: 8,
//   },
//   bankDetails: {
//     gap: 12,
//   },
//   bankDetailRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   bankDetailLabel: {
//     color: "rgba(255,255,255,0.7)",
//     fontSize: 14,
//   },
//   bankDetailValue: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   noBankCard: {
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 16,
//     padding: 32,
//     alignItems: "center",
//     marginBottom: 24,
//     borderWidth: 1,
//     borderColor: "rgba(255, 107, 107, 0.3)",
//   },
//   noBankTitle: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   noBankSubtitle: {
//     color: "rgba(255,255,255,0.7)",
//     fontSize: 14,
//     textAlign: "center",
//     marginBottom: 20,
//   },
//   addBankButton: {
//     backgroundColor: "#7965C1",
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 12,
//   },
//   addBankButtonText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   formContainer: {
//     gap: 24,
//   },
//   inputContainer: {
//     gap: 8,
//   },
//   inputLabel: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   inputWrapper: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 16,
//     paddingHorizontal: 16,
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.2)",
//   },
//   inputIcon: {
//     marginRight: 12,
//   },
//   input: {
//     flex: 1,
//     color: "#fff",
//     fontSize: 16,
//     paddingVertical: 16,
//   },
//   eyeButton: {
//     padding: 4,
//   },
//   amountInfo: {
//     backgroundColor: "rgba(227, 208, 149, 0.1)",
//     borderRadius: 12,
//     padding: 16,
//     marginTop: 12,
//     borderWidth: 1,
//     borderColor: "rgba(227, 208, 149, 0.3)",
//   },
//   amountInfoRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 8,
//   },
//   amountInfoLabel: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 14,
//   },
//   amountInfoValue: {
//     color: "#fff",
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   totalRow: {
//     borderTopWidth: 1,
//     borderTopColor: "rgba(227, 208, 149, 0.3)",
//     paddingTop: 12,
//     marginTop: 4,
//     marginBottom: 0,
//   },
//   totalLabel: {
//     color: "#E3D095",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   totalValue: {
//     color: "#E3D095",
//     fontSize: 18,
//     fontWeight: "bold",
//   },
//   errorText: {
//     color: "#ff6b6b",
//     fontSize: 14,
//     marginTop: 4,
//   },
//   withdrawButton: {
//     borderRadius: 16,
//     overflow: "hidden",
//     marginTop: 8,
//     elevation: 8,
//     shadowColor: "#7965C1",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//   },
//   withdrawButtonDisabled: {
//     opacity: 0.7,
//   },
//   buttonGradient: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 18,
//     paddingHorizontal: 32,
//   },
//   withdrawButtonText: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//     marginRight: 8,
//   },
//   buttonIcon: {
//     marginLeft: 4,
//   },
//   securityNotice: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 24,
//   },
//   securityText: {
//     color: "rgba(255,255,255,0.6)",
//     fontSize: 12,
//     marginLeft: 8,
//     textAlign: "center",
//   },
//   modalOverlay: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.5)',
//   },
//   modalBox: {
//     backgroundColor: '#fff',
//     borderRadius: 15,
//     padding: 25,
//     alignItems: 'center',
//     width: '80%',
//   },
//   modalMessage: {
//     color: '#333',
//     fontSize: 16,
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   modalButton: {
//     backgroundColor: '#7965C1',
//     paddingVertical: 12,
//     paddingHorizontal: 25,
//     borderRadius: 10,
//   },
//   modalButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// })






"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from "react-native"
import { supabase } from "./supabaseClient"
import * as Crypto from "expo-crypto"
import { useNavigation } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "./ThemeContext" // Import useTheme

const { width, height } = Dimensions.get("window")
const HEADER_HEIGHT = 90 // Approximate height of the fixed header

export default function Withdraw() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [balance, setBalance] = useState(0)
  const [bank, setBank] = useState(null)
  const [amount, setAmount] = useState("")
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const navigation = useNavigation()
  const { theme } = useTheme() // Use the theme hook

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      // Get balance
      const { data: profileData } = await supabase
        .from("profiles")
        .select("balance, transaction_pin")
        .eq("id", user.id)
        .single()
      setBalance(profileData?.balance || 0)
      // Get bank
      const { data: bankData } = await supabase.from("user_banks").select("*").eq("user_id", user.id).single()
      setBank(bankData)
      setLoading(false)
    }
    fetchData()
  }, [])

  const validateForm = () => {
    setPinError("")
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setModalMessage("Please enter a valid amount.")
      setModalVisible(true)
      return false
    }
    if (Number(amount) > balance) {
      setModalMessage("Amount exceeds available balance.")
      setModalVisible(true)
      return false
    }
    if (!bank) {
      setModalMessage("Please add your bank details first.")
      setModalVisible(true)
      return false
    }
    if (!pin) {
      setPinError("Enter your transaction PIN.")
      return false
    }
    return true
  }

  const handleWithdraw = async () => {
    if (!validateForm()) return
    setSubmitting(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSubmitting(false)
      return
    }
    try {
      // Check PIN
      const { data: profileData } = await supabase.from("profiles").select("transaction_pin").eq("id", user.id).single()
      const pinHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin)
      if (profileData.transaction_pin !== pinHash) {
        setPinError("Incorrect PIN.")
        setSubmitting(false)
        return
      }
      // Deduct balance
      const newBalance = balance - Number(amount)
      const { error: balanceError } = await supabase.from("profiles").update({ balance: newBalance }).eq("id", user.id)
      if (balanceError) throw balanceError
      // Insert withdrawal
      const { error: withdrawalError } = await supabase.from("withdrawals").insert({
        user_id: user.id,
        amount: Number(amount),
        status: "pending",
        type: "withdrawal",
      })
      if (withdrawalError) throw withdrawalError
      setModalMessage("Withdrawal request submitted successfully!")
      setModalVisible(true)
      Alert.alert("Success", "Withdrawal request submitted successfully!", [
        {
          text: "View Transactions",
          onPress: () => {
            setAmount("")
            setPin("")
            navigation.navigate("Transactions")
          },
        },
        {
          text: "OK",
          onPress: () => {
            setAmount("")
            setPin("")
            navigation.goBack()
          },
        },
      ])
    } catch (error) {
      setModalMessage(error.message)
      setModalVisible(true)
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.statusBar} backgroundColor={theme.primary} />
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading withdrawal details...</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.primary} />
      <LinearGradient colors={[theme.primary, theme.secondary]} style={styles.backgroundGradient} />

      {/* Fixed Header */}
      <LinearGradient colors={[theme.primary, theme.secondary]} style={styles.fixedHeaderGradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.textContrast} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textContrast }]}>Withdraw Funds</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView
          contentContainerStyle={{ ...styles.scrollContainer, paddingTop: HEADER_HEIGHT + 20 }} // Offset for fixed header
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Balance Card */}
          <View style={[styles.balanceCard, { shadowColor: theme.shadow }]}>
            <LinearGradient colors={[theme.accent, theme.secondary]} style={styles.balanceGradient}>
              <View style={styles.balanceHeader}>
                <Ionicons name="wallet" size={24} color={theme.warning} />
                <Text style={[styles.balanceLabel, { color: theme.textContrast }]}>Available Balance</Text>
              </View>
              <Text style={[styles.balanceAmount, { color: theme.textContrast }]}>₦{balance.toLocaleString()}</Text>
            </LinearGradient>
          </View>

          {/* Bank Details */}
          {bank ? (
            <View style={[styles.bankCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.bankHeader}>
                <Ionicons name="card" size={20} color={theme.accent} />
                <Text style={[styles.bankHeaderText, { color: theme.text }]}>Bank Details</Text>
                <TouchableOpacity>
                  <Ionicons name="pencil" size={16} color={theme.accent} />
                </TouchableOpacity>
              </View>
              <View style={styles.bankDetails}>
                <View style={styles.bankDetailRow}>
                  <Text style={[styles.bankDetailLabel, { color: theme.textSecondary }]}>Bank Name</Text>
                  <Text style={[styles.bankDetailValue, { color: theme.text }]}>{bank.bank_name}</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={[styles.bankDetailLabel, { color: theme.textSecondary }]}>Account Number</Text>
                  <Text style={[styles.bankDetailValue, { color: theme.text }]}>{bank.account_number}</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={[styles.bankDetailLabel, { color: theme.textSecondary }]}>Account Name</Text>
                  <Text style={[styles.bankDetailValue, { color: theme.text }]}>{bank.account_name}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={[styles.noBankCard, { backgroundColor: theme.card, borderColor: theme.errorBorder }]}>
              <Ionicons name="alert-circle" size={48} color={theme.error} />
              <Text style={[styles.noBankTitle, { color: theme.text }]}>No Bank Details Found</Text>
              <Text style={[styles.noBankSubtitle, { color: theme.textSecondary }]}>
                Please add your bank details in your profile to continue
              </Text>
              <TouchableOpacity
                style={[styles.addBankButton, { backgroundColor: theme.accent }]}
                onPress={() => navigation.navigate("BankDetails")}
              >
                <Text style={[styles.addBankButtonText, { color: theme.textContrast }]}>Add Bank Details</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Withdrawal Form */}
          {bank && (
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Withdrawal Amount</Text>
                <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Ionicons name="cash" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Enter amount to withdraw"
                    placeholderTextColor={theme.textSecondary}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                  />
                </View>
                {amount && !isNaN(amount) && Number(amount) > 0 && (
                  <View
                    style={[
                      styles.amountInfo,
                      { backgroundColor: theme.warningBackground, borderColor: theme.warningBorder },
                    ]}
                  >
                    <View style={styles.amountInfoRow}>
                      <Text style={[styles.amountInfoLabel, { color: theme.textSecondary }]}>Amount:</Text>
                      <Text style={[styles.amountInfoValue, { color: theme.text }]}>
                        ₦{Number(amount).toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.amountInfoRow}>
                      <Text style={[styles.amountInfoLabel, { color: theme.textSecondary }]}>Processing Fee:</Text>
                      <Text style={[styles.amountInfoValue, { color: theme.text }]}>₦0</Text>
                    </View>
                    <View style={[styles.amountInfoRow, styles.totalRow, { borderTopColor: theme.warningBorder }]}>
                      <Text style={[styles.totalLabel, { color: theme.warning }]}>You'll Receive:</Text>
                      <Text style={[styles.totalValue, { color: theme.warning }]}>
                        ₦{Number(amount).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Transaction PIN</Text>
                <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Ionicons name="lock-closed" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Enter your 4-6 digit PIN"
                    placeholderTextColor={theme.textSecondary}
                    value={pin}
                    onChangeText={setPin}
                    keyboardType="numeric"
                    secureTextEntry={!showPin}
                    maxLength={6}
                  />
                  <TouchableOpacity onPress={() => setShowPin(!showPin)} style={styles.eyeButton}>
                    <Ionicons
                      name={showPin ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                {pinError ? <Text style={[styles.errorText, { color: theme.error }]}>{pinError}</Text> : null}
              </View>
              {/* Withdraw Button */}
              <TouchableOpacity
                style={[
                  styles.withdrawButton,
                  submitting && styles.withdrawButtonDisabled,
                  { shadowColor: theme.shadow },
                ]}
                onPress={handleWithdraw}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <LinearGradient colors={[theme.accent, theme.secondary]} style={styles.buttonGradient}>
                  {submitting ? (
                    <ActivityIndicator color={theme.textContrast} size="small" />
                  ) : (
                    <>
                      <Text style={[styles.withdrawButtonText, { color: theme.textContrast }]}>Withdraw Funds</Text>
                      <Ionicons name="arrow-forward" size={20} color={theme.textContrast} style={styles.buttonIcon} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Ionicons name="shield-checkmark" size={16} color={theme.warning} />
            <Text style={[styles.securityText, { color: theme.textSecondary }]}>
              Withdrawals are processed within 24 hours on business days
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalMessage, { color: theme.text }]}>{modalMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.accent }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, { color: theme.textContrast }]}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  fixedHeaderGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    zIndex: 10,
    elevation: 5, // For Android shadow
    shadowColor: "#000", // For iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 0, // Already handled by parent padding
    paddingTop: 50, // Adjust based on StatusBar height
  },
  backButton: {
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  placeholder: {
    width: 40,
  },
  balanceCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  balanceGradient: {
    padding: 24,
    alignItems: "center",
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "bold",
  },
  bankCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  bankHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  bankHeaderText: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    marginLeft: 8,
  },
  bankDetails: {
    gap: 12,
  },
  bankDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bankDetailLabel: {
    fontSize: 14,
  },
  bankDetailValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  noBankCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
  },
  noBankTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  noBankSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  addBankButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addBankButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  formContainer: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
  },
  eyeButton: {
    padding: 4,
  },
  amountInfo: {
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
  },
  amountInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  amountInfoLabel: {
    fontSize: 14,
  },
  amountInfoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  totalRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
  withdrawButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  withdrawButtonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  withdrawButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  securityText: {
    fontSize: 12,
    marginLeft: 8,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalBox: {
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
    width: "80%",
  },
  modalMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
})
