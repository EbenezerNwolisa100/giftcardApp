// import React, { useState } from 'react';
// import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
// import { supabase } from './supabaseClient';
// import { MaterialIcons } from '@expo/vector-icons';

// export default function ChangePassword() {
//   const [currentPassword, setCurrentPassword] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [showCurrent, setShowCurrent] = useState(false);
//   const [showNew, setShowNew] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const handleChangePassword = async () => {
//     if (!currentPassword || !newPassword || !confirmPassword) {
//       Alert.alert('Error', 'All fields are required.');
//       return;
//     }
//     if (newPassword !== confirmPassword) {
//       Alert.alert('Error', 'New passwords do not match.');
//       return;
//     }
//     setLoading(true);
//     // Re-authenticate user (Supabase does not require current password for update, but you may want to check it in your backend)
//     const { error } = await supabase.auth.updateUser({ password: newPassword });
//     setLoading(false);
//     if (error) {
//       Alert.alert('Error', error.message);
//     } else {
//       Alert.alert('Success', 'Password changed successfully!');
//       setCurrentPassword('');
//       setNewPassword('');
//       setConfirmPassword('');
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Change Password</Text>
//       <View style={styles.inputRow}>
//         <TextInput
//           style={styles.input}
//           placeholder="Current Password"
//           value={currentPassword}
//           onChangeText={setCurrentPassword}
//           secureTextEntry={!showCurrent}
//         />
//         <TouchableOpacity onPress={() => setShowCurrent(v => !v)}>
//           <MaterialIcons name={showCurrent ? 'visibility' : 'visibility-off'} size={24} color="#636e72" />
//         </TouchableOpacity>
//       </View>
//       <View style={styles.inputRow}>
//         <TextInput
//           style={styles.input}
//           placeholder="New Password"
//           value={newPassword}
//           onChangeText={setNewPassword}
//           secureTextEntry={!showNew}
//         />
//         <TouchableOpacity onPress={() => setShowNew(v => !v)}>
//           <MaterialIcons name={showNew ? 'visibility' : 'visibility-off'} size={24} color="#636e72" />
//         </TouchableOpacity>
//       </View>
//       <View style={styles.inputRow}>
//         <TextInput
//           style={styles.input}
//           placeholder="Confirm New Password"
//           value={confirmPassword}
//           onChangeText={setConfirmPassword}
//           secureTextEntry={!showConfirm}
//         />
//         <TouchableOpacity onPress={() => setShowConfirm(v => !v)}>
//           <MaterialIcons name={showConfirm ? 'visibility' : 'visibility-off'} size={24} color="#636e72" />
//         </TouchableOpacity>
//       </View>
//       <TouchableOpacity style={styles.button} onPress={handleChangePassword} disabled={loading}>
//         {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Change Password</Text>}
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f6fa',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 24,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#2d3436',
//     marginBottom: 16,
//   },
//   inputRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#dfe6e9',
//     marginBottom: 16,
//     paddingHorizontal: 8,
//   },
//   input: {
//     flex: 1,
//     padding: 14,
//     fontSize: 18,
//     color: '#2d3436',
//   },
//   button: {
//     backgroundColor: '#0984e3',
//     paddingVertical: 14,
//     paddingHorizontal: 40,
//     borderRadius: 8,
//     marginTop: 8,
//     width: '100%',
//     alignItems: 'center',
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '600',
//   },
// }); 






"use client"

import { useState } from "react"
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
} from "react-native"
import { supabase } from "./supabaseClient"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"

const { width, height } = Dimensions.get("window")

export default function ChangePassword({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

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
    // Re-authenticate user (Supabase does not require current password for update, but you may want to check it in your backend)
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E2148" />

      <LinearGradient colors={["#0E2148", "#483AA0"]} style={styles.backgroundGradient} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Change Password</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Security Icon */}
          <View style={styles.iconSection}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="security" size={32} color="#E3D095" />
            </View>
            <Text style={styles.title}>Update Your Password</Text>
            <Text style={styles.subtitle}>Choose a strong password to keep your account secure</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter current password"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrent}
                />
                <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeButton}>
                  <Ionicons
                    name={showCurrent ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="rgba(255,255,255,0.6)"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNew}
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeButton}>
                  <Ionicons
                    name={showNew ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="rgba(255,255,255,0.6)"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeButton}>
                  <Ionicons
                    name={showConfirm ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="rgba(255,255,255,0.6)"
                  />
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
                  color={newPassword.length >= 6 ? "#4caf50" : "rgba(255,255,255,0.5)"}
                />
                <Text style={[styles.requirementText, newPassword.length >= 6 && styles.requirementMet]}>
                  At least 6 characters
                </Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={newPassword !== confirmPassword || !confirmPassword ? "ellipse-outline" : "checkmark-circle"}
                  size={16}
                  color={newPassword === confirmPassword && confirmPassword ? "#4caf50" : "rgba(255,255,255,0.5)"}
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
              <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.buttonGradient}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.changeButtonText}>Update Password</Text>
                    <Ionicons name="checkmark" size={20} color="#fff" style={styles.buttonIcon} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Security Tips */}
          <View style={styles.securityTips}>
            <View style={styles.tipItem}>
              <Ionicons name="shield-checkmark" size={16} color="#E3D095" />
              <Text style={styles.tipText}>Use a unique password you don't use elsewhere</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="key" size={16} color="#E3D095" />
              <Text style={styles.tipText}>Include numbers, letters, and special characters</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
    height: height,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 40,
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  placeholder: {
    width: 40,
  },
  iconSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(227, 208, 149, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 20,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#fff",
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
    color: "rgba(255,255,255,0.8)",
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
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    marginLeft: 8,
  },
  requirementMet: {
    color: "#4caf50",
  },
  changeButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    elevation: 8,
    shadowColor: "#7965C1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  changeButtonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  changeButtonText: {
    color: "#fff",
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
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
})
