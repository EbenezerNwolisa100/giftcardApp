// import React, { useEffect, useState } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, FlatList } from 'react-native';
// import { supabase } from './supabaseClient';
// import { MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
// import { useNavigation, useFocusEffect } from '@react-navigation/native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import NotificationsScreen from './NotificationsScreen';
// import HottestRatesScreen from './HottestRatesScreen';

// export default function Dashboard() {
//   const [profile, setProfile] = useState(null);
//   const [transactions, setTransactions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [balanceLoading, setBalanceLoading] = useState(false);
//   const [balanceVisible, setBalanceVisible] = useState(true);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const navigation = useNavigation();

//   const fetchProfileAndBalance = async () => {
//     setBalanceLoading(true);
//     const { data: { user } } = await supabase.auth.getUser();
//     if (user) {
//       const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
//       setProfile(profileData);
//     }
//     setBalanceLoading(false);
//   };

//   const formatDate = (dateStr) => {
//     if (!dateStr) return '';
//     const d = new Date(dateStr);
//     return d.toLocaleString(undefined, {
//       year: 'numeric', month: 'short', day: 'numeric',
//       hour: '2-digit', minute: '2-digit', hour12: true
//     });
//   };

//   useFocusEffect(
//     React.useCallback(() => {
//       const fetchData = async () => {
//         setLoading(true);
//         const { data: { user } } = await supabase.auth.getUser();
//         if (user) {
//           const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
//           setProfile(profileData);
//           // Fetch giftcard transactions (buy/sell)
//           const { data: sells } = await supabase
//             .from('giftcard_transactions')
//             .select('id, brand_id, amount, total, status, created_at, brand:giftcard_brands(name, image_url), type')
//             .eq('user_id', user.id)
//             .in('type', ['sell', 'buy']);
//           // Fetch withdrawals
//           const { data: withdrawals } = await supabase
//             .from('withdrawals')
//             .select('id, amount, status, created_at, type')
//             .eq('user_id', user.id);
//           // Fetch unread notifications count
//           const { count } = await supabase
//             .from('notifications')
//             .select('id', { count: 'exact', head: true })
//             .eq('user_id', user.id)
//             .eq('read', false);
//           setUnreadCount(count || 0);
//           // Normalize and merge
//           const sellTxs = (sells || []).map(tx => ({
//             ...tx,
//             txType: tx.type,
//             displayType: tx.type === 'buy' ? 'Buy' : 'Sell',
//             displayAmount: tx.total,
//             displayBrand: tx.brand?.name || 'Gift Card',
//             displayStatus: tx.status,
//             displayDate: tx.created_at,
//             displayId: tx.id,
//           }));
//           const withdrawalTxs = (withdrawals || []).map(tx => ({
//             ...tx,
//             txType: 'withdrawal',
//             displayType: 'Withdrawal',
//             displayAmount: tx.amount,
//             displayBrand: 'Withdrawal',
//             displayStatus: tx.status,
//             displayDate: tx.created_at,
//             displayId: tx.id,
//           }));
//           const allTxs = [...sellTxs, ...withdrawalTxs].sort((a, b) => new Date(b.displayDate) - new Date(a.displayDate)).slice(0, 5);
//           setTransactions(allTxs);
//         }
//         setLoading(false);
//       };
//       fetchData();
//       setBalanceVisible(false);
//     }, [navigation])
//   );

//   // On mount, load balance visibility state from AsyncStorage
//   useEffect(() => {
//     const loadBalanceVisibility = async () => {
//       try {
//         const stored = await AsyncStorage.getItem('balanceVisible');
//         if (stored !== null) setBalanceVisible(stored === 'true');
//       } catch {}
//     };
//     loadBalanceVisibility();
//   }, []);

//   if (loading) {
//     return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator size="large" color="#0984e3" /></View>;
//   }

