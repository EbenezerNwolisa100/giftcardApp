// "use client"

// import { useEffect, useState, useCallback } from "react"
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ActivityIndicator,
//   StatusBar,
//   Dimensions,
//   TextInput,
//   FlatList,
//   RefreshControl,
// } from "react-native"
// import { supabase } from "./supabaseClient"
// import { useNavigation } from "@react-navigation/native"
// import { LinearGradient } from "expo-linear-gradient"
// import { Ionicons } from "@expo/vector-icons"
// import Modal from "react-native-modal"

// const { width } = Dimensions.get("window")

// export default function HottestRatesScreen() {
//   const navigation = useNavigation()

//   // Data states
//   const [allSellBrands, setAllSellBrands] = useState([])
//   const [allBuyBrands, setAllBuyBrands] = useState([]) // Stores giftcards_buy_brands
//   const [buyInventoryVariants, setBuyInventoryVariants] = useState({}) // Stores grouped giftcards_buy items by brand

//   // UI states
//   const [loading, setLoading] = useState(true)
//   const [refreshing, setRefreshing] = useState(false)
//   const [activeTab, setActiveTab] = useState("sell") // 'sell' or 'buy'

//   // Calculator states
//   const [selectedSellBrand, setSelectedSellBrand] = useState(null)
//   const [selectedSellVariant, setSelectedSellVariant] = useState(null)
//   const [selectedBuyBrand, setSelectedBuyBrand] = useState(null)
//   const [selectedBuyVariant, setSelectedBuyVariant] = useState(null) // Represents a unique variant_name/value/rate combo
//   const [calculatorAmount, setCalculatorAmount] = useState("")
//   const [calculatedNaira, setCalculatedNaira] = useState("0.00")

//   // Picker Modal states
//   const [isPickerVisible, setIsPickerVisible] = useState(false)
//   const [pickerData, setPickerData] = useState([])
//   const [pickerType, setPickerType] = useState("") // 'brand' or 'variant'

//   const fetchData = useCallback(async () => {
//     setLoading(true)
//     setRefreshing(true)
//     try {
//       // Fetch all sell brands with their variants
//       const { data: sellBrandsData, error: sellBrandsError } = await supabase.from("giftcards_sell").select(
//         `
//           id, name, image_url,
//           giftcards_sell_variants(id, name, sell_rate)
//         `,
//       )
//       if (sellBrandsError) throw sellBrandsError
//       setAllSellBrands(sellBrandsData || [])

//       // Fetch all buy brands
//       const { data: buyBrandsData, error: buyBrandsError } = await supabase
//         .from("giftcards_buy_brands")
//         .select(`id, name, image_url`)
//         .order("name")
//       if (buyBrandsError) throw buyBrandsError

//       // Fetch all available buy inventory items and group them by brand and variant
//       const { data: inventoryData, error: inventoryError } = await supabase
//         .from("giftcards_buy")
//         .select(`id, code, variant_name, value, rate, buy_brand_id`)
//         .eq("sold", false)
//         .is("assigned_to", null)

//       if (inventoryError) throw inventoryError

//       const groupedBuyVariants = {}
//       ;(inventoryData || []).forEach((item) => {
//         if (!groupedBuyVariants[item.buy_brand_id]) {
//           groupedBuyVariants[item.buy_brand_id] = {}
//         }
//         const variantKey = `${item.variant_name}_${item.value}_${item.rate}`
//         if (!groupedBuyVariants[item.buy_brand_id][variantKey]) {
//           groupedBuyVariants[item.buy_brand_id][variantKey] = {
//             name: item.variant_name,
//             value: item.value,
//             rate: item.rate,
//             available_count: 0,
//             items: [], // Store actual items to pass to form if needed
//           }
//         }
//         groupedBuyVariants[item.buy_brand_id][variantKey].available_count++
//         groupedBuyVariants[item.buy_brand_id][variantKey].items.push(item)
//       })
//       setBuyInventoryVariants(groupedBuyVariants)

