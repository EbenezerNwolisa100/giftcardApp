
// import { useState, useEffect } from "react"
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   ActivityIndicator,
//   StatusBar,
//   Dimensions,
//   ScrollView,
// } from "react-native"
// import { Picker } from "@react-native-picker/picker"
// import { supabase } from "./supabaseClient"
// import { LinearGradient } from "expo-linear-gradient"
// import { Ionicons } from "@expo/vector-icons"
// import { useNavigation } from "@react-navigation/native"

// const { width } = Dimensions.get("window")

// export default function RateCalculator() {
//   const [brands, setBrands] = useState([])
//   const [selectedBrand, setSelectedBrand] = useState(null)
//   const [amount, setAmount] = useState("")
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState("")
//   const navigation = useNavigation()

//   useEffect(() => {
//     const fetchBrands = async () => {
//       setLoading(true)
//       setError("")
//       try {
//         const { data, error } = await supabase
//           .from("giftcard_brands")
//           .select("id, name, buy_rate, sell_rate")
//           .order("name", { ascending: true })
//         if (error) throw error
//         setBrands(data || [])
//         if (data && data.length > 0) {
//           setSelectedBrand(data[0])
//         }
//       } catch (err) {
//         setError(err.message || "Failed to load brands.")
//       }
//       setLoading(false)
//     }
//     fetchBrands()
//   }, [])

//   // Real-time calculation
//   const calculateResults = () => {
//     if (!selectedBrand || !amount || isNaN(amount)) {
//       return { buyResult: 0, sellResult: 0 }
//     }
//     const amt = Number.parseFloat(amount)
//     return {
//       buyResult: amt * (selectedBrand.buy_rate || 0),
//       sellResult: amt * (selectedBrand.sell_rate || 0),
//     }
//   }

//   const { buyResult, sellResult } = calculateResults()

//   const handleBrandChange = (brandId) => {
//     const brand = brands.find((b) => b.id === brandId)
//     setSelectedBrand(brand)
//   }

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <StatusBar barStyle="light-content" backgroundColor="#0E2148" />
//         <ActivityIndicator size="large" color="#7965C1" />
//         <Text style={styles.loadingText}>Loading calculator...</Text>
//       </View>
//     )
//   }

//   if (error) {
//     return (
//       <View style={styles.errorContainer}>
//         <StatusBar barStyle="light-content" backgroundColor="#0E2148" />
//         <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
//         <Text style={styles.errorText}>{error}</Text>
//         <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()}>
//           <Text style={styles.retryButtonText}>Try Again</Text>
//         </TouchableOpacity>
//       </View>
//     )
//   }

//   if (brands.length === 0) {
//     return (
//       <View style={styles.errorContainer}>
//         <StatusBar barStyle="light-content" backgroundColor="#0E2148" />
//         <Ionicons name="card" size={48} color="rgba(255,255,255,0.3)" />
//         <Text style={styles.errorText}>No brands available</Text>
//       </View>
//     )
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#0E2148" />

//       <LinearGradient colors={["#0E2148", "#483AA0"]} style={styles.backgroundGradient} />

//       <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
//         {/* Header */}
//         <View style={styles.header}>
//           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
//             <Ionicons name="arrow-back" size={24} color="#fff" />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>Rate Calculator</Text>
//           <View style={styles.placeholder} />
//         </View>

//         {/* Title Section */}
//         <View style={styles.titleSection}>
//           <View style={styles.iconContainer}>
//             <Ionicons name="calculator" size={32} color="#E3D095" />
//           </View>
//           <Text style={styles.title}>Calculate Exchange Rates</Text>
//           <Text style={styles.subtitle}>Get real-time calculations for your gift cards</Text>
//         </View>

//         {/* Calculator Form */}
//         <View style={styles.calculatorCard}>
//           <LinearGradient colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]} style={styles.cardGradient}>
//             <View style={styles.inputContainer}>
//               <Text style={styles.inputLabel}>Select Gift Card Brand</Text>
//               <View style={styles.pickerWrapper}>
//                 <Picker
//                   selectedValue={selectedBrand?.id}
//                   style={styles.picker}
//                   onValueChange={handleBrandChange}
//                   dropdownIconColor="#fff"
//                 >
//                   {brands.map((brand) => (
//                     <Picker.Item key={brand.id} label={brand.name} value={brand.id} color="#fff" />
//                   ))}
//                 </Picker>
//               </View>
//             </View>

