// import { useEffect, useState } from "react"
// import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Image } from "react-native"
// import { supabase } from "./supabaseClient"
// import { useNavigation } from "@react-navigation/native"
// import { Ionicons } from "@expo/vector-icons"
// import { LinearGradient } from "expo-linear-gradient"

// export default function BuyGiftcard() {
//   const [brands, setBrands] = useState([])
//   const [categories, setCategories] = useState([])
//   const [selectedCategory, setSelectedCategory] = useState("all")
//   const [loading, setLoading] = useState(true)
//   const navigation = useNavigation()

//   useEffect(() => {
//     fetchBrandsAndCategories()
//   }, [selectedCategory])

//   const fetchBrandsAndCategories = async () => {
//     setLoading(true)
//     try {
//       // Fetch categories
//       const { data: catData } = await supabase.from("giftcard_categories").select("*").order("name")
//       setCategories(catData || [])

//       // Fetch brands with available inventory count
//       let query = supabase
//         .from("giftcards_buy")
//         .select("brand_name, image_url, category_id")
//         .eq("sold", false)
//         .is("assigned_to", null) // Only cards not assigned to anyone

//       if (selectedCategory !== "all") {
//         query = query.eq("category_id", selectedCategory)
//       }

//       const { data: inventoryData, error } = await query

//       if (error) throw error

//       // Group by brand and count available items
//       const brandMap = {}
//       ;(inventoryData || []).forEach((item) => {
//         if (!brandMap[item.brand_name]) {
//           brandMap[item.brand_name] = {
//             brand_name: item.brand_name,
//             image_url: item.image_url,
//             category_id: item.category_id,
//             available_count: 0,
//             variants: new Set(),
//           // }
//         }
//         brandMap[item.brand_name].available_count++
//       })

//       // Get variant information for each brand
//       for (const brandName of Object.keys(brandMap)) {
//         const { data: variantData } = await supabase
//           .from("giftcards_buy")
//           .select("variant_name, rate")
//           .eq("brand_name", brandName)
//           .eq("sold", false)
//           .is("assigned_to", null)

//         const variants = {}
//         ;(variantData || []).forEach((v) => {
//           if (!variants[v.variant_name]) {
//             variants[v.variant_name] = {
//               name: v.variant_name,
//               rate: v.rate,
//               count: 0,
//             }
//           }
//           variants[v.variant_name].count++
//         })

//         brandMap[brandName].variants = Object.values(variants)
//       }

//       setBrands(Object.values(brandMap).filter((brand) => brand.available_count > 0))
//     } catch (error) {
//       console.error("Error fetching brands:", error)
//       setBrands([])
//     }
//     setLoading(false)
//   }

//   if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />

//   return (
//     <View style={styles.container}>
//       <LinearGradient colors={["#0E2148", "#483AA0"]} style={styles.headerGradient}>
//         <View style={styles.header}>
//           <Text style={styles.headerTitle}>Buy Gift Cards</Text>
//           <Text style={styles.headerSubtitle}>Choose a brand to get started</Text>
//         </View>
//       </LinearGradient>

//       {/* Categories Filter */}
//       {categories.length > 0 && (
//         <View style={styles.categoriesContainer}>
//           <FlatList
//             horizontal
//             showsHorizontalScrollIndicator={false}
//             data={[{ id: "all", name: "All" }, ...categories]}
//             keyExtractor={(item) => item.id}
//             renderItem={({ item }) => (
//               <TouchableOpacity
//                 style={[styles.categoryChip, selectedCategory === item.id && styles.categoryChipActive]}
//                 onPress={() => setSelectedCategory(item.id)}
//               >
//                 <Text style={[styles.categoryText, selectedCategory === item.id && styles.categoryTextActive]}>
//                   {item.name}
//                 </Text>
//               </TouchableOpacity>
//             )}
//             contentContainerStyle={styles.categoriesContent}
//           />
//         </View>
//       )}

