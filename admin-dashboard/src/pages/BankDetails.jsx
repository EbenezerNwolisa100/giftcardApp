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
    } else {
      setBankDetails(result.data);
      setMessage("Bank details saved!");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: 24 }}>
      <h2>Admin Bank Details</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Bank Name</label>
          <input
            type="text"
            name="bank_name"
            value={form.bank_name}
            onChange={handleChange}
            required
            style={{ width: "100%", marginBottom: 12 }}
          />
        </div>
        <div>
          <label>Account Number</label>
          <input
            type="text"
            name="account_number"
            value={form.account_number}
            onChange={handleChange}
            required
            style={{ width: "100%", marginBottom: 12 }}
          />
        </div>
        <div>
          <label>Account Name</label>
          <input
            type="text"
            name="account_name"
            value={form.account_name}
            onChange={handleChange}
            required
            style={{ width: "100%", marginBottom: 12 }}
          />
        </div>
        <button type="submit" disabled={loading}>
          {bankDetails ? "Update" : "Save"}
        </button>
      </form>
      {message && <div style={{ marginTop: 16 }}>{message}</div>}
    </div>
  );
};

export default BankDetails; 