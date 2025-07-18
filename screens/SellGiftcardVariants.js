// "use client"

// import { useState } from "react"
// import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar, Dimensions, ScrollView } from "react-native"
// import { useRoute, useNavigation } from "@react-navigation/native"
// import { LinearGradient } from "expo-linear-gradient"
// import { Ionicons } from "@expo/vector-icons"

// const { width, height } = Dimensions.get("window")

// export default function SellGiftcardVariants() {
//   const route = useRoute()
//   const navigation = useNavigation()
//   const { brand } = route.params
//   const [selectedVariant, setSelectedVariant] = useState(null)

//   const variants = brand.giftcard_variants || []

//   const handleVariantSelect = (variant) => {
//     const brandWithVariant = {
//       ...brand,
//       selectedVariant: variant,
//       sell_rate: variant.sell_rate, // For backward compatibility
//     }
//     navigation.navigate("SellGiftcardForm", { brand: brandWithVariant })
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
//                   <Text style={styles.brandImagePlaceholderText}>{brand.name[0]}</Text>
//                 </View>
//               )}
//             </View>
//             <View style={styles.brandInfo}>
//               <Text style={styles.brandName}>{brand.name}</Text>
//               <Text style={styles.brandSubtext}>Choose a variant to sell</Text>
//             </View>
//           </LinearGradient>
//         </View>

//         {/* Variants List */}
//         <View style={styles.variantsContainer}>
//           <Text style={styles.sectionTitle}>Available Variants</Text>
//           {variants.map((variant, index) => (
//             <TouchableOpacity
//               key={variant.id}
//               style={[styles.variantCard, selectedVariant?.id === variant.id && styles.variantCardSelected]}
//               onPress={() => handleVariantSelect(variant)}
//               activeOpacity={0.8}
//             >
//               <View style={styles.variantContent}>
//                 <View style={styles.variantInfo}>
//                   <Text style={styles.variantName}>{variant.name}</Text>
//                   <View style={styles.rateContainer}>
//                     <Ionicons name="trending-up" size={16} color="#E3D095" />
//                     <Text style={styles.rateText}>₦{variant.sell_rate} per $1</Text>
//                   </View>
//                 </View>
//                 <View style={styles.variantAction}>
//                   <Ionicons name="arrow-forward" size={20} color="#fff" />
//                 </View>
//               </View>

//               {/* Example calculation */}
//               <View style={styles.exampleContainer}>
//                 <Text style={styles.exampleText}>
//                   Example: $100 card = ₦{(100 * variant.sell_rate).toLocaleString()}
//                 </Text>
//               </View>
//             </TouchableOpacity>
//           ))}
//         </View>

//         {variants.length === 0 && (
//           <View style={styles.emptyState}>
//             <Ionicons name="alert-circle-outline" size={48} color="rgba(255,255,255,0.3)" />
//             <Text style={styles.emptyStateText}>No variants available</Text>
//             <Text style={styles.emptyStateSubtext}>This brand doesn't have any variants configured yet</Text>
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
//     gap: 16,
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
//     marginBottom: 12,
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
//   },
//   rateText: {
//     color: "#E3D095",
//     fontSize: 14,
//     fontWeight: "600",
//     marginLeft: 6,
//   },
//   variantAction: {
//     padding: 8,
//   },
//   exampleContainer: {
//     backgroundColor: "rgba(0, 184, 148, 0.1)",
//     borderRadius: 8,
//     padding: 12,
//     borderWidth: 1,
//     borderColor: "rgba(0, 184, 148, 0.3)",
//   },
//   exampleText: {
//     color: "#00b894",
//     fontSize: 12,
//     fontWeight: "600",
//     textAlign: "center",
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

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar, Dimensions, ScrollView } from "react-native"
import { useRoute, useNavigation } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"

const { width, height } = Dimensions.get("window")

export default function SellGiftcardVariants() {
  const route = useRoute()
  const navigation = useNavigation()
  const { brand } = route.params
  const [selectedVariant, setSelectedVariant] = useState(null)

  const variants = brand.giftcards_sell_variants || []

  const handleVariantSelect = (variant) => {
    const brandWithVariant = {
      ...brand,
      selectedVariant: variant,
      sell_rate: variant.sell_rate, // For backward compatibility
    }
    navigation.navigate("SellGiftcardForm", { brand: brandWithVariant })
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
              <Text style={styles.brandSubtext}>Choose a variant to sell</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Variants List */}
        <View style={styles.variantsContainer}>
          <Text style={styles.sectionTitle}>Available Variants</Text>
          {variants.map((variant, index) => (
            <TouchableOpacity
              key={variant.id}
              style={[styles.variantCard, selectedVariant?.id === variant.id && styles.variantCardSelected]}
              onPress={() => handleVariantSelect(variant)}
              activeOpacity={0.8}
            >
              <View style={styles.variantContent}>
                <View style={styles.variantInfo}>
                  <Text style={styles.variantName}>{variant.name}</Text>
                  <View style={styles.rateContainer}>
                    <Ionicons name="trending-up" size={16} color="#E3D095" />
                    <Text style={styles.rateText}>₦{variant.sell_rate} per $1</Text>
                  </View>
                </View>
                <View style={styles.variantAction}>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </View>
              </View>

              {/* Example calculation */}
              <View style={styles.exampleContainer}>
                <Text style={styles.exampleText}>
                  Example: $100 card = ₦{(100 * variant.sell_rate).toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {variants.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyStateText}>No variants available</Text>
            <Text style={styles.emptyStateSubtext}>This brand doesn't have any variants configured yet</Text>
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
    gap: 16,
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
    marginBottom: 12,
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
  },
  rateText: {
    color: "#E3D095",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  variantAction: {
    padding: 8,
  },
  exampleContainer: {
    backgroundColor: "rgba(0, 184, 148, 0.1)",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 184, 148, 0.3)",
  },
  exampleText: {
    color: "#00b894",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
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
