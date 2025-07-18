// "use client"

// import { useState, useEffect } from "react"
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Image,
//   StatusBar,
//   Dimensions,
//   ScrollView,
//   TextInput,
//   Alert,
// } from "react-native"
// import { useRoute, useNavigation } from "@react-navigation/native"
// import { LinearGradient } from "expo-linear-gradient"
// import { Ionicons } from "@expo/vector-icons"
// import { supabase } from "./supabaseClient"

// const { width, height } = Dimensions.get("window")

// export default function BuyGiftcardVariants() {
//   const route = useRoute()
//   const navigation = useNavigation()
//   const { brand } = route.params
//   const [variants, setVariants] = useState([])
//   const [selectedVariant, setSelectedVariant] = useState(null)
//   const [quantity, setQuantity] = useState("1")
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     fetchVariants()
//   }, [])

//   const fetchVariants = async () => {
//     try {
//       // Get available variants for this brand
//       const { data, error } = await supabase
//         .from("giftcards_buy")
//         .select("variant_name, rate, value")
//         .eq("brand_name", brand.brand_name)
//         .eq("sold", false)
//         .is("assigned_to", null)

//       if (error) throw error

//       // Group by variant and count available
//       const variantMap = {}
//       ;(data || []).forEach((item) => {
//         const key = `${item.variant_name}_${item.rate}`
//         if (!variantMap[key]) {
//           variantMap[key] = {
//             name: item.variant_name,
//             rate: item.rate,
//             available_count: 0,
//             values: new Set(),
//           }
//         }
//         variantMap[key].available_count++
//         if (item.value > 0) {
//           variantMap[key].values.add(item.value)
//         }
//       })

//       const variantList = Object.values(variantMap).map((variant) => ({
//         ...variant,
//         values: Array.from(variant.values).sort((a, b) => a - b),
//       }))

//       setVariants(variantList)
//     } catch (error) {
//       console.error("Error fetching variants:", error)
//       Alert.alert("Error", "Failed to load variants")
//     }
//     setLoading(false)
//   }

//   const handleVariantSelect = (variant) => {
//     setSelectedVariant(variant)
//     setQuantity("1")
//   }

//   const handleProceed = () => {
//     if (!selectedVariant) {
//       Alert.alert("Error", "Please select a variant")
//       return
//     }

//     const qty = Number.parseInt(quantity)
//     if (isNaN(qty) || qty < 1) {
//       Alert.alert("Error", "Please enter a valid quantity")
//       return
//     }

//     if (qty > selectedVariant.available_count) {
//       Alert.alert("Error", `Only ${selectedVariant.available_count} items available for this variant`)
//       return
//     }

//     navigation.navigate("BuyGiftcardForm", {
//       brand,
//       variant: selectedVariant,
//       quantity: qty,
//     })
//   }

//   const calculateTotal = () => {
//     if (!selectedVariant) return 0
//     const qty = Number.parseInt(quantity) || 1
//     // Assuming average value for calculation - you might want to let user select specific values
//     const avgValue = selectedVariant.values.length > 0 ? selectedVariant.values[0] : 100
//     return avgValue * selectedVariant.rate * qty
//   }

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <Text style={styles.loadingText}>Loading variants...</Text>
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
//           <Text style={styles.headerTitle}>Select Variant</Text>
//           <View style={styles.placeholder} />
//         </View>

//         {/* Brand Info */}
//         <View style={styles.brandCard}>
//           <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.brandGradient}>
//             <View style={styles.brandImageContainer}>
//               {brand.image_url ? (
//                 <Image source={{ uri: brand.image_url }} style={styles.brandImage} resizeMode="contain" />
//               ) : (
//                 <View style={styles.brandImagePlaceholder}>
//                   <Text style={styles.brandImagePlaceholderText}>{brand.brand_name[0]}</Text>
//                 </View>
//               )}
//             </View>
//             <View style={styles.brandInfo}>
//               <Text style={styles.brandName}>{brand.brand_name}</Text>
//               <Text style={styles.brandSubtext}>{brand.available_count} cards available</Text>
//             </View>
//           </LinearGradient>
//         </View>

