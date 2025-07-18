// import React, { useEffect, useState } from 'react';
// import { supabase } from '../supabaseClient';

// const GiftcardBrands = () => {
//   const [brands, setBrands] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [form, setForm] = useState({ name: '', category_id: '' });
//   const [adding, setAdding] = useState(false);
//   const [editingId, setEditingId] = useState(null);
//   const [editForm, setEditForm] = useState({ name: '', category_id: '' });
//   const [deletingId, setDeletingId] = useState(null);
//   const [deleteLoading, setDeleteLoading] = useState(false);
//   const [imageFile, setImageFile] = useState(null);
//   const [editImageFile, setEditImageFile] = useState(null);
  
//   // New state for variants
//   const [variants, setVariants] = useState([]);
//   const [openBrandId, setOpenBrandId] = useState(null);
//   const [variantForm, setVariantForm] = useState({ name: '', buy_rate: '', sell_rate: '', quantity: '' });
//   const [editingVariantId, setEditingVariantId] = useState(null);
//   const [variantLoading, setVariantLoading] = useState(false);

//   useEffect(() => {
//     fetchBrands();
//     fetchCategories();
//   }, []);

//   const fetchBrands = async () => {
//     setLoading(true);
//     setError('');
//     try {
//       const { data: brandsData, error } = await supabase.from('giftcard_brands').select('id, name, image_url, category_id');
//       if (error) throw error;
//       setBrands(brandsData || []);
//     } catch {
//       setError('Failed to load brands.');
//     }
//     setLoading(false);
//   };

//   const fetchVariants = async (brandId) => {
//     setVariantLoading(true);
//     try {
//       const { data, error } = await supabase
//         .from('giftcard_variants')
//         .select('*')
//         .eq('brand_id', brandId)
//         .order('name');
//       if (error) throw error;
//       setVariants(data || []);
//     } catch {
//       setError('Failed to load variants.');
//     }
//     setVariantLoading(false);
//   };

//   const fetchCategories = async () => {
//     const { data, error } = await supabase.from('giftcard_categories').select('id, name');
//     if (!error) setCategories(data || []);
//   };

//   const handleFormChange = (field, value) => {
//     setForm(prev => ({ ...prev, [field]: value }));
//   };

//   const handleFileChange = (e) => {
//     if (e.target.files && e.target.files[0]) {
//       setImageFile(e.target.files[0]);
//       setForm(prev => ({ ...prev, image_url: '' })); // Clear URL field
//     }
//   };

//   const handleAdd = async (e) => {
//     e.preventDefault();
//     if (!form.name.trim() || !form.category_id) return;
//     setAdding(true);
//     setError('');
//     setSuccess('');
//     let imageUrl = '';
//     try {
//       if (imageFile) {
//         const ext = imageFile.name.split('.').pop();
//         const fileName = `brand_${Date.now()}_${Math.random().toString(36).substring(2,8)}.${ext}`;
//         const { error } = await supabase.storage.from('giftcard-brand-images').upload(fileName, imageFile, { contentType: imageFile.type });
//         if (error) throw error;
//         const { data: publicUrlData } = supabase.storage.from('giftcard-brand-images').getPublicUrl(fileName);
//         imageUrl = publicUrlData.publicUrl;
//       } else if (form.image_url) {
//         imageUrl = form.image_url.trim();
//       }
//       const { error } = await supabase.from('giftcard_brands').insert({
//         name: form.name.trim(),
//         image_url: imageUrl,
//         category_id: form.category_id
//       });
//       if (error) throw error;
//       setSuccess('Brand added!');
//       setForm({ name: '', category_id: '' });
//       setImageFile(null);
//       fetchBrands();
//     } catch (err) {
//       setError('Failed to add brand. ' + (err?.message || ''));
//     }
//     setAdding(false);
//   };

//   const startEdit = (brand) => {
//     setEditingId(brand.id);
//     setEditForm({
//       name: brand.name,
//       category_id: brand.category_id || ''
//     });
//     setSuccess('');
//     setError('');
//   };

