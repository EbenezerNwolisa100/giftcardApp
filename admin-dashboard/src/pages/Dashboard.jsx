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

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentTxs, setRecentTxs] = useState([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        // Total users
        const { count: userCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
        // Gift card transactions
        const { count: txCount, data: txs } = await supabase.from('giftcard_transactions').select('id, amount, type, status, created_at, total, brand:giftcard_brands(name)', { count: 'exact' }).order('created_at', { ascending: false }).limit(5);
        const totalTxVolume = txs?.reduce((sum, t) => sum + (Number(t.total) || 0), 0) || 0;
        const sellCount = txs?.filter(t => t.type === 'sell').length || 0;
        const buyCount = txs?.filter(t => t.type === 'buy').length || 0;
        // Withdrawals
        const { count: withdrawalCount, data: withdrawals } = await supabase.from('withdrawals').select('id, amount, status, created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(5);
        const totalWithdrawalVolume = withdrawals?.reduce((sum, w) => sum + (Number(w.amount) || 0), 0) || 0;
        const pendingWithdrawals = withdrawals?.filter(w => w.status === 'pending').length || 0;
        // Recent
        setRecentTxs(txs || []);
        setRecentWithdrawals(withdrawals || []);
        setStats({
          userCount,
          txCount,
          totalTxVolume,
          sellCount,
          buyCount,
          withdrawalCount,
          totalWithdrawalVolume,
          pendingWithdrawals,
        });
      } catch {
        setError('Failed to load dashboard stats.');
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>;
  if (error) return <div className="alert alert-danger my-4">{error}</div>;

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Dashboard</h2>
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card text-bg-primary h-100">
            <div className="card-body">
              <h6 className="card-title">Total Users</h6>
              <h3 className="card-text">{stats.userCount}</h3>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card text-bg-success h-100">
            <div className="card-body">
              <h6 className="card-title">Gift Card Transactions</h6>
              <h3 className="card-text">{stats.txCount}</h3>
              <small>Total Volume: ₦{stats.totalTxVolume.toLocaleString()}</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card text-bg-info h-100">
            <div className="card-body">
              <h6 className="card-title">Withdrawals</h6>
              <h3 className="card-text">{stats.withdrawalCount}</h3>
              <small>Total Volume: ₦{stats.totalWithdrawalVolume.toLocaleString()}</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card text-bg-warning h-100">
            <div className="card-body">
              <h6 className="card-title">Pending Withdrawals</h6>
              <h3 className="card-text">{stats.pendingWithdrawals}</h3>
            </div>
          </div>
        </div>
      </div>
      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <div className="card h-100">
            <div className="card-header bg-light fw-bold">Recent Transactions</div>
            <div className="card-body p-0">
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
                    {recentTxs.length === 0 ? (
                      <tr><td colSpan="5" className="text-center">No recent transactions</td></tr>
                    ) : recentTxs.map(tx => (
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
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card h-100">
            <div className="card-header bg-light fw-bold">Recent Withdrawals</div>
            <div className="card-body p-0">
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
                    {recentWithdrawals.length === 0 ? (
                      <tr><td colSpan="3" className="text-center">No recent withdrawals</td></tr>
                    ) : recentWithdrawals.map(w => (
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 