//   // Header and other sections as a single ListHeaderComponent
//   const renderHeader = () => (
//     <>
//       <View style={styles.header}>
//         <Text style={styles.username}>{profile?.full_name || 'User'}</Text>
//         <TouchableOpacity onPress={() => navigation.navigate('NotificationsScreen')} style={{marginLeft:'auto'}}>
//           <Ionicons name="notifications-outline" size={24} color="#fff" />
//           {unreadCount > 0 && (
//             <View style={{position:'absolute',top:-2,right:-2,width:12,height:12,borderRadius:6,backgroundColor:'#d63031',borderWidth:1,borderColor:'#fff'}} />
//           )}
//         </TouchableOpacity>
//       </View>
//       <Text style={styles.date}>{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
//       <View style={styles.balanceCard}>
//         <Text style={styles.balanceLabel}>Available balance</Text>
//         <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
//           <Text style={styles.balanceAmount}>{balanceVisible ? `₦ ${profile?.balance?.toLocaleString() || '0.00'}` : '₦ ****'}</Text>
//           <TouchableOpacity onPress={async () => {
//             setBalanceVisible(v => {
//               AsyncStorage.setItem('balanceVisible', (!v).toString());
//               return !v;
//             });
//           }} style={{ marginLeft: 10 }}>
//             <Ionicons name={balanceVisible ? 'eye-off-outline' : 'eye-outline'} size={22} color="#fff" />
//           </TouchableOpacity>
//         </View>
//         <TouchableOpacity style={styles.withdrawBtn} onPress={() => navigation.navigate('Withdraw')}><Text style={styles.withdrawText}>Withdraw</Text></TouchableOpacity>
//       </View>
//       <Text style={styles.sectionTitle}>Pending Actions</Text>
//       <TouchableOpacity style={styles.pendingAction} onPress={() => navigation.navigate('TransactionPin')}>
//         <View style={styles.circle} />
//         <Text style={styles.pendingText}>{profile?.transaction_pin ? 'Change Transaction PIN' : 'Create Transaction PIN'}</Text>
//         <MaterialIcons name="chevron-right" size={24} color="#fff" style={{marginLeft:'auto'}} />
//       </TouchableOpacity>
//       <Text style={styles.sectionTitle}>Get started with Traydah</Text>
//       <View style={styles.quickActions}>
//         <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('SellGiftcard')}>
//           <MaterialIcons name="credit-card" size={28} color="#fff" />
//           <Text style={styles.quickActionText}>Sell Gift Card</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('HottestRatesScreen')}>
//           <FontAwesome name="line-chart" size={28} color="#fff" />
//           <Text style={styles.quickActionText}>Hottest Rates</Text>
//         </TouchableOpacity>
//       </View>
//       <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:24,marginBottom:8}}>
//         <Text style={styles.sectionTitle}>Recent Transactions</Text>
//         <TouchableOpacity onPress={() => navigation.navigate('Transactions')}><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
//       </View>
//     </>
//   );

