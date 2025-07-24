// import { useEffect, useState, useCallback } from "react"
// import {
//   View,
//   Text,
//   FlatList,
//   ActivityIndicator,
//   TouchableOpacity,
//   StyleSheet,
//   RefreshControl,
//   StatusBar,
//   Dimensions,
// } from "react-native"
// import { supabase } from "./supabaseClient"
// import { LinearGradient } from "expo-linear-gradient"
// import { Ionicons } from "@expo/vector-icons"

// const { width } = Dimensions.get("window")

// const formatDate = (dateStr) => {
//   if (!dateStr) return ""
//   const d = new Date(dateStr)
//   const now = new Date()
//   const diffInHours = (now - d) / (1000 * 60 * 60)

//   if (diffInHours < 1) {
//     const diffInMinutes = Math.floor((now - d) / (1000 * 60))
//     return diffInMinutes <= 1 ? "Just now" : `${diffInMinutes}m ago`
//   } else if (diffInHours < 24) {
//     return `${Math.floor(diffInHours)}h ago`
//   } else if (diffInHours < 48) {
//     return "Yesterday"
//   } else {
//     return d.toLocaleDateString(undefined, {
//       month: "short",
//       day: "numeric",
//       year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
//     })
//   }
// }

// export default function NotificationsScreen({ navigation }) {
//   const [notifications, setNotifications] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [refreshing, setRefreshing] = useState(false)
//   const [error, setError] = useState("")

//   const fetchNotifications = async () => {
//     setError("")
//     try {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser()
//       if (!user) {
//         setNotifications([])
//         setLoading(false)
//         setRefreshing(false)
//         return
//       }
//       const { data, error } = await supabase
//         .from("notifications")
//         .select("*")
//         .eq("user_id", user.id)
//         .order("created_at", { ascending: false })
//       if (error) throw error
//       setNotifications(data || [])
//     } catch (err) {
//       setError("Failed to load notifications.")
//     }
//     setLoading(false)
//     setRefreshing(false)
//   }

//   useEffect(() => {
//     setLoading(true)
//     fetchNotifications()
//   }, [])

//   const onRefresh = useCallback(() => {
//     setRefreshing(true)
//     fetchNotifications()
//   }, [])

//   const markAllAsRead = async () => {
//     const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
//     if (unreadIds.length > 0) {
//       await supabase.from("notifications").update({ read: true }).in("id", unreadIds)
//       fetchNotifications()
//     }
//   }

//   const markAsRead = async (notificationId) => {
//     await supabase.from("notifications").update({ read: true }).eq("id", notificationId)
//     fetchNotifications()
//   }

//   const getNotificationIcon = (type) => {
//     switch (type) {
//       case "transaction":
//         return "card"
//       case "withdrawal":
//         return "cash"
//       case "security":
//         return "shield-checkmark"
//       case "promotion":
//         return "gift"
//       default:
//         return "notifications"
//     }
//   }

//   const getNotificationColor = (type, isRead) => {
//     if (isRead) return "rgba(255,255,255,0.6)"
//     switch (type) {
//       case "transaction":
//         return "#7965C1"
//       case "withdrawal":
//         return "#E3D095"
//       case "security":
//         return "#ff6b6b"
//       case "promotion":
//         return "#4caf50"
//       default:
//         return "#7965C1"
//     }
//   }

//   const renderItem = ({ item }) => (
//     <TouchableOpacity
//       style={[styles.notificationCard, !item.read && styles.unreadCard]}
//       onPress={() => !item.read && markAsRead(item.id)}
//       activeOpacity={0.8}
//     >
//       <View style={styles.notificationContent}>
//         <View style={[styles.notificationIcon, { backgroundColor: `${getNotificationColor(item.type, item.read)}20` }]}>
//           <Ionicons
//             name={getNotificationIcon(item.type)}
//             size={20}
//             color={getNotificationColor(item.type, item.read)}
//           />
//         </View>
//         <View style={styles.notificationText}>
//           <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>{item.title}</Text>
//           <Text style={styles.notificationBody} numberOfLines={2}>
//             {item.body}
//           </Text>
//           <Text style={styles.notificationDate}>{formatDate(item.created_at)}</Text>
//         </View>
//         {!item.read && <View style={styles.unreadDot} />}
//       </View>
//     </TouchableOpacity>
//   )

