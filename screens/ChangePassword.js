import { useState, useCallback } from "react"
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
  RefreshControl,
} from "react-native"
import { supabase } from "./supabaseClient"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { useTheme } from "./ThemeContext"

const { width, height } = Dimensions.get("window")

// Define a consistent header height for fixed positioning
const HEADER_HEIGHT_CHANGE_PASSWORD = Platform.OS === "ios" ? 100 : 70

export default function ChangePassword({ navigation }) {
  const { theme, isDarkTheme } = useTheme()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const validateForm = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "All fields are required.")
      return false
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters long.")
      return false
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.")
      return false
    }
    if (currentPassword === newPassword) {
      Alert.alert("Error", "New password must be different from current password.")
      return false
    }
    return true
  }

  const handleChangePassword = async () => {
    if (!validateForm()) return
    setLoading(true)
    // Supabase client-side update does not require current password for update.
    // If you need to verify current password, implement a server-side function.
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)
    if (error) {
      Alert.alert("Error", error.message)
    } else {
      Alert.alert("Success", "Password changed successfully!", [
        {
          text: "OK",
          onPress: () => {
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
            navigation.goBack()
          },
        },
      ])
    }
  }

  // Dummy refresh function for consistency
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    // In a real scenario, you might re-fetch user data or settings here
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
  }, [])

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
    keyboardAvoidingView: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingBottom: Platform.OS === "ios" ? 85 + 20 : 70 + 20, // Account for tab bar height
      paddingTop: 0, // Push content down below the fixed header + some extra space
    },
    fixedHeader: {
      position: "absolute", // Make it truly fixed
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.primary,
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
      color: theme.textContrast, // Themed
      fontSize: 20,
      fontWeight: "600",
      flex: 1,
      textAlign: "center",
    },
    placeholder: {
      width: 40, // To balance the back button space
    },
    iconSection: {
      alignItems: "center",
      marginBottom: 40,
      marginTop: 10, // Space after fixed header
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.surfaceSecondary,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 8,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      paddingHorizontal: 10,
    },
    formContainer: {
      flex: 1,
    },
    inputContainer: {
      marginBottom: 24,
    },
    inputLabel: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 12,
      paddingHorizontal: 16,
      borderWidth: 2,
      borderColor: theme.border,
    },
    inputIcon: {
      marginRight: 12,
      color: theme.textMuted,
    },
    input: {
      flex: 1,
      color: theme.text,
      fontSize: 16,
      paddingVertical: 16,
    },
    eyeButton: {
      padding: 4,
    },
    passwordRequirements: {
      marginBottom: 32,
    },
    requirementsTitle: {
      color: theme.textSecondary,
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
      color: theme.textMuted,
      fontSize: 14,
      marginLeft: 8,
    },
    requirementMet: {
      color: theme.success,
    },
    changeButton: {
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 24,
      elevation: 8,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      backgroundColor: theme.accent,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 18,
      paddingHorizontal: 32,
    },
    changeButtonDisabled: {
      opacity: 0.7,
    },
    changeButtonText: {
      color: theme.textContrast, // Themed
      fontSize: 18,
      fontWeight: "bold",
      marginRight: 8,
    },
    buttonIcon: {
      marginLeft: 4,
    },
    securityTips: {
      paddingVertical: 24,
    },
    tipItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    tipText: {
      color: theme.textMuted,
      fontSize: 12,
      marginLeft: 8,
      flex: 1,
    },
    // Skeleton Styles
    skeletonContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    skeletonFixedHeader: {
      height: HEADER_HEIGHT_CHANGE_PASSWORD,
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
      marginHorizontal: 24,
      marginTop: 20,
      marginBottom: 40,
    },
    skeletonInputContainer: {
      height: 80, // Approximate height for input + label
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 12,
      marginBottom: 24,
      marginHorizontal: 24,
    },
    skeletonRequirements: {
      height: 100, // Approximate height for requirements section
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 12,
      marginBottom: 32,
      marginHorizontal: 24,
    },
    skeletonButton: {
      height: 60,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginBottom: 24,
      marginHorizontal: 24,
    },
    skeletonTips: {
      height: 80, // Approximate height for security tips
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 12,
      marginHorizontal: 24,
      marginBottom: 24,
    },
  })

  // ChangePassword Skeleton Component
  const ChangePasswordSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />
      {/* Fixed Header Skeleton */}
      <View style={styles.skeletonFixedHeader}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === "ios" ? 50 : StatusBar.currentHeight + 10, paddingBottom: 15, width: '100%' }}>
          <View style={{ width: 24, height: 24, backgroundColor: theme.surfaceSecondary, borderRadius: 12 }} /> {/* Back button placeholder */}
          <View style={[styles.headerTitle, { backgroundColor: theme.surfaceSecondary, width: 180, height: 24 }]} /> {/* Title placeholder */}
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingTop: HEADER_HEIGHT_CHANGE_PASSWORD + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon Section Skeleton */}
        <View style={styles.skeletonIconSection} />

        {/* Form Inputs Skeletons */}
        <View style={styles.skeletonInputContainer} />
        <View style={styles.skeletonInputContainer} />
        <View style={styles.skeletonInputContainer} />

        {/* Password Requirements Skeleton */}
        <View style={styles.skeletonRequirements} />

        {/* Change Password Button Skeleton */}
        <View style={styles.skeletonButton} />

        {/* Security Tips Skeleton */}
        <View style={styles.skeletonTips} />
      </ScrollView>
    </View>
  );

  if (loading) {
    return <ChangePasswordSkeleton />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            borderBottomColor: theme.border,
            shadowColor: theme.shadow,
            paddingHorizontal: 13,
            paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 5 : 45,
            paddingBottom: 10,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            // elevation: 8,
            zIndex: 100,
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
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold' }}>Security</Text>
          <View style={{ width: 32, height: 32 }} />
        </View>

        <ScrollView style={{ marginTop: 80 }}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.accent}
              colors={[theme.accent]}
              progressBackgroundColor={theme.surface}
            />
          }
        >
          {/* Security Icon */}
          <View style={styles.iconSection}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="security" size={32} color={theme.accent} />
            </View>
            <Text style={styles.title}>Update Your Password</Text>
            <Text style={styles.subtitle}>Choose a strong password to keep your account secure</Text>
          </View>
          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter current password"
                  placeholderTextColor={theme.textMuted}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrent}
                />
                <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeButton}>
                  <Ionicons name={showCurrent ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor={theme.textMuted}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNew}
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeButton}>
                  <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  placeholderTextColor={theme.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeButton}>
                  <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
            {/* Password Requirements */}
            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
              <View style={styles.requirement}>
                <Ionicons
                  name={newPassword.length >= 6 ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={newPassword.length >= 6 ? theme.success : theme.textMuted}
                />
                <Text style={[styles.requirementText, newPassword.length >= 6 && styles.requirementMet]}>
                  At least 6 characters
                </Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={newPassword !== confirmPassword || !confirmPassword ? "ellipse-outline" : "checkmark-circle"}
                  size={16}
                  color={newPassword === confirmPassword && confirmPassword ? theme.success : theme.textMuted}
                />
                <Text
                  style={[
                    styles.requirementText,
                    newPassword === confirmPassword && confirmPassword && styles.requirementMet,
                  ]}
                >
                  Passwords match
                </Text>
              </View>
            </View>
            {/* Change Password Button */}
            <TouchableOpacity
              style={[styles.changeButton, loading && styles.changeButtonDisabled]}
              onPress={handleChangePassword}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={theme.textContrast} size="small" />
              ) : (
                <>
                  <Text style={styles.changeButtonText}>Update Password</Text>
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={theme.textContrast}
                    style={styles.buttonIcon}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
          {/* Security Tips */}
          <View style={styles.securityTips}>
            <View style={styles.tipItem}>
              <Ionicons name="shield-checkmark" size={16} color={theme.accent} />
              <Text style={styles.tipText}>Use a unique password you don't use elsewhere</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="key" size={16} color={theme.accent} />
              <Text style={styles.tipText}>Include numbers, letters, and special characters</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
