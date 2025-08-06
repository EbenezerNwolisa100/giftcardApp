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
  Alert,
} from "react-native"
import { supabase } from "./supabaseClient"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "./ThemeContext"
import { useFocusEffect } from "@react-navigation/native"

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
      
      // Fetch notifications with additional metadata
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          *,
          action_data,
          action_type,
          related_transaction_id,
          related_withdrawal_id,
          related_support_request_id
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      
      if (error) throw error
      setNotifications(data || [])
    } catch (err) {
      console.error("Error fetching notifications:", err)
      setError("Failed to load notifications.")
    }
    setLoading(false)
    setRefreshing(false)
  }

  useFocusEffect(
    useCallback(() => {
      fetchNotifications()
    }, [])
  )

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchNotifications()
  }, [])

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length > 0) {
      try {
        await supabase.from("notifications").update({ read: true }).in("id", unreadIds)
        fetchNotifications()
      } catch (error) {
        console.error("Error marking notifications as read:", error)
        Alert.alert("Error", "Failed to mark notifications as read.")
      }
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await supabase.from("notifications").update({ read: true }).eq("id", notificationId)
      fetchNotifications()
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const getNotificationIcon = (type, actionType) => {
    // Determine icon based on notification type and action type
    switch (actionType) {
      case "transaction_approved":
      case "transaction_completed":
        return "checkmark-circle"
      case "transaction_rejected":
        return "close-circle"
      case "withdrawal_approved":
      case "withdrawal_completed":
        return "cash"
      case "withdrawal_rejected":
        return "close-circle"
      case "wallet_funded":
        return "wallet"
      case "support_reply":
        return "chatbubble"
      case "security_alert":
        return "shield-checkmark"
      case "promotion":
        return "gift"
      case "system":
        return "settings"
      default:
        // Fallback to type-based icons
        switch (type) {
          case "transaction":
            return "card"
          case "withdrawal":
            return "cash"
          case "security":
            return "shield-checkmark"
          case "promotion":
            return "gift"
          case "support":
            return "chatbubble"
          default:
            return "notifications"
        }
    }
  }

  const getNotificationColor = (type, actionType, isRead) => {
    if (isRead) return theme.textSecondary // Read notifications are less prominent
    
    switch (actionType) {
      case "transaction_approved":
      case "transaction_completed":
      case "withdrawal_approved":
      case "withdrawal_completed":
      case "wallet_funded":
        return theme.success
      case "transaction_rejected":
      case "withdrawal_rejected":
        return theme.error
      case "support_reply":
        return theme.accent
      case "security_alert":
        return theme.warning
      case "promotion":
        return theme.success
      case "system":
        return theme.textSecondary
      default:
        // Fallback to type-based colors
        switch (type) {
          case "transaction":
            return theme.accent
          case "withdrawal":
            return theme.warning
          case "security":
            return theme.error
          case "promotion":
            return theme.success
          case "support":
            return theme.accent
          default:
            return theme.accent
        }
    }
  }

  const handleNotificationPress = async (notification) => {
    // Mark as read first
    if (!notification.read) {
      await markAsRead(notification.id)
    }

    // Navigate based on action type and related data
    try {
      switch (notification.action_type) {
        case "transaction_approved":
        case "transaction_completed":
        case "transaction_rejected":
          if (notification.related_transaction_id) {
            // Navigate to transaction details
            navigation.navigate("TransactionDetails", { 
              transactionId: notification.related_transaction_id 
            })
          } else {
            // Navigate to transactions list
            navigation.navigate("Main", { screen: "Transactions" })
          }
          break

        case "withdrawal_approved":
        case "withdrawal_completed":
        case "withdrawal_rejected":
          if (notification.related_withdrawal_id) {
            // Navigate to withdrawal details (if you have a withdrawal details screen)
            navigation.navigate("Main", { screen: "Transactions" })
          } else {
            // Navigate to transactions list
            navigation.navigate("Main", { screen: "Transactions" })
          }
          break

        case "wallet_funded":
          // Navigate to wallet screen
          navigation.navigate("Wallet")
          break

        case "support_reply":
          if (notification.related_support_request_id) {
            // Navigate to support center with specific chat
            navigation.navigate("SupportCenter", { 
              chatId: notification.related_support_request_id 
            })
          } else {
            // Navigate to support center
            navigation.navigate("Main", { screen: "Support" })
          }
          break

        case "security_alert":
          // Navigate to profile for security settings
          navigation.navigate("Main", { screen: "Profile" })
          break

        case "promotion":
          // Navigate to rates or promotions screen
          navigation.navigate("Main", { screen: "Rates" })
          break

        case "system":
          // Stay on current screen for system notifications
          break

        default:
          // For notifications without specific action type, try to determine from content
          if (notification.body?.toLowerCase().includes("transaction")) {
            navigation.navigate("Main", { screen: "Transactions" })
          } else if (notification.body?.toLowerCase().includes("withdrawal")) {
            navigation.navigate("Main", { screen: "Transactions" })
          } else if (notification.body?.toLowerCase().includes("wallet")) {
            navigation.navigate("Wallet")
          } else if (notification.body?.toLowerCase().includes("support")) {
            navigation.navigate("Main", { screen: "Support" })
          }
          break
      }
    } catch (error) {
      console.error("Navigation error:", error)
      // Fallback to transactions screen
      navigation.navigate("Main", { screen: "Transactions" })
    }
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        { backgroundColor: theme.card, borderColor: theme.border },
        !item.read && { backgroundColor: theme.accentBackground, borderColor: theme.accent },
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.notificationContent}>
        <View style={[
          styles.notificationIcon, 
          { backgroundColor: `${getNotificationColor(item.type, item.action_type, item.read)}20` }
        ]}>
          <Ionicons
            name={getNotificationIcon(item.type, item.action_type)}
            size={20}
            color={getNotificationColor(item.type, item.action_type, item.read)}
          />
        </View>
        <View style={styles.notificationText}>
          <Text style={[
            styles.notificationTitle, 
            { color: theme.text }, 
            !item.read && { fontWeight: "600" }
          ]}>
            {item.title}
          </Text>
          <Text style={[styles.notificationBody, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={[styles.notificationDate, { color: theme.textMuted }]}>
            {formatDate(item.created_at)}
          </Text>
        </View>
        {!item.read && <View style={[styles.unreadDot, { backgroundColor: theme.accent }]} />}
      </View>
    </TouchableOpacity>
  )

  const unreadCount = notifications.filter((n) => !n.read).length

  // Notifications Skeleton Component
  const NotificationsSkeleton = () => (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.primary} />

      {/* Fixed Header Skeleton */}
      <View
        style={{
          borderBottomColor: theme.border,
          shadowColor: theme.shadow,
          paddingHorizontal: 10,
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 5 : 45,
          paddingBottom: 5,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          zIndex: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ width: 24, height: 24, backgroundColor: theme.surfaceSecondary, borderRadius: 12 }} />
        <View style={{ width: 120, height: 24, backgroundColor: theme.surfaceSecondary, borderRadius: 4 }} />
        <View style={{ width: 32, height: 32 }} />
      </View>

      {/* Notification Cards Skeleton */}
      <View style={[styles.listContainer, { paddingTop: 120 }]}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={[styles.notificationCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
            <View style={styles.notificationContent}>
              <View style={[styles.notificationIcon, { backgroundColor: theme.surfaceSecondary }]}>
                <View style={{ width: 20, height: 20, backgroundColor: theme.surfaceSecondary, borderRadius: 10 }} />
              </View>
              <View style={styles.notificationText}>
                <View style={{ width: 140, height: 16, backgroundColor: theme.surfaceSecondary, borderRadius: 4, marginBottom: 4 }} />
                <View style={{ width: 200, height: 14, backgroundColor: theme.surfaceSecondary, borderRadius: 4, marginBottom: 8 }} />
                <View style={{ width: 80, height: 12, backgroundColor: theme.surfaceSecondary, borderRadius: 4 }} />
              </View>
              <View style={{ width: 8, height: 8, backgroundColor: theme.surfaceSecondary, borderRadius: 4, marginTop: 4 }} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return <NotificationsSkeleton />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.primary} />

      {/* Fixed Header */}
      <View
        style={{
          // backgroundColor: theme.primary,
          borderBottomColor: theme.border,
          shadowColor: theme.shadow,
          paddingHorizontal: 10,
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 5 : 45,
          paddingBottom: 5,
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
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold' }}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity 
            style={{
              marginRight: 0,
              padding: 6,
              borderRadius: 6,
              backgroundColor: theme.accent,
            }}
            onPress={markAllAsRead}
          >
            <Ionicons name="checkmark-done" size={16} color={theme.textContrast} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 32, height: 32 }} />
        )}
      </View>

      {error ? (
        <View style={[styles.errorContainer, { paddingTop: 50 }]}>
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
        <View style={[styles.emptyState, { paddingTop: 50 }]}>
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
          contentContainerStyle={[styles.listContainer, { paddingTop: 120 }]}
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


  listContainer: {
    paddingHorizontal: 16,
    marginTop: -110,
    paddingBottom: 20, // Reduced since tab bar is now relative positioned
  },
  notificationCard: {
    borderRadius: 16,
    marginBottom: 8,
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