//         {/* Variants List */}
//         <View style={styles.variantsContainer}>
//           <Text style={styles.sectionTitle}>Available Variants</Text>
//           {variants.map((variant, index) => (
//             <TouchableOpacity
//               key={index}
//               style={[styles.variantCard, selectedVariant?.name === variant.name && styles.variantCardSelected]}
//               onPress={() => handleVariantSelect(variant)}
//               activeOpacity={0.8}
//             >
//               <View style={styles.variantContent}>
//                 <View style={styles.variantInfo}>
//                   <Text style={styles.variantName}>{variant.name}</Text>
//                   <View style={styles.rateContainer}>
//                     <Ionicons name="trending-up" size={16} color="#E3D095" />
//                     <Text style={styles.rateText}>₦{variant.rate} per $1</Text>
//                   </View>
//                   <Text style={styles.availableText}>{variant.available_count} available</Text>
//                   {variant.values.length > 0 && (
//                     <Text style={styles.valuesText}>Values: ${variant.values.join(", $")}</Text>
//                   )}
//                 </View>
//                 <View style={styles.variantAction}>
//                   <Ionicons
//                     name={selectedVariant?.name === variant.name ? "checkmark-circle" : "arrow-forward"}
//                     size={20}
//                     color={selectedVariant?.name === variant.name ? "#00b894" : "#fff"}
//                   />
//                 </View>
//               </View>
//             </TouchableOpacity>
//           ))}
//         </View>

//         {/* Quantity Selection */}
//         {selectedVariant && (
//           <View style={styles.quantityContainer}>
//             <Text style={styles.sectionTitle}>Select Quantity</Text>
//             <View style={styles.quantityCard}>
//               <View style={styles.quantityInputContainer}>
//                 <Text style={styles.quantityLabel}>Quantity (max {selectedVariant.available_count})</Text>
//                 <TextInput
//                   style={styles.quantityInput}
//                   value={quantity}
//                   onChangeText={setQuantity}
//                   keyboardType="numeric"
//                   placeholder="1"
//                   placeholderTextColor="rgba(255,255,255,0.5)"
//                 />
//               </View>
//               <View style={styles.totalContainer}>
//                 <Text style={styles.totalLabel}>Estimated Total:</Text>
//                 <Text style={styles.totalValue}>₦{calculateTotal().toLocaleString()}</Text>
//               </View>
//             </View>
//           </View>
//         )}

//         {/* Proceed Button */}
//         {selectedVariant && (
//           <TouchableOpacity style={styles.proceedButton} onPress={handleProceed} activeOpacity={0.8}>
//             <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.buttonGradient}>
//               <Text style={styles.proceedButtonText}>Proceed to Purchase</Text>
//               <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
//             </LinearGradient>
//           </TouchableOpacity>
//         )}

//         {variants.length === 0 && (
//           <View style={styles.emptyState}>
//             <Ionicons name="alert-circle-outline" size={48} color="rgba(255,255,255,0.3)" />
//             <Text style={styles.emptyStateText}>No variants available</Text>
//             <Text style={styles.emptyStateSubtext}>This brand doesn't have any available inventory</Text>
//           </View>
//         )}
//       </ScrollView>
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
//   },
//   backgroundGradient: {
//     position: "absolute",
//     left: 0,
//     right: 0,
//     top: 0,
//     height: height,
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     paddingHorizontal: 20,
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
//   brandCard: {
//     borderRadius: 20,
//     overflow: "hidden",
//     marginBottom: 32,
//     elevation: 8,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//   },
//   brandGradient: {
//     flexDirection: "row",
//     alignItems: "center",
//     padding: 24,
//   },
//   brandImageContainer: {
//     width: 60,
//     height: 60,
//     borderRadius: 12,
//     backgroundColor: "#fff",
//     justifyContent: "center",
//     alignItems: "center",
//     marginRight: 16,
//   },
//   brandImage: {
//     width: 40,
//     height: 40,
//   },
//   brandImagePlaceholder: {
//     width: 40,
//     height: 40,
//     borderRadius: 8,
//     backgroundColor: "#0E2148",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   brandImagePlaceholderText: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//   },
//   brandInfo: {
//     flex: 1,
//   },
//   brandName: {
//     color: "#fff",
//     fontSize: 20,
//     fontWeight: "bold",
//     marginBottom: 4,
//   },
//   brandSubtext: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 14,
//   },
//   variantsContainer: {
//     marginBottom: 24,
//   },
//   sectionTitle: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//     marginBottom: 16,
//   },
//   variantCard: {
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 16,
//     padding: 20,
//     marginBottom: 12,
//     borderWidth: 2,
//     borderColor: "rgba(255,255,255,0.2)",
//   },
//   variantCardSelected: {
//     borderColor: "#E3D095",
//     backgroundColor: "rgba(227, 208, 149, 0.1)",
//   },
//   variantContent: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   variantInfo: {
//     flex: 1,
//   },
//   variantName: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "bold",
//     marginBottom: 8,
//   },
//   rateContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 4,
//   },
//   rateText: {
//     color: "#E3D095",
//     fontSize: 14,
//     fontWeight: "600",
//     marginLeft: 6,
//   },
//   availableText: {
//     color: "#00b894",
//     fontSize: 12,
//     fontWeight: "600",
//     marginBottom: 4,
//   },
//   valuesText: {
//     color: "rgba(255,255,255,0.7)",
//     fontSize: 12,
//   },
//   variantAction: {
//     padding: 8,
//   },
//   quantityContainer: {
//     marginBottom: 24,
//   },
//   quantityCard: {
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 16,
//     padding: 20,
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.2)",
//   },
//   quantityInputContainer: {
//     marginBottom: 16,
//   },
//   quantityLabel: {
//     color: "#fff",
//     fontSize: 14,
//     fontWeight: "600",
//     marginBottom: 8,
//   },
//   quantityInput: {
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     color: "#fff",
//     fontSize: 16,
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.2)",
//   },
//   totalContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingTop: 16,
//     borderTopWidth: 1,
//     borderTopColor: "rgba(255,255,255,0.2)",
//   },
//   totalLabel: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   totalValue: {
//     color: "#E3D095",
//     fontSize: 18,
//     fontWeight: "bold",
//   },
//   proceedButton: {
//     borderRadius: 16,
//     overflow: "hidden",
//     marginBottom: 32,
//     elevation: 8,
//     shadowColor: "#7965C1",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//   },
//   buttonGradient: {
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
//   emptyState: {
//     alignItems: "center",
//     paddingVertical: 60,
//     paddingHorizontal: 24,
//   },
//   emptyStateText: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 18,
//     fontWeight: "600",
//     marginTop: 16,
//     marginBottom: 8,
//   },
//   emptyStateSubtext: {
//     color: "rgba(255,255,255,0.5)",
//     fontSize: 14,
//     textAlign: "center",
//   },
// })




