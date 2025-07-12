import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const GiftcardInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ brand_name: '', value: '', code: '', image_file: null });
  const [adding, setAdding] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ brand_name: '', value: '', code: '', image_file: null, image_url: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('giftcard_inventory')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInventory(data || []);
    } catch {
      setError('Failed to load inventory.');
    }
    setLoading(false);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setForm(prev => ({ ...prev, image_file: e.target.files[0] }));
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.brand_name || !form.value || !form.code) return;
    setAdding(true);
    setError('');
    setSuccess('');
    let imageUrl = '';
    try {
      if (form.image_file) {
        const ext = form.image_file.name.split('.').pop();
        const fileName = `inventory_${Date.now()}_${Math.random().toString(36).substring(2,8)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('giftcard-inventory-images').upload(fileName, form.image_file, { contentType: form.image_file.type });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('giftcard-inventory-images').getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }
      const { error } = await supabase.from('giftcard_inventory').insert({
        brand_name: form.brand_name.trim(),
        value: Number(form.value),
        code: form.code.trim(),
        image_url: imageUrl || null,
      });
      if (error) throw error;
      setSuccess('Gift card code added!');
      setForm({ brand_name: '', value: '', code: '', image_file: null });
      fetchInventory();
    } catch (err) {
      setError('Failed to add code. ' + (err?.message || ''));
    }
    setAdding(false);
  };

  const handleEditFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setEditForm(prev => ({ ...prev, image_file: e.target.files[0] }));
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>
      <h2 className="mb-4">Gift Card Inventory</h2>
      <form className="mb-4 row g-2 align-items-end" onSubmit={handleAdd}>
        <div className="col-md-3">
          <label className="form-label">Brand Name</label>
          <input type="text" className="form-control" value={form.brand_name} onChange={e => handleFormChange('brand_name', e.target.value)} required />
        </div>
        <div className="col-md-2">
          <label className="form-label">Value (USD)</label>
          <input type="number" className="form-control" value={form.value} onChange={e => handleFormChange('value', e.target.value)} required min={0} />
        </div>
        <div className="col-md-4">
          <label className="form-label">Gift Card Code</label>
          <input type="text" className="form-control" value={form.code} onChange={e => handleFormChange('code', e.target.value)} required />
        </div>
        <div className="col-md-3">
          <label className="form-label">Image (optional)</label>
          <input type="file" accept="image/*" className="form-control" onChange={handleFileChange} />
        </div>
        <div className="col-12">
          <button className="btn btn-primary" type="submit" disabled={adding}>{adding ? 'Adding...' : 'Add Giftcard'}</button>
        </div>
      </form>
      {error && <div className="alert alert-danger py-2">{error}</div>}
      {success && <div className="alert alert-success py-2">{success}</div>}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover table-sm align-middle">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Value</th>
                <th>Code</th>
                <th>Image</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 ? (
                <tr><td colSpan="6" className="text-center">No inventory found</td></tr>
              ) : inventory.map(item => (
                <tr key={item.id}>
                  <td>{item.brand_name || '-'}</td>
                  <td>${item.value}</td>
                  <td>{item.code.slice(0, 4) + '****'}</td>
                  <td>{item.image_url ? <img src={item.image_url} alt="Gift Card" style={{ maxWidth: 60, maxHeight: 30 }} /> : '-'}</td>
                  <td>{item.created_at ? new Date(item.created_at).toLocaleString() : '-'}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => {
                      setEditingItem(item);
                      setEditForm({ brand_name: item.brand_name, value: item.value, code: item.code, image_url: item.image_url || '', image_file: null });
                      setSuccess(''); setError('');
                    }}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => setDeletingId(item.id)} disabled={deleteLoading}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Edit Modal */}
      {editingItem && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Gift Card Code</h5>
                <button type="button" className="btn-close" onClick={() => setEditingItem(null)}></button>
              </div>
              <form onSubmit={async e => {
                e.preventDefault();
                setEditLoading(true);
                setError(''); setSuccess('');
                let newImageUrl = editForm.image_url;
                if (editForm.image_file) {
                  const ext = editForm.image_file.name.split('.').pop();
                  const fileName = `inventory_${Date.now()}_${Math.random().toString(36).substring(2,8)}.${ext}`;
                  const { error: uploadError } = await supabase.storage.from('giftcard-inventory-images').upload(fileName, editForm.image_file, { contentType: editForm.image_file.type });
                  if (uploadError) throw uploadError;
                  const { data: publicUrlData } = supabase.storage.from('giftcard-inventory-images').getPublicUrl(fileName);
                  newImageUrl = publicUrlData.publicUrl;
                }
                try {
                  const { error } = await supabase.from('giftcard_inventory').update({
                    brand_name: editForm.brand_name.trim(),
                    value: Number(editForm.value),
                    code: editForm.code.trim(),
                    image_url: newImageUrl || null,
                  }).eq('id', editingItem.id);
                  if (error) throw error;
                  setSuccess('Gift card updated!');
                  setEditingItem(null);
                  fetchInventory();
                } catch (err) {
                  setError('Failed to update code. ' + (err?.message || ''));
                }
                setEditLoading(false);
              }}>
                <div className="modal-body">
                  <div className="mb-2">
                    <label className="form-label">Brand Name</label>
                    <input type="text" className="form-control" value={editForm.brand_name} onChange={e => setEditForm(f => ({ ...f, brand_name: e.target.value }))} required />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Value (USD)</label>
                    <input type="number" className="form-control" value={editForm.value} onChange={e => setEditForm(f => ({ ...f, value: e.target.value }))} required min={0} />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Gift Card Code</label>
                    <input type="text" className="form-control" value={editForm.code} onChange={e => setEditForm(f => ({ ...f, code: e.target.value }))} required />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Image (optional)</label>
                    <input type="file" accept="image/*" className="form-control" onChange={handleEditFileChange} />
                    {(editForm.image_file || editForm.image_url) && (
                      <img src={editForm.image_file ? URL.createObjectURL(editForm.image_file) : editForm.image_url} alt="Preview" style={{ maxWidth: 60, maxHeight: 30, marginTop: 4 }} />
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditingItem(null)} disabled={editLoading}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Delete confirmation modal */}
      {deletingId && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete Gift Card</h5>
                <button type="button" className="btn-close" onClick={() => setDeletingId(null)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this gift card? This cannot be undone.</p>
                <div className="d-flex gap-2">
                  <button className="btn btn-danger" onClick={async () => {
                    setDeleteLoading(true);
                    setError(''); setSuccess('');
                    try {
                      const { error } = await supabase.from('giftcard_inventory').delete().eq('id', deletingId);
                      if (error) throw error;
                      setSuccess('Gift card deleted!');
                      setDeletingId(null);
                      fetchInventory();
                    } catch (err) {
                      setError('Failed to delete gift card. ' + (err?.message || ''));
                    }
                    setDeleteLoading(false);
                  }} disabled={deleteLoading}>{deleteLoading ? 'Deleting...' : 'Delete'}</button>
                  <button className="btn btn-secondary" onClick={() => setDeletingId(null)} disabled={deleteLoading}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GiftcardInventory; 