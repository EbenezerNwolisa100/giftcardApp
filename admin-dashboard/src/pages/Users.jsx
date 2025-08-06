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

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [sortBy, setSortBy] = useState("created_at")
  const [selectedUser, setSelectedUser] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [userDetails, setUserDetails] = useState(null)
  const [userBank, setUserBank] = useState(null)
  const [txs, setTxs] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState("")
  const [actionSuccess, setActionSuccess] = useState("")

  // State for Edit User Modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    balance: "",
    role: "",
    transaction_pin: "",
    bank_name: "",
    account_number: "",
    account_name: "",
  })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState("")
  const [editSuccess, setEditSuccess] = useState("")

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      setError("")
      try {
        const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })
        if (error) throw error
        setUsers(data || [])
      } catch (err) {
        setError("Failed to load users: " + (err?.message || ""))
      }
      setLoading(false)
    }
    fetchUsers()
  }, [])

  // Enhanced filtering and sorting logic
  const filteredUsers = users
    .filter((u) => {
      // Search filter
      const searchMatch = !search || 
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
      
      // Role filter
      const roleMatch = roleFilter === "all" || u.role === roleFilter
      
      return searchMatch && roleMatch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "full_name":
          return (a.full_name || "").localeCompare(b.full_name || "")
        case "email":
          return (a.email || "").localeCompare(b.email || "")
        case "balance":
          return (Number(a.balance) || 0) - (Number(b.balance) || 0)
        case "created_at":
        default:
          return new Date(b.created_at) - new Date(a.created_at)
      }
    })

  const openUser = async (user) => {
    setSelectedUser(user)
    setDetailsLoading(true)
    setUserDetails(null)
    setUserBank(null)
    setTxs([])
    setWithdrawals([])
    setActionError("")
    setActionSuccess("")
    try {
      // Fetch latest profile (in case of updates)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      if (profileError) throw profileError
      setUserDetails(profile)

      // Fetch bank info
      const { data: bank, error: bankError } = await supabase
        .from("user_banks")
        .select("bank_name, account_number, account_name")
        .eq("user_id", user.id)
        .single()
      if (bankError && bankError.code !== "PGRST116") {
        console.warn("No bank details found or error fetching bank details:", bankError.message)
      }
      setUserBank(bank)

      // Fetch recent transactions
      const { data: txsData, error: txsError } = await supabase
        .from("giftcard_transactions")
        .select(
          `
          id, amount, total, type, status, created_at,
          sell_brand:sell_brand_id(name),
          buy_brand:buy_brand_id(name)
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)
      if (txsError) throw txsError
      setTxs(txsData || [])

      // Fetch recent withdrawals
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from("withdrawals")
        .select("id, amount, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5)
      if (withdrawalsError) throw withdrawalsError
      setWithdrawals(withdrawalsData || [])
    } catch (err) {
      setActionError("Failed to load user details: " + (err?.message || ""))
    }
    setDetailsLoading(false)
  }

  const closeUser = () => {
    setSelectedUser(null)
    setUserDetails(null)
    setUserBank(null)
    setTxs([])
    setWithdrawals([])
    setActionError("")
    setActionSuccess("")
  }

  const handleRoleChange = async (makeAdmin) => {
    if (!userDetails) return
    setActionLoading(true)
    setActionError("")
    setActionSuccess("")
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: makeAdmin ? "admin" : "user" })
        .eq("id", userDetails.id)
      if (error) throw error
      setUserDetails({ ...userDetails, role: makeAdmin ? "admin" : "user" })
      setActionSuccess(`User is now ${makeAdmin ? "an admin" : "a regular user"}.`)
      setUsers((users) =>
        users.map((u) => (u.id === userDetails.id ? { ...u, role: makeAdmin ? "admin" : "user" } : u)),
      )
    } catch (err) {
      setActionError("Failed to update role: " + (err?.message || ""))
    }
    setActionLoading(false)
  }

  const handleResetPassword = async () => {
    if (!userDetails?.email) return
    setActionLoading(true)
    setActionError("")
    setActionSuccess("")
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userDetails.email)
      if (error) throw error
      setActionSuccess("Password reset email sent.")
    } catch (err) {
      setActionError("Failed to send password reset email: " + (err?.message || ""))
    }
    setActionLoading(false)
  }

  const handleBalanceCorrection = async (newBalance) => {
    setActionLoading(true)
    setActionError("")
    setActionSuccess("")
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", selectedUser.id)
      if (error) throw error
      setActionSuccess(`Balance corrected to ₦${newBalance.toLocaleString()}`)
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", selectedUser.id)
        .single()
      if (profile) {
        setUserDetails(profile)
      }
    } catch (err) {
      setActionError("Failed to correct balance: " + (err?.message || ""))
    }
    setActionLoading(false)
  }

  const getTransactionBrandName = (tx) => {
    if (tx.type === "sell") {
      return tx.sell_brand?.name || "-"
    } else if (tx.type === "buy") {
      return tx.buy_brand?.name || "-"
    }
    return "-"
  }

  const openEditModal = async (user) => {
    setEditingUser(user)
    setEditError("")
    setEditSuccess("")
    setEditLoading(true)

    try {
      const { data: bank, error: bankError } = await supabase
        .from("user_banks")
        .select("bank_name, account_number, account_name")
        .eq("user_id", user.id)
        .single()

      if (bankError && bankError.code !== "PGRST116") {
        console.warn("No bank details found or error fetching bank details for edit:", bankError.message)
      }

      setEditForm({
        full_name: user.full_name || "",
        email: user.email || "",
        balance: user.balance?.toString() || "0",
        role: user.role || "user",
        transaction_pin: user.transaction_pin || "",
        bank_name: bank?.bank_name || "",
        account_number: bank?.account_number || "",
        account_name: bank?.account_name || "",
      })
      setShowEditModal(true)
    } catch (err) {
      setEditError("Failed to load user details for editing: " + (err?.message || ""))
    } finally {
      setEditLoading(false)
    }
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditingUser(null)
    setEditForm({
      full_name: "",
      email: "",
      balance: "",
      role: "",
      transaction_pin: "",
      bank_name: "",
      account_number: "",
      account_name: "",
    })
  }

  const handleEditFormChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    if (!editingUser) return

    setEditLoading(true)
    setEditError("")
    setEditSuccess("")

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: editForm.full_name.trim(),
          email: editForm.email.trim(),
          balance: Number(editForm.balance),
          role: editForm.role,
          transaction_pin: editForm.transaction_pin.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingUser.id)

      if (profileError) throw profileError

      const hasBankDetailsInForm =
        editForm.bank_name.trim() || editForm.account_number.trim() || editForm.account_name.trim()

      const { data: existingBank, error: fetchBankError } = await supabase
        .from("user_banks")
        .select("user_id")
        .eq("user_id", editingUser.id)
        .single()

      if (fetchBankError && fetchBankError.code !== "PGRST116") {
        throw fetchBankError
      }

      if (hasBankDetailsInForm) {
        const bankData = {
          bank_name: editForm.bank_name.trim(),
          account_number: editForm.account_number.trim(),
          account_name: editForm.account_name.trim(),
          updated_at: new Date().toISOString(),
        }
        if (existingBank) {
          const { error: updateBankError } = await supabase
            .from("user_banks")
            .update(bankData)
            .eq("user_id", editingUser.id)
          if (updateBankError) throw updateBankError
        } else {
          const { error: insertBankError } = await supabase
            .from("user_banks")
            .insert({ user_id: editingUser.id, ...bankData })
          if (insertBankError) throw insertBankError
        }
      } else if (existingBank) {
        const { error: deleteBankError } = await supabase.from("user_banks").delete().eq("user_id", editingUser.id)
        if (deleteBankError) throw deleteBankError
      }

      setEditSuccess("User updated successfully!")
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                full_name: editForm.full_name.trim(),
                email: editForm.email.trim(),
                balance: Number(editForm.balance),
                role: editForm.role,
                transaction_pin: editForm.transaction_pin.trim() || null,
              }
            : u,
        ),
      )
      if (selectedUser && selectedUser.id === editingUser.id) {
        await openUser(editingUser)
      }
    } catch (err) {
      setEditError("Failed to update user: " + (err?.message || ""))
    }
    setEditLoading(false)
  }

  return (
    <div style={{ 
      fontFamily: 'Inter, sans-serif', 
      width: '100%', 
      overflowX: 'hidden',
      maxWidth: '100vw'
    }}>
      {/* Header */}
      {/* <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>Users</h2>
          <p className="text-muted mb-0" style={{ fontFamily: 'Inter, sans-serif' }}>Manage user accounts and permissions</p>
        </div>
      </div> */}
      <div className="row mb-4 g-3 align-items-end" style={{ width: '100%', margin: '0', padding: '0 15px' }}>
        <div className="col-8 col-md-4" style={{ padding: '0 7.5px' }}>
          <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Search</label>
          <input
            type="text"
            className="form-control"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
          />
        </div>
        <div className="col-6 col-md-2" style={{ padding: '0 7.5px' }}>
          <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Role</label>
          <select
            className="form-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="col-12 col-md-2" style={{ padding: '0 7.5px' }}>
          <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Sort by</label>
          <select
            className="form-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
          >
            <option value="created_at">Date Created</option>
            <option value="full_name">Name</option>
            <option value="email">Email</option>
            <option value="balance">Balance</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-start py-5" style={{ padding: '0 15px' }}>
          <div className="spinner-border text-primary" role="status"></div>
          <span className="ms-2">Loading users...</span>
        </div>
      ) : error ? (
        <div className="alert alert-danger my-4" style={{ margin: '0 15px' }}>{error}</div>
      ) : (
        <div style={{ padding: '0 15px' }}>
          <div className="card border shadow-sm" style={{ backgroundColor: '#ffffff', borderRadius: '0' }}>
            <div className="card-body p-0">
              <div className="table-container">
                <table className="table table-hover mb-0" style={{ 
                  fontFamily: 'Inter, sans-serif', 
                  width: '100%', 
                  minWidth: '1000px',
                  tableLayout: 'fixed'
                }}>
                  <thead className="table-light">
                    <tr>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '20%', fontFamily: 'Inter, sans-serif' }}>Name</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '25%', fontFamily: 'Inter, sans-serif' }}>Email</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '12%', fontFamily: 'Inter, sans-serif' }}>Role</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '15%', fontFamily: 'Inter, sans-serif' }}>Balance</th>
                      <th className="px-3 py-3 fw-semibold d-none d-md-table-cell text-start" style={{ width: '15%', fontFamily: 'Inter, sans-serif' }}>Created At</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '13%', fontFamily: 'Inter, sans-serif' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                        <td colSpan="6" className="text-start py-5 text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                        <tr key={u.id} className="border-bottom">
                          <td className="px-3 py-3 fw-medium text-start">
                            <div className="text-truncate" style={{ fontFamily: 'Inter, sans-serif' }} title={u.full_name}>
                              {u.full_name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-start">
                            <div className="text-truncate" style={{ fontFamily: 'Inter, sans-serif' }} title={u.email}>
                              {u.email || 'N/A'}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-start">
                            <span className={`badge ${u.role === "admin" ? "bg-success" : "bg-secondary"}`} style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}>
                              {u.role || 'user'}
                            </span>
                          </td>
                          <td className="px-3 py-3 fw-semibold text-start">
                            <div className="text-truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                              ₦{Number(u.balance || 0).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-muted d-none d-md-table-cell text-start">
                            <div className="text-truncate" style={{ fontFamily: 'Inter, sans-serif' }} title={formatDate(u.created_at)}>
                              {formatDate(u.created_at)}
                            </div>
                    </td>
                          <td className="px-3 py-3 text-start">
                            <div className="d-flex gap-1 flex-wrap">
                              <button 
                                className="btn btn-sm btn-outline-primary" 
                                onClick={() => openUser(u)}
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                              >
                        View
                      </button>
                              <button 
                                className="btn btn-sm btn-outline-secondary" 
                                onClick={() => openEditModal(u)}
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                              >
                        Edit
                      </button>
                            </div>
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
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-4 gap-3" style={{ padding: '0 15px' }}>
        <div className="text-muted text-start" style={{ fontFamily: 'Inter, sans-serif' }}>
          Showing {filteredUsers.length} of {users.length} users
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}>
            <i className="bi bi-chevron-left"></i>
          </button>
          <button className="btn btn-outline-secondary btn-sm" style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}>
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">User Details</h5>
                <button type="button" className="btn-close" onClick={closeUser}></button>
              </div>
              <div className="modal-body">
                {detailsLoading || !userDetails ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status"></div>
                  </div>
                ) : (
                  <>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <strong>Name:</strong> {userDetails.full_name}
                        <br />
                        <strong>Email:</strong> {userDetails.email}
                        <br />
                        <strong>Role:</strong>{" "}
                        <span className={`badge bg-${userDetails.role === "admin" ? "success" : "secondary"}`}>
                          {userDetails.role}
                        </span>
                        <br />
                        <strong>Balance:</strong> ₦{Number(userDetails.balance).toLocaleString()}
                        <br />
                        <strong>Created At:</strong> {formatDate(userDetails.created_at)}
                        <br />
                        <strong>Transaction Pin:</strong> {userDetails.transaction_pin ? "Set" : "Not Set"}
                        <br />
                      </div>
                      <div className="col-md-6">
                        <strong>Bank Info:</strong>
                        <br />
                        {userBank ? (
                          <>
                            {userBank.bank_name} <br />
                            {userBank.account_number} <br />
                            {userBank.account_name}
                          </>
                        ) : (
                          "No bank info"
                        )}
                      </div>
                    </div>
                    <div className="mb-3">
                      <button
                        className="btn btn-sm btn-outline-success me-2"
                        disabled={actionLoading || userDetails.role === "admin"}
                        onClick={() => handleRoleChange(true)}
                      >
                        Promote to Admin
                      </button>
                      <button
                        className="btn btn-sm btn-outline-secondary me-2"
                        disabled={actionLoading || userDetails.role === "user"}
                        onClick={() => handleRoleChange(false)}
                      >
                        Demote to User
                      </button>
                      <button
                        className="btn btn-sm btn-outline-warning"
                        disabled={actionLoading}
                        onClick={handleResetPassword}
                      >
                        Reset Password
                      </button>
                      <button
                        className="btn btn-sm btn-outline-info"
                        disabled={actionLoading}
                        onClick={() => {
                          const newBalance = prompt(`Current balance: ₦${Number(userDetails.balance).toLocaleString()}\nEnter correct balance:`, userDetails.balance);
                          if (newBalance && !isNaN(newBalance)) {
                            handleBalanceCorrection(Number(newBalance));
                          }
                        }}
                      >
                        Correct Balance
                      </button>
                    </div>
                    {actionError && <div className="alert alert-danger py-2">{actionError}</div>}
                    {actionSuccess && <div className="alert alert-success py-2">{actionSuccess}</div>}
                    <div className="row mt-4">
                      <div className="col-md-6">
                        <h6>Recent Transactions</h6>
                        <div className="table-responsive">
                          <table className="table table-sm mb-0">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Brand</th>
                                <th>Amount</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {txs.length === 0 ? (
                                <tr>
                                  <td colSpan="5" className="text-center">
                                    No transactions
                                  </td>
                                </tr>
                              ) : (
                                txs.map((tx) => (
                                  <tr key={tx.id}>
                                    <td>{formatDate(tx.created_at)}</td>
                                    <td>{tx.type?.charAt(0).toUpperCase() + tx.type?.slice(1)}</td>
                                    <td>{getTransactionBrandName(tx)}</td>
                                    <td>₦{Number(tx.total || tx.amount).toLocaleString()}</td>
                                    <td>
                                      <span
                                        className={`badge bg-${tx.status === "completed" ? "success" : tx.status === "pending" ? "warning" : "danger"}`}
                                      >
                                        {tx.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <h6>Recent Withdrawals</h6>
                        <div className="table-responsive">
                          <table className="table table-sm mb-0">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {withdrawals.length === 0 ? (
                                <tr>
                                  <td colSpan="3" className="text-center">
                                    No withdrawals
                                  </td>
                                </tr>
                              ) : (
                                withdrawals.map((w) => (
                                  <tr key={w.id}>
                                    <td>{formatDate(w.created_at)}</td>
                                    <td>₦{Number(w.amount).toLocaleString()}</td>
                                    <td>
                                      <span
                                        className={`badge bg-${w.status === "completed" ? "success" : w.status === "pending" ? "warning" : "danger"}`}
                                      >
                                        {w.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.3)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit User: {editingUser?.full_name}</h5>
                <button type="button" className="btn-close" onClick={closeEditModal}></button>
              </div>
              <div className="modal-body">
                {editLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2">Loading user data...</p>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateUser}>
                    <div className="row">
                      <div className="col-md-6">
                        <h6 className="mb-3">Profile Details</h6>
                        <div className="mb-3">
                          <label className="form-label">Full Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editForm.full_name}
                            onChange={(e) => handleEditFormChange("full_name", e.target.value)}
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Email</label>
                          <input
                            type="email"
                            className="form-control"
                            value={editForm.email}
                            onChange={(e) => handleEditFormChange("email", e.target.value)}
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Balance (₦)</label>
                          <input
                            type="number"
                            className="form-control"
                            value={editForm.balance}
                            onChange={(e) => handleEditFormChange("balance", e.target.value)}
                            step="0.01"
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Role</label>
                          <select
                            className="form-select"
                            value={editForm.role}
                            onChange={(e) => handleEditFormChange("role", e.target.value)}
                            required
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Transaction Pin</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editForm.transaction_pin}
                            onChange={(e) => handleEditFormChange("transaction_pin", e.target.value)}
                            placeholder="Enter new pin or leave empty to clear"
                          />
                          <small className="form-text text-muted">
                            Leave empty to clear the transaction pin, or enter a new one.
                          </small>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <h6 className="mb-3">Bank Details</h6>
                        <div className="mb-3">
                          <label className="form-label">Bank Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editForm.bank_name}
                            onChange={(e) => handleEditFormChange("bank_name", e.target.value)}
                            placeholder="e.g., Access Bank"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Account Number</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editForm.account_number}
                            onChange={(e) => handleEditFormChange("account_number", e.target.value)}
                            placeholder="e.g., 0123456789"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Account Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editForm.account_name}
                            onChange={(e) => handleEditFormChange("account_name", e.target.value)}
                            placeholder="e.g., John Doe"
                          />
                        </div>
                        <small className="form-text text-muted">
                          Leave all bank fields empty to remove bank details.
                        </small>
                      </div>
                    </div>
                    {editError && <div className="alert alert-danger py-2 mt-3">{editError}</div>}
                    {editSuccess && <div className="alert alert-success py-2 mt-3">{editSuccess}</div>}
                    <div className="d-flex justify-content-end gap-2 mt-3">
                      <button type="button" className="btn btn-secondary" onClick={closeEditModal}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={editLoading}>
                        {editLoading ? "Updating..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users
