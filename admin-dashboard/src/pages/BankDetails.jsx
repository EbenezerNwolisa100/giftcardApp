import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const BankDetails = () => {
  const [bankDetails, setBankDetails] = useState(null);
  const [form, setForm] = useState({
    bank_name: "",
    account_number: "",
    account_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"

  // Fetch current bank details
  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("admin_bank_details")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();
      if (data) {
        setBankDetails(data);
        setForm({
          bank_name: data.bank_name,
          account_number: data.account_number,
          account_name: data.account_name,
        });
      }
      setLoading(false);
    };
    fetchDetails();
  }, []);

  // Handle form input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Save or update details
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("");
    
    let result;
    if (bankDetails) {
      // Update
      result = await supabase
        .from("admin_bank_details")
        .update({
          bank_name: form.bank_name,
          account_number: form.account_number,
          account_name: form.account_name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bankDetails.id)
        .select()
        .single();
    } else {
      // Insert
      result = await supabase
        .from("admin_bank_details")
        .insert([form])
        .select()
        .single();
    }
    
    if (result.error) {
      setMessage("Error saving details: " + result.error.message);
      setMessageType("error");
    } else {
      setBankDetails(result.data);
      setMessage("Bank details saved successfully!");
      setMessageType("success");
    }
    setLoading(false);
  };

  if (loading && !bankDetails) {
    return (
      <div className="text-start py-5" style={{ padding: '0 15px' }}>
        <div className="spinner-border text-primary" role="status"></div>
        <span className="ms-2">Loading bank details...</span>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4" style={{ padding: '0 15px' }}>
        <div>
          <h2 className="mb-1 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>Bank Details</h2>
          <p className="text-muted mb-0" style={{ fontFamily: 'Inter, sans-serif' }}>
            Manage admin bank account information for withdrawals
          </p>
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: '0 15px' }}>
        <div className="card border shadow-sm" style={{ backgroundColor: '#ffffff', borderRadius: '0', maxWidth: '600px' }}>
          <div className="card-body p-4">
            <div className="d-flex align-items-center mb-4">
              <div className="d-inline-flex align-items-center justify-content-center bg-primary rounded-3 me-3" 
                   style={{width: '40px', height: '40px'}}>
                <i className="bi bi-bank text-white fs-5"></i>
              </div>
              <div>
                <h5 className="fw-bold mb-0" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {bankDetails ? 'Update Bank Details' : 'Add Bank Details'}
                </h5>
                <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {bankDetails ? 'Modify existing bank information' : 'Set up new bank account details'}
                </small>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Bank Name
                </label>
                <input
                  type="text"
                  name="bank_name"
                  className="form-control"
                  value={form.bank_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Access Bank, GT Bank, First Bank"
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Account Number
                </label>
                <input
                  type="text"
                  name="account_number"
                  className="form-control"
                  value={form.account_number}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 0123456789"
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Account Name
                </label>
                <input
                  type="text"
                  name="account_name"
                  className="form-control"
                  value={form.account_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., GiftYard Admin"
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                />
              </div>

              {/* Message Alert */}
              {message && (
                <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'} py-2 mb-3`} 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                  <i className={`bi ${messageType === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-2`}></i>
                  {message}
                </div>
              )}

              {/* Action Buttons */}
              <div className="d-flex gap-2 pt-3 border-top">
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading}
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                >
                  {loading ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      {bankDetails ? 'Updating...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <i className={`bi ${bankDetails ? 'bi-arrow-clockwise' : 'bi-check-lg'} me-2`}></i>
                      {bankDetails ? 'Update Details' : 'Save Details'}
                    </>
                  )}
                </button>
                
                {bankDetails && (
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setForm({
                        bank_name: bankDetails.bank_name,
                        account_number: bankDetails.account_number,
                        account_name: bankDetails.account_name,
                      });
                      setMessage("");
                      setMessageType("");
                    }}
                    style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                  >
                    <i className="bi bi-arrow-counterclockwise me-2"></i>
                    Reset
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Current Details Display */}
        {bankDetails && (
          <div className="card border shadow-sm mt-4" style={{ backgroundColor: '#ffffff', borderRadius: '0', maxWidth: '600px' }}>
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                <i className="bi bi-info-circle me-2"></i>
                Current Bank Details
              </h6>
              <div className="row">
                <div className="col-md-4">
                  <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>Bank Name</small>
                  <div className="fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {bankDetails.bank_name}
                  </div>
                </div>
                <div className="col-md-4">
                  <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>Account Number</small>
                  <div className="fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {bankDetails.account_number}
                  </div>
                </div>
                <div className="col-md-4">
                  <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>Account Name</small>
                  <div className="fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {bankDetails.account_name}
                  </div>
                </div>
              </div>
              {bankDetails.updated_at && (
                <div className="mt-3 pt-3 border-top">
                  <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Last updated: {new Date(bankDetails.updated_at).toLocaleString()}
                  </small>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankDetails; 