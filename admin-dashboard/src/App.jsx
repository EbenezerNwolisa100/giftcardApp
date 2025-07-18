import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Transactions from './pages/Transactions';
import WalletTransactions from './pages/WalletTransactions';
import Withdrawals from './pages/Withdrawals';
import ResetPassword from './pages/ResetPassword';
import EditUser from './pages/EditUser';
import GiftcardCategories from './pages/GiftcardCategories';
import GiftcardBrands from './pages/GiftcardBrands';
import GiftcardInventory from './pages/GiftcardInventory';
import SupportRequests from './pages/SupportRequests';
import BankDetails from './pages/BankDetails';
import Settings from './pages/Settings'

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [checkingRole, setCheckingRole] = useState(false);

  // Handle login form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    // 1. Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSession(data.session);
    setCheckingRole(true);

    // 2. Fetch the user's profile and check the role
    const userId = data.session.user.id;
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    setCheckingRole(false);

    if (profileError || !profile || profile.role !== 'admin') {
      setError('Access denied: You are not an admin.');
      setSession(null);
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setEmail('');
    setPassword('');
    setError('');
  };

  if (!session) {
    return (
      <Router>
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={
            <div className="container d-flex align-items-center justify-content-center min-vh-100">
              <div className="card p-4 shadow" style={{ minWidth: 350 }}>
                <h2 className="mb-4 text-center">Admin Login</h2>
                <form onSubmit={handleLogin}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email address</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading || checkingRole}
                  >
                    {(loading || checkingRole) ? 'Logging in...' : 'Login'}
                  </button>
                </form>
              </div>
            </div>
          } />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="d-flex">
        {/* Sidebar for md+ screens */}
        <div className="d-none d-md-block">
          <Sidebar />
        </div>
        <div className="flex-grow-1" style={{marginLeft: 220}}>
          <Header handleLogout={handleLogout} />
          <main>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/wallet-transactions" element={<WalletTransactions />} />
              <Route path="/withdrawals" element={<Withdrawals />} />
              <Route path="/users/:id/edit" element={<EditUser />} />
              <Route path="/giftcard-categories" element={<GiftcardCategories />} />
              <Route path="/giftcard-brands" element={<GiftcardBrands />} />
              <Route path="/giftcard-inventory" element={<GiftcardInventory />} />
              <Route path="/support-requests" element={<SupportRequests />} />
              <Route path="/bank-details" element={<BankDetails />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;