//   return (
//     <FlatList
//       data={transactions}
//       keyExtractor={item => item.displayId}
//       renderItem={({item}) => (
//         <View style={styles.transactionItem}>
//           <View style={{flexDirection:'row',alignItems:'center'}}>
//             <View style={styles.brandIcon}>
//               {item.txType === 'withdrawal' ? (
//                 <View style={{width:32,height:32,backgroundColor:'#fff',borderRadius:8,justifyContent:'center',alignItems:'center'}}>
//                   <Text style={{fontWeight:'bold',fontSize:18,color:'#0984e3'}}>W</Text>
//                 </View>
//               ) : item.brand?.image_url ? (
//                 <View style={{width:32,height:32,backgroundColor:'#fff',borderRadius:8,justifyContent:'center',alignItems:'center'}}>
//                   <Text>{item.brand.name[0]}</Text>
//                 </View>
//               ) : (
//                 <MaterialIcons name="card-giftcard" size={28} color="#fff" />
//               )}
//             </View>
//             <View style={{marginLeft:12}}>
//               <Text style={styles.txBrand}>{item.displayBrand}</Text>
//               <Text style={styles.txDate}>{formatDate(item.displayDate)}</Text>
//             </View>
//           </View>
//           <View style={{alignItems:'flex-end'}}>
//             <Text style={styles.txAmount}>₦{item.displayAmount?.toLocaleString()}</Text>
//             <Text style={[styles.txStatus, item.displayStatus === 'rejected' ? {color:'#d63031'} : item.txType === 'withdrawal' ? {color:'#0984e3'} : {color:'#00b894'}]}>{item.displayStatus?.charAt(0).toUpperCase() + item.displayStatus?.slice(1)}</Text>
//             <Text style={{color:'#b2bec3', fontSize:12, marginTop:2}}>{item.displayType}</Text>
//           </View>
//         </View>
//       )}
//       ListEmptyComponent={<Text style={{color:'#fff',textAlign:'center',marginTop:16}}>No transaction history yet.</Text>}
//       ListHeaderComponent={renderHeader}
//       contentContainerStyle={{ paddingBottom: 32, backgroundColor: '#10182b' }}
//     />
//   );
// }

// const styles = StyleSheet.create({
//   header: { flexDirection: 'row', alignItems: 'center', marginTop: 32, marginBottom: 4, paddingHorizontal: 20 },
//   username: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
//   date: { color: '#b2bec3', fontSize: 14, marginLeft: 20, marginBottom: 12 },
//   balanceCard: { backgroundColor: '#1e2a47', borderRadius: 18, margin: 20, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 6 },
//   balanceLabel: { color: '#b2bec3', fontSize: 15 },
//   balanceAmount: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
//   withdrawBtn: { backgroundColor: '#3b5bfd', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 32, marginTop: 12 },
//   withdrawText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
//   sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 20, marginTop: 18, marginBottom: 8 },
//   pendingAction: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#232e4a', borderRadius: 12, marginHorizontal: 20, padding: 16, marginBottom: 8 },
//   circle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#fff', marginRight: 12 },
//   pendingText: { color: '#fff', fontSize: 15 },
//   quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 8 },
//   quickAction: { backgroundColor: '#232e4a', borderRadius: 12, padding: 20, alignItems: 'center', width: '48%' },
//   quickActionText: { color: '#fff', fontSize: 15, marginTop: 8 },
//   seeAll: { color: '#3b5bfd', fontWeight: 'bold', fontSize: 14 },
//   transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#232e4a', borderRadius: 12, marginHorizontal: 20, padding: 16, marginBottom: 10 },
//   brandIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#3b5bfd', justifyContent: 'center', alignItems: 'center' },
//   txBrand: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
//   txDate: { color: '#b2bec3', fontSize: 13 },
//   txAmount: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
//   txStatus: { fontWeight: 'bold', fontSize: 13, marginTop: 2 },
// }); 








"use client"

import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StatusBar,
  Dimensions,
} from "react-native"
import { supabase } from "./supabaseClient"
import { MaterialIcons, Ionicons, FontAwesome } from "@expo/vector-icons"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { LinearGradient } from "expo-linear-gradient"
import { useTheme } from "./ThemeContext"

const { width } = Dimensions.get("window")

