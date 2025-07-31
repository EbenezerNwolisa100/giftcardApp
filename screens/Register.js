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
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useTheme } from "./ThemeContext" // Adjust path as needed
import { Image } from "react-native";
import lightLogo from "../assets/lightlogo.png";
import darkLogo from "../assets/darklogo.png";

const { width } = Dimensions.get("window")

export default function Register({ navigation }) {
  const { theme, isDarkTheme } = useTheme()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your full name.")
      return false
    }
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address.")
      return false
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Error", "Please enter a valid email address.")
      return false
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long.")
      return false
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.")
      return false
    }
    return true
  }

  const handleRegister = async () => {
    if (!validateForm()) return
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) {
        Alert.alert("Registration Error", error.message)
        return
      }

      // If registration is successful, create the profile immediately
      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            full_name: name,
            email: email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (profileError) {
          console.error("Profile creation error:", profileError)
          // Still store pending name as fallback
          await AsyncStorage.setItem("pending_name", name)
        } else {
          // Clear any existing pending name since profile was created successfully
          await AsyncStorage.removeItem("pending_name")
        }
      }

      Alert.alert(
        "Success",
        "Registration successful! Please check your email to confirm your account before logging in.",
        [
          {
            text: "OK",
            onPress: () => {
              setName("")
              setEmail("")
              setPassword("")
              setConfirmPassword("")
              navigation.navigate("Login")
            },
          },
        ],
      )
    } catch (error) {
      console.error("Registration error:", error)
      Alert.alert("Registration Error", "An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
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
      flexDirection: 'row',
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
      maxWidth: 350,
      fontWeight: "400", // Medium weight for better readability
    },
    formContainer: {
      width: "100%",
      maxWidth: 400,
      alignSelf: 'center',
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
      paddingVertical: 0,
    },
    eyeButton: {
      padding: 8,
    },
    passwordRequirements: {
      marginBottom: 24,
      paddingHorizontal: 10,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    requirementsTitle: {
      color: theme.textSecondary,
      fontSize: 15,
      marginBottom: 12,
      fontWeight: "600",
    },
    requirement: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
      paddingVertical: 2,
    },
    requirementText: {
      color: theme.textMuted,
      fontSize: 14,
      marginLeft: 10,
      fontWeight: "500",
    },
    requirementMet: {
      color: theme.success,
    },
    registerButton: {
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
    registerButtonDisabled: {
      opacity: 0.6,
    },
    registerButtonText: {
      color: theme.primary,
      fontSize: 18,
      fontWeight: "bold",
      marginRight: 10,
      letterSpacing: 0.5,
    },
    buttonIcon: {
      marginLeft: 4,
      color: theme.primary,
    },
    loginLinkContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 30,
    },
    loginLinkText: {
      color: theme.textSecondary,
      fontSize: 16,
    },
    loginLink: {
      color: theme.accent,
      fontSize: 16,
      fontWeight: "bold",
    },
    termsContainer: {
      paddingVertical: 24,
      alignItems: "center",
      marginTop: 40,
      borderTopWidth: 1,
      borderColor: theme.border,
      paddingTop: 20,
    },
    termsText: {
      color: theme.textMuted,
      fontSize: 13,
      textAlign: "center",
      lineHeight: 18,
      paddingHorizontal: 10,
      maxWidth: 350,
    },
    termsLink: {
      color: theme.accent,
      fontWeight: "600",
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
              elevation: 4,
            }}>
            <Image
              source={isDarkTheme ? lightLogo : darkLogo}
              style={styles.logoImage}
              resizeMode="contain"
            />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join thousands of users trading gift cards securely</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={theme.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

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

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor={theme.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={theme.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Requirements */}
            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementsTitle}>Password must contain:</Text>
              <View style={styles.requirement}>
                <Ionicons
                  name={password.length >= 6 ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={password.length >= 6 ? theme.success : theme.textMuted}
                />
                <Text style={[styles.requirementText, password.length >= 6 && styles.requirementMet]}>
                  At least 6 characters
                </Text>
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={theme.primary} size="small" />
              ) : (
                <>
                  <Text style={styles.registerButtonText}>Create Account</Text>
                  <Ionicons name="arrow-forward" size={20} style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginLinkText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By creating an account, you agree to our <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
