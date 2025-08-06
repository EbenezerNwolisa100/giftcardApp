import { useEffect, useState, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StatusBar,
  Dimensions,
  RefreshControl, // Import RefreshControl
} from "react-native"
import { supabase } from "./supabaseClient" // Adjusted path
import { MaterialIcons, Ionicons } from "@expo/vector-icons"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useTheme } from "./ThemeContext" // Adjusted path

const { width } = Dimensions.get("window")

export default function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false) // State for RefreshControl
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const navigation = useNavigation()
  const { theme, isDarkTheme } = useTheme()

  const fetchData = useCallback(async () => {
    setLoading(true)
    setRefreshing(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        // Fetch profile with better error handling
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        
        if (profileError) {
          console.error("Error fetching profile:", profileError)
          // If profile doesn't exist, try to create it with pending name
          const pendingName = await AsyncStorage.getItem("pending_name")
          if (pendingName) {
            const { data: newProfile, error: createError } = await supabase
              .from("profiles")
              .upsert({
                id: user.id,
                full_name: pendingName,
                email: user.email,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single()
            
            if (!createError && newProfile) {
              setProfile(newProfile)
              await AsyncStorage.removeItem("pending_name")
            }
          }
        } else {
        setProfile(profileData)
        }

        // Fetch gift card transactions (sell and buy)
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
          .in("type", ["sell", "buy"])
          .order("created_at", { ascending: false })
          .limit(5)
        if (giftcardError) console.error("Error fetching giftcard transactions:", giftcardError)

        // Fetch withdrawals
        const { data: withdrawals, error: withdrawalsError } = await supabase
          .from("withdrawals")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5)
        if (withdrawalsError) console.error("Error fetching withdrawals:", withdrawalsError)

        // Fetch unread notifications count
        const { count } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("read", false)
        setUnreadCount(count || 0)

        // Combine all transactions and normalize their structure
        const allCombinedTxs = []
        // Gift Card Transactions
          ; (giftcardTxs || []).forEach((tx) => {
          const isSell = tx.type === "sell"
          const isBuy = tx.type === "buy"
          const brandName = isBuy ? tx.buy_brand?.name || tx.brand_name : tx.sell_brand?.name || tx.brand_name
          const brandImage = isBuy ? tx.buy_brand?.image_url || tx.image_url : tx.sell_brand?.image_url || tx.image_url
          const variantName = isBuy ? tx.variant_name : tx.sell_variant?.name || tx.variant_name
          const amountDisplay = tx.total?.toLocaleString() || tx.amount?.toLocaleString() || "0.00"
          allCombinedTxs.push({
            ...tx,
            txType: tx.type, // Add txType for TransactionDetails compatibility
            originalType: tx.type,
            displayType: isSell ? "Sell Gift Card" : "Buy Gift Card",
            displayAmount: amountDisplay,
            displayBrand: brandName || "Gift Card",
            displayImage: brandImage,
            variantName: variantName,
            displayStatus: tx.status,
            displayDate: tx.created_at,
            displayId: `gc-${tx.id}`,
            displayCode: isBuy && Array.isArray(tx.card_codes) && tx.card_codes.length > 0 ? tx.card_codes.join(", ") : tx.card_code,
            paymentMethod: tx.payment_method,
            proofUrl: tx.proof_of_payment_url,
            flutterwaveRef: tx.flutterwave_reference,
            icon: isSell ? "credit-card" : "shopping-cart", // MaterialIcons
            iconColor: theme.secondary, // Use theme color
          })
        })
        // Withdrawals
          ; (withdrawals || []).forEach((tx) => {
          allCombinedTxs.push({
            ...tx,
            txType: "withdrawal", // Add txType for TransactionDetails compatibility
            originalType: "withdrawal",
            displayType: "Withdrawal",
            displayAmount: tx.amount?.toLocaleString() || "0.00",
            displayBrand: "Wallet Withdrawal",
            displayStatus: tx.status,
            displayDate: tx.created_at,
            displayId: `wd-${tx.id}`,
            icon: "arrow-up", // Ionicons
            iconColor: theme.warning, // Use theme color
          })
        })

        // Sort all transactions by date and get the latest 5
        const sortedAndLimitedTxs = allCombinedTxs
          .sort((a, b) => new Date(b.displayDate) - new Date(a.displayDate))
          .slice(0, 5)
        setTransactions(sortedAndLimitedTxs)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      // Optionally show an alert for the user
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [theme]) // Depend on theme to re-render styles if theme changes

  useFocusEffect(
    useCallback(() => {
      fetchData()
    }, [fetchData]),
  )

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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    // Fixed Header Styles
    fixedHeader: {
      // backgroundColor: , // Solid primary color for header
      paddingHorizontal: 18,
      paddingTop: 40,
      paddingBottom: 20,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      zIndex: 10, // Ensure header is above scrollable content
    },
    headerContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    greeting: {
      color: theme.textSecondary,
      fontSize: 14,
      marginBottom: 4,
    },
    username: {
      color: theme.text,
      fontSize: 24,
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
      borderColor: theme.primary,
    },
    notificationBadgeText: {
      color: theme.text,
      fontSize: 10,
      fontWeight: "bold",
    },
    balanceCard: {
      backgroundColor: theme.surface, // Solid surface color for balance card
      marginHorizontal: 18,
      borderRadius: 20,
      padding: 24,
      marginTop: 0, // Space from header
      marginBottom: 32,
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
    actionButtonsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 0,
    },
    actionButton: {
      flex: 1,
      backgroundColor: theme.accent, // Solid accent color for buttons
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: 12,
      marginHorizontal: 5,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    actionButtonText: {
      color: isDarkTheme ? theme.text : theme.primary, // Text color for contrast
      fontSize: 16,
      fontWeight: "bold",
      marginRight: 8,
    },
    actionButtonIcon: {
      color: isDarkTheme ? theme.text : theme.primary, // Icon color for contrast
    },
    fundIconContainer: {
      backgroundColor: theme.accent,
      borderRadius: 10,
      width: 45,
      height: 47,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.background,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    quickActionsContainer: {
      paddingHorizontal: 24,
      marginTop: 0,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 12,
    },
    sectionTitles: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 0,
    },
    quickActionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    quickActionCard: {
      backgroundColor: theme.surfaceSecondary, // Use surfaceSecondary for quick action cards
      borderRadius: 16,
      padding: 20,
      width: (width - 72) / 2, // Adjusted for 2 cards per row with spacing
      marginBottom: 16,
      alignItems: "center",
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    quickActionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDarkTheme ? theme.surface : theme.secondary, // Icon background
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    quickActionIconColor: {
      color: theme.accent, // Icon color
    },
    quickActionTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 4,
      textAlign: "center",
    },
    quickActionSubtitle: {
      color: theme.textMuted,
      fontSize: 12,
      textAlign: "center",
    },
    pendingContainer: {
      paddingHorizontal: 24,
      marginTop: 0,
    },
    pendingActionCard: {
      backgroundColor: theme.surfaceSecondary, // Use warning color for pending actions
      borderRadius: 16,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    pendingIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDarkTheme ? theme.surface : theme.primary, // Icon background
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    pendingIconColor: {
      color: isDarkTheme ? theme.warning : theme.accent, // Icon color
    },
    pendingContent: {
      flex: 1,
    },
    pendingTitle: {
      color: isDarkTheme ? theme.primary : theme.text, // Text color for contrast on warning
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 2,
    },
    pendingSubtitle: {
      color: isDarkTheme ? theme.textSecondary : theme.textMuted, // Subtitle color
      fontSize: 12,
    },
    transactionsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 24,
      marginTop: 20,
      marginBottom: 16,
    },
    seeAllText: {
      color: theme.accent,
      fontSize: 14,
      fontWeight: "600",
    },
    transactionCard: {
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
      backgroundColor: theme.surfaceSecondary,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    transactionIconColor: {
      color: theme.accent, // Default icon color
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
      fontSize: 13,
      marginBottom: 3,
    },
    transactionType: {
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
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
      minWidth: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusText: {
      color: theme.primary,
      fontSize: 11,
      fontWeight: "700",
      textAlign: 'center',
    },
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
    skeletonButton: {
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 12,
      height: 44,
    },
    skeletonQuickActionCard: {
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      padding: 20,
      width: (width - 72) / 2,
      marginBottom: 16,
      alignItems: "center",
      height: 120,
    },
    skeletonPendingCard: {
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      height: 72,
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

  // Dashboard Skeleton Component
  const DashboardSkeleton = () => (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />
      
      {/* Fixed Header Skeleton */}
      <View style={styles.fixedHeader}>
        <View style={styles.headerContent}>
          <View>
            <View style={[styles.skeletonText, { width: 80, height: 14, marginBottom: 4 }]} />
            <View style={[styles.skeletonText, { width: 120, height: 24 }]} />
          </View>
          <View style={[styles.notificationButton, { backgroundColor: theme.surfaceSecondary, borderRadius: 20, width: 32, height: 32 }]} />
        </View>
      </View>

      <FlatList
        data={[1, 2, 3, 4, 5]} // Dummy data for skeleton items
        keyExtractor={(item) => item.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListHeaderComponent={() => (
          <View>
            {/* Balance Card Skeleton */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <View style={[styles.skeletonText, { width: 100, height: 14 }]} />
                <View style={[styles.skeletonText, { width: 20, height: 20, borderRadius: 10 }]} />
              </View>
              <View style={[styles.skeletonText, { width: 150, height: 32, marginBottom: 20 }]} />
              <View style={styles.actionButtonsContainer}>
                <View style={[styles.skeletonButton, { flex: 1, marginRight: 5 }]} />
                {/* <View style={[styles.skeletonButton, { flex: 1, marginHorizontal: 5, position: 'relative' }]}>
                  <View style={[styles.fundIconContainer, { backgroundColor: theme.surfaceSecondary }]}>
                    <View style={{ width: 30, height: 30, backgroundColor: theme.surfaceSecondary, borderRadius: 15 }} />
                  </View>
                </View> */}
              </View>
            </View>

            {/* Quick Actions Skeleton */}
            <View style={styles.quickActionsContainer}>
              <View style={[styles.skeletonText, { width: 120, height: 18, marginBottom: 16 }]} />
              <View style={styles.quickActionsGrid}>
                <View style={styles.skeletonQuickActionCard} />
                <View style={styles.skeletonQuickActionCard} />
              </View>
            </View>

            {/* Pending Actions Skeleton */}
            {/* <View style={styles.pendingContainer}>
              <View style={[styles.skeletonText, { width: 140, height: 18, marginBottom: 16 }]} />
              <View style={styles.skeletonPendingCard} />
            </View> */}

            {/* Transactions Header Skeleton */}
            {/* <View style={styles.transactionsHeader}>
              <View style={[styles.skeletonText, { width: 160, height: 18 }]} />
              <View style={[styles.skeletonText, { width: 60, height: 14 }]} />
            </View> */}
          </View>
        )}
        renderItem={() => (
          <View style={styles.skeletonTransactionCard} />
        )}
      />
    </View>
  )

  if (loading) {
    return <DashboardSkeleton />
  }

  const renderHeaderContent = () => (
    <>
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.greeting}>
            Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"}
          </Text>
          <Text style={styles.username}>
            {loading ? "Loading..." : profile?.full_name || "User"}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("NotificationsScreen")} style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color={theme.text} />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

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
            <Ionicons name={balanceVisible ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.balanceAmount}>
          {balanceVisible ? `₦${profile?.balance?.toLocaleString() || "0.00"}` : "₦ ****"}
        </Text>
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("Withdraw")}>
            <Text style={styles.actionButtonText}>Withdraw</Text>
            <Ionicons name="arrow-forward" size={16} style={styles.actionButtonIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("Wallet")}>
            <Text style={styles.actionButtonText}>My Wallet</Text>
            <Ionicons name="wallet" size={16} style={styles.actionButtonIcon} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fundIconContainer}
            onPress={() => navigation.navigate("FundWallet")}
          >
            <Ionicons name="add-circle" size={35} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate("SellGiftcard")}>
            <View style={styles.quickActionIcon}>
              <MaterialIcons name="credit-card" size={24} style={styles.quickActionIconColor} />
            </View>
            <Text style={styles.quickActionTitle}>Sell Gift Card</Text>
            <Text style={styles.quickActionSubtitle}>Convert cards to cash</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate("BuyGiftcard")}>
            <View style={styles.quickActionIcon}>
              <MaterialIcons name="shopping-cart" size={24} style={styles.quickActionIconColor} />
            </View>
            <Text style={styles.quickActionTitle}>Buy Gift Card</Text>
            <Text style={styles.quickActionSubtitle}>Convert cash to cards</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pending Actions */}
      {!profile?.transaction_pin && (
        <View style={styles.pendingContainer}>
          <Text style={styles.sectionTitle}>Action Required</Text>
          <TouchableOpacity style={styles.pendingActionCard} onPress={() => navigation.navigate("TransactionPin")}>
            <View style={styles.pendingIcon}>
              <Ionicons name="shield-checkmark" size={20} style={styles.pendingIconColor} />
            </View>
            <View style={styles.pendingContent}>
              <Text style={styles.pendingTitle}>Set up Transaction PIN</Text>
              <Text style={styles.pendingSubtitle}>Go to Profile to create your PIN</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Recent Transactions Header */}
      <View style={styles.transactionsHeader}>
        <Text style={styles.sectionTitles}>Recent Transactions</Text>
        <View>
        <TouchableOpacity onPress={() => navigation.navigate("Transactions")}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
        </View>
      </View>
    </>
  )

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />

      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>
              Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"}
            </Text>
          <Text style={styles.username}>
            {loading ? "Loading..." : profile?.full_name || "User"}
          </Text>
          </View>
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
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.displayId}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => navigation.navigate("TransactionDetails", { transaction: item })}
            activeOpacity={0.8}
          >
            <View style={styles.transactionCard}>
              <View style={styles.transactionLeft}>
                <View style={[styles.transactionIcon, { backgroundColor: item.iconColor }]}>
                  {item.originalType === "withdrawal" || item.originalType.startsWith("crypto_") ? (
                    <Ionicons name={item.icon} size={22} color={theme.primary} />
                  ) : (
                    <MaterialIcons name={item.icon} size={22} color={theme.primary} />
                  )}
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionBrand} numberOfLines={1}>
                    {item.displayBrand}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatDate(item.displayDate)}
                  </Text>
                  <Text style={styles.transactionType} numberOfLines={1}>
                    {item.displayType}
                  </Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text style={styles.transactionAmount}>
                  ₦{item.displayAmount?.toLocaleString()}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        item.displayStatus === "rejected"
                          ? theme.error
                          : item.displayStatus === "pending"
                            ? theme.warning
                            : theme.success,
                    },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {item.displayStatus?.charAt(0).toUpperCase() + item.displayStatus?.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <>
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
                {balanceVisible ? `₦${profile?.balance?.toLocaleString() || "0.00"}` : "₦ ****"}
              </Text>
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("Withdraw")}>
                  <Text style={styles.actionButtonText}>Withdraw</Text>
                  <Ionicons name="arrow-forward" size={16} style={styles.actionButtonIcon} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("Wallet")}>
                  <Text style={styles.actionButtonText}>My Wallet</Text>
                  <Ionicons name="wallet" size={16} style={styles.actionButtonIcon} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.fundIconContainer}
                  onPress={() => navigation.navigate("FundWallet")}
                >
                  <Ionicons name="add-circle" size={30} color={theme.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsContainer}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate("SellGiftcard")}>
                  <View style={styles.quickActionIcon}>
                    <MaterialIcons name="credit-card" size={24} style={styles.quickActionIconColor} />
                  </View>
                  <Text style={styles.quickActionTitle}>Sell Gift Card</Text>
                  <Text style={styles.quickActionSubtitle}>Convert cards to cash</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate("BuyGiftcard")}>
                  <View style={styles.quickActionIcon}>
                    <MaterialIcons name="shopping-cart" size={24} style={styles.quickActionIconColor} />
                  </View>
                  <Text style={styles.quickActionTitle}>Buy Gift Card</Text>
                  <Text style={styles.quickActionSubtitle}>Convert cash to cards</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Pending Actions */}
            {!profile?.transaction_pin && (
              <View style={styles.pendingContainer}>
                <Text style={styles.sectionTitle}>Action Required</Text>
                <TouchableOpacity style={styles.pendingActionCard} onPress={() => navigation.navigate("TransactionPin")}>
                  <View style={styles.pendingIcon}>
                    <Ionicons name="shield-checkmark" size={20} style={styles.pendingIconColor} />
                  </View>
                  <View style={styles.pendingContent}>
                    <Text style={styles.pendingTitle}>Set up Transaction PIN</Text>
                    <Text style={styles.pendingSubtitle}>Go to Profile to create your PIN</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Recent Transactions Header */}
            <View style={styles.transactionsHeader}>
              <Text style={styles.sectionTitles}>Recent Transactions</Text>
              <View>
              <TouchableOpacity onPress={() => navigation.navigate("Transactions")}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={theme.textMuted} />
            <Text style={styles.emptyStateText}>No transactions yet</Text>
            <Text style={styles.emptyStateSubtext}>Your transaction history will appear here</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchData}
            tintColor={theme.accent} // Color of the refresh indicator
            colors={[theme.accent]} // Android specific
            progressBackgroundColor={theme.surface} // Android specific
          />
        }
      />
    </View>
  )
}