//             <View style={styles.inputContainer}>
//               <Text style={styles.inputLabel}>Enter Amount (USD)</Text>
//               <View style={styles.inputWrapper}>
//                 <Ionicons name="card" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
//                 <TextInput
//                   style={styles.input}
//                   keyboardType="numeric"
//                   value={amount}
//                   onChangeText={setAmount}
//                   placeholder="Enter amount in USD"
//                   placeholderTextColor="rgba(255,255,255,0.6)"
//                 />
//               </View>
//             </View>

//             {/* Real-time Results */}
//             {amount && !isNaN(amount) && Number(amount) > 0 && selectedBrand && (
//               <View style={styles.resultsContainer}>
//                 <Text style={styles.resultsTitle}>Live Calculation Results</Text>

//                 <View style={styles.resultCard}>
//                   <View style={styles.resultHeader}>
//                     <Ionicons name="trending-up" size={20} color="#4caf50" />
//                     <Text style={styles.resultType}>Selling Rate</Text>
//                   </View>
//                   <Text style={styles.resultAmount}>₦{buyResult.toLocaleString()}</Text>
//                   <Text style={styles.resultSubtext}>
//                     ${Number(amount).toLocaleString()} × ₦{selectedBrand.buy_rate}
//                   </Text>
//                 </View>

//                 {selectedBrand.sell_rate && (
//                   <View style={styles.resultCard}>
//                     <View style={styles.resultHeader}>
//                       <Ionicons name="trending-down" size={20} color="#ff6b6b" />
//                       <Text style={styles.resultType}>Buying Rate</Text>
//                     </View>
//                     <Text style={styles.resultAmount}>₦{sellResult.toLocaleString()}</Text>
//                     <Text style={styles.resultSubtext}>
//                       ${Number(amount).toLocaleString()} × ₦{selectedBrand.sell_rate}
//                     </Text>
//                   </View>
//                 )}
//               </View>
//             )}
//           </LinearGradient>
//         </View>

//         {/* Quick Actions */}
//         <View style={styles.quickActions}>
//           <TouchableOpacity
//             style={styles.actionButton}
//             onPress={() => navigation.navigate("SellGiftcard")}
//             activeOpacity={0.8}
//           >
//             <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.actionButtonGradient}>
//               <Ionicons name="card" size={20} color="#fff" />
//               <Text style={styles.actionButtonText}>Sell Gift Card</Text>
//             </LinearGradient>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.actionButton}
//             onPress={() => navigation.navigate("HottestRatesScreen")}
//             activeOpacity={0.8}
//           >
//             <View style={styles.actionButtonOutline}>
//               <Ionicons name="trending-up" size={20} color="#7965C1" />
//               <Text style={styles.actionButtonOutlineText}>View Live Rates</Text>
//             </View>
//           </TouchableOpacity>
//         </View>