//       <FlatList
//         data={brands}
//         keyExtractor={(item) => item.brand_name}
//         numColumns={2}
//         columnWrapperStyle={styles.brandRow}
//         contentContainerStyle={styles.brandsContainer}
//         renderItem={({ item }) => (
//           <TouchableOpacity
//             style={styles.brandCard}
//             onPress={() => navigation.navigate("BuyGiftcardVariants", { brand: item })}
//             activeOpacity={0.8}
//           >
//             <View style={styles.brandImageContainer}>
//               {item.image_url ? (
//                 <Image source={{ uri: item.image_url }} style={styles.brandImage} resizeMode="contain" />
//               ) : (
//                 <View style={styles.brandImagePlaceholder}>
//                   <Text style={styles.brandImagePlaceholderText}>{item.brand_name[0]}</Text>
//                 </View>
//               )}
//             </View>
//             <Text style={styles.brandName} numberOfLines={2}>
//               {item.brand_name}
//             </Text>
//             <View style={styles.brandInfo}>
//               <Text style={styles.availableCount}>{item.available_count} available</Text>
//               <Text style={styles.variantCount}>{item.variants.length} variants</Text>
//               {item.variants.length > 0 && (
//                 <Text style={styles.rateRange}>
//                   ₦{Math.min(...item.variants.map((v) => v.rate))} - ₦{Math.max(...item.variants.map((v) => v.rate))}
//                 </Text>
//               )}
//             </View>
//           </TouchableOpacity>
//         )}
//         ListEmptyComponent={
//           <View style={styles.emptyState}>
//             <Ionicons name="storefront-outline" size={48} color="rgba(255,255,255,0.3)" />
//             <Text style={styles.emptyStateText}>No gift cards available</Text>
//             <Text style={styles.emptyStateSubtext}>Check back later for new inventory</Text>
//           </View>
//         }
//         showsVerticalScrollIndicator={false}
//       />
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#0E2148" },
//   headerGradient: {
//     paddingBottom: 20,
//   },
//   header: {
//     paddingHorizontal: 20,
//     paddingTop: 50,
//     paddingBottom: 16,
//     alignItems: "center",
//   },
//   headerTitle: {
//     fontSize: 28,
//     fontWeight: "bold",
//     color: "#fff",
//     textAlign: "center",
//     marginBottom: 4,
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     color: "rgba(255,255,255,0.8)",
//     textAlign: "center",
//   },
//   categoriesContainer: {
//     marginBottom: 20,
//   },
//   categoriesContent: {
//     paddingHorizontal: 20,
//   },
//   categoryChip: {
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 20,
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     marginRight: 12,
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.2)",
//   },
//   categoryChipActive: {
//     backgroundColor: "#7965C1",
//     borderColor: "#7965C1",
//   },
//   categoryText: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 14,
//     fontWeight: "500",
//   },
//   categoryTextActive: {
//     color: "#fff",
//     fontWeight: "600",
//   },
//   brandsContainer: {
//     paddingHorizontal: 20,
//     paddingBottom: 32,
//   },
//   brandRow: {
//     justifyContent: "space-between",
//   },
//   brandCard: {
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 16,
//     padding: 20,
//     width: "48%",
//     marginBottom: 16,
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.15)",
//   },
//   brandImageContainer: {
//     width: 80,
//     height: 60,
//     borderRadius: 12,
//     backgroundColor: "#fff",
//     justifyContent: "center",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   brandImage: {
//     width: 60,
//     height: 45,
//   },
//   brandImagePlaceholder: {
//     width: 60,
//     height: 45,
//     borderRadius: 8,
//     backgroundColor: "#7965C1",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   brandImagePlaceholderText: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//   },
//   brandName: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//     textAlign: "center",
//     marginBottom: 8,
//   },
//   brandInfo: {
//     alignItems: "center",
//   },
//   availableCount: {
//     color: "#00b894",
//     fontSize: 14,
//     fontWeight: "bold",
//     marginBottom: 2,
//   },
//   variantCount: {
//     color: "#E3D095",
//     fontSize: 12,
//     fontWeight: "600",
//     marginBottom: 2,
//   },
//   rateRange: {
//     color: "#00b894",
//     fontSize: 11,
//     fontWeight: "500",
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

import { useEffect, useState } from "react"
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Image } from "react-native"
import { supabase } from "./supabaseClient"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

