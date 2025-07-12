import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from "react-native";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { supabase } from "./supabaseClient";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import Modal from 'react-native-modal';

const { width, height } = Dimensions.get("window");

export default function BuyGiftcardForm() {
  const { card } = useRoute().params;
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [bankDetails, setBankDetails] = useState(null);
  const [proofImage, setProofImage] = useState(null);
  const [showPaystackModal, setShowPaystackModal] = useState(false);
  const [paystackLoading, setPaystackLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [userBalance, setUserBalance] = useState(0);
  // Add state for amount and quantity
  const [amount, setAmount] = useState(card.value.toString());
  const [quantity, setQuantity] = useState('1');

  // Fetch user balance and admin bank details
  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Get user balance
          const { data: profile } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', user.id)
            .single();
          setUserBalance(profile?.balance || 0);
        }

        // Fetch admin bank details if manual transfer is selected
        if (paymentMethod === 'manual_transfer') {
          const { data, error } = await supabase
            .from('admin_bank_details')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();
          if (data) setBankDetails(data);
        }
      })();
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

  // Handle Paystack payment (placeholder popup)
  const handlePaystack = async () => {
    setPaystackLoading(true);
    // Simulate Paystack payment success after 2s
    setTimeout(async () => {
      setPaystackLoading(false);
      setShowPaystackModal(false);
      setFeedback('Paystack payment successful! Completing transaction...');
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("You must be logged in to buy a gift card.");
        const rate = 1; // Change this if you have a different sell rate
        const total = Number(amount) * Number(quantity) * rate;
        const { error } = await supabase.from("giftcard_transactions").insert([
          {
            user_id: user.id,
            type: "buy",
            giftcard_inventory_id: card.id,
            brand_id: card.brand_id,
            brand_name: card.brand_name,
            amount: Number(amount) * Number(quantity),
            rate,
            total,
            status: "completed",
            payment_method: 'paystack',
            paystack_reference: 'ps_ref_' + Date.now(),
            card_code: card.code,
            image_url: card.image_url,
            created_at: new Date().toISOString(),
          }
        ]);
        if (error) {
          Alert.alert("Transaction Error", error.message);
        } else {
          Alert.alert("Success", "Your order has been placed and payment confirmed!", [
            { text: "OK", onPress: () => navigation.goBack() }
          ]);
        }
        const { error: updateError } = await supabase
          .from("giftcard_inventory")
          .update({ sold: true })
          .eq("id", card.id);
        if (updateError) {
          Alert.alert("Warning", "Transaction succeeded but failed to mark card as sold. Please contact support.");
        }
      } catch (e) {
        Alert.alert("Error", e.message || "Failed to place order.");
      }
      setFeedback("");
    }, 2000);
  };

  // Handle manual transfer
  const handleManualTransfer = async () => {
    setLoading(true);
    setFeedback('Uploading proof and submitting transaction...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to buy a gift card.");
      if (!proofImage) throw new Error("Please upload proof of payment.");
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
      const rate = 1; // Change this if you have a different sell rate
      const total = Number(amount) * Number(quantity) * rate;
      const { error } = await supabase.from("giftcard_transactions").insert([
        {
          user_id: user.id,
          type: "buy",
          giftcard_inventory_id: card.id,
          brand_id: card.brand_id,
          brand_name: card.brand_name,
          amount: Number(amount) * Number(quantity),
          rate,
          total,
          status: "pending",
          payment_method: 'manual_transfer',
          proof_of_payment_url: publicUrl,
          card_code: card.code,
          image_url: card.image_url,
          created_at: new Date().toISOString(),
        }
      ]);
      setLoading(false);
      setFeedback("");
      if (error) {
        Alert.alert("Transaction Error", error.message);
      } else {
        Alert.alert("Success", "Your order has been placed! Awaiting admin approval.", [
          { text: "OK", onPress: () => navigation.goBack() }
        ]);
      }
      const { error: updateError2 } = await supabase
        .from("giftcard_inventory")
        .update({ sold: true })
        .eq("id", card.id);
      if (updateError2) {
        Alert.alert("Warning", "Transaction succeeded but failed to mark card as sold. Please contact support.");
      }
    } catch (e) {
      setLoading(false);
      setFeedback("");
      Alert.alert("Error", e.message || "Failed to place order.");
    }
  };

  // Handle wallet payment
  const handleWalletPayment = async () => {
    const totalAmount = Number(amount) * Number(quantity);
    
    if (totalAmount > userBalance) {
      Alert.alert("Insufficient Balance", "You don't have enough funds in your wallet. Please fund your wallet first.");
      return;
    }

    setLoading(true);
    setFeedback('Processing wallet payment...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to buy a gift card.");

      // Calculate total
      const rate = 1; // Change this if you have a different sell rate
      const total = totalAmount * rate;

      // Deduct from wallet
      const newBalance = userBalance - totalAmount;
      const { error: balanceError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", user.id);
      
      if (balanceError) throw balanceError;

      // Create wallet transaction
      const { error: walletTxError } = await supabase.from("wallet_transactions").insert([
        {
          user_id: user.id,
          type: "purchase",
          amount: totalAmount,
          status: "completed",
          payment_method: 'wallet',
          description: `Gift card purchase: ${card.brand_name} - ${card.value}`,
        }
      ]);

      if (walletTxError) throw walletTxError;

      // Create gift card transaction
      const { error } = await supabase.from("giftcard_transactions").insert([
        {
          user_id: user.id,
          type: "buy",
          giftcard_inventory_id: card.id,
          brand_id: card.brand_id,
          brand_name: card.brand_name,
          amount: totalAmount,
          rate,
          total,
          status: "completed",
          payment_method: 'wallet',
          card_code: card.code,
          image_url: card.image_url,
          created_at: new Date().toISOString(),
        }
      ]);

      if (error) throw error;

      // Mark card as sold
      const { error: updateError } = await supabase
        .from("giftcard_inventory")
        .update({ sold: true })
        .eq("id", card.id);

      if (updateError) {
        Alert.alert("Warning", "Transaction succeeded but failed to mark card as sold. Please contact support.");
      }

      setLoading(false);
      setFeedback("");
      Alert.alert("Success", "Gift card purchased successfully using wallet funds!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      setLoading(false);
      setFeedback("");
      Alert.alert("Error", e.message || "Failed to process wallet payment.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E2148" />
      <LinearGradient colors={["#0E2148", "#483AA0"]} style={styles.backgroundGradient} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('BuyGiftcard');
                }
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Buy Gift Card</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Card Info */}
          <View style={styles.cardCard}>
            <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.cardGradient}>
              <View style={styles.cardImageContainer}>
                {card.image_url ? (
                  <Image source={{ uri: card.image_url }} style={styles.cardImage} resizeMode="contain" />
                ) : (
                  <View style={styles.cardImagePlaceholder}>
                    <Text style={styles.cardImagePlaceholderText}>{card.brand_name ? card.brand_name[0] : "?"}</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardBrand}>{card.brand_name}</Text>
                <Text style={styles.cardValue}>${card.value}</Text>
                <Text style={styles.cardCode}>Code: {card.code.slice(0, 4) + "****"}</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Amount and Quantity Inputs */}
          <View style={{ backgroundColor: '#232e4a', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 12 }}>Purchase Details</Text>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#fff', marginBottom: 4 }}>Amount per Card (₦)</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </View>

            <View style={{ marginBottom: 8 }}>
              <Text style={{ color: '#fff', marginBottom: 4 }}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="Enter quantity"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </View>

            <View style={{ backgroundColor: '#483AA0', borderRadius: 8, padding: 12, marginTop: 8 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                Total: ₦{(Number(amount) * Number(quantity)).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Payment Method Selector */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 8 }}>Select Payment Method</Text>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <TouchableOpacity
                style={[styles.methodButton, paymentMethod === 'paystack' && styles.methodButtonActive]}
                onPress={() => { setPaymentMethod('paystack'); setFeedback('You selected Paystack. You will pay online and your order will be completed instantly.'); }}
              >
                <Text style={styles.methodButtonText}>Paystack</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodButton, paymentMethod === 'manual_transfer' && styles.methodButtonActive]}
                onPress={() => { setPaymentMethod('manual_transfer'); setFeedback('You selected Manual Transfer. You must transfer to the admin account and upload proof. Your order will be approved by admin.'); }}
              >
                <Text style={styles.methodButtonText}>Manual Transfer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodButton, paymentMethod === 'wallet' && styles.methodButtonActive]}
                onPress={() => { setPaymentMethod('wallet'); setFeedback(`You selected Wallet. Your wallet balance: ₦${userBalance.toLocaleString()}. Available for purchase.`); }}
              >
                <Text style={styles.methodButtonText}>Wallet</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Wallet Balance Display */}
          {paymentMethod === 'wallet' && (
            <View style={{ backgroundColor: '#232e4a', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 4 }}>Wallet Balance</Text>
              <Text style={{ color: '#00b894', fontSize: 16, fontWeight: 'bold' }}>
                ₦{userBalance.toLocaleString()}
              </Text>
              <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>
                Total Purchase: ₦{(Number(amount) * Number(quantity)).toLocaleString()}
              </Text>
              {Number(amount) * Number(quantity) > userBalance && (
                <Text style={{ color: '#e17055', fontSize: 12, marginTop: 4 }}>
                  Insufficient balance. Please fund your wallet.
                </Text>
              )}
            </View>
          )}

          {/* Feedback for user selection */}
          {feedback ? (
            <View style={{ backgroundColor: '#232e4a', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <Text style={{ color: '#fff' }}>{feedback}</Text>
            </View>
          ) : null}

          {/* Manual Transfer Details */}
          {paymentMethod === 'manual_transfer' && bankDetails && (
            <View style={{ backgroundColor: '#232e4a', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 8 }}>Transfer to:</Text>
              <Text style={{ color: '#fff' }}>Bank: {bankDetails.bank_name}</Text>
              <Text style={{ color: '#fff' }}>Account Name: {bankDetails.account_name}</Text>
              <Text style={{ color: '#fff', marginBottom: 8 }}>Account Number: {bankDetails.account_number}</Text>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{proofImage ? 'Change Proof of Payment' : 'Upload Proof of Payment'}</Text>
              </TouchableOpacity>
              {proofImage && (
                <Image source={{ uri: proofImage.uri }} style={{ width: 120, height: 120, marginTop: 8, borderRadius: 8 }} />
              )}
            </View>
          )}

          {/* Submit Button */}
          {paymentMethod === 'paystack' ? (
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={() => setShowPaystackModal(true)}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.buttonGradient}>
                <Text style={styles.submitButtonText}>Pay with Paystack</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
              </LinearGradient>
            </TouchableOpacity>
          ) : paymentMethod === 'wallet' ? (
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleWalletPayment}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.buttonGradient}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Pay with Wallet</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleManualTransfer}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.buttonGradient}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Submit Proof & Order</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Paystack Modal */}
          <Modal isVisible={showPaystackModal} onBackdropPress={() => setShowPaystackModal(false)}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center' }}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Pay with Paystack</Text>
              <Text style={{ color: '#232e4a', marginBottom: 16 }}>This is a demo popup. Integrate your Paystack payment here.</Text>
              {paystackLoading ? (
                <ActivityIndicator color="#483AA0" size="large" />
              ) : (
                <TouchableOpacity
                  style={{ backgroundColor: '#483AA0', padding: 12, borderRadius: 8, marginBottom: 8 }}
                  onPress={handlePaystack}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Simulate Paystack Payment</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowPaystackModal(false)}>
                <Text style={{ color: '#483AA0', marginTop: 8 }}>Cancel</Text>
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
    backgroundColor: "#0E2148",
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
  cardCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 32,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
  },
  cardImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardImage: {
    width: 40,
    height: 40,
  },
  cardImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#0E2148",
    justifyContent: "center",
    alignItems: "center",
  },
  cardImagePlaceholderText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  cardInfo: {
    flex: 1,
  },
  cardBrand: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  cardValue: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 4,
  },
  cardCode: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 4,
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
  methodButton: {
    backgroundColor: '#232e4a',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodButtonActive: {
    borderColor: '#E3D095',
    backgroundColor: '#483AA0',
  },
  methodButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  uploadButton: {
    backgroundColor: '#483AA0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginTop: 8,
    alignItems: 'center',
  },
  input: {
    backgroundColor: '#3b5bfd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
}); 