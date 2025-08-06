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
      // Fetch categories
      const { data: cats, error } = await supabase.from('giftcard_categories').select('id, name');
      if (error) throw error;
      
      // Fetch buy brands count per category
      const { data: buyBrands } = await supabase.from('giftcards_buy_brands').select('id, category_id');
      
      // Fetch sell brands count per category
      const { data: sellBrands } = await supabase.from('giftcards_sell').select('id, category_id');
      
      // Calculate counts for each category
      const catList = (cats || []).map(cat => {
        const buyCount = (buyBrands || []).filter(b => b.category_id === cat.id).length;
        const sellCount = (sellBrands || []).filter(b => b.category_id === cat.id).length;
        const totalCount = buyCount + sellCount;
        
        return {
          ...cat,
          buyCount,
          sellCount,
          totalCount
        };
      });
      
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
    <div style={{ fontFamily: 'Inter, sans-serif', width: '100%', overflowX: 'hidden', maxWidth: '100vw' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4" style={{ padding: '0 15px' }}>
        <div>
          <h2 className="mb-1 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>Gift Card Categories</h2>
          <p className="text-muted mb-0" style={{ fontFamily: 'Inter, sans-serif' }}>
            Manage gift card categories for organizing brands
          </p>
        </div>
      </div>

      {/* Add Category Form */}
      <div style={{ padding: '0 15px', marginBottom: '2rem' }}>
        <div className="card border shadow-sm" style={{ backgroundColor: '#ffffff', borderRadius: '0' }}>
          <div className="card-header bg-light border-bottom">
            <h5 className="mb-0 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
              <i className="bi bi-plus-circle me-2"></i>
              Add New Category
            </h5>
          </div>
          <div className="card-body p-4">
            <form onSubmit={handleAdd} className="d-flex gap-3">
              <div className="flex-grow-1">
                <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Category Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter category name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                />
              </div>
              <div className="d-flex align-items-end">
                <button 
                  className="btn btn-primary" 
                  type="submit" 
                  disabled={adding}
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                >
                  {adding ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-2"></i>
                      Add Category
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Error and Success Messages */}
      {(error || success) && (
        <div style={{ padding: '0 15px', marginBottom: '1rem' }}>
          {error && (
            <div className="alert alert-danger py-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success py-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              <i className="bi bi-check-circle me-2"></i>
              {success}
            </div>
          )}
        </div>
      )}

      {/* Categories Table */}
      {loading ? (
        <div className="text-start py-5" style={{ padding: '0 15px' }}>
          <div className="spinner-border text-primary" role="status"></div>
          <span className="ms-2">Loading categories...</span>
        </div>
      ) : (
        <div style={{ padding: '0 15px' }}>
          <div className="card border shadow-sm" style={{ backgroundColor: '#ffffff', borderRadius: '0' }}>
            <div className="card-header bg-light border-bottom">
              <h5 className="mb-0 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                <i className="bi bi-list-ul me-2"></i>
                Existing Categories ({categories.length})
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="table-container">
                <table className="table table-hover mb-0" style={{ fontFamily: 'Inter, sans-serif', width: '100%', tableLayout: 'fixed' }}>
                  <thead className="table-light">
                    <tr>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '30%', fontFamily: 'Inter, sans-serif' }}>Category Name</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '20%', fontFamily: 'Inter, sans-serif' }}>Buy Brands</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '20%', fontFamily: 'Inter, sans-serif' }}>Sell Brands</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '15%', fontFamily: 'Inter, sans-serif' }}>Total</th>
                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '15%', fontFamily: 'Inter, sans-serif' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-start py-5 text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <div className="text-center">
                            <i className="bi bi-folder-x fs-1 text-muted mb-3 d-block"></i>
                            <h6 className="fw-bold">No categories found</h6>
                            <p className="mb-0">Create your first category to get started</p>
                          </div>
                        </td>
                      </tr>
                    ) : categories.map(cat => (
                      <tr key={cat.id} className="border-bottom">
                        <td className="px-3 py-3 text-start">
                          {editingId === cat.id ? (
                            <form className="d-flex gap-2" onSubmit={handleEdit}>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={editingName}
                                onChange={e => setEditingName(e.target.value)}
                                required
                                style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                              />
                              <button 
                                className="btn btn-sm btn-success" 
                                type="submit" 
                                disabled={adding}
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                              >
                                <i className="bi bi-check-lg me-1"></i>
                                Save
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-secondary" 
                                type="button" 
                                onClick={() => setEditingId(null)}
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                              >
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <div className="fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {cat.name}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-start">
                          <span className="badge bg-primary" style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}>
                            {cat.buyCount} buy brand{cat.buyCount !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-start">
                          <span className="badge bg-success" style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}>
                            {cat.sellCount} sell brand{cat.sellCount !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-start">
                          <span className="badge bg-secondary" style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}>
                            {cat.totalCount} total
                          </span>
                        </td>
                        <td className="px-3 py-3 text-start">
                          {editingId !== cat.id && (
                            <div className="d-flex gap-1">
                              <button 
                                className="btn btn-sm btn-outline-secondary" 
                                onClick={() => startEdit(cat)} 
                                disabled={editingId === cat.id}
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                              >
                                <i className="bi bi-pencil me-1"></i>
                                Edit
                              </button>
                              <button 
                                className="btn btn-sm btn-outline-danger" 
                                onClick={() => setDeletingId(cat.id)} 
                                disabled={editingId === cat.id}
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                              >
                                <i className="bi bi-trash me-1"></i>
                                Delete
                              </button>
                            </div>
                          )}
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

      {/* Delete confirmation modal */}
      {deletingId && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '0', fontFamily: 'Inter, sans-serif' }}>
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <i className="bi bi-exclamation-triangle text-danger me-2"></i>
                  Delete Category
                </h5>
                <button type="button" className="btn-close" onClick={() => setDeletingId(null)}></button>
              </div>
              <div className="modal-body p-4">
                <p style={{ fontFamily: 'Inter, sans-serif' }}>
                  Are you sure you want to delete this category? This action cannot be undone.
                </p>
                <div className="d-flex gap-2 pt-3 border-top">
                  <button 
                    className="btn btn-danger" 
                    onClick={handleDelete} 
                    disabled={deleteLoading}
                    style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                  >
                    {deleteLoading ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-trash me-2"></i>
                        Delete Category
                      </>
                    )}
                  </button>
                  <button 
                    className="btn btn-outline-secondary" 
                    onClick={() => setDeletingId(null)} 
                    disabled={deleteLoading}
                    style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                  >
                    Cancel
                  </button>
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