export default function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const navigation = useNavigation()
  const { theme } = useTheme()

  const fetchProfileAndBalance = async () => {
    setBalanceLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      setProfile(profileData)
    }
    setBalanceLoading(false)
  }

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

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        setLoading(true)
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
          setProfile(profileData)

          const { data: sells } = await supabase
            .from("giftcard_transactions")
            .select("id, brand_id, amount, total, status, created_at, brand:giftcard_brands(name, image_url), type")
            .eq("user_id", user.id)
            .in("type", ["sell", "buy"])

          const { data: withdrawals } = await supabase
            .from("withdrawals")
            .select("id, amount, status, created_at, type")
            .eq("user_id", user.id)

          const { count } = await supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("read", false)
          setUnreadCount(count || 0)

          const sellTxs = (sells || []).map((tx) => ({
            ...tx,
            txType: tx.type,
            displayType: tx.type === "buy" ? "Buy" : "Sell",
            displayAmount: tx.total,
            displayBrand: tx.brand?.name || "Gift Card",
            displayStatus: tx.status,
            displayDate: tx.created_at,
            displayId: tx.id,
          }))

          const withdrawalTxs = (withdrawals || []).map((tx) => ({
            ...tx,
            txType: "withdrawal",
            displayType: "Withdrawal",
            displayAmount: tx.amount,
            displayBrand: "Withdrawal",
            displayStatus: tx.status,
            displayDate: tx.created_at,
            displayId: tx.id,
          }))

          const allTxs = [...sellTxs, ...withdrawalTxs]
            .sort((a, b) => new Date(b.displayDate) - new Date(a.displayDate))
            .slice(0, 5)
          setTransactions(allTxs)
        }
        setLoading(false)
      }
      fetchData()
      setBalanceVisible(false)
    }, [navigation]),
  )

  useEffect(() => {
    const loadBalanceVisibility = async () => {
      try {
        const stored = await AsyncStorage.getItem("balanceVisible")
        if (stored !== null) setBalanceVisible(stored === "true")
      } catch {}
    }
    loadBalanceVisibility()
  }, [])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0E2148" />
        <ActivityIndicator size="large" color="#7965C1" />
      </View>
    )
  }

  const renderHeader = () => (
    <>
      <LinearGradient colors={["#0E2148", "#483AA0"]} style={styles.headerGradient}>
        <StatusBar barStyle="light-content" backgroundColor="#0E2148" />

        {/* Header */}
      <View style={styles.header}>
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
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
      </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.balanceGradient}>
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
                  color="rgba(255,255,255,0.8)"
                />
              </TouchableOpacity>
      </View>
            <Text style={styles.balanceAmount}>
              {balanceVisible ? `₦${profile?.balance?.toLocaleString() || "0.00"}` : "₦ ****"}
            </Text>
            <TouchableOpacity style={styles.withdrawButton} onPress={() => navigation.navigate("Withdraw")}>
              <Text style={styles.withdrawButtonText}>Withdraw Funds</Text>
              <Ionicons name="arrow-forward" size={16} color="#7965C1" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.walletButton} onPress={() => navigation.navigate("Wallet")}>
              <Text style={styles.walletButtonText}>My Wallet</Text>
              <Ionicons name="wallet" size={16} color="#7965C1" />
      </TouchableOpacity>
          </LinearGradient>
        </View>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate("SellGiftcard")}>
            <View style={styles.quickActionIcon}>
              <MaterialIcons name="credit-card" size={24} color="#7965C1" />
            </View>
            <Text style={styles.quickActionTitle}>Sell Gift Card</Text>
            <Text style={styles.quickActionSubtitle}>Convert cards to cash</Text>
        </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard} onPress={() => navigation.navigate("HottestRatesScreen")}>
            <View style={styles.quickActionIcon}>
              <FontAwesome name="line-chart" size={24} color="#7965C1" />
            </View>
            <Text style={styles.quickActionTitle}>Hottest Rates</Text>
            <Text style={styles.quickActionSubtitle}>Check current rates</Text>
        </TouchableOpacity>
        </View>
      </View>

      {/* Pending Actions */}
      {!profile?.transaction_pin && (
        <View style={styles.pendingContainer}>
          <Text style={styles.sectionTitle}>Action Required</Text>
          <TouchableOpacity style={styles.pendingActionCard} onPress={() => navigation.navigate("Profile")}>
            <View style={styles.pendingIcon}>
              <Ionicons name="shield-checkmark" size={20} color="#E3D095" />
            </View>
            <View style={styles.pendingContent}>
              <Text style={styles.pendingTitle}>Set up Transaction PIN</Text>
              <Text style={styles.pendingSubtitle}>Go to Profile to create your PIN</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#7965C1" />
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
      <FlatList
        data={transactions}
      keyExtractor={(item) => item.displayId}
      renderItem={({ item }) => (
        <View style={[styles.transactionCard, { backgroundColor: theme.surface }]}>
          <View style={styles.transactionLeft}>
            <View
              style={[
                styles.transactionIcon,
                { backgroundColor: item.txType === "withdrawal" ? "#E3D095" : "#7965C1" },
              ]}
            >
              {item.txType === "withdrawal" ? (
                <Ionicons name="arrow-up" size={20} color="#0E2148" />
              ) : (
                <MaterialIcons name="card-giftcard" size={20} color={theme.text} />
                )}
              </View>
            <View style={styles.transactionDetails}>
              <Text style={[styles.transactionBrand, { color: theme.text }]}>{item.displayBrand}</Text>
              <Text style={[styles.transactionDate, { color: theme.textMuted }]}>{formatDate(item.displayDate)}</Text>
              <Text style={[styles.transactionType, { color: theme.textMuted }]}>{item.displayType}</Text>
            </View>
              </View>
          <View style={styles.transactionRight}>
            <Text style={[styles.transactionAmount, { color: theme.text }]}>₦{item.displayAmount?.toLocaleString()}</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    item.displayStatus === "rejected"
                      ? "#ff6b6b"
                      : item.displayStatus === "pending"
                        ? "#ffa726"
                        : "#4caf50",
                },
              ]}
            >
              <Text style={styles.statusText}>
                {item.displayStatus?.charAt(0).toUpperCase() + item.displayStatus?.slice(1)}
              </Text>
            </View>
            </View>
          </View>
        )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={48} color="rgba(255,255,255,0.3)" />
          <Text style={[styles.emptyStateText, { color: theme.text }]}>No transactions yet</Text>
          <Text style={[styles.emptyStateSubtext, { color: theme.textMuted }]}>Your transaction history will appear here</Text>
        </View>
      }
      ListHeaderComponent={renderHeader}
      contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0E2148",
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0E2148",
    justifyContent: "center",
    alignItems: "center",
  },
  headerGradient: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 40,
    marginBottom: 24,
  },
  greeting: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginBottom: 4,
  },
  username: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  notificationButton: {
    position: "relative",
    padding: 8,
  },
  notificationBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#ff6b6b",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0E2148",
  },
  notificationBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  balanceCard: {
    marginHorizontal: 24,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  balanceGradient: {
    padding: 24,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  balanceAmount: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
  },
  withdrawButton: {
    backgroundColor: "#E3D095",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  withdrawButtonText: {
    color: "#0E2148",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  walletButton: {
    backgroundColor: "rgba(227, 208, 149, 0.1)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 10,
  },
  walletButtonText: {
    color: "#7965C1",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  quickActionsContainer: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickActionCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 20,
    width: (width - 64) / 2,
    borderWidth: 1,
    borderColor: "rgba(227, 208, 149, 0.2)",
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(227, 208, 149, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  quickActionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  quickActionSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  pendingContainer: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  pendingActionCard: {
    backgroundColor: "rgba(227, 208, 149, 0.1)",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(227, 208, 149, 0.3)",
  },
  pendingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(227, 208, 149, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  pendingContent: {
    flex: 1,
  },
  pendingTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  pendingSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  transactionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 32,
    marginBottom: 16,
  },
  seeAllText: {
    color: "#7965C1",
    fontSize: 14,
    fontWeight: "600",
  },
  transactionCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
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
  },
  transactionDetails: {
    flex: 1,
  },
  transactionBrand: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  transactionDate: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginBottom: 2,
  },
  transactionType: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    color: "#fff",
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
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    textAlign: "center",
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 16,
  },
  txType: {
    fontSize: 12,
    marginTop: 2,
  },
  contentContainer: {
    paddingBottom: 32,
  },
})