//       // Filter buy brands to only include those that have available inventory
//       const filteredBuyBrands = (buyBrandsData || []).filter((brand) => {
//         return Object.keys(groupedBuyVariants[brand.id] || {}).length > 0
//       })
//       setAllBuyBrands(filteredBuyBrands)
//     } catch (error) {
//       console.error("Error fetching data:", error)
//     } finally {
//       setLoading(false)
//       setRefreshing(false)
//     }
//   }, [])

//   useEffect(() => {
//     fetchData()
//   }, [fetchData])

//   // Reset calculator and selected items when tab changes
//   useEffect(() => {
//     setSelectedSellBrand(null)
//     setSelectedSellVariant(null)
//     setSelectedBuyBrand(null)
//     setSelectedBuyVariant(null)
//     setCalculatorAmount("")
//     setCalculatedNaira("0.00")
//   }, [activeTab])

//   // Calculate payout whenever relevant states change
//   useEffect(() => {
//     const amount = Number.parseFloat(calculatorAmount)
//     if (isNaN(amount) || amount <= 0) {
//       setCalculatedNaira("0.00")
//       return
//     }

//     let rate = 0
//     if (activeTab === "sell" && selectedSellVariant) {
//       rate = selectedSellVariant.sell_rate
//       setCalculatedNaira(
//         (amount * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//       )
//     } else if (activeTab === "buy" && selectedBuyVariant) {
//       // For buy, the calculation is value * rate * quantity (quantity is 1 for single item)
//       // Here, we're calculating total cost for the entered USD amount, so it's amount * rate
//       rate = selectedBuyVariant.rate
//       setCalculatedNaira(
//         (amount * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
//       )
//     } else {
//       setCalculatedNaira("0.00")
//     }
//   }, [calculatorAmount, selectedSellVariant, selectedBuyVariant, activeTab])

//   const openBrandPicker = () => {
//     setPickerType("brand")
//     if (activeTab === "sell") {
//       setPickerData(allSellBrands)
//     } else {
//       // On buy tab, allBuyBrands is already filtered in fetchData
//       setPickerData(allBuyBrands)
//     }
//     setIsPickerVisible(true)
//   }

//   const openVariantPicker = () => {
//     setPickerType("variant")
//     if (activeTab === "sell" && selectedSellBrand) {
//       setPickerData(selectedSellBrand.giftcards_sell_variants || [])
//     } else if (activeTab === "buy" && selectedBuyBrand) {
//       const variantsForBrand = buyInventoryVariants[selectedBuyBrand.id] || {}
//       setPickerData(Object.values(variantsForBrand))
//     } else {
//       setPickerData([])
//     }
//     setIsPickerVisible(true)
//   }

//   const handlePickerSelect = (item) => {
//     if (pickerType === "brand") {
//       if (activeTab === "sell") {
//         setSelectedSellBrand(item)
//         setSelectedSellVariant(null) // Reset variant when brand changes
//       } else {
//         setSelectedBuyBrand(item)
//         setSelectedBuyVariant(null) // Reset variant when brand changes
//       }
//     } else if (pickerType === "variant") {
//       if (activeTab === "sell") {
//         setSelectedSellVariant(item)
//       } else {
//         setSelectedBuyVariant(item)
//       }
//     }
//     setIsPickerVisible(false)
//   }

//   const renderHeader = () => (
//     <LinearGradient colors={["#0E2148", "#483AA0"]} style={styles.headerGradient}>
//       <StatusBar barStyle="light-content" backgroundColor="#0E2148" />
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
//           <Ionicons name="arrow-back" size={24} color="#fff" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Rate Calculator</Text>
//         <View style={{ width: 32 }} /> {/* Placeholder for right side to keep title centered */}
//       </View>
//       <Text style={styles.headerSubtitle}>Calculate your gift card exchange value instantly</Text>
//     </LinearGradient>
//   )

//   const renderPickerItem = ({ item }) => (
//     <TouchableOpacity style={styles.pickerItem} onPress={() => handlePickerSelect(item)}>
//       <Text style={styles.pickerItemText}>
//         {pickerType === "brand"
//           ? item.name
//           : activeTab === "sell"
//             ? item.name
//             : `${item.name} ($${item.value} @ ₦${item.rate})`}
//       </Text>
//     </TouchableOpacity>
//   )

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <StatusBar barStyle="light-content" backgroundColor="#0E2148" />
//         <ActivityIndicator size="large" color="#7965C1" />
//         <Text style={styles.loadingText}>Loading data...</Text>
//       </View>
//     )
//   }

