import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [userBank, setUserBank] = useState(null);
  const [txs, setTxs] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setUsers(data || []);
      } catch {
        setError('Failed to load users.');
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openUser = async (user) => {
    setSelectedUser(user);
    setDetailsLoading(true);
    setUserDetails(null);
    setUserBank(null);
    setTxs([]);
    setWithdrawals([]);
    setActionError('');
    setActionSuccess('');
    try {
      // Fetch latest profile (in case of updates)
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserDetails(profile);
      // Fetch bank info
      const { data: bank } = await supabase
        .from('user_banks')
        .select('bank_name, account_number, account_name')
        .eq('user_id', user.id)
        .single();
      setUserBank(bank);
      // Fetch recent transactions
      const { data: txsData } = await supabase
        .from('giftcard_transactions')
        .select('id, amount, total, type, status, created_at, brand:giftcard_brands(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      setTxs(txsData || []);
      // Fetch recent withdrawals
      const { data: withdrawalsData } = await supabase
        .from('withdrawals')
        .select('id, amount, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      setWithdrawals(withdrawalsData || []);
    } catch {
      setActionError('Failed to load user details.');
    }
    setDetailsLoading(false);
  };

  const closeUser = () => {
    setSelectedUser(null);
    setUserDetails(null);
    setUserBank(null);
    setTxs([]);
    setWithdrawals([]);
    setActionError('');
    setActionSuccess('');
  };

  const handleRoleChange = async (makeAdmin) => {
    if (!userDetails) return;
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');
    try {
      const { error } = await supabase.from('profiles').update({ role: makeAdmin ? 'admin' : 'user' }).eq('id', userDetails.id);
      if (error) throw error;
      setUserDetails({ ...userDetails, role: makeAdmin ? 'admin' : 'user' });
      setActionSuccess(`User is now ${makeAdmin ? 'an admin' : 'a regular user'}.`);
      // Update in main list
      setUsers(users => users.map(u => u.id === userDetails.id ? { ...u, role: makeAdmin ? 'admin' : 'user' } : u));
    } catch {
      setActionError('Failed to update role.');
    }
    setActionLoading(false);
  };

  const handleResetPassword = async () => {
    if (!userDetails?.email) return;
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userDetails.email);
      if (error) throw error;
      setActionSuccess('Password reset email sent.');
    } catch {
      setActionError('Failed to send password reset email.');
    }
    setActionLoading(false);
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Users</h2>
      <div className="mb-3 row">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Search by name or email"
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
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Balance</th>
                <th>Created At</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan="6" className="text-center">No users found</td></tr>
              ) : filteredUsers.map(u => (
                <tr key={u.id}>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td><span className={`badge bg-${u.role === 'admin' ? 'success' : 'secondary'}`}>{u.role}</span></td>
                  <td>₦{Number(u.balance).toLocaleString()}</td>
                  <td>{formatDate(u.created_at)}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openUser(u)}>View</button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate(`/users/${u.id}/edit`)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">User Details</h5>
                <button type="button" className="btn-close" onClick={closeUser}></button>
              </div>
              <div className="modal-body">
                {detailsLoading || !userDetails ? (
                  <div className="text-center py-4"><div className="spinner-border text-primary" role="status"></div></div>
                ) : (
                  <>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <strong>Name:</strong> {userDetails.full_name}<br />
                        <strong>Email:</strong> {userDetails.email}<br />
                        <strong>Role:</strong> <span className={`badge bg-${userDetails.role === 'admin' ? 'success' : 'secondary'}`}>{userDetails.role}</span><br />
                        <strong>Balance:</strong> ₦{Number(userDetails.balance).toLocaleString()}<br />
                        <strong>Created At:</strong> {formatDate(userDetails.created_at)}<br />
                        <strong>Transaction Pin:</strong> {userDetails.transaction_pin ? 'Set' : 'Not Set'}<br />
                      </div>
                      <div className="col-md-6">
                        <strong>Bank Info:</strong><br />
                        {userBank ? (
                          <>
                            {userBank.bank_name} <br />
                            {userBank.account_number} <br />
                            {userBank.account_name}
                          </>
                        ) : 'No bank info'}
                      </div>
                    </div>
                    <div className="mb-3">
                      <button
                        className="btn btn-sm btn-outline-success me-2"
                        disabled={actionLoading || userDetails.role === 'admin'}
                        onClick={() => handleRoleChange(true)}
                      >Promote to Admin</button>
                      <button
                        className="btn btn-sm btn-outline-secondary me-2"
                        disabled={actionLoading || userDetails.role === 'user'}
                        onClick={() => handleRoleChange(false)}
                      >Demote to User</button>
                      <button
                        className="btn btn-sm btn-outline-warning"
                        disabled={actionLoading}
                        onClick={handleResetPassword}
                      >Reset Password</button>
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
                                <tr><td colSpan="5" className="text-center">No transactions</td></tr>
                              ) : txs.map(tx => (
                                <tr key={tx.id}>
                                  <td>{formatDate(tx.created_at)}</td>
                                  <td>{tx.type?.charAt(0).toUpperCase() + tx.type?.slice(1)}</td>
                                  <td>{tx.brand?.name || '-'}</td>
                                  <td>₦{Number(tx.total || tx.amount).toLocaleString()}</td>
                                  <td><span className={`badge bg-${tx.status === 'completed' ? 'success' : tx.status === 'pending' ? 'warning' : 'danger'}`}>{tx.status}</span></td>
                                </tr>
                              ))}
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
                                <tr><td colSpan="3" className="text-center">No withdrawals</td></tr>
                              ) : withdrawals.map(w => (
                                <tr key={w.id}>
                                  <td>{formatDate(w.created_at)}</td>
                                  <td>₦{Number(w.amount).toLocaleString()}</td>
                                  <td><span className={`badge bg-${w.status === 'completed' ? 'success' : w.status === 'pending' ? 'warning' : 'danger'}`}>{w.status}</span></td>
                                </tr>
                              ))}
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
    </div>
  );
};

export default Users; 