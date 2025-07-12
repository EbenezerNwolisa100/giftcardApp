import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const GiftcardCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch categories and count brands per category
      const { data: cats, error } = await supabase.from('giftcard_categories').select('id, name');
      if (error) throw error;
      // For each category, count brands
      const { data: brands } = await supabase.from('giftcard_brands').select('id, category_id');
      const catList = (cats || []).map(cat => ({
        ...cat,
        brandCount: (brands || []).filter(b => b.category_id === cat.id).length
      }));
      setCategories(catList);
    } catch {
      setError('Failed to load categories.');
    }
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setError('');
    setSuccess('');
    try {
      const { error } = await supabase.from('giftcard_categories').insert({ name: newName.trim() });
      if (error) throw error;
      setSuccess('Category added!');
      setNewName('');
      fetchCategories();
    } catch {
      setError('Failed to add category.');
    }
    setAdding(false);
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
    setSuccess('');
    setError('');
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editingName.trim()) return;
    setAdding(true);
    setError('');
    setSuccess('');
    try {
      const { error } = await supabase.from('giftcard_categories').update({ name: editingName.trim() }).eq('id', editingId);
      if (error) throw error;
      setSuccess('Category updated!');
      setEditingId(null);
      setEditingName('');
      fetchCategories();
    } catch {
      setError('Failed to update category.');
    }
    setAdding(false);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    setError('');
    setSuccess('');
    try {
      const { error } = await supabase.from('giftcard_categories').delete().eq('id', deletingId);
      if (error) throw error;
      setSuccess('Category deleted!');
      setDeletingId(null);
      fetchCategories();
    } catch {
      setError('Failed to delete category.');
    }
    setDeleteLoading(false);
  };

  return (
    <div className="container py-4" style={{ maxWidth: 600 }}>
      <h2 className="mb-4">Gift Card Categories</h2>
      <form className="mb-4 d-flex gap-2" onSubmit={handleAdd}>
        <input
          type="text"
          className="form-control"
          placeholder="New category name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          required
        />
        <button className="btn btn-primary" type="submit" disabled={adding}>{adding ? 'Adding...' : 'Add'}</button>
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
                <th>Brands</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr><td colSpan="3" className="text-center">No categories found</td></tr>
              ) : categories.map(cat => (
                <tr key={cat.id}>
                  <td>
                    {editingId === cat.id ? (
                      <form className="d-flex gap-2" onSubmit={handleEdit}>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          required
                        />
                        <button className="btn btn-sm btn-success" type="submit" disabled={adding}>Save</button>
                        <button className="btn btn-sm btn-secondary" type="button" onClick={() => setEditingId(null)}>Cancel</button>
                      </form>
                    ) : (
                      cat.name
                    )}
                  </td>
                  <td>{cat.brandCount}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => startEdit(cat)} disabled={editingId === cat.id}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => setDeletingId(cat.id)} disabled={editingId === cat.id}>Delete</button>
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
                <h5 className="modal-title">Delete Category</h5>
                <button type="button" className="btn-close" onClick={() => setDeletingId(null)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this category? This cannot be undone.</p>
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

export default GiftcardCategories; 