//   return (
//     <View style={styles.container}>
//       {renderHeader()}

//       <View style={styles.tabContainer}>
//         <TouchableOpacity
//           style={[styles.tab, activeTab === "sell" && styles.activeTab]}
//           onPress={() => setActiveTab("sell")}
//         >
//           <Ionicons name="trending-down" size={16} color={activeTab === "sell" ? "#fff" : "rgba(255,255,255,0.8)"} />
//           <Text style={[styles.tabText, activeTab === "sell" && styles.activeTabText]}>Sell Cards</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[styles.tab, activeTab === "buy" && styles.activeTab]}
//           onPress={() => setActiveTab("buy")}
//         >
//           <Ionicons name="trending-up" size={16} color={activeTab === "buy" ? "#fff" : "rgba(255,255,255,0.8)"} />
//           <Text style={[styles.tabText, activeTab === "buy" && styles.activeTabText]}>Buy Cards</Text>
//         </TouchableOpacity>
//       </View>

//       <RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor="#7965C1" />

//       <View style={styles.calculatorContainer}>
//         <Text style={styles.sectionTitle}>{activeTab === "sell" ? "Sell Card Calculator" : "Buy Card Calculator"}</Text>

//         {/* Brand Selector */}
//         <View style={styles.inputGroup}>
//           <Text style={styles.inputLabel}>Select Brand</Text>
//           <TouchableOpacity style={styles.dropdownButton} onPress={openBrandPicker}>
//             <Text style={styles.dropdownButtonText}>
//               {activeTab === "sell"
//                 ? selectedSellBrand?.name || "Choose a brand"
//                 : selectedBuyBrand?.name || "Choose a brand"}
//             </Text>
//             <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.6)" />
//           </TouchableOpacity>
//         </View>

//         {/* Variant Selector */}
//         <View style={styles.inputGroup}>
//           <Text style={styles.inputLabel}>Select Variant</Text>
//           <TouchableOpacity
//             style={[styles.dropdownButton, !(selectedSellBrand || selectedBuyBrand) && styles.dropdownButtonDisabled]}
//             onPress={openVariantPicker}
//             disabled={!(selectedSellBrand || selectedBuyBrand)}
//           >
//             <Text style={styles.dropdownButtonText}>
//               {activeTab === "sell"
//                 ? selectedSellVariant?.name || "Choose a variant"
//                 : selectedBuyVariant
//                   ? `${selectedBuyVariant.name} ($${selectedBuyVariant.value})`
//                   : "Choose a variant"}
//             </Text>
//             <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.6)" />
//           </TouchableOpacity>
//         </View>

//         {/* Amount Input */}
//         <View style={styles.inputGroup}>
//           <Text style={styles.inputLabel}>Amount (USD)</Text>
//           <TextInput
//             style={styles.textInput}
//             placeholder="Enter amount in USD"
//             placeholderTextColor="rgba(255,255,255,0.6)"
//             keyboardType="numeric"
//             value={calculatorAmount}
//             onChangeText={setCalculatorAmount}
//             editable={!!(selectedSellVariant || selectedBuyVariant)}
//           />
//         </View>

//         {/* Calculated Payout */}
//         <View style={styles.payoutContainer}>
//           <Text style={styles.payoutLabel}>You'll {activeTab === "sell" ? "Receive" : "Pay"}:</Text>
//           <Text style={styles.payoutValue}>₦{calculatedNaira}</Text>
//         </View>

//         {/* Clear Button */}
//         <TouchableOpacity
//           style={styles.clearButton}
//           onPress={() => {
//             setSelectedSellBrand(null)
//             setSelectedSellVariant(null)
//             setSelectedBuyBrand(null)
//             setSelectedBuyVariant(null)
//             setCalculatorAmount("")
//             setCalculatedNaira("0.00")
//           }}
//         >
//           <Ionicons name="refresh-circle-outline" size={20} color="#fff" />
//           <Text style={styles.clearButtonText}>Clear Calculator</Text>
//         </TouchableOpacity>

