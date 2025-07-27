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
import { useTheme } from "./ThemeContext" // Import useTheme hook

const { width, height } = Dimensions.get("window")
const HEADER_HEIGHT_PIN = Platform.OS === "android" ? 90 : 100 // Approximate height for the fixed header

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
  const [pinError, setPinError] = useState("")

  const { theme, isDarkTheme } = useTheme() // Use the theme context

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
    setPinError("")
    if (hasPin && oldPin.length !== 4) {
      setPinError("Please enter your current 4-digit PIN.")
      return false
    }
    if (pin.length !== 4) {
      setPinError("New PIN must be 4 digits.")
      return false
    }
    if (pin !== confirmPin) {
      setPinError("New PINs do not match.")
      return false
    }
    if (!/^\d{4}$/.test(pin)) {
      setPinError("New PIN must contain exactly 4 numbers.")
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
          setPinError("Current PIN is incorrect.")
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
    } finally {
      setSaving(false)
    }
  }

  const renderPinInput = (value, setValue, showToggle, setShowToggle, label, isError) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.surfaceSecondary,
            borderColor: isError ? theme.error : theme.border,
          },
        ]}
      >
        <Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor={theme.textMuted}
          value={value}
          onChangeText={(text) => {
            if (/^\d*$/.test(text) && text.length <= 4) { // Only allow digits and max 4 length
              setValue(text);
            }
          }}
          keyboardType="numeric"
          secureTextEntry={!showToggle}
          maxLength={4} // Ensure max length is 4
        />
        <TouchableOpacity onPress={() => setShowToggle(!showToggle)} style={styles.eyeButton}>
          <Ionicons name={showToggle ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textMuted} />
        </TouchableOpacity>
      </View>
      {isError && <Text style={styles.errorText}>{pinError}</Text>}
    </View>
  )

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.text,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 10, // Offset for fixed header
      paddingBottom: 40,
    },
    header: {
      position: "absolute", // Make header fixed
      top: 0,
      left: 0,
      right: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 50,
      paddingBottom: 15, // Adjust padding to give space below title
      paddingHorizontal: 20,
      zIndex: 10, // Ensure header is on top
      borderBottomWidth: 1,
      borderBottomColor: theme.border, // Subtle border
      elevation: 5, // Shadow for Android
      shadowColor: theme.shadow, // Shadow for iOS
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      backgroundColor: theme.primary,
    },
    backButton: {
      paddingVertical: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.textContrast,
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
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
      backgroundColor: theme.warningBackground,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 8,
      color: theme.text,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
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
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      paddingHorizontal: 16,
      borderWidth: 2,
      borderColor: theme.border,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      paddingVertical: 16,
    },
    eyeButton: {
      padding: 4,
    },
    requirementsContainer: {
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      backgroundColor: theme.warningBackground,
      borderColor: theme.warningBorder,
    },
    requirementsTitle: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 12,
      color: theme.textSecondary,
    },
    requirement: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    requirementText: {
      fontSize: 14,
      marginLeft: 8,
      color: theme.textSecondary,
    },
    saveButton: {
      borderRadius: 16,
      overflow: "hidden",
      marginTop: 8,
      elevation: 8,
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
      fontSize: 18,
      fontWeight: "bold",
      marginRight: 8,
      color: theme.textContrast,
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
      fontSize: 12,
      marginLeft: 8,
      flex: 1,
      color: theme.textSecondary,
    },
    backgroundGradient: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: height,
    },
    errorText: {
      color: theme.error,
      fontSize: 14,
      marginTop: 8,
      textAlign: 'center',
    },
    // Skeleton Styles
    skeletonContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    skeletonFixedHeader: {
      height: HEADER_HEIGHT_PIN,
      backgroundColor: theme.primary,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 10,
    },
    skeletonIconSection: {
      height: 180, // Approximate height of icon section
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 20,
      marginHorizontal: 20,
      marginTop: 20,
      marginBottom: 40,
    },
    skeletonInputContainer: {
      height: 100, // Approximate height for input + label
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 12,
      marginBottom: 24,
      marginHorizontal: 20,
    },
    skeletonRequirements: {
      height: 120, // Approximate height for requirements section
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 12,
      marginBottom: 32,
      marginHorizontal: 20,
    },
    skeletonButton: {
      height: 60,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginBottom: 24,
      marginHorizontal: 20,
    },
    skeletonTips: {
      height: 100, // Approximate height for security tips
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 12,
      marginHorizontal: 20,
      marginBottom: 24,
    },
  })

  // TransactionPin Skeleton Component
  const TransactionPinSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />
      {/* Fixed Header Skeleton */}
      <View style={styles.skeletonFixedHeader}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 50, paddingBottom: 20, width: '100%' }}>
          <View style={{ width: 24, height: 24, backgroundColor: theme.surfaceSecondary, borderRadius: 12 }} /> {/* Back button placeholder */}
          <View style={[styles.headerTitle, { backgroundColor: theme.surfaceSecondary, width: 150, height: 24 }]} /> {/* Title placeholder */}
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingTop: HEADER_HEIGHT_PIN + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon Section Skeleton */}
        <View style={styles.skeletonIconSection} />

        {/* Input Containers Skeletons */}
        {hasPin && <View style={styles.skeletonInputContainer} />} {/* Only if hasPin */}
        <View style={styles.skeletonInputContainer} />
        <View style={styles.skeletonInputContainer} />

        {/* PIN Requirements Skeleton */}
        <View style={styles.skeletonRequirements} />

        {/* Save Button Skeleton */}
        <View style={styles.skeletonButton} />

        {/* Security Tips Skeleton */}
        <View style={styles.skeletonTips} />
      </ScrollView>
    </View>
  );

  if (loading) {
    return <TransactionPinSkeleton />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />
      {/* Background Gradient - if needed, but primary/secondary theme colors are already set for background/header */}
      {/* <LinearGradient colors={[theme.primary, theme.secondary]} style={styles.backgroundGradient} /> */}

      {/* Fixed Header */}
      {/* Fixed Header */}
      <View
        style={{
          // backgroundColor: theme.primary,
          borderBottomColor: theme.border,
          shadowColor: theme.shadow,
          paddingHorizontal: 10,
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 5 : 45,
          paddingBottom: 10,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          // elevation: 8,
          zIndex: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TouchableOpacity
          style={{
            marginLeft: 0,
            padding: 6,
            borderRadius: 6,
          }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold' }}>Transaction Pin</Text>
        <View style={{ width: 32, height: 32 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Security Icon */}
          <View style={styles.iconSection}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="security" size={32} color={theme.warning} />
            </View>
            <Text style={styles.title}>
              {hasPin ? "Change Transaction PIN" : "Create Transaction PIN"}
            </Text>
            <Text style={styles.subtitle}>
              {hasPin
                ? "Update your PIN to keep your transactions secure"
                : "Set up a PIN to secure your transactions and withdrawals"}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {hasPin && renderPinInput(oldPin, setOldPin, showOldPin, setShowOldPin, "Current PIN", pinError && oldPin.length !== 4)}
            {renderPinInput(pin, setPin, showPin, setShowPin, "New PIN (4 Digits)", pinError && (pin.length !== 4 || pin !== confirmPin))}
            {renderPinInput(confirmPin, setConfirmPin, showConfirmPin, setShowConfirmPin, "Confirm New PIN", pinError && (confirmPin.length !== 4 || pin !== confirmPin))}

            {/* PIN Requirements */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>PIN Requirements:</Text>
              <View style={styles.requirement}>
                <Ionicons
                  name={pin.length === 4 ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={pin.length === 4 ? theme.success : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.requirementText,
                    pin.length === 4 && { color: theme.success },
                  ]}
                >
                  Exactly 4 digits long
                </Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={/^\d{4}$/.test(pin) ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={/^\d{4}$/.test(pin) ? theme.success : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.requirementText,
                    /^\d{4}$/.test(pin) && { color: theme.success },
                  ]}
                >
                  Numbers only
                </Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={pin === confirmPin && pin.length === 4 ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={pin === confirmPin && pin.length === 4 ? theme.success : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.requirementText,
                    pin === confirmPin && pin.length === 4 && { color: theme.success },
                  ]}
                >
                  PINs match
                </Text>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled, { shadowColor: theme.accent }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              <LinearGradient colors={[theme.accent, theme.accent]} style={styles.buttonGradient}>
                {saving ? (
                  <ActivityIndicator color={theme.textContrast} size="small" />
                ) : (
                  <>
                    <Text style={styles.saveButtonText}>
                      {hasPin ? "Update PIN" : "Create PIN"}
                    </Text>
                    <Ionicons name="checkmark" size={20} color={theme.textContrast} style={styles.buttonIcon} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Security Tips */}
          <View style={styles.securityTips}>
            <View style={styles.tipItem}>
              <Ionicons name="shield-checkmark" size={16} color={theme.warning} />
              <Text style={styles.tipText}>
                Your PIN is encrypted and stored securely
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="key" size={16} color={theme.warning} />
              <Text style={styles.tipText}>
                Use a PIN that's easy to remember but hard to guess
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="lock-closed" size={16} color={theme.warning} />
              <Text style={styles.tipText}>Never share your PIN with anyone</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

