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
import { Ionicons } from "@expo/vector-icons"
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
const HEADER_HEIGHT_BANK = Platform.OS === "ios" ? 100 : 70

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
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        setRefreshing(false)
        return
      }
      const { data: bankData, error } = await supabase.from("user_banks").select("*").eq("user_id", user.id).single()
      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine
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
    } catch (e) {
      console.error("Unexpected error fetching bank details:", e);
      setModalMessage(e.message || "An unexpected error occurred.")
      setModalVisible(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
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
    try {
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
      }, { onConflict: 'user_id' }) // Use onConflict for upserting

      if (error) {
        throw error;
      } else {
        setModalMessage("Bank details saved!")
        setModalVisible(true)
      }
    } catch (e) {
      setModalMessage(e.message || "Failed to save bank details.")
      setModalVisible(true)
    } finally {
      setSaving(false)
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
      fontWeight: '500',
    },
    fixedHeader: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.primary,
      paddingHorizontal: 24,
      paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 10,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
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
      color: theme.textContrast,
      fontSize: 20,
      fontWeight: "600",
      flex: 1,
      textAlign: "center",
    },
    placeholder: {
      width: 40,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingBottom: 20, // Reduced since tab bar is now relative positioned
      paddingTop: 10,
    },
    formCard: {
      // backgroundColor: theme.surface,
      borderRadius: 16,
      // padding: 24,
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
      color: theme.primary, // Changed to theme.primary for consistency with accent button
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
      color: theme.primary, // Changed to theme.primary for consistency with accent button
      fontSize: 16,
      fontWeight: "bold",
    },
    // Skeleton Styles
    skeletonHeader: {
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 4,
    },
  })

  // BankDetails Skeleton Component
  const BankDetailsSkeleton = () => (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />

      {/* Fixed Header Skeleton */}
      <View
        style={{
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
          zIndex: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ width: 24, height: 24, backgroundColor: theme.surfaceSecondary, borderRadius: 12 }} />
        <View style={{ width: 120, height: 24, backgroundColor: theme.surfaceSecondary, borderRadius: 4 }} />
        <View style={{ width: 32, height: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Card Skeleton */}
        <View style={styles.formCard}>
          {/* Bank Name Input Skeleton */}
          <View style={styles.inputContainer}>
            <View style={[styles.skeletonHeader, { width: 80, height: 16, marginBottom: 8 }]} />
            <View style={[styles.input, { backgroundColor: theme.surfaceSecondary, height: 56 }]} />
          </View>
          
          {/* Account Number Input Skeleton */}
          <View style={styles.inputContainer}>
            <View style={[styles.skeletonHeader, { width: 120, height: 16, marginBottom: 8 }]} />
            <View style={[styles.input, { backgroundColor: theme.surfaceSecondary, height: 56 }]} />
          </View>
          
          {/* Account Name Input Skeleton */}
          <View style={styles.inputContainer}>
            <View style={[styles.skeletonHeader, { width: 100, height: 16, marginBottom: 8 }]} />
            <View style={[styles.input, { backgroundColor: theme.surfaceSecondary, height: 56 }]} />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Save Button Skeleton */}
      <View style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: theme.background,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderTopWidth: 1,
        borderTopColor: theme.border,
        zIndex: 20,
      }}>
        <View style={[styles.saveButton, { backgroundColor: theme.surfaceSecondary }]}>
          <View style={{ width: 120, height: 18, backgroundColor: theme.surfaceSecondary, borderRadius: 4 }} />
        </View>
      </View>
    </View>
  );

  if (loading) {
    return <BankDetailsSkeleton />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />

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
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold' }}>Bank Details</Text>
        <View style={{ width: 32, height: 32 }} />
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
        </View>
      </ScrollView>

      <View style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: theme.background,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderTopWidth: 1,
        borderTopColor: theme.border,
        zIndex: 20,
      }}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleBankSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={theme.primary} size="small" />
          ) : (
            <>
              <Text style={styles.saveButtonText}>Save Bank Details</Text>
              <Ionicons name="checkmark" size={16} color={theme.primary} />
            </>
          )}
        </TouchableOpacity>
      </View>

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
