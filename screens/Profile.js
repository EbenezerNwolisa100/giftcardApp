"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  StatusBar,
  Dimensions,
  ScrollView,
} from "react-native"
import { supabase } from "./supabaseClient"
import { useNavigation } from "@react-navigation/native"
import { MaterialIcons, Feather, Ionicons } from "@expo/vector-icons"
import { Picker } from "@react-native-picker/picker"
import { LinearGradient } from "expo-linear-gradient"
import { useTheme } from "./ThemeContext"

const { width } = Dimensions.get("window")

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

export default function Profile() {
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({ full_name: "", email: "", transaction_pin: null })
  const [logoutLoading, setLogoutLoading] = useState(false)
  const navigation = useNavigation()
  const { theme, isDark, toggleTheme } = useTheme()

  const handleLogout = async () => {
    setLogoutLoading(true)
    await supabase.auth.signOut()
    setLogoutLoading(false)
    // Session state in App.js will update and redirect to AuthStack
  }

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      if (profileError) {
        Alert.alert("Error", profileError.message)
      } else if (profileData) {
        setProfile({
          full_name: profileData.full_name || "",
          email: profileData.email || user.email || "",
          transaction_pin: profileData.transaction_pin,
        })
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0984e3" />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={styles.backgroundGradient} />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        </View>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.profileGradient}>
            <View style={styles.avatarCircle}>
              <MaterialIcons name="person" size={36} color="#E3D095" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.fullname}>{profile?.full_name || "Full Name"}</Text>
              <Text style={styles.email}>{profile?.email || "email@example.com"}</Text>
            </View>
            {/* <TouchableOpacity style={styles.editButton}>
              <Ionicons name="pencil" size={20} color="#fff" />
            </TouchableOpacity> */}
          </LinearGradient>
        </View>
        {/* Manage Bank Details Button */}
        {/* <TouchableOpacity style={styles.manageBankBtn} onPress={() => navigation.navigate('BankDetails')} activeOpacity={0.8}>
          <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.manageBankBtnGradient}>
            <Ionicons name="card" size={20} color="#fff" />
            <Text style={styles.manageBankBtnText}>Manage Bank Details</Text>
          </LinearGradient>
      </TouchableOpacity> */}
        {/* Menu List */}
        <View style={styles.menuList}>
          <MenuItem
            icon={<Feather name="credit-card" size={22} color="#7965C1" />}
            label="Manage Bank Details"
            onPress={() => navigation.navigate("BankDetails")}
            theme={theme}
          />
          <MenuItem
            icon={<Feather name="shield" size={22} color="#7965C1" />}
            label="Security"
            onPress={() => navigation.navigate("ChangePassword")}
            theme={theme}
          />
          {profile?.transaction_pin ? (
            <MenuItem
              icon={<Ionicons name="key" size={22} color="#7965C1" />}
              label="Change Transaction PIN"
              onPress={() => navigation.navigate("TransactionPin")}
              theme={theme}
            />
          ) : (
            <MenuItem
              icon={<Ionicons name="key" size={22} color="#E3D095" />}
              label="Create Transaction PIN"
              labelStyle={{ color: "#E3D095" }}
              onPress={() => navigation.navigate("TransactionPin")}
              theme={theme}
            />
          )}
          <MenuItem
            icon={<Ionicons name={isDark ? "sunny" : "moon"} size={22} color="#7965C1" />}
            label={isDark ? "Light Mode" : "Dark Mode"}
            onPress={toggleTheme}
            theme={theme}
          />
          <MenuItem
            icon={<Feather name="help-circle" size={22} color="#7965C1" />}
            label="FAQ"
            onPress={() => navigation.navigate("FAQ")}
            theme={theme}
          />
          <MenuItem
            icon={<Ionicons name="chatbubbles-outline" size={22} color="#7965C1" />}
            label="Support Center"
            onPress={() => navigation.navigate("SupportCenter")}
            theme={theme}
          />
          <MenuItem
            icon={<Feather name="percent" size={22} color="#7965C1" />}
            label="Rate Calculator"
            onPress={() => navigation.navigate("RateCalculator")}
            theme={theme}
          />
          <MenuItem
            icon={<MaterialIcons name="logout" size={22} color="#ff6b6b" />}
            label="Log Out"
            labelStyle={{ color: "#ff6b6b" }}
            onPress={handleLogout}
            loading={logoutLoading}
            theme={theme}
          />
        </View>
      </ScrollView>
    </View>
  )
}

function MenuItem({ icon, label, onPress, labelStyle, loading, theme }) {
  return (
    <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.surface }]} onPress={onPress} disabled={loading} activeOpacity={0.8}>
      <View style={styles.menuIcon}>{icon}</View>
      <Text style={[styles.menuLabel, labelStyle, { color: theme.text }]}>{label}</Text>
      {loading ? (
        <ActivityIndicator size="small" color="#7965C1" />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
      )}
    </TouchableOpacity>
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
    bottom: 0,
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
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 15,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingLeft: 10,
    marginBottom: 20,
  },
  backButton: {
    padding: 0,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  placeholder: {
    width: 40,
  },
  profileCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 32,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  profileGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(227, 208, 149, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  fullname: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 4,
  },
  email: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  editButton: {
    padding: 8,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  editSectionButton: {
    padding: 8,
  },
  bankDetailsCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  bankDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  bankDetailLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },
  bankDetailValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bankFormCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  pickerWrapper: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  picker: {
    color: "#fff",
    height: 50,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  saveButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  menuList: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  menuIcon: {
    width: 32,
    alignItems: "center",
    marginRight: 16,
  },
  menuLabel: {
    color: "#fff",
    fontSize: 16,
    flex: 1,
    fontWeight: "500",
  },
  manageBankBtn: { borderRadius: 12, overflow: 'hidden', marginBottom: 24 },
  manageBankBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 24 },
  manageBankBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});
