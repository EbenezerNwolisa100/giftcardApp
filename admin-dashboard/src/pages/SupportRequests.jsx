import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function SupportRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [newReply, setNewReply] = useState('');
  const [status, setStatus] = useState('open');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setLoading(true);
    setError('');
    const { data, error } = await supabase
      .from('support_requests')
      .select(`
        id, user_id, message, conversation, status, created_at,
        user:profiles(full_name, email)
      `)
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    setRequests(data || []);
    setLoading(false);
  }

  function openModal(request) {
    setSelected(request);
    setStatus(request.status || 'open');
    setModalOpen(true);
    setNewReply('');
  }

  async function handleSendReply() {
    if (!newReply.trim()) return;
    setSaving(true);
    // Append new admin reply to conversation array
    const conversation = Array.isArray(selected.conversation) ? [...selected.conversation] : [];
    conversation.push({ sender: 'admin', text: newReply, timestamp: new Date().toISOString() });
    const { error } = await supabase
      .from('support_requests')
      .update({ conversation, status })
      .eq('id', selected.id);
    // Insert notification for the user
    await supabase.from('notifications').insert({ user_id: selected.user_id, title: 'Support Reply', body: newReply });
    setSaving(false);
    if (error) {
      alert('Failed to update: ' + error.message);
      return;
    }
    setModalOpen(false);
    fetchRequests();
  }

  function renderChat(conversation, userMessage, createdAt) {
    const chat = [
      { sender: 'user', text: userMessage, timestamp: createdAt },
      ...(Array.isArray(conversation) ? conversation : [])
    ];
    return (
      <div style={{ 
        maxHeight: 300, 
        overflowY: 'auto', 
        marginBottom: 16, 
        background: '#f8f9fa', 
        borderRadius: '0', 
        padding: 16,
        fontFamily: 'Inter, sans-serif'
      }}>
        {chat.map((msg, idx) => (
          <div key={idx} style={{ 
            display: 'flex', 
            flexDirection: msg.sender === 'admin' ? 'row-reverse' : 'row', 
            marginBottom: 12 
          }}>
            <div style={{
              background: msg.sender === 'admin' ? '#0d6efd' : '#ffffff',
              color: msg.sender === 'admin' ? '#ffffff' : '#212529',
              borderRadius: '0',
              padding: '12px 16px',
              maxWidth: '70%',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginLeft: msg.sender === 'admin' ? 0 : 8,
              marginRight: msg.sender === 'admin' ? 8 : 0,
              border: msg.sender === 'admin' ? 'none' : '1px solid #dee2e6'
            }}>
              <div style={{ fontSize: 14, fontFamily: 'Inter, sans-serif' }}>{msg.text}</div>
              <div style={{ 
                fontSize: 11, 
                color: msg.sender === 'admin' ? '#e9ecef' : '#6c757d', 
                marginTop: 6, 
                textAlign: msg.sender === 'admin' ? 'right' : 'left',
                fontFamily: 'Inter, sans-serif'
              }}>
                {new Date(msg.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { color: 'warning', text: 'Open' },
      closed: { color: 'success', text: 'Closed' },
      pending: { color: 'info', text: 'Pending' }
    };
    const config = statusConfig[status] || { color: 'secondary', text: status };
    return (
      <span className={`badge bg-${config.color}`} style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}>
        {config.text}
      </span>
    );
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', width: '100%', overflowX: 'hidden', maxWidth: '100vw' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4" style={{ padding: '0 15px' }}>
        <div>
          <h2 className="mb-1 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>Support Requests</h2>
          <p className="text-muted mb-0" style={{ fontFamily: 'Inter, sans-serif' }}>
            Manage and respond to user support requests
          </p>
        </div>
      </div>

      {/* Support Requests Table */}
      {loading ? (
        <div className="text-start py-5" style={{ padding: '0 15px' }}>
          <div className="spinner-border text-primary" role="status"></div>
          <span className="ms-2">Loading support requests...</span>
        </div>
      ) : error ? (
        <div style={{ padding: '0 15px' }}>
          <div className="alert alert-danger py-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        </div>
      ) : (
        <div style={{ padding: '0 15px' }}>
          <div className="card border shadow-sm" style={{ backgroundColor: '#ffffff', borderRadius: '0' }}>
            <div className="card-header bg-light border-bottom d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                <i className="bi bi-headset me-2"></i>
                Support Requests ({requests.length})
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="table-container">
                <table className="table table-hover mb-0" style={{ fontFamily: 'Inter, sans-serif', width: '100%', tableLayout: 'fixed' }}>
                  <thead className="table-light">
                    <tr>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '25%', fontFamily: 'Inter, sans-serif' }}>User</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '15%', fontFamily: 'Inter, sans-serif' }}>Status</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '20%', fontFamily: 'Inter, sans-serif' }}>Created At</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '25%', fontFamily: 'Inter, sans-serif' }}>Message Preview</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '15%', fontFamily: 'Inter, sans-serif' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-start py-5 text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <div className="text-center">
                            <i className="bi bi-headset fs-1 text-muted mb-3 d-block"></i>
                            <h6 className="fw-bold">No support requests found</h6>
                            <p className="mb-0">Support requests will appear here when users submit them</p>
                          </div>
                        </td>
                      </tr>
                    ) : requests.map(req => (
                      <tr key={req.id} className={`border-bottom ${req.status === 'open' ? 'table-warning' : ''}`}>
                        <td className="px-3 py-3 text-start">
                          <div className="fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {req.user?.full_name || 'N/A'}
                          </div>
                          <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {req.user?.email || req.user_id}
                          </small>
                        </td>
                        <td className="px-3 py-3 text-start">
                          {getStatusBadge(req.status)}
                        </td>
                        <td className="px-3 py-3 text-start">
                          <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {new Date(req.created_at).toLocaleString()}
                          </small>
                        </td>
                        <td className="px-3 py-3 text-start">
                          <div className="text-truncate" style={{ maxWidth: '200px', fontFamily: 'Inter, sans-serif' }}>
                            {req.message}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-start">
                          <button 
                            onClick={() => openModal(req)} 
                            className="btn btn-sm btn-outline-primary"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                          >
                            <i className="bi bi-chat-dots me-1"></i>
                            View/Reply
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

      {/* Modal for chat/reply */}
      {modalOpen && selected && (
        <div style={{
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh',
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1050
        }}>
          <div style={{
            background: '#fff', 
            borderRadius: '0', 
            padding: 0, 
            minWidth: 400, 
            maxWidth: 600, 
            maxHeight: '90vh',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            fontFamily: 'Inter, sans-serif',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div className="card-header bg-light border-bottom p-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <i className="bi bi-chat-dots me-2"></i>
                  Support Conversation
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                ></button>
              </div>
              <div className="mt-2">
                <strong style={{ fontFamily: 'Inter, sans-serif' }}>User:</strong> {selected.user?.full_name || 'N/A'}
                <br />
                <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {selected.user?.email || selected.user_id}
                </small>
              </div>
            </div>

            {/* Modal Body */}
            <div className="card-body p-3" style={{ flex: 1, overflowY: 'auto' }}>
              {renderChat(selected.conversation, selected.message, selected.created_at)}
            </div>

            {/* Modal Footer */}
            <div className="card-footer border-top p-3">
              <div className="mb-3">
                <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Status:
                </label>
                <select 
                  value={status} 
                  onChange={e => setStatus(e.target.value)}
                  className="form-select"
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              
              <div className="mb-3">
                <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Reply Message:
                </label>
                <textarea
                  rows={3}
                  className="form-control"
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                  value={newReply}
                  onChange={e => setNewReply(e.target.value)}
                  placeholder="Type your reply here..."
                  disabled={saving}
                />
              </div>
              
              <div className="d-flex gap-2">
                <button 
                  onClick={handleSendReply} 
                  disabled={saving || !newReply.trim()} 
                  className="btn btn-primary"
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                >
                  {saving ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send me-2"></i>
                      Send Reply
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setModalOpen(false)} 
                  disabled={saving}
                  className="btn btn-outline-secondary"
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 