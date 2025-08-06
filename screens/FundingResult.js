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

export default function FundingResult() {
  const navigation = useNavigation()
  const route = useRoute()
  const { theme, isDarkTheme } = useTheme()
  const { success, amount, paymentMethod, status, error } = route.params || {}

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
      paddingTop: 40,
    },
    resultIcon: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 32,
      borderWidth: 3,
    },
    successIcon: {
      backgroundColor: theme.success + "20",
      borderColor: theme.success,
    },
    failureIcon: {
      backgroundColor: theme.error + "20",
      borderColor: theme.error,
    },
    resultTitle: {
      fontSize: 28,
      fontWeight: "bold",
      color: theme.text,
      textAlign: "center",
      marginBottom: 16,
    },
    resultMessage: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      marginBottom: 40,
    },
    detailsCard: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 24,
      width: "100%",
      marginBottom: 40,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    detailLabel: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    detailValue: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },
    amountValue: {
      fontSize: 20,
      fontWeight: "bold",
      color: success ? theme.success : theme.error,
    },
    statusValue: {
      fontSize: 16,
      fontWeight: "600",
    },
    statusPending: {
      color: theme.warning,
    },
    statusCompleted: {
      color: theme.success,
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

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case "flutterwave":
        return "Flutterwave"
      case "manual_transfer":
        return "Bank Transfer"
      default:
        return method
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "Pending"
      case "completed":
        return "Completed"
      default:
        return status
    }
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
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold' }}></Text>
        <View style={{ width: 32, height: 32 }} />
      </View>

      <View style={styles.content}>
        {/* Result Icon */}
        <View style={[
          styles.resultIcon,
          success ? styles.successIcon : styles.failureIcon
        ]}>
          <Ionicons 
            name={success ? "checkmark" : "close"} 
            size={60} 
            color={success ? theme.primary : theme.error} 
          />
        </View>

        {/* Result Title */}
        <Text style={styles.resultTitle}>
          {success ? "Funding Successful!" : "Funding Failed"}
        </Text>
        <Text style={styles.resultMessage}>
          {success 
            ? "Your wallet has been funded successfully. You can now use your balance for transactions."
            : "We couldn't process your funding request. Please try again or contact support if the problem persists."
          }
        </Text>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.amountValue}>₦{amount?.toLocaleString()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>{getPaymentMethodLabel(paymentMethod)}</Text>
          </View>
          {status && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={[
                styles.statusValue,
                status === "pending" ? styles.statusPending : styles.statusCompleted
              ]}>
                {getStatusLabel(status)}
              </Text>
            </View>
          )}
          {!success && error && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Error</Text>
              <Text style={[styles.detailValue, { color: theme.error }]}>
                {error}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.replace("Main", { screen: "Dashboard" })}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
            <Ionicons name="home" size={20} color={theme.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.replace("Main", { screen: "Transactions" })}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>View Transactions</Text>
            <Ionicons name="receipt" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Info Notice */}
        <View style={styles.infoNotice}>
          <Ionicons 
            name="information-circle" 
            size={16} 
            color={success ? theme.success : theme.warning} 
          />
          <Text style={styles.infoText}>
            {success 
              ? "Your funding transaction has been recorded. Check your wallet balance and transaction history."
              : "If you continue to experience issues, please contact our support team. Your funds are safe."
            }
          </Text>
        </View>
      </View>
    </View>
  )
}