import { useState, useCallback } from "react"
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
  RefreshControl,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "./ThemeContext"
// import Clipboard from '@react-native-clipboard/clipboard'

const { width } = Dimensions.get("window")
const STATUS_BAR_HEIGHT_TX_DETAILS = Platform.OS === "ios" ? 50 : StatusBar.currentHeight
const HEADER_HEIGHT_TX_DETAILS = STATUS_BAR_HEIGHT_TX_DETAILS + 60 // StatusBar height + header content height

export default function TransactionDetails({ route, navigation }) {
  const { transaction } = route.params
  const [copiedField, setCopiedField] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const { theme } = useTheme()

  // Debug: Log transaction data to see what's available
  console.log('TransactionDetails - Transaction data:', {
    txType: transaction?.txType,
    type: transaction?.type,
    card_codes: transaction?.card_codes,
    card_code: transaction?.card_code,
    displayCode: transaction?.displayCode,
    brand_name: transaction?.brand_name,
    displayBrand: transaction?.displayBrand,
    variant_name: transaction?.variant_name,
    variantName: transaction?.variantName
  })

  const STATUS_COLORS = {
    completed: theme.success,
    pending: theme.warning,
    rejected: theme.error,
  }

  const TYPE_COLORS = {
    sell: theme.accent,
    buy: theme.warning,
    withdrawal: theme.primary,
    fund: theme.success, // Assuming 'fund' is a type for wallet funding
  }

  const PAYMENT_METHOD_LABELS = {
    wallet: "Wallet",
    flutterwave: "Flutterwave",
    manual_transfer: "Manual Transfer",
    bank_transfer: "Bank Transfer",
    card: "Card Payment",
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

  const copyToClipboard = async (text, fieldName) => {
    if (!text) return
    try {
      Clipboard.setString(text)
      setCopiedField(fieldName)
      Alert.alert("Copied!", `${fieldName} copied to clipboard`)
      setTimeout(() => {
        setCopiedField(null)
      }, 2000)
    } catch (error) {
      Alert.alert("Error", "Failed to copy to clipboard")
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
      case "fund":
        return "add-circle"
      default:
        return "card"
    }
  }

  // Get the actual transaction type, with fallbacks
  const getActualTxType = () => {
    return transaction.txType || transaction.type || transaction.originalType || 'unknown'
  }

  const truncateCode = (code) => {
    if (!code) return ''
    return code.length > 12 ? code.slice(0, 12) + '...' : code
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    // For transaction details, usually no new data to fetch,
    // but we can simulate a refresh or re-fetch if details can change.
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
  }, [])

  const formatReadableDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  const renderDetailRow = (label, value, copyable = false, fieldName = "", valueStyle = {}) => {
    if (value === null || value === undefined || value === "") return null
    return (
      <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{label}</Text>
        <View style={styles.detailValueContainer}>
          <Text style={[styles.detailValue, { color: theme.text }, valueStyle]} numberOfLines={copyable ? undefined : 1}>
            {value}
          </Text>
          {copyable && (
            <TouchableOpacity
              style={[
                styles.copyButton,
                { backgroundColor: theme.accentBackground },
                copiedField === fieldName && { backgroundColor: theme.successBackground },
              ]}
              onPress={() => copyToClipboard(value, fieldName)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={copiedField === fieldName ? "checkmark" : "copy"}
                size={16}
                color={copiedField === fieldName ? theme.success : theme.accent}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.primary} />

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
            backgroundColor: copiedField === 'Gift Card Code' ? theme.successBackground : theme.accentBackground,
          }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold' }}>Transaction Details</Text>
        <View style={{ width: 32, height: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: 0 }]}
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
        <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.summaryHeader}>
            <View style={styles.transactionIconContainer}>
              {getActualTxType() === "withdrawal" || getActualTxType() === "fund" ? (
                <View style={[styles.transactionIconBg, { backgroundColor: TYPE_COLORS[getActualTxType()] }]}>
                  <Ionicons name={getTransactionIcon(getActualTxType())} size={24} color={theme.text} />
                </View>
              ) : (
                <View style={styles.brandImageContainer}>
                  {transaction.image_url ? (
                    <Image source={{ uri: transaction.image_url }} style={styles.brandImage} resizeMode="contain" />
                  ) : (
                  <View style={[styles.transactionIconBg, { backgroundColor: TYPE_COLORS[getActualTxType()] }]}>
                      <Text style={[styles.brandInitial, { color: theme.textContrast }]}>
                        {(transaction.brand_name || "?")[0]}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            <View style={styles.summaryInfo}>
              <Text style={[styles.transactionType, { color: theme.text }]}>{transaction.brand_name || transaction.displayBrand || "Gift Card"}</Text>
              <Text style={[styles.brandName, { color: theme.textSecondary }]}>
                {transaction.variant_name || transaction.variantName || transaction.displayBrand || "Transaction"}
              </Text>
              {/* {transaction.variant_name && (
                <Text style={[styles.variantName, { color: theme.textMuted }]}>{transaction.variant_name}</Text>
              )} */}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[transaction.displayStatus]}0` }]}>
              {/* <Ionicons
                name={getStatusIcon(transaction.displayStatus)}
                size={16}
                color={STATUS_COLORS[transaction.displayStatus]}
              /> */}
              <Text
                style={[
                  styles.statusText,
                  {
                    color: theme.dark ? "#fff" : "#000"
                  }
                ]}
              >
                {transaction.displayStatus?.charAt(0).toUpperCase() + transaction.displayStatus?.slice(1)}
              </Text>
            </View>
          </View>
          <View style={[styles.amountContainer, { borderTopColor: theme.border }]}>
            <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>Amount</Text>
            <Text style={[styles.amountValue, { color: theme.text }]}>
              ₦{transaction.displayAmount?.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Transaction Details */}
        <View style={[styles.detailsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Transaction Information</Text>
          {renderDetailRow("Transaction ID", transaction.displayId, true, "Transaction ID")}
          {renderDetailRow("Date & Time", formatReadableDate(transaction.displayDate))}
          {renderDetailRow("Type", transaction.displayType)}
          {/* {renderDetailRow(
            "Status",
            transaction.displayStatus?.charAt(0).toUpperCase() + transaction.displayStatus?.slice(1),
            false,
            undefined,
            { color: STATUS_COLORS[transaction.displayStatus] }
          )} */}
          {/* Brand and Variant */}
          {(transaction.brand_name || transaction.displayBrand) && renderDetailRow("Brand", transaction.brand_name || transaction.displayBrand)}
          {(transaction.variant_name || transaction.variantName) && renderDetailRow("Variant", transaction.variant_name || transaction.variantName)}
          {transaction.quantity && renderDetailRow("Quantity", transaction.quantity)}
          {transaction.rate && renderDetailRow("Rate", `₦${transaction.rate}`)}
          {transaction.amount && renderDetailRow("Card Value", `$${transaction.amount}`)}

          {/* Gift Card Codes */}
          {getActualTxType() === "buy" &&
            Array.isArray(transaction.card_codes) &&
            transaction.card_codes.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Gift Card Codes</Text>
                {transaction.card_codes.map((code, idx) => (
                  <View key={idx} style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                    <Text style={[styles.detailValue, { color: theme.text }]}>{truncateCode(code)}</Text>
                    <TouchableOpacity
                      style={[
                        styles.copyButton,
                        { backgroundColor: theme.accentBackground },
                        copiedField === 'Gift Card Code' && { backgroundColor: theme.successBackground },
                      ]}
                      onPress={() => copyToClipboard(code, 'Gift Card Code')}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={copiedField === 'Gift Card Code' ? "checkmark" : "copy"}
                        size={16}
                        color={copiedField === 'Gift Card Code' ? theme.success : theme.accent}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          {getActualTxType() === "sell" &&
            transaction.card_code &&
            renderDetailRow("Gift Card Code", truncateCode(transaction.card_code), true, "Gift Card Code")}

          {/* Buy Transaction Specific Details */}
          {getActualTxType() === "buy" && (
            <>
              {transaction.paymentMethod &&
                renderDetailRow(
                  "Payment Method",
                  PAYMENT_METHOD_LABELS[transaction.paymentMethod] || transaction.paymentMethod,
                )}
              {transaction.flutterwaveRef &&
  renderDetailRow("Flutterwave Reference", transaction.flutterwaveRef, true, "Flutterwave Reference")}
              {transaction.proofUrl && renderDetailRow("Proof of Payment", "Uploaded")}
            </>
          )}

          {/* Wallet Transaction Specific Details */}
          {(getActualTxType() === "fund" || getActualTxType() === "withdrawal" || getActualTxType() === "refund" || getActualTxType() === "credit" || getActualTxType() === "debit") && (
            <>
              {transaction.paymentMethod &&
                renderDetailRow(
                  "Payment Method",
                  PAYMENT_METHOD_LABELS[transaction.paymentMethod] || transaction.paymentMethod,
                )}
              {transaction.reference &&
                renderDetailRow("Reference", transaction.reference, true, "Reference")}
              {transaction.description &&
                renderDetailRow("Description", transaction.description)}
            </>
          )}

          {/* Rejection Reason */}
          {(transaction.displayStatus === "rejected" || transaction.status === "rejected") &&
            (transaction.rejection_reason || transaction.rejectionReason) && (
              <View
                style={[
                  styles.rejectionContainer,
                  { backgroundColor: theme.errorBackground, borderColor: theme.error },
                ]}
              >
                <Text style={[styles.rejectionTitle, { color: theme.error }]}>Rejection Reason</Text>
                <Text style={[styles.rejectionText, { color: theme.error }]}>
                  {transaction.rejection_reason || transaction.rejectionReason}
                </Text>
              </View>
            )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {/* {transaction.txType === "buy" &&
            Array.isArray(transaction.card_codes) &&
            transaction.card_codes.length > 0 &&
            transaction.card_codes.map((code, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.primaryButton, { shadowColor: theme.shadow }]}
                onPress={() => copyToClipboard(code, `Gift Card Code ${idx}`)}
                activeOpacity={0.8}
              >
                <View style={[styles.buttonGradient, { backgroundColor: theme.accent }]}>
                  <Ionicons name="copy" size={20} color={theme.textContrast} />
                  <Text style={[styles.buttonText, { color: theme.textContrast }]}>
                    Copy Gift Card Code {transaction.card_codes.length > 1 ? idx + 1 : ""}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          {transaction.txType === "sell" && transaction.card_code && (
            <TouchableOpacity
              style={[styles.primaryButton, { shadowColor: theme.shadow }]}
              onPress={() => copyToClipboard(transaction.card_code, "Gift Card Code")}
              activeOpacity={0.8}
            >
              <View style={[styles.buttonGradient, { backgroundColor: theme.accent }]}>
                <Ionicons name="copy" size={20} color={theme.textContrast} />
                <Text style={[styles.buttonText, { color: theme.textContrast }]}>Copy Gift Card Code</Text>
              </View>
            </TouchableOpacity>
          )} */}
          {/* <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.accent, backgroundColor: theme.accentBackground }]}
            onPress={() => copyToClipboard(transaction.displayId, "Transaction ID")}
            activeOpacity={0.8}
          >
            <Ionicons name="copy-outline" size={20} color={theme.accent} />
            <Text style={[styles.secondaryButtonText, { color: theme.accent }]}>Copy Transaction ID</Text>
          </TouchableOpacity> */}
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <View style={[styles.helpCard, { backgroundColor: theme.warningBackground, borderColor: theme.warning }]}>
            <Ionicons name="information-circle" size={20} color={theme.warning} />
            <Text style={[styles.helpText, { color: theme.textSecondary }]}>
              Need help with this transaction? Contact our support team for assistance.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.supportButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => navigation.navigate("SupportCenter")}
            activeOpacity={0.8}
          >
            <Ionicons name="headset" size={20} color={theme.accent} />
            <Text style={[styles.supportButtonText, { color: theme.accent }]}>Contact Support</Text>
          </TouchableOpacity>
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
    height: HEADER_HEIGHT_TX_DETAILS,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: STATUS_BAR_HEIGHT_TX_DETAILS,
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 24,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    marginTop: 10, // Added margin to push content down from header
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
    justifyContent: "center",
    alignItems: "center",
  },
  brandImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  brandInitial: {
    fontSize: 20,
    fontWeight: "bold",
  },
  summaryInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  brandName: {
    fontSize: 14,
  },
  variantName: {
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
    marginLeft: 0,
  },
  amountContainer: {
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: "bold",
  },
  detailsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  sectionTitle: {
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
  },
  detailLabel: {
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
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
  },
  copyButton: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 6,
  },
  rejectionContainer: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
  },
  rejectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  rejectionText: {
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
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  buttonText: {
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
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  helpSection: {
    marginBottom: 40,
  },
  helpCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    borderWidth: 1,
  },
  helpText: {
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
    borderWidth: 1,
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
})
