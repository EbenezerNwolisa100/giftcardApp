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
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "./ThemeContext"
import AsyncStorage from "@react-native-async-storage/async-storage"

const { width, height } = Dimensions.get("window")

export default function Withdraw() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [balance, setBalance] = useState(0)
  const [bank, setBank] = useState(null)
  const [amount, setAmount] = useState("")
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [balanceVisible, setBalanceVisible] = useState(true)
  const navigation = useNavigation()
  const { theme, isDarkTheme } = useTheme()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
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
      } catch (error) {
        console.error("Error fetching withdrawal data:", error);
        // Handle error gracefully, e.g., show a message or set default states
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Load balance visibility preference
  useEffect(() => {
    const loadBalanceVisibility = async () => {
      try {
        const stored = await AsyncStorage.getItem("balanceVisible")
        if (stored !== null) setBalanceVisible(stored === "true")
      } catch (e) {
        console.error("Failed to load balance visibility:", e)
      }
    }
    loadBalanceVisibility()
  }, [])

  const toggleBalanceVisibility = async () => {
    const newVisibility = !balanceVisible
    setBalanceVisible(newVisibility)
    try {
      await AsyncStorage.setItem("balanceVisible", newVisibility.toString())
    } catch (e) {
      console.error("Failed to save balance visibility:", e)
    }
  }

  const validateForm = () => {
    setPinError("")
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount.")
      return false
    }
    if (Number(amount) > balance) {
      Alert.alert("Error", "Amount exceeds available balance.")
      return false
    }
    if (!bank) {
      Alert.alert("Error", "Please add your bank details first.")
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
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setSubmitting(false)
        return
      }
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
      
      // Insert wallet transaction record
      const { error: walletTxError } = await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        type: "withdrawal",
        amount: Number(amount),
        status: "pending",
        description: "Withdrawal request",
        payment_method: "bank_transfer",
        reference: `WD-${Date.now()}`,
      })
      if (walletTxError) throw walletTxError
      
      // Navigate to success screen
      navigation.navigate("WithdrawalSuccess", { 
        amount: Number(amount),
        bankDetails: bank
      })
    } catch (error) {
      // Navigate to failure screen
      navigation.navigate("WithdrawalFailure", { 
        error: error.message || "Failed to submit withdrawal request.",
        amount: Number(amount)
      })
    } finally {
      setSubmitting(false)
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: theme.background,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      color: theme.text,
      fontSize: 16,
      marginTop: 16,
      fontWeight: '500',
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
    // Balance Card Styles
    balanceCard: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 24,
      marginHorizontal: 18,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    balanceHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    balanceLabel: {
      fontSize: 16,
      marginLeft: 8,
      color: theme.textSecondary,
      flex: 1,
    },
    balanceAmount: {
      fontSize: 32,
      fontWeight: "bold",
      color: theme.text,
    },
    // Bank Card Styles
    bankCard: {
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      marginHorizontal: 18,
      borderWidth: 1,
      backgroundColor: theme.surface,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
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
      color: theme.text,
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
      color: theme.textSecondary,
    },
    bankDetailValue: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },
    // No Bank Card Styles
    noBankCard: {
      borderRadius: 16,
      padding: 32,
      alignItems: "center",
      marginHorizontal: 18,
      marginBottom: 24,
      borderWidth: 1,
      backgroundColor: theme.surface,
      borderColor: theme.error,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    noBankTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginTop: 16,
      marginBottom: 8,
      color: theme.text,
    },
    noBankSubtitle: {
      fontSize: 14,
      textAlign: "center",
      marginBottom: 20,
      color: theme.textSecondary,
    },
    addBankButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: theme.accent,
    },
    addBankButtonText: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.primary,
    },
    // Form Styles
    formContainer: {
      gap: 24,
      marginHorizontal: 18,
    },
    inputContainer: {
      gap: 8,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 16,
      paddingHorizontal: 16,
      borderWidth: 1,
      backgroundColor: theme.surfaceSecondary,
      borderColor: theme.border,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      paddingVertical: 16,
      color: theme.text,
    },
    eyeButton: {
      padding: 4,
    },
    // Amount Info Styles
    amountInfo: {
      borderRadius: 12,
      padding: 16,
      marginTop: 12,
      borderWidth: 1,
      backgroundColor: theme.warning + "1A",
      borderColor: theme.warning,
    },
    amountInfoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    amountInfoLabel: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    amountInfoValue: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
    },
    totalRow: {
      borderTopWidth: 1,
      paddingTop: 12,
      marginTop: 4,
      marginBottom: 0,
      borderTopColor: theme.warning,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.warning,
    },
    totalValue: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.warning,
    },
    errorText: {
      fontSize: 14,
      marginTop: 4,
      color: theme.error,
    },
    // Button Styles
    withdrawButton: {
      borderRadius: 16,
      marginTop: 8,
      backgroundColor: theme.accent,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    withdrawButtonDisabled: {
      opacity: 0.7,
    },
    buttonContent: {
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
      color: theme.primary,
    },
    buttonIcon: {
      marginLeft: 4,
    },
    // Security Notice Styles
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
      color: theme.textSecondary,
    },

    // Skeleton Styles
    skeletonText: {
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 4,
    },
    skeletonBalanceCard: {
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 20,
      padding: 24,
      marginHorizontal: 18,
      marginBottom: 24,
      height: 120,
    },
    skeletonBankCard: {
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 18,
      marginBottom: 24,
      height: 200,
    },
    skeletonFormContainer: {
      height: 300,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginHorizontal: 18,
      marginBottom: 24,
    },
    skeletonSecurityNotice: {
      height: 40,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 12,
      marginHorizontal: 18,
      marginBottom: 24,
    },
  })

  // Withdraw Skeleton Component
  const WithdrawSkeleton = () => (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />
      
      {/* Fixed Header Skeleton */}
      <View style={styles.fixedHeader}>
        <View style={styles.backButton}>
          <View style={[styles.skeletonText, { width: 24, height: 24, borderRadius: 12 }]} />
        </View>
        <View style={[styles.skeletonText, { width: 180, height: 24 }]} />
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card Skeleton */}
        <View style={styles.skeletonBalanceCard} />

        {/* Bank Details Card Skeleton */}
        <View style={styles.skeletonBankCard} />

        {/* Withdrawal Form Skeleton */}
        <View style={styles.skeletonFormContainer} />

        {/* Security Notice Skeleton */}
        <View style={styles.skeletonSecurityNotice} />
      </ScrollView>
    </View>
  );

  if (loading) {
    return <WithdrawSkeleton />;
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
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold' }}>Withdraw Funds</Text>
        <View style={{ width: 32, height: 32 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: 0 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Ionicons name="wallet" size={24} color={theme.accent} />
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <TouchableOpacity onPress={toggleBalanceVisibility} style={styles.eyeButton}>
                <Ionicons
                  name={balanceVisible ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.balanceAmount}>
              {balanceVisible ? `₦${balance.toLocaleString()}` : "₦••••••••"}
            </Text>
          </View>

          {/* Bank Details */}
          {bank ? (
            <View style={styles.bankCard}>
              <View style={styles.bankHeader}>
                <Ionicons name="card" size={20} color={theme.accent} />
                <Text style={styles.bankHeaderText}>Bank Details</Text>
                <TouchableOpacity onPress={() => navigation.navigate('BankDetails')}>
                  <Ionicons name="pencil" size={16} color={theme.accent} />
                </TouchableOpacity>
              </View>
              <View style={styles.bankDetails}>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Bank Name</Text>
                  <Text style={styles.bankDetailValue}>{bank.bank_name}</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Account Number</Text>
                  <Text style={styles.bankDetailValue}>{bank.account_number}</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Account Name</Text>
                  <Text style={styles.bankDetailValue}>{bank.account_name}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.noBankCard}>
              <Ionicons name="alert-circle" size={48} color={theme.error} />
              <Text style={styles.noBankTitle}>No Bank Details Found</Text>
              <Text style={styles.noBankSubtitle}>Please add your bank details in your profile to continue</Text>
              <TouchableOpacity style={styles.addBankButton} onPress={() => navigation.navigate('BankDetails')}>
                <Text style={styles.addBankButtonText}>Add Bank Details</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Withdrawal Form */}
          {bank && (
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Withdrawal Amount</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="cash" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter amount to withdraw"
                    placeholderTextColor={theme.textMuted}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                  />
                </View>
                {/* {amount && !isNaN(amount) && Number(amount) > 0 && (
                  <View style={styles.amountInfo}>
                    <View style={styles.amountInfoRow}>
                      <Text style={styles.amountInfoLabel}>Amount:</Text>
                      <Text style={styles.amountInfoValue}>₦{Number(amount).toLocaleString()}</Text>
                    </View>
                    <View style={styles.amountInfoRow}>
                      <Text style={styles.amountInfoLabel}>Processing Fee:</Text>
                      <Text style={styles.amountInfoValue}>₦0</Text>
                    </View>
                    <View style={[styles.amountInfoRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>You'll Receive:</Text>
                      <Text style={styles.totalValue}>₦{Number(amount).toLocaleString()}</Text>
                    </View>
                  </View>
                )} */}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Transaction PIN</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your 4-6 digit PIN"
                    placeholderTextColor={theme.textMuted}
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
                {pinError ? <Text style={styles.errorText}>{pinError}</Text> : null}
              </View>

              {/* Withdraw Button */}
              <TouchableOpacity
                style={[styles.withdrawButton, submitting && styles.withdrawButtonDisabled]}
                onPress={handleWithdraw}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  {submitting ? (
                    <ActivityIndicator color={theme.primary} size="small" />
                  ) : (
                    <>
                      <Text style={styles.withdrawButtonText}>Withdraw Funds</Text>
                      <Ionicons name="arrow-forward" size={20} color={theme.primary} style={styles.buttonIcon} />
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Ionicons name="shield-checkmark" size={16} color={theme.warning} />
            <Text style={styles.securityText}>Withdrawals are processed within 24 hours on business days</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      

    </View>
  )
}