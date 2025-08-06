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

const Withdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedW, setSelectedW] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const fetchWithdrawals = async () => {
      setLoading(true);
      setError('');
      try {
        let query = supabase
          .from('withdrawals')
          .select('id, user_id, amount, status, type, created_at, rejection_reason, user:profiles(full_name, email)')
          .order('created_at', { ascending: false });
        if (statusFilter !== 'all') query = query.eq('status', statusFilter);
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        query = query.range(from, to);
        const { data, error } = await query;
        if (error) throw error;
        setWithdrawals(data || []);
        // Get total count for pagination
        const { count: totalCount } = await supabase
          .from('withdrawals')
          .select('id', { count: 'exact', head: true });
        setTotalPages(Math.ceil((totalCount || 1) / PAGE_SIZE));
      } catch {
        setError('Failed to load withdrawals.');
      }
      setLoading(false);
    };
    fetchWithdrawals();
  }, [statusFilter, page]);

  // Filter by search (user name/email)
  const filtered = withdrawals.filter(w => {
    const user = w.user || {};
    const searchLower = search.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  const openW = async (w) => {
    setSelectedW(null);
    setModalLoading(true);
    setModalError('');
    setActionError('');
    setActionSuccess('');
    setShowRejectReason(false);
    setRejectReason('');
    try {
      // Fetch full withdrawal details (with user info)
      const { data: withdrawal, error } = await supabase
        .from('withdrawals')
        .select('*, user:profiles(full_name, email)')
        .eq('id', w.id)
        .single();
      if (error) throw error;
      // Fetch bank info separately
      let bank = null;
      if (withdrawal?.user_id) {
        const { data: bankData } = await supabase
          .from('user_banks')
          .select('bank_name, account_number, account_name')
          .eq('user_id', withdrawal.user_id)
          .single();
        bank = bankData;
      }
      setSelectedW({ ...withdrawal, bank });
    } catch {
      setModalError('Failed to load withdrawal details.');
    }
    setModalLoading(false);
  };

  const closeW = () => {
    setSelectedW(null);
    setModalError('');
    setActionError('');
    setActionSuccess('');
    setShowRejectReason(false);
    setRejectReason('');
  };

  const handleAction = async (status) => {
    if (!selectedW) return;
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
      
      // Update withdrawal status
      const { error: withdrawalError } = await supabase
        .from('withdrawals')
        .update(updateObj)
        .eq('id', selectedW.id);
      if (withdrawalError) throw withdrawalError;

      // Update corresponding wallet transaction status
      const { error: walletTxError } = await supabase
        .from('wallet_transactions')
        .update({ status })
        .eq('user_id', selectedW.user_id)
        .eq('type', 'withdrawal')
        .eq('amount', selectedW.amount)
        .gte('created_at', new Date(selectedW.created_at).toISOString())
        .lte('created_at', new Date(selectedW.created_at).toISOString());
      if (walletTxError) {
        console.error('Error updating wallet transaction:', walletTxError);
        // Don't throw error here as the main withdrawal update succeeded
      }

      // If withdrawal is rejected, refund the money to user's wallet
      if (status === 'rejected') {
        // Get current user balance
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', selectedW.user_id)
          .single();
        
        if (profileError) throw profileError;
        
        // Calculate new balance (add back the withdrawal amount)
        const currentBalance = userProfile.balance || 0;
        const newBalance = currentBalance + Number(selectedW.amount);
        
        // Update user's wallet balance
        const { error: balanceError } = await supabase
          .from('profiles')
          .update({ balance: newBalance })
          .eq('id', selectedW.user_id);
        
        if (balanceError) throw balanceError;

        // Create refund wallet transaction
        const { error: refundTxError } = await supabase
          .from('wallet_transactions')
          .insert({
            user_id: selectedW.user_id,
            type: 'refund',
            amount: Number(selectedW.amount),
            status: 'completed',
            description: `Withdrawal refund - ${updateObj.rejection_reason}`,
            payment_method: 'refund',
            reference: `REF-${Date.now()}`,
          });
        
        if (refundTxError) {
          console.error('Error creating refund transaction:', refundTxError);
          // Don't throw error here as the main refund succeeded
        }
      }

      setActionSuccess(`Withdrawal ${status}.${status === 'rejected' ? ' Amount has been refunded to user wallet.' : ''}`);
      setSelectedW({ ...selectedW, status, rejection_reason: updateObj.rejection_reason });
      setWithdrawals(ws => ws.map(w => w.id === selectedW.id ? { ...w, status, rejection_reason: updateObj.rejection_reason } : w));
      setShowRejectReason(false);
      setRejectReason('');
      
      // Insert notification for the user
      let notifTitle = '';
      let notifBody = '';
      if (status === 'completed') {
        notifTitle = 'Withdrawal Approved';
        notifBody = `Your withdrawal of ₦${Number(selectedW.amount).toLocaleString()} has been approved.`;
      } else if (status === 'rejected') {
        notifTitle = 'Withdrawal Rejected & Refunded';
        notifBody = `Your withdrawal of ₦${Number(selectedW.amount).toLocaleString()} was rejected and refunded to your wallet. Reason: ${updateObj.rejection_reason}`;
      }
      
      if (notifTitle && notifBody) {
        await supabase.from('notifications').insert({
          user_id: selectedW.user_id,
          title: notifTitle,
          body: notifBody,
          read: false
        });
        
        // Send push notification if user has expo_push_token
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('expo_push_token')
          .eq('id', selectedW.user_id)
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
    } catch (error) {
      console.error('Error handling withdrawal action:', error);
      setActionError('Failed to update withdrawal.');
    }
    setActionLoading(false);
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', width: '100%', overflowX: 'hidden', maxWidth: '100vw' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4" style={{ padding: '0 15px' }}>
        <div>
          <h2 className="mb-1 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>Withdrawals</h2>
          <p className="text-muted mb-0" style={{ fontFamily: 'Inter, sans-serif' }}>
            Manage user withdrawal requests and approvals
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="row mb-4 g-3 align-items-end" style={{ width: '100%', margin: '0', padding: '0 15px' }}>
        <div className="col-12 col-md-3" style={{ padding: '0 7.5px' }}>
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
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="col-12 col-md-6" style={{ padding: '0 7.5px' }}>
          <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Search</label>
          <input
            type="text"
            className="form-control"
            placeholder="Search by user name or email"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
          />
        </div>
      </div>

      {/* Withdrawals Table */}
      {loading ? (
        <div className="text-start py-5" style={{ padding: '0 15px' }}>
          <div className="spinner-border text-primary" role="status"></div>
          <span className="ms-2">Loading withdrawals...</span>
        </div>
      ) : error ? (
        <div className="alert alert-danger my-4" style={{ margin: '0 15px' }}>
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      ) : (
        <div style={{ padding: '0 15px' }}>
          <div className="card border shadow-sm" style={{ backgroundColor: '#ffffff', borderRadius: '0' }}>
            <div className="card-body p-0">
              <div className="table-container">
                <table className="table table-hover mb-0" style={{ fontFamily: 'Inter, sans-serif', width: '100%', minWidth: '1000px', tableLayout: 'fixed' }}>
                  <thead className="table-light">
                    <tr>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '18%', fontFamily: 'Inter, sans-serif' }}>Date</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '20%', fontFamily: 'Inter, sans-serif' }}>User</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '25%', fontFamily: 'Inter, sans-serif' }}>Email</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '15%', fontFamily: 'Inter, sans-serif' }}>Amount</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '12%', fontFamily: 'Inter, sans-serif' }}>Status</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '10%', fontFamily: 'Inter, sans-serif' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-start py-5 text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                          No withdrawals found
                        </td>
                      </tr>
              ) : filtered.map(w => (
                      <tr key={w.id} className="border-bottom">
                        <td className="px-3 py-3 text-start">
                          <div className="text-truncate" style={{ fontFamily: 'Inter, sans-serif' }} title={formatDate(w.created_at)}>
                            {formatDate(w.created_at)}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-start">
                          <div className="text-truncate fw-medium" style={{ fontFamily: 'Inter, sans-serif' }} title={w.user?.full_name}>
                            {w.user?.full_name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-start">
                          <div className="text-truncate" style={{ fontFamily: 'Inter, sans-serif' }} title={w.user?.email}>
                            {w.user?.email || 'N/A'}
                          </div>
                        </td>
                        <td className="px-3 py-3 fw-semibold text-start">
                          <div className="text-truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                            ₦{Number(w.amount).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-start">
                          <span className={`badge ${w.status === 'completed' ? 'bg-success' : w.status === 'pending' ? 'bg-warning' : 'bg-danger'}`} 
                                style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}>
                            {w.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-start">
                          <button 
                            className="btn btn-sm btn-outline-primary" 
                            onClick={() => openW(w)}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                          >
                            View
                          </button>
                  </td>
                </tr>
              ))}
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
          Showing {filtered.length} of {withdrawals.length} withdrawals
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-secondary btn-sm" 
            disabled={page === 1} 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
          >
            <i className="bi bi-chevron-left"></i>
            Prev
          </button>
          <span className="d-flex align-items-center px-3" style={{ fontFamily: 'Inter, sans-serif' }}>
            Page {page} of {totalPages}
          </span>
          <button 
            className="btn btn-outline-secondary btn-sm" 
            disabled={page === totalPages} 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
          >
            Next
            <i className="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>

      {/* Withdrawal Details Modal */}
      {selectedW && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '0', fontFamily: 'Inter, sans-serif' }}>
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <i className="bi bi-bank me-2"></i>
                  Withdrawal Details
                </h5>
                <button type="button" className="btn-close" onClick={closeW}></button>
              </div>
              <div className="modal-body p-4">
                {modalLoading || !selectedW ? (
                  <div className="text-start py-4">
                    <div className="spinner-border text-primary" role="status"></div>
                    <span className="ms-2">Loading withdrawal details...</span>
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
                          <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>Full Name</small>
                          <div className="fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {selectedW.user?.full_name || 'N/A'}
                          </div>
                        </div>
                        <div className="mb-2">
                          <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>Email</small>
                          <div className="fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {selectedW.user?.email || 'N/A'}
                          </div>
                        </div>
                        <div className="mb-2">
                          <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>Status</small>
                          <div>
                            <span className={`badge ${selectedW.status === 'completed' ? 'bg-success' : selectedW.status === 'pending' ? 'bg-warning' : 'bg-danger'}`} 
                                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}>
                              {selectedW.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <h6 className="fw-bold mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <i className="bi bi-currency-exchange me-2"></i>
                          Transaction Details
                        </h6>
                        <div className="mb-2">
                          <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>Amount</small>
                          <div className="fw-bold fs-5" style={{ fontFamily: 'Inter, sans-serif' }}>
                            ₦{Number(selectedW.amount).toLocaleString()}
                          </div>
                        </div>
                        <div className="mb-2">
                          <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>Date</small>
                          <div className="fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {formatDate(selectedW.created_at)}
                          </div>
                        </div>
                        <div className="mb-2">
                          <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>Type</small>
                          <div className="fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {selectedW.type || 'Standard'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bank Information */}
                    <div className="mb-4">
                      <h6 className="fw-bold mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                        <i className="bi bi-bank me-2"></i>
                        Bank Information
                      </h6>
                      {selectedW.bank ? (
                        <div className="row">
                          <div className="col-md-4">
                            <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>Bank Name</small>
                            <div className="fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {selectedW.bank.bank_name}
                            </div>
                          </div>
                          <div className="col-md-4">
                            <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>Account Number</small>
                            <div className="fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {selectedW.bank.account_number}
                            </div>
                          </div>
                          <div className="col-md-4">
                            <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>Account Name</small>
                            <div className="fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {selectedW.bank.account_name}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          No bank information available
                        </div>
                      )}
                    </div>

                    {/* Rejection Reason */}
                    {selectedW.rejection_reason && (
                      <div className="mb-4">
                        <h6 className="fw-bold mb-3 text-danger" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <i className="bi bi-x-circle me-2"></i>
                          Rejection Reason
                        </h6>
                        <div className="alert alert-danger py-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {selectedW.rejection_reason}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {selectedW.status === 'pending' && !showRejectReason && (
                      <div className="d-flex gap-2 pt-3 border-top">
                        <button 
                          className="btn btn-success" 
                          disabled={actionLoading} 
                          onClick={() => handleAction('completed')}
                          style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                        >
                          <i className="bi bi-check-lg me-2"></i>
                          Approve Withdrawal
                        </button>
                        <button 
                          className="btn btn-danger" 
                          disabled={actionLoading} 
                          onClick={() => setShowRejectReason(true)}
                          style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                        >
                          <i className="bi bi-x-lg me-2"></i>
                          Reject Withdrawal
                        </button>
                      </div>
                    )}

                    {/* Rejection Form */}
                    {selectedW.status === 'pending' && showRejectReason && (
                      <form className="pt-3 border-top" onSubmit={e => { e.preventDefault(); handleAction('rejected'); }}>
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
                            placeholder="Please provide a reason for rejecting this withdrawal..."
                            style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                          ></textarea>
                        </div>
                        <div className="d-flex gap-2">
                          <button 
                            type="submit" 
                            className="btn btn-danger" 
                            disabled={actionLoading}
                            style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                          >
                            {actionLoading ? (
                              <>
                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                                Processing...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-x-lg me-2"></i>
                                Submit Rejection
                              </>
                            )}
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
    </div>
  );
};

export default Withdrawals; 