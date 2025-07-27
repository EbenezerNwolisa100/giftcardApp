import { useEffect, useState, useCallback } from "react"
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  StatusBar,
  Platform,
  RefreshControl,
  Dimensions,
  TextInput
} from "react-native"
import { supabase } from "./supabaseClient"
import { useNavigation, useFocusEffect } from "@react-navigation/native" // Import useFocusEffect
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "./ThemeContext"

const { width } = Dimensions.get("window")
const HEADER_HEIGHT_BUY_LIST = Platform.OS === 'android' ? StatusBar.currentHeight + 80 : 100; // Approximate height for fixed header

export default function BuyGiftcard() {
  const { theme, isDarkTheme } = useTheme()
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0) // State for unread notifications
  const navigation = useNavigation()

  const fetchBrandsAndCategories = useCallback(async () => {
    setLoading(true)
    setRefreshing(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch categories
      // Fetch categories
const { data: catData, error: catError } = await supabase.from("giftcard_categories").select("*").order("name")
console.log("Categories from Supabase:", catData, "Error:", catError)
console.log("Categories length:", catData?.length || 0)
setCategories((catData || []).map(cat => ({ ...cat, id: String(cat.id) })))
console.log("Processed categories:", (catData || []).map(cat => ({ ...cat, id: String(cat.id) })))
      let query = supabase
        .from("giftcards_buy_brands")
        .select(
          `
          id,
          name,
          image_url,
          category_id
        `,
        )
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
            ; (variantData || []).forEach((item) => {
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

      // Fetch unread notifications count
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false)
      setUnreadCount(count || 0)

    } catch (error) {
      console.error("Error fetching brands:", error)
      Alert.alert("Error", error.message || "Failed to load gift cards.")
      setBrands([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedCategory])


  useFocusEffect(
    useCallback(() => {
      fetchBrandsAndCategories();
    }, [fetchBrandsAndCategories])
  );

  // Filter brands based on search and category
  const filteredBrands = brands.filter((brand) => {
    const matchesSearch = brand.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "all" || brand.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.background,
    },
    loadingText: {
      color: theme.text,
      marginTop: 16,
      fontSize: 16,
      fontWeight: '500',
    },
    // Fixed Header Styles
    fixedHeader: {
      backgroundColor: theme.primary,
      paddingHorizontal: 24,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
      paddingBottom: 20,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      color: theme.text,
      fontSize: 24,
      fontWeight: "bold",
      flex: 1,
      textAlign: "center",
      marginLeft: -40, // Counteract back button width to center title
    },
    notificationButton: {
      position: "relative",
      padding: 8,
    },
    notificationBadge: {
      position: "absolute",
      top: 0,
      right: 0,
      backgroundColor: theme.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: theme.primary,
    },
    notificationBadgeText: {
      color: theme.primary,
      fontSize: 10,
      fontWeight: "bold",
    },
    searchContainer: {
      paddingHorizontal: 20,
      marginBottom: 16,
      marginTop: 0,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.surface,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    searchInput: {
      flex: 1,
      color: theme.text,
      fontSize: 16,
      marginLeft: 12,
    },
    categoriesContainer: {
      marginBottom: 20,
      marginTop: 0, // Space after fixed header
    },
    categoriesContent: {
      paddingHorizontal: 20,
    },
    categoryChip: {
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginRight: 12,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
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
      color: theme.primary,
      fontWeight: "600",
    },
    brandsContainer: {
      paddingHorizontal: 20,
      paddingBottom: Platform.OS === "ios" ? 85 + 20 : 70 + 20, // Account for tab bar height
    },
    brandRow: {
      justifyContent: "space-between",
    },
    brandCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      width: "48%",
      marginBottom: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    brandImageContainer: {
      width: 130,
      height: 100,
      borderRadius: 12,
      backgroundColor: theme.background,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    brandImage: {
      width: 100,
      height: 70,
      // borderRadius: 12,
    },
    brandImagePlaceholder: {
      width: 60,
      height: 45,
      borderRadius: 8,
      backgroundColor: theme.accent,
      justifyContent: "center",
      alignItems: "center",
    },
    brandImagePlaceholderText: {
      color: theme.primary,
      fontSize: 18,
      fontWeight: "bold",
    },
    brandName: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
      textAlign: "center",
      marginBottom: 8,
    },
    brandInfo: {
      alignItems: "center",
    },
    availableCount: {
      color: theme.success,
      fontSize: 14,
      fontWeight: "bold",
      marginBottom: 2,
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
      color: theme.text,
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
    // Skeleton Styles
    skeletonContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    skeletonFixedHeader: {
      height: HEADER_HEIGHT_BUY_LIST,
      backgroundColor: theme.primary,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 10,
    },
    skeletonCategoryChip: {
      height: 36,
      width: 100, // Approximate width
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 20,
      marginRight: 12,
    },
    skeletonBrandCard: {
      height: 200, // Approximate height of brand card
      width: "48%",
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginBottom: 16,
    },
  })

  // BuyGiftcard Skeleton Component
  const BuyGiftcardSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />
      {/* Fixed Header Skeleton */}
      <View style={styles.skeletonFixedHeader}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60, paddingBottom: 20, width: '100%' }}>
          <View style={{ width: 24, height: 24, backgroundColor: theme.surfaceSecondary, borderRadius: 12 }} /> {/* Back button placeholder */}
          <View style={[styles.headerTitle, { backgroundColor: theme.surfaceSecondary, width: 180, height: 24 }]} /> {/* Title placeholder */}
          <View style={[styles.notificationButton, { backgroundColor: theme.surfaceSecondary, borderRadius: 20, width: 40, height: 40 }]} />
        </View>
      </View>

      {/* Categories Filter Skeleton */}
      <View style={[styles.categoriesContainer, { flexDirection: 'row', paddingHorizontal: 20 }]}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.skeletonCategoryChip} />
        ))}
      </View>

      {/* Brand List Skeleton */}
      <FlatList
        data={[1, 2, 3, 4, 5, 6]} // Dummy data for skeleton items
        keyExtractor={(item) => item.toString()}
        numColumns={2}
        columnWrapperStyle={styles.brandRow}
        contentContainerStyle={styles.brandsContainer}
        renderItem={() => (
          <View style={styles.skeletonBrandCard} />
        )}
      />
    </View>
  );

  if (loading) {
    return <BuyGiftcardSkeleton />;
  }

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
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold' }}>Brands</Text>
        <View style={{ width: 32, height: 32 }} />
      </View>

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
              activeOpacity={0.7}
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
        data={filteredBrands}
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
            {/* <View style={styles.brandInfo}>
              <Text style={styles.availableCount}>{item.available_count} available</Text>
              <Text style={styles.variantCount}>{item.variants.length} variants</Text>
              {item.variants.length > 0 && (
                <Text style={styles.rateRange}>
                  ₦{Math.min(...item.variants.map((v) => v.rate))} - ₦{Math.max(...item.variants.map((v) => v.rate))}
                </Text>
              )}
            </View> */}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={48} color={theme.textMuted} />
            <Text style={styles.emptyStateText}>
              {search ? "No gift cards found" : "No gift cards available"}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {search ? "Try adjusting your search terms" : "Check back later for new inventory"}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchBrandsAndCategories}
            tintColor={theme.accent}
            colors={[theme.accent]}
            progressBackgroundColor={theme.surface}
          />
        }
      />
    </View>
  )
}
