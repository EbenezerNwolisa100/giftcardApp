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
import './App.css';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [checkingRole, setCheckingRole] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Toggle sidebar for mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!session) {
    return (
      <Router>
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={
            <div className="min-vh-100 d-flex align-items-center justify-content-center" 
                 style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
              <div className="container">
                <div className="row justify-content-center">
                  <div className="col-md-6 col-lg-4">
                    <div className="card shadow-lg border-0 rounded-3">
                      <div className="card-body p-5">
                        <div className="text-center mb-4">
                          <div className="d-inline-flex align-items-center justify-content-center bg-primary rounded-circle mb-3" 
                               style={{width: '60px', height: '60px'}}>
                            <i className="bi bi-shield-lock text-white fs-4"></i>
                          </div>
                          <h3 className="fw-bold text-dark mb-2">GiftYard Admin</h3>
                          <p className="text-muted">Access your admin dashboard</p>
                        </div>
                        
                        <form onSubmit={handleLogin}>
                          <div className="mb-3">
                            <label htmlFor="email" className="form-label fw-semibold text-dark">
                              Email Address
                            </label>
                            <input
                              type="email"
                              className="form-control form-control-lg border-2"
                              id="email"
                              value={email}
                              onChange={e => setEmail(e.target.value)}
                              required
                              autoFocus
                              placeholder="Enter your email"
                            />
                          </div>
                          
                          <div className="mb-4">
                            <label htmlFor="password" className="form-label fw-semibold text-dark">
                              Password
                            </label>
                            <input
                              type="password"
                              className="form-control form-control-lg border-2"
                              id="password"
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                              required
                              placeholder="Enter your password"
                            />
                          </div>
                          
                          {error && (
                            <div className="alert alert-danger border-0 rounded-3 mb-4">
                              <i className="bi bi-exclamation-triangle me-2"></i>
                              {error}
                            </div>
                          )}
                          
                          <button
                            type="submit"
                            disabled={loading || checkingRole}
                            className="btn btn-primary btn-lg w-100 rounded-3 fw-semibold"
                          >
                            {(loading || checkingRole) ? (
                              <div className="d-flex align-items-center justify-content-center">
                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                                Logging in...
                              </div>
                            ) : (
                              'Sign In'
                            )}
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          } />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="d-flex vh-100">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        
        {/* Main Content */}
        <div className="flex-grow-1 d-flex flex-column main-content">
          <Header handleLogout={handleLogout} toggleSidebar={toggleSidebar} />
          <main className="flex-grow-1 overflow-auto" style={{ 
            marginTop: '70px', 
            padding: '1rem'
          }}>
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