//         {/* Proceed Button (Optional, if user wants to go to form after calculation) */}
//         {(selectedSellVariant || selectedBuyVariant) && Number.parseFloat(calculatorAmount) > 0 && (
//           <TouchableOpacity
//             style={styles.proceedButton}
//             onPress={() => {
//               if (activeTab === "sell") {
//                 navigation.navigate("SellGiftcardForm", {
//                   brand: {
//                     ...selectedSellBrand,
//                     selectedVariant: selectedSellVariant,
//                     sell_rate: selectedSellVariant.sell_rate,
//                   },
//                 })
//               } else {
//                 // For buy, we need to find an actual inventory item to pass to BuyGiftcardForm
//                 // This assumes we're buying one card of the selected variant/value/rate
//                 const availableItems =
//                   buyInventoryVariants[selectedBuyBrand.id]?.[
//                     `${selectedBuyVariant.name}_${selectedBuyVariant.value}_${selectedBuyVariant.rate}`
//                   ]?.items || []
//                 if (availableItems.length > 0) {
//                   navigation.navigate("BuyGiftcardForm", {
//                     brand: selectedBuyBrand,
//                     variant: selectedBuyVariant,
//                     quantity: 1, // Assuming buying one for now from calculator
//                   })
//                 } else {
//                   alert("No available cards for this variant.")
//                 }
//               }
//             }}
//           >
//             <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.proceedButtonGradient}>
//               <Text style={styles.proceedButtonText}>Proceed to {activeTab === "sell" ? "Sell" : "Buy"}</Text>
//               <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
//             </LinearGradient>
//           </TouchableOpacity>
//         )}
//       </View>