//   const unreadCount = notifications.filter((n) => !n.read).length

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <StatusBar barStyle="light-content" backgroundColor="#0E2148" />
//         <ActivityIndicator size="large" color="#7965C1" />
//         <Text style={styles.loadingText}>Loading notifications...</Text>
//       </View>
//     )
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#0E2148" />

//       <LinearGradient colors={["#0E2148", "#483AA0"]} style={styles.headerGradient}>
//         {/* Header */}
//         <View style={styles.header}>
//           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
//             <Ionicons name="arrow-back" size={24} color="#fff" />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>Notifications</Text>
//           {unreadCount > 0 && (
//             <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
//               <Ionicons name="checkmark-done" size={16} color="#0E2148" />
//             </TouchableOpacity>
//           )}
//         </View>

//         {/* Stats */}
//         {/* <View style={styles.statsContainer}>
//           <View style={styles.statItem}>
//             <Text style={styles.statNumber}>{notifications.length}</Text>
//             <Text style={styles.statLabel}>Total</Text>
//           </View>
//           <View style={styles.statDivider} />
//           <View style={styles.statItem}>
//             <Text style={styles.statNumber}>{unreadCount}</Text>
//             <Text style={styles.statLabel}>Unread</Text>
//           </View>
//         </View> */}
//       </LinearGradient>

//       {error ? (
//         <View style={styles.errorContainer}>
//           <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
//           <Text style={styles.errorText}>{error}</Text>
//           <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
//             <Text style={styles.retryButtonText}>Try Again</Text>
//           </TouchableOpacity>
//         </View>
//       ) : notifications.length === 0 ? (
//         <View style={styles.emptyState}>
//           <View style={styles.emptyIconContainer}>
//             <Ionicons name="notifications-off" size={48} color="rgba(255,255,255,0.3)" />
//           </View>
//           <Text style={styles.emptyStateTitle}>All caught up!</Text>
//           <Text style={styles.emptyStateSubtext}>
//             You don't have any notifications yet. We'll notify you when something important happens.
//           </Text>
//         </View>
//       ) : (
//         <FlatList
//           data={notifications}
//           keyExtractor={(item) => item.id}
//           renderItem={renderItem}
//           contentContainerStyle={styles.listContainer}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={onRefresh}
//               colors={["#7965C1"]}
//               tintColor="#7965C1"
//               progressBackgroundColor="#0E2148"
//             />
//           }
//         />
//       )}
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#0E2148",
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
//   headerGradient: {
//     paddingBottom: 5,
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 20,
//     paddingTop: 40,
//     marginBottom: 0,
//   },
//   backButton: {
//     paddingVertical: 8,
//   },
//   headerTitle: {
//     color: "#fff",
//     fontSize: 20,
//     fontWeight: "bold",
//     flex: 1,
//     textAlign: "center",
//     marginRight: 40,
//   },
//   markAllButton: {
//     backgroundColor: "#E3D095",
//     borderRadius: 20,
//     padding: 8,
//   },
//   statsContainer: {
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     paddingHorizontal: 24,
//   },
//   statItem: {
//     alignItems: "center",
//     flex: 1,
//   },
//   statNumber: {
//     color: "#fff",
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 4,
//   },
//   statLabel: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 14,
//   },
//   statDivider: {
//     width: 1,
//     height: 40,
//     backgroundColor: "rgba(255,255,255,0.2)",
//     marginHorizontal: 20,
//   },
//   listContainer: {
//     paddingHorizontal: 24,
//     paddingTop: 24,
//     paddingBottom: 32,
//   },
//   notificationCard: {
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 16,
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.1)",
//   },
//   unreadCard: {
//     backgroundColor: "rgba(121, 101, 193, 0.1)",
//     borderColor: "rgba(121, 101, 193, 0.3)",
//   },
//   notificationContent: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     padding: 16,
//   },
//   notificationIcon: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     justifyContent: "center",
//     alignItems: "center",
//     marginRight: 12,
//   },
//   notificationText: {
//     flex: 1,
//   },
//   notificationTitle: {
//     color: "rgba(255,255,255,0.9)",
//     fontSize: 16,
//     fontWeight: "600",
//     marginBottom: 4,
//   },
//   unreadTitle: {
//     color: "#fff",
//     fontWeight: "bold",
//   },
//   notificationBody: {
//     color: "rgba(255,255,255,0.7)",
//     fontSize: 14,
//     lineHeight: 20,
//     marginBottom: 8,
//   },
//   notificationDate: {
//     color: "rgba(255,255,255,0.5)",
//     fontSize: 12,
//   },
//   unreadDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: "#7965C1",
//     marginTop: 4,
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingHorizontal: 24,
//   },
//   errorText: {
//     color: "#ff6b6b",
//     fontSize: 16,
//     textAlign: "center",
//     marginTop: 16,
//     marginBottom: 24,
//   },
//   retryButton: {
//     backgroundColor: "#7965C1",
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 12,
//   },
//   retryButtonText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   emptyState: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingHorizontal: 24,
//   },
//   emptyIconContainer: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: "rgba(255,255,255,0.1)",
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 24,
//   },
//   emptyStateTitle: {
//     color: "#fff",
//     fontSize: 20,
//     fontWeight: "bold",
//     marginBottom: 12,
//   },
//   emptyStateSubtext: {
//     color: "rgba(255,255,255,0.6)",
//     fontSize: 14,
//     textAlign: "center",
//     lineHeight: 20,
//   },
// })










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
  Platform,
} from "react-native"
import { supabase } from "./supabaseClient"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "./ThemeContext"

