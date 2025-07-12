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

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>;
  if (error) return <div className="alert alert-danger my-4">{error}</div>;
  if (!profile) return null;

  return (
    <div className="container py-4" style={{ maxWidth: 600 }}>
      <h2 className="mb-4">Edit User</h2>
      <form onSubmit={handleSave}>
        <div className="mb-3">
          <label className="form-label">Full Name</label>
          <input type="text" className="form-control" value={profile.full_name || ''} onChange={e => handleChange('full_name', e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input type="email" className="form-control" value={profile.email || ''} onChange={e => handleChange('email', e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Role</label>
          <select className="form-select" value={profile.role} onChange={e => handleChange('role', e.target.value)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Balance</label>
          <input type="number" className="form-control" value={profile.balance || 0} onChange={e => handleChange('balance', e.target.value)} min={0} />
        </div>
        <div className="mb-3">
          <label className="form-label">Bank Name</label>
          <input type="text" className="form-control" value={bank.bank_name || ''} onChange={e => handleBankChange('bank_name', e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">Account Number</label>
          <input type="text" className="form-control" value={bank.account_number || ''} onChange={e => handleBankChange('account_number', e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">Account Name</label>
          <input type="text" className="form-control" value={bank.account_name || ''} onChange={e => handleBankChange('account_name', e.target.value)} />
        </div>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        {success && <div className="alert alert-success py-2">{success}</div>}
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/users')}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default EditUser; 