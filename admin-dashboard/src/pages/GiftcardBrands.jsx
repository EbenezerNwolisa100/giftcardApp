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
    <div style={{ fontFamily: 'Inter, sans-serif', width: '100%', overflowX: 'hidden', maxWidth: '100vw' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4" style={{ padding: '0 15px' }}>
        <div>
          <h2 className="mb-1 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>Gift Card Brands</h2>
          <p className="text-muted mb-0" style={{ fontFamily: 'Inter, sans-serif' }}>
            Manage gift card brands that users can sell to the platform
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowBrandForm(!showBrandForm)} 
          disabled={addingBrand}
          style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
        >
          <i className={`bi ${showBrandForm ? 'bi-x-lg' : 'bi-plus-lg'} me-2`}></i>
          {showBrandForm ? "Cancel" : "Create New Brand"}
        </button>
      </div>

      {/* Brand Creation Form */}
      {showBrandForm && (
        <div style={{ padding: '0 15px', marginBottom: '2rem' }}>
          <div className="card border shadow-sm" style={{ backgroundColor: '#ffffff', borderRadius: '0' }}>
            <div className="card-header bg-light border-bottom">
              <h5 className="mb-0 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                <i className="bi bi-plus-circle me-2"></i>
                Create New Sell Brand
              </h5>
          </div>
            <div className="card-body p-4">
            <form onSubmit={handleAddBrand}>
              <div className="row g-3">
                <div className="col-md-4">
                    <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Brand Name <span className="text-danger">*</span>
                    </label>
                  <input
                    type="text"
                    className="form-control"
                    value={brandForm.name}
                    onChange={(e) => handleBrandFormChange("name", e.target.value)}
                    required
                    placeholder="Enter brand name"
                      style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                  />
                </div>
                <div className="col-md-4">
                    <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Category <span className="text-danger">*</span>
                    </label>
                  <select
                    className="form-select"
                    value={brandForm.category_id}
                    onChange={(e) => handleBrandFormChange("category_id", e.target.value)}
                    required
                      style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
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
                    <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Brand Image
                    </label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="form-control" 
                      onChange={handleBrandFileChange}
                      style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                    />
                  {brandForm.image_file && (
                      <div className="mt-2">
                    <img
                          src={URL.createObjectURL(brandForm.image_file)}
                      alt="Preview"
                          style={{ maxWidth: 60, maxHeight: 30, borderRadius: '0' }}
                    />
                      </div>
                  )}
                </div>
                  <div className="col-12 pt-3 border-top">
                    <button 
                      className="btn btn-success" 
                      type="submit" 
                      disabled={addingBrand}
                      style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                    >
                      {addingBrand ? (
                        <>
                          <div className="spinner-border spinner-border-sm me-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-2"></i>
                          Create Sell Brand
                        </>
                      )}
                  </button>
                  <button
                    type="button"
                      className="btn btn-outline-secondary ms-2"
                    onClick={() => setShowBrandForm(false)}
                    disabled={addingBrand}
                      style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

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

      {/* Loading State */}
      {loading ? (
        <div className="text-start py-5" style={{ padding: '0 15px' }}>
          <div className="spinner-border text-primary" role="status"></div>
          <span className="ms-2">Loading sell brands...</span>
        </div>
      ) : (
        <div style={{ padding: '0 15px' }}>
          {brands.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-3">
                <i className="bi bi-handshake fs-1 text-muted"></i>
              </div>
              <h5 className="text-muted fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>No sell brands found</h5>
              <p className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                Create your first sell brand to get started
              </p>
            </div>
          ) : (
            <div className="brands-container">
              {brands.map((brand) => {
              const brandVariants = variants[brand.id] || []
              const categoryName = categories.find((cat) => cat.id === brand.category_id)?.name || "Unknown"

              return (
                  <div key={brand.id} className="card border shadow-sm mb-3" style={{ backgroundColor: '#ffffff', borderRadius: '0' }}>
                    <div className="card-header bg-light border-bottom">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        {brand.image_url && (
                          <img
                              src={brand.image_url}
                            alt={brand.name}
                              style={{ width: 40, height: 40, marginRight: 12, borderRadius: '0' }}
                          />
                        )}
                        <div>
                            <h6 className="mb-0 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>{brand.name}</h6>
                            <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {categoryName} • {brandVariants.length} variants
                          </small>
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => toggleBrandExpansion(brand.id)}
                            style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                        >
                            <i className={`bi ${expandedBrands[brand.id] ? 'bi-chevron-up' : 'bi-chevron-down'} me-1`}></i>
                          {expandedBrands[brand.id] ? "Hide Variants" : "Manage Variants"}
                        </button>
                          <button 
                            className="btn btn-sm btn-outline-danger" 
                            onClick={() => handleDeleteBrand(brand.id)}
                            style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                          >
                            <i className="bi bi-trash me-1"></i>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Brand Details and Variant Management */}
                  {expandedBrands[brand.id] && (
                      <div className="card-body p-4">
                      {/* Add Variant Form */}
                        <div className="card border mb-4" style={{ backgroundColor: '#f8f9fa', borderRadius: '0' }}>
                          <div className="card-header bg-white border-bottom">
                            <h6 className="mb-0 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                              <i className="bi bi-plus-circle me-2"></i>
                              Add New Sell Variant to {brand.name}
                            </h6>
                        </div>
                          <div className="card-body p-3">
                          <form onSubmit={(e) => handleAddVariant(e, brand.id)}>
                            <div className="row g-3 mb-3">
                              <div className="col-md-6">
                                  <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                                    Variant Name <span className="text-danger">*</span>
                                  </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={variantForms[brand.id]?.name || ""}
                                  onChange={(e) => handleVariantFormChange(brand.id, "name", e.target.value)}
                                  required
                                  placeholder="e.g., $25 Card, $50 Card, Premium"
                                    style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                                />
                              </div>
                              <div className="col-md-6">
                                  <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                                    Sell Rate (₦ per $1) <span className="text-danger">*</span>
                                  </label>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={variantForms[brand.id]?.sell_rate || ""}
                                  onChange={(e) => handleVariantFormChange(brand.id, "sell_rate", e.target.value)}
                                  required
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                    style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                                />
                              </div>
                            </div>

                              <button 
                                className="btn btn-success" 
                                type="submit" 
                                disabled={addingVariant[brand.id]}
                                style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                              >
                                {addingVariant[brand.id] ? (
                                  <>
                                    <div className="spinner-border spinner-border-sm me-2" role="status">
                                      <span className="visually-hidden">Loading...</span>
                                    </div>
                                    Adding...
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-check-lg me-2"></i>
                                    Add Sell Variant
                                  </>
                                )}
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* Existing Variants */}
                      {brandVariants.length > 0 && (
                          <div className="card border" style={{ backgroundColor: '#ffffff', borderRadius: '0' }}>
                            <div className="card-header bg-light border-bottom">
                              <h6 className="mb-0 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                                <i className="bi bi-list-ul me-2"></i>
                                Existing Sell Variants ({brandVariants.length})
                              </h6>
                          </div>
                            <div className="card-body p-0">
                              <div className="table-container">
                                <table className="table table-hover mb-0" style={{ fontFamily: 'Inter, sans-serif', width: '100%', tableLayout: 'fixed' }}>
                                  <thead className="table-light">
                                  <tr>
                                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '40%', fontFamily: 'Inter, sans-serif' }}>Name</th>
                                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '30%', fontFamily: 'Inter, sans-serif' }}>Sell Rate (₦ per $1)</th>
                                      <th className="px-3 py-3 fw-semibold text-start" style={{ width: '30%', fontFamily: 'Inter, sans-serif' }}>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {brandVariants.map((variant) => (
                                      <tr key={variant.id} className="border-bottom">
                                        <td className="px-3 py-3 text-start">
                                        {editingVariant[variant.id] ? (
                                          <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={editingVariant[variant.id].name}
                                            onChange={(e) =>
                                              handleEditVariantChange(variant.id, "name", e.target.value)
                                            }
                                            required
                                              style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                                          />
                                        ) : (
                                            <div className="text-truncate fw-medium" style={{ fontFamily: 'Inter, sans-serif' }} title={variant.name}>
                                              {variant.name}
                                            </div>
                                        )}
                                      </td>
                                        <td className="px-3 py-3 text-start">
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
                                              style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                                          />
                                        ) : (
                                            <div className="fw-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                                              ₦{variant.sell_rate}
                                            </div>
                                        )}
                                      </td>
                                        <td className="px-3 py-3 text-start">
                                        {editingVariant[variant.id] ? (
                                          <div className="d-flex gap-1">
                                            <button
                                              className="btn btn-sm btn-success"
                                              onClick={(e) => handleEditVariant(e, variant.id)}
                                              disabled={addingVariant[variant.id]}
                                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                                            >
                                                <i className="bi bi-check-lg me-1"></i>
                                              Save
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-secondary"
                                              onClick={() =>
                                                setEditingVariant((prev) => {
                                                  const newState = { ...prev }
                                                  delete newState[variant.id]
                                                  return newState
                                                })
                                              }
                                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="d-flex gap-1">
                                            <button
                                              className="btn btn-sm btn-outline-secondary"
                                              onClick={() => startEditVariant(variant)}
                                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                                            >
                                                <i className="bi bi-pencil me-1"></i>
                                              Edit
                                            </button>
                                            <button
                                              className="btn btn-sm btn-outline-danger"
                                              onClick={() => handleDeleteVariant(variant.id)}
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
                      )}
                    </div>
                  )}
                </div>
              )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GiftcardBrands