//   const handleEditChange = (field, value) => {
//     setEditForm(prev => ({ ...prev, [field]: value }));
//   };

//   const handleEditFileChange = (e) => {
//     if (e.target.files && e.target.files[0]) {
//       setEditImageFile(e.target.files[0]);
//       setEditForm(prev => ({ ...prev, image_url: '' })); // Clear URL field
//     }
//   };

//   const handleEdit = async (e) => {
//     e.preventDefault();
//     if (!editForm.name.trim() || !editForm.category_id) return;
//     setAdding(true);
//     setError('');
//     setSuccess('');
//     let imageUrl = editForm.image_url;
//     try {
//       if (editImageFile) {
//         const ext = editImageFile.name.split('.').pop();
//         const fileName = `brand_${Date.now()}_${Math.random().toString(36).substring(2,8)}.${ext}`;
//         const { error } = await supabase.storage.from('giftcard-brand-images').upload(fileName, editImageFile, { contentType: editImageFile.type });
//         if (error) throw error;
//         const { data: publicUrlData } = supabase.storage.from('giftcard-brand-images').getPublicUrl(fileName);
//         imageUrl = publicUrlData.publicUrl;
//       }
//       const { error } = await supabase.from('giftcard_brands').update({
//         name: editForm.name.trim(),
//         image_url: imageUrl,
//         category_id: editForm.category_id
//       }).eq('id', editingId);
//       if (error) throw error;
//       setSuccess('Brand updated!');
//       setEditingId(null);
//       setEditForm({ name: '', category_id: '' });
//       setEditImageFile(null);
//       fetchBrands();
//     } catch (err) {
//       setError('Failed to update brand. ' + (err?.message || ''));
//     }
//     setAdding(false);
//   };

//   const handleDelete = async () => {
//     if (!deletingId) return;
//     setDeleteLoading(true);
//     setError('');
//     setSuccess('');
//     try {
//       const { error } = await supabase.from('giftcard_brands').delete().eq('id', deletingId);
//       if (error) throw error;
//       setSuccess('Brand deleted!');
//       setDeletingId(null);
//       fetchBrands();
//     } catch {
//       setError('Failed to delete brand.');
//     }
//     setDeleteLoading(false);
//   };

//   // Variant CRUD functions
//   const handleVariantFormChange = (field, value) => {
//     setVariantForm(prev => ({ ...prev, [field]: value }));
//   };

//   const handleAddOrEditVariant = async (e, brandId) => {
//     e.preventDefault();
//     if (!variantForm.name.trim() || !variantForm.buy_rate || !variantForm.sell_rate || !variantForm.quantity) return;
    
//     setVariantLoading(true);
//     setError('');
//     setSuccess('');
    
//     try {
//       if (editingVariantId) {
//         // Update existing variant
//         const { error } = await supabase.from('giftcard_variants').update({
//           name: variantForm.name.trim(),
//           buy_rate: Number(variantForm.buy_rate),
//           sell_rate: Number(variantForm.sell_rate),
//           quantity: Number(variantForm.quantity)
//         }).eq('id', editingVariantId);
        
//         if (error) throw error;
//         setSuccess('Variant updated!');
//         setEditingVariantId(null);
//       } else {
//         // Add new variant
//         const { error } = await supabase.from('giftcard_variants').insert({
//           brand_id: brandId,
//           name: variantForm.name.trim(),
//           buy_rate: Number(variantForm.buy_rate),
//           sell_rate: Number(variantForm.sell_rate),
//           quantity: Number(variantForm.quantity)
//         });
        
//         if (error) throw error;
//         setSuccess('Variant added!');
//       }
      
//       setVariantForm({ name: '', buy_rate: '', sell_rate: '', quantity: '' });
//       fetchVariants(brandId);
//     } catch (err) {
//       setError('Failed to save variant. ' + (err?.message || ''));
//     }
    