export default function BuyGiftcard() {
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [loading, setLoading] = useState(true)
  const navigation = useNavigation()

  useEffect(() => {
    fetchBrandsAndCategories()
  }, [selectedCategory])

  const fetchBrandsAndCategories = async () => {
    setLoading(true)
    try {
      // Fetch categories
      const { data: catData } = await supabase.from("giftcard_categories").select("*").order("name")
      setCategories(catData || [])

      // Fetch brands from giftcards_buy_brands
      let query = supabase
        .from("giftcards_buy_brands")
        .select(`
          id,
          name,
          image_url,
          category_id
        `)
        .order("name")

      if (selectedCategory !== "all") {
        query = query.eq("category_id", selectedCategory)
      }

      const { data: brandData, error: brandError } = await query
      if (brandError) throw brandError

      const brandsWithCounts = await Promise.all(
        (brandData || []).map(async (brand) => {
          // Count available items for this brand
          const { count, error: countError } = await supabase
            .from("giftcards_buy")
            .select("id", { count: "exact", head: true })
            .eq("buy_brand_id", brand.id)
            .eq("sold", false)
            .is("assigned_to", null)

          if (countError) console.error("Error counting items for brand:", brand.name, countError)

          // Get distinct variants and their rates/values for display
          const { data: variantData, error: variantError } = await supabase
            .from("giftcards_buy")
            .select("variant_name, rate, value")
            .eq("buy_brand_id", brand.id)
            .eq("sold", false)
            .is("assigned_to", null)
            .limit(100) // Limit to avoid fetching too much data for display

          if (variantError) console.error("Error fetching variants for brand:", brand.name, variantError)

          const uniqueVariants = {}
          ;(variantData || []).forEach((item) => {
            const key = `${item.variant_name}_${item.value}`
            if (!uniqueVariants[key]) {
              uniqueVariants[key] = { name: item.variant_name, rate: item.rate, value: item.value }
            }
          })

          return {
            ...brand,
            available_count: count || 0,
            variants: Object.values(uniqueVariants),
          }
        }),
      )

      setBrands(brandsWithCounts.filter((brand) => brand.available_count > 0)) // Only show brands with available inventory
    } catch (error) {
      console.error("Error fetching brands:", error)
      setBrands([])
    }
    setLoading(false)
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0E2148", "#483AA0"]} style={styles.headerGradient}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Buy Gift Cards</Text>
          <Text style={styles.headerSubtitle}>Choose a brand to get started</Text>
        </View>
      </LinearGradient>

      {/* Categories Filter */}
      {categories.length > 0 && (
        <View style={styles.categoriesContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[{ id: "all", name: "All" }, ...categories]}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.categoryChip, selectedCategory === item.id && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(item.id)}
              >
                <Text style={[styles.categoryText, selectedCategory === item.id && styles.categoryTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.categoriesContent}
          />
        </View>
      )}

      <FlatList
        data={brands}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.brandRow}
        contentContainerStyle={styles.brandsContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.brandCard}
            onPress={() => navigation.navigate("BuyGiftcardVariants", { brand: item })}
            activeOpacity={0.8}
          >
            <View style={styles.brandImageContainer}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.brandImage} resizeMode="contain" />
              ) : (
                <View style={styles.brandImagePlaceholder}>
                  <Text style={styles.brandImagePlaceholderText}>{item.name[0]}</Text>
                </View>
              )}
            </View>
            <Text style={styles.brandName} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={styles.brandInfo}>
              <Text style={styles.availableCount}>{item.available_count} available</Text>
              <Text style={styles.variantCount}>{item.variants.length} variants</Text>
              {item.variants.length > 0 && (
                <Text style={styles.rateRange}>
                  ₦{Math.min(...item.variants.map((v) => v.rate))} - ₦{Math.max(...item.variants.map((v) => v.rate))}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyStateText}>No gift cards available</Text>
            <Text style={styles.emptyStateSubtext}>Check back later for new inventory</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0E2148" },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  categoryChipActive: {
    backgroundColor: "#7965C1",
    borderColor: "#7965C1",
  },
  categoryText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  brandsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  brandRow: {
    justifyContent: "space-between",
  },
  brandCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 20,
    width: "48%",
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  brandImageContainer: {
    width: 80,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  brandImage: {
    width: 60,
    height: 45,
  },
  brandImagePlaceholder: {
    width: 60,
    height: 45,
    borderRadius: 8,
    backgroundColor: "#7965C1",
    justifyContent: "center",
    alignItems: "center",
  },
  brandImagePlaceholderText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  brandName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  brandInfo: {
    alignItems: "center",
  },
  availableCount: {
    color: "#00b894",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  variantCount: {
    color: "#E3D095",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  rateRange: {
    color: "#00b894",
    fontSize: 11,
    fontWeight: "500",
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
