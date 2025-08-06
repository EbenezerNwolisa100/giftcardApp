import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import QuickStats from '../components/QuickStats';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

const formatCurrency = (amount) => {
  return `₦${Number(amount).toLocaleString()}`;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentTxs, setRecentTxs] = useState([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, 90d, 1y
  const [activeTab, setActiveTab] = useState('transactions'); // Add tab state
  const [chartData, setChartData] = useState({
    transactionTrend: [],
    revenueData: [],
    brandPerformance: [],
    statusDistribution: []
  });
  const [pendingActions, setPendingActions] = useState({
    pendingWithdrawals: 0,
    pendingTransactions: 0,
    lowInventory: 0,
    supportRequests: 0
  });

  const getDateFilter = () => {
    const now = new Date();
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
    return new Date(now.getTime() - (days * 24 * 60 * 60 * 1000)).toISOString();
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [dateRange]);

  const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
      const dateFilter = getDateFilter();
      
      // Enhanced stats with date filtering
      const { count: userCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      // Recent users (last 30 days)
      const { count: recentUsers } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Recent gift card transactions (all types and statuses for display)
      const { count: txCount, data: txs } = await supabase
        .from('giftcard_transactions')
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
        .order('created_at', { ascending: false })
        .limit(10); // Show last 10 transactions

      console.log('Recent transactions data:', txs);
      console.log('Sample transaction:', txs?.[0]);

      // Calculate revenue metrics based on your requirements
      const { data: allTxsForRevenue } = await supabase
        .from('giftcard_transactions')
        .select('id, amount, type, status, created_at, total')
        .gte('created_at', dateFilter)
        .in('status', ['completed', 'pending']); // Include completed and pending, exclude rejected

      // Separate transactions by type and status
      const buyTransactions = allTxsForRevenue?.filter(t => t.type === 'buy' && t.status === 'completed') || [];
      const sellTransactions = allTxsForRevenue?.filter(t => t.type === 'sell' && t.status === 'completed') || [];
      
      // Calculate total amount from buy transactions (money spent buying gift cards)
      const totalBuyAmount = buyTransactions.reduce((sum, t) => sum + (Number(t.total) || Number(t.amount) || 0), 0);
      
      // Calculate total amount from sell transactions (money earned selling gift cards)
      const totalSellAmount = sellTransactions.reduce((sum, t) => sum + (Number(t.total) || Number(t.amount) || 0), 0);
      
      const sellCount = sellTransactions.length;
      const buyCount = buyTransactions.length;
      const completedTxs = allTxsForRevenue?.filter(t => t.status === 'completed').length || 0;
      const pendingTxs = allTxsForRevenue?.filter(t => t.status === 'pending').length || 0;

      // Withdrawals - separate completed and pending
      const { count: withdrawalCount, data: withdrawals } = await supabase
        .from('withdrawals')
        .select('id, user_id, amount, status, created_at, user:profiles(full_name, email)', { count: 'exact' })
        .gte('created_at', dateFilter)
        .in('status', ['completed', 'pending']) // Include completed and pending, exclude rejected
        .order('created_at', { ascending: false })
        .limit(10);

      console.log('Recent withdrawals data:', withdrawals);
      console.log('Sample withdrawal:', withdrawals?.[0]);

      // Calculate total withdrawal amount (only completed transactions)
      const completedWithdrawals = withdrawals?.filter(w => w.status === 'completed') || [];
      const pendingWithdrawals = withdrawals?.filter(w => w.status === 'pending') || [];
      
      const totalWithdrawalVolume = completedWithdrawals.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
      const pendingWithdrawalCount = pendingWithdrawals.length;

      // Support requests
      const { count: supportCount } = await supabase
        .from('support_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Brand performance data
      const { data: brandData } = await supabase
        .from('giftcard_transactions')
        .select('total, brand:giftcard_brands(name)')
        .gte('created_at', dateFilter)
        .eq('status', 'completed');

      // Generate chart data
      const transactionTrend = generateTransactionTrend();
      const revenueData = generateRevenueData();
      const brandPerformance = processBrandData(brandData);
      const statusDistribution = [
        { name: 'Completed', value: completedTxs, color: '#00C49F' },
        { name: 'Pending', value: pendingTxs, color: '#FFBB28' },
        { name: 'Failed', value: (txs?.length || 0) - completedTxs - pendingTxs, color: '#FF8042' }
      ];

        setRecentTxs(txs || []);
        setRecentWithdrawals(withdrawals || []);
      setChartData({
        transactionTrend,
        revenueData,
        brandPerformance,
        statusDistribution
      });
      setPendingActions({
        pendingWithdrawals: pendingWithdrawalCount,
        pendingTransactions: pendingTxs,
        lowInventory: 0, // TODO: Implement inventory check
        supportRequests: supportCount
      });
        setStats({
          userCount,
        recentUsers,
          txCount,
        totalBuyAmount,
        totalSellAmount,
          sellCount,
          buyCount,
          withdrawalCount,
          totalWithdrawalVolume,
        pendingWithdrawals: pendingWithdrawalCount,
        completedTxs,
        pendingTxs,
        supportCount
        });
    } catch (err) {
      console.error('Dashboard error:', err);
        setError('Failed to load dashboard stats.');
      }
      setLoading(false);
    };

  const generateTransactionTrend = () => {
    // Mock data - in real implementation, fetch from database
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        transactions: Math.floor(Math.random() * 50) + 10,
        revenue: Math.floor(Math.random() * 500000) + 100000
      });
    }
    return data;
  };

  const generateRevenueData = () => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: Math.floor(Math.random() * 1000000) + 200000,
        withdrawals: Math.floor(Math.random() * 300000) + 50000
      });
    }
    return data;
  };

  const processBrandData = (brandData) => {
    const brandMap = {};
    brandData?.forEach(tx => {
      const brandName = tx.brand?.name || 'Unknown';
      brandMap[brandName] = (brandMap[brandName] || 0) + (Number(tx.total) || 0);
    });
    return Object.entries(brandMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

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
    console.log('getVariantName called with tx:', tx);
    console.log('tx.type:', tx.type);
    console.log('tx.sell_variant:', tx.sell_variant);
    console.log('tx.variant_name:', tx.variant_name);
    
    if (tx.type === "sell") {
      // For sell: use sell_variant.name with fallback to variant_name (matching mobile Transactions.js)
      const variantName = tx.sell_variant?.name || tx.variant_name || "-";
      console.log('Sell variant name:', variantName);
      return variantName;
    } else if (tx.type === "buy") {
      // For buy: use variant_name directly (matching mobile Transactions.js)
      const variantName = tx.variant_name || "-";
      console.log('Buy variant name:', variantName);
      return variantName;
    }
    return "-"
  }



  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}></div>
            <p className="mt-3 text-muted">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <div>{error}</div>
          <button className="btn btn-outline-danger btn-sm ms-auto" onClick={handleRefresh}>
            <i className="bi bi-arrow-clockwise"></i> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', width: '100%', overflowX: 'hidden', maxWidth: '100vw' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4" style={{ padding: '0 15px' }}>
        <div>
          <h2 className="mb-1 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>Dashboard</h2>
          <p className="text-muted mb-0" style={{ fontFamily: 'Inter, sans-serif' }}>
            Welcome back! Here's what's happening with your platform.
          </p>
        </div>
        <div className="d-flex gap-2">
          <select 
            className="form-select form-select-sm" 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            style={{ width: 'auto', fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button 
            className="btn btn-outline-primary btn-sm" 
            onClick={handleRefresh}
            style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
          >
            <i className="bi bi-arrow-clockwise me-1"></i> 
            Refresh
          </button>
        </div>
      </div>

      {/* Pending Actions Alert */}
      {(pendingActions.pendingWithdrawals > 0 || pendingActions.pendingTransactions > 0 || pendingActions.supportRequests > 0) && (
        <div style={{ padding: '0 15px', marginBottom: '1.5rem' }}>
          <div className="alert alert-warning alert-dismissible fade show" role="alert" style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}>
            <div className="d-flex align-items-center">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <div>
                <strong>Action Required:</strong> You have 
                {pendingActions.pendingWithdrawals > 0 && ` ${pendingActions.pendingWithdrawals} pending withdrawal${pendingActions.pendingWithdrawals > 1 ? 's' : ''} to approve`}
                {pendingActions.pendingTransactions > 0 && ` ${pendingActions.pendingTransactions} pending transaction${pendingActions.pendingTransactions > 1 ? 's' : ''} to process`}
                {pendingActions.supportRequests > 0 && ` ${pendingActions.supportRequests} support request${pendingActions.supportRequests > 1 ? 's' : ''} to review`}
                {' '}that require your attention.
              </div>
            </div>
            <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
          </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div style={{ padding: '0 15px', marginBottom: '2rem' }}>
        <QuickStats stats={stats} />
      </div>

      {/* Charts Row */}
      <div style={{ padding: '0 15px', marginBottom: '2rem' }}>
        <div className="row g-3">
          <div className="col-12 col-lg-8">
            <div className="card border shadow-sm h-100" style={{ backgroundColor: '#ffffff', borderRadius: '0' }}>
              <div className="card-header bg-light border-bottom">
                <h6 className="mb-0 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <i className="bi bi-graph-up me-2"></i>
                  Revenue & Transaction Trends
                </h6>
              </div>
              <div className="card-body p-3">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData.revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="withdrawals" stackId="1" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="col-12 col-lg-4">
            <div className="card border shadow-sm h-100" style={{ backgroundColor: '#ffffff', borderRadius: '0' }}>
              <div className="card-header bg-light border-bottom">
                <h6 className="mb-0 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <i className="bi bi-pie-chart me-2"></i>
                  Transaction Status
                </h6>
              </div>
              <div className="card-body p-3">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div style={{ padding: '0 15px', marginBottom: '2rem' }}>
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <div className="card border shadow-sm" style={{ backgroundColor: '#ffffff', borderRadius: '0' }}>
              <div className="card-header bg-light border-bottom">
                <h6 className="mb-0 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <i className="bi bi-trophy me-2"></i>
                  Top Performing Brands
                </h6>
              </div>
              <div className="card-body p-3">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData.brandPerformance} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="col-12 col-md-6">
            <div className="card border shadow-sm" style={{ backgroundColor: '#ffffff', borderRadius: '0' }}>
              <div className="card-header bg-light border-bottom">
                <h6 className="mb-0 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <i className="bi bi-calculator me-2"></i>
                  Transaction Summary
                </h6>
              </div>
              <div className="card-body p-3">
                <div className="row g-3">
                  <div className="col-6">
                    <div className="text-center p-3 bg-light" style={{ borderRadius: '0' }}>
                      <h4 className="text-success mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {formatCurrency(stats.totalBuyAmount || 0)}
                      </h4>
                      <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>Buy Amount</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center p-3 bg-light" style={{ borderRadius: '0' }}>
                      <h4 className="text-info mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {formatCurrency(stats.totalSellAmount || 0)}
                      </h4>
                      <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>Sell Amount</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center p-3 bg-light" style={{ borderRadius: '0' }}>
                      <h4 className="text-warning mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {stats.buyCount}
                      </h4>
                      <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>Buy Orders</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center p-3 bg-light" style={{ borderRadius: '0' }}>
                      <h4 className="text-primary mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {stats.sellCount}
                      </h4>
                      <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>Sell Orders</small>
                    </div>
            </div>
          </div>
        </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Tables */}
      <div style={{ padding: '0 15px' }}>
        <div className="card border shadow-sm" style={{ backgroundColor: '#ffffff', borderRadius: '0' }}>
          <div className="card-header bg-light border-bottom">
            <h6 className="mb-0 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
              <i className="bi bi-clock-history me-2"></i>
              Recent Activity
            </h6>
          </div>
            <div className="card-body p-0">
            {/* Tab Navigation */}
            <ul className="nav nav-tabs nav-tabs-custom" style={{ borderBottom: '1px solid #dee2e6' }}>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'transactions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('transactions')}
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    borderRadius: '0',
                    border: 'none',
                    padding: '12px 20px',
                    backgroundColor: activeTab === 'transactions' ? '#ffffff' : 'transparent',
                    color: activeTab === 'transactions' ? '#0d6efd' : '#6c757d',
                    borderBottom: activeTab === 'transactions' ? '2px solid #0d6efd' : 'none'
                  }}
                >
                  <i className="bi bi-credit-card me-2"></i>
                  Recent Transactions ({recentTxs.length})
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'withdrawals' ? 'active' : ''}`}
                  onClick={() => setActiveTab('withdrawals')}
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    borderRadius: '0',
                    border: 'none',
                    padding: '12px 20px',
                    backgroundColor: activeTab === 'withdrawals' ? '#ffffff' : 'transparent',
                    color: activeTab === 'withdrawals' ? '#0d6efd' : '#6c757d',
                    borderBottom: activeTab === 'withdrawals' ? '2px solid #0d6efd' : 'none'
                  }}
                >
                  <i className="bi bi-wallet2 me-2"></i>
                  Recent Withdrawals ({recentWithdrawals.length})
                </button>
              </li>
            </ul>

            {/* Tab Content */}
            <div className="tab-content">
              {/* Transactions Tab */}
              <div className={`tab-pane fade ${activeTab === 'transactions' ? 'show active' : ''}`}>
                <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                  <h6 className="mb-0 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Recent Transactions
                  </h6>
                  <a href="/transactions" className="btn btn-sm btn-outline-primary" style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}>
                    View All
                  </a>
                </div>
                <div className="table-container">
                  <table className="table table-hover mb-0" style={{ fontFamily: 'Inter, sans-serif', width: '100%', tableLayout: 'fixed' }}>
                    <thead className="table-light">
                      <tr>
                        <th className="px-3 py-3 fw-semibold text-start" style={{ width: '12%', fontFamily: 'Inter, sans-serif' }}>Date</th>
                        <th className="px-3 py-3 fw-semibold text-start" style={{ width: '8%', fontFamily: 'Inter, sans-serif' }}>Type</th>
                        <th className="px-3 py-3 fw-semibold text-start" style={{ width: '15%', fontFamily: 'Inter, sans-serif' }}>Brand</th>
                        <th className="px-3 py-3 fw-semibold text-start" style={{ width: '15%', fontFamily: 'Inter, sans-serif' }}>Variant</th>
                        <th className="px-3 py-3 fw-semibold text-start" style={{ width: '15%', fontFamily: 'Inter, sans-serif' }}>User</th>
                        <th className="px-3 py-3 fw-semibold text-start" style={{ width: '15%', fontFamily: 'Inter, sans-serif' }}>Amount</th>
                        <th className="px-3 py-3 fw-semibold text-start" style={{ width: '10%', fontFamily: 'Inter, sans-serif' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTxs.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-start py-5 text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                            <div className="text-center">
                              <i className="bi bi-inbox fs-1 text-muted mb-3 d-block"></i>
                              <h6 className="fw-bold">No recent transactions</h6>
                              <p className="mb-0">Transactions will appear here once they occur</p>
                            </div>
                          </td>
                        </tr>
                    ) : recentTxs.map(tx => (
                        <tr key={tx.id} className="border-bottom">
                          <td className="px-3 py-3 text-start">
                            <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {formatDate(tx.created_at)}
                            </small>
                          </td>
                          <td className="px-3 py-3 text-start">
                            <span className={`badge bg-${tx.type === 'sell' ? 'success' : 'primary'}`} style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}>
                              {tx.type === 'sell' ? 'Sell' : 'Buy'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-start">
                            <div className="fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {getBrandName(tx)}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-start">
                            <div className="fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {getVariantName(tx)}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-start">
                            <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {tx.user?.email || '-'}
                            </small>
                          </td>
                          <td className="px-3 py-3 text-start">
                            <div className="fw-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {formatCurrency(tx.total || tx.amount)}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-start">
                            <span className={`badge bg-${tx.status === 'completed' ? 'success' : tx.status === 'pending' ? 'warning' : 'danger'}`} style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}>
                              {tx.status}
                            </span>
                          </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

              {/* Withdrawals Tab */}
              <div className={`tab-pane fade ${activeTab === 'withdrawals' ? 'show active' : ''}`}>
                <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                  <h6 className="mb-0 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Recent Withdrawals
                  </h6>
                  <a href="/withdrawals" className="btn btn-sm btn-outline-primary" style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}>
                    View All
                  </a>
          </div>
                <div className="table-container">
                  <table className="table table-hover mb-0" style={{ fontFamily: 'Inter, sans-serif', width: '100%', tableLayout: 'fixed' }}>
                    <thead className="table-light">
                      <tr>
                        <th className="px-3 py-3 fw-semibold text-start" style={{ width: '25%', fontFamily: 'Inter, sans-serif' }}>Date</th>
                        <th className="px-3 py-3 fw-semibold text-start" style={{ width: '25%', fontFamily: 'Inter, sans-serif' }}>User</th>
                        <th className="px-3 py-3 fw-semibold text-start" style={{ width: '25%', fontFamily: 'Inter, sans-serif' }}>Amount</th>
                        <th className="px-3 py-3 fw-semibold text-start" style={{ width: '25%', fontFamily: 'Inter, sans-serif' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentWithdrawals.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-start py-5 text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                            <div className="text-center">
                              <i className="bi bi-wallet2 fs-1 text-muted mb-3 d-block"></i>
                              <h6 className="fw-bold">No recent withdrawals</h6>
                              <p className="mb-0">Withdrawals will appear here once they occur</p>
                            </div>
                          </td>
                        </tr>
                    ) : recentWithdrawals.map(w => (
                        <tr key={w.id} className="border-bottom">
                          <td className="px-3 py-3 text-start">
                            <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {formatDate(w.created_at)}
                            </small>
                          </td>
                          <td className="px-3 py-3 text-start">
                            <div className="fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {w.user?.full_name || 'N/A'}
                            </div>
                            <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {w.user?.email || '-'}
                            </small>
                          </td>
                          <td className="px-3 py-3 text-start">
                            <div className="fw-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {formatCurrency(w.amount)}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-start">
                            <span className={`badge bg-${w.status === 'completed' ? 'success' : w.status === 'pending' ? 'warning' : 'danger'}`} style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}>
                              {w.status}
                            </span>
                          </td>
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
    </div>
  );
};

export default Dashboard; 