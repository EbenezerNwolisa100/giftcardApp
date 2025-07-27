// "use client"

// import { useState } from "react"
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   ActivityIndicator,
//   StatusBar,
//   Dimensions,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
// } from "react-native"
// import { supabase } from "./supabaseClient"
// import { LinearGradient } from "expo-linear-gradient"
// import { Ionicons, MaterialIcons } from "@expo/vector-icons"
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const { width, height } = Dimensions.get("window")

// export default function Register({ navigation }) {
//   const [name, setName] = useState("")
//   const [email, setEmail] = useState("")
//   const [password, setPassword] = useState("")
//   const [confirmPassword, setConfirmPassword] = useState("")
//   const [loading, setLoading] = useState(false)
//   const [showPassword, setShowPassword] = useState(false)
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false)

//   const validateForm = () => {
//     if (!name.trim()) {
//       Alert.alert("Error", "Please enter your full name.")
//       return false
//     }
//     if (!email.trim()) {
//       Alert.alert("Error", "Please enter your email address.")
//       return false
//     }
//     if (!/\S+@\S+\.\S+/.test(email)) {
//       Alert.alert("Error", "Please enter a valid email address.")
//       return false
//     }
//     if (password.length < 6) {
//       Alert.alert("Error", "Password must be at least 6 characters long.")
//       return false
//     }
//     if (password !== confirmPassword) {
//       Alert.alert("Error", "Passwords do not match.")
//       return false
//     }
//     return true
//   }

//   const handleRegister = async () => {
//     if (!validateForm()) return

//     setLoading(true)
//     const { data, error } = await supabase.auth.signUp({
//       email,
//       password,
//     })
//     setLoading(false)

//     if (error) {
//       Alert.alert("Registration Error", error.message)
//       return
//     }

//     // Store name for later profile upsert
//     await AsyncStorage.setItem('pending_name', name)

//     Alert.alert(
//       "Success",
//       "Registration successful! Please check your email to confirm your account before logging in.",
//       [
//         {
//           text: "OK",
//           onPress: () => {
//             setName("")
//             setEmail("")
//             setPassword("")
//             setConfirmPassword("")
//             navigation.navigate("Login")
//           },
//         },
//       ],
//     )
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#0E2148" />

//       <LinearGradient colors={["#0E2148", "#483AA0"]} style={styles.backgroundGradient} />

//       <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
//         <ScrollView
//           contentContainerStyle={styles.scrollContainer}
//           showsVerticalScrollIndicator={false}
//           keyboardShouldPersistTaps="handled"
//         >
//           {/* Header */}
//           <View style={styles.header}>
//             <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
//               {/* <Ionicons name="arrow-back" size={24} color="#fff" /> */}
//             </TouchableOpacity>
//           </View>

//           {/* Logo and Title */}
//           <View style={styles.logoSection}>
//             <View style={styles.logoContainer}>
//               <MaterialIcons name="person-add" size={32} color="#E3D095" />
//             </View>
//             <Text style={styles.title}>Create Account</Text>
//             <Text style={styles.subtitle}>Join thousands of users trading gift cards securely</Text>
//           </View>

//           {/* Form */}
//           <View style={styles.formContainer}>
//             <View style={styles.inputContainer}>
//               <View style={styles.inputWrapper}>
//                 <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
//       <TextInput
//         style={styles.input}
//                   placeholder="Full Name"
//                   placeholderTextColor="rgba(255,255,255,0.6)"
//         value={name}
//         onChangeText={setName}
//                   autoCapitalize="words"
//                 />
//               </View>
//             </View>

//             <View style={styles.inputContainer}>
//               <View style={styles.inputWrapper}>
//                 <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
//       <TextInput
//         style={styles.input}
//                   placeholder="Email Address"
//                   placeholderTextColor="rgba(255,255,255,0.6)"
//         value={email}
//         onChangeText={setEmail}
//         keyboardType="email-address"
//         autoCapitalize="none"
//       />
//               </View>
//             </View>

//             <View style={styles.inputContainer}>
//               <View style={styles.inputWrapper}>
//                 <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
//       <TextInput
//         style={styles.input}
//         placeholder="Password"
//                   placeholderTextColor="rgba(255,255,255,0.6)"
//         value={password}
//         onChangeText={setPassword}
//                   secureTextEntry={!showPassword}
//                 />
//                 <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
//                   <Ionicons
//                     name={showPassword ? "eye-off-outline" : "eye-outline"}
//                     size={20}
//                     color="rgba(255,255,255,0.6)"
//                   />
//                 </TouchableOpacity>
//               </View>
//             </View>

//             <View style={styles.inputContainer}>
//               <View style={styles.inputWrapper}>
//                 <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Confirm Password"
//                   placeholderTextColor="rgba(255,255,255,0.6)"
//                   value={confirmPassword}
//                   onChangeText={setConfirmPassword}
//                   secureTextEntry={!showConfirmPassword}
//                 />
//                 <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
//                   <Ionicons
//                     name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
//                     size={20}
//                     color="rgba(255,255,255,0.6)"
//                   />
//                 </TouchableOpacity>
//               </View>
//             </View>

//             {/* Password Requirements */}
//             <View style={styles.passwordRequirements}>
//               <Text style={styles.requirementsTitle}>Password must contain:</Text>
//               <View style={styles.requirement}>
//                 <Ionicons
//                   name={password.length >= 6 ? "checkmark-circle" : "ellipse-outline"}
//                   size={16}
//                   color={password.length >= 6 ? "#4caf50" : "rgba(255,255,255,0.5)"}
//                 />
//                 <Text style={[styles.requirementText, password.length >= 6 && styles.requirementMet]}>
//                   At least 6 characters
//                 </Text>
//               </View>
//             </View>

