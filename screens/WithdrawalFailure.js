import React from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Dimensions,
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "./ThemeContext"

const { width } = Dimensions.get("window")

export default function WithdrawalFailure() {
  const navigation = useNavigation()
  const route = useRoute()
  const { theme, isDarkTheme } = useTheme()
  const { error, amount } = route.params || {}

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    // Fixed Header Styles
    fixedHeader: {
      paddingHorizontal: 18,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 5 : 45,
      paddingBottom: 16,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerTitle: {
      color: theme.text,
      fontSize: 24,
      fontWeight: "bold",
      flex: 1,
      textAlign: "center",
    },
    backButton: {
      padding: 8,
      zIndex: 11,
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingTop: 30,
    },
    failureIcon: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.error + "20",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 32,
      borderWidth: 3,
      borderColor: theme.error,
    },
    failureTitle: {
      fontSize: 28,
      fontWeight: "bold",
      color: theme.text,
      textAlign: "center",
      marginBottom: 16,
    },
    failureMessage: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      marginBottom: 40,
    },
    errorCard: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 24,
      width: "100%",
      marginBottom: 40,
      borderWidth: 1,
      borderColor: theme.error + "30",
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    errorHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    errorIcon: {
      marginRight: 12,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.error,
    },
    errorMessage: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    amountInfo: {
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      alignItems: "center",
    },
    amountLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    amountValue: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
    },
    buttonContainer: {
      width: "100%",
      gap: 16,
    },
    primaryButton: {
      backgroundColor: theme.accent,
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 32,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    primaryButtonText: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.primary,
      marginRight: 8,
    },
    secondaryButton: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 32,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      borderWidth: 1,
      borderColor: theme.border,
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginRight: 8,
    },
    infoNotice: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 24,
      paddingHorizontal: 24,
    },
    infoText: {
      fontSize: 12,
      marginLeft: 8,
      textAlign: "center",
      color: theme.textSecondary,
      lineHeight: 18,
    },
  })

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
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold' }}></Text>
        <View style={{ width: 32, height: 32 }} />
      </View>

      <View style={styles.content}>
        {/* Failure Icon */}
        <View style={styles.failureIcon}>
          <Ionicons name="close" size={60} color={theme.error} />
        </View>

        {/* Failure Title */}
        <Text style={styles.failureTitle}>Withdrawal Failed</Text>
        <Text style={styles.failureMessage}>
          We couldn't process your withdrawal request. Please try again or contact support if the problem persists.
        </Text>

        {/* Error Details Card */}
        <View style={styles.errorCard}>
          <View style={styles.errorHeader}>
            <Ionicons name="alert-circle" size={24} color={theme.error} style={styles.errorIcon} />
            <Text style={styles.errorTitle}>Error Details</Text>
          </View>
          <Text style={styles.errorMessage}>
            {error || "An unexpected error occurred while processing your withdrawal request."}
          </Text>
          {amount && (
            <View style={styles.amountInfo}>
              <Text style={styles.amountLabel}>Attempted Amount</Text>
              <Text style={styles.amountValue}>₦{amount?.toLocaleString()}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Try Again</Text>
            <Ionicons name="refresh" size={20} color={theme.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.replace("Main", { screen: "Support" })}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Contact Support</Text>
            <Ionicons name="chatbubble" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Info Notice */}
        <View style={styles.infoNotice}>
          <Ionicons name="information-circle" size={16} color={theme.warning} />
          <Text style={styles.infoText}>
            If you continue to experience issues, please contact our support team. 
            Your funds are safe and have not been deducted from your account.
          </Text>
        </View>
      </View>
    </View>
  )
}