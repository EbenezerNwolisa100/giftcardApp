import { useEffect, useState, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  Image,
  RefreshControl,
  Platform, // Import Platform for OS-specific padding
} from "react-native"
import { supabase } from "./supabaseClient"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "./ThemeContext"
import { useNavigation, useFocusEffect } from "@react-navigation/native" // Import useNavigation and useFocusEffect


const { width } = Dimensions.get("window")

const STATUS_COLORS = {
  completed: "#4caf50", // Success
  pending: "#ffa726", // Warning
  rejected: "#ff6b6b", // Error
}

const PAYMENT_METHOD_LABELS = {
  wallet: "Wallet",
  flutterwave: "Flutterwave",
  manual_transfer: "Manual Transfer",
}

const formatDate = (dateStr) => {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  const now = new Date()
  const diffInHours = (now - d) / (1000 * 60 * 60)
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now - d) / (1000 * 60))
    return diffInMinutes <= 1 ? "Just now" : `${diffInMinutes}m ago`
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`
  } else if (diffInHours < 48) {
    return "Yesterday"
  } else {
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    })
  }
}

export default function Transactions({ navigation }) {
  const { theme, isDarkTheme } = useTheme()
  const [transactions, setTransactions] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [typeFilter, setTypeFilter] = useState("all")
  const [unreadCount, setUnreadCount] = useState(0) // State for unread notifications

  const fetchTx = useCallback(async () => {
    setLoading(true)
    setRefreshing(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        setRefreshing(false)
        return
      }

      // Fetch giftcard transactions (both buy and sell)
      const { data: giftcardTxs, error: giftcardError } = await supabase
        .from("giftcard_transactions")
        .select(
          `
          id, type, status, created_at, amount, total, rate, payment_method, proof_of_payment_url, flutterwave_reference,
          brand_id, brand_name, variant_id, variant_name, card_code, image_url, rejection_reason, quantity, buy_brand_id, card_codes,
          sell_brand:brand_id (name, image_url),
          sell_variant:variant_id (name),
          buy_brand:buy_brand_id (name, image_url)
        `,
        )
        .eq("user_id", user.id)

      // Fetch withdrawals
      const { data: withdrawals, error: withdrawalError } = await supabase
        .from("withdrawals")
        .select("id, amount, status, created_at, type, rejection_reason")
        .eq("user_id", user.id)

      // Fetch unread notifications count (copied from Dashboard)
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false)
      setUnreadCount(count || 0)

      if (giftcardError || withdrawalError) {
        console.log("Giftcard Error:", giftcardError)
        console.log("Withdrawal Error:", withdrawalError)
        Alert.alert("Error", giftcardError?.message || withdrawalError?.message)
        setLoading(false)
        setRefreshing(false)
        return
      }

      // Normalize and merge giftcard transactions
      const giftcardTxsNormalized = (giftcardTxs || []).map((tx) => {
        const isBuy = tx.type === "buy"
        const brandName = isBuy ? tx.buy_brand?.name || tx.brand_name : tx.sell_brand?.name || tx.brand_name
        const brandImage = isBuy ? tx.buy_brand?.image_url || tx.image_url : tx.sell_brand?.image_url || tx.image_url
        const variantName = isBuy ? tx.variant_name : tx.sell_variant?.name || tx.variant_name
        return {
          ...tx,
          txType: tx.type,
          displayType: isBuy ? "Buy" : "Sell",
          displayAmount: tx.total, // Use total for display amount
          displayBrand: brandName || "Gift Card",
          displayImage: brandImage,
          variantName: variantName,
          displayStatus: tx.status,
          displayDate: tx.created_at,
          displayId: `gc-${tx.id}`,
          displayCode:
            isBuy && Array.isArray(tx.card_codes) && tx.card_codes.length > 0 ? tx.card_codes.join(", ") : tx.card_code,
          paymentMethod: tx.payment_method,
          proofUrl: tx.proof_of_payment_url,
          flutterwaveRef: tx.flutterwave_reference,
          quantity: tx.quantity,
          rate: tx.rate,
          amount: tx.amount,
          rejection_reason: tx.rejection_reason,
        }
      })

      const withdrawalTxs = (withdrawals || []).map((tx) => ({
        ...tx,
        txType: "withdrawal",
        displayType: "Withdrawal",
        displayAmount: tx.amount,
        displayBrand: "Withdrawal",
        displayStatus: tx.status,
        displayDate: tx.created_at,
        displayId: `wd-${tx.id}`,
      }))

      const allTxs = [...giftcardTxsNormalized, ...withdrawalTxs].sort(
        (a, b) => new Date(b.displayDate) - new Date(a.displayDate),
      )
      setTransactions(allTxs)
    } catch (err) {
      console.error("Transactions fetch error:", err)
      Alert.alert("Error", "Failed to fetch transactions.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchTx()
    }, [fetchTx]),
  )

  useEffect(() => {
    let txs = [...transactions]
    if (typeFilter !== "all") txs = txs.filter((t) => t.txType === typeFilter)
    setFiltered(txs)
  }, [transactions, typeFilter])

  const openDetails = (tx) => {
    navigation.navigate("TransactionDetails", { transaction: tx })
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
      // backgroundColor: theme.primary, // Solid primary color for header
      paddingHorizontal: 18, // Consistent padding
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 5 : 45, // Adjust for iOS/Android status bar
      paddingBottom: 10,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 5 }, // More pronounced shadow
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8, // Android shadow
      zIndex: 10, // Ensure header is above scrollable content
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between", // Space out title and notification
    },
    headerTitle: {
      color: theme.text,
      fontSize: 24, // Larger title
      fontWeight: "bold",
    },
    notificationButton: {
      position: "relative",
      padding: 4,
    },
    notificationBadge: {
      position: "absolute",
      top: -2,
      right: -2,
      backgroundColor: theme.error, // Use theme error color
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: theme.primary, // Border matches header background
    },
    notificationBadgeText: {
      color: theme.text, // Text color for contrast on badge
      fontSize: 10,
      fontWeight: "bold",
    },
    // Styles for the scrollable content below the fixed header
    scrollContentContainer: {
      paddingTop: 20, // Padding at the top of the scrollable content
      paddingBottom: 32, // Padding at the bottom of the scrollable content
    },
    filterTabs: {
      flexDirection: "row",
      paddingHorizontal: 18, // Consistent padding
      marginTop: 1,
      marginBottom: 20,
      justifyContent: "space-around", // Distribute tabs evenly
      flexWrap: "wrap",
    },
    filterTab: {
      backgroundColor: theme.surfaceSecondary, // Use surfaceSecondary for inactive tabs
      borderRadius: 12, // More subtle rounded corners
      paddingHorizontal: 18, // Increased padding
      paddingVertical: 10,
      marginHorizontal: 4, // Smaller margin
      marginBottom: 8, // For wrapping
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    filterTabActive: {
      backgroundColor: theme.accent, // Solid accent color for active tab
      borderColor: theme.accent,
    },
    filterTabText: {
      color: theme.textSecondary, // Muted text for inactive tabs
      fontSize: 14,
      fontWeight: "500",
    },
    filterTabTextActive: {
      color: theme.primary, // Contrasting text for active tab
      fontWeight: "600",
    },
    listContainer: {
      paddingHorizontal: 18, // Consistent padding
      paddingBottom: 32,
    },
    transactionCard: {
      backgroundColor: theme.surface, // Use surface for transaction cards
      borderRadius: 16,
      padding: 16,
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
    transactionImageContainer: {
      width: 48, // Larger image container
      height: 48,
      borderRadius: 24, // Circular
      marginRight: 12,
      overflow: "hidden",
      backgroundColor: theme.surfaceSecondary, // Placeholder background
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1, // Add a subtle border
      borderColor: theme.border,
    },
    transactionImage: {
      width: "100%",
      height: "100%",
    },
    transactionIcon: {
      width: 48, // Larger icon container
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
      backgroundColor: theme.surfaceSecondary, // Default icon background
      borderWidth: 1,
      borderColor: theme.border,
    },
    transactionIconText: {
      color: theme.text,
      fontSize: 18, // Larger text for icon fallback
      fontWeight: "bold",
    },
    transactionDetails: {
      flex: 1,
    },
    transactionBrand: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
    },
    transactionDate: {
      color: theme.textMuted,
      fontSize: 12,
      marginBottom: 2,
    },
    transactionPaymentMethod: {
      color: theme.textMuted,
      fontSize: 10,
    },
    transactionRight: {
      alignItems: "flex-end",
    },
    transactionAmount: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
    },
    transactionStatus: {
      fontSize: 12,
      fontWeight: "600",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 60,
      paddingHorizontal: 24,
    },
    emptyStateTitle: {
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
    },
    // Skeleton Styles
    skeletonContainer: {
      paddingHorizontal: 24,
      marginTop: 20,
    },
    skeletonHeader: {
      height: 24,
      width: '60%',
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 4,
      marginBottom: 16,
    },
    skeletonFilterTab: {
      height: 40,
      width: (width - 72) / 4 - 8, // Roughly distribute for 4 tabs
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 12,
      marginHorizontal: 4,
      marginBottom: 8,
    },
    skeletonTransactionCard: {
      height: 100, // Increased height for skeleton card
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginBottom: 12,
    },
  })

  // Transactions Skeleton Component
  const TransactionsSkeleton = () => (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />
      {/* Fixed Header Skeleton */}
      <View style={styles.fixedHeader}>
        <View style={[styles.skeletonHeader, { width: 150, height: 24 }]} />
        <View style={[styles.notificationButton, { backgroundColor: theme.surfaceSecondary, borderRadius: 20, width: 40, height: 40 }]} />
      </View>

      {/* Filter Tabs Skeleton */}
      <View style={styles.filterTabs}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.skeletonFilterTab} />
        ))}
      </View>

      {/* Transaction List Skeleton */}
      <FlatList
        data={[1, 2, 3, 4, 5, 6, 7]} // Dummy data for skeleton items
        keyExtractor={(item) => item.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        renderItem={() => (
          <View style={styles.skeletonTransactionCard} />
        )}
      />
    </View>
  );


  if (loading) {
    return <TransactionsSkeleton />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />

      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
        <Text style={styles.headerTitle}>Transactions</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("NotificationsScreen")}
          style={styles.notificationButton}
        >
          <Ionicons name="notifications-outline" size={24} color={theme.text} />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {["all", "buy", "sell", "withdrawal"].map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.filterTab, typeFilter === option && styles.filterTabActive]}
            onPress={() => setTypeFilter(option)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterTabText, typeFilter === option && styles.filterTabTextActive]}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transactions List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.displayId}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.transactionCard} onPress={() => openDetails(item)} activeOpacity={0.8}>
            <View style={styles.transactionLeft}>
              {item.txType === "withdrawal" ? (
                <View style={[styles.transactionIcon, { backgroundColor: theme.warning }]}>
                  <Ionicons name="arrow-up" size={20} color={theme.primary} />
                </View>
              ) : item.displayImage ? (
                <View style={styles.transactionImageContainer}>
                  <Image source={{ uri: item.displayImage }} style={styles.transactionImage} resizeMode="contain" />
                </View>
              ) : (
                // Fallback for missing image/withdrawal icon
                <View style={[styles.transactionIcon, { backgroundColor: theme.secondary }]}>
                  <Text style={styles.transactionIconText}>{(item.displayBrand || "?")[0]}</Text>
                </View>
              )}
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionBrand}>{item.displayBrand}</Text>
                {item.variantName && (
                  <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 2 }}>{item.variantName}</Text>
                )}
                <Text style={styles.transactionDate}>{formatDate(item.displayDate)}</Text>
                {item.paymentMethod && (
                  <Text style={styles.transactionPaymentMethod}>
                    {PAYMENT_METHOD_LABELS[item.paymentMethod] || item.paymentMethod}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.transactionRight}>
              <Text style={styles.transactionAmount}>₦{item.displayAmount?.toLocaleString()}</Text>
              <Text
                style={[
                  styles.transactionStatus,
                  {
                    color:
                      item.displayStatus === "rejected"
                        ? theme.error
                        : item.displayStatus === "pending"
                          ? theme.warning
                          : theme.success,
                  },
                ]}
              >
                {item.displayStatus?.charAt(0).toUpperCase() + item.displayStatus?.slice(1)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={theme.textMuted} />
            <Text style={styles.emptyStateTitle}>No transactions found</Text>
            <Text style={styles.emptyStateSubtext}>
              {typeFilter !== "all" ? "Try adjusting your filters" : "Your transaction history will appear here"}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchTx}
            tintColor={theme.accent}
            colors={[theme.accent]}
            progressBackgroundColor={theme.surface}
          />
        }
      />
    </View>
  )
}
