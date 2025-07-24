"use client"
import { useState, useCallback } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Modal,
  ScrollView,
  RefreshControl,
  Platform,
} from "react-native"
import { supabase } from "./supabaseClient"
import CustomDropdown from "./CustomDropdown"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons" // Added MaterialIcons for header icon
import { useTheme } from "./ThemeContext"

const NIGERIAN_BANKS = [
  "Access Bank",
  "GTBank",
  "Zenith Bank",
  "UBA",
  "First Bank",
  "Fidelity Bank",
  "Union Bank",
  "Sterling Bank",
  "Ecobank",
  "Stanbic IBTC",
  "Polaris Bank",
  "Wema Bank",
]

// Define a consistent header height for fixed positioning
const HEADER_HEIGHT = Platform.OS === "ios" ? 100 : 70

export default function BankDetails() {
  const { theme, isDarkTheme } = useTheme()
  const [bankForm, setBankForm] = useState({ bank_name: NIGERIAN_BANKS[0], account_number: "", account_name: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const navigation = useNavigation()

  const fetchBank = useCallback(async () => {
    setLoading(true)
    setRefreshing(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      setRefreshing(false)
      return
    }
    const { data: bankData, error } = await supabase.from("user_banks").select("*").eq("user_id", user.id).single()
    if (error) {
      console.error("Error fetching bank details:", error)
      setModalMessage(error.message || "Failed to load bank details.")
      setModalVisible(true)
    } else if (bankData) {
      setBankForm({
        bank_name: bankData.bank_name,
        account_number: bankData.account_number,
        account_name: bankData.account_name,
      })
    }
    setLoading(false)
    setRefreshing(false)
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchBank()
    }, [fetchBank]),
  )

  const handleBankFormChange = (field, value) => {
    setBankForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleBankSave = async () => {
    if (!bankForm.account_number || !bankForm.account_name) {
      setModalMessage("Please fill in all bank details.")
      setModalVisible(true)
      return
    }
    setSaving(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }
    const { error } = await supabase.from("user_banks").upsert({
      user_id: user.id,
      bank_name: bankForm.bank_name,
      account_number: bankForm.account_number,
      account_name: bankForm.account_name,
    })
    setSaving(false)
    if (error) {
      setModalMessage(error.message)
      setModalVisible(true)
    } else {
      setModalMessage("Bank details saved!")
      setModalVisible(true)
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: theme.background,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      color: theme.text,
      fontSize: 16,
      marginTop: 16,
    },
    fixedHeader: {
      position: "absolute", // Make it truly fixed
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.primary,
      paddingHorizontal: 24,
      paddingTop: Platform.OS === "ios" ? 50 : 20, // Adjust for iOS notch
      paddingBottom: 15,
      borderBottomWidth: 1, // New visual element
      borderBottomColor: theme.border, // Use theme border
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 }, // Stronger shadow
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 5,
      zIndex: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: "600",
      flex: 1,
      textAlign: "center",
    },
    placeholder: {
      width: 40, // To balance the back button space
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingBottom: Platform.OS === "ios" ? 85 + 20 : 70 + 20, // Account for tab bar height
      paddingTop: HEADER_HEIGHT + 20, // Push content down below the fixed header + some extra space
    },
    formCard: {
      backgroundColor: theme.surface,
      borderRadius: 16, // Slightly smaller radius for a different feel
      padding: 24,
      marginBottom: 24,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 12,
      padding: 16,
      color: theme.text,
      fontSize: 16,
      borderWidth: 2,
      borderColor: theme.border,
    },
    saveButton: {
      borderRadius: 16,
      overflow: "hidden",
      marginTop: 8,
      backgroundColor: theme.accent,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 18,
      paddingHorizontal: 32,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 8,
    },
    saveButtonDisabled: {
      opacity: 0.7,
    },
    saveButtonText: {
      color: isDarkTheme ? theme.text : theme.primary,
      fontSize: 18,
      fontWeight: "bold",
      marginRight: 8,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalBox: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
      width: "80%",
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    modalMessage: {
      fontSize: 18,
      color: theme.text,
      textAlign: "center",
      marginBottom: 20,
      fontWeight: "600",
    },
    modalButton: {
      backgroundColor: theme.accent,
      paddingVertical: 12,
      paddingHorizontal: 25,
      borderRadius: 12,
    },
    modalButtonText: {
      color: isDarkTheme ? theme.text : theme.primary,
      fontSize: 16,
      fontWeight: "bold",
    },
  })

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={styles.loadingText}>Loading bank details...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />

      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bank Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchBank}
            tintColor={theme.accent}
            colors={[theme.accent]}
            progressBackgroundColor={theme.surface}
          />
        }
      >
        <View style={styles.formCard}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Bank Name</Text>
            <CustomDropdown
              options={NIGERIAN_BANKS.map((b) => ({ label: b, value: b }))}
              value={bankForm.bank_name}
              onSelect={(v) => handleBankFormChange("bank_name", v)}
              placeholder="Select bank"
              style={{ marginBottom: 8 }}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Account Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter account number"
              placeholderTextColor={theme.textMuted}
              value={bankForm.account_number}
              onChangeText={(v) => handleBankFormChange("account_number", v)}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Account Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter account name"
              placeholderTextColor={theme.textMuted}
              value={bankForm.account_name}
              onChangeText={(v) => handleBankFormChange("account_name", v)}
            />
          </View>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleBankSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color={isDarkTheme ? theme.text : theme.primary} size="small" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>Save Bank Details</Text>
                <Ionicons name="checkmark" size={16} color={isDarkTheme ? theme.text : theme.primary} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom Modal for errors and confirmations */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setModalVisible(false)
          if (modalMessage === "Bank details saved!") navigation.goBack()
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false)
                if (modalMessage === "Bank details saved!") navigation.goBack()
              }}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}
