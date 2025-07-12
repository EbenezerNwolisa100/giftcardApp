// import React from 'react';
// import { View, Text, ScrollView, StyleSheet } from 'react-native';

// const FAQS = [
//   { q: 'How do I sell a gift card?', a: 'Go to the Sell Giftcard tab, select your brand, enter details, and submit.' },
//   { q: 'How long does withdrawal take?', a: 'Withdrawals are processed within 24 hours.' },
//   { q: 'How do I contact support?', a: 'Use the Support Center in your profile to send us a message.' },
//   { q: 'How do I change my password?', a: 'Go to Profile > Security > Change Password.' },
// ];

// export default function FAQ() {
//   return (
//     <ScrollView style={styles.container}>
//       <Text style={styles.title}>Frequently Asked Questions</Text>
//       {FAQS.map((item, idx) => (
//         <View key={idx} style={styles.card}>
//           <Text style={styles.question}>{item.q}</Text>
//           <Text style={styles.answer}>{item.a}</Text>
//         </View>
//       ))}
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#f5f6fa', padding: 16 },
//   title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#2d3436' },
//   card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 14, elevation: 2 },
//   question: { fontWeight: 'bold', fontSize: 16, color: '#0984e3', marginBottom: 6 },
//   answer: { color: '#636e72', fontSize: 15 },
// }); 




"use client"

import { useState } from "react"
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Dimensions } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"

const { width } = Dimensions.get("window")

const FAQS = [
  {
    q: "How do I sell a gift card?",
    a: "Navigate to the 'Sell Gift Card' section, select your brand, enter the card details including amount and code, upload a clear image of the card, and submit for review. Our team will process it within 24 hours.",
  },
  {
    q: "How long does withdrawal take?",
    a: "Withdrawals are processed within 24 hours on business days. Ensure your bank details are correct to avoid delays.",
  },
  {
    q: "How do I contact support?",
    a: "Use the Support Center in your profile to send us a message. Our support team responds within 2-4 hours during business hours.",
  },
  {
    q: "How do I change my password?",
    a: "Go to Profile > Security > Change Password. You'll need to enter your current password and create a new one.",
  },
  {
    q: "What gift card brands do you accept?",
    a: "We accept major brands including Amazon, iTunes, Google Play, Steam, and many more. Check the 'Sell Gift Card' section for the complete list.",
  },
  {
    q: "How are exchange rates determined?",
    a: "Our rates are updated in real-time based on market demand and supply. You can check current rates in the 'Hottest Rates' section.",
  },
]

export default function FAQ() {
  const [expandedItems, setExpandedItems] = useState(new Set())
  const navigation = useNavigation()

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedItems(newExpanded)
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E2148" />

      <LinearGradient colors={["#0E2148", "#483AA0"]} style={styles.backgroundGradient} />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FAQ</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="help-circle" size={32} color="#E3D095" />
          </View>
          <Text style={styles.title}>Frequently Asked Questions</Text>
          <Text style={styles.subtitle}>Find answers to common questions about our platform</Text>
        </View>

        {/* FAQ Items */}
        <View style={styles.faqContainer}>
          {FAQS.map((item, index) => (
            <View key={index} style={styles.faqCard}>
              <TouchableOpacity
                style={styles.questionContainer}
                onPress={() => toggleExpanded(index)}
                activeOpacity={0.8}
              >
                <View style={styles.questionContent}>
                  <Text style={styles.question}>{item.q}</Text>
                  <Ionicons name={expandedItems.has(index) ? "chevron-up" : "chevron-down"} size={20} color="#7965C1" />
                </View>
              </TouchableOpacity>

              {expandedItems.has(index) && (
                <View style={styles.answerContainer}>
                  <Text style={styles.answer}>{item.a}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Contact Support */}
        <View style={styles.supportSection}>
          <View style={styles.supportCard}>
            <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.supportGradient}>
              <Ionicons name="chatbubbles" size={24} color="#fff" />
              <Text style={styles.supportTitle}>Still need help?</Text>
              <Text style={styles.supportSubtitle}>Our support team is here to assist you</Text>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => navigation.navigate("SupportCenter")}
                activeOpacity={0.8}
              >
                <Text style={styles.contactButtonText}>Contact Support</Text>
                <Ionicons name="arrow-forward" size={16} color="#7965C1" />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>
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
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 40,
    marginBottom: 32,
  },
  backButton: {
    paddingVertical: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
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
  faqContainer: {
    marginBottom: 32,
  },
  faqCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  questionContainer: {
    padding: 20,
  },
  questionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  question: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#fff",
    flex: 1,
    marginRight: 12,
  },
  answerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  answer: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  supportSection: {
    marginTop: 20,
  },
  supportCard: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  supportGradient: {
    padding: 24,
    alignItems: "center",
  },
  supportTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
  },
  supportSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  contactButton: {
    backgroundColor: "#E3D095",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  contactButtonText: {
    color: "#0E2148",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
})
