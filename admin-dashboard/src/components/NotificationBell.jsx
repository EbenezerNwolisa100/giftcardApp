import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState({
    pendingWithdrawals: 0,
    pendingTransactions: 0,
    supportRequests: 0,
    total: 0
  });

  useEffect(() => {
    fetchNotifications();
    // Refresh every 2 minutes
    const interval = setInterval(fetchNotifications, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      // Fetch pending withdrawals
      const { count: pendingWithdrawals } = await supabase
        .from('withdrawals')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch pending transactions
      const { count: pendingTransactions } = await supabase
        .from('giftcard_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch pending support requests
      const { count: supportRequests } = await supabase
        .from('support_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      const total = (pendingWithdrawals || 0) + (pendingTransactions || 0) + (supportRequests || 0);

      setNotifications({
        pendingWithdrawals: pendingWithdrawals || 0,
        pendingTransactions: pendingTransactions || 0,
        supportRequests: supportRequests || 0,
        total
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  return (
    <div className="dropdown">
      <button 
        className="btn btn-outline-secondary position-relative" 
        type="button" 
        data-bs-toggle="dropdown" 
        aria-expanded="false"
      >
        <i className="bi bi-bell fs-5"></i>
        {notifications.total > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {notifications.total > 99 ? '99+' : notifications.total}
          </span>
        )}
      </button>
      <ul className="dropdown-menu dropdown-menu-end" style={{ width: '300px' }}>
        <li><h6 className="dropdown-header">Notifications</h6></li>
        {notifications.total === 0 ? (
          <li><span className="dropdown-item-text text-muted">No pending actions</span></li>
        ) : (
          <>
            {notifications.pendingWithdrawals > 0 && (
              <li>
                <a className="dropdown-item d-flex align-items-center" href="/withdrawals">
                  <i className="bi bi-cash-stack text-warning me-2"></i>
                  <div>
                    <div className="fw-semibold">{notifications.pendingWithdrawals} Pending Withdrawals</div>
                    <small className="text-muted">Requires admin approval</small>
                  </div>
                </a>
              </li>
            )}
            {notifications.pendingTransactions > 0 && (
              <li>
                <a className="dropdown-item d-flex align-items-center" href="/transactions">
                  <i className="bi bi-receipt text-info me-2"></i>
                  <div>
                    <div className="fw-semibold">{notifications.pendingTransactions} Pending Transactions</div>
                    <small className="text-muted">Awaiting processing</small>
                  </div>
                </a>
              </li>
            )}
            {notifications.supportRequests > 0 && (
              <li>
                <a className="dropdown-item d-flex align-items-center" href="/support-requests">
                  <i className="bi bi-headset text-primary me-2"></i>
                  <div>
                    <div className="fw-semibold">{notifications.supportRequests} Support Requests</div>
                    <small className="text-muted">Customer inquiries</small>
                  </div>
                </a>
              </li>
            )}
          </>
        )}
        <li><hr className="dropdown-divider" /></li>
        <li><a className="dropdown-item text-center" href="/dashboard">View All</a></li>
      </ul>
    </div>
  );
};

export default NotificationBell; 