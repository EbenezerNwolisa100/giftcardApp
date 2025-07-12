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
      .select('id, user_id, message, conversation, status, created_at')
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
      <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16, background: '#f5f6fa', borderRadius: 8, padding: 12 }}>
        {chat.map((msg, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: msg.sender === 'admin' ? 'row-reverse' : 'row', marginBottom: 10 }}>
            <div style={{
              background: msg.sender === 'admin' ? '#0984e3' : '#fff',
              color: msg.sender === 'admin' ? '#fff' : '#2d3436',
              borderRadius: 16,
              padding: '10px 16px',
              maxWidth: '70%',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              marginLeft: msg.sender === 'admin' ? 0 : 8,
              marginRight: msg.sender === 'admin' ? 8 : 0
            }}>
              <div style={{ fontSize: 15 }}>{msg.text}</div>
              <div style={{ fontSize: 11, color: msg.sender === 'admin' ? '#dfe6e9' : '#636e72', marginTop: 4, textAlign: msg.sender === 'admin' ? 'right' : 'left' }}>
                {new Date(msg.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: 32 }}>
      <h2>Support Requests</h2>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
          <thead>
            <tr style={{ background: '#f5f6fa' }}>
              <th style={th}>User ID</th>
              <th style={th}>Status</th>
              <th style={th}>Created At</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.id} style={{ background: req.status === 'open' ? '#fffbe6' : '#fff' }}>
                <td style={td}>{req.user_id}</td>
                <td style={td}>{req.status}</td>
                <td style={td}>{new Date(req.created_at).toLocaleString()}</td>
                <td style={td}>
                  <button onClick={() => openModal(req)} style={{ padding: '4px 12px' }}>View/Reply</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal for chat/reply */}
      {modalOpen && selected && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h3>Conversation</h3>
            <p><b>User ID:</b> {selected.user_id}</p>
            {renderChat(selected.conversation, selected.message, selected.created_at)}
            <div style={{ margin: '12px 0' }}>
              <label>Status: </label>
              <select value={status} onChange={e => setStatus(e.target.value)}>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <textarea
              rows={3}
              style={{ width: '100%', margin: '8px 0', padding: 8 }}
              value={newReply}
              onChange={e => setNewReply(e.target.value)}
              placeholder="Type your reply here..."
            />
            <button onClick={handleSendReply} disabled={saving || !newReply.trim()} style={{ marginRight: 12 }}>
              {saving ? 'Sending...' : 'Send Reply'}
            </button>
            <button onClick={() => setModalOpen(false)} disabled={saving}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const th = { border: '1px solid #e0e0e0', padding: 8, textAlign: 'left' };
const td = { border: '1px solid #e0e0e0', padding: 8, verticalAlign: 'top' };

const modalOverlay = {
  position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
  background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};
const modalBox = {
  background: '#fff', borderRadius: 8, padding: 24, minWidth: 350, maxWidth: 500, boxShadow: '0 2px 16px rgba(0,0,0,0.15)'
}; 