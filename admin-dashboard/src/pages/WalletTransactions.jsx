import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

const PAGE_SIZE = 20;

const WalletTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTx, setSelectedTx] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError('');
      try {
        let query = supabase
          .from('wallet_transactions')
          .select(`
            id, user_id, type, amount, status, created_at, description,
            payment_method, reference, proof_of_payment_url,
            user:profiles(full_name, email)
          `)
          .order('created_at', { ascending: false });
        if (statusFilter !== 'all') query = query.eq('status', statusFilter);
        if (typeFilter !== 'all') query = query.eq('type', typeFilter);
        if (paymentMethodFilter !== 'all') query = query.eq('payment_method', paymentMethodFilter);
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        query = query.range(from, to);
        const { data, error } = await query;
        if (error) throw error;
        setTransactions(data || []);
        // Get total count for pagination
        let countQuery = supabase
          .from('wallet_transactions')
          .select('id', { count: 'exact', head: true });
        if (statusFilter !== 'all') countQuery = countQuery.eq('status', statusFilter);
        if (typeFilter !== 'all') countQuery = countQuery.eq('type', typeFilter);
        if (paymentMethodFilter !== 'all') countQuery = countQuery.eq('payment_method', paymentMethodFilter);
        const { count: totalCount } = await countQuery;
        setTotalPages(Math.ceil((totalCount || 1) / PAGE_SIZE));
      } catch {
        setError('Failed to load wallet transactions.');
      }
      setLoading(false);
    };
    fetchTransactions();
  }, [statusFilter, typeFilter, paymentMethodFilter, page]);

  // Filter by search (user name/email or description)
  const filtered = transactions.filter(tx => {
    const user = tx.user || {};
    const searchLower = search.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      tx.description?.toLowerCase().includes(searchLower) ||
      tx.reference?.toLowerCase().includes(searchLower)
    );
  });

  const openTx = async (tx) => {
    setSelectedTx(null);
    setModalLoading(true);
    setModalError('');
    setActionError('');
    setActionSuccess('');
    setShowRejectReason(false);
    setRejectReason('');
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select(`
          *,
          user:profiles(full_name, email)
        `)
        .eq('id', tx.id)
        .single();
      if (error) throw error;
      setSelectedTx(data);
    } catch {
      setModalError('Failed to load transaction details.');
    }
    setModalLoading(false);
  };

  const closeTx = () => {
    setSelectedTx(null);
    setModalError('');
    setActionError('');
    setActionSuccess('');
    setShowRejectReason(false);
    setRejectReason('');
  };

  const handleAction = async (status) => {
    if (!selectedTx) return;
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');
    try {
      let updateObj = { status };
      if (status === 'rejected') {
        if (!rejectReason.trim()) {
          setActionError('Rejection reason is required.');
          setActionLoading(false);
          return;
        }
        updateObj.rejection_reason = rejectReason.trim();
      }

      // Update wallet transaction
      const { error } = await supabase
        .from('wallet_transactions')
        .update(updateObj)
        .eq('id', selectedTx.id);
      if (error) throw error;

      // If approving a fund transaction, update user balance ONLY for manual transfers
      // Flutterwave transactions are already completed and balance already updated
      if (status === 'completed' && selectedTx.type === 'fund' && selectedTx.payment_method === 'manual_transfer') {
        // Double-check that this transaction hasn't already been processed
        const { data: existingTx } = await supabase
          .from('wallet_transactions')
          .select('id, status')
          .eq('id', selectedTx.id)
          .single();
        
        if (!existingTx || existingTx.status === 'completed') {
          throw new Error('Transaction has already been processed.');
        }
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', selectedTx.user_id)
          .single();
        
        const newBalance = (profile?.balance || 0) + Number(selectedTx.amount);
        
        const { error: balanceError } = await supabase
          .from('profiles')
          .update({ balance: newBalance })
          .eq('id', selectedTx.user_id);
        
        if (balanceError) throw balanceError
      }

      setActionSuccess(`Transaction ${status}.`);
      setSelectedTx({ ...selectedTx, status, rejection_reason: updateObj.rejection_reason });
      setTransactions(txs => txs.map(t => t.id === selectedTx.id ? { ...t, status, rejection_reason: updateObj.rejection_reason } : t));
      setShowRejectReason(false);
      setRejectReason('');

      // Send notification
      let notifTitle = '';
      let notifBody = '';
      if (status === 'completed') {
        if (selectedTx.type === 'fund') {
          notifTitle = 'Wallet Funded';
          notifBody = `Your wallet has been funded with ₦${Number(selectedTx.amount).toLocaleString()}.`;
        } else {
          notifTitle = 'Transaction Approved';
          notifBody = `Your wallet transaction of ₦${Number(selectedTx.amount).toLocaleString()} has been approved.`;
        }
      } else if (status === 'rejected') {
        notifTitle = 'Transaction Rejected';
        notifBody = `Your wallet transaction of ₦${Number(selectedTx.amount).toLocaleString()} was rejected. Reason: ${updateObj.rejection_reason}`;
      }

      if (notifTitle && notifBody) {
        await supabase.from('notifications').insert({
          user_id: selectedTx.user_id,
          title: notifTitle,
          body: notifBody,
          read: false
        });

        // Send push notification
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('expo_push_token')
          .eq('id', selectedTx.user_id)
          .single();
        const expoPushToken = userProfile?.expo_push_token;
        if (expoPushToken) {
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: expoPushToken,
              title: notifTitle,
              body: notifBody,
              sound: 'default',
              data: { type: 'notification' }
            })
          });
        }
      }
    } catch {
      setActionError('Failed to update transaction.');
    }
    setActionLoading(false);
  };

  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case 'fund': return 'Wallet Fund';
      case 'purchase': return 'Gift Card Purchase';
      case 'withdrawal': return 'Withdrawal';
      case 'refund': return 'Refund';
      case 'credit': return 'Credit';
      case 'debit': return 'Debit';
      default: return type;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'fund':
      case 'refund':
      case 'credit':
        return 'success';
      case 'purchase':
      case 'withdrawal':
      case 'debit':
        return 'danger';
      default:
        return 'primary';
    }
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', width: '100%', overflowX: 'hidden', maxWidth: '100vw' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4" style={{ padding: '0 15px' }}>
        <div>
          <h2 className="mb-1 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>Wallet Transactions</h2>
          <p className="text-muted mb-0" style={{ fontFamily: 'Inter, sans-serif' }}>
            Manage and review all wallet transactions and funding requests
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
                  onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                >
                  <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="col-md-2">
                <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Type</label>
                <select 
                  className="form-select" 
                  value={typeFilter} 
                  onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                >
                  <option value="all">All Types</option>
            <option value="fund">Fund</option>
            <option value="purchase">Purchase</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="refund">Refund</option>
          </select>
        </div>
        <div className="col-md-2">
                <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Payment Method</label>
                <select 
                  className="form-select" 
                  value={paymentMethodFilter} 
                  onChange={e => { setPaymentMethodFilter(e.target.value); setPage(1); }}
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
                  placeholder="Search by user, description, or reference"
            value={search}
            onChange={e => setSearch(e.target.value)}
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

      {/* Wallet Transactions Table */}
      {loading ? (
        <div className="text-start py-5" style={{ padding: '0 15px' }}>
          <div className="spinner-border text-primary" role="status"></div>
          <span className="ms-2">Loading wallet transactions...</span>
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
                <i className="bi bi-wallet2 me-2"></i>
                Wallet Transactions ({filtered.length})
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
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '15%', fontFamily: 'Inter, sans-serif' }}>User</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '12%', fontFamily: 'Inter, sans-serif' }}>Type</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '10%', fontFamily: 'Inter, sans-serif' }}>Amount</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '8%', fontFamily: 'Inter, sans-serif' }}>Status</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '12%', fontFamily: 'Inter, sans-serif' }}>Payment Method</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '20%', fontFamily: 'Inter, sans-serif' }}>Description</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '11%', fontFamily: 'Inter, sans-serif' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-start py-5 text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <div className="text-center">
                            <i className="bi bi-wallet2 fs-1 text-muted mb-3 d-block"></i>
                            <h6 className="fw-bold">No wallet transactions found</h6>
                            <p className="mb-0">Try adjusting your filters or search terms</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map(tx => (
                        <tr key={tx.id} className="border-bottom">
                          <td className="px-3 py-3 text-start">
                            <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {formatDate(tx.created_at)}
                            </small>
                          </td>
                          <td className="px-3 py-3 text-start">
                            <div>
                              <div className="fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {tx.user?.full_name || '-'}
                              </div>
                              <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                                {tx.user?.email || '-'}
                              </small>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-start">
                            <span className={`badge bg-${getTransactionColor(tx.type)}`} style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}>
                      {getTransactionTypeLabel(tx.type)}
                    </span>
                  </td>
                          <td className="px-3 py-3 text-start">
                            <div className="fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                              ₦{Number(tx.amount).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-start">
                            <span className={`badge bg-${tx.status === 'completed' ? 'success' : tx.status === 'pending' ? 'warning' : 'danger'}`} style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}>
                      {tx.status}
                    </span>
                  </td>
                          <td className="px-3 py-3 text-start">
                            <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {tx.payment_method === 'flutterwave' ? 'Flutterwave' : 
                     tx.payment_method === 'manual_transfer' ? 'Manual Transfer' : 
                     tx.payment_method === 'wallet' ? 'Wallet' : '-'}
                            </small>
                          </td>
                          <td className="px-3 py-3 text-start">
                            <div className="text-truncate" style={{ maxWidth: '200px', fontFamily: 'Inter, sans-serif' }}>
                              {tx.description || '-'}
                            </div>
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
              onClick={() => setPage(p => Math.max(1, p - 1))}
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
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '0', fontFamily: 'Inter, sans-serif' }}>
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <i className="bi bi-wallet2 me-2"></i>
                  Wallet Transaction Details
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
                          <span className={`badge bg-${selectedTx.status === 'completed' ? 'success' : selectedTx.status === 'pending' ? 'warning' : 'danger'}`} style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}>
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
                          <span className={`badge bg-${getTransactionColor(selectedTx.type)}`} style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}>
                            {getTransactionTypeLabel(selectedTx.type)}
                          </span>
                        </div>
                        <div className="mb-2">
                          <strong style={{ fontFamily: 'Inter, sans-serif' }}>Amount:</strong> ₦{Number(selectedTx.amount).toLocaleString()}
                        </div>
                        <div className="mb-2">
                          <strong style={{ fontFamily: 'Inter, sans-serif' }}>Payment Method:</strong>{" "}
                          {selectedTx.payment_method === 'flutterwave' ? 'Flutterwave' : 
                           selectedTx.payment_method === 'manual_transfer' ? 'Manual Transfer' : 
                           selectedTx.payment_method === 'wallet' ? 'Wallet' : '-'}
                        </div>
                        <div className="mb-2">
                          <strong style={{ fontFamily: 'Inter, sans-serif' }}>Description:</strong> {selectedTx.description || '-'}
                        </div>
                        {selectedTx.reference && (
                          <div className="mb-2">
                            <strong style={{ fontFamily: 'Inter, sans-serif' }}>Reference:</strong> {selectedTx.reference}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rejection Reason */}
                    {selectedTx.rejection_reason && (
                      <div className="row mb-4">
                        <div className="col-12">
                          <h6 className="fw-bold mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                            <i className="bi bi-exclamation-triangle text-danger me-2"></i>
                            Rejection Details
                          </h6>
                          <div className="alert alert-danger" style={{ fontFamily: 'Inter, sans-serif' }}>
                            <strong>Rejection Reason:</strong> {selectedTx.rejection_reason}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Proof of Payment */}
                    {selectedTx.payment_method === 'manual_transfer' && selectedTx.proof_of_payment_url && (
                      <div className="row mb-4">
                        <div className="col-12">
                          <h6 className="fw-bold mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                            <i className="bi bi-images me-2"></i>
                            Proof of Payment
                          </h6>
                          <div className="card border" style={{ borderRadius: '0', maxWidth: '300px' }}>
                            <div className="card-body p-2">
                              <a href={selectedTx.proof_of_payment_url} target="_blank" rel="noopener noreferrer">
                                <img 
                                  src={selectedTx.proof_of_payment_url} 
                                  alt="Proof of Payment" 
                                  style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '0' }} 
                                />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {selectedTx.status === 'pending' && selectedTx.type === 'fund' && selectedTx.payment_method === 'manual_transfer' && !showRejectReason && (
                      <div className="d-flex gap-2 pt-3 border-top">
                        <button 
                          className="btn btn-success" 
                          disabled={actionLoading} 
                          onClick={() => setShowApproveConfirm(true)}
                          style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                        >
                          <i className="bi bi-check-lg me-2"></i>
                          Approve Funding
                        </button>
                        <button 
                          className="btn btn-danger" 
                          disabled={actionLoading} 
                          onClick={() => setShowRejectReason(true)}
                          style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                        >
                          <i className="bi bi-x-lg me-2"></i>
                          Reject Funding
                        </button>
                      </div>
                    )}

                    {/* Rejection Form */}
                    {selectedTx.status === 'pending' && showRejectReason && (
                      <form 
                        className="pt-3 border-top" 
                        onSubmit={e => { e.preventDefault(); setShowRejectConfirm(true); }}
                      >
                        <div className="mb-3">
                          <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                            Rejection Reason <span className="text-danger">*</span>
                          </label>
                          <textarea 
                            className="form-control" 
                            value={rejectReason} 
                            onChange={e => setRejectReason(e.target.value)} 
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
                            onClick={() => { setShowRejectReason(false); setRejectReason(''); }} 
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
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
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
                <p style={{ fontFamily: 'Inter, sans-serif' }}>Are you sure you want to approve this wallet funding?</p>
                <p className="text-muted small" style={{ fontFamily: 'Inter, sans-serif' }}>
                  This will fund the user's wallet and notify them.
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
                  onClick={() => { setShowApproveConfirm(false); handleAction('completed'); }}
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
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
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
                <p style={{ fontFamily: 'Inter, sans-serif' }}>Are you sure you want to reject this wallet funding?</p>
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
                  onClick={() => { setShowRejectConfirm(false); handleAction('rejected'); }}
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
  );
};

export default WalletTransactions; 