// import { useEffect, useState } from "react"
// import {
//   View,
//   Text,
//   StyleSheet,
//   TextInput,
//   FlatList,
//   TouchableOpacity,
//   Image,
//   ActivityIndicator,
//   ScrollView,
//   StatusBar,
//   Dimensions,
// } from "react-native"
// import { supabase } from "./supabaseClient"
// import { Ionicons, MaterialIcons } from "@expo/vector-icons"
// import { useNavigation } from "@react-navigation/native"
// import { LinearGradient } from "expo-linear-gradient"

// const { width } = Dimensions.get("window")

// export default function SellGiftcard() {
//   const [brands, setBrands] = useState([])
//   const [categories, setCategories] = useState([])
//   const [selectedCategory, setSelectedCategory] = useState("all")
//   const [search, setSearch] = useState("")
//   const [loading, setLoading] = useState(true)
//   const navigation = useNavigation()

//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true)

//       // Fetch categories
//       const { data: catData } = await supabase.from("giftcard_categories").select("*").order("name")
//       setCategories(catData || [])

//       // Fetch brands from giftcards_sell with their variants
//       const { data: brandData } = await supabase
//         .from("giftcards_sell")
//         .select(`
//           *,
//           giftcards_sell_variants(
//             id,
//             name,
//             sell_rate
//           )
//         `)
//         .order("name")

//       setBrands(brandData || [])
//       setLoading(false)
//     }
//     fetchData()
//   }, [])

//   const filteredBrands = brands.filter((b) => {
//     const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase())
//     const matchesCategory = selectedCategory === "all" || b.category_id === selectedCategory
//     const hasVariants = b.giftcards_sell_variants && b.giftcards_sell_variants.length > 0
//     return matchesSearch && matchesCategory && hasVariants
//   })

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <StatusBar barStyle="light-content" backgroundColor="#0E2148" />
//         <ActivityIndicator size="large" color="#E3D095" />
//         <Text style={styles.loadingText}>Loading gift cards...</Text>
//       </View>
//     )
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#0E2148" />

//       {/* Header */}
//       <LinearGradient colors={["#0E2148", "#483AA0"]} style={styles.headerGradient}>
//         <View style={styles.header}>
//           <Text style={styles.headerTitle}>Sell Gift Card</Text>
//           <Text style={styles.headerSubtitle}>Turn your gift cards into cash</Text>
//         </View>
//       </LinearGradient>

//       {/* Search Bar */}
//       <View style={styles.searchContainer}>
//         <View style={styles.searchBar}>
//           <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" />
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search for gift card brand"
//             placeholderTextColor="rgba(255,255,255,0.6)"
//             value={search}
//             onChangeText={setSearch}
//           />
//           {search.length > 0 && (
//             <TouchableOpacity onPress={() => setSearch("")}>
//               <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.6)" />
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>

//       {/* Categories */}
//       {categories.length > 0 && (
//         <View style={styles.categoriesContainer}>
//           <ScrollView
//             horizontal
//             showsHorizontalScrollIndicator={false}
//             contentContainerStyle={styles.categoriesScrollContent}
//           >
//             <TouchableOpacity
//               style={[styles.categoryChip, selectedCategory === "all" && styles.categoryChipActive]}
//               onPress={() => setSelectedCategory("all")}
//             >
//               <Text style={[styles.categoryText, selectedCategory === "all" && styles.categoryTextActive]}>All</Text>
//             </TouchableOpacity>
//             {categories.map((cat) => (
//               <TouchableOpacity
//                 key={cat.id}
//                 style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
//                 onPress={() => setSelectedCategory(cat.id)}
//               >
//                 <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>
//                   {cat.name}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </ScrollView>
//         </View>
//       )}

