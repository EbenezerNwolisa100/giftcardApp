import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [bank, setBank] = useState({ bank_name: '', account_number: '', account_name: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError('');
      try {
        const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', id).single();
        if (profileError) throw profileError;
        setProfile(profileData);
        const { data: bankData } = await supabase.from('user_banks').select('*').eq('user_id', id).single();
        if (bankData) setBank(bankData);
      } catch {
        setError('Failed to load user.');
      }
      setLoading(false);
    };
    fetchUser();
  }, [id]);

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };
  const handleBankChange = (field, value) => {
    setBank(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      // Update profile
      const { error: profileError } = await supabase.from('profiles').update({
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role,
        balance: profile.balance,
      }).eq('id', id);
      if (profileError) throw profileError;
      // Upsert bank
      if (bank.bank_name && bank.account_number && bank.account_name) {
        const { error: bankError } = await supabase.from('user_banks').upsert({
          user_id: id,
          bank_name: bank.bank_name,
          account_number: bank.account_number,
          account_name: bank.account_name,
        });
        if (bankError) throw bankError;
      }
      setSuccess('User updated successfully!');
      setTimeout(() => navigate('/users'), 1200);
    } catch {
      setError('Failed to update user.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="text-start py-5" style={{ padding: '0 15px' }}>
        <div className="spinner-border text-primary" role="status"></div>
        <span className="ms-2">Loading user data...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="alert alert-danger my-4" style={{ margin: '0 15px' }}>
        {error}
      </div>
    );
  }
  
  if (!profile) return null;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4" style={{ padding: '0 15px' }}>
        <div>
          <h2 className="mb-1 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>Edit User</h2>
          <p className="text-muted mb-0" style={{ fontFamily: 'Inter, sans-serif' }}>
            Update user information and bank details
          </p>
        </div>
        <button 
          type="button" 
          className="btn btn-outline-secondary" 
          onClick={() => navigate('/users')}
          style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back to Users
        </button>
      </div>

      {/* Form */}
      <div style={{ padding: '0 15px' }}>
        <div className="card border shadow-sm" style={{ backgroundColor: '#ffffff', borderRadius: '0' }}>
          <div className="card-body p-4">
            <form onSubmit={handleSave}>
              <div className="row">
                {/* Profile Information */}
                <div className="col-md-6">
                  <h5 className="fw-bold mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <i className="bi bi-person me-2"></i>
                    Profile Information
                  </h5>
                  
                  <div className="mb-3">
                    <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Full Name
                    </label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={profile.full_name || ''} 
                      onChange={e => handleChange('full_name', e.target.value)} 
                      required 
                      style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      className="form-control" 
                      value={profile.email || ''} 
                      onChange={e => handleChange('email', e.target.value)} 
                      required 
                      style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Role
                    </label>
                    <select 
                      className="form-select" 
                      value={profile.role} 
                      onChange={e => handleChange('role', e.target.value)}
                      style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Balance (₦)
                    </label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={profile.balance || 0} 
                      onChange={e => handleChange('balance', e.target.value)} 
                      min={0} 
                      style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                    />
                  </div>
                </div>

                {/* Bank Information */}
                <div className="col-md-6">
                  <h5 className="fw-bold mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <i className="bi bi-bank me-2"></i>
                    Bank Information
                  </h5>
                  
                  <div className="mb-3">
                    <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Bank Name
                    </label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={bank.bank_name || ''} 
                      onChange={e => handleBankChange('bank_name', e.target.value)} 
                      placeholder="e.g., Access Bank"
                      style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Account Number
                    </label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={bank.account_number || ''} 
                      onChange={e => handleBankChange('account_number', e.target.value)} 
                      placeholder="e.g., 0123456789"
                      style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Account Name
                    </label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={bank.account_name || ''} 
                      onChange={e => handleBankChange('account_name', e.target.value)} 
                      placeholder="e.g., John Doe"
                      style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                    />
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {error && (
                <div className="alert alert-danger py-2 mt-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}
              {success && (
                <div className="alert alert-success py-2 mt-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <i className="bi bi-check-circle me-2"></i>
                  {success}
                </div>
              )}

              {/* Action Buttons */}
              <div className="d-flex gap-2 mt-4 pt-3 border-top">
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={saving}
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                >
                  {saving ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-2"></i>
                      Save Changes
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline-secondary" 
                  onClick={() => navigate('/users')}
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUser; 