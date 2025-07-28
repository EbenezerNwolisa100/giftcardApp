
import React, { useState, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  ScrollView,
  FlatList,
  RefreshControl,
  Platform
} from "react-native"
import { supabase } from "./supabaseClient"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "./ThemeContext"
import AsyncStorage from "@react-native-async-storage/async-storage"

const { width, height } = Dimensions.get("window")

export default function Wallet() {
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const navigation = useNavigation()
  const { theme, isDarkTheme } = useTheme()

  const fetchWalletData = useCallback(async () => {
    setLoading(true)
    setRefreshing(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Fetch user balance
      const { data: profile } = await supabase.from("profiles").select("balance").eq("id", user.id).single()
      setBalance(profile?.balance || 0)

      // Fetch wallet transactions (excluding purchase transactions)
      const { data: walletTxs } = await supabase
        .from("wallet_transactions")
        .select(`
          id,
          type,
          amount,
          status,
          created_at,
          description,
          payment_method,
          reference
        `)
        .eq("user_id", user.id)
        .neq("type", "purchase") // Exclude purchase transactions
        .order("created_at", { ascending: false })
        .limit(20)
      
      // Also fetch withdrawals that might not have wallet_transactions records
      const { data: withdrawals } = await supabase
        .from("withdrawals")
        .select(`
          id,
          amount,
          status,
          created_at,
          type,
          rejection_reason
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)
      
      // Format wallet transactions for display and TransactionDetails compatibility
      const formattedWalletTxs = (walletTxs || []).map((tx) => ({
        ...tx,
        // For TransactionDetails compatibility
        txType: tx.type,
        displayType: getTransactionTitle(tx.type),
        displayAmount: tx.amount,
        displayBrand: getTransactionTitle(tx.type),
        displayStatus: tx.status,
        displayDate: tx.created_at,
        displayId: `wt-${tx.id}`,
        // Additional fields for TransactionDetails
        brand_name: getTransactionTitle(tx.type),
        variant_name: tx.description || "Wallet Transaction",
        paymentMethod: tx.payment_method,
        reference: tx.reference,
      }))
      
      // Format withdrawals for display (these might not have wallet_transactions records)
      const formattedWithdrawals = (withdrawals || []).map((wd) => ({
        ...wd,
        type: "withdrawal",
        txType: "withdrawal",
        displayType: "Withdrawal",
        displayAmount: wd.amount,
        displayBrand: "Withdrawal",
        displayStatus: wd.status,
        displayDate: wd.created_at,
        displayId: `wd-${wd.id}`,
        // Additional fields for TransactionDetails
        brand_name: "Withdrawal",
        variant_name: wd.rejection_reason ? `Rejected: ${wd.rejection_reason}` : "Withdrawal request",
        paymentMethod: "bank_transfer",
        reference: `WD-${wd.id}`,
        description: wd.rejection_reason ? `Withdrawal rejected: ${wd.rejection_reason}` : "Withdrawal request",
      }))
      
      // Combine and sort all transactions
      const allTransactions = [...formattedWalletTxs, ...formattedWithdrawals]
        .sort((a, b) => new Date(b.displayDate) - new Date(a.displayDate))
        .slice(0, 20) // Limit to 20 most recent
      
      setTransactions(allTransactions)
    } catch (error) {
      console.error("Error fetching wallet data:", error)
      Alert.alert("Error", "Failed to load wallet data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchWalletData()
    }, [fetchWalletData]),
  )

  // Load balance visibility preference
  React.useEffect(() => {
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

  const formatDate = (dateStr) => {
    if (!dateStr) return ""
    const d = new Date(dateStr)
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const getTransactionIcon = (type) => {
    switch (type) {
      case "fund":
        return <Ionicons name="add-circle" size={24} color={theme.success} />
      case "withdrawal":
        return <Ionicons name="remove-circle" size={24} color={theme.primary} />
      case "refund":
        return <Ionicons name="refresh-circle" size={24} color={theme.accent} />
      case "credit":
        return <Ionicons name="add-circle" size={24} color={theme.success} />
      case "debit":
        return <Ionicons name="remove-circle" size={24} color={theme.error} />
      default:
        return <Ionicons name="wallet" size={24} color={theme.warning} />
    }
  }

  const getTransactionColor = (type) => {
    switch (type) {
      case "fund":
        return theme.success
      case "withdrawal":
        return theme.error
      case "refund":
        return theme.accent
      case "credit":
        return theme.success
      case "debit":
        return theme.error
      default:
        return theme.warning
    }
  }

  const getTransactionTitle = (type) => {
    switch (type) {
      case "fund":
        return "Wallet Funded"
      case "withdrawal":
        return "Withdrawal"
      case "refund":
        return "Refund"
      case "credit":
        return "Credit"
      case "debit":
        return "Debit"
      default:
        return "Transaction"
    }
  }

  const renderTransaction = ({ item }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate("TransactionDetails", { transaction: item })}
      activeOpacity={0.8}
    >
      <View style={styles.transactionItem}>
        <View style={styles.transactionLeft}>
          <View style={[styles.transactionIcon, { backgroundColor: getTransactionColor(item.type) + "20" }]}>
            {getTransactionIcon(item.type)}
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle} numberOfLines={1}>
              {getTransactionTitle(item.type)}
            </Text>
            <Text style={styles.transactionDate}>
              {formatDate(item.created_at)}
            </Text>
            {item.description && (
              <Text style={styles.transactionDescription} numberOfLines={1}>
                {item.description}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text
            style={[
              styles.transactionAmount,
              { color: item.type === "fund" || item.type === "refund" || item.type === "credit" ? theme.success : theme.error },
            ]}
          >
            {item.type === "fund" || item.type === "refund" || item.type === "credit" ? "+" : "-"}₦{item.amount?.toLocaleString()}
          </Text>
          <View
            style={[
              styles.transactionStatus,
              {
                backgroundColor:
                  item.status === "completed" ? theme.success : item.status === "pending" ? theme.warning : theme.error,
              },
            ]}
          >
            <Text style={{ color: theme.primary, fontSize: 11, fontWeight: "700" }}>
              {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )

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
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    balanceLabel: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    balanceAmount: {
      color: theme.text,
      fontSize: 32,
      fontWeight: "bold",
      marginBottom: 20,
    },
    eyeButton: {
      padding: 4,
    },
    // Quick Actions Styles
    quickActions: {
      flexDirection: "row",
      gap: 12,
      marginHorizontal: 18,
      marginBottom: 24,
    },
    actionButton: {
      flex: 1,
      backgroundColor: theme.accent,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    actionText: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: "bold",
      marginLeft: 8,
    },
    // Section Header Styles
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginHorizontal: 18,
      marginBottom: 16,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "bold",
    },
    seeAll: {
      color: theme.accent,
      fontSize: 14,
      fontWeight: "600",
    },
    // Transaction Styles
    transactionItem: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 18,
      marginBottom: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    transactionLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    transactionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    transactionInfo: {
      flex: 1,
    },
    transactionTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
    },
    transactionDate: {
      color: theme.textMuted,
      fontSize: 13,
      marginBottom: 3,
    },
    transactionDescription: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "500",
    },
    transactionRight: {
      alignItems: "flex-end",
    },
    transactionAmount: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 6,
    },
    transactionStatus: {
      fontSize: 11,
      fontWeight: "700",
      textAlign: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
      minWidth: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Empty State Styles
    emptyState: {
      alignItems: "center",
      paddingVertical: 60,
      paddingHorizontal: 24,
      marginTop: 20,
    },
    emptyStateText: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "600",
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateSubtext: {
      color: theme.textMuted,
      fontSize: 14,
      textAlign: "center",
      lineHeight: 20,
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
    skeletonActionButton: {
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 20,
      flex: 1,
      height: 60,
    },
    skeletonTransactionCard: {
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 18,
      marginBottom: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      height: 88,
    },
  })

  const WalletSkeleton = () => (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />
      
      {/* Fixed Header Skeleton */}
      <View style={styles.fixedHeader}>
        <View style={styles.backButton}>
          <View style={[styles.skeletonText, { width: 24, height: 24, borderRadius: 12 }]} />
        </View>
        <View style={[styles.skeletonText, { width: 120, height: 24 }]} />
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card Skeleton */}
        <View style={styles.skeletonBalanceCard} />

        {/* Quick Actions Skeleton */}
        <View style={styles.quickActions}>
          <View style={styles.skeletonActionButton} />
          <View style={styles.skeletonActionButton} />
        </View>

        {/* Section Header Skeleton */}
        <View style={styles.sectionHeader}>
          <View style={[styles.skeletonText, { width: 150, height: 18 }]} />
          <View style={[styles.skeletonText, { width: 60, height: 14 }]} />
        </View>

        {/* Transaction List Skeletons */}
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.skeletonTransactionCard} />
        ))}
      </ScrollView>
    </View>
  )

  if (loading) {
    return <WalletSkeleton />;
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
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold' }}>My Wallet</Text>
        <View style={{ width: 32, height: 32 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 0 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchWalletData}
            tintColor={theme.accent}
            colors={[theme.accent]}
            progressBackgroundColor={theme.surface}
          />
        }
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <TouchableOpacity
              onPress={async () => {
                setBalanceVisible((v) => {
                  AsyncStorage.setItem("balanceVisible", (!v).toString())
                  return !v
                })
              }}
            >
              <Ionicons
                name={balanceVisible ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>
            {balanceVisible ? `₦${balance.toLocaleString()}` : "₦ ****"}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("FundWallet")}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={24} color={theme.primary} />
            <Text style={styles.actionText}>Fund Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("Withdraw")}
            activeOpacity={0.8}
          >
            <Ionicons name="remove-circle" size={24} color={theme.primary} />
            <Text style={styles.actionText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction History */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Main", { screen: "Transactions" })}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={transactions.slice(0, 5)}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTransaction}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color={theme.primary} />
              <Text style={styles.emptyStateText}>No transactions yet</Text>
              <Text style={styles.emptyStateSubtext}>Your wallet transactions will appear here</Text>
            </View>
          }
        />
      </ScrollView>
    </View>
  )
}
