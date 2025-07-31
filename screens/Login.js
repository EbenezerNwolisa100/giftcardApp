import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native"
import { supabase } from "./supabaseClient" // Adjust path as needed
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { useTheme } from "./ThemeContext" // Adjust path as needed
import { Image } from "react-native";
import lightLogo from "../assets/lightlogo.png";
import darkLogo from "../assets/darklogo.png";

const { width } = Dimensions.get("window")

export default function Login({ navigation }) {
  const { theme, isDarkTheme } = useTheme()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address.")
      return false
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Error", "Please enter a valid email address.")
      return false
    }
    if (!password) {
      Alert.alert("Error", "Please enter your password.")
      return false
    }
    return true
  }

  const handleLogin = async () => {
    if (!validateForm()) return
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)
    if (error) {
      Alert.alert("Login Error", error.message)
      return
    }
    // After login, upsert profile if missing
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      if (!profile) {
        const pendingName = await AsyncStorage.getItem("pending_name")
        if (pendingName) {
          await supabase.from("profiles").upsert({ id: user.id, full_name: pendingName, email: user.email })
          await AsyncStorage.removeItem("pending_name")
        }
      }
    } catch (e) {
      // ignore profile upsert errors
    }
    navigation.replace("Main")
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    statusBar: {
      backgroundColor: theme.primary,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 24,
      justifyContent: "center",
      paddingBottom: 40, // Add some padding at the bottom for scroll
    },
    header: {
      paddingTop: Platform.OS === 'ios' ? 60 : 40,
      marginBottom: 20, // Reduced margin for better spacing
      flexDirection: 'row', // For back button alignment
      alignItems: 'center',
    },
    backButton: {
      padding: 8,
      marginRight: 10, 
    },
    logoSection: {
      alignItems: "center",
      marginBottom: 32,
      width: '100%',
      paddingTop: 20, 
    },
    logoImage: {
      width: 150, // Larger, more prominent logo
      height: 120,
      borderRadius: 30, // More rounded corners
      marginBottom: 0, // No margin since we have a container
    },
    title: {
      fontSize: 36, // Even larger title for better impact
      fontWeight: "800", // Bolder font weight
      color: theme.text,
      marginBottom: 12, // More space below title
      textAlign: 'center',
      letterSpacing: -0.5, // Tighter letter spacing for modern look
    },
    subtitle: {
      fontSize: 17, // Slightly larger subtitle
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 26, // Better line height for readability
      paddingHorizontal: 20,
      maxWidth: 350, // Constrain width for better readability
      fontWeight: "400", // Medium weight for better readability
    },
    formContainer: {
      width: "100%",
      maxWidth: 400, // Max width for the form
      alignSelf: 'center', // Center the form container
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16, // More rounded input fields for modern look
      paddingHorizontal: 18, // Slightly more padding
      borderWidth: 1.5, // Slightly thicker border for better definition
      borderColor: theme.border,
      height: 60, // Slightly taller inputs for better touch targets
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    inputIcon: {
      marginRight: 12,
      color: theme.textMuted,
    },
    input: {
      flex: 1,
      color: theme.text,
      fontSize: 16,
      paddingVertical: 0, // Remove default vertical padding
    },
    eyeButton: {
      padding: 8, // Increased touch target
    },
    forgotPasswordContainer: {
      alignItems: "flex-end",
      marginBottom: 32,
    },
    forgotPasswordText: {
      color: theme.accent,
      fontSize: 15, // Slightly larger
      fontWeight: "600",
    },
    loginButton: {
      borderRadius: 16, // Match input field rounding
      backgroundColor: theme.accent,
      paddingVertical: 20, // Slightly more padding for better touch target
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 12,
      borderWidth: 1,
      borderColor: theme.accent + "20", // Subtle border
    },
    loginButtonDisabled: {
      opacity: 0.6, // More distinct disabled state
    },
    loginButtonText: {
      color: theme.primary,
      fontSize: 18,
      fontWeight: "bold",
      marginRight: 10,
      letterSpacing: 0.5,
    },
    buttonIcon: {
      color: theme.primary,
    },
    registerLinkContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 30, // More space above link
    },
    registerLinkText: {
      color: theme.textSecondary,
      fontSize: 16,
    },
    registerLink: {
      color: theme.accent,
      fontSize: 16,
      fontWeight: "bold",
    },
    securityNotice: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 24,
      marginTop: 40, // Increased margin from bottom
      borderTopWidth: 1, // Add a subtle separator
      borderColor: theme.border,
      paddingTop: 20,
    },
    securityText: {
      color: theme.textMuted,
      fontSize: 13, // Slightly larger text
      marginLeft: 8,
      textAlign: 'center',
    },
  })

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />

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
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold' }}></Text>
        <View style={{ width: 32, height: 32 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Logo and Title */}
          <View style={styles.logoSection}>
            <View style={{
              borderRadius: 35,
              padding: 20,
              shadowColor: theme.shadow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
            }}>
              <Image
                source={isDarkTheme ? lightLogo : darkLogo}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your account to continue trading</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor={theme.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={theme.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={theme.primary} size="small" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={20} style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerLinkContainer}>
              <Text style={styles.registerLinkText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.registerLink}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Ionicons name="shield-checkmark" size={16} color={theme.accent} />
            <Text style={styles.securityText}>Your data is protected with bank-level security</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
