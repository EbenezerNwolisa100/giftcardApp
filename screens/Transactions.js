"use client"

import { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  Image,
} from "react-native"
import { supabase } from "./supabaseClient"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

const { width } = Dimensions.get("window")

const STATUS_COLORS = {
  completed: "#4caf50",
  pending: "#E3D095",
  rejected: "#ff6b6b",
}

const STATUS_OPTIONS = ["all", "completed", "pending", "rejected"]
const TYPE_OPTIONS = ["all", "buy", "sell", "withdrawal"]

const TYPE_COLORS = {
  sell: "#7965C1",
  buy: "#E3D095",
  withdrawal: "#483AA0",
}

// Payment method mapping
const PAYMENT_METHOD_LABELS = {
  wallet: "Wallet",
  paystack: "Paystack",
  manual_transfer: "Manual Transfer",
}

const formatDate = (dateStr) => {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  const now = new Date()
  const diffInHours = (now - d) / (1000 * 60 * 60)

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now - d) / (1000 * 60))
    return diffInMinutes <= 1 ? "Just now" : `${diffInMinutes}m ago`
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`
  } else if (diffInHours < 48) {
    return "Yesterday"
  } else {
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    })
  }
}

export default function Transactions({ navigation }) {
  const [transactions, setTransactions] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [tempStatusFilter, setTempStatusFilter] = useState(statusFilter)

  useEffect(() => {
    const fetchTx = async () => {
      setLoading(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        // Fetch giftcard transactions (both buy and sell)
        const { data: giftcardTxs, error: giftcardError } = await supabase
          .from("giftcard_transactions")
          .select(`
            id, type, status, created_at, amount, total, rate, payment_method, proof_of_payment_url, paystack_reference,
            brand_id, brand_name, variant_id, variant_name, card_code, image_url, rejection_reason, quantity, buy_brand_id, card_codes,
            sell_brand:brand_id (name, image_url),
            sell_variant:variant_id (name),
            buy_brand:buy_brand_id (name, image_url)
          `)
          .eq("user_id", user.id)
          .in("type", ["sell", "buy"])

        // Fetch withdrawals
        const { data: withdrawals, error: withdrawalError } = await supabase
          .from("withdrawals")
          .select("id, amount, status, created_at, type, rejection_reason")
          .eq("user_id", user.id)

        if (giftcardError || withdrawalError) {
          console.log("Giftcard Error:", giftcardError)
          console.log("Withdrawal Error:", withdrawalError)
          Alert.alert("Error", giftcardError?.message || withdrawalError?.message)
          setLoading(false)
          return
        }

        // Normalize and merge giftcard transactions
        const giftcardTxsNormalized = (giftcardTxs || []).map((tx) => {
          const isBuy = tx.type === "buy";
          const brandName = isBuy
            ? tx.buy_brand?.name || tx.brand_name
            : tx.sell_brand?.name || tx.brand_name;
          const brandImage = isBuy
            ? tx.buy_brand?.image_url || tx.image_url
            : tx.sell_brand?.image_url || tx.image_url;
          const variantName = isBuy
            ? tx.variant_name
            : tx.sell_variant?.name || tx.variant_name;

          return {
            ...tx,
            txType: tx.type,
            displayType: isBuy ? "Buy" : "Sell",
            displayAmount: tx.total,
            displayBrand: brandName || "Gift Card",
            displayImage: brandImage,
            variantName: variantName,
            displayStatus: tx.status,
            displayDate: tx.created_at,
            displayId: tx.id,
            displayCode: isBuy
              ? Array.isArray(tx.card_codes) && tx.card_codes.length > 0
                ? tx.card_codes.join(", ")
                : ""
              : tx.card_code,
            paymentMethod: tx.payment_method,
            proofUrl: tx.proof_of_payment_url,
            paystackRef: tx.paystack_reference,
            quantity: tx.quantity,
            rate: tx.rate,
            amount: tx.amount,
            rejection_reason: tx.rejection_reason,
          };
        });

        const withdrawalTxs = (withdrawals || []).map((tx) => ({
          ...tx,
          txType: "withdrawal",
          displayType: "Withdrawal",
          displayAmount: tx.amount,
          displayBrand: "Withdrawal",
          displayStatus: tx.status,
          displayDate: tx.created_at,
          displayId: tx.id,
        }))

        const allTxs = [...giftcardTxsNormalized, ...withdrawalTxs].sort(
          (a, b) => new Date(b.displayDate) - new Date(a.displayDate),
        )
        setTransactions(allTxs)
      } catch (err) {
        console.error("Transactions fetch error:", err)
        Alert.alert("Error", "Failed to fetch transactions.")
      }
      setLoading(false)
    }
    fetchTx()
  }, [])

  useEffect(() => {
    let txs = [...transactions]
    if (typeFilter !== "all") txs = txs.filter((t) => t.txType === typeFilter)
    if (statusFilter !== "all") txs = txs.filter((t) => t.displayStatus === statusFilter)
    setFiltered(txs)
  }, [transactions, statusFilter, typeFilter])

  const openDetails = (tx) => {
    navigation.navigate("TransactionDetails", { transaction: tx })
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0E2148" />
        <ActivityIndicator size="large" color="#E3D095" />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E2148" />

      {/* Header */}
      <LinearGradient colors={["#0E2148", "#483AA0"]} style={styles.headerGradient}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Transactions</Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              setTempStatusFilter(statusFilter)
              setShowFilterModal(true)
            }}
          >
            <Ionicons name="filter-outline" size={24} color="#E3D095" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, typeFilter === "all" && styles.filterTabActive]}
          onPress={() => setTypeFilter("all")}
        >
          <Text style={[styles.filterTabText, typeFilter === "all" && styles.filterTabTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, typeFilter === "buy" && styles.filterTabActive]}
          onPress={() => setTypeFilter("buy")}
        >
          <Text style={[styles.filterTabText, typeFilter === "buy" && styles.filterTabTextActive]}>Buy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, typeFilter === "sell" && styles.filterTabActive]}
          onPress={() => setTypeFilter("sell")}
        >
          <Text style={[styles.filterTabText, typeFilter === "sell" && styles.filterTabTextActive]}>Sell</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, typeFilter === "withdrawal" && styles.filterTabActive]}
          onPress={() => setTypeFilter("withdrawal")}
        >
          <Text style={[styles.filterTabText, typeFilter === "withdrawal" && styles.filterTabTextActive]}>
            Withdrawals
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.displayId}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.transactionCard} onPress={() => openDetails(item)} activeOpacity={0.8}>
            <View style={styles.transactionLeft}>
              {item.txType === "withdrawal" ? (
                <View style={[styles.transactionIcon, { backgroundColor: TYPE_COLORS[item.txType] }]}>
                  <Text style={styles.transactionIconText}>W</Text>
                </View>
              ) : (
                <View style={styles.transactionImageContainer}>
                  {item.displayImage ? (
                    <Image source={{ uri: item.displayImage }} style={styles.transactionImage} resizeMode="contain" />
                  ) : (
                    <View style={[styles.transactionIcon, { backgroundColor: TYPE_COLORS[item.txType] }]}>
                      <Text style={styles.transactionIconText}>{(item.displayBrand || "?")[0]}</Text>
                    </View>
                  )}
                </View>
              )}
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionBrand}>{item.displayBrand}</Text>
                {item.variantName && (
                  <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 2 }}>{item.variantName}</Text>
                )}
                <Text style={styles.transactionDate}>{formatDate(item.displayDate)}</Text>
                {item.paymentMethod && (
                  <Text style={styles.transactionPaymentMethod}>
                    {PAYMENT_METHOD_LABELS[item.paymentMethod] || item.paymentMethod}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.transactionRight}>
              <Text style={styles.transactionAmount}>₦{item.displayAmount?.toLocaleString()}</Text>
              <Text style={[styles.transactionStatus, { color: STATUS_COLORS[item.displayStatus] }]}>
                {item.displayStatus?.charAt(0).toUpperCase() + item.displayStatus?.slice(1)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyStateTitle}>No transactions found</Text>
            <Text style={styles.emptyStateSubtext}>
              {statusFilter !== "all" || typeFilter !== "all"
                ? "Try adjusting your filters"
                : "Your transaction history will appear here"}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModalBox}>
            <Text style={styles.filterModalTitle}>Filter by Status</Text>
            <View style={styles.filterOptionsRow}>
              {STATUS_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.filterOptionBtn, tempStatusFilter === option && styles.filterOptionBtnActive]}
                  onPress={() => setTempStatusFilter(option)}
                >
                  <Text style={[styles.filterOptionText, tempStatusFilter === option && styles.filterOptionTextActive]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.filterModalActions}>
              <TouchableOpacity style={styles.filterModalBtn} onPress={() => setShowFilterModal(false)}>
                <Text style={styles.filterModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterModalBtn, { backgroundColor: "#7965C1" }]}
                onPress={() => {
                  setStatusFilter(tempStatusFilter)
                  setShowFilterModal(false)
                }}
              >
                <Text style={[styles.filterModalBtnText, { color: "#fff" }]}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0E2148",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0E2148",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
  },
  headerGradient: {
    paddingBottom: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 35,
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
  filterButton: {
    padding: 8,
  },
  filterTabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  filterTab: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  filterTabActive: {
    backgroundColor: "#7965C1",
    borderColor: "#7965C1",
  },
  filterTabText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  filterTabTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  transactionCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionIconText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  transactionDetails: {
    flex: 1,
  },
  transactionBrand: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  transactionDate: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginBottom: 2,
  },
  transactionPaymentMethod: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  filterModalBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: "85%",
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#232e4a",
    marginBottom: 18,
  },
  filterOptionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
    flexWrap: "wrap",
  },
  filterOptionBtn: {
    backgroundColor: "#f1f2f6",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 6,
    marginBottom: 8,
  },
  filterOptionBtnActive: {
    backgroundColor: "#7965C1",
  },
  filterOptionText: {
    color: "#232e4a",
    fontWeight: "600",
  },
  filterOptionTextActive: {
    color: "#fff",
  },
  filterModalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  filterModalBtn: {
    flex: 1,
    backgroundColor: "#f1f2f6",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginHorizontal: 6,
  },
  filterModalBtnText: {
    color: "#232e4a",
    fontWeight: "bold",
    fontSize: 16,
  },
  transactionImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    overflow: "hidden",
    backgroundColor: "#3b5bfd",
    justifyContent: "center",
    alignItems: "center",
  },
  transactionImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
})
