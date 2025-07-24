// import React, { useState, useEffect, useRef } from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
// import { supabase } from './supabaseClient';

// const ADMIN_ID = 'admin'; // Use a constant or fetch admin id if needed

// export default function SupportCenter() {
//   const [chats, setChats] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [view, setView] = useState('list'); // 'list' or 'detail'
//   const [selectedChat, setSelectedChat] = useState(null);
//   const [message, setMessage] = useState('');
//   const [sending, setSending] = useState(false);
//   const flatListRef = useRef();

//   useEffect(() => {
//     fetchChats();
//   }, []);

//   const fetchChats = async () => {
//     setLoading(true);
//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) throw new Error('Not logged in');
//       const { data, error } = await supabase
//         .from('support_requests')
//         .select('id, message, conversation, created_at, status')
//         .eq('user_id', user.id)
//         .order('created_at', { ascending: false });
//       if (error) throw error;
//       setChats(data || []);
//     } catch (err) {
//       Alert.alert('Error', err.message || 'Failed to load chats.');
//     }
//     setLoading(false);
//   };

//   const openChat = (chat) => {
//     setSelectedChat(chat);
//     setView('detail');
//     setMessage('');
//   };

//   const handleSend = async () => {
//     if (!message.trim()) {
//       Alert.alert('Error', 'Please enter your message.');
//       return;
//     }
//     setSending(true);
//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) throw new Error('Not logged in');
//       if (!selectedChat) {
//         // New chat
//         const { data, error } = await supabase.from('support_requests').insert({ user_id: user.id, message, conversation: [] }).select().single();
//         if (error) throw error;
//         setSelectedChat(data);
//         setChats([data, ...chats]);
//         // Notify admin
//         await supabase.from('notifications').insert({ user_id: ADMIN_ID, title: 'New Support Request', body: message });
//       } else {
//         // Follow-up message
//         const newMsg = { sender: 'user', text: message, timestamp: new Date().toISOString() };
//         const updatedConversation = Array.isArray(selectedChat.conversation) ? [...selectedChat.conversation, newMsg] : [newMsg];
//         const { error } = await supabase.from('support_requests').update({ conversation: updatedConversation }).eq('id', selectedChat.id);
//         if (error) throw error;
//         setSelectedChat({ ...selectedChat, conversation: updatedConversation });
//         setChats(chats.map(c => c.id === selectedChat.id ? { ...c, conversation: updatedConversation } : c));
//         // Notify admin
//         await supabase.from('notifications').insert({ user_id: ADMIN_ID, title: 'User Follow-up', body: message });
//       }
//       setMessage('');
//     } catch (err) {
//       Alert.alert('Error', err.message || 'Failed to send message.');
//     }
//     setSending(false);
//   };

//   const handleStartNewChat = () => {
//     setSelectedChat(null);
//     setView('detail');
//     setMessage('');
//   };

//   const renderChatList = () => (
//     <View style={{ flex: 1 }}>
//       <Text style={styles.title}>Support Chats</Text>
//       <TouchableOpacity
//         style={[styles.button, { marginBottom: 16, backgroundColor: chats.some(c => c.status !== 'closed') ? '#b2bec3' : '#0984e3' }]}
//         onPress={handleStartNewChat}
//         disabled={chats.some(c => c.status !== 'closed')}
//       >
//         <Text style={styles.buttonText}>Start New Chat</Text>
//       </TouchableOpacity>
//       {loading ? <ActivityIndicator color="#0984e3" /> : (
//         <FlatList
//           data={chats}
//           keyExtractor={item => item.id}
//           renderItem={({ item }) => (
//             <TouchableOpacity style={styles.chatListItem} onPress={() => openChat(item)}>
//               <Text style={styles.chatListMsg} numberOfLines={1}>{item.message}</Text>
//               <Text style={styles.chatListStatus}>{item.status.toUpperCase()}</Text>
//               <Text style={styles.chatListDate}>{new Date(item.created_at).toLocaleString()}</Text>
//             </TouchableOpacity>
//           )}
//           ListEmptyComponent={<Text style={{ color: '#636e72', textAlign: 'center', marginTop: 32 }}>No support chats yet.</Text>}
//         />
//       )}
//     </View>
//   );

