// "use client"

// import React, { useEffect, useState } from "react"
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ActivityIndicator,
//   FlatList,
//   StatusBar,
//   Dimensions,
// } from "react-native"
// import { supabase } from "./supabaseClient"
// import { MaterialIcons, Ionicons, FontAwesome } from "@expo/vector-icons"
// import { useNavigation, useFocusEffect } from "@react-navigation/native"
// import AsyncStorage from "@react-native-async-storage/async-storage"
// import { LinearGradient } from "expo-linear-gradient"
// import { useTheme } from "./ThemeContext" // Assuming ThemeContext is available

// const { width } = Dimensions.get("window")

// export default function Dashboard() {
//   const [profile, setProfile] = useState(null)
//   const [transactions, setTransactions] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [balanceLoading, setBalanceLoading] = useState(false) // Not used in provided code, but kept for consistency
//   const [balanceVisible, setBalanceVisible] = useState(true)
//   const [unreadCount, setUnreadCount] = useState(0)
//   const navigation = useNavigation()
//   const { theme } = useTheme() // Assuming ThemeContext is available

//   const fetchProfileAndBalance = async () => {
//     setBalanceLoading(true)
//     const {
//       data: { user },
//     } = await supabase.auth.getUser()
//     if (user) {
//       const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
//       setProfile(profileData)
//     }
//     setBalanceLoading(false)
//   }

//   const formatDate = (dateStr) => {
//     if (!dateStr) return ""
//     const d = new Date(dateStr)
//     return d.toLocaleString(undefined, {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//       hour12: true,
//     })
//   }

//   useFocusEffect(
//     React.useCallback(() => {
//       const fetchData = async () => {
//         setLoading(true)
//         const {
//           data: { user },
//         } = await supabase.auth.getUser()

//         if (user) {
//           // Fetch profile
//           const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
//           setProfile(profileData)

//           // Fetch gift card transactions (sell and buy)
//           const { data: giftcardTxs, error: giftcardError } = await supabase
//             .from("giftcard_transactions")
//             .select(
//               `
//               *,
//               sell_brand:sell_brand_id (name, image_url),
//               sell_variant:sell_variant_id (name, sell_rate),
//               buy_brand:buy_brand_id (name, image_url),
//               buy_item:buy_item_id (variant_name, value, rate)
//             `,
//             )
//             .eq("user_id", user.id)
//             .in("type", ["sell", "buy"]) // Ensure we only get sell/buy types
//             .order("created_at", { ascending: false })
//             .limit(5) // Fetch more than 5 to sort all together later

//           if (giftcardError) console.error("Error fetching giftcard transactions:", giftcardError)

//           // Fetch withdrawals
//           const { data: withdrawals, error: withdrawalsError } = await supabase
//             .from("withdrawals")
//             .select("*")
//             .eq("user_id", user.id)
//             .order("created_at", { ascending: false })
//             .limit(5) // Fetch more than 5 to sort all together later

//           if (withdrawalsError) console.error("Error fetching withdrawals:", withdrawalsError)

//           // Fetch crypto transactions (deposits and withdrawals)
//           const { data: cryptoTxs, error: cryptoError } = await supabase
//             .from("crypto_transactions")
//             .select(
//               `
//               *,
//               crypto_network:crypto_network_id (
//                 name,
//                 crypto:crypto_id (name, symbol, image_url)
//               )
//             `,
//             )
//             .eq("user_id", user.id)
//             .order("created_at", { ascending: false })
//             .limit(5) // Fetch more than 5 to sort all together later

//           if (cryptoError) console.error("Error fetching crypto transactions:", cryptoError)

//           // Fetch unread notifications count
//           const { count } = await supabase
//             .from("notifications")
//             .select("id", { count: "exact", head: true })
//             .eq("user_id", user.id)
//             .eq("read", false)
//           setUnreadCount(count || 0)

//           // Combine all transactions and normalize their structure
//           const allCombinedTxs = []

//           // Gift Card Transactions
//           ;(giftcardTxs || []).forEach((tx) => {
//             const isSell = tx.type === "sell"
//             const brandName = isSell ? tx.sell_brand?.name : tx.buy_brand?.name
//             const variantName = isSell ? tx.sell_variant?.name : tx.buy_item?.variant_name
//             const amountDisplay = tx.total?.toLocaleString() || tx.amount?.toLocaleString() || "0.00"

