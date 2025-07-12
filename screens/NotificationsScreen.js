// import React, { useEffect, useState, useCallback } from 'react';
// import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
// import { supabase } from './supabaseClient';
// import { MaterialIcons } from '@expo/vector-icons';

// const formatDate = (dateStr) => {
//   if (!dateStr) return '';
//   const d = new Date(dateStr);
//   return d.toLocaleString(undefined, {
//     year: 'numeric', month: 'short', day: 'numeric',
//     hour: '2-digit', minute: '2-digit', hour12: true
//   });
// };

// export default function NotificationsScreen() {
//   const [notifications, setNotifications] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState('');

//   const fetchNotifications = async () => {
//     setError('');
//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) {
//         setNotifications([]);
//         setLoading(false);
//         setRefreshing(false);
//         return;
//       }
//       const { data, error } = await supabase
//         .from('notifications')
//         .select('*')
//         .eq('user_id', user.id)
//         .order('created_at', { ascending: false });
//       if (error) throw error;
//       setNotifications(data || []);
//     } catch (err) {
//       setError('Failed to load notifications.');
//     }
//     setLoading(false);
//     setRefreshing(false);
//   };

//   useEffect(() => {
//     setLoading(true);
//     fetchNotifications();
//   }, []);

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     fetchNotifications();
//   }, []);

//   const markAllAsRead = async () => {
//     const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
//     if (unreadIds.length > 0) {
//       await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
//       fetchNotifications();
//     }
//   };

//   const renderItem = ({ item }) => (
//     <View style={[styles.notificationItem, !item.read && styles.unreadItem]}>
//       <View style={styles.iconContainer}>
//         <MaterialIcons name={item.read ? 'notifications-none' : 'notifications-active'} size={28} color={item.read ? '#b2bec3' : '#0984e3'} />
//       </View>
//       <View style={{ flex: 1 }}>
//         <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>{item.title}</Text>
//         <Text style={styles.notificationBody}>{item.body}</Text>
//         <Text style={styles.notificationDate}>{formatDate(item.created_at)}</Text>
//       </View>
//     </View>
//   );

//   const unreadCount = notifications.filter(n => !n.read).length;

//   return (
//     <View style={styles.container}>
//       <View style={styles.headerRow}>
//         <Text style={styles.title}>Notifications</Text>
//         {unreadCount > 0 && (
//           <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead}>
//             <MaterialIcons name="done-all" size={20} color="#fff" />
//             <Text style={styles.markAllText}>Mark all as read</Text>
//           </TouchableOpacity>
//         )}
//       </View>
//       {loading ? (
//         <ActivityIndicator size="large" color="#0984e3" style={{ marginTop: 32 }} />
//       ) : error ? (
//         <Text style={{ color: '#d63031', textAlign: 'center', marginTop: 32 }}>{error}</Text>
//       ) : notifications.length === 0 ? (
//         <View style={styles.emptyState}>
//           <MaterialIcons name="notifications-off" size={60} color="#b2bec3" style={{ marginBottom: 12 }} />
//           <Text style={{ color: '#636e72', textAlign: 'center', fontSize: 18 }}>You're all caught up!
// No notifications yet.</Text>
//         </View>
//       ) : (
//         <FlatList
//           data={notifications}
//           keyExtractor={item => item.id}
//           renderItem={renderItem}
//           style={{ marginTop: 16 }}
//           refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0984e3"]} />}
//         />
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#f5f6fa', padding: 16 },
//   headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
//   title: { fontSize: 28, fontWeight: 'bold', color: '#2d3436', textAlign: 'left' },
//   markAllBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0984e3', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
//   markAllText: { color: '#fff', fontWeight: '600', marginLeft: 6, fontSize: 14 },
//   notificationItem: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, alignItems: 'flex-start' },
//   iconContainer: { marginRight: 14, marginTop: 2 },
//   unreadItem: { borderLeftWidth: 5, borderLeftColor: '#0984e3', backgroundColor: '#eaf4fd' },
//   notificationTitle: { fontWeight: 'bold', fontSize: 16, color: '#2d3436', marginBottom: 4 },
//   unreadTitle: { color: '#0984e3' },
//   notificationBody: { color: '#636e72', fontSize: 15, marginBottom: 4 },
//   notificationDate: { color: '#b2bec3', fontSize: 13 },
//   emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
// }); 