//     setVariantLoading(false);
//   };

//   const handleDeleteVariant = async (variantId, brandId) => {
//     if (!confirm('Are you sure you want to delete this variant?')) return;
    
//     setVariantLoading(true);
//     setError('');
//     setSuccess('');
    
//     try {
//       const { error } = await supabase.from('giftcard_variants').delete().eq('id', variantId);
//       if (error) throw error;
//       setSuccess('Variant deleted!');
//       fetchVariants(brandId);
//     } catch (err) {
//       setError('Failed to delete variant. ' + (err?.message || ''));
//     }
    
//     setVariantLoading(false);
//   };

//   const startEditVariant = (variant) => {
//     setEditingVariantId(variant.id);
//     setVariantForm({
//       name: variant.name,
//       buy_rate: variant.buy_rate,
//       sell_rate: variant.sell_rate,
//       quantity: variant.quantity
//     });
//     setSuccess('');
//     setError('');
//   };

//   return (
//     <div className="container py-4" style={{ maxWidth: 900 }}>
//       <h2 className="mb-4">Gift Card Brands</h2>
//       <form className="mb-4 row g-2 align-items-end" onSubmit={handleAdd}>
//         <div className="col-md-3">
//           <label className="form-label">Name</label>
//           <input type="text" className="form-control" value={form.name} onChange={e => handleFormChange('name', e.target.value)} required />
//         </div>
//         <div className="col-md-3">
//           <label className="form-label">Category</label>
//           <select className="form-select" value={form.category_id} onChange={e => handleFormChange('category_id', e.target.value)} required>
//             <option value="">Select category</option>
//             {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
//           </select>
//         </div>
//         <div className="col-md-2">
//           <label className="form-label">Image</label>
//           <input type="file" accept="image/*" className="form-control" onChange={handleFileChange} />
//           {imageFile && (
//             <img src={URL.createObjectURL(imageFile)} alt="Preview" style={{ maxWidth: 60, maxHeight: 30, marginTop: 4 }} />
//           )}
//         </div>
//         <div className="col-12">
//           <button className="btn btn-primary" type="submit" disabled={adding}>{adding ? 'Adding...' : 'Add Brand'}</button>
//         </div>
//       </form>
//       {error && <div className="alert alert-danger py-2">{error}</div>}
//       {success && <div className="alert alert-success py-2">{success}</div>}
//       {loading ? (
//         <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
//       ) : (
//         <div className="table-responsive">
//           <table className="table table-hover table-sm align-middle">
//             <thead>
//               <tr>
//                 <th>Name</th>
//                 <th>Category</th>
//                 <th>Image</th>
//                 <th></th>
//               </tr>
//             </thead>
//             <tbody>
//               {brands.length === 0 ? (
//                 <tr><td colSpan="4" className="text-center">No brands found</td></tr>
//               ) : brands.map(brand => (
//                 <React.Fragment key={brand.id}>
//                   <tr>
//                     <td>
//                       {editingId === brand.id ? (
//                         <form className="d-flex gap-2" onSubmit={handleEdit}>
//                           <input type="text" className="form-control form-control-sm" value={editForm.name} onChange={e => handleEditChange('name', e.target.value)} required />
//                           <button className="btn btn-sm btn-success" type="submit" disabled={adding}>Save</button>
//                           <button className="btn btn-sm btn-secondary" type="button" onClick={() => setEditingId(null)}>Cancel</button>
//                         </form>
//                       ) : (
//                         brand.name
//                       )}
//                     </td>
//                     <td>{editingId === brand.id ? (
//                       <select className="form-select form-select-sm" value={editForm.category_id} onChange={e => handleEditChange('category_id', e.target.value)} required>
//                         <option value="">Select category</option>
//                         {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
//                       </select>
//                     ) : (categories.find(cat => cat.id === brand.category_id)?.name || '-')}</td>
//                     <td>{editingId === brand.id ? (
//                       <>
//                         <input type="file" accept="image/*" className="form-control form-control-sm" onChange={handleEditFileChange} />
//                         {editImageFile && (
//                           <img src={URL.createObjectURL(editImageFile)} alt="Preview" style={{ maxWidth: 60, maxHeight: 30, marginTop: 4 }} />
//                         )}
//                       </>
//                     ) : (brand.image_url ? <img src={brand.image_url} alt="Brand" style={{ maxWidth: 60, maxHeight: 30 }} /> : '-')}</td>
//                     <td>
//                       {editingId === brand.id ? null : <>
//                         <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => startEdit(brand)} disabled={editingId === brand.id}>Edit</button>
//                         <button className="btn btn-sm btn-outline-info me-2" onClick={() => {
//                           if (openBrandId === brand.id) {
//                             setOpenBrandId(null);
//                           } else {
//                             setOpenBrandId(brand.id);
//                             fetchVariants(brand.id);
//                           }
//                         }}>{openBrandId === brand.id ? 'Hide Variants' : 'Manage Variants'}</button>
//                         <button className="btn btn-sm btn-outline-danger" onClick={() => setDeletingId(brand.id)} disabled={editingId === brand.id}>Delete</button>
//                       </>}
//                     </td>
//                   </tr>
//                   {/* Variants section */}
//                   {openBrandId === brand.id && (
//                     <tr>
//                       <td colSpan="4" className="p-0">
//                         <div className="p-3 bg-light">
//                           <h6 className="mb-3">Variants for {brand.name}</h6>
                          
