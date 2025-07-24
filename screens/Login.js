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
// import { registerForPushNotificationsAsync } from "./notifications"
// import AsyncStorage from "@react-native-async-storage/async-storage"
// import { LinearGradient } from "expo-linear-gradient"
// import { Ionicons, MaterialIcons } from "@expo/vector-icons"

// const { width, height } = Dimensions.get("window")

// export default function Login({ navigation }) {
//   const [email, setEmail] = useState("")
//   const [password, setPassword] = useState("")
//   const [loading, setLoading] = useState(false)
//   const [showPassword, setShowPassword] = useState(false)

//   const validateForm = () => {
//     if (!email.trim()) {
//       Alert.alert("Error", "Please enter your email address.")
//       return false
//     }
//     if (!/\S+@\S+\.\S+/.test(email)) {
//       Alert.alert("Error", "Please enter a valid email address.")
//       return false
//     }
//     if (!password) {
//       Alert.alert("Error", "Please enter your password.")
//       return false
//     }
//     return true
//   }

//   const handleLogin = async () => {
//     if (!validateForm()) return

//     setLoading(true)
//     const { data, error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     })
//     setLoading(false)

//     if (error) {
//       Alert.alert("Login Error", error.message)
//       return
//     }

//     // After login, upsert profile if missing
//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       const { data: profile } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', user.id)
//         .single();
//       if (!profile) {
//         const pendingName = await AsyncStorage.getItem('pending_name');
//         if (pendingName) {
//           await supabase.from('profiles').upsert({ id: user.id, full_name: pendingName, email: user.email });
//           await AsyncStorage.removeItem('pending_name');
//         }
//       }
//     } catch (e) {
//       // ignore profile upsert errors
//     }

//     navigation.replace("Main")
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
//               <MaterialIcons name="login" size={32} color="#E3D095" />
//             </View>
//             <Text style={styles.title}>Welcome Back</Text>
//             <Text style={styles.subtitle}>Sign in to your account to continue trading</Text>
//           </View>

//           {/* Form */}
//           <View style={styles.formContainer}>
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

//             {/* Forgot Password */}
//             <TouchableOpacity style={styles.forgotPasswordContainer}>
//               <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
//             </TouchableOpacity>

//             {/* Login Button */}
//             <TouchableOpacity
//               style={[styles.loginButton, loading && styles.loginButtonDisabled]}
//               onPress={handleLogin}
//               disabled={loading}
//               activeOpacity={0.8}
//             >
//               <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.buttonGradient}>
//                 {loading ? (
//                   <ActivityIndicator color="#fff" size="small" />
//                 ) : (
//                   <>
//                     <Text style={styles.loginButtonText}>Sign In</Text>
//                     <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
//                   </>
//                 )}
//               </LinearGradient>
//             </TouchableOpacity>

//             {/* Register Link */}
//             <View style={styles.registerLinkContainer}>
//               <Text style={styles.registerLinkText}>Don't have an account? </Text>
//               <TouchableOpacity onPress={() => navigation.navigate("Register")}>
//                 <Text style={styles.registerLink}>Create Account</Text>
//       </TouchableOpacity>
//             </View>
//           </View>

//           {/* Security Notice */}
//           <View style={styles.securityNotice}>
//             <Ionicons name="shield-checkmark" size={16} color="#E3D095" />
//             <Text style={styles.securityText}>Your data is protected with bank-level security</Text>
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
//     marginBottom: 50,
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
//   forgotPasswordContainer: {
//     alignItems: "flex-end",
//     marginBottom: 32,
//   },
//   forgotPasswordText: {
//     color: "#E3D095",
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   loginButton: {
//     borderRadius: 16,
//     overflow: "hidden",
//     marginBottom: 24,
//     elevation: 8,
//     shadowColor: "#7965C1",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//   },
//   loginButtonDisabled: {
//     opacity: 0.7,
//   },
//   buttonGradient: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 18,
//     paddingHorizontal: 32,
//   },
//   loginButtonText: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//     marginRight: 8,
//   },
//   buttonIcon: {
//     marginLeft: 4,
//   },
//   registerLinkContainer: {
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   registerLinkText: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 16,
//   },
//   registerLink: {
//     color: "#E3D095",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   securityNotice: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 24,
//   },
//   securityText: {
//     color: "rgba(255,255,255,0.6)",
//     fontSize: 12,
//     marginLeft: 8,
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
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { useTheme } from "./ThemeContext" // Adjust path as needed

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
    },
    header: {
      paddingTop: 60,
      marginBottom: 20,
    },
    backButton: {
      padding: 8,
      alignSelf: "flex-start",
    },
    logoSection: {
      alignItems: "center",
      marginBottom: 50,
    },
    logoContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDarkTheme ? theme.surface : theme.secondary,
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
      fontSize: 32,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      paddingHorizontal: 20,
    },
    formContainer: {
      width: "100%",
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.surfaceSecondary, // New input background color
      borderRadius: 12,
      paddingHorizontal: 16,
      borderWidth: 2, // Slightly thicker border
      borderColor: theme.border, // Border color from theme
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
    forgotPasswordContainer: {
      alignItems: "flex-end",
      marginBottom: 32,
    },
    forgotPasswordText: {
      color: theme.accent,
      fontSize: 14,
      fontWeight: "600",
    },
    loginButton: {
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 24,
      backgroundColor: theme.accent, // Solid accent color
      paddingVertical: 18,
      paddingHorizontal: 32,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 8,
    },
    loginButtonDisabled: {
      opacity: 0.7,
    },
    loginButtonText: {
      color: theme.primary, // White text for contrast on Gunmetal
      fontSize: 18,
      fontWeight: "bold",
      marginRight: 8,
    },
    buttonIcon: {
      marginLeft: 4,
      color: theme.primary, // White icon for contrast
    },
    registerLinkContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 20,
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
      marginTop: "auto",
    },
    securityText: {
      color: theme.textMuted,
      fontSize: 12,
      marginLeft: 8,
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
            <View style={styles.logoContainer}>
              <MaterialIcons name="login" size={32} color={theme.accent} />
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