//             allCombinedTxs.push({
//               ...tx,
//               originalType: tx.type, // Store original type for TransactionDetailsScreen
//               displayType: isSell ? "Sell Gift Card" : "Buy Gift Card",
//               displayAmount: amountDisplay,
//               displayBrand: brandName || "Gift Card",
//               displayStatus: tx.status,
//               displayDate: tx.created_at,
//               displayId: `gc-${tx.id}`, // Unique ID for FlatList key
//               icon: isSell ? "credit-card" : "shopping-cart", // MaterialIcons
//               iconColor: "#7965C1",
//             })
//           })

//           // Withdrawals
//           ;(withdrawals || []).forEach((tx) => {
//             allCombinedTxs.push({
//               ...tx,
//               originalType: "withdrawal", // Store original type
//               displayType: "Withdrawal",
//               displayAmount: tx.amount?.toLocaleString() || "0.00",
//               displayBrand: "Wallet Withdrawal",
//               displayStatus: tx.status,
//               displayDate: tx.created_at,
//               displayId: `wd-${tx.id}`, // Unique ID for FlatList key
//               icon: "arrow-up", // Ionicons
//               iconColor: "#E3D095",
//             })
//           })

//           // Crypto Transactions (Deposits and Withdrawals)
//           ;(cryptoTxs || []).forEach((tx) => {
//             const isDeposit = tx.type === "deposit"
//             const cryptoSymbol = tx.crypto_symbol || tx.crypto_network?.crypto?.symbol || "CRYPTO"
//             const networkName = tx.network_name || tx.crypto_network?.name || "Network"
//             const amountDisplay = tx.fiat_equivalent_naira?.toLocaleString() || "0.00"

//             allCombinedTxs.push({
//               ...tx,
//               originalType: `crypto_${tx.type}`, // e.g., 'crypto_deposit', 'crypto_withdrawal'
//               displayType: isDeposit ? `Crypto Deposit (${cryptoSymbol})` : `Crypto Withdrawal (${cryptoSymbol})`,
//               displayAmount: amountDisplay,
//               displayBrand: `${cryptoSymbol} (${networkName})`,
//               displayStatus: tx.status,
//               displayDate: tx.created_at,
//               displayId: `crypto-${tx.id}`, // Unique ID for FlatList key
//               icon: isDeposit ? "arrow-down" : "arrow-up", // Ionicons
//               iconColor: isDeposit ? "#00b894" : "#e17055", // Green for deposit, red for withdrawal
//             })
//           })

//           // Sort all transactions by date and get the latest 5
//           const sortedAndLimitedTxs = allCombinedTxs
//             .sort((a, b) => new Date(b.displayDate) - new Date(a.displayDate))
//             .slice(0, 5)

//           setTransactions(sortedAndLimitedTxs)
//         }
//         setLoading(false)
//       }
//       fetchData()
//       // No need to setBalanceVisible(false) here, it's handled by useEffect below
//     }, [navigation]),
//   )

//   useEffect(() => {
//     const loadBalanceVisibility = async () => {
//       try {
//         const stored = await AsyncStorage.getItem("balanceVisible")
//         if (stored !== null) setBalanceVisible(stored === "true")
//       } catch (e) {
//         console.error("Failed to load balance visibility:", e)
//       }
//     }
//     loadBalanceVisibility()
//   }, [])

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <StatusBar barStyle="light-content" backgroundColor="#0E2148" />
//         <ActivityIndicator size="large" color="#7965C1" />
//       </View>
//     )
//   }

