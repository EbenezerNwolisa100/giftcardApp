import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Image,
} from "react-native";
import { supabase } from "./supabaseClient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import Modal from 'react-native-modal';
import { useTheme } from "./ThemeContext";

const { width, height } = Dimensions.get("window");

export default function FundWallet() {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState('paystack');
  const [loading, setLoading] = useState(false);
  const [paystackLoading, setPaystackLoading] = useState(false);
  const [showPaystackModal, setShowPaystackModal] = useState(false);
  const [bankDetails, setBankDetails] = useState(null);
  const [bankDetailsLoading, setBankDetailsLoading] = useState(false);
  const [proofImage, setProofImage] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [processingFee, setProcessingFee] = useState(0);
  const navigation = useNavigation();
  const { theme } = useTheme();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'processing_fee_flat')
        .single();
      if (data) setProcessingFee(Number(data.value));
    })();
  }, []);

  // Fetch admin bank details if manual transfer is selected
  useFocusEffect(
    React.useCallback(() => {
      if (paymentMethod === 'manual_transfer') {
        setBankDetailsLoading(true);
        (async () => {
          const { data, error } = await supabase
            .from('admin_bank_details')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();
          setBankDetails(data || null);
          setBankDetailsLoading(false);
          if (error) {
            console.log('Error fetching admin bank details:', error);
          }
        })();
      }
    }, [paymentMethod])
  );

  // Image picker for proof of payment
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProofImage(result.assets[0]);
    }
  };

  // Handle Paystack payment
  const handlePaystack = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount.");
      return;
    }

    setPaystackLoading(true);
    // Simulate Paystack payment success after 2s
    setTimeout(async () => {
      setPaystackLoading(false);
      setShowPaystackModal(false);
      setFeedback('Paystack payment successful! Funding wallet...');
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("You must be logged in to fund your wallet.");

        const enteredAmount = Number(amount) || 0;
        const fee = processingFee;
        const totalToPay = enteredAmount + fee;

        // Create wallet transaction
        const { error: txError } = await supabase.from("wallet_transactions").insert([
          {
            user_id: user.id,
            type: "fund",
            amount: enteredAmount,
            fee: fee,
            status: "completed",
            payment_method: 'paystack',
            reference: 'ps_ref_' + Date.now(),
            description: `Wallet funded via Paystack (fee: ₦${fee})`,
          }
        ]);

        if (txError) throw txError;

        // Update user balance
        const { data: profile } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", user.id)
          .single();

        const newBalance = (profile?.balance || 0) + enteredAmount;
        const { error: balanceError } = await supabase
          .from("profiles")
          .update({ balance: newBalance })
          .eq("id", user.id);

        if (balanceError) throw balanceError;

        Alert.alert("Success", "Wallet funded successfully!", [
          { text: "OK", onPress: () => navigation.goBack() }
        ]);
      } catch (e) {
        Alert.alert("Error", e.message || "Failed to fund wallet.");
      }
      setFeedback("");
    }, 2000);
  };

  // Handle manual transfer
  const handleManualTransfer = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount.");
      return;
    }

    if (!proofImage) {
      Alert.alert("Error", "Please upload proof of payment.");
      return;
    }

    setLoading(true);
    setFeedback('Uploading proof and submitting request...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to fund your wallet.");

      const enteredAmount = Number(amount) || 0;
      const fee = processingFee;
      const totalToPay = enteredAmount + fee;

      // Upload image to Supabase Storage
      const ext = proofImage.uri.split('.').pop();
      const fileName = `proofs/${user.id}_${Date.now()}.${ext}`;
      const response = await fetch(proofImage.uri);
      const blob = await response.blob();
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('proofs')
        .upload(fileName, blob, { contentType: proofImage.type || 'image/jpeg' });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('proofs').getPublicUrl(fileName);

      // Create wallet transaction
      const { error: txError } = await supabase.from("wallet_transactions").insert([
        {
          user_id: user.id,
          type: "fund",
          amount: enteredAmount,
          fee: fee,
          status: "pending",
          payment_method: 'manual_transfer',
          proof_of_payment_url: publicUrl,
          description: `Wallet funding via bank transfer (fee: ₦${fee})`,
        }
      ]);

      if (txError) throw txError;

      setLoading(false);
      setFeedback("");
      Alert.alert("Success", "Funding request submitted! Awaiting admin approval.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      setLoading(false);
      setFeedback("");
      Alert.alert("Error", e.message || "Failed to submit funding request.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      <LinearGradient colors={[theme.primary, theme.secondary]} style={styles.backgroundGradient} />
      
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Fund Wallet</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Amount Input */}
          <View style={[styles.amountCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.amountLabel, { color: theme.text }]}>Amount to Fund (₦)</Text>
            <TextInput
              style={[styles.amountInput, { 
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border
              }]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="Enter amount"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          {/* Processing Fee Display */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: theme.text }}>
              Processing Fee: ₦{processingFee.toLocaleString()}
            </Text>
            <Text style={{ color: theme.text, fontWeight: 'bold' }}>
              Total to Pay: ₦{(Number(amount || 0) + processingFee).toLocaleString()}
            </Text>
          </View>

          {/* Payment Method Selector */}
          <View style={styles.paymentSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Payment Method</Text>
            <View style={styles.paymentMethods}>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  { backgroundColor: theme.card },
                  paymentMethod === 'paystack' && styles.methodButtonActive
                ]}
                onPress={() => { 
                  setPaymentMethod('paystack'); 
                  setFeedback('You selected Paystack. You will pay online and your wallet will be funded instantly.'); 
                }}
              >
                <Ionicons name="card" size={24} color={paymentMethod === 'paystack' ? "#fff" : theme.accent} />
                <Text style={[styles.methodButtonText, { color: paymentMethod === 'paystack' ? "#fff" : theme.text }]}>
                  Paystack
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  { backgroundColor: theme.card },
                  paymentMethod === 'manual_transfer' && styles.methodButtonActive
                ]}
                onPress={() => { 
                  setPaymentMethod('manual_transfer'); 
                  setFeedback('You selected Manual Transfer. You must transfer to the admin account and upload proof. Your wallet will be funded after admin approval.'); 
                }}
              >
                <Ionicons name="bank" size={24} color={paymentMethod === 'manual_transfer' ? "#fff" : theme.accent} />
                <Text style={[styles.methodButtonText, { color: paymentMethod === 'manual_transfer' ? "#fff" : theme.text }]}>
                  Bank Transfer
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Feedback */}
          {feedback ? (
            <View style={[styles.feedbackCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.feedbackText, { color: theme.text }]}>{feedback}</Text>
            </View>
          ) : null}

          {/* Manual Transfer Details */}
          {paymentMethod === 'manual_transfer' && (
            <>
              {bankDetailsLoading ? (
                <Text style={{ color: theme.text, textAlign: 'center', marginBottom: 16 }}>
                  Loading admin bank details...
                </Text>
              ) : bankDetails ? (
                <View style={[styles.bankCard, { backgroundColor: theme.card }]}> 
                  <Text style={[styles.bankTitle, { color: theme.text }]}>Transfer to:</Text>
                  <View style={styles.bankDetails}>
                    <Text style={[styles.bankDetail, { color: theme.text }]}>Bank: {bankDetails.bank_name}</Text>
                    <Text style={[styles.bankDetail, { color: theme.text }]}>Account Name: {bankDetails.account_name}</Text>
                    <Text style={[styles.bankDetail, { color: theme.text }]}>Account Number: {bankDetails.account_number}</Text>
                  </View>
                </View>
              ) : (
                <Text style={{ color: 'red', marginBottom: 16, fontWeight: 'bold', textAlign: 'center' }}>
                  Admin bank details not available. Please contact support.
                </Text>
              )}
              {/* Prominent upload proof area */}
              <View style={[styles.bankCard, { backgroundColor: theme.card, borderWidth: 2, borderColor: '#E3D095' }]}> 
                <TouchableOpacity style={[styles.uploadButton, { borderWidth: 2, borderColor: '#E3D095', backgroundColor: '#fff' }]} onPress={pickImage}>
                  <LinearGradient colors={[theme.accent, theme.secondary]} style={styles.uploadGradient}>
                    <Ionicons name="camera" size={24} color="#fff" />
                    <Text style={[styles.uploadText, { fontSize: 16 }]}>
                      {proofImage ? 'Change Proof of Payment' : 'Tap to Upload Proof of Payment'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                {proofImage && (
                  <View style={styles.imagePreview}>
                    <Text style={[styles.previewText, { color: theme.textSecondary }]}>Proof of Payment:</Text>
                    <Image source={{ uri: proofImage.uri }} style={styles.previewImage} />
                  </View>
                )}
              </View>
            </>
          )}

          {/* Submit Button */}
          {paymentMethod === 'paystack' ? (
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={() => setShowPaystackModal(true)}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient colors={[theme.accent, theme.secondary]} style={styles.buttonGradient}>
                <Text style={styles.submitButtonText}>Pay with Paystack</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleManualTransfer}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient colors={[theme.accent, theme.secondary]} style={styles.buttonGradient}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Submit Proof & Request</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Paystack Modal */}
          <Modal isVisible={showPaystackModal} onBackdropPress={() => setShowPaystackModal(false)}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Pay with Paystack</Text>
              <Text style={[styles.modalText, { color: theme.textSecondary }]}>
                This is a demo popup. Integrate your Paystack payment here.
              </Text>
              {paystackLoading ? (
                <ActivityIndicator color={theme.accent} size="large" />
              ) : (
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.accent }]}
                  onPress={handlePaystack}
                >
                  <Text style={styles.modalButtonText}>Simulate Paystack Payment</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowPaystackModal(false)}>
                <Text style={[styles.modalCancel, { color: theme.accent }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: height,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 40,
    marginBottom: 32,
  },
  backButton: {
    paddingVertical: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  placeholder: {
    width: 40,
  },
  amountCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  amountInput: {
    fontSize: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  paymentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  paymentMethods: {
    flexDirection: "row",
    gap: 12,
  },
  methodButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  methodButtonActive: {
    borderColor: "#E3D095",
    backgroundColor: "#483AA0",
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
  },
  feedbackCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bankCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  bankTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  bankDetails: {
    marginBottom: 16,
  },
  bankDetail: {
    fontSize: 14,
    marginBottom: 4,
  },
  uploadButton: {
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
  },
  uploadGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  uploadText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  imagePreview: {
    marginTop: 12,
  },
  previewText: {
    fontSize: 14,
    marginBottom: 8,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
    elevation: 8,
    shadowColor: "#7965C1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 12,
  },
  modalText: {
    marginBottom: 16,
    textAlign: "center",
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalCancel: {
    marginTop: 8,
  },
}); 