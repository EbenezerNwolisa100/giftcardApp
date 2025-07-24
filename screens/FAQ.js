"use client"

import { useState, useCallback } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  RefreshControl,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { useTheme } from "./ThemeContext" // Adjust path as needed

const { width } = Dimensions.get("window")
const HEADER_HEIGHT = 100 // Approximate height for the fixed header

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
  const [refreshing, setRefreshing] = useState(false)
  const navigation = useNavigation()
  const { theme } = useTheme()

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedItems(newExpanded)
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    // Simulate a network request or data refetch
    setTimeout(() => {
      setRefreshing(false)
      // In a real app, you would refetch your FAQ data here
    }, 1500)
  }, [])

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.primary} />

      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>FAQ</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: HEADER_HEIGHT + 20 }, // Adjust padding to clear fixed header
        ]}
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
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={[styles.iconContainer, { backgroundColor: theme.accentBackground }]}>
            <Ionicons name="help-circle" size={32} color={theme.accent} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Frequently Asked Questions</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Find answers to common questions about our platform
          </Text>
        </View>

        {/* FAQ Items */}
        <View style={styles.faqContainer}>
          {FAQS.map((item, index) => (
            <View
              key={index}
              style={[
                styles.faqCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  shadowColor: theme.shadow,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.questionContainer}
                onPress={() => toggleExpanded(index)}
                activeOpacity={0.8}
              >
                <View style={styles.questionContent}>
                  <Text style={[styles.question, { color: theme.text }]}>{item.q}</Text>
                  <Ionicons
                    name={expandedItems.has(index) ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={theme.accent}
                  />
                </View>
              </TouchableOpacity>
              {expandedItems.has(index) && (
                <View style={[styles.answerContainer, { borderTopColor: theme.border }]}>
                  <Text style={[styles.answer, { color: theme.textSecondary }]}>{item.a}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Contact Support */}
        <View style={styles.supportSection}>
          <View
            style={[
              styles.supportCard,
              {
                shadowColor: theme.shadow,
              },
            ]}
          >
            <LinearGradient colors={[theme.accent, theme.secondary]} style={styles.supportGradient}>
              <Ionicons name="chatbubbles" size={24} color={theme.textContrast} />
              <Text style={[styles.supportTitle, { color: theme.textContrast }]}>Still need help?</Text>
              <Text style={[styles.supportSubtitle, { color: theme.textContrast }]}>
                Our support team is here to assist you
              </Text>
              <TouchableOpacity
                style={[styles.contactButton, { backgroundColor: theme.buttonBackground }]}
                onPress={() => navigation.navigate("SupportCenter")}
                activeOpacity={0.8}
              >
                <Text style={[styles.contactButtonText, { color: theme.buttonText }]}>Contact Support</Text>
                <Ionicons name="arrow-forward" size={16} color={theme.buttonText} />
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
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight || 40, // Dynamic padding for status bar
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)", // Will be themed
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: StatusBar.currentHeight || 40, // Align with header content
    paddingVertical: 8,
    zIndex: 11,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 24, // To balance the back button
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 20, // Additional spacing after fixed header
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  faqContainer: {
    marginBottom: 32,
  },
  faqCard: {
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    flex: 1,
    marginRight: 12,
  },
  answerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
  },
  answer: {
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  supportGradient: {
    padding: 24,
    alignItems: "center",
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
  },
  supportSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
})