//   const renderHeader = () => (
//     <>
//       <LinearGradient colors={["#0E2148", "#483AA0"]} style={styles.headerGradient}>
//         <StatusBar barStyle="light-content" backgroundColor="#0E2148" />
//         {/* Header */}
//         <View style={styles.header}>
//           <View>
//             <Text style={styles.greeting}>
//               Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"}
//             </Text>
//             <Text style={styles.username}>{profile?.full_name || "User"}</Text>
//           </View>
//           <TouchableOpacity
//             onPress={() => navigation.navigate("NotificationsScreen")}
//             style={styles.notificationButton}
//           >
//             <Ionicons name="notifications-outline" size={24} color="#fff" />
//             {unreadCount > 0 && (
//               <View style={styles.notificationBadge}>
//                 <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
//               </View>
//             )}
//           </TouchableOpacity>
//         </View>
//         {/* Balance Card */}
//         <View style={styles.balanceCard}>
//           <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.balanceGradient}>
//             <View style={styles.balanceHeader}>
//               <Text style={styles.balanceLabel}>Available Balance</Text>
//               <TouchableOpacity
//                 onPress={async () => {
//                   setBalanceVisible((v) => {
//                     AsyncStorage.setItem("balanceVisible", (!v).toString())
//                     return !v
//                   })
//                 }}
//               >
//                 <Ionicons
//                   name={balanceVisible ? "eye-off-outline" : "eye-outline"}
//                   size={20}
//                   color="rgba(255,255,255,0.8)"
//                 />
//               </TouchableOpacity>
//             </View>
//             <Text style={styles.balanceAmount}>
//               {balanceVisible ? `₦${profile?.balance?.toLocaleString() || "0.00"}` : "₦ ****"}
//             </Text>
//             <TouchableOpacity style={styles.withdrawButton} onPress={() => navigation.navigate("Withdraw")}>
//               <Text style={styles.withdrawButtonText}>Withdraw Funds</Text>
//               <Ionicons name="arrow-forward" size={16} color="#7965C1" />
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.walletButton} onPress={() => navigation.navigate("Wallet")}>
//               <Text style={styles.walletButtonText}>My Wallet</Text>
//               <Ionicons name="wallet" size={16} color="#7965C1" />
//             </TouchableOpacity>
//           </LinearGradient>
//         </View>
//       </LinearGradient>
//       {/* Quick Actions */}
//       <View style={styles.quickActionsContainer}>
//         <Text style={styles.sectionTitle}>Quick Actions</Text>
//         <View style={styles.quickActions}>
//           <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate("SellGiftcard")}>
//             <View style={styles.quickActionIcon}>
//               <MaterialIcons name="credit-card" size={24} color="#7965C1" />
//             </View>
//             <Text style={styles.quickActionTitle}>Sell Gift Card</Text>
//             <Text style={styles.quickActionSubtitle}>Convert cards to cash</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate("BuyGiftcard")}>
//             <View style={styles.quickActionIcon}>
//               <MaterialIcons name="shopping-cart" size={24} color="#7965C1" />
//             </View>
//             <Text style={styles.quickActionTitle}>Buy Gift Card</Text>
//             <Text style={styles.quickActionSubtitle}>Convert cash to cards</Text>
//           </TouchableOpacity>
//         </View>
//         {/* New Quick Actions for Crypto */}
//         {/* <View style={styles.quickActions}>
//           <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate("CryptoDeposit")}>
//             <View style={styles.quickActionIcon}>
//               <FontAwesome name="bitcoin" size={24} color="#7965C1" />
//             </View>
//             <Text style={styles.quickActionTitle}>Deposit Crypto</Text>
//             <Text style={styles.quickActionSubtitle}>Fund wallet with crypto</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate("CryptoWithdrawal")}>
//             <View style={styles.quickActionIcon}>
//               <FontAwesome name="dollar" size={24} color="#7965C1" />
//             </View>
//             <Text style={styles.quickActionTitle}>Withdraw Crypto</Text>
//             <Text style={styles.quickActionSubtitle}>Withdraw to crypto address</Text>
//           </TouchableOpacity>
//         </View> */}
//       </View>
//       {/* Pending Actions */}
//       {!profile?.transaction_pin && (
//         <View style={styles.pendingContainer}>
//           <Text style={styles.sectionTitle}>Action Required</Text>
//           <TouchableOpacity style={styles.pendingActionCard} onPress={() => navigation.navigate("Profile")}>
//             <View style={styles.pendingIcon}>
//               <Ionicons name="shield-checkmark" size={20} color="#E3D095" />
//             </View>
//             <View style={styles.pendingContent}>
//               <Text style={styles.pendingTitle}>Set up Transaction PIN</Text>
//               <Text style={styles.pendingSubtitle}>Go to Profile to create your PIN</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={20} color="#7965C1" />
//           </TouchableOpacity>
//         </View>
//       )}
//       {/* Recent Transactions Header */}
//       <View style={styles.transactionsHeader}>
//         <Text style={styles.sectionTitle}>Recent Transactions</Text>
//         <TouchableOpacity onPress={() => navigation.navigate("Transactions")}>
//           <Text style={styles.seeAllText}>See All</Text>
//         </TouchableOpacity>
//       </View>
//     </>
//   )