//             {/* Register Button */}
//             <TouchableOpacity
//               style={[styles.registerButton, loading && styles.registerButtonDisabled]}
//               onPress={handleRegister}
//               disabled={loading}
//               activeOpacity={0.8}
//             >
//               <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.buttonGradient}>
//                 {loading ? (
//                   <ActivityIndicator color="#fff" size="small" />
//                 ) : (
//                   <>
//                     <Text style={styles.registerButtonText}>Create Account</Text>
//                     <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
//                   </>
//                 )}
//               </LinearGradient>
//             </TouchableOpacity>

//             {/* Login Link */}
//             <View style={styles.loginLinkContainer}>
//               <Text style={styles.loginLinkText}>Already have an account? </Text>
//               <TouchableOpacity onPress={() => navigation.navigate("Login")}>
//                 <Text style={styles.loginLink}>Sign In</Text>
//       </TouchableOpacity>
//             </View>
//           </View>

//           {/* Terms */}
//           <View style={styles.termsContainer}>
//             <Text style={styles.termsText}>
//               By creating an account, you agree to our <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
//               <Text style={styles.termsLink}>Privacy Policy</Text>
//             </Text>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#0E2148",
//   },
//   backgroundGradient: {
//     position: "absolute",
//     left: 0,
//     right: 0,
//     top: 0,
//     height: height,
//   },
//   keyboardAvoidingView: {
//     flex: 1,
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     paddingHorizontal: 24,
//   },
//   header: {
//     paddingTop: 60,
//     marginBottom: 20,
//   },
//   backButton: {
//     padding: 8,
//     alignSelf: "flex-start",
//   },
//   logoSection: {
//     alignItems: "center",
//     marginBottom: 40,
//   },
//   logoContainer: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: "rgba(227, 208, 149, 0.2)",
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: "bold",
//     color: "#fff",
//     marginBottom: 8,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: "rgba(255,255,255,0.8)",
//     textAlign: "center",
//     lineHeight: 22,
//   },
//   formContainer: {
//     flex: 1,
//   },
//   inputContainer: {
//     marginBottom: 20,
//   },
//   inputWrapper: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 16,
//     paddingHorizontal: 16,
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.2)",
//   },
//   inputIcon: {
//     marginRight: 12,
//   },
//   input: {
//     flex: 1,
//     color: "#fff",
//     fontSize: 16,
//     paddingVertical: 16,
//   },
//   eyeButton: {
//     padding: 4,
//   },
//   passwordRequirements: {
//     marginBottom: 24,
//   },
//   requirementsTitle: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 14,
//     marginBottom: 8,
//   },
//   requirement: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 4,
//   },
//   requirementText: {
//     color: "rgba(255,255,255,0.5)",
//     fontSize: 14,
//     marginLeft: 8,
//   },
//   requirementMet: {
//     color: "#4caf50",
//   },
//   registerButton: {
//     borderRadius: 16,
//     overflow: "hidden",
//     marginBottom: 24,
//     elevation: 8,
//     shadowColor: "#7965C1",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//   },
//   registerButtonDisabled: {
//     opacity: 0.7,
//   },
//   buttonGradient: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 18,
//     paddingHorizontal: 32,
//   },
//   registerButtonText: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//     marginRight: 8,
//   },
//   buttonIcon: {
//     marginLeft: 4,
//   },
//   loginLinkContainer: {
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   loginLinkText: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 16,
//   },
//   loginLink: {
//     color: "#E3D095",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   termsContainer: {
//     paddingVertical: 24,
//     alignItems: "center",
//   },
//   termsText: {
//     color: "rgba(255,255,255,0.6)",
//     fontSize: 12,
//     textAlign: "center",
//     lineHeight: 18,
//   },
//   termsLink: {
//     color: "#E3D095",
//     fontWeight: "600",
//   },
// })





"use client"

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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    setLoading(false)
    if (error) {
      Alert.alert("Registration Error", error.message)
      return
    }
    // Store name for later profile upsert
    await AsyncStorage.setItem("pending_name", name)
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
      paddingTop: 60,
      marginBottom: 30,
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      padding: 8,
      marginRight: 10,
    },
    logoSection: {
      alignItems: "center",
      marginBottom: 40,
      width: '100%',
    },
    logoImage: {
      width: 90,
      height: 90,
      borderRadius: 22,
      marginBottom: 20,
    },
    title: {
      fontSize: 34,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 10,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      paddingHorizontal: 20,
      maxWidth: 350,
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
      borderRadius: 12,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: theme.border,
      height: 56,
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
    },
    requirementsTitle: {
      color: theme.textSecondary,
      fontSize: 14,
      marginBottom: 8,
      fontWeight: "600",
    },
    requirement: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    requirementText: {
      color: theme.textMuted,
      fontSize: 14,
      marginLeft: 8,
    },
    requirementMet: {
      color: theme.success,
    },
    registerButton: {
      borderRadius: 12,
      backgroundColor: theme.accent,
      paddingVertical: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 10,
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

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Logo and Title */}
          <View style={styles.logoSection}>
            <Image
              source={isDarkTheme ? lightLogo : darkLogo}
              style={styles.logoImage}
              resizeMode="contain"
            />
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
