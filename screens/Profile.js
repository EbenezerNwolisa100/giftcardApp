"use client"
import { useState, useCallback } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  ScrollView,
  RefreshControl, // Import RefreshControl
  Platform, // Import Platform
} from "react-native"
import { supabase } from "./supabaseClient"
import { useNavigation, useFocusEffect } from "@react-navigation/native" // Import useFocusEffect
import { MaterialIcons, Feather, Ionicons } from "@expo/vector-icons"
import { useTheme } from "./ThemeContext" // Correctly import useTheme

const { width } = Dimensions.get("window")

// Define MenuItem component locally within Profile.js
function MenuItem({ icon, label, onPress, labelStyle, loading, theme, isLast }) {
  const styles = StyleSheet.create({
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: isLast ? 0 : 1, // Conditional border for last item
      borderBottomColor: theme.border, // Use theme border
    },
    menuIcon: {
      width: 32,
      alignItems: "center",
      marginRight: 16,
    },
    menuLabel: {
      color: theme.text, // Use theme text color
      fontSize: 16,
      flex: 1,
      fontWeight: "500",
    },
  })

  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} disabled={loading} activeOpacity={0.8}>
      <View style={styles.menuIcon}>{icon}</View>
      <Text style={[styles.menuLabel, labelStyle]}>{label}</Text>
      {loading ? (
        <ActivityIndicator size="small" color={theme.accent} />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
      )}
    </TouchableOpacity>
  )
}

export default function Profile() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState({ full_name: "", email: "", transaction_pin: null })
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false) // State for RefreshControl
  const navigation = useNavigation()
  const { theme, isDarkTheme, toggleTheme } = useTheme() // Correctly destructure toggleTheme from useTheme

  const fetchProfile = useCallback(async () => {
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
    } catch (err) {
      console.error("Error fetching profile:", err)
      Alert.alert("Error", err.message || "Failed to load profile.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchProfile()
    }, [fetchProfile]),
  )

  const handleLogout = async () => {
    setLogoutLoading(true)
    await supabase.auth.signOut()
    setLogoutLoading(false)
    // Session state in App.js will update and redirect to AuthStack
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
    // Fixed Header Styles
    fixedHeader: {
      backgroundColor: theme.primary, // Solid primary color for header
      paddingHorizontal: 24,
      paddingTop: 40,
      paddingBottom: 20,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      zIndex: 10, // Ensure header is above scrollable content
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: "600",
    },
    notificationButton: {
      padding: 8,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingBottom: Platform.OS === "ios" ? 85 + 20 : 70 + 20, // Account for tab bar height
      paddingTop: 20, // Space after fixed header
    },
    profileCard: {
      backgroundColor: theme.surface, // Solid surface color
      borderRadius: 20,
      marginBottom: 32,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
      flexDirection: "row", // Added for layout
      alignItems: "center", // Added for layout
      padding: 24, // Added padding
    },
    avatarCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.surfaceSecondary, // Use theme surfaceSecondary
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },
    profileInfo: {
      flex: 1,
    },
    fullname: {
      color: theme.text, // Use theme text color
      fontWeight: "bold",
      fontSize: 18,
      marginBottom: 4,
    },
    email: {
      color: theme.textSecondary, // Use theme textSecondary
      fontSize: 14,
    },
    menuList: {
      backgroundColor: theme.surface, // Use theme surface
      borderRadius: 16,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: theme.border, // Use theme border
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
  })

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />

      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate("NotificationsScreen")}>
          <Ionicons name="notifications-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchProfile}
            tintColor={theme.accent}
            colors={[theme.accent]}
            progressBackgroundColor={theme.surface}
          />
        }
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <MaterialIcons name="person" size={36} color={theme.accent} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.fullname}>{profile?.full_name || "Full Name"}</Text>
            <Text style={styles.email}>{profile?.email || "email@example.com"}</Text>
          </View>
        </View>

        {/* Menu List */}
        <View style={styles.menuList}>
          <MenuItem
            icon={<Feather name="credit-card" size={22} color={theme.accent} />}
            label="Manage Bank Details"
            onPress={() => navigation.navigate("BankDetails")}
            theme={theme}
          />
          <MenuItem
            icon={<Feather name="shield" size={22} color={theme.accent} />}
            label="Security"
            onPress={() => navigation.navigate("ChangePassword")}
            theme={theme}
          />
          {profile?.transaction_pin ? (
            <MenuItem
              icon={<Ionicons name="key" size={22} color={theme.accent} />}
              label="Change Transaction PIN"
              onPress={() => navigation.navigate("TransactionPin")}
              theme={theme}
            />
          ) : (
            <MenuItem
              icon={<Ionicons name="key" size={22} color={theme.warning} />}
              label="Create Transaction PIN"
              labelStyle={{ color: theme.warning }}
              onPress={() => navigation.navigate("TransactionPin")}
              theme={theme}
            />
          )}
          <MenuItem
            icon={<Ionicons name={isDarkTheme ? "sunny" : "moon"} size={22} color={theme.accent} />}
            label={isDarkTheme ? "Light Mode" : "Dark Mode"}
            onPress={toggleTheme} // Directly use toggleTheme from useTheme hook
            theme={theme}
          />
          <MenuItem
            icon={<Feather name="help-circle" size={22} color={theme.accent} />}
            label="FAQ"
            onPress={() => navigation.navigate("FAQ")}
            theme={theme}
          />
          <MenuItem
            icon={<Ionicons name="chatbubbles-outline" size={22} color={theme.accent} />}
            label="Support Center"
            onPress={() => navigation.navigate("SupportCenter")}
            theme={theme}
          />
          <MenuItem
            icon={<Feather name="percent" size={22} color={theme.accent} />}
            label="Rate Calculator"
            onPress={() => navigation.navigate("RateCalculator")}
            theme={theme}
          />
          <MenuItem
            icon={<MaterialIcons name="logout" size={22} color={theme.error} />}
            label="Log Out"
            labelStyle={{ color: theme.error }}
            onPress={handleLogout}
            loading={logoutLoading}
            theme={theme}
            isLast={true} // Mark as last item to remove bottom border
          />
        </View>
      </ScrollView>
    </View>
  )
}