//                           {/* Add Variant Form */}
//                           <form className="row g-2 mb-3" onSubmit={(e) => handleAddOrEditVariant(e, brand.id)}>
//                             <div className="col-md-3">
//                               <input type="text" className="form-control form-control-sm" placeholder="Variant name" value={variantForm.name} onChange={e => handleVariantFormChange('name', e.target.value)} required />
//                             </div>
//                             <div className="col-md-2">
//                               <input type="number" className="form-control form-control-sm" placeholder="Buy rate" value={variantForm.buy_rate} onChange={e => handleVariantFormChange('buy_rate', e.target.value)} required min={0} />
//                             </div>
//                             <div className="col-md-2">
//                               <input type="number" className="form-control form-control-sm" placeholder="Sell rate" value={variantForm.sell_rate} onChange={e => handleVariantFormChange('sell_rate', e.target.value)} required min={0} />
//                             </div>
//                             <div className="col-md-2">
//                               <input type="number" className="form-control form-control-sm" placeholder="Quantity" value={variantForm.quantity} onChange={e => handleVariantFormChange('quantity', e.target.value)} required min={0} />
//                             </div>
//                             <div className="col-md-3">
//                               <button className="btn btn-sm btn-primary" type="submit" disabled={variantLoading}>
//                                 {variantLoading ? 'Saving...' : (editingVariantId ? 'Update Variant' : 'Add Variant')}
//                               </button>
//                               {editingVariantId && (
//                                 <button className="btn btn-sm btn-secondary ms-2" type="button" onClick={() => {
//                                   setEditingVariantId(null);
//                                   setVariantForm({ name: '', buy_rate: '', sell_rate: '', quantity: '' });
//                                 }}>Cancel</button>
//                               )}
//                             </div>
//                           </form>
                          
