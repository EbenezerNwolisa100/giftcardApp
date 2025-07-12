import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const GiftcardBrands = () => {
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', buy_rate: '', sell_rate: '', image_url: '', category_id: '' });
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', buy_rate: '', sell_rate: '', image_url: '', category_id: '' });
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);

  useEffect(() => {
    fetchBrands();
    fetchCategories();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: brandsData, error } = await supabase.from('giftcard_brands').select('id, name, buy_rate, sell_rate, image_url, category_id');
      if (error) throw error;
      setBrands(brandsData || []);
    } catch {
      setError('Failed to load brands.');
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('giftcard_categories').select('id, name');
    if (!error) setCategories(data || []);
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setForm(prev => ({ ...prev, image_url: '' })); // Clear URL field
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.buy_rate || !form.sell_rate || !form.category_id) return;
    setAdding(true);
    setError('');
    setSuccess('');
    let imageUrl = '';
    try {
      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const fileName = `brand_${Date.now()}_${Math.random().toString(36).substring(2,8)}.${ext}`;
        const { error } = await supabase.storage.from('giftcard-brand-images').upload(fileName, imageFile, { contentType: imageFile.type });
        if (error) throw error;
        const { data: publicUrlData } = supabase.storage.from('giftcard-brand-images').getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      } else if (form.image_url) {
        imageUrl = form.image_url.trim();
      }
      const { error } = await supabase.from('giftcard_brands').insert({
        name: form.name.trim(),
        buy_rate: Number(form.buy_rate),
        sell_rate: Number(form.sell_rate),
        image_url: imageUrl,
        category_id: form.category_id
      });
      if (error) throw error;
      setSuccess('Brand added!');
      setForm({ name: '', buy_rate: '', sell_rate: '', image_url: '', category_id: '' });
      setImageFile(null);
      fetchBrands();
    } catch (err) {
      setError('Failed to add brand. ' + (err?.message || ''));
    }
    setAdding(false);
  };

  const startEdit = (brand) => {
    setEditingId(brand.id);
    setEditForm({
      name: brand.name,
      buy_rate: brand.buy_rate,
      sell_rate: brand.sell_rate,
      image_url: brand.image_url || '',
      category_id: brand.category_id || ''
    });
    setSuccess('');
    setError('');
  };

  const handleEditChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleEditFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setEditImageFile(e.target.files[0]);
      setEditForm(prev => ({ ...prev, image_url: '' })); // Clear URL field
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.buy_rate || !editForm.sell_rate || !editForm.category_id) return;
    setAdding(true);
    setError('');
    setSuccess('');
    let imageUrl = editForm.image_url;
    try {
      if (editImageFile) {
        const ext = editImageFile.name.split('.').pop();
        const fileName = `brand_${Date.now()}_${Math.random().toString(36).substring(2,8)}.${ext}`;
        const { error } = await supabase.storage.from('giftcard-brand-images').upload(fileName, editImageFile, { contentType: editImageFile.type });
        if (error) throw error;
        const { data: publicUrlData } = supabase.storage.from('giftcard-brand-images').getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }
      const { error } = await supabase.from('giftcard_brands').update({
        name: editForm.name.trim(),
        buy_rate: Number(editForm.buy_rate),
        sell_rate: Number(editForm.sell_rate),
        image_url: imageUrl,
        category_id: editForm.category_id
      }).eq('id', editingId);
      if (error) throw error;
      setSuccess('Brand updated!');
      setEditingId(null);
      setEditForm({ name: '', buy_rate: '', sell_rate: '', image_url: '', category_id: '' });
      setEditImageFile(null);
      fetchBrands();
    } catch (err) {
      setError('Failed to update brand. ' + (err?.message || ''));
    }
    setAdding(false);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    setError('');
    setSuccess('');
    try {
      const { error } = await supabase.from('giftcard_brands').delete().eq('id', deletingId);
      if (error) throw error;
      setSuccess('Brand deleted!');
      setDeletingId(null);
      fetchBrands();
    } catch {
      setError('Failed to delete brand.');
    }
    setDeleteLoading(false);
  };

  return (
    <div className="container py-4" style={{ maxWidth: 900 }}>
      <h2 className="mb-4">Gift Card Brands</h2>
      <form className="mb-4 row g-2 align-items-end" onSubmit={handleAdd}>
        <div className="col-md-3">
          <label className="form-label">Name</label>
          <input type="text" className="form-control" value={form.name} onChange={e => handleFormChange('name', e.target.value)} required />
        </div>
        <div className="col-md-2">
          <label className="form-label">Buy Rate</label>
          <input type="number" className="form-control" value={form.buy_rate} onChange={e => handleFormChange('buy_rate', e.target.value)} required min={0} />
        </div>
        <div className="col-md-2">
          <label className="form-label">Sell Rate</label>
          <input type="number" className="form-control" value={form.sell_rate} onChange={e => handleFormChange('sell_rate', e.target.value)} required min={0} />
        </div>
        <div className="col-md-3">
          <label className="form-label">Category</label>
          <select className="form-select" value={form.category_id} onChange={e => handleFormChange('category_id', e.target.value)} required>
            <option value="">Select category</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
        </div>
        <div className="col-md-2">
          <label className="form-label">Image</label>
          <input type="file" accept="image/*" className="form-control" onChange={handleFileChange} />
          {imageFile && (
            <img src={URL.createObjectURL(imageFile)} alt="Preview" style={{ maxWidth: 60, maxHeight: 30, marginTop: 4 }} />
          )}
        </div>
        <div className="col-12">
          <button className="btn btn-primary" type="submit" disabled={adding}>{adding ? 'Adding...' : 'Add Brand'}</button>
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
                <th>Name</th>
                <th>Buy Rate</th>
                <th>Sell Rate</th>
                <th>Category</th>
                <th>Image</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {brands.length === 0 ? (
                <tr><td colSpan="6" className="text-center">No brands found</td></tr>
              ) : brands.map(brand => (
                <tr key={brand.id}>
                  <td>
                    {editingId === brand.id ? (
                      <form className="d-flex gap-2" onSubmit={handleEdit}>
                        <input type="text" className="form-control form-control-sm" value={editForm.name} onChange={e => handleEditChange('name', e.target.value)} required />
                        <button className="btn btn-sm btn-success" type="submit" disabled={adding}>Save</button>
                        <button className="btn btn-sm btn-secondary" type="button" onClick={() => setEditingId(null)}>Cancel</button>
                      </form>
                    ) : (
                      brand.name
                    )}
                  </td>
                  <td>{editingId === brand.id ? (
                    <input type="number" className="form-control form-control-sm" value={editForm.buy_rate} onChange={e => handleEditChange('buy_rate', e.target.value)} required min={0} />
                  ) : brand.buy_rate}</td>
                  <td>{editingId === brand.id ? (
                    <input type="number" className="form-control form-control-sm" value={editForm.sell_rate} onChange={e => handleEditChange('sell_rate', e.target.value)} required min={0} />
                  ) : brand.sell_rate}</td>
                  <td>{editingId === brand.id ? (
                    <select className="form-select form-select-sm" value={editForm.category_id} onChange={e => handleEditChange('category_id', e.target.value)} required>
                      <option value="">Select category</option>
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  ) : (categories.find(cat => cat.id === brand.category_id)?.name || '-')}</td>
                  <td>{editingId === brand.id ? (
                    <>
                      <input type="text" className="form-control form-control-sm mb-1" value={editForm.image_url} onChange={e => handleEditChange('image_url', e.target.value)} placeholder="Or paste image URL" />
                      <input type="file" accept="image/*" className="form-control form-control-sm" onChange={handleEditFileChange} />
                      {(editImageFile || editForm.image_url) && (
                        <img src={editImageFile ? URL.createObjectURL(editImageFile) : editForm.image_url} alt="Preview" style={{ maxWidth: 60, maxHeight: 30, marginTop: 4 }} />
                      )}
                    </>
                  ) : (brand.image_url ? <img src={brand.image_url} alt="Brand" style={{ maxWidth: 60, maxHeight: 30 }} /> : '-')}</td>
                  <td>
                    {editingId === brand.id ? null : <>
                      <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => startEdit(brand)} disabled={editingId === brand.id}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => setDeletingId(brand.id)} disabled={editingId === brand.id}>Delete</button>
                    </>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Delete confirmation modal */}
      {deletingId && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete Brand</h5>
                <button type="button" className="btn-close" onClick={() => setDeletingId(null)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this brand? This cannot be undone.</p>
                <div className="d-flex gap-2">
                  <button className="btn btn-danger" onClick={handleDelete} disabled={deleteLoading}>{deleteLoading ? 'Deleting...' : 'Delete'}</button>
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

export default GiftcardBrands; 