//   const renderChatDetail = () => {
//     const chat = [
//       selectedChat?.message ? { sender: 'user', text: selectedChat.message, timestamp: selectedChat.created_at } : null,
//       ...(Array.isArray(selectedChat?.conversation) ? selectedChat.conversation : [])
//     ].filter(Boolean);
//     return (
//       <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
//         <View style={{ flex: 1 }}>
//           <TouchableOpacity onPress={() => setView('list')} style={{ marginBottom: 8 }}>
//             <Text style={{ color: '#0984e3', fontWeight: 'bold' }}>{'< Back to Chats'}</Text>
//           </TouchableOpacity>
//           <Text style={styles.title}>Support Chat</Text>
//           <FlatList
//             ref={flatListRef}
//             data={chat}
//             keyExtractor={(_, idx) => idx.toString()}
//             renderItem={({ item }) => (
//               <View style={[styles.bubble, item.sender === 'admin' ? styles.adminBubble : styles.userBubble]}>
//                 <Text style={styles.bubbleText}>{item.text}</Text>
//                 <Text style={styles.bubbleTime}>{item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}</Text>
//               </View>
//             )}
//             contentContainerStyle={{ paddingVertical: 8 }}
//             onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
//           />
//           {selectedChat?.status !== 'closed' && (
//             <View style={styles.inputRow}>
//               <TextInput
//                 style={styles.input}
//                 placeholder="Type your message..."
//                 value={message}
//                 onChangeText={setMessage}
//                 multiline
//                 numberOfLines={2}
//                 editable={!sending}
//               />
//               <TouchableOpacity style={styles.button} onPress={handleSend} disabled={sending}>
//                 {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send</Text>}
//               </TouchableOpacity>
//             </View>
//           )}
//           {selectedChat?.status === 'closed' && (
//             <Text style={{ color: '#636e72', marginTop: 12, textAlign: 'center' }}>This support request is closed.</Text>
//           )}
//         </View>
//       </KeyboardAvoidingView>
//     );
//   };

//   return (
//     <View style={styles.container}>
//       {view === 'list' ? renderChatList() : renderChatDetail()}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#f5f6fa', padding: 16 },
//   title: { fontSize: 24, fontWeight: 'bold', color: '#2d3436', marginBottom: 8 },
//   button: { backgroundColor: '#0984e3', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 8 },
//   buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
//   chatListItem: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 12, elevation: 2 },
//   chatListMsg: { color: '#2d3436', fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
//   chatListStatus: { color: '#636e72', fontSize: 13, marginBottom: 2 },
//   chatListDate: { color: '#b2bec3', fontSize: 12 },
//   inputRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8 },
//   input: { backgroundColor: '#fff', borderRadius: 10, padding: 14, fontSize: 16, flex: 1, borderWidth: 1, borderColor: '#dfe6e9', marginRight: 8 },
//   bubble: { marginBottom: 10, padding: 12, borderRadius: 16, maxWidth: '80%' },
//   userBubble: { backgroundColor: '#fff', alignSelf: 'flex-start' },
//   adminBubble: { backgroundColor: '#0984e3', alignSelf: 'flex-end' },
//   bubbleText: { color: '#2d3436', fontSize: 15 },
//   bubbleTime: { color: '#636e72', fontSize: 11, marginTop: 4, textAlign: 'right' },
// }); 





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
  RefreshControl, // Import RefreshControl
} from "react-native"
import { supabase } from "./supabaseClient"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { useTheme } from "./ThemeContext" // Import useTheme

const { width } = Dimensions.get("window")
const ADMIN_ID = "admin" // Use a constant or fetch admin id if needed

