"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Clipboard,
  Image,
  Dimensions,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"

const { width } = Dimensions.get("window")

const STATUS_COLORS = {
  completed: "#4caf50",
  pending: "#E3D095",
  rejected: "#ff6b6b",
}

const TYPE_COLORS = {
  sell: "#7965C1",
  buy: "#E3D095",
  withdrawal: "#483AA0",
}

const PAYMENT_METHOD_LABELS = {
  wallet: "Wallet",
  paystack: "Paystack",
  manual_transfer: "Manual Transfer",
}

export default function TransactionDetails({ route, navigation }) {
  const { transaction } = route.params
  const [copiedField, setCopiedField] = useState(null)

  const copyToClipboard = async (text, fieldName) => {
    if (!text) return

    try {
      await Clipboard.setString(text)
      setCopiedField(fieldName)
      Alert.alert("Copied!", `${fieldName} copied to clipboard`)

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedField(null)
      }, 2000)
    } catch (error) {
      Alert.alert("Error", "Failed to copy to clipboard")
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return "checkmark-circle"
      case "pending":
        return "time"
      case "rejected":
        return "close-circle"
      default:
        return "help-circle"
    }
  }

  const getTransactionIcon = (txType) => {
    switch (txType) {
      case "buy":
        return "arrow-down"
      case "sell":
        return "arrow-up"
      case "withdrawal":
        return "wallet"
      default:
        return "card"
    }
  }

  const renderDetailRow = (label, value, copyable = false, fieldName = "") => {
    if (!value) return null

    return (
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <View style={styles.detailValueContainer}>
          <Text style={styles.detailValue} numberOfLines={copyable ? undefined : 1}>
            {value}
          </Text>
          {copyable && (
            <TouchableOpacity
              style={[styles.copyButton, copiedField === fieldName && styles.copyButtonActive]}
              onPress={() => copyToClipboard(value, fieldName)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={copiedField === fieldName ? "checkmark" : "copy"}
                size={16}
                color={copiedField === fieldName ? "#4caf50" : "#E3D095"}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E2148" />

      {/* Header */}
      <LinearGradient colors={["#0E2148", "#483AA0"]} style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction Details</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Transaction Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.transactionIconContainer}>
              {transaction.txType === "withdrawal" ? (
                <View style={[styles.transactionIconBg, { backgroundColor: TYPE_COLORS[transaction.txType] }]}>
                  <Ionicons name={getTransactionIcon(transaction.txType)} size={24} color="#fff" />
                </View>
              ) : (
                <View style={styles.brandImageContainer}>
                  {transaction.image_url ? (
                    <Image source={{ uri: transaction.image_url }} style={styles.brandImage} resizeMode="contain" />
                  ) : (
                    <View style={[styles.transactionIconBg, { backgroundColor: TYPE_COLORS[transaction.txType] }]}>
                      <Text style={styles.brandInitial}>{(transaction.brand_name || "?")[0]}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            <View style={styles.summaryInfo}>
              <Text style={styles.transactionType}>{transaction.displayType}</Text>
              <Text style={styles.brandName}>{transaction.brand_name || transaction.displayBrand}</Text>
              {transaction.variant_name && (
                <Text style={styles.variantName}>{transaction.variant_name}</Text>
              )}
            </View>

            <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[transaction.displayStatus]}20` }]}>
              <Ionicons
                name={getStatusIcon(transaction.displayStatus)}
                size={16}
                color={STATUS_COLORS[transaction.displayStatus]}
              />
              <Text style={[styles.statusText, { color: STATUS_COLORS[transaction.displayStatus] }]}>
                {transaction.displayStatus?.charAt(0).toUpperCase() + transaction.displayStatus?.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Amount</Text>
            <Text style={styles.amountValue}>₦{transaction.displayAmount?.toLocaleString()}</Text>
          </View>
        </View>

        {/* Transaction Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Transaction Information</Text>

          {renderDetailRow("Transaction ID", transaction.displayId, true, "Transaction ID")}
          {renderDetailRow("Date & Time", new Date(transaction.displayDate).toLocaleString())}
          {renderDetailRow("Type", transaction.displayType)}
          {renderDetailRow(
            "Status",
            transaction.displayStatus?.charAt(0).toUpperCase() + transaction.displayStatus?.slice(1),
          )}

          {/* Brand and Variant */}
          {transaction.brand_name && renderDetailRow("Brand", transaction.brand_name)}
          {transaction.variant_name && renderDetailRow("Variant", transaction.variant_name)}
          {transaction.quantity && renderDetailRow("Quantity", transaction.quantity)}
          {transaction.rate && renderDetailRow("Rate", `₦${transaction.rate}`)}
          {transaction.amount && renderDetailRow("Card Value", `$${transaction.amount}`)}

          {/* Gift Card Codes */}
          {transaction.txType === "buy" && Array.isArray(transaction.card_codes) && transaction.card_codes.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.detailLabel}>Gift Card Codes</Text>
              {transaction.card_codes.map((code, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={styles.detailValue}>{code}</Text>
                  <TouchableOpacity
                    style={[styles.copyButton, copiedField === `Gift Card Code ${idx}` && styles.copyButtonActive]}
                    onPress={() => copyToClipboard(code, `Gift Card Code ${idx}`)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={copiedField === `Gift Card Code ${idx}` ? "checkmark" : "copy"}
                      size={16}
                      color={copiedField === `Gift Card Code ${idx}` ? "#4caf50" : "#E3D095"}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          {transaction.txType === "sell" && transaction.card_code && (
            renderDetailRow("Gift Card Code", transaction.card_code, true, "Gift Card Code")
          )}

          {/* Buy Transaction Specific Details */}
          {transaction.txType === "buy" && (
            <>
              {transaction.paymentMethod &&
                renderDetailRow(
                  "Payment Method",
                  PAYMENT_METHOD_LABELS[transaction.paymentMethod] || transaction.paymentMethod,
                )}
              {transaction.paystackRef &&
                renderDetailRow("Paystack Reference", transaction.paystackRef, true, "Paystack Reference")}
              {transaction.proofUrl && renderDetailRow("Proof of Payment", "Uploaded")}
            </>
          )}

          {/* Rejection Reason */}
          {(transaction.displayStatus === "rejected" || transaction.status === "rejected") && (transaction.rejection_reason || transaction.rejectionReason) && (
            <View style={styles.rejectionContainer}>
              <Text style={styles.rejectionTitle}>Rejection Reason</Text>
              <Text style={styles.rejectionText}>{transaction.rejection_reason || transaction.rejectionReason}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {/* For buy, allow copying each code individually */}
          {transaction.txType === "buy" && Array.isArray(transaction.card_codes) && transaction.card_codes.length > 0 && (
            transaction.card_codes.map((code, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.primaryButton}
                onPress={() => copyToClipboard(code, `Gift Card Code ${idx}`)}
                activeOpacity={0.8}
              >
                <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.buttonGradient}>
                  <Ionicons name="copy" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Copy Gift Card Code {transaction.card_codes.length > 1 ? idx + 1 : ""}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))
          )}
          {/* For sell, allow copying the single code */}
          {transaction.txType === "sell" && transaction.card_code && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => copyToClipboard(transaction.card_code, "Gift Card Code")}
              activeOpacity={0.8}
            >
              <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.buttonGradient}>
                <Ionicons name="copy" size={20} color="#fff" />
                <Text style={styles.buttonText}>Copy Gift Card Code</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => copyToClipboard(transaction.displayId, "Transaction ID")}
            activeOpacity={0.8}
          >
            <Ionicons name="copy-outline" size={20} color="#7965C1" />
            <Text style={styles.secondaryButtonText}>Copy Transaction ID</Text>
          </TouchableOpacity>
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <View style={styles.helpCard}>
            <Ionicons name="information-circle" size={20} color="#E3D095" />
            <Text style={styles.helpText}>
              Need help with this transaction? Contact our support team for assistance.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.supportButton}
            onPress={() => navigation.navigate("SupportCenter")}
            activeOpacity={0.8}
          >
            <Ionicons name="headset" size={20} color="#7965C1" />
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
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
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  transactionIconContainer: {
    marginRight: 16,
  },
  transactionIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  brandImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  brandImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  brandInitial: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  summaryInfo: {
    flex: 1,
  },
  transactionType: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  brandName: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  variantName: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  amountContainer: {
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  amountLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginBottom: 4,
  },
  amountValue: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  detailsCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  detailLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  detailValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 2,
    justifyContent: "flex-end",
  },
  detailValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },
  copyButton: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 6,
    backgroundColor: "rgba(227, 208, 149, 0.2)",
  },
  copyButtonActive: {
    backgroundColor: "rgba(76, 175, 80, 0.2)",
  },
  rejectionContainer: {
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
  },
  rejectionTitle: {
    color: "#ff6b6b",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  rejectionText: {
    color: "rgba(255, 107, 107, 0.9)",
    fontSize: 14,
    lineHeight: 20,
  },
  actionContainer: {
    marginBottom: 20,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#7965C1",
    backgroundColor: "rgba(121, 101, 193, 0.1)",
  },
  secondaryButtonText: {
    color: "#7965C1",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  helpSection: {
    marginBottom: 40,
  },
  helpCard: {
    backgroundColor: "rgba(227, 208, 149, 0.1)",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(227, 208, 149, 0.3)",
  },
  helpText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  supportButtonText: {
    color: "#7965C1",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
})
