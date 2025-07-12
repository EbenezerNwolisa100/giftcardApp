"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native"
import { supabase } from "./supabaseClient"
import * as Crypto from "expo-crypto"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"

const { width, height } = Dimensions.get("window")

export default function TransactionPin({ navigation }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasPin, setHasPin] = useState(false)
  const [oldPin, setOldPin] = useState("")
  const [pin, setPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [showOldPin, setShowOldPin] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [showConfirmPin, setShowConfirmPin] = useState(false)

  useEffect(() => {
    const fetchPin = async () => {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      const { data, error } = await supabase.from("profiles").select("transaction_pin").eq("id", user.id).single()
      if (error) {
        Alert.alert("Error", error.message)
      } else if (data && data.transaction_pin) {
        setHasPin(true)
      }
      setLoading(false)
    }
    fetchPin()
  }, [])

  const validateForm = () => {
    if (hasPin && !oldPin) {
      Alert.alert("Error", "Please enter your current PIN.")
      return false
    }
    if (!pin || !confirmPin) {
      Alert.alert("Error", "Please enter and confirm your new PIN.")
      return false
    }
    if (pin !== confirmPin) {
      Alert.alert("Error", "PINs do not match.")
      return false
    }
    if (pin.length < 4 || pin.length > 6) {
      Alert.alert("Error", "PIN must be 4-6 digits.")
      return false
    }
    if (!/^\d+$/.test(pin)) {
      Alert.alert("Error", "PIN must contain only numbers.")
      return false
    }
    return true
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    try {
      // If changing PIN, verify old PIN
      if (hasPin) {
        const { data } = await supabase.from("profiles").select("transaction_pin").eq("id", user.id).single()
        const oldPinHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, oldPin)
        if (data.transaction_pin !== oldPinHash) {
          Alert.alert("Error", "Current PIN is incorrect.")
          setSaving(false)
          return
        }
      }

      // Hash new PIN
      const pinHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin)
      const { error } = await supabase.from("profiles").update({ transaction_pin: pinHash }).eq("id", user.id)

      if (error) throw error

      Alert.alert("Success", hasPin ? "PIN changed successfully!" : "PIN created successfully!", [
        {
          text: "OK",
          onPress: () => {
            setOldPin("")
            setPin("")
            setConfirmPin("")
            // Navigate back to Profile if we came from there, otherwise go back
            if (navigation.canGoBack()) {
              navigation.goBack()
            } else {
              navigation.navigate("Profile")
            }
          },
        },
      ])
    } catch (error) {
      Alert.alert("Error", error.message)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0E2148" />
        <ActivityIndicator size="large" color="#7965C1" />
        <Text style={styles.loadingText}>Loading PIN settings...</Text>
      </View>
    )
  }

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
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{hasPin ? "Change PIN" : "Create PIN"}</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Security Icon */}
          <View style={styles.iconSection}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="security" size={32} color="#E3D095" />
            </View>
            <Text style={styles.title}>{hasPin ? "Change Transaction PIN" : "Create Transaction PIN"}</Text>
            <Text style={styles.subtitle}>
              {hasPin
                ? "Update your PIN to keep your transactions secure"
                : "Set up a PIN to secure your transactions and withdrawals"}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {hasPin && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Current PIN</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="rgba(255,255,255,0.6)"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter current PIN"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    value={oldPin}
                    onChangeText={setOldPin}
                    keyboardType="numeric"
                    secureTextEntry={!showOldPin}
                    maxLength={6}
                  />
                  <TouchableOpacity onPress={() => setShowOldPin(!showOldPin)} style={styles.eyeButton}>
                    <Ionicons
                      name={showOldPin ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="rgba(255,255,255,0.6)"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>New PIN</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 4-6 digit PIN"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={pin}
                  onChangeText={setPin}
                  keyboardType="numeric"
                  secureTextEntry={!showPin}
                  maxLength={6}
                />
                <TouchableOpacity onPress={() => setShowPin(!showPin)} style={styles.eyeButton}>
                  <Ionicons
                    name={showPin ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="rgba(255,255,255,0.6)"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm New PIN</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your PIN"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  keyboardType="numeric"
                  secureTextEntry={!showConfirmPin}
                  maxLength={6}
                />
                <TouchableOpacity onPress={() => setShowConfirmPin(!showConfirmPin)} style={styles.eyeButton}>
                  <Ionicons
                    name={showConfirmPin ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="rgba(255,255,255,0.6)"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* PIN Requirements */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>PIN Requirements:</Text>
              <View style={styles.requirement}>
                <Ionicons
                  name={pin.length >= 4 && pin.length <= 6 ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={pin.length >= 4 && pin.length <= 6 ? "#4caf50" : "rgba(255,255,255,0.5)"}
                />
                <Text style={[styles.requirementText, pin.length >= 4 && pin.length <= 6 && styles.requirementMet]}>
                  4-6 digits long
                </Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={/^\d*$/.test(pin) && pin.length > 0 ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={/^\d*$/.test(pin) && pin.length > 0 ? "#4caf50" : "rgba(255,255,255,0.5)"}
                />
                <Text style={[styles.requirementText, /^\d*$/.test(pin) && pin.length > 0 && styles.requirementMet]}>
                  Numbers only
                </Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={pin === confirmPin && pin.length > 0 ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={pin === confirmPin && pin.length > 0 ? "#4caf50" : "rgba(255,255,255,0.5)"}
                />
                <Text style={[styles.requirementText, pin === confirmPin && pin.length > 0 && styles.requirementMet]}>
                  PINs match
                </Text>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.buttonGradient}>
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.saveButtonText}>{hasPin ? "Update PIN" : "Create PIN"}</Text>
                    <Ionicons name="checkmark" size={20} color="#fff" style={styles.buttonIcon} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Security Tips */}
          <View style={styles.securityTips}>
            <View style={styles.tipItem}>
              <Ionicons name="shield-checkmark" size={16} color="#E3D095" />
              <Text style={styles.tipText}>Your PIN is encrypted and stored securely</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="key" size={16} color="#E3D095" />
              <Text style={styles.tipText}>Use a PIN that's easy to remember but hard to guess</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="lock-closed" size={16} color="#E3D095" />
              <Text style={styles.tipText}>Never share your PIN with anyone</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
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
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0E2148",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
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
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  placeholder: {
    width: 40,
  },
  iconSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(227, 208, 149, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  formContainer: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 16,
  },
  eyeButton: {
    padding: 4,
  },
  requirementsContainer: {
    backgroundColor: "rgba(227, 208, 149, 0.1)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(227, 208, 149, 0.3)",
  },
  requirementsTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  requirement: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  requirementText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    marginLeft: 8,
  },
  requirementMet: {
    color: "#4caf50",
  },
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
    elevation: 8,
    shadowColor: "#7965C1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  securityTips: {
    paddingVertical: 32,
    gap: 12,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  tipText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
})