export default function SupportCenter() {
  const { theme, isDarkTheme } = useTheme() // Get theme from context
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState("list") // 'list' or 'detail'
  const [selectedChat, setSelectedChat] = useState(null)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [refreshing, setRefreshing] = useState(false) // State for RefreshControl
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
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to load chats.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchChats()
  }, [fetchChats])

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
        return theme.success // Use theme success
      case "pending":
        return theme.warning // Use theme warning
      case "closed":
        return theme.error // Use theme error
      default:
        return theme.accent // Default to accent
    }
  }

  const formatDate = (dateStr) => {
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
      backgroundColor: theme.background, // Use theme background
    },
    listContainer: {
      flex: 1,
      paddingHorizontal: 20,
    },
    detailContainer: {
      flex: 1,
    },
    fixedHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 40,
      paddingBottom: 20,
      backgroundColor: theme.primary, // Fixed header background
      marginHorizontal: -20, // Extend to edges
      paddingHorizontal: 20,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      zIndex: 10,
    },
    chatHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 40,
      paddingBottom: 20,
      backgroundColor: theme.primary, // Fixed header background
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      zIndex: 10,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      color: theme.text, // Use theme text color
      fontSize: 20,
      fontWeight: "600",
      flex: 1,
      textAlign: "center", // Center title
    },
    placeholder: {
      width: 40, // To balance the back button space
    },
    titleSection: {
      alignItems: "center",
      marginBottom: 32,
      marginTop: 32, // Space after fixed header
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.surfaceSecondary, // Use theme surfaceSecondary
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
      fontSize: 28, // Slightly larger title
      fontWeight: "bold",
      color: theme.text, // Use theme text color
      marginBottom: 8,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 16,
      color: theme.textSecondary, // Use theme textSecondary
      textAlign: "center",
      lineHeight: 22,
      paddingHorizontal: 10,
    },
    newChatButton: {
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 24,
      backgroundColor: theme.accent, // Solid accent color
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
      color: isDarkTheme ? theme.text : theme.primary, // Text color for contrast
      fontSize: 16,
      fontWeight: "bold",
      marginLeft: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 60,
    },
    loadingText: {
      color: theme.text, // Use theme text color
      fontSize: 16,
      marginTop: 16,
    },
    chatListContainer: {
      paddingBottom: 32,
    },
    chatListItem: {
      backgroundColor: theme.surface, // Use theme surface
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border, // Use theme border
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
      color: theme.text, // Use theme text color
      fontWeight: "600",
      fontSize: 15,
      marginLeft: 12,
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    statusText: {
      color: theme.primary, // Text color for status badges (white/light)
      fontSize: 10,
      fontWeight: "bold",
    },
    chatListDate: {
      color: theme.textMuted, // Use theme textMuted
      fontSize: 12,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 60,
      paddingHorizontal: 24,
    },
    emptyStateTitle: {
      color: theme.text, // Use theme text color
      fontSize: 18,
      fontWeight: "bold",
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateSubtext: {
      color: theme.textMuted, // Use theme textMuted
      fontSize: 14,
      textAlign: "center",
    },
    messagesContainer: {
      paddingHorizontal: 24,
      paddingVertical: 16,
    },
    bubble: {
      marginBottom: 12,
      padding: 16,
      borderRadius: 16,
      maxWidth: "80%",
    },
    userBubble: {
      backgroundColor: theme.surfaceSecondary, // Use theme surfaceSecondary
      alignSelf: "flex-end",
      borderBottomRightRadius: 4,
    },
    adminBubble: {
      backgroundColor: theme.secondary, // Use theme secondary for admin
      alignSelf: "flex-start",
      borderBottomLeftRadius: 4,
    },
    bubbleText: {
      color: theme.text, // Use theme text color
      fontSize: 15,
      lineHeight: 20,
    },
    adminBubbleText: {
      color: theme.primary, // Text color for contrast on secondary
    },
    bubbleTime: {
      color: theme.textMuted, // Use theme textMuted
      fontSize: 11,
      marginTop: 6,
      textAlign: "right",
    },
    adminBubbleTime: {
      color: isDarkTheme ? theme.textSecondary : theme.textMuted, // Adjusted for admin bubble
      textAlign: "left",
    },
    inputContainer: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      backgroundColor: theme.surface, // Use theme surface
      borderTopWidth: 1,
      borderColor: theme.border, // Use theme border
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "flex-end",
    },
    messageInput: {
      backgroundColor: theme.surfaceSecondary, // Use theme surfaceSecondary
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.text, // Use theme text color
      flex: 1,
      marginRight: 12,
      maxHeight: 100,
      borderWidth: 2, // Thicker border
      borderColor: theme.border, // Use theme border
    },
    sendButton: {
      backgroundColor: theme.accent, // Use theme accent
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
      paddingHorizontal: 24,
      backgroundColor: theme.surfaceSecondary, // Use theme surfaceSecondary
      borderRadius: 12,
      marginHorizontal: 24,
      marginBottom: 16,
    },
    closedNoticeText: {
      color: theme.textMuted, // Use theme textMuted
      fontSize: 14,
      marginLeft: 8,
    },
  })

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />

      {view === "list" ? (
        <>
          {/* Fixed Header */}
          <View style={styles.fixedHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Support Center</Text>
            <View style={styles.placeholder} />
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
                <Text style={styles.chatListDate}>{formatDate(item.created_at)}</Text>
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
              <View style={styles.listContainer}>
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
                  <Ionicons name="add-circle" size={20} color={isDarkTheme ? theme.text : theme.primary} />
                  <Text style={styles.newChatText}>Start New Chat</Text>
                </TouchableOpacity>
              </View>
            }
            contentContainerStyle={{ paddingBottom: Platform.OS === "ios" ? 85 + 20 : 70 + 20 }}
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
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setView("list")} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Support Chat</Text>
            {selectedChat && (
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedChat.status) }]}>
                <Text style={styles.statusText}>{selectedChat.status.toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.placeholder} />
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
                  {item.timestamp ? formatDate(item.timestamp) : ""}
                </Text>
              </View>
            )}
            contentContainerStyle={{
              paddingBottom: Platform.OS === "ios" ? 85 + 20 : 70 + 20,
              paddingHorizontal: 24,
              paddingTop: 16,
            }}
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
            <View style={styles.inputContainer}>
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
            </View>
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
