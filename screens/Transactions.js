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
  ScrollView,
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
  manual_transfer: "Manual Transfer"
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
  const [selectedTx, setSelectedTx] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
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
            id, brand_id, amount, total, status, created_at, brand:giftcard_brands(name, image_url), 
            type, rate, card_code, rejection_reason, payment_method, proof_of_payment_url, paystack_reference,
            brand_name, image_url,
            giftcard_inventory:giftcard_inventory_id (
              code, value, image_url, brand_name
            )
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
        const giftcardTxsNormalized = (giftcardTxs || []).map((tx) => ({
          ...tx,
          txType: tx.type,
          displayType: tx.type === "buy" ? "Buy" : "Sell",
          displayAmount: tx.total,
          displayBrand: tx.type === "buy" 
            ? (tx.giftcard_inventory?.brand_name || tx.brand_name || "Gift Card") 
            : (tx.brand?.name || "Gift Card"),
          displayStatus: tx.status,
          displayDate: tx.created_at,
          displayId: tx.id,
          displayCode: tx.type === "buy" ? tx.giftcard_inventory?.code : tx.card_code,
          paymentMethod: tx.payment_method,
          proofUrl: tx.proof_of_payment_url,
          paystackRef: tx.paystack_reference,
          displayImage: tx.type === "buy" 
            ? (tx.giftcard_inventory?.image_url || tx.image_url)
            : tx.brand?.image_url,
        }))

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

        const allTxs = [...giftcardTxsNormalized, ...withdrawalTxs].sort((a, b) => new Date(b.displayDate) - new Date(a.displayDate))
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
    setSelectedTx(tx)
    setModalVisible(true)
  }

  const closeDetails = () => {
    setModalVisible(false)
    setSelectedTx(null)
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
          <TouchableOpacity style={styles.filterButton} onPress={() => {
            setTempStatusFilter(statusFilter)
            setShowFilterModal(true)
          }}>
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
                      <Text style={styles.transactionIconText}>{item.displayBrand[0]}</Text>
                    </View>
                  )}
                </View>
              )}
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionBrand}>{item.displayBrand}</Text>
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

      {/* Transaction Details Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeDetails}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedTx && (
              <>
                <LinearGradient colors={["#0E2148", "#483AA0"]} style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedTx.displayType} Details</Text>
                  <TouchableOpacity onPress={closeDetails} style={styles.modalCloseButton}>
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </LinearGradient>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Transaction ID</Text>
                    <Text style={styles.modalDetailValue}>{selectedTx.displayId}</Text>
                  </View>

                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Type</Text>
                    <Text style={styles.modalDetailValue}>{selectedTx.displayType}</Text>
                  </View>

                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Amount</Text>
                    <Text style={styles.modalDetailValue}>₦{selectedTx.displayAmount?.toLocaleString()}</Text>
                  </View>

                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Status</Text>
                    <Text style={[styles.modalDetailValue, { color: STATUS_COLORS[selectedTx.displayStatus] }]}>
                      {selectedTx.displayStatus?.charAt(0).toUpperCase() + selectedTx.displayStatus?.slice(1)}
                    </Text>
                  </View>

                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Date</Text>
                    <Text style={styles.modalDetailValue}>{new Date(selectedTx.displayDate).toLocaleString()}</Text>
                  </View>

                  {selectedTx.txType === "sell" && (
                    <>
                      <View style={styles.modalDetailRow}>
                        <Text style={styles.modalDetailLabel}>Brand</Text>
                        <Text style={styles.modalDetailValue}>{selectedTx.displayBrand}</Text>
                      </View>
                      <View style={styles.modalDetailRow}>
                        <Text style={styles.modalDetailLabel}>Rate</Text>
                        <Text style={styles.modalDetailValue}>₦{selectedTx.rate}</Text>
                      </View>
                      <View style={styles.modalDetailRow}>
                        <Text style={styles.modalDetailLabel}>Card Code</Text>
                        <Text style={styles.modalDetailValue}>{selectedTx.displayCode}</Text>
                      </View>
                    </>
                  )}

                  {selectedTx.txType === "buy" && (
                    <>
                      <View style={styles.modalDetailRow}>
                        <Text style={styles.modalDetailLabel}>Brand</Text>
                        <Text style={styles.modalDetailValue}>{selectedTx.displayBrand}</Text>
                      </View>
                      <View style={styles.modalDetailRow}>
                        <Text style={styles.modalDetailLabel}>Card Code</Text>
                        <Text style={styles.modalDetailValue}>{selectedTx.displayCode}</Text>
                      </View>
                      {selectedTx.paymentMethod && (
                        <View style={styles.modalDetailRow}>
                          <Text style={styles.modalDetailLabel}>Payment Method</Text>
                          <Text style={styles.modalDetailValue}>
                            {PAYMENT_METHOD_LABELS[selectedTx.paymentMethod] || selectedTx.paymentMethod}
                          </Text>
                        </View>
                      )}
                      {selectedTx.paystackRef && (
                        <View style={styles.modalDetailRow}>
                          <Text style={styles.modalDetailLabel}>Paystack Ref</Text>
                          <Text style={styles.modalDetailValue}>{selectedTx.paystackRef}</Text>
                        </View>
                      )}
                      {selectedTx.proofUrl && (
                        <View style={styles.modalDetailRow}>
                          <Text style={styles.modalDetailLabel}>Proof of Payment</Text>
                          <Text style={styles.modalDetailValue}>Uploaded</Text>
                        </View>
                      )}
                    </>
                  )}

                  {selectedTx.displayStatus === "rejected" && selectedTx.rejection_reason && (
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailLabel}>Rejection Reason</Text>
                      <Text style={[styles.modalDetailValue, { color: "#ff6b6b" }]}>{selectedTx.rejection_reason}</Text>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal visible={showFilterModal} transparent animationType="fade" onRequestClose={() => setShowFilterModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.filterModalBox}>
            <Text style={styles.filterModalTitle}>Filter by Status</Text>
            <View style={styles.filterOptionsRow}>
              {STATUS_OPTIONS.map(option => (
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
                style={[styles.filterModalBtn, { backgroundColor: '#7965C1' }]}
                onPress={() => {
                  setStatusFilter(tempStatusFilter)
                  setShowFilterModal(false)
                }}
              >
                <Text style={[styles.filterModalBtnText, { color: '#fff' }]}>Apply</Text>
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
  modalContent: {
    backgroundColor: "#0E2148",
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  modalDetailLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  modalDetailValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
  filterModalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '85%',
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#232e4a',
    marginBottom: 18,
  },
  filterOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  filterOptionBtn: {
    backgroundColor: '#f1f2f6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 6,
    marginBottom: 8,
  },
  filterOptionBtnActive: {
    backgroundColor: '#7965C1',
  },
  filterOptionText: {
    color: '#232e4a',
    fontWeight: '600',
  },
  filterOptionTextActive: {
    color: '#fff',
  },
  filterModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  filterModalBtn: {
    flex: 1,
    backgroundColor: '#f1f2f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  filterModalBtnText: {
    color: '#232e4a',
    fontWeight: 'bold',
    fontSize: 16,
  },
  transactionImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#3b5bfd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
})