//       {/* Picker Modal */}
//       <Modal isVisible={isPickerVisible} onBackdropPress={() => setIsPickerVisible(false)}>
//         <View style={styles.modalContent}>
//           <Text style={styles.modalTitle}>Select {pickerType === "brand" ? "Brand" : "Variant"}</Text>
//           <FlatList
//             data={pickerData}
//             keyExtractor={(item, index) => item.id || `${item.name}-${item.value}-${item.rate}-${index}`}
//             renderItem={renderPickerItem}
//             ListEmptyComponent={
//               <View style={styles.emptyState}>
//                 <Text style={styles.emptyStateText}>No {pickerType}s available</Text>
//               </View>
//             }
//           />
//           <TouchableOpacity style={styles.modalCloseButton} onPress={() => setIsPickerVisible(false)}>
//             <Text style={styles.modalCloseButtonText}>Cancel</Text>
//           </TouchableOpacity>
//         </View>
//       </Modal>
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#0E2148",
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
//   headerGradient: {
//     paddingBottom: 24,
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingTop: 40,
//     paddingBottom: 16,
//     paddingHorizontal: 20,
//   },
//   backButton: {
//     paddingVertical: 8,
//   },
//   headerTitle: {
//     color: "#fff",
//     fontSize: 20,
//     fontWeight: "bold",
//     flex: 1,
//     textAlign: "center",
//   },
//   headerSubtitle: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 14,
//     textAlign: "center",
//     paddingHorizontal: 20,
//     marginBottom: 24,
//   },
//   tabContainer: {
//     flexDirection: "row",
//     paddingHorizontal: 24,
//     marginTop: 16,
//     marginBottom: 24,
//     gap: 8,
//   },
//   tab: {
//     flex: 1,
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 12,
//     backgroundColor: "rgba(255,255,255,0.1)",
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.2)",
//     flexDirection: "row",
//     justifyContent: "center",
//     gap: 6,
//   },
//   activeTab: {
//     backgroundColor: "#7965C1",
//     borderColor: "#7965C1",
//     shadowColor: "#7965C1",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   tabText: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   activeTabText: {
//     color: "#fff",
//     fontWeight: "bold",
//   },
//   calculatorContainer: {
//     flex: 1,
//     paddingHorizontal: 24,
//     paddingBottom: 32,
//   },
//   sectionTitle: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//     marginBottom: 20,
//     textAlign: "center",
//   },
//   inputGroup: {
//     marginBottom: 20,
//   },
//   inputLabel: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//     marginBottom: 8,
//   },
//   dropdownButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 16,
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.2)",
//   },
//   dropdownButtonDisabled: {
//     opacity: 0.6,
//   },
//   dropdownButtonText: {
//     color: "#fff",
//     fontSize: 16,
//     flex: 1,
//   },
//   textInput: {
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 16,
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     color: "#fff",
//     fontSize: 16,
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.2)",
//   },
//   payoutContainer: {
//     backgroundColor: "rgba(227, 208, 149, 0.1)",
//     borderRadius: 16,
//     padding: 20,
//     marginTop: 20,
//     marginBottom: 20,
//     borderWidth: 1,
//     borderColor: "rgba(227, 208, 149, 0.3)",
//     alignItems: "center",
//   },
//   payoutLabel: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 16,
//     marginBottom: 8,
//   },
//   payoutValue: {
//     color: "#E3D095",
//     fontSize: 28,
//     fontWeight: "bold",
//   },
//   clearButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 12,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.3)",
//     marginBottom: 20,
//     gap: 8,
//   },
//   clearButtonText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   proceedButton: {
//     borderRadius: 16,
//     overflow: "hidden",
//     elevation: 8,
//     shadowColor: "#7965C1",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//   },
//   proceedButtonGradient: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 18,
//     paddingHorizontal: 32,
//   },
//   proceedButtonText: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//     marginRight: 8,
//   },
//   buttonIcon: {
//     marginLeft: 4,
//   },
//   modalContent: {
//     backgroundColor: "#0E2148",
//     borderRadius: 20,
//     padding: 20,
//     maxHeight: Dimensions.get("window").height * 0.7,
//   },
//   modalTitle: {
//     color: "#fff",
//     fontSize: 20,
//     fontWeight: "bold",
//     marginBottom: 20,
//     textAlign: "center",
//   },
//   pickerItem: {
//     paddingVertical: 15,
//     paddingHorizontal: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: "rgba(255,255,255,0.1)",
//   },
//   pickerItemText: {
//     color: "#fff",
//     fontSize: 16,
//   },
//   modalCloseButton: {
//     marginTop: 20,
//     paddingVertical: 15,
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 12,
//     alignItems: "center",
//   },
//   modalCloseButtonText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   emptyState: {
//     alignItems: "center",
//     paddingVertical: 40,
//   },
//   emptyStateText: {
//     color: "rgba(255,255,255,0.6)",
//     fontSize: 16,
//   },
// })








"use client"

import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  TextInput,
  FlatList,
  RefreshControl,
  ScrollView, // Use ScrollView for the main content
} from "react-native"
import { supabase } from "./supabaseClient" // Adjust path as needed
import { useNavigation } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import Modal from "react-native-modal"
import { useTheme } from "./ThemeContext" // Adjust path as needed

const { width } = Dimensions.get("window")
const HEADER_HEIGHT = 100 // Approximate height for the fixed header

