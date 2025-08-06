"use client"

import { useEffect, useState } from "react"
import { supabase } from "../supabaseClient"

const formatDate = (dateStr) => {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

const PAGE_SIZE = 20

const Transactions = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedTx, setSelectedTx] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState("")
  const [actionSuccess, setActionSuccess] = useState("")
  const [showRejectReason, setShowRejectReason] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true)
      setError("")
      try {
        // Updated query to work with new table structure
        let query = supabase
          .from("giftcard_transactions")
          .select(`
            id, user_id, amount, rate, total, type, status, created_at, rejection_reason,
            payment_method, proof_of_payment_url, flutterwave_reference, card_code, image_url,
            quantity, card_codes, variant_name,
            sell_brand:sell_brand_id (
              id, name, image_url
            ),
            sell_variant:sell_variant_id (
              id, name, sell_rate,
              brand:brand_id (
                id, name, image_url
              )
            ),
            buy_item:buy_item_id (
              id, code, variant_name, value, rate
            ),
            buy_brand:buy_brand_id (
              id, name, image_url
            ),
            user:profiles(full_name, email)
          `)
          .order("created_at", { ascending: false })

        if (statusFilter !== "all") query = query.eq("status", statusFilter)
        if (typeFilter !== "all") query = query.eq("type", typeFilter)
        if (paymentMethodFilter !== "all") query = query.eq("payment_method", paymentMethodFilter)

        const from = (page - 1) * PAGE_SIZE
        const to = from + PAGE_SIZE - 1
        query = query.range(from, to)

        const { data, error } = await query
        if (error) throw error

        setTransactions(data || [])

        // Get total count for pagination
        let countQuery = supabase.from("giftcard_transactions").select("id", { count: "exact", head: true })
        if (statusFilter !== "all") countQuery = countQuery.eq("status", statusFilter)
        if (typeFilter !== "all") countQuery = countQuery.eq("type", typeFilter)
        if (paymentMethodFilter !== "all") countQuery = countQuery.eq("payment_method", paymentMethodFilter)

        const { count: totalCount } = await countQuery
        setTotalPages(Math.ceil((totalCount || 1) / PAGE_SIZE))
      } catch (err) {
        setError("Failed to load transactions: " + (err?.message || ""))
      }
      setLoading(false)
    }
    fetchTransactions()
  }, [statusFilter, typeFilter, paymentMethodFilter, page])

  // Filter by search (user name/email or brand)
  const filtered = transactions.filter((tx) => {
    const user = tx.user || {}
    const searchLower = search.toLowerCase()

    // Get brand name based on transaction type
    const brandName = tx.type === "sell" ? tx.sell_variant?.brand?.name || tx.sell_brand?.name : tx.buy_brand?.name

    // Get variant name based on transaction type
    const variantName = tx.type === "sell" ? tx.sell_variant?.name : tx.buy_item?.variant_name

    // Get card code(s)
    const cardCodes = tx.type === "sell" ? tx.card_code : (tx.card_codes || []).join(", ")

    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      brandName?.toLowerCase().includes(searchLower) ||
      variantName?.toLowerCase().includes(searchLower) ||
      cardCodes?.toLowerCase().includes(searchLower)
    )
  })

  const openTx = async (tx) => {
    setSelectedTx(null)
    setModalLoading(true)
    setModalError("")
    setActionError("")
    setActionSuccess("")
    setShowRejectReason(false)
    setRejectReason("")
    try {
      // Fetch full transaction details with all joins
      const { data, error } = await supabase
        .from("giftcard_transactions")
        .select(`
          *,
          sell_brand:sell_brand_id (
            id, name, image_url
          ),
          sell_variant:sell_variant_id (
            id, name, sell_rate,
            brand:brand_id (
              id, name, image_url
            )
          ),
          buy_item:buy_item_id (
            id, code, variant_name, value, rate
          ),
          buy_brand:buy_brand_id (
            id, name, image_url
          ),
          user:profiles(full_name, email)
        `)
        .eq("id", tx.id)
        .single()
      if (error) throw error
      setSelectedTx(data)
    } catch (err) {
      setModalError("Failed to load transaction details: " + (err?.message || ""))
    }
    setModalLoading(false)
  }

  const closeTx = () => {
    setSelectedTx(null)
    setModalError("")
    setActionError("")
    setActionSuccess("")
    setShowRejectReason(false)
    setRejectReason("")
  }

  const handleAction = async (status) => {
    if (!selectedTx) return
    setActionLoading(true)
    setActionError("")
    setActionSuccess("")
    try {
      const updateObj = { status }
      if (status === "rejected") {
        if (!rejectReason.trim()) {
          setActionError("Rejection reason is required.")
          setActionLoading(false)
          return
        }
        updateObj.rejection_reason = rejectReason.trim()
      }

      const { error } = await supabase.from("giftcard_transactions").update(updateObj).eq("id", selectedTx.id)
      if (error) throw error

      setActionSuccess(`Transaction ${status}.`)
      setSelectedTx({ ...selectedTx, status, rejection_reason: updateObj.rejection_reason })

      // Refresh list
      setTransactions((txs) =>
        txs.map((t) => (t.id === selectedTx.id ? { ...t, status, rejection_reason: updateObj.rejection_reason } : t)),
      )
      setShowRejectReason(false)
      setRejectReason("")

      // Insert notification for the user
      let notifTitle = ""
      let notifBody = ""
      if (status === "completed") {
        notifTitle = "Transaction Approved"
        notifBody = `Your gift card transaction of ₦${Number(selectedTx.total).toLocaleString()} has been approved.`
      } else if (status === "rejected") {
        notifTitle = "Transaction Rejected"
        notifBody = `Your gift card transaction of ₦${Number(selectedTx.total).toLocaleString()} was rejected. Reason: ${updateObj.rejection_reason}`
      }

      if (notifTitle && notifBody) {
        await supabase.from("notifications").insert({
          user_id: selectedTx.user_id,
          title: notifTitle,
          body: notifBody,
          read: false,
        })

        // Send push notification if user has expo_push_token
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("expo_push_token")
          .eq("id", selectedTx.user_id)
          .single()

        const expoPushToken = userProfile?.expo_push_token
        if (expoPushToken) {
          await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: { Accept: "application/json", "Content-Type": "application/json" },
            body: JSON.stringify({
              to: expoPushToken,
              title: notifTitle,
              body: notifBody,
              sound: "default",
              data: { type: "notification" },
            }),
          })
        }
      }
    } catch (err) {
      setActionError("Failed to update transaction: " + (err?.message || ""))
    }
    setActionLoading(false)
  }

  // Helper function to get brand name from transaction
  const getBrandName = (tx) => {
    if (tx.type === "sell") {
      return tx.sell_variant?.brand?.name || tx.sell_brand?.name || "-"
    } else if (tx.type === "buy") {
      return tx.buy_brand?.name || "-"
    }
    return "-"
  }

  // Helper function to get variant name
  const getVariantName = (tx) => {
    if (tx.type === "sell") {
      // For sell: use sell_variant.name with fallback to variant_name (matching Dashboard.jsx)
      return tx.sell_variant?.name || tx.variant_name || "-"
    } else if (tx.type === "buy") {
      // For buy: use variant_name directly (matching Dashboard.jsx)
      return tx.variant_name || "-"
    }
    return "-"
  }

  // Helper function to get card code(s)
  const getCardCode = (tx) => {
    if (tx.type === "sell") {
      return tx.card_code || "-"
    } else if (tx.type === "buy") {
      // For buy, card_codes is an array on the transaction itself
      return (tx.card_codes || []).join(", ") || "-"
    }
    return "-"
  }

  // Helper function to get image URL
  const getImageUrl = (tx) => {
    if (tx.image_url) return tx.image_url // Direct image_url on transaction
    if (tx.type === "sell") {
      return tx.sell_variant?.brand?.image_url || tx.sell_brand?.image_url
    } else if (tx.type === "buy") {
      return tx.buy_brand?.image_url // Image is now on buy_brand
    }
    return "/placeholder.svg"
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', width: '100%', overflowX: 'hidden', maxWidth: '100vw' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4" style={{ padding: '0 15px' }}>
        <div>
          <h2 className="mb-1 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>Gift Card Transactions</h2>
          <p className="text-muted mb-0" style={{ fontFamily: 'Inter, sans-serif' }}>
            Manage and review all gift card transactions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: '0 15px', marginBottom: '2rem' }}>
        <div className="card border shadow-sm" style={{ backgroundColor: '#ffffff', borderRadius: '0' }}>
          <div className="card-header bg-light border-bottom">
            <h5 className="mb-0 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
              <i className="bi bi-funnel me-2"></i>
              Filters & Search
            </h5>
          </div>
          <div className="card-body p-4">
            <div className="row g-3">
        <div className="col-md-2">
                <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Status</label>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
          >
                  <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="col-md-2">
                <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Type</label>
          <select
            className="form-select"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(1)
            }}
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
          >
                  <option value="all">All Types</option>
            <option value="sell">Sell to Platform</option>
            <option value="buy">Buy from Platform</option>
          </select>
        </div>
        <div className="col-md-2">
                <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Payment Method</label>
          <select
            className="form-select"
            value={paymentMethodFilter}
            onChange={(e) => {
              setPaymentMethodFilter(e.target.value)
              setPage(1)
            }}
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
          >
                  <option value="all">All Methods</option>
            <option value="flutterwave">Flutterwave</option>
            <option value="manual_transfer">Manual Transfer</option>
            <option value="wallet">Wallet</option>
          </select>
        </div>
        <div className="col-md-4">
                <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Search</label>
          <input
            type="text"
            className="form-control"
                  placeholder="Search by user, brand, variant, or code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button 
                  className="btn btn-outline-secondary w-100" 
                  onClick={() => {
                    setStatusFilter('all')
                    setTypeFilter('all')
                    setPaymentMethodFilter('all')
                    setSearch('')
                    setPage(1)
                  }}
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="text-start py-5" style={{ padding: '0 15px' }}>
          <div className="spinner-border text-primary" role="status"></div>
          <span className="ms-2">Loading transactions...</span>
        </div>
      ) : error ? (
        <div style={{ padding: '0 15px' }}>
          <div className="alert alert-danger py-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 15px' }}>
          <div className="card border shadow-sm" style={{ backgroundColor: '#ffffff', borderRadius: '0' }}>
            <div className="card-header bg-light border-bottom d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                <i className="bi bi-table me-2"></i>
                Transactions ({filtered.length})
              </h5>
              <div className="text-muted small" style={{ fontFamily: 'Inter, sans-serif' }}>
                Page {page} of {totalPages}
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-container">
                <table className="table table-hover mb-0" style={{ fontFamily: 'Inter, sans-serif', width: '100%', tableLayout: 'fixed' }}>
                  <thead className="table-light">
                    <tr>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '12%', fontFamily: 'Inter, sans-serif' }}>Date</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '10%', fontFamily: 'Inter, sans-serif' }}>User</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '12%', fontFamily: 'Inter, sans-serif' }}>Type</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '10%', fontFamily: 'Inter, sans-serif' }}>Brand</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '10%', fontFamily: 'Inter, sans-serif' }}>Variant</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '8%', fontFamily: 'Inter, sans-serif' }}>Amount</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '8%', fontFamily: 'Inter, sans-serif' }}>Rate</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '10%', fontFamily: 'Inter, sans-serif' }}>Total</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '6%', fontFamily: 'Inter, sans-serif' }}>Qty</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '8%', fontFamily: 'Inter, sans-serif' }}>Status</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '6%', fontFamily: 'Inter, sans-serif' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                        <td colSpan="11" className="text-start py-5 text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <div className="text-center">
                            <i className="bi bi-inbox fs-1 text-muted mb-3 d-block"></i>
                            <h6 className="fw-bold">No transactions found</h6>
                            <p className="mb-0">Try adjusting your filters or search terms</p>
                          </div>
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                        <tr key={tx.id} className="border-bottom">
                          <td className="px-3 py-3 text-start">
                            <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {formatDate(tx.created_at)}
                            </small>
                          </td>
                          <td className="px-3 py-3 text-start">
                            <div>
                              <div className="fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {tx.user?.full_name || "-"}
                              </div>
                              <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {tx.user?.email || "-"}
                              </small>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-start">
                            <span className={`badge ${tx.type === "sell" ? "bg-warning" : "bg-info"}`} style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}>
                              {tx.type === "sell" ? "Sell" : "Buy"}
                      </span>
                    </td>
                          <td className="px-3 py-3 text-start">
                            <div className="fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {getBrandName(tx)}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-start">
                            <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {getVariantName(tx)}
                            </small>
                          </td>
                          <td className="px-3 py-3 text-start">
                            <div className="fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                              ${Number(tx.amount || 0).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-start">
                            <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                              ₦{tx.rate}
                            </small>
                          </td>
                          <td className="px-3 py-3 text-start">
                            <div className="fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                              ₦{Number(tx.total).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-start">
                            <span className="badge bg-secondary" style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}>
                              {tx.quantity || 1}
                            </span>
                    </td>
                          <td className="px-3 py-3 text-start">
                      <span
                        className={`badge bg-${tx.status === "completed" ? "success" : tx.status === "pending" ? "warning" : "danger"}`}
                              style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                      >
                        {tx.status}
                      </span>
                    </td>
                          <td className="px-3 py-3 text-start">
                            <button 
                              className="btn btn-sm btn-outline-primary" 
                              onClick={() => openTx(tx)}
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                            >
                              <i className="bi bi-eye me-1"></i>
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{ padding: '0 15px', marginTop: '1rem' }}>
          <div className="d-flex justify-content-center align-items-center gap-3">
        <button
              className="btn btn-outline-secondary"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
        >
              <i className="bi bi-chevron-left me-1"></i>
              Previous
        </button>
            <div className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
          Page {page} of {totalPages}
            </div>
        <button
              className="btn btn-outline-secondary"
          disabled={page === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
        >
          Next
              <i className="bi bi-chevron-right ms-1"></i>
        </button>
      </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '0', fontFamily: 'Inter, sans-serif' }}>
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <i className="bi bi-receipt me-2"></i>
                  Transaction Details
                </h5>
                <button type="button" className="btn-close" onClick={closeTx}></button>
              </div>
              <div className="modal-body p-4">
                {modalLoading || !selectedTx ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2 text-muted">Loading transaction details...</p>
                  </div>
                ) : modalError ? (
                  <div className="alert alert-danger py-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {modalError}
                  </div>
                ) : (
                  <>
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <h6 className="fw-bold mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <i className="bi bi-person me-2"></i>
                          User Information
                        </h6>
                        <div className="mb-2">
                          <strong style={{ fontFamily: 'Inter, sans-serif' }}>Name:</strong> {selectedTx.user?.full_name}
                        </div>
                        <div className="mb-2">
                          <strong style={{ fontFamily: 'Inter, sans-serif' }}>Email:</strong> {selectedTx.user?.email}
                        </div>
                        <div className="mb-2">
                          <strong style={{ fontFamily: 'Inter, sans-serif' }}>Date:</strong> {formatDate(selectedTx.created_at)}
                        </div>
                        <div className="mb-2">
                          <strong style={{ fontFamily: 'Inter, sans-serif' }}>Status:</strong>{" "}
                        <span
                          className={`badge bg-${selectedTx.status === "completed" ? "success" : selectedTx.status === "pending" ? "warning" : "danger"}`}
                            style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                        >
                          {selectedTx.status}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <h6 className="fw-bold mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <i className="bi bi-credit-card me-2"></i>
                          Transaction Details
                        </h6>
                        <div className="mb-2">
                          <strong style={{ fontFamily: 'Inter, sans-serif' }}>Type:</strong>{" "}
                          <span className={`badge ${selectedTx.type === "sell" ? "bg-warning" : "bg-info"}`} style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}>
                            {selectedTx.type === "sell" ? "Sell to Platform" : "Buy from Platform"}
                          </span>
                        </div>
                        <div className="mb-2">
                          <strong style={{ fontFamily: 'Inter, sans-serif' }}>Brand:</strong> {getBrandName(selectedTx)}
                        </div>
                        <div className="mb-2">
                          <strong style={{ fontFamily: 'Inter, sans-serif' }}>Variant:</strong> {getVariantName(selectedTx)}
                        </div>
                        <div className="mb-2">
                          <strong style={{ fontFamily: 'Inter, sans-serif' }}>Payment Method:</strong>{" "}
                        {selectedTx.payment_method === "flutterwave"
  ? "Flutterwave"
                          : selectedTx.payment_method === "manual_transfer"
                            ? "Manual Transfer"
                            : selectedTx.payment_method === "wallet"
                              ? "Wallet"
                                : "-"}
                        </div>
                      </div>
                    </div>

                    <div className="row mb-4">
                      <div className="col-md-6">
                        <h6 className="fw-bold mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <i className="bi bi-calculator me-2"></i>
                          Financial Details
                        </h6>
                        <div className="mb-2">
                          <strong style={{ fontFamily: 'Inter, sans-serif' }}>Amount (USD):</strong> ${Number(selectedTx.amount || 0).toLocaleString()}
                        </div>
                        <div className="mb-2">
                          <strong style={{ fontFamily: 'Inter, sans-serif' }}>Rate (₦/$):</strong> ₦{selectedTx.rate}
                        </div>
                        <div className="mb-2">
                          <strong style={{ fontFamily: 'Inter, sans-serif' }}>Quantity:</strong> {selectedTx.quantity || 1}
                        </div>
                        <div className="mb-2">
                          <strong style={{ fontFamily: 'Inter, sans-serif' }}>Total (₦):</strong> ₦{Number(selectedTx.total).toLocaleString()}
                        </div>
                        {selectedTx.type === "buy" && selectedTx.buy_item?.value && (
                          <div className="mb-2">
                            <strong style={{ fontFamily: 'Inter, sans-serif' }}>Card Value (USD):</strong> ${selectedTx.buy_item.value.toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="col-md-6">
                        <h6 className="fw-bold mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <i className="bi bi-code-slash me-2"></i>
                          Card Information
                        </h6>
                        <div className="mb-2">
                          <strong style={{ fontFamily: 'Inter, sans-serif' }}>Card Code(s):</strong>
                            <br />
                          <code style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#f8f9fa', padding: '0.25rem 0.5rem', borderRadius: '0' }}>
                            {selectedTx.type === "sell"
                              ? selectedTx.card_code || "-"
                              : (selectedTx.card_codes || []).join(", ") || "-"}
                          </code>
                        </div>
                        {selectedTx.rejection_reason && (
                          <div className="mb-2">
                            <strong style={{ fontFamily: 'Inter, sans-serif' }}>Rejection Reason:</strong>
                            <br />
                            <span className="text-danger" style={{ fontFamily: 'Inter, sans-serif' }}>{selectedTx.rejection_reason}</span>
                          </div>
                        )}
                        {selectedTx.payment_method === "flutterwave" && selectedTx.flutterwave_reference && (
  <div className="mb-2">
    <strong style={{ fontFamily: 'Inter, sans-serif' }}>Flutterwave Ref:</strong> {selectedTx.flutterwave_reference}
  </div>
)}
                      </div>
                    </div>

                    {/* Images Section */}
                    {(selectedTx.payment_method === "manual_transfer" && selectedTx.proof_of_payment_url) || getImageUrl(selectedTx) ? (
                      <div className="row mb-4">
                        <div className="col-12">
                          <h6 className="fw-bold mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                            <i className="bi bi-images me-2"></i>
                            Images
                          </h6>
                          <div className="row g-3">
                            {selectedTx.payment_method === "manual_transfer" && selectedTx.proof_of_payment_url && (
                              <div className="col-md-6">
                                <div className="card border" style={{ borderRadius: '0' }}>
                                  <div className="card-header bg-light">
                                    <strong style={{ fontFamily: 'Inter, sans-serif' }}>Proof of Payment</strong>
                                  </div>
                                  <div className="card-body p-2">
                                    <a href={selectedTx.proof_of_payment_url} target="_blank" rel="noopener noreferrer">
                                      <img
                                        src={selectedTx.proof_of_payment_url}
                                        alt="Proof of Payment"
                                        style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '0' }}
                                      />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            )}
                            {getImageUrl(selectedTx) && (
                              <div className="col-md-6">
                                <div className="card border" style={{ borderRadius: '0' }}>
                                  <div className="card-header bg-light">
                                    <strong style={{ fontFamily: 'Inter, sans-serif' }}>Gift Card Image</strong>
                                  </div>
                                  <div className="card-body p-2">
                                    <img
                                      src={getImageUrl(selectedTx)}
                                      alt="Gift Card"
                                      style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '0' }}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Action Buttons */}
                    {selectedTx.status === "pending" && selectedTx.payment_method === "manual_transfer" && !showRejectReason && (
                      <div className="d-flex gap-2 pt-3 border-top">
                          <button
                          className="btn btn-success"
                            disabled={actionLoading}
                            onClick={() => setShowApproveConfirm(true)}
                          style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                          >
                          <i className="bi bi-check-lg me-2"></i>
                          Approve Transaction
                          </button>
                          <button
                          className="btn btn-danger"
                            disabled={actionLoading}
                            onClick={() => setShowRejectReason(true)}
                          style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                          >
                          <i className="bi bi-x-lg me-2"></i>
                          Reject Transaction
                          </button>
                        </div>
                      )}

                    {/* Rejection Form */}
                    {selectedTx.status === "pending" && showRejectReason && (
                      <form
                        className="pt-3 border-top"
                        onSubmit={(e) => {
                          e.preventDefault()
                          setShowRejectConfirm(true)
                        }}
                      >
                        <div className="mb-3">
                          <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                            Rejection Reason <span className="text-danger">*</span>
                          </label>
                          <textarea
                            className="form-control"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            required
                            rows={3}
                            disabled={actionLoading}
                            placeholder="Please provide a clear reason for rejection..."
                            style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                          ></textarea>
                        </div>
                        <div className="d-flex gap-2">
                          <button
                            type="submit"
                            className="btn btn-danger"
                            disabled={actionLoading || !rejectReason.trim()}
                            style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                          >
                            <i className="bi bi-x-lg me-2"></i>
                            Submit Rejection
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => {
                              setShowRejectReason(false)
                              setRejectReason("")
                            }}
                            disabled={actionLoading}
                            style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Action Messages */}
                    {actionError && (
                      <div className="alert alert-danger py-2 mt-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {actionError}
                      </div>
                    )}
                    {actionSuccess && (
                      <div className="alert alert-success py-2 mt-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                        <i className="bi bi-check-circle me-2"></i>
                        {actionSuccess}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveConfirm && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)", zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '0', fontFamily: 'Inter, sans-serif' }}>
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <i className="bi bi-check-circle text-success me-2"></i>
                  Confirm Approval
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowApproveConfirm(false)}></button>
              </div>
              <div className="modal-body p-4">
                <p style={{ fontFamily: 'Inter, sans-serif' }}>Are you sure you want to approve this transaction?</p>
                <p className="text-muted small" style={{ fontFamily: 'Inter, sans-serif' }}>
                  This will mark the transaction as completed and notify the user.
                </p>
              </div>
              <div className="modal-footer border-top">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary" 
                  onClick={() => setShowApproveConfirm(false)}
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => {
                    setShowApproveConfirm(false)
                    handleAction("completed")
                  }}
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                >
                  <i className="bi bi-check-lg me-2"></i>
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectConfirm && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)", zIndex: 1060 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '0', fontFamily: 'Inter, sans-serif' }}>
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <i className="bi bi-exclamation-triangle text-danger me-2"></i>
                  Confirm Rejection
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowRejectConfirm(false)}></button>
              </div>
              <div className="modal-body p-4">
                <p style={{ fontFamily: 'Inter, sans-serif' }}>Are you sure you want to reject this transaction?</p>
                <p className="text-muted small" style={{ fontFamily: 'Inter, sans-serif' }}>
                  This will mark the transaction as rejected and notify the user with the reason.
                </p>
              </div>
              <div className="modal-footer border-top">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary" 
                  onClick={() => setShowRejectConfirm(false)}
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    setShowRejectConfirm(false)
                    handleAction("rejected")
                  }}
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                >
                  <i className="bi bi-x-lg me-2"></i>
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transactions
