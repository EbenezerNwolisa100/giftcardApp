"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  RefreshControl,
  ScrollView,
} from "react-native"
import { supabase } from "./supabaseClient"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation, useFocusEffect } from "@react-navigation/native" // Import useFocusEffect
import { useTheme } from "./ThemeContext"

const { width } = Dimensions.get("window")
const ADMIN_ID = "admin" // Use a constant or fetch admin id if needed
const HEADER_HEIGHT_LIST = Platform.OS === 'android' ? StatusBar.currentHeight + 80 : 100; // Approximate height for fixed header in list view
const HEADER_HEIGHT_DETAIL = Platform.OS === 'android' ? StatusBar.currentHeight + 80 : 100; // Approximate height for fixed header in detail view

export default function SupportCenter() {
  const { theme, isDarkTheme } = useTheme()
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState("list") // 'list' or 'detail'
  const [selectedChat, setSelectedChat] = useState(null)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0) // State for unread notifications
  const flatListRef = useRef()
  const navigation = useNavigation()

  const fetchChats = useCallback(async () => {
    setLoading(true)
    setRefreshing(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not logged in")
      const { data, error } = await supabase
        .from("support_requests")
        .select("id, message, conversation, created_at, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      if (error) throw error
      setChats(data || [])

      // Fetch unread notifications count
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false)
      setUnreadCount(count || 0)

    } catch (err) {
      Alert.alert("Error", err.message || "Failed to load chats.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchChats()
    }, [fetchChats]),
  )

  const openChat = (chat) => {
    setSelectedChat(chat)
    setView("detail")
    setMessage("")
  }

  const handleSend = async () => {
    if (!message.trim()) {
      Alert.alert("Error", "Please enter your message.")
      return
    }
    setSending(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not logged in")
      if (!selectedChat) {
        // New chat
        const { data, error } = await supabase
          .from("support_requests")
          .insert({ user_id: user.id, message, conversation: [] })
          .select()
          .single()
        if (error) throw error
        setSelectedChat(data)
        setChats([data, ...chats])
        // Notify admin
        await supabase.from("notifications").insert({ user_id: ADMIN_ID, title: "New Support Request", body: message })
      } else {
        // Follow-up message
        const newMsg = { sender: "user", text: message, timestamp: new Date().toISOString() }
        const updatedConversation = Array.isArray(selectedChat.conversation)
          ? [...selectedChat.conversation, newMsg]
          : [newMsg]
        const { error } = await supabase
          .from("support_requests")
          .update({ conversation: updatedConversation })
          .eq("id", selectedChat.id)
        if (error) throw error
        setSelectedChat({ ...selectedChat, conversation: updatedConversation })
        setChats(chats.map((c) => (c.id === selectedChat.id ? { ...c, conversation: updatedConversation } : c)))
        // Notify admin
        await supabase.from("notifications").insert({ user_id: ADMIN_ID, title: "User Follow-up", body: message })
      }
      setMessage("")
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to send message.")
    }
    setSending(false)
  }

  const handleStartNewChat = () => {
    setSelectedChat(null)
    setView("detail")
    setMessage("")
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return theme.success
      case "pending":
        return theme.warning
      case "closed":
        return theme.error
      default:
        return theme.accent
    }
  }

  const formatMessageDate = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    // Fixed Header Styles for List View
    fixedHeaderList: {
      // backgroundColor: theme.primary, // Solid primary color for header
      paddingHorizontal: 18, // Consistent padding
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 5 : 45, // Adjust for iOS/Android status bar
      paddingBottom: 16,
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
    // Fixed Header Styles for Detail View
    fixedHeaderDetail: {
      // backgroundColor: theme.primary, // Solid primary color for header
      paddingHorizontal: 18, // Consistent padding
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 5 : 45, // Adjust for iOS/Android status bar
      paddingBottom: 16,
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
      fontSize: 22, // Larger title
      fontWeight: "bold",
      flex: 1,
      textAlign: "left",
    },
    notificationButton: {
      position: "relative",
      padding: 8,
    },
    notificationBadge: {
      position: "absolute",
      top: 0,
      right: 0,
      backgroundColor: theme.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: theme.primary,
    },
    notificationBadgeText: {
      color: theme.primary,
      fontSize: 10,
      fontWeight: "bold",
    },
    backButton: {
      padding: 8,
      zIndex: 11,
    },
    placeholder: {
      width: 40, // To balance the back button space
    },
    // List View Specific Styles
    listScrollViewContent: {
      flexGrow: 1,
      paddingHorizontal: 18, // Consistent with other screens
      paddingBottom: Platform.OS === "ios" ? 85 + 20 : 70 + 20, // Account for tab bar height
      paddingTop: 20, // Space after fixed header
    },
    titleSection: {
      alignItems: "center",
      marginBottom: 24, // Reduced for better spacing
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.surfaceSecondary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 8,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      paddingHorizontal: 0, // Remove unnecessary padding
    },
    newChatButton: {
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 20, // Reduced for better spacing
      backgroundColor: theme.accent,
      paddingVertical: 16,
      paddingHorizontal: 24,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 8,
    },
    newChatButtonDisabled: {
      opacity: 0.7,
    },
    newChatText: {
      color: theme.primary, // Text color for contrast on accent
      fontSize: 16,
      fontWeight: "bold",
      marginLeft: 8,
    },
    chatListItem: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      marginHorizontal: 0, // Remove horizontal margin since it's in FlatList
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    chatItemHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    chatItemLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    chatListMsg: {
      color: theme.text,
      fontWeight: "600",
      fontSize: 15,
      marginLeft: 12,
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4, // Increased for better touch target
      borderRadius: 8,
      minWidth: 50, // Ensure consistent width
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusText: {
      color: theme.primary, // Text color for status badges (white/light)
      fontSize: 10,
      fontWeight: "bold",
      textAlign: 'center',
    },
    chatListDate: {
      color: theme.textMuted,
      fontSize: 12,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 60,
      paddingHorizontal: 24,
    },
    emptyStateTitle: {
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
    // Detail View Specific Styles
    detailScrollViewContent: {
      flexGrow: 1,
      paddingHorizontal: 18, // Consistent with other screens
      paddingTop: 16, // Space after fixed header
      paddingBottom: Platform.OS === "ios" ? 85 + 20 : 70 + 20, // Account for tab bar height
    },
    bubble: {
      marginBottom: 12,
      padding: 16,
      borderRadius: 16,
      maxWidth: "80%",
      marginHorizontal: 0, // Remove horizontal margin since it's in FlatList
    },
    userBubble: {
      backgroundColor: theme.surfaceSecondary,
      alignSelf: "flex-end",
      borderBottomRightRadius: 4, // Tail for user bubble
    },
    adminBubble: {
      backgroundColor: theme.secondary, // Admin messages in secondary color
      alignSelf: "flex-start",
      borderBottomLeftRadius: 4, // Tail for admin bubble
    },
    bubbleText: {
      color: theme.text,
      fontSize: 15,
      lineHeight: 20,
    },
    adminBubbleText: {
      color: theme.primary, // Text color for contrast on secondary
    },
    bubbleTime: {
      color: theme.textMuted,
      fontSize: 11,
      marginTop: 6,
      textAlign: "right",
    },
    adminBubbleTime: {
      color: isDarkTheme ? theme.textSecondary : theme.textMuted, // Adjusted for admin bubble
      textAlign: "left",
    },
    inputContainer: {
      paddingHorizontal: 18, // Consistent with other screens
      paddingVertical: 16,
      backgroundColor: theme.surface,
      borderTopWidth: 1,
      borderColor: theme.border,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "flex-end",
    },
    messageInput: {
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.text,
      flex: 1,
      marginRight: 12,
      maxHeight: 100,
      borderWidth: 2,
      borderColor: theme.border,
    },
    sendButton: {
      backgroundColor: theme.accent,
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    sendButtonDisabled: {
      opacity: 0.7,
    },
    closedNotice: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      paddingHorizontal: 18, // Consistent with other screens
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 12,
      marginHorizontal: 0, // Remove margin since it's in the input container
      marginBottom: 16,
    },
    closedNoticeText: {
      color: theme.textMuted,
      fontSize: 14,
      marginLeft: 8,
    },
    // Skeleton Styles
    skeletonContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    skeletonFixedHeader: {
      height: HEADER_HEIGHT_LIST,
      backgroundColor: theme.primary,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 10,
    },
    skeletonTitleSection: {
      height: 180, // Approximate height of title section
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 20,
      marginHorizontal: 0, // Remove margin since it's in the content container
      marginTop: 20,
      marginBottom: 24, // Match the updated titleSection margin
    },
    skeletonNewChatButton: {
      height: 50,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginHorizontal: 0, // Remove margin since it's in the content container
      marginBottom: 20, // Match the updated newChatButton margin
    },
    skeletonChatListItem: {
      height: 80,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginBottom: 12,
      marginHorizontal: 0, // Remove margin since it's in the content container
    },
    skeletonBubble: {
      height: 60,
      width: '70%',
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginBottom: 12,
      alignSelf: 'flex-start',
      marginHorizontal: 0, // Remove margin since it's in the content container
    },
    skeletonInputContainer: {
      height: 80,
      backgroundColor: theme.surfaceSecondary,
      borderTopWidth: 1,
      borderColor: theme.border,
      marginHorizontal: 0, // Remove margin since it's in the input container
    },
    skeletonHeader: {
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 4,
    },
    detailContainer: {
      flex: 1,
    },
  })

  // SupportCenter Skeleton Component
  const SupportCenterSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />
      {/* Fixed Header Skeleton */}
      <View style={styles.skeletonFixedHeader}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 5 : 45, paddingBottom: 16, width: '100%' }}>
          {view === 'detail' && (
            <View style={{ width: 24, height: 24, backgroundColor: theme.surfaceSecondary, borderRadius: 12 }} />
          )}
          <View style={[styles.skeletonHeader, { width: 180, height: 24, alignSelf: 'center' }]} />
          <View style={[styles.notificationButton, { backgroundColor: theme.surfaceSecondary, borderRadius: 20, width: 40, height: 40 }]} />
        </View>
      </View>

      {view === 'list' ? (
        <FlatList
          data={[1, 2, 3, 4]} // Dummy data for skeleton items
          keyExtractor={(item) => item.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ 
            paddingBottom: Platform.OS === "ios" ? 85 + 20 : 70 + 20,
            paddingHorizontal: 18 // Add consistent horizontal padding
          }}
          ListHeaderComponent={() => (
            <View>
          {/* Title Section Skeleton */}
          <View style={styles.skeletonTitleSection} />

          {/* New Chat Button Skeleton */}
          <View style={styles.skeletonNewChatButton} />
            </View>
          )}
          renderItem={() => (
            <View style={styles.skeletonChatListItem} />
          )}
        />
      ) : (
        <KeyboardAvoidingView style={styles.detailContainer} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <FlatList
            data={[1, 2, 3, 4, 5]} // Dummy data for skeleton bubbles
            keyExtractor={(item) => item.toString()}
            renderItem={({ index }) => (
              <View style={[styles.skeletonBubble, { alignSelf: index % 2 === 0 ? 'flex-end' : 'flex-start' }]} />
            )}
            contentContainerStyle={styles.detailScrollViewContent}
            showsVerticalScrollIndicator={false}
          />
          <View style={styles.skeletonInputContainer} />
        </KeyboardAvoidingView>
      )}
    </View>
  );


  if (loading) {
    return <SupportCenterSkeleton />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />

      {view === "list" ? (
        <>
          {/* Fixed Header for List View */}
          <View style={styles.fixedHeaderList}>
            {/* <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity> */}
            <Text style={styles.headerTitle}>Support Center</Text>
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

          <FlatList
            data={chats}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.chatListItem} onPress={() => openChat(item)} activeOpacity={0.8}>
                <View style={styles.chatItemHeader}>
                  <View style={styles.chatItemLeft}>
                    <Ionicons name="chatbubble" size={20} color={theme.accent} />
                    <Text style={styles.chatListMsg} numberOfLines={1}>
                      {item.message}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.chatListDate}>{formatMessageDate(item.created_at)}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={48} color={theme.textMuted} />
                <Text style={styles.emptyStateTitle}>No support chats yet</Text>
                <Text style={styles.emptyStateSubtext}>Start a new chat to get help from our support team</Text>
              </View>
            }
            ListHeaderComponent={
              <View style={styles.listScrollViewContent}>
                {/* Title Section */}
                <View style={styles.titleSection}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="chatbubbles" size={32} color={theme.accent} />
                  </View>
                  <Text style={styles.title}>How can we help?</Text>
                  <Text style={styles.subtitle}>Our support team is here to assist you</Text>
                </View>

                {/* New Chat Button */}
                <TouchableOpacity
                  style={[
                    styles.newChatButton,
                    chats.some((c) => c.status !== "closed") && styles.newChatButtonDisabled,
                  ]}
                  onPress={handleStartNewChat}
                  disabled={chats.some((c) => c.status !== "closed")}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle" size={20} color={theme.primary} />
                  <Text style={styles.newChatText}>Start New Chat</Text>
                </TouchableOpacity>
              </View>
            }
            contentContainerStyle={{ 
              paddingBottom: Platform.OS === "ios" ? 85 + 20 : 70 + 20,
              paddingHorizontal: 18 // Add consistent horizontal padding
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={fetchChats}
                tintColor={theme.accent}
                colors={[theme.accent]}
                progressBackgroundColor={theme.surface}
              />
            }
          />
        </>
      ) : (
        <KeyboardAvoidingView style={styles.detailContainer} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          {/* Fixed Header for Chat Detail */}
          <View style={styles.fixedHeaderDetail}>
            <TouchableOpacity onPress={() => setView("list")} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Support Chat</Text>
            {selectedChat ? (
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedChat.status) }]}>
                <Text style={styles.statusText}>{selectedChat.status.toUpperCase()}</Text>
              </View>
            ) : (
              <View style={styles.placeholder} />
              )}
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={selectedChat?.conversation || []}
            keyExtractor={(_, idx) => idx.toString()}
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.sender === "admin" ? styles.adminBubble : styles.userBubble]}>
                <Text style={[styles.bubbleText, item.sender === "admin" && styles.adminBubbleText]}>{item.text}</Text>
                <Text style={[styles.bubbleTime, item.sender === "admin" && styles.adminBubbleTime]}>
                  {item.timestamp ? formatMessageDate(item.timestamp) : ""}
                </Text>
              </View>
            )}
            contentContainerStyle={styles.detailScrollViewContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={fetchChats} // Refresh the chat messages
                tintColor={theme.accent}
                colors={[theme.accent]}
                progressBackgroundColor={theme.surface}
              />
            }
          />

          {/* Input */}
          {selectedChat?.status !== "closed" && (
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              keyboardVerticalOffset={Platform.OS === "ios" ? 0 : -200} // Adjust as needed for Android
              style={styles.inputContainer}
            >
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Type your message..."
                  placeholderTextColor={theme.textMuted}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={2}
                  editable={!sending}
                />
                <TouchableOpacity
                  style={[styles.sendButton, sending && styles.sendButtonDisabled]}
                  onPress={handleSend}
                  disabled={sending}
                  activeOpacity={0.8}
                >
                  {sending ? (
                    <ActivityIndicator color={theme.primary} size="small" />
                  ) : (
                    <Ionicons name="send" size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          )}
          {selectedChat?.status === "closed" && (
            <View style={styles.closedNotice}>
              <Ionicons name="lock-closed" size={16} color={theme.textMuted} />
              <Text style={styles.closedNoticeText}>This support request is closed.</Text>
            </View>
          )}
        </KeyboardAvoidingView>
      )}
    </View>
  )
}