export default function HottestRatesScreen() {
  const navigation = useNavigation()
  const { theme } = useTheme()

  // Data states
  const [allSellBrands, setAllSellBrands] = useState([])
  const [allBuyBrands, setAllBuyBrands] = useState([]) // Stores giftcards_buy_brands
  const [buyInventoryVariants, setBuyInventoryVariants] = useState({}) // Stores grouped giftcards_buy items by brand

  // UI states
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("sell") // 'sell' or 'buy'

  // Calculator states
  const [selectedSellBrand, setSelectedSellBrand] = useState(null)
  const [selectedSellVariant, setSelectedSellVariant] = useState(null)
  const [selectedBuyBrand, setSelectedBuyBrand] = useState(null)
  const [selectedBuyVariant, setSelectedBuyVariant] = useState(null) // Represents a unique variant_name/value/rate combo
  const [calculatorAmount, setCalculatorAmount] = useState("")
  const [calculatedNaira, setCalculatedNaira] = useState("0.00")

  // Picker Modal states
  const [isPickerVisible, setIsPickerVisible] = useState(false)
  const [pickerData, setPickerData] = useState([])
  const [pickerType, setPickerType] = useState("") // 'brand' or 'variant'

  const fetchData = useCallback(async () => {
    setLoading(true)
    setRefreshing(true)
    try {
      // Fetch all sell brands with their variants
      const { data: sellBrandsData, error: sellBrandsError } = await supabase.from("giftcards_sell").select(
        `
          id, name, image_url,
          giftcards_sell_variants(id, name, sell_rate)
        `,
      )
      if (sellBrandsError) throw sellBrandsError
      setAllSellBrands(sellBrandsData || [])

      // Fetch all buy brands
      const { data: buyBrandsData, error: buyBrandsError } = await supabase
        .from("giftcards_buy_brands")
        .select(`id, name, image_url`)
        .order("name")
      if (buyBrandsError) throw buyBrandsError

      // Fetch all available buy inventory items and group them by brand and variant
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("giftcards_buy")
        .select(`id, code, variant_name, value, rate, buy_brand_id`)
        .eq("sold", false)
        .is("assigned_to", null)
      if (inventoryError) throw inventoryError

      const groupedBuyVariants = {}
      ;(inventoryData || []).forEach((item) => {
        if (!groupedBuyVariants[item.buy_brand_id]) {
          groupedBuyVariants[item.buy_brand_id] = {}
        }
        const variantKey = `${item.variant_name}_${item.value}_${item.rate}`
        if (!groupedBuyVariants[item.buy_brand_id][variantKey]) {
          groupedBuyVariants[item.buy_brand_id][variantKey] = {
            name: item.variant_name,
            value: item.value,
            rate: item.rate,
            available_count: 0,
            items: [], // Store actual items to pass to form if needed
          }
        }
        groupedBuyVariants[item.buy_brand_id][variantKey].available_count++
        groupedBuyVariants[item.buy_brand_id][variantKey].items.push(item)
      })
      setBuyInventoryVariants(groupedBuyVariants)

      // Filter buy brands to only include those that have available inventory
      const filteredBuyBrands = (buyBrandsData || []).filter((brand) => {
        return Object.keys(groupedBuyVariants[brand.id] || {}).length > 0
      })
      setAllBuyBrands(filteredBuyBrands)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Reset calculator and selected items when tab changes
  useEffect(() => {
    setSelectedSellBrand(null)
    setSelectedSellVariant(null)
    setSelectedBuyBrand(null)
    setSelectedBuyVariant(null)
    setCalculatorAmount("")
    setCalculatedNaira("0.00")
  }, [activeTab])

  // Calculate payout whenever relevant states change
  useEffect(() => {
    const amount = Number.parseFloat(calculatorAmount)
    if (isNaN(amount) || amount <= 0) {
      setCalculatedNaira("0.00")
      return
    }
    let rate = 0
    if (activeTab === "sell" && selectedSellVariant) {
      rate = selectedSellVariant.sell_rate
      setCalculatedNaira(
        (amount * rate).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      )
    } else if (activeTab === "buy" && selectedBuyVariant) {
      // For buy, the calculation is value * rate * quantity (quantity is 1 for single item)
      // Here, we're calculating total cost for the entered USD amount, so it's amount * rate
      rate = selectedBuyVariant.rate
      setCalculatedNaira(
        (amount * rate).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      )
    } else {
      setCalculatedNaira("0.00")
    }
  }, [calculatorAmount, selectedSellVariant, selectedBuyVariant, activeTab])

  const openBrandPicker = () => {
    setPickerType("brand")
    if (activeTab === "sell") {
      setPickerData(allSellBrands)
    } else {
      // On buy tab, allBuyBrands is already filtered in fetchData
      setPickerData(allBuyBrands)
    }
    setIsPickerVisible(true)
  }

  const openVariantPicker = () => {
    setPickerType("variant")
    if (activeTab === "sell" && selectedSellBrand) {
      setPickerData(selectedSellBrand.giftcards_sell_variants || [])
    } else if (activeTab === "buy" && selectedBuyBrand) {
      const variantsForBrand = buyInventoryVariants[selectedBuyBrand.id] || {}
      setPickerData(Object.values(variantsForBrand))
    } else {
      setPickerData([])
    }
    setIsPickerVisible(true)
  }

  const handlePickerSelect = (item) => {
    if (pickerType === "brand") {
      if (activeTab === "sell") {
        setSelectedSellBrand(item)
        setSelectedSellVariant(null) // Reset variant when brand changes
      } else {
        setSelectedBuyBrand(item)
        setSelectedBuyVariant(null) // Reset variant when brand changes
      }
    } else if (pickerType === "variant") {
      if (activeTab === "sell") {
        setSelectedSellVariant(item)
      } else {
        setSelectedBuyVariant(item)
      }
    }
    setIsPickerVisible(false)
  }

  const renderPickerItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.pickerItem, { borderBottomColor: theme.border }]}
      onPress={() => handlePickerSelect(item)}
    >
      <Text style={[styles.pickerItemText, { color: theme.text }]}>
        {pickerType === "brand"
          ? item.name
          : activeTab === "sell"
            ? item.name
            : `${item.name} ($${item.value} @ ₦${item.rate})`}
      </Text>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.primary} />
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading data...</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} backgroundColor={theme.primary} />

      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Rate Calculator</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: HEADER_HEIGHT + 20 }, // Adjust padding to clear fixed header
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchData}
            tintColor={theme.accent}
            colors={[theme.accent]}
            progressBackgroundColor={theme.surface}
          />
        }
      >
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                shadowColor: theme.shadow,
              },
              activeTab === "sell" && {
                backgroundColor: theme.accent,
                borderColor: theme.accent,
                shadowColor: theme.accent,
              },
            ]}
            onPress={() => setActiveTab("sell")}
          >
            <Ionicons
              name="trending-down"
              size={16}
              color={activeTab === "sell" ? theme.textContrast : theme.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "sell" ? { color: theme.textContrast } : { color: theme.textSecondary },
              ]}
            >
              Sell Cards
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                shadowColor: theme.shadow,
              },
              activeTab === "buy" && {
                backgroundColor: theme.accent,
                borderColor: theme.accent,
                shadowColor: theme.accent,
              },
            ]}
            onPress={() => setActiveTab("buy")}
          >
            <Ionicons
              name="trending-up"
              size={16}
              color={activeTab === "buy" ? theme.textContrast : theme.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "buy" ? { color: theme.textContrast } : { color: theme.textSecondary },
              ]}
            >
              Buy Cards
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.calculatorContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {activeTab === "sell" ? "Sell Card Calculator" : "Buy Card Calculator"}
          </Text>

          {/* Brand Selector */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Select Brand</Text>
            <TouchableOpacity
              style={[styles.dropdownButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={openBrandPicker}
            >
              <Text style={[styles.dropdownButtonText, { color: theme.text }]}>
                {activeTab === "sell"
                  ? selectedSellBrand?.name || "Choose a brand"
                  : selectedBuyBrand?.name || "Choose a brand"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Variant Selector */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Select Variant</Text>
            <TouchableOpacity
              style={[
                styles.dropdownButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
                !(selectedSellBrand || selectedBuyBrand) && styles.dropdownButtonDisabled,
              ]}
              onPress={openVariantPicker}
              disabled={!(selectedSellBrand || selectedBuyBrand)}
            >
              <Text style={[styles.dropdownButtonText, { color: theme.text }]}>
                {activeTab === "sell"
                  ? selectedSellVariant?.name || "Choose a variant"
                  : selectedBuyVariant
                    ? `${selectedBuyVariant.name} ($${selectedBuyVariant.value})`
                    : "Choose a variant"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>Amount (USD)</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="Enter amount in USD"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={calculatorAmount}
              onChangeText={setCalculatorAmount}
              editable={!!(selectedSellVariant || selectedBuyVariant)}
            />
          </View>

          {/* Calculated Payout */}
          <View
            style={[styles.payoutContainer, { backgroundColor: theme.accentBackground, borderColor: theme.accent }]}
          >
            <Text style={[styles.payoutLabel, { color: theme.textSecondary }]}>
              You'll {activeTab === "sell" ? "Receive" : "Pay"}:
            </Text>
            <Text style={[styles.payoutValue, { color: theme.accent }]}>₦{calculatedNaira}</Text>
          </View>

          {/* Clear Button */}
          <TouchableOpacity
            style={[styles.clearButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
            onPress={() => {
              setSelectedSellBrand(null)
              setSelectedSellVariant(null)
              setSelectedBuyBrand(null)
              setSelectedBuyVariant(null)
              setCalculatorAmount("")
              setCalculatedNaira("0.00")
            }}
          >
            <Ionicons name="refresh-circle-outline" size={20} color={theme.text} />
            <Text style={[styles.clearButtonText, { color: theme.text }]}>Clear Calculator</Text>
          </TouchableOpacity>

          {/* Proceed Button (Optional, if user wants to go to form after calculation) */}
          {(selectedSellVariant || selectedBuyVariant) && Number.parseFloat(calculatorAmount) > 0 && (
            <TouchableOpacity
              style={[styles.proceedButton, { shadowColor: theme.accent }]}
              onPress={() => {
                if (activeTab === "sell") {
                  navigation.navigate("SellGiftcardForm", {
                    brand: {
                      ...selectedSellBrand,
                      selectedVariant: selectedSellVariant,
                      sell_rate: selectedSellVariant.sell_rate,
                    },
                  })
                } else {
                  // For buy, we need to find an actual inventory item to pass to BuyGiftcardForm
                  // This assumes we're buying one card of the selected variant/value/rate
                  const availableItems =
                    buyInventoryVariants[selectedBuyBrand.id]?.[
                      `${selectedBuyVariant.name}_${selectedBuyVariant.value}_${selectedBuyVariant.rate}`
                    ]?.items || []
                  if (availableItems.length > 0) {
                    navigation.navigate("BuyGiftcardForm", {
                      brand: selectedBuyBrand,
                      variant: selectedBuyVariant,
                      quantity: 1, // Assuming buying one for now from calculator
                    })
                  } else {
                    alert("No available cards for this variant.")
                  }
                }
              }}
            >
              <LinearGradient colors={[theme.accent, theme.secondary]} style={styles.proceedButtonGradient}>
                <Text style={[styles.proceedButtonText, { color: theme.textContrast }]}>
                  Proceed to {activeTab === "sell" ? "Sell" : "Buy"}
                </Text>
                <Ionicons name="arrow-forward" size={20} color={theme.textContrast} style={styles.buttonIcon} />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Picker Modal */}
      <Modal isVisible={isPickerVisible} onBackdropPress={() => setIsPickerVisible(false)}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            Select {pickerType === "brand" ? "Brand" : "Variant"}
          </Text>
          <FlatList
            data={pickerData}
            keyExtractor={(item, index) => item.id || `${item.name}-${item.value}-${item.rate}-${index}`}
            renderItem={renderPickerItem}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>No {pickerType}s available</Text>
              </View>
            }
          />
          <TouchableOpacity
            style={[styles.modalCloseButton, { backgroundColor: theme.surface }]}
            onPress={() => setIsPickerVisible(false)}
          >
            <Text style={[styles.modalCloseButtonText, { color: theme.text }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  fixedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    height: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight || 40, // Dynamic padding for status bar
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)", // Will be themed
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: StatusBar.currentHeight || 40, // Align with header content
    paddingVertical: 8,
    zIndex: 11,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 24, // To balance the back button
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 24,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  calculatorContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
  },
  dropdownButtonDisabled: {
    opacity: 0.6,
  },
  dropdownButtonText: {
    fontSize: 16,
    flex: 1,
  },
  textInput: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  payoutContainer: {
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  payoutLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  payoutValue: {
    fontSize: 28,
    fontWeight: "bold",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    gap: 8,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  proceedButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  proceedButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  proceedButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    maxHeight: Dimensions.get("window").height * 0.7,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  pickerItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  pickerItemText: {
    fontSize: 16,
  },
  modalCloseButton: {
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
  },
})