//       {/* Gift Cards Grid */}
//       <FlatList
//         data={filteredBrands}
//         keyExtractor={(item) => item.id}
//         numColumns={2}
//         columnWrapperStyle={styles.brandRow}
//         contentContainerStyle={styles.brandsContainer}
//         renderItem={({ item }) => (
//           <TouchableOpacity
//             style={styles.brandCard}
//             onPress={() => navigation.navigate("SellGiftcardVariants", { brand: item })}
//             activeOpacity={0.8}
//           >
//             <View style={styles.brandImageContainer}>
//               {item.image_url ? (
//                 <Image source={{ uri: item.image_url }} style={styles.brandImage} resizeMode="contain" />
//               ) : (
//                 <View style={styles.brandImagePlaceholder}>
//                   <Text style={styles.brandImagePlaceholderText}>{item.name[0]}</Text>
//                 </View>
//               )}
//             </View>
//             <Text style={styles.brandName} numberOfLines={2}>
//               {item.name}
//             </Text>
//             <View style={styles.variantInfo}>
//               <Text style={styles.variantCount}>{item.giftcards_sell_variants?.length || 0} variants</Text>
//               {item.giftcards_sell_variants && item.giftcards_sell_variants.length > 0 && (
//                 <Text style={styles.rateRange}>
//                   ₦{Math.min(...item.giftcards_sell_variants.map((v) => v.sell_rate))} - ₦
//                   {Math.max(...item.giftcards_sell_variants.map((v) => v.sell_rate))}
//                 </Text>
//               )}
//             </View>
//           </TouchableOpacity>
//         )}
//         ListEmptyComponent={
//           <View style={styles.emptyState}>
//             <MaterialIcons name="search-off" size={48} color="rgba(255,255,255,0.3)" />
//             <Text style={styles.emptyStateText}>No gift cards found</Text>
//             <Text style={styles.emptyStateSubtext}>
//               {search ? "Try adjusting your search terms" : "No brands available in this category"}
//             </Text>
//           </View>
//         }
//         showsVerticalScrollIndicator={false}
//       />
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
//     paddingBottom: 20,
//   },
//   header: {
//     alignItems: "center",
//     paddingHorizontal: 20,
//     paddingTop: 50,
//     paddingBottom: 16,
//   },
//   headerTitle: {
//     color: "#fff",
//     fontSize: 28,
//     fontWeight: "bold",
//     marginBottom: 4,
//   },
//   headerSubtitle: {
//     color: "rgba(255,255,255,0.8)",
//     fontSize: 16,
//   },
//   searchContainer: {
//     paddingHorizontal: 20,
//     marginBottom: 20,
//   },
//   searchBar: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderRadius: 25,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.2)",
//   },
//   searchInput: {
//     flex: 1,
//     color: "#fff",
//     fontSize: 16,
//     marginLeft: 12,
//   },
//   categoriesContainer: {
//     marginBottom: 20,
//   },
//   categoriesScrollContent: {
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
//     width: (width - 52) / 2,
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
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
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
//     fontSize: 14,
//     fontWeight: "600",
//     textAlign: "center",
//     lineHeight: 18,
//     marginBottom: 8,
//   },
//   variantInfo: {
//     alignItems: "center",
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

