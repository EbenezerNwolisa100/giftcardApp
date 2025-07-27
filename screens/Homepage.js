"use client"
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar } from "react-native"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { useTheme } from "./ThemeContext" // Adjust path as needed
import { Image } from "react-native";
import lightLogo from "../assets/lightlogo.png";
import darkLogo from "../assets/darklogo.png";


const { width } = Dimensions.get("window")

export default function Homepage({ navigation }) {
  const { theme, isDarkTheme } = useTheme()

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background, // Solid background color
    },
    statusBar: {
      backgroundColor: theme.primary,
    },
    header: {
      paddingTop: 60,
      paddingHorizontal: 24,
      alignItems: "center",
      marginBottom: 60, // Increased margin for more breathing room
    },
    logoContainer: {
      // No explicit width/height here, let image size handle it
      justifyContent: "center",
      alignItems: "center",
    },
    logoImage: {
      width: 100, // Larger logo for prominence
      height: 100,
      borderRadius: 25, // Slightly rounded corners for the logo image itself
      // No background or shadow on the image itself, let the container handle it if needed
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: "center",
      alignItems: "center", // Center content horizontally
    },
    welcomeSection: {
      alignItems: "center",
      marginBottom: 60, // More space below welcome text
    },
    welcomeTitle: {
      fontSize: 34, // Slightly larger for impact
      fontWeight: "bold",
      color: theme.text,
      textAlign: "center",
      marginBottom: 16,
      lineHeight: 40,
      letterSpacing: 0.5, // Subtle letter spacing
    },
    welcomeSubtitle: {
      fontSize: 17, // Slightly larger subtitle
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 26,
      paddingHorizontal: 10,
      maxWidth: 350, // Constrain width for better readability on larger screens
    },
    featuresContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 60,
      flexWrap: "wrap",
    },
    featureCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
      width: (width - 72) / 3,
      minWidth: 100,
      marginHorizontal: 4,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
      marginBottom: 16,
    },
    featureIcon: {
      color: theme.accent,
    },
    featureText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "600",
      marginTop: 10,
      textAlign: "center",
    },
    buttonContainer: {
      width: "100%", // Buttons take full width
      maxWidth: 380, // Max width for buttons
      alignItems: "center",
    },
    primaryButton: {
      width: "100%",
      marginBottom: 20, // Increased margin between buttons
      borderRadius: 12, // More subtle rounded corners for buttons
      backgroundColor: theme.accent, // Solid accent color for primary action
      paddingVertical: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 8 }, // More pronounced shadow
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 10,
    },
    primaryButtonText: {
      color: theme.primary, // Text color from primary for contrast
      fontSize: 18,
      fontWeight: "bold",
      marginRight: 10,
      letterSpacing: 0.5,
    },
    buttonIcon: {
      color: theme.primary, // Icon color from primary for contrast
    },
    secondaryButton: {
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      borderWidth: 1, // Add a subtle border
      borderColor: theme.border, // Border color from theme
      backgroundColor: theme.surfaceSecondary, // Use a secondary surface for this button
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    secondaryButtonText: {
      color: theme.accent, // Accent color for secondary button text
      fontSize: 16,
      fontWeight: "600",
      textAlign: "center",
    },
    bottomDecoration: {
      position: "absolute",
      bottom: -80, // Moved further down
      right: -80, // Moved further right
      opacity: 0.15, // Slightly less opaque
      zIndex: -1, // Ensure it's behind content
    },
    decorationCircle1: {
      width: 180, // Larger circle
      height: 180,
      borderRadius: 90,
      backgroundColor: theme.accent,
      position: "absolute",
    },
    decorationCircle2: {
      width: 120, // Larger circle
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.secondary,
      position: "absolute",
      top: 40, // Adjusted position
      left: 40, // Adjusted position
    },
  })

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />

      {/* Header Section - Logo is now directly in the header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={isDarkTheme ? lightLogo : darkLogo}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to the Future of Gift Cards</Text>
          <Text style={styles.welcomeSubtitle}>
            Trade, sell, and manage your gift cards with ease. Join thousands of users who trust us with their digital
            assets.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("Register")}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} style={styles.buttonIcon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Decoration */}
      <View style={styles.bottomDecoration}>
        <View style={styles.decorationCircle1} />
        <View style={styles.decorationCircle2} />
      </View>
    </View>
  )
}