//   return (
//     <FlatList
//       data={transactions} // Use the already limited and sorted transactions
//       keyExtractor={(item) => item.displayId}
//       renderItem={({ item }) => (
//         <TouchableOpacity onPress={() => navigation.navigate("TransactionDetails", { transaction: item })}>
//           <View style={[styles.transactionCard, { backgroundColor: theme.surface }]}>
//             <View style={styles.transactionLeft}>
//               <View
//                 style={[
//                   styles.transactionIcon,
//                   {
//                     backgroundColor: item.iconColor, // Use dynamic color
//                   },
//                 ]}
//               >
//                 {item.originalType === "withdrawal" ? (
//                   <Ionicons name={item.icon} size={20} color="#0E2148" />
//                 ) : item.originalType === "sell" || item.originalType === "buy" ? (
//                   <MaterialIcons name={item.icon} size={20} color="#0E2148" />
//                 ) : (
//                   <Ionicons name={item.icon} size={20} color="#0E2148" /> // For crypto, use Ionicons
//                 )}
//               </View>
//               <View style={styles.transactionDetails}>
//                 <Text style={[styles.transactionBrand, { color: theme.text }]}>{item.displayBrand}</Text>
//                 <Text style={[styles.transactionDate, { color: theme.textMuted }]}>{formatDate(item.displayDate)}</Text>
//                 <Text style={[styles.transactionType, { color: theme.textMuted }]}>{item.displayType}</Text>
//               </View>
//             </View>
//             <View style={styles.transactionRight}>
//               <Text style={[styles.transactionAmount, { color: theme.text }]}>
//                 ₦{item.displayAmount?.toLocaleString()}
//               </Text>
//               <View
//                 style={[
//                   styles.statusBadge,
//                   {
//                     backgroundColor:
//                       item.displayStatus === "rejected"
//                         ? "#ff6b6b"
//                         : item.displayStatus === "pending"
//                           ? "#ffa726"
//                           : "#4caf50",
//                   },
//                 ]}
//               >
//                 <Text style={styles.statusText}>
//                   {item.displayStatus?.charAt(0).toUpperCase() + item.displayStatus?.slice(1)}
//                 </Text>
//               </View>
//             </View>
//           </View>
//         </TouchableOpacity>
//       )}
//       ListEmptyComponent={
//         <View style={styles.emptyState}>
//           <Ionicons name="receipt-outline" size={48} color="rgba(255,255,255,0.3)" />
//           <Text style={[styles.emptyStateText, { color: theme.text }]}>No transactions yet</Text>
//           <Text style={[styles.emptyStateSubtext, { color: theme.textMuted }]}>
//             Your transaction history will appear here
//           </Text>
//         </View>
//       }
//       ListHeaderComponent={renderHeader}
//       contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
//       showsVerticalScrollIndicator={false}
//     />
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: "#0E2148",
//     paddingBottom: 32,
//   },
//   loadingContainer: {
//     flex: 1,
//     backgroundColor: "#0E2148",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   headerGradient: {
//     paddingBottom: 24,
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 24,
//     paddingTop: 40,
//     marginBottom: 24,
//   },
//   greeting: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 14,
//     marginBottom: 4,
//   },
//   username: {
//     color: "#fff",
//     fontSize: 24,
//     fontWeight: "bold",
//   },
//   notificationButton: {
//     position: "relative",
//     padding: 8,
//   },
//   notificationBadge: {
//     position: "absolute",
//     top: 4,
//     right: 4,
//     backgroundColor: "#ff6b6b",
//     borderRadius: 10,
//     minWidth: 20,
//     height: 20,
//     justifyContent: "center",
//     alignItems: "center",
//     borderWidth: 2,
//     borderColor: "#0E2148",
//   },
//   notificationBadgeText: {
//     color: "#fff",
//     fontSize: 10,
//     fontWeight: "bold",
//   },
//   balanceCard: {
//     marginHorizontal: 24,
//     borderRadius: 20,
//     overflow: "hidden",
//     elevation: 8,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//   },
//   balanceGradient: {
//     padding: 24,
//   },
//   balanceHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 8,
//   },
//   balanceLabel: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 14,
//   },
//   balanceAmount: {
//     color: "#fff",
//     fontSize: 32,
//     fontWeight: "bold",
//     marginBottom: 20,
//   },
//   withdrawButton: {
//     backgroundColor: "#E3D095",
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 12,
//     paddingHorizontal: 24,
//     borderRadius: 12,
//   },
//   withdrawButtonText: {
//     color: "#0E2148",
//     fontSize: 16,
//     fontWeight: "bold",
//     marginRight: 8,
//   },
//   walletButton: {
//     backgroundColor: "rgba(227, 208, 149, 0.1)",
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 12,
//     paddingHorizontal: 24,
//     borderRadius: 12,
//     marginTop: 10,
//   },
//   walletButtonText: {
//     color: "#7965C1",
//     fontSize: 16,
//     fontWeight: "bold",
//     marginRight: 8,
//   },
//   quickActionsContainer: {
//     paddingHorizontal: 24,
//     marginTop: 32,
//   },
//   sectionTitle: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//     marginBottom: 16,
//   },
//   quickActions: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 16, // Added margin for spacing between rows of quick actions
//   },
//   quickActionCard: {
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 16,
//     padding: 20,
//     width: (width - 64) / 2,
//     borderWidth: 1,
//     borderColor: "rgba(227, 208, 149, 0.2)",
//   },
//   quickActionIcon: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: "rgba(227, 208, 149, 0.2)",
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   quickActionTitle: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "bold",
//     marginBottom: 4,
//   },
//   quickActionSubtitle: {
//     color: "rgba(255,255,255,0.7)",
//     fontSize: 12,
//   },
//   pendingContainer: {
//     paddingHorizontal: 24,
//     marginTop: 32,
//   },
//   pendingActionCard: {
//     backgroundColor: "rgba(227, 208, 149, 0.1)",
//     borderRadius: 16,
//     padding: 16,
//     flexDirection: "row",
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "rgba(227, 208, 149, 0.3)",
//   },
//   pendingIcon: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: "rgba(227, 208, 149, 0.2)",
//     justifyContent: "center",
//     alignItems: "center",
//     marginRight: 12,
//   },
//   pendingContent: {
//     flex: 1,
//   },
//   pendingTitle: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "bold",
//     marginBottom: 2,
//   },
//   pendingSubtitle: {
//     color: "rgba(255,255,255,0.7)",
//     fontSize: 12,
//   },
//   transactionsHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 24,
//     marginTop: 32,
//     marginBottom: 16,
//   },
//   seeAllText: {
//     color: "#7965C1",
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   transactionCard: {
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 16,
//     padding: 16,
//     marginHorizontal: 24,
//     marginBottom: 12,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.1)",
//   },
//   transactionLeft: {
//     flexDirection: "row",
//     alignItems: "center",
//     flex: 1,
//   },
//   transactionIcon: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     justifyContent: "center",
//     alignItems: "center",
//     marginRight: 12,
//   },
//   transactionDetails: {
//     flex: 1,
//   },
//   transactionBrand: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "bold",
//     marginBottom: 2,
//   },
//   transactionDate: {
//     color: "rgba(255,255,255,0.6)",
//     fontSize: 12,
//     marginBottom: 2,
//   },
//   transactionType: {
//     color: "rgba(255,255,255,0.5)",
//     fontSize: 11,
//   },
//   transactionRight: {
//     alignItems: "flex-end",
//   },
//   transactionAmount: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "bold",
//     marginBottom: 4,
//   },
//   statusBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 8,
//   },
//   statusText: {
//     color: "#fff",
//     fontSize: 10,
//     fontWeight: "bold",
//   },
//   emptyState: {
//     alignItems: "center",
//     paddingVertical: 40,
//     paddingHorizontal: 24,
//   },
//   emptyStateText: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 18,
//     fontWeight: "bold",
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   emptyStateSubtext: {
//     color: "rgba(255,255,255,0.5)",
//     fontSize: 14,
//     textAlign: "center",
//   },
//   emptyText: {
//     textAlign: "center",
//     marginTop: 16,
//   },
//   txType: {
//     fontSize: 12,
//     marginTop: 2,
//   },
//   contentContainer: {
//     paddingBottom: 32,
//   },
// })







"use client"
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
        // Fetch profile
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        setProfile(profileData)

        // Fetch gift card transactions (sell and buy)
        const { data: giftcardTxs, error: giftcardError } = await supabase
          .from("giftcard_transactions")
          .select(
            `
            *,
            sell_brand:sell_brand_id (name, image_url),
            sell_variant:sell_variant_id (name, sell_rate),
            buy_brand:buy_brand_id (name, image_url),
            buy_item:buy_item_id (variant_name, value, rate)
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
        ;(giftcardTxs || []).forEach((tx) => {
          const isSell = tx.type === "sell"
          const brandName = isSell ? tx.sell_brand?.name : tx.buy_brand?.name
          const variantName = isSell ? tx.sell_variant?.name : tx.buy_item?.variant_name
          const amountDisplay = tx.total?.toLocaleString() || tx.amount?.toLocaleString() || "0.00"
          allCombinedTxs.push({
            ...tx,
            originalType: tx.type,
            displayType: isSell ? "Sell Gift Card" : "Buy Gift Card",
            displayAmount: amountDisplay,
            displayBrand: brandName || "Gift Card",
            displayStatus: tx.status,
            displayDate: tx.created_at,
            displayId: `gc-${tx.id}`,
            icon: isSell ? "credit-card" : "shopping-cart", // MaterialIcons
            iconColor: theme.secondary, // Use theme color
          })
        })
        // Withdrawals
        ;(withdrawals || []).forEach((tx) => {
          allCombinedTxs.push({
            ...tx,
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
    loadingContainer: {
      flex: 1,
      backgroundColor: theme.background,
      justifyContent: "center",
      alignItems: "center",
    },
    // Fixed Header Styles
    fixedHeader: {
      backgroundColor: theme.primary, // Solid primary color for header
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
      paddingLeft: 8,
    },
    notificationBadge: {
      position: "absolute",
      top: 4,
      right: 4,
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
    quickActionsContainer: {
      paddingHorizontal: 24,
      marginTop: 0,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 16,
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
      marginTop: 32,
    },
    pendingActionCard: {
      backgroundColor: theme.warning, // Use warning color for pending actions
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
      marginTop: 0,
      marginBottom: 0,
    },
    seeAllText: {
      color: theme.accent,
      fontSize: 14,
      fontWeight: "600",
    },
    transactionCard: {
      backgroundColor: theme.surface, // Use surface for transaction cards
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 15,
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
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
      backgroundColor: theme.surfaceSecondary, // Icon background
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
      fontWeight: "bold",
      marginBottom: 2,
    },
    transactionDate: {
      color: theme.textMuted,
      fontSize: 12,
      marginBottom: 2,
    },
    transactionType: {
      color: theme.textMuted,
      fontSize: 11,
    },
    transactionRight: {
      alignItems: "flex-end",
    },
    transactionAmount: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 4,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    statusText: {
      color: theme.text, // Text color for status badges
      fontSize: 10,
      fontWeight: "bold",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 40,
      paddingHorizontal: 24,
    },
    emptyStateText: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "bold",
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateSubtext: {
      color: theme.textMuted,
      fontSize: 14,
      textAlign: "center",
    },
  })

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={{ color: theme.text, marginTop: 16 }}>Loading dashboard...</Text>
      </View>
    )
  }

  const renderHeaderContent = () => (
    <>
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.greeting}>
            Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"}
          </Text>
          <Text style={styles.username}>{profile?.full_name || "User"}</Text>
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
          <TouchableOpacity style={styles.pendingActionCard} onPress={() => navigation.navigate("Profile")}>
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
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Transactions")}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
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
            <Text style={styles.username}>{profile?.full_name || "User"}</Text>
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
          <TouchableOpacity onPress={() => navigation.navigate("TransactionDetails", { transaction: item })}>
            <View style={styles.transactionCard}>
              <View style={styles.transactionLeft}>
                <View style={[styles.transactionIcon, { backgroundColor: item.iconColor }]}>
                  {item.originalType === "withdrawal" || item.originalType.startsWith("crypto_") ? (
                    <Ionicons name={item.icon} size={20} color={theme.primary} />
                  ) : (
                    <MaterialIcons name={item.icon} size={20} color={theme.primary} />
                  )}
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionBrand}>{item.displayBrand}</Text>
                  <Text style={styles.transactionDate}>{formatDate(item.displayDate)}</Text>
                  <Text style={styles.transactionType}>{item.displayType}</Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text style={styles.transactionAmount}>₦{item.displayAmount?.toLocaleString()}</Text>
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
                <TouchableOpacity style={styles.pendingActionCard} onPress={() => navigation.navigate("Profile")}>
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
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Transactions")}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
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
