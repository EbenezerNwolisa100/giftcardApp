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

import { useState, useEffect, useRef } from "react"
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
} from "react-native"
import { supabase } from "./supabaseClient"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"

const { width } = Dimensions.get("window")

const ADMIN_ID = "admin" // Use a constant or fetch admin id if needed

export default function SupportCenter() {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState("list") // 'list' or 'detail'
  const [selectedChat, setSelectedChat] = useState(null)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const flatListRef = useRef()
  const navigation = useNavigation()

  useEffect(() => {
    fetchChats()
  }, [])

  const fetchChats = async () => {
    setLoading(true)
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
    }
    setLoading(false)
  }

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
        return "#4caf50"
      case "pending":
        return "#ffa726"
      case "closed":
        return "#ff6b6b"
      default:
        return "#7965C1"
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

  const renderChatList = () => (
    <View style={styles.listContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support Center</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Title Section */}
      <View style={styles.titleSection}>
        <View style={styles.iconContainer}>
          <Ionicons name="chatbubbles" size={32} color="#E3D095" />
        </View>
        <Text style={styles.title}>How can we help?</Text>
        <Text style={styles.subtitle}>Our support team is here to assist you</Text>
      </View>

      {/* New Chat Button */}
      <TouchableOpacity
        style={[styles.newChatButton, chats.some((c) => c.status !== "closed") && styles.newChatButtonDisabled]}
        onPress={handleStartNewChat}
        disabled={chats.some((c) => c.status !== "closed")}
        activeOpacity={0.8}
      >
        <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.newChatGradient}>
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.newChatText}>Start New Chat</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Chat List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#7965C1" size="large" />
          <Text style={styles.loadingText}>Loading chats...</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.chatListItem} onPress={() => openChat(item)} activeOpacity={0.8}>
              <View style={styles.chatItemHeader}>
                <View style={styles.chatItemLeft}>
                  <Ionicons name="chatbubble" size={20} color="#7965C1" />
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
              <Ionicons name="chatbubbles-outline" size={48} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyStateTitle}>No support chats yet</Text>
              <Text style={styles.emptyStateSubtext}>Start a new chat to get help from our support team</Text>
            </View>
          }
          contentContainerStyle={styles.chatListContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )

  const renderChatDetail = () => {
    const chat = [
      selectedChat?.message ? { sender: "user", text: selectedChat.message, timestamp: selectedChat.created_at } : null,
      ...(Array.isArray(selectedChat?.conversation) ? selectedChat.conversation : []),
    ].filter(Boolean)

    return (
      <KeyboardAvoidingView style={styles.detailContainer} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setView("list")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Support Chat</Text>
          {selectedChat && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedChat.status) }]}>
              <Text style={styles.statusText}>{selectedChat.status.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={chat}
          keyExtractor={(_, idx) => idx.toString()}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.sender === "admin" ? styles.adminBubble : styles.userBubble]}>
              <Text style={[styles.bubbleText, item.sender === "admin" && styles.adminBubbleText]}>{item.text}</Text>
              <Text style={[styles.bubbleTime, item.sender === "admin" && styles.adminBubbleTime]}>
                {item.timestamp ? formatDate(item.timestamp) : ""}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        {/* Input */}
        {selectedChat?.status !== "closed" && (
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.messageInput}
                placeholder="Type your message..."
                placeholderTextColor="rgba(255,255,255,0.6)"
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
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="send" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {selectedChat?.status === "closed" && (
          <View style={styles.closedNotice}>
            <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.6)" />
            <Text style={styles.closedNoticeText}>This support request is closed.</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E2148" />
      <LinearGradient colors={["#0E2148", "#483AA0"]} style={styles.backgroundGradient} />
      {view === "list" ? renderChatList() : renderChatDetail()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0E2148",
  },
  backgroundGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  detailContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 40,
    marginBottom: 32,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 40,
    marginBottom: 16,
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
  },
  placeholder: {
    width: 40,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(227, 208, 149, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 20,
  },
  newChatButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    elevation: 8,
    shadowColor: "#7965C1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  newChatButtonDisabled: {
    opacity: 0.5,
  },
  newChatGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  newChatText: {
    color: "#fff",
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
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
  },
  chatListContainer: {
    paddingBottom: 32,
  },
  chatListItem: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
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
    color: "#fff",
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
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  chatListDate: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: "rgba(255,255,255,0.6)",
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
    backgroundColor: "rgba(255,255,255,0.1)",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  adminBubble: {
    backgroundColor: "#7965C1",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 20,
  },
  adminBubbleText: {
    color: "#fff",
  },
  bubbleTime: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    marginTop: 6,
    textAlign: "right",
  },
  adminBubbleTime: {
    color: "rgba(255,255,255,0.8)",
    textAlign: "left",
  },
  inputContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  messageInput: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#fff",
    flex: 1,
    marginRight: 12,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  sendButton: {
    backgroundColor: "#7965C1",
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
  },
  closedNoticeText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    marginLeft: 8,
  },
})
