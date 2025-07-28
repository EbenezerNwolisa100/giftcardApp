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

export default function WithdrawalSuccess() {
  const navigation = useNavigation()
  const route = useRoute()
  const { theme, isDarkTheme } = useTheme()
  const { amount, bankDetails } = route.params || {}

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
    successIcon: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.success + "20",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 32,
      borderWidth: 3,
      borderColor: theme.success,
    },
    successTitle: {
      fontSize: 28,
      fontWeight: "bold",
      color: theme.text,
      textAlign: "center",
      marginBottom: 16,
    },
    successMessage: {
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
      color: theme.success,
    },
    bankInfo: {
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
    },
    bankInfoText: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: "center",
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
        {/* Success Icon */}
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={60} color={theme.primary} />
        </View>

        {/* Success Title */}
        <Text style={styles.successTitle}>Withdrawal Submitted!</Text>
        <Text style={styles.successMessage}>
          Your withdrawal request has been submitted successfully and is being processed.
        </Text>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.amountValue}>₦{amount?.toLocaleString()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={[styles.detailValue, { color: theme.warning }]}>Pending</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Processing Time</Text>
            <Text style={styles.detailValue}>24 hours</Text>
          </View>
          {bankDetails && (
            <View style={styles.bankInfo}>
              <Text style={styles.bankInfoText}>
                {bankDetails.bank_name} • {bankDetails.account_number}
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
          <Ionicons name="information-circle" size={16} color={theme.warning} />
          <Text style={styles.infoText}>
            You'll receive a notification once your withdrawal is processed. 
            Check your bank account within 24 hours on business days.
          </Text>
        </View>
      </View>
    </View>
  )
}