import { useEffect, useState, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  Dimensions,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from "react-native"
import { supabase } from "./supabaseClient"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"
import { useTheme } from "./ThemeContext"

const { width } = Dimensions.get("window")
const FIXED_TOP_SECTION_HEIGHT = Platform.OS === "android" ? 170 : 180 // Adjusted height for header + search bar

export default function SellGiftcard() {
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const navigation = useNavigation()
  const { theme } = useTheme()

  const fetchData = useCallback(async () => {
    setLoading(true)
    // Fetch categories
    const { data: catData } = await supabase.from("giftcard_categories").select("*").order("name")
    setCategories(catData || [])

    // Fetch brands from giftcards_sell with their variants
    const { data: brandData } = await supabase
      .from("giftcards_sell")
      .select(
        `
          *,
          giftcards_sell_variants(
            id,
            name,
            sell_rate
          )
        `,
      )
      .order("name")
    setBrands(brandData || [])
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchData()
  }, [fetchData])

  const filteredBrands = brands.filter((b) => {
    const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === "all" || b.category_id === selectedCategory
    const hasVariants = b.giftcards_sell_variants && b.giftcards_sell_variants.length > 0
    return matchesSearch && matchesCategory && hasVariants
  })

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: theme.background,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      color: theme.text,
      fontSize: 16,
      marginTop: 16,
    },
    fixedTopSection: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: FIXED_TOP_SECTION_HEIGHT,
      zIndex: 10,
      overflow: "hidden", // Ensures content doesn't spill out
    },
    headerGradient: {
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      flex: 1, // Take up available space in fixedTopSection
    },
    headerContent: {
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 50,
      paddingBottom: 16,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    backButton: {
      padding: 8,
      position: "absolute",
      left: 10,
      top: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 50,
      zIndex: 1,
    },
    headerTitleContainer: {
      flex: 1,
      alignItems: "center",
      marginRight: 40, // Offset for back button
    },
    headerTitle: {
      color: theme.textContrast,
      fontSize: 28,
      fontWeight: "bold",
      marginBottom: 4,
    },
    headerSubtitle: {
      color: theme.textSecondary,
      fontSize: 16,
    },
    searchContainer: {
      paddingHorizontal: 20,
      marginTop: -20, // Pull search bar up into the header gradient
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderRadius: 25,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    searchInput: {
      flex: 1,
      color: theme.text,
      fontSize: 16,
      marginLeft: 12,
    },
    categoriesContainer: {
      marginBottom: 20,
    },
    categoriesScrollContent: {
      paddingHorizontal: 20,
    },
    categoryChip: {
      backgroundColor: theme.card,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginRight: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    categoryChipActive: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
    },
    categoryText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontWeight: "500",
    },
    categoryTextActive: {
      color: theme.textContrast,
      fontWeight: "600",
    },
    brandsContainer: {
      paddingHorizontal: 20,
      paddingBottom: 32,
      paddingTop: FIXED_TOP_SECTION_HEIGHT + 20, // Offset for fixed top section + extra spacing
    },
    brandRow: {
      justifyContent: "space-between",
    },
    brandCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      width: (width - 52) / 2,
      marginBottom: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    brandImageContainer: {
      width: 80,
      height: 60,
      borderRadius: 12,
      backgroundColor: theme.background,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    brandImage: {
      width: 60,
      height: 45,
    },
    brandImagePlaceholder: {
      width: 60,
      height: 45,
      borderRadius: 8,
      backgroundColor: theme.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    brandImagePlaceholderText: {
      color: theme.textContrast,
      fontSize: 18,
      fontWeight: "bold",
    },
    brandName: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
      lineHeight: 18,
      marginBottom: 8,
    },
    variantInfo: {
      alignItems: "center",
    },
    variantCount: {
      color: theme.warning,
      fontSize: 12,
      fontWeight: "600",
      marginBottom: 2,
    },
    rateRange: {
      color: theme.success,
      fontSize: 11,
      fontWeight: "500",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 60,
      paddingHorizontal: 24,
    },
    emptyStateText: {
      color: theme.textSecondary,
      fontSize: 18,
      fontWeight: "600",
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateSubtext: {
      color: theme.textMuted,
      fontSize: 14,
      textAlign: "center",
    },
  })

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle={theme.statusBar} backgroundColor={theme.primary} />
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={styles.loadingText}>Loading gift cards...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.primary} />
      {/* Fixed Top Section (Header + Search Bar) */}
      <View style={styles.fixedTopSection}>
        <LinearGradient colors={[theme.primary, theme.secondary]} style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.textContrast} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Sell Gift Card</Text>
              <Text style={styles.headerSubtitle}>Turn your gift cards into cash</Text>
            </View>
          </View>
        </LinearGradient>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={theme.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for gift card brand"
              placeholderTextColor={theme.textSecondary}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Categories and Gift Cards Grid */}
      <FlatList
        data={filteredBrands}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.brandRow}
        contentContainerStyle={styles.brandsContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.brandCard}
            onPress={() => navigation.navigate("SellGiftcardVariants", { brand: item })}
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
            <View style={styles.variantInfo}>
              <Text style={styles.variantCount}>{item.giftcards_sell_variants?.length || 0} variants</Text>
              {item.giftcards_sell_variants && item.giftcards_sell_variants.length > 0 && (
                <Text style={styles.rateRange}>
                  ₦{Math.min(...item.giftcards_sell_variants.map((v) => v.sell_rate))} - ₦
                  {Math.max(...item.giftcards_sell_variants.map((v) => v.sell_rate))}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          categories.length > 0 ? (
            <View style={styles.categoriesContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesScrollContent}
              >
                <TouchableOpacity
                  style={[styles.categoryChip, selectedCategory === "all" && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory("all")}
                >
                  <Text style={[styles.categoryText, selectedCategory === "all" && styles.categoryTextActive]}>
                    All
                  </Text>
                </TouchableOpacity>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={48} color={theme.textMuted} />
            <Text style={styles.emptyStateText}>No gift cards found</Text>
            <Text style={styles.emptyStateSubtext}>
              {search ? "Try adjusting your search terms" : "No brands available in this category"}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
            progressBackgroundColor={theme.card}
          />
        }
      />
    </View>
  )
}
