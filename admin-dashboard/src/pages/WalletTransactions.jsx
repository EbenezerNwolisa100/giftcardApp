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
      // Paystack transactions are already completed and balance already updated
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
    <div className="container-fluid py-4">
      <h2 className="mb-4">Wallet Transactions</h2>
      <div className="row mb-3 g-2 align-items-end">
        <div className="col-md-2">
          <label className="form-label">Status</label>
          <select className="form-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="col-md-2">
          <label className="form-label">Type</label>
          <select className="form-select" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="all">All</option>
            <option value="fund">Fund</option>
            <option value="purchase">Purchase</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="refund">Refund</option>
          </select>
        </div>
        <div className="col-md-2">
          <label className="form-label">Payment Method</label>
          <select className="form-select" value={paymentMethodFilter} onChange={e => { setPaymentMethodFilter(e.target.value); setPage(1); }}>
            <option value="all">All</option>
            <option value="paystack">Paystack</option>
            <option value="manual_transfer">Manual Transfer</option>
            <option value="wallet">Wallet</option>
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">Search</label>
          <input
            type="text"
            className="form-control"
            placeholder="User, description, or reference"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
      ) : error ? (
        <div className="alert alert-danger my-4">{error}</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover table-sm align-middle">
            <thead>
              <tr>
                <th>Date</th>
                <th>User</th>
                <th>Email</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment Method</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="9" className="text-center">No wallet transactions found</td></tr>
              ) : filtered.map(tx => (
                <tr key={tx.id}>
                  <td>{formatDate(tx.created_at)}</td>
                  <td>{tx.user?.full_name || '-'}</td>
                  <td>{tx.user?.email || '-'}</td>
                  <td>
                    <span className={`badge bg-${getTransactionColor(tx.type)}`}>
                      {getTransactionTypeLabel(tx.type)}
                    </span>
                  </td>
                  <td>₦{Number(tx.amount).toLocaleString()}</td>
                  <td>
                    <span className={`badge bg-${tx.status === 'completed' ? 'success' : tx.status === 'pending' ? 'warning' : 'danger'}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td>
                    {tx.payment_method === 'paystack' ? 'Paystack' : 
                     tx.payment_method === 'manual_transfer' ? 'Manual Transfer' : 
                     tx.payment_method === 'wallet' ? 'Wallet' : '-'}
                  </td>
                  <td>{tx.description || '-'}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => openTx(tx)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Pagination */}
      <div className="d-flex justify-content-center align-items-center mt-3 gap-2">
        <button className="btn btn-sm btn-outline-secondary" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button className="btn btn-sm btn-outline-secondary" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Wallet Transaction Details</h5>
                <button type="button" className="btn-close" onClick={closeTx}></button>
              </div>
              <div className="modal-body">
                {modalLoading || !selectedTx ? (
                  <div className="text-center py-4"><div className="spinner-border text-primary" role="status"></div></div>
                ) : modalError ? (
                  <div className="alert alert-danger py-2">{modalError}</div>
                ) : (
                  <>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <strong>User:</strong> {selectedTx.user?.full_name} <br />
                        <strong>Email:</strong> {selectedTx.user?.email} <br />
                        <strong>Type:</strong> <span className={`badge bg-${getTransactionColor(selectedTx.type)}`}>{getTransactionTypeLabel(selectedTx.type)}</span> <br />
                        <strong>Status:</strong> <span className={`badge bg-${selectedTx.status === 'completed' ? 'success' : selectedTx.status === 'pending' ? 'warning' : 'danger'}`}>{selectedTx.status}</span> <br />
                        <strong>Date:</strong> {formatDate(selectedTx.created_at)} <br />
                        <strong>Amount:</strong> ₦{Number(selectedTx.amount).toLocaleString()} <br />
                        <strong>Payment Method:</strong> {
                          selectedTx.payment_method === 'paystack' ? 'Paystack' : 
                          selectedTx.payment_method === 'manual_transfer' ? 'Manual Transfer' : 
                          selectedTx.payment_method === 'wallet' ? 'Wallet' : '-'
                        } <br />
                        <strong>Description:</strong> {selectedTx.description || '-'} <br />
                        {selectedTx.reference && (
                          <><strong>Reference:</strong> {selectedTx.reference}<br /></>
                        )}
                        {selectedTx.rejection_reason && (
                          <><strong>Rejection Reason:</strong> <span className="text-danger">{selectedTx.rejection_reason}</span><br /></>
                        )}
                      </div>
                      <div className="col-md-6">
                        {selectedTx.payment_method === 'manual_transfer' && selectedTx.proof_of_payment_url && (
                          <div className="mt-2">
                            <strong>Proof of Payment:</strong><br />
                            <a href={selectedTx.proof_of_payment_url} target="_blank" rel="noopener noreferrer">
                              <img src={selectedTx.proof_of_payment_url} alt="Proof" style={{ maxWidth: 180, maxHeight: 120, borderRadius: 8, border: '1px solid #ccc' }} />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedTx.status === 'pending' && selectedTx.type === 'fund' && selectedTx.payment_method === 'manual_transfer' && !showRejectReason && (
                      <div className="mb-3">
                        <button className="btn btn-sm btn-success me-2" disabled={actionLoading} onClick={() => setShowApproveConfirm(true)}>Approve</button>
                        <button className="btn btn-sm btn-danger" disabled={actionLoading} onClick={() => setShowRejectReason(true)}>Reject</button>
                      </div>
                    )}
                    {selectedTx.status === 'pending' && showRejectReason && (
                      <form className="mb-3" onSubmit={e => { e.preventDefault(); setShowRejectConfirm(true); }}>
                        <div className="mb-2">
                          <label className="form-label">Rejection Reason <span className="text-danger">*</span></label>
                          <textarea className="form-control" value={rejectReason} onChange={e => setRejectReason(e.target.value)} required rows={3} disabled={actionLoading} placeholder="Please provide a clear reason for rejection..."></textarea>
                        </div>
                        <div className="d-flex gap-2">
                          <button type="submit" className="btn btn-danger btn-sm" disabled={actionLoading || !rejectReason.trim()}>Submit Rejection</button>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setShowRejectReason(false); setRejectReason(''); }} disabled={actionLoading}>Cancel</button>
                        </div>
                      </form>
                    )}
                    {actionError && <div className="alert alert-danger py-2">{actionError}</div>}
                    {actionSuccess && <div className="alert alert-success py-2">{actionSuccess}</div>}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Approve Confirmation Modal */}
      {showApproveConfirm && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)', zIndex: 1050 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Approval</h5>
                <button type="button" className="btn-close" onClick={() => setShowApproveConfirm(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to approve this wallet funding?</p>
                <p className="text-muted small">This will fund the user's wallet and notify them.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowApproveConfirm(false)}>Cancel</button>
                <button type="button" className="btn btn-success" onClick={() => { setShowApproveConfirm(false); handleAction('completed'); }}>Approve</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectConfirm && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)', zIndex: 1050 }}>
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Rejection</h5>
                <button type="button" className="btn-close" onClick={() => setShowRejectConfirm(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to reject this wallet funding?</p>
                <p className="text-muted small">This will mark the transaction as rejected and notify the user with the reason.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRejectConfirm(false)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={() => { setShowRejectConfirm(false); handleAction('rejected'); }}>Reject</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletTransactions; 