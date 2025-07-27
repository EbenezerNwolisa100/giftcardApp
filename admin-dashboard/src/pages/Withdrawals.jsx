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
    <div className="container-fluid py-4">
      <h2 className="mb-4">Withdrawals</h2>
      <div className="row mb-3 g-2 align-items-end">
        <div className="col-md-2">
          <label className="form-label">Status</label>
          <select className="form-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">Search</label>
          <input
            type="text"
            className="form-control"
            placeholder="User name or email"
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
                <th>Amount</th>
                <th>Status</th>
                <th>Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7" className="text-center">No withdrawals found</td></tr>
              ) : filtered.map(w => (
                <tr key={w.id}>
                  <td>{formatDate(w.created_at)}</td>
                  <td>{w.user?.full_name || '-'}</td>
                  <td>{w.user?.email || '-'}</td>
                  <td>₦{Number(w.amount).toLocaleString()}</td>
                  <td><span className={`badge bg-${w.status === 'completed' ? 'success' : w.status === 'pending' ? 'warning' : 'danger'}`}>{w.status}</span></td>
                  <td>{w.type || '-'}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => openW(w)}>View</button>
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

      {/* Withdrawal Details Modal */}
      {selectedW && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Withdrawal Details</h5>
                <button type="button" className="btn-close" onClick={closeW}></button>
              </div>
              <div className="modal-body">
                {modalLoading || !selectedW ? (
                  <div className="text-center py-4"><div className="spinner-border text-primary" role="status"></div></div>
                ) : modalError ? (
                  <div className="alert alert-danger py-2">{modalError}</div>
                ) : (
                  <>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <strong>User:</strong> {selectedW.user?.full_name} <br />
                        <strong>Email:</strong> {selectedW.user?.email} <br />
                        <strong>Status:</strong> <span className={`badge bg-${selectedW.status === 'completed' ? 'success' : selectedW.status === 'pending' ? 'warning' : 'danger'}`}>{selectedW.status}</span> <br />
                        <strong>Date:</strong> {formatDate(selectedW.created_at)} <br />
                        <strong>Amount:</strong> ₦{Number(selectedW.amount).toLocaleString()} <br />
                        <strong>Type:</strong> {selectedW.type || '-'} <br />
                        {selectedW.rejection_reason && (
                          <><strong>Rejection Reason:</strong> <span className="text-danger">{selectedW.rejection_reason}</span><br /></>
                        )}
                      </div>
                      <div className="col-md-6">
                        <strong>Bank Info:</strong><br />
                        {selectedW.bank ? (
                          <>
                            {selectedW.bank.bank_name} <br />
                            {selectedW.bank.account_number} <br />
                            {selectedW.bank.account_name}
                          </>
                        ) : 'No bank info'}
                      </div>
                    </div>
                    {selectedW.status === 'pending' && !showRejectReason && (
                      <div className="mb-3">
                        <button className="btn btn-sm btn-success me-2" disabled={actionLoading} onClick={() => handleAction('completed')}>Approve</button>
                        <button className="btn btn-sm btn-danger" disabled={actionLoading} onClick={() => setShowRejectReason(true)}>Reject</button>
                      </div>
                    )}
                    {selectedW.status === 'pending' && showRejectReason && (
                      <form className="mb-3" onSubmit={e => { e.preventDefault(); handleAction('rejected'); }}>
                        <div className="mb-2">
                          <label className="form-label">Rejection Reason <span className="text-danger">*</span></label>
                          <textarea className="form-control" value={rejectReason} onChange={e => setRejectReason(e.target.value)} required rows={2} disabled={actionLoading}></textarea>
                        </div>
                        <div className="d-flex gap-2">
                          <button type="submit" className="btn btn-danger btn-sm" disabled={actionLoading}>Submit Rejection</button>
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
    </div>
  );
};

export default Withdrawals; 