"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  ScrollView,
  TextInput,
  Alert,
} from "react-native"
import { useRoute, useNavigation } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { supabase } from "./supabaseClient"

const { width, height } = Dimensions.get("window")

export default function BuyGiftcardVariants() {
  const route = useRoute()
  const navigation = useNavigation()
  const { brand } = route.params // 'brand' now comes from giftcards_buy_brands
  const [variants, setVariants] = useState([])
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [quantity, setQuantity] = useState("1")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVariants()
  }, [])

  const fetchVariants = async () => {
    try {
      // Get available variants for this brand from giftcards_buy
      const { data, error } = await supabase
        .from("giftcards_buy")
        .select("variant_name, rate, value")
        .eq("buy_brand_id", brand.id) // Use buy_brand_id
        .eq("sold", false)
        .is("assigned_to", null)

      if (error) throw error

      // Group by variant_name and value, and count available
      const variantMap = {}
      ;(data || []).forEach((item) => {
        const key = `${item.variant_name}_${item.value}_${item.rate}` // Unique key for variant + value + rate
        if (!variantMap[key]) {
          variantMap[key] = {
            name: item.variant_name,
            rate: item.rate,
            value: item.value,
            available_count: 0,
          }
        }
        variantMap[key].available_count++
      })

      const variantList = Object.values(variantMap).sort((a, b) => {
        // Sort by variant name, then value
        if (a.name < b.name) return -1
        if (a.name > b.name) return 1
        return a.value - b.value
      })

      setVariants(variantList)
    } catch (error) {
      console.error("Error fetching variants:", error)
      Alert.alert("Error", "Failed to load variants")
    }
    setLoading(false)
  }

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant)
    setQuantity("1") // Reset quantity when a new variant is selected
  }

  const handleProceed = () => {
    if (!selectedVariant) {
      Alert.alert("Error", "Please select a variant")
      return
    }

    const qty = Number.parseInt(quantity)
    if (isNaN(qty) || qty < 1) {
      Alert.alert("Error", "Please enter a valid quantity")
      return
    }

    if (qty > selectedVariant.available_count) {
      Alert.alert("Error", `Only ${selectedVariant.available_count} items available for this variant and value.`)
      return
    }

    navigation.navigate("BuyGiftcardForm", {
      brand, // Pass the brand object
      variant: selectedVariant, // Pass the selected variant (includes name, rate, value)
      quantity: qty,
    })
  }

  const calculateTotal = () => {
    if (!selectedVariant) return 0
    const qty = Number.parseInt(quantity) || 1
    return selectedVariant.value * selectedVariant.rate * qty
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading variants...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E2148" />
      <LinearGradient colors={["#0E2148", "#483AA0"]} style={styles.backgroundGradient} />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Variant</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Brand Info */}
        <View style={styles.brandCard}>
          <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.brandGradient}>
            <View style={styles.brandImageContainer}>
              {brand.image_url ? (
                <Image source={{ uri: brand.image_url }} style={styles.brandImage} resizeMode="contain" />
              ) : (
                <View style={styles.brandImagePlaceholder}>
                  <Text style={styles.brandImagePlaceholderText}>{brand.name[0]}</Text>
                </View>
              )}
            </View>
            <View style={styles.brandInfo}>
              <Text style={styles.brandName}>{brand.name}</Text>
              <Text style={styles.brandSubtext}>{brand.available_count} cards available</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Variants List */}
        <View style={styles.variantsContainer}>
          <Text style={styles.sectionTitle}>Available Variants</Text>
          {variants.map((variant, index) => (
            <TouchableOpacity
              key={`${variant.name}-${variant.value}-${variant.rate}-${index}`} // More robust key
              style={[
                styles.variantCard,
                selectedVariant?.name === variant.name &&
                  selectedVariant?.value === variant.value &&
                  styles.variantCardSelected,
              ]}
              onPress={() => handleVariantSelect(variant)}
              activeOpacity={0.8}
            >
              <View style={styles.variantContent}>
                <View style={styles.variantInfo}>
                  <Text style={styles.variantName}>
                    {variant.name} - ${variant.value}
                  </Text>
                  <View style={styles.rateContainer}>
                    <Ionicons name="trending-up" size={16} color="#E3D095" />
                    <Text style={styles.rateText}>₦{variant.rate} per $1</Text>
                  </View>
                  <Text style={styles.availableText}>{variant.available_count} available</Text>
                </View>
                <View style={styles.variantAction}>
                  <Ionicons
                    name={
                      selectedVariant?.name === variant.name && selectedVariant?.value === variant.value
                        ? "checkmark-circle"
                        : "arrow-forward"
                    }
                    size={20}
                    color={
                      selectedVariant?.name === variant.name && selectedVariant?.value === variant.value
                        ? "#00b894"
                        : "#fff"
                    }
                  />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quantity Selection */}
        {selectedVariant && (
          <View style={styles.quantityContainer}>
            <Text style={styles.sectionTitle}>Select Quantity</Text>
            <View style={styles.quantityCard}>
              <View style={styles.quantityInputContainer}>
                <Text style={styles.quantityLabel}>Quantity (max {selectedVariant.available_count})</Text>
                <TextInput
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={(text) => {
                    const num = Number.parseInt(text)
                    if (isNaN(num) || num < 1) {
                      setQuantity("1")
                    } else if (num > selectedVariant.available_count) {
                      setQuantity(selectedVariant.available_count.toString())
                    } else {
                      setQuantity(text)
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                />
              </View>
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Estimated Total:</Text>
                <Text style={styles.totalValue}>₦{calculateTotal().toLocaleString()}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Proceed Button */}
        {selectedVariant && (
          <TouchableOpacity style={styles.proceedButton} onPress={handleProceed} activeOpacity={0.8}>
            <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.buttonGradient}>
              <Text style={styles.proceedButtonText}>Proceed to Purchase</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {variants.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyStateText}>No variants available</Text>
            <Text style={styles.emptyStateSubtext}>This brand doesn't have any available inventory</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0E2148",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0E2148",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
  },
  backgroundGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: height,
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
    marginBottom: 32,
  },
  backButton: {
    paddingVertical: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  placeholder: {
    width: 40,
  },
  brandCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 32,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  brandGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
  },
  brandImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  brandImage: {
    width: 40,
    height: 40,
  },
  brandImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#0E2148",
    justifyContent: "center",
    alignItems: "center",
  },
  brandImagePlaceholderText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  brandInfo: {
    flex: 1,
  },
  brandName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  brandSubtext: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  variantsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  variantCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  variantCardSelected: {
    borderColor: "#E3D095",
    backgroundColor: "rgba(227, 208, 149, 0.1)",
  },
  variantContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  variantInfo: {
    flex: 1,
  },
  variantName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  rateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  rateText: {
    color: "#E3D095",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  availableText: {
    color: "#00b894",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  valuesText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  variantAction: {
    padding: 8,
  },
  quantityContainer: {
    marginBottom: 24,
  },
  quantityCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  quantityInputContainer: {
    marginBottom: 16,
  },
  quantityLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  quantityInput: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  totalLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  totalValue: {
    color: "#E3D095",
    fontSize: 18,
    fontWeight: "bold",
  },
  proceedButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 32,
    elevation: 8,
    shadowColor: "#7965C1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  proceedButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    textAlign: "center",
  },
})
