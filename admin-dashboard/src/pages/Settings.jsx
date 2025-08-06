import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Settings() {
  const [fee, setFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "processing_fee_flat")
        .single();
      if (error) {
        setError("Failed to fetch processing fee: " + error.message);
      } else if (data) {
        setFee(Number(data.value));
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess("");
    setError("");
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "processing_fee_flat", value: String(fee) }, { onConflict: ["key"] });
    if (error) {
      setError("Failed to update processing fee: " + error.message);
    } else {
      setSuccess("Processing fee updated successfully!");
    }
    setSaving(false);
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', width: '100%', overflowX: 'hidden', maxWidth: '100vw' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4" style={{ padding: '0 15px' }}>
        <div>
          <h2 className="mb-1 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>App Settings</h2>
          <p className="text-muted mb-0" style={{ fontFamily: 'Inter, sans-serif' }}>
            Configure application settings and preferences
          </p>
        </div>
      </div>

      {/* Settings Form */}
      <div style={{ padding: '0 15px' }}>
        <div className="card border shadow-sm" style={{ backgroundColor: '#ffffff', borderRadius: '0', maxWidth: '600px' }}>
          <div className="card-header bg-light border-bottom">
            <h5 className="mb-0 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
              <i className="bi bi-gear me-2"></i>
              Processing Fee Configuration
            </h5>
          </div>
          <div className="card-body p-4">
            <form onSubmit={handleSave}>
              <div className="mb-4">
                <label className="form-label fw-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Processing Fee (₦) <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text" style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}>₦</span>
                  <input
                    type="number"
                    className="form-control"
                    value={fee}
                    onChange={e => setFee(Number(e.target.value))}
                    min={0}
                    step={1}
                    required
                    disabled={loading || saving}
                    placeholder="Enter processing fee amount"
                    style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                  />
                </div>
                <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                  This fee will be applied to all transactions processed through the platform.
                </small>
              </div>

              {/* Error and Success Messages */}
              {error && (
                <div className="alert alert-danger py-2 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}
              {success && (
                <div className="alert alert-success py-2 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <i className="bi bi-check-circle me-2"></i>
                  {success}
                </div>
              )}

              {/* Action Buttons */}
              <div className="d-flex gap-2 pt-3 border-top">
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading || saving}
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                >
                  {saving ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-2"></i>
                      Save Settings
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline-secondary"
                  onClick={() => window.location.reload()}
                  disabled={loading || saving}
                  style={{ fontFamily: 'Inter, sans-serif', borderRadius: '0' }}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Additional Settings Section */}
        <div className="card border shadow-sm mt-4" style={{ backgroundColor: '#ffffff', borderRadius: '0', maxWidth: '600px' }}>
          <div className="card-header bg-light border-bottom">
            <h5 className="mb-0 fw-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
              <i className="bi bi-info-circle me-2"></i>
              Settings Information
            </h5>
          </div>
          <div className="card-body p-4">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="d-flex align-items-center p-3 bg-light" style={{ borderRadius: '0' }}>
                  <i className="bi bi-currency-exchange fs-4 text-primary me-3"></i>
                  <div>
                    <h6 className="fw-bold mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Processing Fee</h6>
                    <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Applied to all transactions
                    </small>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex align-items-center p-3 bg-light" style={{ borderRadius: '0' }}>
                  <i className="bi bi-shield-check fs-4 text-success me-3"></i>
                  <div>
                    <h6 className="fw-bold mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Security</h6>
                    <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Settings are securely stored
                    </small>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex align-items-center p-3 bg-light" style={{ borderRadius: '0' }}>
                  <i className="bi bi-lightning fs-4 text-warning me-3"></i>
                  <div>
                    <h6 className="fw-bold mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Real-time</h6>
                    <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Changes apply immediately
                    </small>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="d-flex align-items-center p-3 bg-light" style={{ borderRadius: '0' }}>
                  <i className="bi bi-people fs-4 text-info me-3"></i>
                  <div>
                    <h6 className="fw-bold mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Global</h6>
                    <small className="text-muted" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Affects all users
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-start py-5" style={{ padding: '0 15px' }}>
            <div className="spinner-border text-primary" role="status"></div>
            <span className="ms-2">Loading settings...</span>
          </div>
        )}
      </div>
    </div>
  );
}