//                           {/* Variants Table */}
//                           {variantLoading ? (
//                             <div className="text-center py-3"><div className="spinner-border spinner-border-sm text-primary" role="status"></div></div>
//                           ) : (
//                             <div className="table-responsive">
//                               <table className="table table-sm table-bordered">
//                                 <thead>
//                                   <tr>
//                                     <th>Name</th>
//                                     <th>Buy Rate</th>
//                                     <th>Sell Rate</th>
//                                     <th>Quantity</th>
//                                     <th>Actions</th>
//                                   </tr>
//                                 </thead>
//                                 <tbody>
//                                   {variants.length === 0 ? (
//                                     <tr><td colSpan="5" className="text-center text-muted">No variants found</td></tr>
//                                   ) : variants.map(variant => (
//                                     <tr key={variant.id}>
//                                       <td>{variant.name}</td>
//                                       <td>{variant.buy_rate}</td>
//                                       <td>{variant.sell_rate}</td>
//                                       <td>{variant.quantity}</td>
//                                       <td>
//                                         <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => startEditVariant(variant)}>Edit</button>
//                                         <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteVariant(variant.id, brand.id)}>Delete</button>
//                                       </td>
//                                     </tr>
//                                   ))}
//                                 </tbody>
//                               </table>
//                             </div>
//                           )}
//                         </div>
//                       </td>
//                     </tr>
//                   )}
//                 </React.Fragment>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//       {/* Delete confirmation modal */}
//       {deletingId && (
//         <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
//           <div className="modal-dialog modal-dialog-centered">
//             <div className="modal-content">
//               <div className="modal-header">
//                 <h5 className="modal-title">Delete Brand</h5>
//                 <button type="button" className="btn-close" onClick={() => setDeletingId(null)}></button>
//               </div>
//               <div className="modal-body">
//                 <p>Are you sure you want to delete this brand? This cannot be undone.</p>
//                 <div className="d-flex gap-2">
//                   <button className="btn btn-danger" onClick={handleDelete} disabled={deleteLoading}>{deleteLoading ? 'Deleting...' : 'Delete'}</button>
//                   <button className="btn btn-secondary" onClick={() => setDeletingId(null)} disabled={deleteLoading}>Cancel</button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default GiftcardBrands; 




"use client"

import { useEffect, useState } from "react"
import { supabase } from "../supabaseClient"

