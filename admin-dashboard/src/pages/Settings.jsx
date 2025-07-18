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
    <div className="container py-4">
      <h2 className="mb-4">App Settings</h2>
      <form onSubmit={handleSave} style={{ maxWidth: 400 }}>
        <div className="mb-3">
          <label className="form-label">Processing Fee (₦)</label>
          <input
            type="number"
            className="form-control"
            value={fee}
            onChange={e => setFee(Number(e.target.value))}
            min={0}
            step={1}
            required
            disabled={loading || saving}
          />
        </div>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        {success && <div className="alert alert-success py-2">{success}</div>}
        <button type="submit" className="btn btn-primary" disabled={loading || saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}