const { width } = Dimensions.get("window")
const STATUS_BAR_HEIGHT = Platform.OS === "ios" ? 50 : StatusBar.currentHeight
const HEADER_HEIGHT = STATUS_BAR_HEIGHT + 60 // StatusBar height + header content height

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
  const { theme } = useTheme()

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
    if (isRead) return theme.textSecondary // Read notifications are less prominent
    switch (type) {
      case "transaction":
        return theme.accent
      case "withdrawal":
        return theme.warning
      case "security":
        return theme.error
      case "promotion":
        return theme.success
      default:
        return theme.accent
    }
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        { backgroundColor: theme.card, borderColor: theme.border },
        !item.read && { backgroundColor: theme.accentBackground, borderColor: theme.accent },
      ]}
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
          <Text style={[styles.notificationTitle, { color: theme.text }, !item.read && { color: theme.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.notificationBody, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={[styles.notificationDate, { color: theme.textMuted }]}>{formatDate(item.created_at)}</Text>
        </View>
        {!item.read && <View style={[styles.unreadDot, { backgroundColor: theme.accent }]} />}
      </View>
    </TouchableOpacity>
  )

  const unreadCount = notifications.filter((n) => !n.read).length

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.primary} />
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading notifications...</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.primary} />

      {/* Fixed Header */}
      <View
        style={[
          styles.fixedHeader,
          { backgroundColor: theme.primary, borderBottomColor: theme.border, shadowColor: theme.shadow },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.textContrast} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textContrast }]}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity style={[styles.markAllButton, { backgroundColor: theme.accent }]} onPress={markAllAsRead}>
            <Ionicons name="checkmark-done" size={16} color={theme.textContrast} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} /> // Placeholder to keep title centered
        )}
      </View>

      {error ? (
        <View style={[styles.errorContainer, { paddingTop: HEADER_HEIGHT + 20 }]}>
          <Ionicons name="alert-circle" size={48} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.accent }]}
            onPress={fetchNotifications}
          >
            <Text style={[styles.retryButtonText, { color: theme.textContrast }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : notifications.length === 0 ? (
        <View style={[styles.emptyState, { paddingTop: HEADER_HEIGHT + 20 }]}>
          <View style={[styles.emptyIconContainer, { backgroundColor: theme.surface }]}>
            <Ionicons name="notifications-off" size={48} color={theme.textSecondary} />
          </View>
          <Text style={[styles.emptyStateTitle, { color: theme.text }]}>All caught up!</Text>
          <Text style={[styles.emptyStateSubtext, { color: theme.textSecondary }]}>
            You don't have any notifications yet. We'll notify you when something important happens.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContainer, { paddingTop: HEADER_HEIGHT + 20 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.accent}
              colors={[theme.accent]}
              progressBackgroundColor={theme.surface}
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
  fixedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    height: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: STATUS_BAR_HEIGHT,
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 24, // Adjusted for better centering with back button
  },
  markAllButton: {
    borderRadius: 20,
    padding: 8,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  notificationCard: {
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
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
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationDate: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
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
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
})