"use client"

import { useEffect, useState, useCallback } from "react"
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  StatusBar,
  Dimensions,
} from "react-native"
import { supabase } from "./supabaseClient"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"

const { width } = Dimensions.get("window")

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

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  const fetchNotifications = async () => {
    setError("")
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setNotifications([])
        setLoading(false)
        setRefreshing(false)
        return
      }
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      if (error) throw error
      setNotifications(data || [])
    } catch (err) {
      setError("Failed to load notifications.")
    }
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    setLoading(true)
    fetchNotifications()
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchNotifications()
  }, [])

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length > 0) {
      await supabase.from("notifications").update({ read: true }).in("id", unreadIds)
      fetchNotifications()
    }
  }

  const markAsRead = async (notificationId) => {
    await supabase.from("notifications").update({ read: true }).eq("id", notificationId)
    fetchNotifications()
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case "transaction":
        return "card"
      case "withdrawal":
        return "cash"
      case "security":
        return "shield-checkmark"
      case "promotion":
        return "gift"
      default:
        return "notifications"
    }
  }

  const getNotificationColor = (type, isRead) => {
    if (isRead) return "rgba(255,255,255,0.6)"
    switch (type) {
      case "transaction":
        return "#7965C1"
      case "withdrawal":
        return "#E3D095"
      case "security":
        return "#ff6b6b"
      case "promotion":
        return "#4caf50"
      default:
        return "#7965C1"
    }
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      onPress={() => !item.read && markAsRead(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.notificationContent}>
        <View style={[styles.notificationIcon, { backgroundColor: `${getNotificationColor(item.type, item.read)}20` }]}>
          <Ionicons
            name={getNotificationIcon(item.type)}
            size={20}
            color={getNotificationColor(item.type, item.read)}
          />
        </View>
        <View style={styles.notificationText}>
          <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>{item.title}</Text>
          <Text style={styles.notificationBody} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.notificationDate}>{formatDate(item.created_at)}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  )

  const unreadCount = notifications.filter((n) => !n.read).length

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0E2148" />
        <ActivityIndicator size="large" color="#7965C1" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E2148" />

      <LinearGradient colors={["#0E2148", "#483AA0"]} style={styles.headerGradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
              <Ionicons name="checkmark-done" size={16} color="#0E2148" />
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        {/* <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{notifications.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{unreadCount}</Text>
            <Text style={styles.statLabel}>Unread</Text>
          </View>
        </View> */}
      </LinearGradient>

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="notifications-off" size={48} color="rgba(255,255,255,0.3)" />
          </View>
          <Text style={styles.emptyStateTitle}>All caught up!</Text>
          <Text style={styles.emptyStateSubtext}>
            You don't have any notifications yet. We'll notify you when something important happens.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#7965C1"]}
              tintColor="#7965C1"
              progressBackgroundColor="#0E2148"
            />
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0E2148",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0E2148",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
  },
  headerGradient: {
    paddingBottom: 5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 40,
    marginBottom: 0,
  },
  backButton: {
    paddingVertical: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
    marginRight: 40,
  },
  markAllButton: {
    backgroundColor: "#E3D095",
    borderRadius: 20,
    padding: 8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 20,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  notificationCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  unreadCard: {
    backgroundColor: "rgba(121, 101, 193, 0.1)",
    borderColor: "rgba(121, 101, 193, 0.3)",
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  unreadTitle: {
    color: "#fff",
    fontWeight: "bold",
  },
  notificationBody: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationDate: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#7965C1",
    marginTop: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#7965C1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyStateTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  emptyStateSubtext: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
})
