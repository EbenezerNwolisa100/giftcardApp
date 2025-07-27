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
  Platform,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { useTheme } from "./ThemeContext" // Adjust path as needed

const { width } = Dimensions.get("window")
const HEADER_HEIGHT_FAQ = Platform.OS === "android" ? 90 : 100 // Approximate height for the fixed header

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
    q: "How do I contact support? ",
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
  const { theme, isDarkTheme } = useTheme() // Destructure isDarkTheme
  const [loading, setLoading] = useState(false)


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
    loadingText: {
      color: theme.text,
      fontSize: 16,
      marginTop: 16,
      fontWeight: '500',
    },
    fixedHeader: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      height: HEADER_HEIGHT_FAQ,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 50, // Dynamic padding for status bar
      borderBottomWidth: 1,
      borderBottomColor: theme.border, // Themed
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
      backgroundColor: theme.primary, // Themed
    },
    backButton: {
      position: "absolute",
      left: 20,
      top: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 50, // Align with header content
      paddingVertical: 8,
      zIndex: 11,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      flex: 1,
      textAlign: "center",
      color: theme.textContrast, // Themed
    },
    placeholder: {
      width: 24, // To balance the back button
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingBottom: Platform.OS === "ios" ? 85 + 20 : 70 + 20,
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
      backgroundColor: theme.surfaceSecondary, // Themed
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 8,
      textAlign: "center",
      color: theme.text, // Themed
    },
    subtitle: {
      fontSize: 14,
      textAlign: "center",
      lineHeight: 20,
      color: theme.textSecondary, // Themed
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
      backgroundColor: theme.card, // Themed
      borderColor: theme.border, // Themed
      shadowColor: theme.shadow, // Themed
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
      color: theme.text, // Themed
    },
    answerContainer: {
      paddingHorizontal: 20,
      paddingBottom: 20,
      borderTopWidth: 1,
      borderTopColor: theme.border, // Themed
    },
    answer: {
      fontSize: 14,
      lineHeight: 20,
      marginTop: 12,
      color: theme.textSecondary, // Themed
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
      shadowColor: theme.shadow, // Themed
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
      color: theme.textContrast, // Themed
    },
    supportSubtitle: {
      fontSize: 14,
      textAlign: "center",
      marginBottom: 20,
      color: theme.textContrast, // Themed
    },
    contactButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: theme.surfaceSecondary, // Themed
    },
    contactButtonText: {
      fontSize: 16,
      fontWeight: "bold",
      marginRight: 8,
      color: theme.text, // Themed
    },
    // Skeleton Styles
    skeletonContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    skeletonFixedHeader: {
      height: HEADER_HEIGHT_FAQ,
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
      marginHorizontal: 20,
      marginTop: 20,
      marginBottom: 32,
    },
    skeletonFaqCard: {
      height: 80, // Approximate height of a collapsed FAQ card
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginBottom: 12,
      marginHorizontal: 20,
    },
    skeletonSupportCard: {
      height: 180, // Approximate height of support card
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 20,
      marginHorizontal: 20,
      marginTop: 20,
      marginBottom: 24,
    },
  })

  // FAQ Skeleton Component
  const FAQSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />
      {/* Fixed Header Skeleton */}
      <View style={styles.skeletonFixedHeader}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 50, paddingBottom: 20, width: '100%' }}>
          <View style={{ width: 24, height: 24, backgroundColor: theme.surfaceSecondary, borderRadius: 12 }} /> {/* Back button placeholder */}
          <View style={[styles.headerTitle, { backgroundColor: theme.surfaceSecondary, width: 120, height: 24 }]} /> {/* Title placeholder */}
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingTop: HEADER_HEIGHT_FAQ + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section Skeleton */}
        <View style={styles.skeletonTitleSection} />

        {/* FAQ Items Skeletons */}
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.skeletonFaqCard} />
        ))}

        {/* Support Card Skeleton */}
        <View style={styles.skeletonSupportCard} />
      </ScrollView>
    </View>
  );

  if (loading) { // You might want a separate loading state for the FAQ content vs. initial app load
    // For now, let's assume `loading` is managed by the parent screen or global state for initial app load.
    // If FAQ content itself needs to be fetched, you'd integrate a local loading state.
    // For demonstration, let's just use a simple check.
    // If you uncomment the `useEffect` and `setLoading(true)` in FAQ, this would trigger.
    // For now, I'll remove `loading` check from here to allow the actual content to render.
    // return <FAQSkeleton />;
  }


  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />

      {/* Fixed Header */}
      <View
        style={{
          // backgroundColor: theme.primary,
          borderBottomColor: theme.border,
          shadowColor: theme.shadow,
          paddingHorizontal: 10,
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 5 : 45,
          paddingBottom: 10,
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
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold' }}>FAQs</Text>
        <View style={{ width: 32, height: 32 }} />
      </View>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: 20 },
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
          <View style={[styles.iconContainer, { backgroundColor: theme.accent + "1A" }]}>
            <Ionicons name="help-circle" size={32} color={theme.secondary} />
          </View>
          <Text style={styles.title}>Frequently Asked Questions</Text>
          <Text style={styles.subtitle}>
            Find answers to common questions about our platform
          </Text>
        </View>

        {/* FAQ Items */}
        <View style={styles.faqContainer}>
          {FAQS.map((item, index) => (
            <View
              key={index}
              style={styles.faqCard}
            >
              <TouchableOpacity
                style={styles.questionContainer}
                onPress={() => toggleExpanded(index)}
                activeOpacity={0.8}
              >
                <View style={styles.questionContent}>
                  <Text style={styles.question}>{item.q}</Text>
                  <Ionicons
                    name={expandedItems.has(index) ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={theme.accent}
                  />
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
          <View
            style={styles.supportCard}
          >
            <LinearGradient colors={[theme.accent, theme.accent]} style={styles.supportGradient}>
              <Ionicons name="chatbubbles" size={24} color={theme.textContrast} />
              <Text style={styles.supportTitle}>Still need help?</Text>
              <Text style={styles.supportSubtitle}>
                Our support team is here to assist you
              </Text>
              <TouchableOpacity
                style={[styles.contactButton, { backgroundColor: theme.surfaceSecondary }]}
                onPress={() => navigation.navigate("SupportCenter")}
                activeOpacity={0.8}
              >
                <Text style={[styles.contactButtonText, { color: theme.text }]}>Contact Support</Text>
                <Ionicons name="arrow-forward" size={16} color={theme.text} />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
