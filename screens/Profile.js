"use client"
import { useState, useCallback, useEffect } from "react"
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
  RefreshControl,
  Platform,
} from "react-native"
import { supabase } from "./supabaseClient"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { MaterialIcons, Feather, Ionicons } from "@expo/vector-icons"
import { useTheme } from "./ThemeContext"

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
  const [refreshing, setRefreshing] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0) // State for unread notifications
  const navigation = useNavigation()
  const { theme, isDarkTheme, toggleTheme } = useTheme()

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

      // Fetch unread notifications count
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false)
      setUnreadCount(count || 0)

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
      fontWeight: '500',
    },
    // Fixed Header Styles
    fixedHeader: {
      // backgroundColor: theme.primary, // Solid primary color for header
      paddingHorizontal: 18,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 5 : 45, // Adjust for iOS/Android status bar
      paddingBottom: 10,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 5 }, // More pronounced shadow
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8, // Android shadow
      zIndex: 10, // Ensure header is above scrollable content
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerTitle: {
      color: theme.text,
      fontSize: 24, // Larger title
      fontWeight: "bold",
    },
    notificationButton: {
      position: "relative",
      padding: 8,
    },
    notificationBadge: {
      position: "absolute",
      top: 0,
      right: 0,
      backgroundColor: theme.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: theme.primary,
    },
    notificationBadgeText: {
      color: theme.primary,
      fontSize: 10,
      fontWeight: "bold",
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 18,
      paddingBottom: Platform.OS === "ios" ? 85 + 20 : 70 + 20, // Account for tab bar height
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
      flexDirection: "column",
      gap: 10,
      // alignItems: "center",
      padding: 24,
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
    // Skeleton Styles
    skeletonContainer: {
      flex: 1,
      backgroundColor: theme.background,
      paddingHorizontal: 24,
    },
    skeletonHeader: {
      height: 24,
      width: '60%',
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 4,
    },
    skeletonProfileCard: {
      height: 100,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 20,
      marginBottom: 32,
      marginTop: 20,
    },
    skeletonMenuItem: {
      height: 50,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 12,
      marginBottom: 10,
    },
  })

  // Profile Skeleton Component
  const ProfileSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />
      {/* Fixed Header Skeleton */}
      <View style={styles.fixedHeader}>
        <View style={[styles.skeletonHeader, { width: 200, height: 24 }]} />
        <View style={[styles.notificationButton, { backgroundColor: theme.surfaceSecondary, borderRadius: 20, width: 40, height: 40 }]} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingTop: 20 }]} // Adjust padding for skeleton
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card Skeleton */}
        <View style={styles.skeletonProfileCard} />

        {/* Menu List Skeletons */}
        <View style={[styles.menuList, { backgroundColor: 'transparent', borderWidth: 0, shadowOpacity: 0 }]}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <View key={i} style={styles.skeletonMenuItem} />
          ))}
        </View>
      </ScrollView>
    </View>
  );

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />

      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate("NotificationsScreen")}>
          <Ionicons name="notifications-outline" size={24} color={theme.text} />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
            </View>
          )}
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

        {/* <View>
          <Text>Quick Actions</Text>
        </View> */}

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
            onPress={toggleTheme}
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
            isLast={true}
          />
        </View>
      </ScrollView>
    </View>
  )
}