//         {/* Info Section */}
//         <View style={styles.infoSection}>
//           <View style={styles.infoCard}>
//             <Ionicons name="information-circle" size={20} color="#E3D095" />
//             <Text style={styles.infoText}>
//               Rates are updated in real-time based on market conditions. Actual rates may vary slightly during
//               transaction processing.
//             </Text>
//           </View>
//         </View>
//       </ScrollView>
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
//     bottom: 0,
//   },
//   loadingContainer: {
//     flex: 1,
//     backgroundColor: "#0E2148",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   loadingText: {
//     color: "#fff",
//     fontSize: 16,
//     marginTop: 16,
//   },
//   errorContainer: {
//     flex: 1,
//     backgroundColor: "#0E2148",
//     justifyContent: "center",
//     alignItems: "center",
//     paddingHorizontal: 24,
//   },
//   errorText: {
//     color: "#ff6b6b",
//     fontSize: 16,
//     textAlign: "center",
//     marginTop: 16,
//     marginBottom: 24,
//   },
//   retryButton: {
//     backgroundColor: "#7965C1",
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 12,
//   },
//   retryButtonText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     paddingHorizontal: 20,
//     paddingBottom: 32,
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingTop: 40,
//     marginBottom: 32,
//   },
//   backButton: {
//     paddingVertical: 8,
//   },
//   headerTitle: {
//     color: "#fff",
//     fontSize: 20,
//     fontWeight: "bold",
//   },
//   placeholder: {
//     width: 40,
//   },
//   titleSection: {
//     alignItems: "center",
//     marginBottom: 32,
//   },
//   iconContainer: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: "rgba(227, 208, 149, 0.2)",
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#fff",
//     marginBottom: 8,
//     textAlign: "center",
//   },
//   subtitle: {
//     fontSize: 14,
//     color: "rgba(255,255,255,0.8)",
//     textAlign: "center",
//     lineHeight: 20,
//   },
//   calculatorCard: {
//     borderRadius: 20,
//     overflow: "hidden",
//     marginBottom: 24,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//   },
//   cardGradient: {
//     padding: 24,
//   },
//   inputContainer: {
//     marginBottom: 24,
//   },
//   inputLabel: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//     marginBottom: 8,
//   },
//   pickerWrapper: {
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.2)",
//   },
//   picker: {
//     color: "#fff",
//     height: 50,
//   },
//   inputWrapper: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 12,
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
//   resultsContainer: {
//     marginTop: 8,
//   },
//   resultsTitle: {
//     color: "#E3D095",
//     fontSize: 18,
//     fontWeight: "bold",
//     marginBottom: 16,
//     textAlign: "center",
//   },
//   resultCard: {
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.2)",
//   },
//   resultHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 8,
//   },
//   resultType: {
//     color: "#fff",
//     fontSize: 14,
//     fontWeight: "600",
//     marginLeft: 8,
//   },
//   resultAmount: {
//     color: "#fff",
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 4,
//   },
//   resultSubtext: {
//     color: "rgba(255,255,255,0.6)",
//     fontSize: 12,
//   },
//   quickActions: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 24,
//   },
//   actionButton: {
//     flex: 1,
//     marginHorizontal: 6,
//     borderRadius: 12,
//     overflow: "hidden",
//   },
//   actionButtonGradient: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 14,
//     paddingHorizontal: 16,
//   },
//   actionButtonText: {
//     color: "#fff",
//     fontSize: 14,
//     fontWeight: "bold",
//     marginLeft: 8,
//   },
//   actionButtonOutline: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 14,
//     paddingHorizontal: 16,
//     borderWidth: 1,
//     borderColor: "#7965C1",
//     borderRadius: 12,
//   },
//   actionButtonOutlineText: {
//     color: "#7965C1",
//     fontSize: 14,
//     fontWeight: "bold",
//     marginLeft: 8,
//   },
//   infoSection: {
//     marginTop: 8,
//   },
//   infoCard: {
//     backgroundColor: "rgba(227, 208, 149, 0.1)",
//     borderRadius: 12,
//     padding: 16,
//     flexDirection: "row",
//     alignItems: "flex-start",
//     borderWidth: 1,
//     borderColor: "rgba(227, 208, 149, 0.3)",
//   },
//   infoText: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 12,
//     lineHeight: 18,
//     marginLeft: 12,
//     flex: 1,
//   },
// })










"use client"
import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  ScrollView,
  Platform,
  RefreshControl, // Import RefreshControl
} from "react-native"
import { Picker } from "@react-native-picker/picker"
import { supabase } from "./supabaseClient"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { useTheme } from "./ThemeContext" // Import useTheme

const { width } = Dimensions.get("window")

