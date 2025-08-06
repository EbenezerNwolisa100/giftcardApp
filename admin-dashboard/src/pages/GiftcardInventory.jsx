"use client"

import { useEffect, useState } from "react"
import { supabase } from "../supabaseClient"

const GiftcardInventory = () => {
  // Data states
  const [buyBrands, setBuyBrands] = useState([]) // Stores brands from giftcards_buy_brands
  const [inventoryItems, setInventoryItems] = useState([]) // Stores individual codes from giftcards_buy
  const [categories, setCategories] = useState([])

  // UI states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showBrandForm, setShowBrandForm] = useState(false)
  const [expandedBrands, setExpandedBrands] = useState({})
  const [addingBrand, setAddingBrand] = useState(false)
  const [addingVariant, setAddingVariant] = useState({}) // For adding new codes for a variant
  const [editingBrand, setEditingBrand] = useState(null) // For editing a buy brand
  const [editingItem, setEditingItem] = useState({}) // For editing individual inventory items
  const [editingItemLoading, setEditingItemLoading] = useState({}) // For loading during item edit

  // Brand form state
  const [brandForm, setBrandForm] = useState({
    name: "", // Changed from brand_name to name
    category_id: "",
    image_file: null,
  })

  // Variant form state (per brand)
  const [variantForms, setVariantForms] = useState({})

  useEffect(() => {
    fetchBuyBrands()
    fetchInventoryItems()
    fetchCategories()
  }, [])

  const fetchBuyBrands = async () => {
    setLoading(true)
    setError("")
    try {
      const { data, error } = await supabase.from("giftcards_buy_brands").select("*").order("name")
      if (error) throw error
      setBuyBrands(data || [])
    } catch (err) {
      setError("Failed to load buy brands: " + (err?.message || ""))
    } finally {
      setLoading(false)
    }
  }

  const fetchInventoryItems = async () => {
    setLoading(true)
    setError("")
    try {
      const { data, error } = await supabase.from("giftcards_buy").select("*").order("created_at", { ascending: false })
      if (error) throw error
      setInventoryItems(data || [])
    } catch (err) {
      setError("Failed to load buy inventory items: " + (err?.message || ""))
    } finally {
      setLoading(false)
    }
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
        const fileName = `buy_brand_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from("giftcard-inventory-images")
          .upload(fileName, brandForm.image_file, { contentType: brandForm.image_file.type })

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage.from("giftcard-inventory-images").getPublicUrl(fileName)
        imageUrl = publicUrlData.publicUrl
      }

      // Insert into giftcards_buy_brands
      const { data, error } = await supabase
        .from("giftcards_buy_brands")
        .insert({
          name: brandForm.name.trim(),
          image_url: imageUrl || null,
          category_id: brandForm.category_id,
        })
        .select()
        .single()

      if (error) throw error

      setSuccess("Buy brand created successfully! You can now add variants and codes.")
      setBrandForm({ name: "", category_id: "", image_file: null })
      setShowBrandForm(false)
      fetchBuyBrands() // Refresh the list of buy brands
      setExpandedBrands((prev) => ({ ...prev, [data.id]: true })) // Expand the newly created brand
      initVariantForm(data.id, imageUrl, data.category_id) // Initialize variant form for new brand
    } catch (err) {
      setError("Failed to create buy brand: " + (err?.message || ""))
    }
    setAddingBrand(false)
  }

  const startEditBrand = (brand) => {
    setEditingBrand({ ...brand, image_file: null }) // Reset image_file for editing
  }

  const handleEditBrandChange = (field, value) => {
    setEditingBrand((prev) => ({ ...prev, [field]: value }))
  }

  const handleEditBrandFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setEditingBrand((prev) => ({ ...prev, image_file: e.target.files[0] }))
    }
  }

  const handleUpdateBrand = async (e) => {
    e.preventDefault()
    if (!editingBrand.name.trim() || !editingBrand.category_id) {
      setError("Please fill in all required fields for brand update.")
      return
    }

    setAddingBrand(true) // Reusing addingBrand for loading state
    setError("")
    setSuccess("")

    try {
      let imageUrl = editingBrand.image_url

      // Upload new image if provided
      if (editingBrand.image_file) {
        const ext = editingBrand.image_file.name.split(".").pop()
        const fileName = `buy_brand_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from("giftcard-inventory-images")
          .upload(fileName, editingBrand.image_file, { contentType: editingBrand.image_file.type })

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage.from("giftcard-inventory-images").getPublicUrl(fileName)
        imageUrl = publicUrlData.publicUrl
      }

      const { error } = await supabase
        .from("giftcards_buy_brands")
        .update({
          name: editingBrand.name.trim(),
          image_url: imageUrl || null,
          category_id: editingBrand.category_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingBrand.id)

      if (error) throw error

      setSuccess("Buy brand updated successfully!")
      setEditingBrand(null)
      fetchBuyBrands() // Refresh the list of buy brands
    } catch (err) {
      setError("Failed to update buy brand: " + (err?.message || ""))
    }
    setAddingBrand(false)
  }

  const handleDeleteBrand = async (brandId) => {
    if (!confirm("Are you sure you want to delete this buy brand and all its associated gift card codes?")) return

    setError("")
    setSuccess("")

    try {
      // Deleting the brand will cascade delete associated giftcards_buy items due to ON DELETE CASCADE
      const { error } = await supabase.from("giftcards_buy_brands").delete().eq("id", brandId)
      if (error) throw error

      setSuccess("Buy brand and its inventory deleted successfully!")
      fetchBuyBrands()
      fetchInventoryItems() // Refresh inventory as well
    } catch (err) {
      setError("Failed to delete buy brand: " + (err?.message || ""))
    }
  }

  // --- Variant Form Handlers (for adding new codes) ---
  const initVariantForm = (buyBrandId, imageUrl = "", categoryId = "") => {
    if (!variantForms[buyBrandId]) {
      setVariantForms((prev) => ({
        ...prev,
        [buyBrandId]: {
          variant_name: "",
          rate: "",
          value: "", // Add value field
          quantity: 1,
          codes: [""],
          image_url: imageUrl, // Inherit from brand for new codes
          category_id: categoryId, // Inherit from brand for new codes
          isExistingVariant: false, // Flag to indicate if this is an existing variant
          existingVariantKey: "", // Key to identify existing variant
        },
      }))
    }
  }

  const handleVariantFormChange = (buyBrandId, field, value) => {
    setVariantForms((prev) => {
      const currentForm = prev[buyBrandId] || {
        variant_name: "",
        rate: "",
        value: "",
        quantity: 1,
        codes: [""],
        image_url: "",
        category_id: "",
        isExistingVariant: false,
        existingVariantKey: "",
      }

      if (field === "quantity") {
        const quantity = Math.max(1, Number.parseInt(value) || 1)
        const currentCodes = currentForm.codes || []
        const newCodes = []

        // Adjust codes array based on quantity
        for (let i = 0; i < quantity; i++) {
          newCodes.push(currentCodes[i] || "")
        }

        return {
          ...prev,
          [buyBrandId]: {
            ...currentForm,
            quantity,
            codes: newCodes,
          },
        }
      }

      return {
        ...prev,
        [buyBrandId]: {
          ...currentForm,
          [field]: value,
        },
      }
    })
  }

  const handleVariantCodeChange = (buyBrandId, index, value) => {
    setVariantForms((prev) => {
      const currentForm = prev[buyBrandId] || {
        variant_name: "",
        rate: "",
        value: "",
        quantity: 1,
        codes: [""],
        image_url: "",
        category_id: "",
        isExistingVariant: false,
        existingVariantKey: "",
      }

      const newCodes = [...currentForm.codes]
      newCodes[index] = value

      return {
        ...prev,
        [buyBrandId]: {
          ...currentForm,
          codes: newCodes,
        },
      }
    })
  }

  const handleAddVariant = async (e, buyBrandId) => {
    e.preventDefault()
    const form = variantForms[buyBrandId]

    if (!form || !form.variant_name.trim() || !form.rate || !form.value || !form.quantity) {
      setError("Please fill in all variant fields.")
      return
    }

    const validCodes = (form.codes || []).filter((code) => code.trim() !== "")
    if (validCodes.length !== form.quantity) {
      setError(`Please enter all ${form.quantity} gift card codes.`)
      return
    }

    // Check for duplicate codes within the current batch
    const duplicateCodesInBatch = validCodes.filter((code, index) => validCodes.indexOf(code) !== index)
    if (duplicateCodesInBatch.length > 0) {
      setError("Duplicate codes are not allowed in the same batch.")
      return
    }

    // Check if codes already exist in database
    const { data: existingCodes } = await supabase.from("giftcards_buy").select("code").in("code", validCodes)
    if (existingCodes && existingCodes.length > 0) {
      setError(`Some codes already exist in inventory: ${existingCodes.map((c) => c.code).join(", ")}`)
      return
    }

    setAddingVariant((prev) => ({ ...prev, [buyBrandId]: true }))
    setError("")
    setSuccess("")

    try {
      // Create inventory items for each code
      const inventoryData = validCodes.map((code) => ({
        buy_brand_id: buyBrandId,
        variant_name: form.variant_name.trim(),
        rate: Number(form.rate),
        value: Number(form.value),
        code: code.trim(),
        image_url: form.image_url || null,
        category_id: form.category_id,
        sold: false,
      }))

      const { error } = await supabase.from("giftcards_buy").insert(inventoryData)
      if (error) throw error

      const actionText = form.isExistingVariant ? "added to existing variant" : "created"
      setSuccess(`${validCodes.length} gift card codes ${actionText} for variant "${form.variant_name}" successfully!`)

      // Reset form
      setVariantForms((prev) => ({
        ...prev,
        [buyBrandId]: {
          variant_name: "",
          rate: "",
          value: "",
          quantity: 1,
          codes: [""],
          image_url: form.image_url,
          category_id: form.category_id,
          isExistingVariant: false,
          existingVariantKey: "",
        },
      }))

      fetchInventoryItems() // Refresh the individual inventory items
    } catch (err) {
      setError("Failed to add variant: " + (err?.message || ""))
    }
    setAddingVariant((prev) => ({ ...prev, [buyBrandId]: false }))
  }

  // --- Individual Inventory Item CRUD ---
  const startEditItem = (item) => {
    setEditingItem((prev) => ({
      ...prev,
      [item.id]: {
        variant_name: item.variant_name,
        rate: item.rate,
        value: item.value,
        code: item.code,
      },
    }))
  }

  const handleEditItemChange = (itemId, field, value) => {
    setEditingItem((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }))
  }

  const handleEditItem = async (e, itemId) => {
    e.preventDefault()
    const form = editingItem[itemId]

    if (!form || !form.variant_name.trim() || !form.rate || !form.value || !form.code.trim()) {
      setError("Please fill in all item fields.")
      return
    }

    setEditingItemLoading((prev) => ({ ...prev, [itemId]: true }))
    setError("")
    setSuccess("")

    try {
      const { error } = await supabase
        .from("giftcards_buy")
        .update({
          variant_name: form.variant_name.trim(),
          rate: Number(form.rate),
          value: Number(form.value),
          code: form.code.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", itemId)

      if (error) throw error

      setSuccess("Inventory item updated successfully!")
      setEditingItem((prev) => {
        const newState = { ...prev }
        delete newState[itemId]
        return newState
      })
      fetchInventoryItems()
    } catch (err) {
      setError("Failed to update inventory item: " + (err?.message || ""))
    }
    setEditingItemLoading((prev) => ({ ...prev, [itemId]: false }))
  }

  const handleDeleteInventoryItem = async (itemId) => {
    if (!confirm("Are you sure you want to delete this gift card code?")) return

    setError("")
    setSuccess("")

    try {
      const { error } = await supabase.from("giftcards_buy").delete().eq("id", itemId)
      if (error) throw error

      setSuccess("Gift card code deleted successfully!")
      fetchInventoryItems()
    } catch (err) {
      setError("Failed to delete gift card code: " + (err?.message || ""))
    }
  }

  const toggleBrandExpansion = (brandId) => {
    setExpandedBrands((prev) => ({
      ...prev,
      [brandId]: !prev[brandId],
    }))

    // Get brand info from existing buyBrands state
    const brandInfo = buyBrands.find((b) => b.id === brandId)
    if (brandInfo) {
      initVariantForm(brandId, brandInfo.image_url, brandInfo.category_id)
    } else {
      initVariantForm(brandId)
    }
  }

  // Function to populate form with existing variant data
  const populateExistingVariant = (buyBrandId, variantKey, variantName, value, rate) => {
    console.log("Populating existing variant:", { buyBrandId, variantKey, variantName, value, rate })
    const brandInfo = buyBrands.find((b) => b.id === buyBrandId)
    console.log("Brand info found:", brandInfo)
    
    // Ensure the brand is expanded so the form is visible
    setExpandedBrands((prev) => ({
      ...prev,
      [buyBrandId]: true,
    }))
    
    setVariantForms((prev) => {
      const newForm = {
        ...prev,
        [buyBrandId]: {
          variant_name: variantName,
          rate: rate.toString(),
          value: value.toString(),
          quantity: 1,
          codes: [""],
          image_url: brandInfo?.image_url || "",
          category_id: brandInfo?.category_id || "",
          isExistingVariant: true,
          existingVariantKey: variantKey,
        },
      }
      console.log("New variant form state:", newForm)
      return newForm
    })
  }

  // Group inventory items by buy_brand_id, then by variant_name and value
  const groupedInventory = buyBrands.map((brand) => {
    const brandItems = inventoryItems.filter((item) => item.buy_brand_id === brand.id)
    const variantGroups = {}

    brandItems.forEach((item) => {
      const key = `${item.variant_name}_${item.value}` // Group by variant name AND value
      if (!variantGroups[key]) {
        variantGroups[key] = []
      }
      variantGroups[key].push(item)
    })

    const totalCodes = brandItems.length
    const availableCodes = brandItems.filter((item) => !item.sold && !item.assigned_to).length

    return {
      ...brand,
      variantGroups,
      totalCodes,
      availableCodes,
    }
  })

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', width: '100%', overflowX: 'hidden', maxWidth: '100vw' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4" style={{ padding: '0 15px' }}>
        <div>
          <h2 className="mb-1 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>Gift Card Inventory</h2>
          <p className="text-muted mb-0" style={{ fontFamily: 'Inter, sans-serif' }}>
            Manage gift card inventory that the platform sells to users
      </p>
        </div>
        <div className="d-flex gap-2">
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowBrandForm(!showBrandForm)
            setEditingBrand(null)
          }}
          disabled={addingBrand}
            style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
        >
            <i className={`bi ${showBrandForm ? 'bi-x-lg' : 'bi-plus-lg'} me-2`}></i>
            {showBrandForm ? "Cancel" : "Create New Brand"}
        </button>
        {editingBrand && (
            <button 
              className="btn btn-outline-secondary" 
              onClick={() => setEditingBrand(null)}
              style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
            >
              <i className="bi bi-x-lg me-2"></i>
              Cancel Edit
          </button>
        )}
        </div>
      </div>

      {/* Brand Creation/Editing Form */}
      {(showBrandForm || editingBrand) && (
        <div style={{ padding: '0 15px', marginBottom: '2rem' }}>
          <div className="card border shadow-sm" style={{ backgroundColor: '#ffffff', borderRadius: '0' }}>
            <div className="card-header bg-light border-bottom">
              <h5 className="mb-0 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                <i className={`bi ${editingBrand ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>
                {editingBrand ? `Edit Brand: ${editingBrand.name}` : "Create New Buy Brand"}
              </h5>
          </div>
            <div className="card-body p-4">
            <form onSubmit={editingBrand ? handleUpdateBrand : handleAddBrand}>
              <div className="row g-3">
                <div className="col-md-4">
                    <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Brand Name <span className="text-danger">*</span>
                    </label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingBrand ? editingBrand.name : brandForm.name}
                    onChange={(e) =>
                      editingBrand
                        ? handleEditBrandChange("name", e.target.value)
                        : handleBrandFormChange("name", e.target.value)
                    }
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
                    value={editingBrand ? editingBrand.category_id : brandForm.category_id}
                    onChange={(e) =>
                      editingBrand
                        ? handleEditBrandChange("category_id", e.target.value)
                        : handleBrandFormChange("category_id", e.target.value)
                    }
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
                    onChange={editingBrand ? handleEditBrandFileChange : handleBrandFileChange}
                      style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                  />
                  {(editingBrand?.image_file || editingBrand?.image_url) && (
                      <div className="mt-2">
                    <img
                      src={
                        editingBrand?.image_file
                          ? URL.createObjectURL(editingBrand.image_file)
                              : editingBrand.image_url
                      }
                      alt="Preview"
                          style={{ maxWidth: 60, maxHeight: 30, borderRadius: '0' }}
                    />
                      </div>
                  )}
                  {brandForm.image_file && !editingBrand && (
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
                          Processing...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-2"></i>
                          {editingBrand ? "Update Brand" : "Create Buy Brand"}
                        </>
                      )}
                  </button>
                  <button
                    type="button"
                      className="btn btn-outline-secondary ms-2"
                    onClick={() => {
                      editingBrand ? setEditingBrand(null) : setShowBrandForm(false)
                    }}
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
          <span className="ms-2">Loading buy inventory...</span>
        </div>
      ) : (
        <div style={{ padding: '0 15px' }}>
          {groupedInventory.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-3">
                <i className="bi bi-cart fs-1 text-muted"></i>
              </div>
              <h5 className="text-muted fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>No buy brands found</h5>
              <p className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                Create your first buy brand to get started with inventory management
              </p>
            </div>
          ) : (
            <div className="brands-container">
              {groupedInventory.map((brand) => {
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
                              {categoryName} • {Object.keys(brand.variantGroups).length} variants • {brand.availableCodes} available • {brand.totalCodes} total codes
                          </small>
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => {
                            setEditingBrand(brand)
                            setShowBrandForm(false)
                          }}
                            style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                        >
                            <i className="bi bi-pencil me-1"></i>
                          Edit Brand
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => toggleBrandExpansion(brand.id)}
                            style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                        >
                            <i className={`bi ${expandedBrands[brand.id] ? 'bi-chevron-up' : 'bi-chevron-down'} me-1`}></i>
                          {expandedBrands[brand.id] ? "Hide Details" : "Manage Variants"}
                        </button>
                          <button 
                            className="btn btn-sm btn-outline-danger" 
                            onClick={() => handleDeleteBrand(brand.id)}
                            style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                          >
                            <i className="bi bi-trash me-1"></i>
                          Delete Brand
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
                            {variantForms[brand.id]?.isExistingVariant 
                              ? `Add More Codes to Existing Variant: ${variantForms[brand.id]?.variant_name}`
                              : `Add New Variant Codes to ${brand.name}`
                            }
                          </h6>
                          {variantForms[brand.id]?.isExistingVariant && (
                              <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                              Variant details are locked. You can only add new codes to this existing variant.
                            </small>
                          )}
                          {variantForms[brand.id]?.variant_name && (
                            <div className="mt-2">
                                <span className="badge bg-info" style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}>
                                Form Ready: {variantForms[brand.id]?.isExistingVariant ? "Adding to Existing" : "Creating New"}
                              </span>
                            </div>
                          )}
                        </div>
                          <div className="card-body p-3">
                          <form onSubmit={(e) => handleAddVariant(e, brand.id)}>
                            <div className="row g-3 mb-3">
                                <div className="col-md-3">
                                  <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                                    Variant Name <span className="text-danger">*</span>
                                  </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={variantForms[brand.id]?.variant_name || ""}
                                  onChange={(e) => handleVariantFormChange(brand.id, "variant_name", e.target.value)}
                                  required
                                  placeholder="e.g., Standard, Premium"
                                  readOnly={variantForms[brand.id]?.isExistingVariant}
                                    style={{ 
                                      fontFamily: 'Inter, sans-serif', 
                                      borderRadius: '0',
                                      backgroundColor: variantForms[brand.id]?.isExistingVariant ? '#f8f9fa' : '#ffffff'
                                    }}
                                />
                              </div>
                                <div className="col-md-3">
                                  <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                                    Value (USD) <span className="text-danger">*</span>
                                  </label>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={variantForms[brand.id]?.value || ""}
                                  onChange={(e) => handleVariantFormChange(brand.id, "value", e.target.value)}
                                  required
                                  min="0"
                                  step="0.01"
                                  placeholder="25.00"
                                  readOnly={variantForms[brand.id]?.isExistingVariant}
                                    style={{ 
                                      fontFamily: 'Inter, sans-serif', 
                                      borderRadius: '0',
                                      backgroundColor: variantForms[brand.id]?.isExistingVariant ? '#f8f9fa' : '#ffffff'
                                    }}
                                />
                              </div>
                                <div className="col-md-3">
                                  <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                                    Rate (₦ per $1) <span className="text-danger">*</span>
                                  </label>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={variantForms[brand.id]?.rate || ""}
                                  onChange={(e) => handleVariantFormChange(brand.id, "rate", e.target.value)}
                                  required
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  readOnly={variantForms[brand.id]?.isExistingVariant}
                                    style={{ 
                                      fontFamily: 'Inter, sans-serif', 
                                      borderRadius: '0',
                                      backgroundColor: variantForms[brand.id]?.isExistingVariant ? '#f8f9fa' : '#ffffff'
                                    }}
                                />
                              </div>
                                <div className="col-md-3">
                                  <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                                    Quantity <span className="text-danger">*</span>
                                  </label>
                                <input
                                  type="number"
                                  className="form-control"
                                  value={variantForms[brand.id]?.quantity || 1}
                                  onChange={(e) => handleVariantFormChange(brand.id, "quantity", e.target.value)}
                                  required
                                  min="1"
                                  max="20"
                                    style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                                />
                              </div>
                            </div>

                            {/* Dynamic Code Input Fields */}
                            <div className="mb-3">
                                <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                                  Gift Card Codes <span className="text-danger">*</span>
                                </label>
                              <div className="row g-2">
                                {(variantForms[brand.id]?.codes || [""]).map((code, index) => (
                                  <div key={index} className="col-md-3">
                                    <input
                                      type="text"
                                      className="form-control"
                                      placeholder={`Code ${index + 1}`}
                                      value={code}
                                      onChange={(e) => handleVariantCodeChange(brand.id, index, e.target.value)}
                                      required
                                        style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                                    />
                                  </div>
                                ))}
                              </div>
                                <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                                Enter {variantForms[brand.id]?.quantity || 1} unique gift card codes
                              </small>
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
                                    {variantForms[brand.id]?.isExistingVariant ? "Add More Codes" : "Add Variant Codes"}
                                  </>
                                )}
                            </button>
                            <button
                              type="button"
                                className="btn btn-outline-secondary ms-2"
                              onClick={() => {
                                setVariantForms((prev) => ({
                                  ...prev,
                                  [brand.id]: {
                                    variant_name: "",
                                    rate: "",
                                    value: "",
                                    quantity: 1,
                                    codes: [""],
                                    image_url: brand.image_url || "",
                                    category_id: brand.category_id || "",
                                    isExistingVariant: false,
                                    existingVariantKey: "",
                                  },
                                }))
                              }}
                              disabled={addingVariant[brand.id]}
                                style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                            >
                              Clear Form
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* Existing Variants */}
                      {Object.keys(brand.variantGroups).length > 0 && (
                          <div className="card border" style={{ backgroundColor: '#ffffff', borderRadius: '0' }}>
                            <div className="card-header bg-light border-bottom">
                              <h6 className="mb-0 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                                <i className="bi bi-list-ul me-2"></i>
                                Existing Variants ({Object.keys(brand.variantGroups).length})
                              </h6>
                          </div>
                            <div className="card-body p-0">
                            {Object.entries(brand.variantGroups).map(([variantKey, variants]) => (
                              <div key={variantKey} className="mb-4">
                                  <div className="d-flex justify-content-between align-items-center mb-3 p-3 border-bottom">
                                    <h6 className="text-primary mb-0 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
                                    {variants[0]?.variant_name} (Value: ${variants[0]?.value} | Rate: ₦{variants[0]?.rate})
                                  </h6>
                                  <button
                                    className="btn btn-sm btn-outline-success"
                                    onClick={() => {
                                      populateExistingVariant(
                                        brand.id, 
                                        variantKey, 
                                        variants[0]?.variant_name, 
                                        variants[0]?.value, 
                                        variants[0]?.rate
                                      )
                                    }}
                                      style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                                  >
                                      <i className="bi bi-plus-lg me-1"></i>
                                    Add More Codes
                                  </button>
                                </div>
                                  <div className="table-container">
                                    <table className="table table-hover mb-0" style={{ fontFamily: 'Inter, sans-serif', width: '100%', tableLayout: 'fixed' }}>
                                      <thead className="table-light">
                                      <tr>
                                          <th className="px-3 py-3 fw-semibold text-start" style={{ width: '20%', fontFamily: 'Inter, sans-serif' }}>Code</th>
                                          <th className="px-3 py-3 fw-semibold text-start" style={{ width: '15%', fontFamily: 'Inter, sans-serif' }}>Value (USD)</th>
                                          <th className="px-3 py-3 fw-semibold text-start" style={{ width: '15%', fontFamily: 'Inter, sans-serif' }}>Rate (₦ per $1)</th>
                                          <th className="px-3 py-3 fw-semibold text-start" style={{ width: '15%', fontFamily: 'Inter, sans-serif' }}>Status</th>
                                          <th className="px-3 py-3 fw-semibold text-start" style={{ width: '15%', fontFamily: 'Inter, sans-serif' }}>Created</th>
                                          <th className="px-3 py-3 fw-semibold text-start" style={{ width: '20%', fontFamily: 'Inter, sans-serif' }}>Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {variants.map((variant) => (
                                          <tr key={variant.id} className="border-bottom">
                                            <td className="px-3 py-3 text-start">
                                            {editingItem[variant.id] ? (
                                              <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={editingItem[variant.id].code}
                                                onChange={(e) =>
                                                  handleEditItemChange(variant.id, "code", e.target.value)
                                                }
                                                required
                                                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                                              />
                                            ) : (
                                                <code className="text-truncate" style={{ fontFamily: 'Inter, sans-serif' }} title={variant.code}>
                                                  {variant.code}
                                                </code>
                                            )}
                                          </td>
                                            <td className="px-3 py-3 text-start">
                                            {editingItem[variant.id] ? (
                                              <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                value={editingItem[variant.id].value}
                                                onChange={(e) =>
                                                  handleEditItemChange(variant.id, "value", e.target.value)
                                                }
                                                required
                                                min="0"
                                                step="0.01"
                                                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                                              />
                                            ) : (
                                                <div className="fw-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                                                  ${variant.value}
                                                </div>
                                            )}
                                          </td>
                                            <td className="px-3 py-3 text-start">
                                            {editingItem[variant.id] ? (
                                              <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                value={editingItem[variant.id].rate}
                                                onChange={(e) =>
                                                  handleEditItemChange(variant.id, "rate", e.target.value)
                                                }
                                                required
                                                min="0"
                                                step="0.01"
                                                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                                              />
                                            ) : (
                                                <div className="fw-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                                                  ₦{variant.rate}
                                                </div>
                                            )}
                                          </td>
                                            <td className="px-3 py-3 text-start">
                                              <span className={`badge ${variant.sold ? "bg-danger" : "bg-success"}`} 
                                                    style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}>
                                              {variant.sold ? "Sold" : "Available"}
                                            </span>
                                          </td>
                                            <td className="px-3 py-3 text-start">
                                              <div className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                                            {variant.created_at
                                              ? new Date(variant.created_at).toLocaleDateString()
                                              : "-"}
                                              </div>
                                          </td>
                                            <td className="px-3 py-3 text-start">
                                            {editingItem[variant.id] ? (
                                              <div className="d-flex gap-1">
                                                <button
                                                  className="btn btn-sm btn-success"
                                                  onClick={(e) => handleEditItem(e, variant.id)}
                                                  disabled={editingItemLoading[variant.id]}
                                                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                                                >
                                                    <i className="bi bi-check-lg me-1"></i>
                                                  Save
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                  onClick={() =>
                                                    setEditingItem((prev) => {
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
                                                  onClick={() => startEditItem(variant)}
                                                  disabled={variant.sold}
                                                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                                                >
                                                    <i className="bi bi-pencil me-1"></i>
                                                  Edit
                                                </button>
                                                <button
                                                  className="btn btn-sm btn-outline-danger"
                                                  onClick={() => handleDeleteInventoryItem(variant.id)}
                                                  disabled={variant.sold}
                                                  title={variant.sold ? "Cannot delete sold items" : "Delete this code"}
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
                            ))}
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

export default GiftcardInventory