const GiftcardBrands = () => {
  // Data states
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [variants, setVariants] = useState({})

  // UI states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showBrandForm, setShowBrandForm] = useState(false)
  const [expandedBrands, setExpandedBrands] = useState({})
  const [addingBrand, setAddingBrand] = useState(false)
  const [addingVariant, setAddingVariant] = useState({})

  // Brand form state
  const [brandForm, setBrandForm] = useState({
    name: "",
    category_id: "",
    image_file: null,
  })

  // Variant form state (per brand)
  const [variantForms, setVariantForms] = useState({})
  const [editingVariant, setEditingVariant] = useState({})

  useEffect(() => {
    fetchBrands()
    fetchCategories()
  }, [])

  const fetchBrands = async () => {
    setLoading(true)
    setError("")
    try {
      // Fetch brands from giftcards_sell table
      const { data: brandsData, error: brandsError } = await supabase
        .from("giftcards_sell")
        .select("id, name, image_url, category_id")
        .order("name")
      if (brandsError) throw brandsError
      setBrands(brandsData || [])

      // Fetch variants for all brands
      const { data: variantsData, error: variantsError } = await supabase
        .from("giftcards_sell_variants")
        .select("*")
        .order("name")
      if (variantsError) throw variantsError

      // Group variants by brand_id
      const variantsByBrand = {}
      ;(variantsData || []).forEach((variant) => {
        if (!variantsByBrand[variant.brand_id]) {
          variantsByBrand[variant.brand_id] = []
        }
        variantsByBrand[variant.brand_id].push(variant)
      })
      setVariants(variantsByBrand)
    } catch (err) {
      setError("Failed to load sell brands and variants: " + (err?.message || ""))
    }
    setLoading(false)
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from("giftcard_categories").select("id, name").order("name")
      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error("Failed to fetch categories:", err)
    }
  }

  // --- Brand Form Handlers ---
  const handleBrandFormChange = (field, value) => {
    setBrandForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleBrandFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setBrandForm((prev) => ({ ...prev, image_file: e.target.files[0] }))
    }
  }

  const handleAddBrand = async (e) => {
    e.preventDefault()
    if (!brandForm.name.trim() || !brandForm.category_id) {
      setError("Please fill in all required fields.")
      return
    }

    setAddingBrand(true)
    setError("")
    setSuccess("")

    try {
      let imageUrl = ""

      // Upload image if provided
      if (brandForm.image_file) {
        const ext = brandForm.image_file.name.split(".").pop()
        const fileName = `sell_brand_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from("giftcard-brand-images")
          .upload(fileName, brandForm.image_file, { contentType: brandForm.image_file.type })

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage.from("giftcard-brand-images").getPublicUrl(fileName)
        imageUrl = publicUrlData.publicUrl
      }

      // Create brand in giftcards_sell table
      const { error } = await supabase.from("giftcards_sell").insert({
        name: brandForm.name.trim(),
        image_url: imageUrl || null,
        category_id: brandForm.category_id,
      })

      if (error) throw error

      setSuccess("Sell brand created successfully!")
      setBrandForm({ name: "", category_id: "", image_file: null })
      setShowBrandForm(false)
      fetchBrands()
    } catch (err) {
      setError("Failed to create sell brand: " + (err?.message || ""))
    }
    setAddingBrand(false)
  }

  const handleDeleteBrand = async (brandId) => {
    if (!confirm("Are you sure you want to delete this sell brand and all its variants?")) return

    setError("")
    setSuccess("")

    try {
      // Delete variants first (should cascade automatically, but being explicit)
      await supabase.from("giftcards_sell_variants").delete().eq("brand_id", brandId)

      // Then delete the brand
      const { error } = await supabase.from("giftcards_sell").delete().eq("id", brandId)
      if (error) throw error

      setSuccess("Sell brand deleted successfully!")
      fetchBrands()
    } catch (err) {
      setError("Failed to delete sell brand: " + (err?.message || ""))
    }
  }

  // --- Variant Form Handlers ---
  const initVariantForm = (brandId) => {
    if (!variantForms[brandId]) {
      setVariantForms((prev) => ({
        ...prev,
        [brandId]: {
          name: "",
          sell_rate: "",
        },
      }))
    }
  }

  const handleVariantFormChange = (brandId, field, value) => {
    setVariantForms((prev) => ({
      ...prev,
      [brandId]: {
        ...prev[brandId],
        [field]: value,
      },
    }))
  }

  const handleAddVariant = async (e, brandId) => {
    e.preventDefault()
    const form = variantForms[brandId]

    if (!form || !form.name.trim() || !form.sell_rate) {
      setError("Please fill in all variant fields.")
      return
    }

    setAddingVariant((prev) => ({ ...prev, [brandId]: true }))
    setError("")
    setSuccess("")

    try {
      const { error } = await supabase.from("giftcards_sell_variants").insert({
        brand_id: brandId,
        name: form.name.trim(),
        buy_rate: 0, // Not used for sell variants
        sell_rate: Number(form.sell_rate),
        quantity: 0, // Not used for sell variants
      })

      if (error) throw error

      setSuccess(`Sell variant "${form.name}" added successfully!`)

      // Reset form
      setVariantForms((prev) => ({
        ...prev,
        [brandId]: {
          name: "",
          sell_rate: "",
        },
      }))

      fetchBrands()
    } catch (err) {
      setError("Failed to add sell variant: " + (err?.message || ""))
    }
    setAddingVariant((prev) => ({ ...prev, [brandId]: false }))
  }

  const startEditVariant = (variant) => {
    setEditingVariant((prev) => ({
      ...prev,
      [variant.id]: {
        name: variant.name,
        sell_rate: variant.sell_rate,
      },
    }))
  }

  const handleEditVariantChange = (variantId, field, value) => {
    setEditingVariant((prev) => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        [field]: value,
      },
    }))
  }

  const handleEditVariant = async (e, variantId) => {
    e.preventDefault()
    const form = editingVariant[variantId]

    if (!form || !form.name.trim() || !form.sell_rate) {
      setError("Please fill in all variant fields.")
      return
    }

    setAddingVariant((prev) => ({ ...prev, [variantId]: true }))
    setError("")
    setSuccess("")

    try {
      const { error } = await supabase
        .from("giftcards_sell_variants")
        .update({
          name: form.name.trim(),
          sell_rate: Number(form.sell_rate),
        })
        .eq("id", variantId)

      if (error) throw error

      setSuccess("Sell variant updated successfully!")
      setEditingVariant((prev) => {
        const newState = { ...prev }
        delete newState[variantId]
        return newState
      })
      fetchBrands()
    } catch (err) {
      setError("Failed to update sell variant: " + (err?.message || ""))
    }
    setAddingVariant((prev) => ({ ...prev, [variantId]: false }))
  }

  const handleDeleteVariant = async (variantId) => {
    if (!confirm("Are you sure you want to delete this sell variant?")) return

    setError("")
    setSuccess("")

    try {
      const { error } = await supabase.from("giftcards_sell_variants").delete().eq("id", variantId)
      if (error) throw error
      setSuccess("Sell variant deleted successfully!")
      fetchBrands()
    } catch (err) {
      setError("Failed to delete sell variant: " + (err?.message || ""))
    }
  }

  const toggleBrandExpansion = (brandId) => {
    setExpandedBrands((prev) => ({
      ...prev,
      [brandId]: !prev[brandId],
    }))
    initVariantForm(brandId)
  }

  return (
    <div className="container py-4" style={{ maxWidth: 1200 }}>
      <h2 className="mb-4">Sell Gift Card Brands Management</h2>
      <p className="text-muted mb-4">
        Manage gift card brands that users can sell to the platform. Each brand can have multiple variants with
        different sell rates.
      </p>

      {/* Create Brand Button */}
      <div className="mb-4">
        <button className="btn btn-primary" onClick={() => setShowBrandForm(!showBrandForm)} disabled={addingBrand}>
          {showBrandForm ? "Cancel" : "Create New Sell Brand"}
        </button>
      </div>

      {/* Brand Creation Form */}
      {showBrandForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Create New Sell Brand</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleAddBrand}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Brand Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={brandForm.name}
                    onChange={(e) => handleBrandFormChange("name", e.target.value)}
                    required
                    placeholder="Enter brand name"
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-select"
                    value={brandForm.category_id}
                    onChange={(e) => handleBrandFormChange("category_id", e.target.value)}
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Brand Image</label>
                  <input type="file" accept="image/*" className="form-control" onChange={handleBrandFileChange} />
                  {brandForm.image_file && (
                    <img
                      src={URL.createObjectURL(brandForm.image_file) || "/placeholder.svg"}
                      alt="Preview"
                      style={{ maxWidth: 60, maxHeight: 30, marginTop: 8 }}
                    />
                  )}
                </div>
                <div className="col-12">
                  <button className="btn btn-success" type="submit" disabled={addingBrand}>
                    {addingBrand ? "Creating..." : "Create Sell Brand"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary ms-2"
                    onClick={() => setShowBrandForm(false)}
                    disabled={addingBrand}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error and Success Messages */}
      {error && <div className="alert alert-danger py-2">{error}</div>}
      {success && <div className="alert alert-success py-2">{success}</div>}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2">Loading sell brands...</p>
        </div>
      ) : (
        <div className="brands-container">
          {brands.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-3">
                <i className="fas fa-handshake fa-3x text-muted"></i>
              </div>
              <h5 className="text-muted">No sell brands found</h5>
              <p className="text-muted">Create your first sell brand to get started</p>
            </div>
          ) : (
            brands.map((brand) => {
              const brandVariants = variants[brand.id] || []
              const categoryName = categories.find((cat) => cat.id === brand.category_id)?.name || "Unknown"

              return (
                <div key={brand.id} className="card mb-3">
                  <div className="card-header">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        {brand.image_url && (
                          <img
                            src={brand.image_url || "/placeholder.svg"}
                            alt={brand.name}
                            style={{ width: 40, height: 40, marginRight: 12, borderRadius: 4 }}
                          />
                        )}
                        <div>
                          <h6 className="mb-0">{brand.name}</h6>
                          <small className="text-muted">
                            {categoryName} • {brandVariants.length} variants
                          </small>
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => toggleBrandExpansion(brand.id)}
                        >
                          {expandedBrands[brand.id] ? "Hide Variants" : "Manage Variants"}
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteBrand(brand.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Brand Details and Variant Management */}
                  {expandedBrands[brand.id] && (
                    <div className="card-body">
                      {/* Add Variant Form */}
                      <div className="card mb-4">
                        <div className="card-header">
                          <h6 className="mb-0">Add New Sell Variant to {brand.name}</h6>
                        </div>
                        <div className="card-body">
                          <form onSubmit={(e) => handleAddVariant(e, brand.id)}>
                            <div className="row g-3 mb-3">
                              <div className="col-md-6">
                                <label className="form-label">Variant Name *</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={variantForms[brand.id]?.name || ""}
                                  onChange={(e) => handleVariantFormChange(brand.id, "name", e.target.value)}
                                  required
                                  placeholder="e.g., $25 Card, $50 Card, Premium"
                                />
                              </div>
                              <div className="col-md-6">
                                <label className="form-label">Sell Rate (₦ per $1) *</label>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={variantForms[brand.id]?.sell_rate || ""}
                                  onChange={(e) => handleVariantFormChange(brand.id, "sell_rate", e.target.value)}
                                  required
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>

                            <button className="btn btn-success" type="submit" disabled={addingVariant[brand.id]}>
                              {addingVariant[brand.id] ? "Adding..." : "Add Sell Variant"}
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* Existing Variants */}
                      {brandVariants.length > 0 && (
                        <div className="card">
                          <div className="card-header">
                            <h6 className="mb-0">Existing Sell Variants</h6>
                          </div>
                          <div className="card-body">
                            <div className="table-responsive">
                              <table className="table table-sm">
                                <thead>
                                  <tr>
                                    <th>Name</th>
                                    <th>Sell Rate (₦ per $1)</th>
                                    <th>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {brandVariants.map((variant) => (
                                    <tr key={variant.id}>
                                      <td>
                                        {editingVariant[variant.id] ? (
                                          <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={editingVariant[variant.id].name}
                                            onChange={(e) =>
                                              handleEditVariantChange(variant.id, "name", e.target.value)
                                            }
                                            required
                                          />
                                        ) : (
                                          variant.name
                                        )}
                                      </td>
                                      <td>
                                        {editingVariant[variant.id] ? (
                                          <input
                                            type="number"
                                            className="form-control form-control-sm"
                                            value={editingVariant[variant.id].sell_rate}
                                            onChange={(e) =>
                                              handleEditVariantChange(variant.id, "sell_rate", e.target.value)
                                            }
                                            required
                                            min="0"
                                            step="0.01"
                                          />
                                        ) : (
                                          `₦${variant.sell_rate}`
                                        )}
                                      </td>
                                      <td>
                                        {editingVariant[variant.id] ? (
                                          <div className="d-flex gap-1">
                                            <button
                                              className="btn btn-sm btn-success"
                                              onClick={(e) => handleEditVariant(e, variant.id)}
                                              disabled={addingVariant[variant.id]}
                                            >
                                              Save
                                            </button>
                                            <button
                                              className="btn btn-sm btn-secondary"
                                              onClick={() =>
                                                setEditingVariant((prev) => {
                                                  const newState = { ...prev }
                                                  delete newState[variant.id]
                                                  return newState
                                                })
                                              }
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="d-flex gap-1">
                                            <button
                                              className="btn btn-sm btn-outline-secondary"
                                              onClick={() => startEditVariant(variant)}
                                            >
                                              Edit
                                            </button>
                                            <button
                                              className="btn btn-sm btn-outline-danger"
                                              onClick={() => handleDeleteVariant(variant.id)}
                                            >
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
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default GiftcardBrands