export default function RateCalculator() {
  const { theme, isDarkTheme } = useTheme() // Get theme from context
  const [brands, setBrands] = useState([])
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [refreshing, setRefreshing] = useState(false) // State for RefreshControl
  const navigation = useNavigation()

  const fetchBrands = useCallback(async () => {
    setLoading(true)
    setRefreshing(true)
    setError("")
    try {
      const { data, error } = await supabase
        .from("giftcard_brands")
        .select("id, name, buy_rate, sell_rate")
        .order("name", { ascending: true })
      if (error) throw error
      setBrands(data || [])
      if (data && data.length > 0) {
        setSelectedBrand(data[0])
      }
    } catch (err) {
      setError(err.message || "Failed to load brands.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchBrands()
  }, [fetchBrands])

  // Real-time calculation
  const calculateResults = () => {
    if (!selectedBrand || !amount || isNaN(amount)) {
      return { buyResult: 0, sellResult: 0 }
    }
    const amt = Number.parseFloat(amount)
    return {
      buyResult: amt * (selectedBrand.buy_rate || 0),
      sellResult: amt * (selectedBrand.sell_rate || 0),
    }
  }
  const { buyResult, sellResult } = calculateResults()

  const handleBrandChange = (brandId) => {
    const brand = brands.find((b) => b.id === brandId)
    setSelectedBrand(brand)
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background, // Use theme background
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: theme.background, // Use theme background
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      color: theme.text, // Use theme text color
      fontSize: 16,
      marginTop: 16,
    },
    errorContainer: {
      flex: 1,
      backgroundColor: theme.background, // Use theme background
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
    },
    errorText: {
      color: theme.error, // Use theme error color
      fontSize: 16,
      textAlign: "center",
      marginTop: 16,
      marginBottom: 24,
    },
    retryButton: {
      backgroundColor: theme.accent, // Use theme accent color
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    retryButtonText: {
      color: theme.primary, // Use theme primary color for contrast
      fontSize: 16,
      fontWeight: "bold",
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingBottom: Platform.OS === "ios" ? 85 + 20 : 70 + 20,
      paddingTop: 20, // Space after fixed header
    },
    fixedHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 40,
      paddingBottom: 20,
      backgroundColor: theme.primary, // Fixed header background
      marginHorizontal: -24, // Extend to edges
      paddingHorizontal: 24,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      zIndex: 10,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      color: theme.text, // Use theme text color
      fontSize: 20,
      fontWeight: "600",
      flex: 1,
      textAlign: "center",
    },
    placeholder: {
      width: 40, // To balance the back button space
    },
    titleSection: {
      alignItems: "center",
      marginBottom: 32,
      marginTop: 32, // Space after fixed header
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.surfaceSecondary, // Use theme surfaceSecondary
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
      fontSize: 28, // Slightly larger title
      fontWeight: "bold",
      color: theme.text, // Use theme text color
      marginBottom: 8,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 16,
      color: theme.textSecondary, // Use theme textSecondary
      textAlign: "center",
      lineHeight: 22,
      paddingHorizontal: 10,
    },
    calculatorCard: {
      backgroundColor: theme.surface, // Use theme surface
      borderRadius: 20,
      padding: 24,
      marginBottom: 24,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    inputContainer: {
      marginBottom: 24,
    },
    inputLabel: {
      color: theme.text, // Use theme text color
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
    },
    pickerWrapper: {
      backgroundColor: theme.surfaceSecondary, // Use theme surfaceSecondary
      borderRadius: 12,
      borderWidth: 2, // Thicker border
      borderColor: theme.border, // Use theme border
      overflow: "hidden",
    },
    picker: {
      color: theme.text, // Use theme text color
      height: 56, // Taller picker
      backgroundColor: "transparent",
    },
    pickerItem: {
      color: theme.text, // Use theme text color
      backgroundColor: theme.surfaceSecondary, // Use theme surfaceSecondary
    },
    selectedBrandContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
      paddingHorizontal: 4,
    },
    selectedBrandText: {
      color: theme.success, // Use theme success color
      fontSize: 14,
      fontWeight: "500",
      marginLeft: 6,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.surfaceSecondary, // Use theme surfaceSecondary
      borderRadius: 12,
      paddingHorizontal: 16,
      borderWidth: 2, // Thicker border
      borderColor: theme.border, // Use theme border
    },
    inputIcon: {
      marginRight: 12,
      color: theme.textMuted, // Use theme textMuted
    },
    input: {
      flex: 1,
      color: theme.text, // Use theme text color
      fontSize: 16,
      paddingVertical: 16,
    },
    resultsContainer: {
      marginTop: 8,
    },
    resultsTitle: {
      color: theme.accent, // Use theme accent color
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 16,
      textAlign: "center",
    },
    resultCard: {
      backgroundColor: theme.surfaceSecondary, // Use theme surfaceSecondary
      borderRadius: 16,
      padding: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border, // Use theme border
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    resultHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    resultType: {
      color: theme.text, // Use theme text color
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    resultAmount: {
      color: theme.text, // Use theme text color
      fontSize: 28, // Slightly larger amount
      fontWeight: "bold",
      marginBottom: 4,
    },
    resultSubtext: {
      color: theme.textMuted, // Use theme textMuted
      fontSize: 12,
    },
    quickActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 24,
    },
    actionButton: {
      flex: 1,
      marginHorizontal: 6,
      borderRadius: 16, // Larger border radius
      overflow: "hidden",
      backgroundColor: theme.accent, // Solid accent color
      paddingVertical: 16, // Larger padding
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 8,
    },
    actionButtonText: {
      color: isDarkTheme ? theme.text : theme.primary, // Text color for contrast
      fontSize: 16,
      fontWeight: "bold",
      marginLeft: 8,
    },
    actionButtonOutline: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderWidth: 2, // Thicker border
      borderColor: theme.accent, // Use theme accent color
      borderRadius: 16, // Larger border radius
    },
    actionButtonOutlineText: {
      color: theme.accent, // Use theme accent color
      fontSize: 16,
      fontWeight: "bold",
      marginLeft: 8,
    },
    infoSection: {
      marginTop: 8,
    },
    infoCard: {
      backgroundColor: theme.surfaceSecondary, // Use theme surfaceSecondary
      borderRadius: 16,
      padding: 16,
      flexDirection: "row",
      alignItems: "flex-start",
      borderWidth: 1,
      borderColor: theme.border, // Use theme border
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    infoText: {
      color: theme.textSecondary, // Use theme textSecondary
      fontSize: 12,
      lineHeight: 18,
      marginLeft: 12,
      flex: 1,
    },
  })

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={styles.loadingText}>Loading calculator...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />
        <Ionicons name="alert-circle" size={48} color={theme.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBrands}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (brands.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />
        <Ionicons name="card" size={48} color={theme.textMuted} />
        <Text style={styles.errorText}>No brands available</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />

      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Calculator</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchBrands}
            tintColor={theme.accent}
            colors={[theme.accent]}
            progressBackgroundColor={theme.surface}
          />
        }
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="calculator" size={32} color={theme.accent} />
          </View>
          <Text style={styles.title}>Calculate Exchange Rates</Text>
          <Text style={styles.subtitle}>Get real-time calculations for your gift cards</Text>
        </View>

        {/* Calculator Form */}
        <View style={styles.calculatorCard}>
          <View style={styles.calculatorFormContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Select Gift Card Brand</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedBrand?.id}
                  style={styles.picker}
                  onValueChange={handleBrandChange}
                  dropdownIconColor={theme.accent} // Use theme accent
                  itemStyle={styles.pickerItem}
                >
                  {brands.map((brand) => (
                    <Picker.Item key={brand.id} label={brand.name} value={brand.id} />
                  ))}
                </Picker>
              </View>
              {selectedBrand && (
                <View style={styles.selectedBrandContainer}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                  <Text style={styles.selectedBrandText}>Selected: {selectedBrand.name}</Text>
                </View>
              )}
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Enter Amount (USD)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="card" size={20} color={theme.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Enter amount in USD"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>
            {/* Real-time Results */}
            {amount && !isNaN(amount) && Number(amount) > 0 && selectedBrand && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>Live Calculation Results</Text>
                <View style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <Ionicons name="trending-up" size={20} color={theme.success} />
                    <Text style={styles.resultType}>Selling Rate</Text>
                  </View>
                  <Text style={styles.resultAmount}>₦{buyResult.toLocaleString()}</Text>
                  <Text style={styles.resultSubtext}>
                    ${Number(amount).toLocaleString()} × ₦{selectedBrand.buy_rate}
                  </Text>
                </View>
                {selectedBrand.sell_rate && (
                  <View style={styles.resultCard}>
                    <View style={styles.resultHeader}>
                      <Ionicons name="trending-down" size={20} color={theme.error} />
                      <Text style={styles.resultType}>Buying Rate</Text>
                    </View>
                    <Text style={styles.resultAmount}>₦{sellResult.toLocaleString()}</Text>
                    <Text style={styles.resultSubtext}>
                      ${Number(amount).toLocaleString()} × ₦{selectedBrand.sell_rate}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("SellGiftcard")}
            activeOpacity={0.8}
          >
            <Ionicons name="card" size={20} color={isDarkTheme ? theme.text : theme.primary} />
            <Text style={styles.actionButtonText}>Sell Gift Card</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonOutline]}
            onPress={() => navigation.navigate("HottestRatesScreen")}
            activeOpacity={0.8}
          >
            <Ionicons name="trending-up" size={20} color={theme.accent} />
            <Text style={styles.actionButtonOutlineText}>View Live Rates</Text>
          </TouchableOpacity>
        </View>
        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color={theme.accent} />
            <Text style={styles.infoText}>
              Rates are updated in real-time based on market conditions. Actual rates may vary slightly during
              transaction processing.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
