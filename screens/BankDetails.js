import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar, Modal } from 'react-native';
import { supabase } from './supabaseClient';
import CustomDropdown from './CustomDropdown';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const NIGERIAN_BANKS = [
  'Access Bank', 'GTBank', 'Zenith Bank', 'UBA', 'First Bank', 'Fidelity Bank',
  'Union Bank', 'Sterling Bank', 'Ecobank', 'Stanbic IBTC', 'Polaris Bank', 'Wema Bank',
];

export default function BankDetails() {
  const [bankForm, setBankForm] = useState({ bank_name: NIGERIAN_BANKS[0], account_number: '', account_name: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    const fetchBank = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data: bankData } = await supabase.from('user_banks').select('*').eq('user_id', user.id).single();
      if (bankData) {
        setBankForm({
          bank_name: bankData.bank_name,
          account_number: bankData.account_number,
          account_name: bankData.account_name,
        });
      }
      setLoading(false);
    };
    fetchBank();
  }, []);

  const handleBankFormChange = (field, value) => {
    setBankForm(prev => ({ ...prev, [field]: value }));
  };

  const handleBankSave = async () => {
    if (!bankForm.account_number || !bankForm.account_name) {
      setModalMessage('Please fill in all bank details.');
      setModalVisible(true);
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }
    const { error } = await supabase.from('user_banks').upsert({
      user_id: user.id,
      bank_name: bankForm.bank_name,
      account_number: bankForm.account_number,
      account_name: bankForm.account_name,
    });
    setSaving(false);
    if (error) {
      setModalMessage(error.message);
      setModalVisible(true);
    } else {
      setModalMessage('Bank details saved!');
      setModalVisible(true);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0E2148" />
        <ActivityIndicator size="large" color="#7965C1" />
        <Text style={styles.loadingText}>Loading bank details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E2148" />
      <LinearGradient colors={["#0E2148", "#483AA0"]} style={styles.backgroundGradient} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bank Details</Text>
        <View style={styles.placeholder} />
      </View>
      <View style={styles.formCard}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Bank Name</Text>
          <CustomDropdown
            options={NIGERIAN_BANKS.map(b => ({ label: b, value: b }))}
            value={bankForm.bank_name}
            onSelect={v => handleBankFormChange('bank_name', v)}
            placeholder="Select bank"
            style={{ marginBottom: 8 }}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Account Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter account number"
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={bankForm.account_number}
            onChangeText={v => handleBankFormChange('account_number', v)}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Account Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter account name"
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={bankForm.account_name}
            onChangeText={v => handleBankFormChange('account_name', v)}
          />
        </View>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleBankSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.saveButtonGradient}>
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>Save Bank Details</Text>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
      {/* Custom Modal for errors and confirmations */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => {
        setModalVisible(false);
        if (modalMessage === 'Bank details saved!') navigation.goBack();
      }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => {
              setModalVisible(false);
              if (modalMessage === 'Bank details saved!') navigation.goBack();
            }}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0E2148" },
  backgroundGradient: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  loadingContainer: { flex: 1, backgroundColor: "#0E2148", justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#fff", fontSize: 16, marginTop: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 40, marginBottom: 0 },
  backButton: { paddingLeft: 16 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  placeholder: { width: 40 },
  formCard: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 20, padding: 24, marginHorizontal: 16, marginTop: 16 },
  inputContainer: { marginBottom: 20 },
  inputLabel: { color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 8 },
  pickerWrapper: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  picker: { color: "#fff", height: 50 },
  input: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 12, padding: 16, color: "#fff", fontSize: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  saveButton: { borderRadius: 12, overflow: "hidden", marginTop: 8 },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, paddingHorizontal: 24 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold", marginRight: 8 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    width: '80%',
  },
  modalMessage: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#7965C1',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 