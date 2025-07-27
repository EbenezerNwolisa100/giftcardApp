import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Image,
  RefreshControl,
  Platform,
  TextInput,
  Alert,
} from "react-native"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { supabase } from "./supabaseClient"
import { useTheme } from "./ThemeContext"

const { width, height } = Dimensions.get("window")

export default function HottestRatesScreen({ navigation }) {
  const { theme, isDarkTheme } = useTheme()
  const [rates, setRates] = useState([])
  const [filteredRates, setFilteredRates] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all") // all, buy, sell
  const [sortBy, setSortBy] = useState("rate") // rate, name, popularity
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchRates = useCallback(async () => {
    setLoading(true)
    setRefreshing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        setRefreshing(false)
        return
      }

      // Fetch unread notifications count
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false)
      setUnreadCount(count || 0)

      // Fetch buy rates from giftcards_buy with brand info
      const { data: buyRates, error: buyError } = await supabase
        .from("giftcards_buy")
        .select(`
          id,
          buy_rate,
          rate,
          value,
          variant_name,
          sold,
          assigned_to,
          buy_brand_id,
          buy_brands:buy_brand_id (
            name,
            image_url,
            category_id
          )
        `)
        .eq("sold", false)
        .is("assigned_to", null)

      // Fetch sell rates from giftcards_sell_variants with brand info
      const { data: sellRates, error: sellError } = await supabase
        .from("giftcards_sell_variants")
        .select(`
          id,
          name,
          sell_rate,
          brand_id,
          giftcards_sell:brand_id (
            name,
            image_url,
            category_id
          )
        `)

      if (buyError || sellError) {
        console.error("Error fetching rates:", buyError || sellError)
        Alert.alert("Error", "Failed to load rates")
        return
      }

      // Process buy rates
      const processedBuyRates = (buyRates || []).map(item => ({
        id: `buy-${item.id}`,
        type: "buy",
        brandName: item.buy_brands?.name || "Unknown Brand",
        brandImage: item.buy_brands?.image_url,
        variantName: item.variant_name,
        rate: item.rate || item.buy_rate || 0,
        value: item.value,
        category: "Gift Cards", // Default category for now
        displayRate: `₦${item.rate || item.buy_rate || 0}`,
        displayValue: `$${item.value}`,
        description: `${item.variant_name} - $${item.value}`,
        popularity: Math.floor(Math.random() * 100) + 1, // Mock popularity
        brandId: item.buy_brand_id,
      }))

      // Process sell rates
      const processedSellRates = (sellRates || []).map(item => ({
        id: `sell-${item.id}`,
        type: "sell",
        brandName: item.giftcards_sell?.name || "Unknown Brand",
        brandImage: item.giftcards_sell?.image_url,
        variantName: item.name,
        rate: item.sell_rate,
        value: null, // Sell rates don't have specific values
        category: "Gift Cards", // Default category for now
        displayRate: `₦${item.sell_rate}`,
        displayValue: "Variable",
        description: item.name,
        popularity: Math.floor(Math.random() * 100) + 1, // Mock popularity
        brandId: item.brand_id,
      }))

      const allRates = [...processedBuyRates, ...processedSellRates]
      setRates(allRates)
    } catch (error) {
      console.error("Error fetching rates:", error)
      Alert.alert("Error", "Failed to load rates")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchRates()
    }, [fetchRates])
  )

  useEffect(() => {
    let filtered = [...rates]

    // Apply search filter
    if (search.trim()) {
      filtered = filtered.filter(rate => 
        rate.brandName.toLowerCase().includes(search.toLowerCase()) ||
        rate.variantName.toLowerCase().includes(search.toLowerCase()) ||
        rate.category.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Apply type filter
    if (filter !== "all") {
      filtered = filtered.filter(rate => rate.type === filter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rate":
          return b.rate - a.rate // Highest rates first
        case "name":
          return a.brandName.localeCompare(b.brandName)
        case "popularity":
          return b.popularity - a.popularity
        default:
          return 0
      }
    })

    setFilteredRates(filtered)
  }, [rates, search, filter, sortBy])

  const getRateColor = (rate, type) => {
    if (type === "buy") {
      return rate > 1000 ? theme.success : rate > 800 ? theme.warning : theme.error
    } else {
      return rate > 900 ? theme.success : rate > 700 ? theme.warning : theme.error
    }
  }

  const getRateStatus = (rate, type) => {
    if (type === "buy") {
      if (rate > 1000) return "Excellent"
      if (rate > 800) return "Good"
      return "Fair"
    } else {
      if (rate > 900) return "Excellent"
      if (rate > 700) return "Good"
      return "Fair"
    }
  }

  const getRateIcon = (type) => {
    return type === "buy" ? "trending-up" : "trending-down"
  }

  const getRateLabel = (type) => {
    return type === "buy" ? "Buy Rate" : "Sell Rate"
  }

  const handleRatePress = (rate) => {
    if (rate.type === "buy") {
      // For buy rates, we need to navigate to BuyGiftcardVariants
      // We'll need to fetch the brand info first
      navigation.navigate("BuyGiftcardVariants", { 
        brand: { 
          id: rate.brandId, 
          name: rate.brandName, 
          image_url: rate.brandImage 
        } 
      })
    } else {
      // For sell rates, navigate to SellGiftcardVariants
      navigation.navigate("SellGiftcardVariants", { 
        brand: { 
          id: rate.brandId, 
          name: rate.brandName, 
          image_url: rate.brandImage 
        } 
      })
    }
  }

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
      fontWeight: '500',
    },
    fixedHeader: {
      // backgroundColor: theme.primary, // Solid primary color for header
      paddingHorizontal: 18, // Consistent padding
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 5 : 45, // Adjust for iOS/Android status bar
      paddingBottom: 16,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 5 }, // More pronounced shadow
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8, // Android shadow
      zIndex: 10, // Ensure header is above scrollable content
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between", // Space out title and notification
    },
    headerTitle: {
      color: theme.text,
      fontSize: 22,
      fontWeight: "bold",
      flex: 1,
      textAlign: "center",
      marginLeft: -170,
    },
    notificationButton: {
      position: "relative",
      padding: 4,
    },
    notificationBadge: {
      position: "absolute",
      top: -2,
      right: -2,
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
      color: theme.text,
      fontSize: 10,
      fontWeight: "bold",
    },
    searchContainer: {
      paddingHorizontal: 18,
      marginBottom: 16,
      marginTop: 0,
      backgroundColor: theme.background,
      zIndex: 5,
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
    },
    searchInput: {
      flex: 1,
      color: theme.text,
      fontSize: 16,
      paddingVertical: 12,
      marginLeft: 8,
    },
    filtersContainer: {
      flexDirection: "row",
      paddingHorizontal: 18,
      marginBottom: 16,
      gap: 8,
      backgroundColor: theme.background,
      zIndex: 5,
    },
    filterChip: {
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    filterChipActive: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
    },
    filterChipText: {
      color: theme.textSecondary,
      fontSize: 14,
      fontWeight: "500",
    },
    filterChipTextActive: {
      color: theme.primary,
      fontWeight: "600",
    },
    sortContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 0,
      marginBottom: 16,
    },
    sortLabel: {
      color: theme.textSecondary,
      fontSize: 14,
      marginRight: 8,
    },
    sortButton: {
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    sortButtonActive: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
    },
    sortButtonText: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "500",
    },
    sortButtonTextActive: {
      color: theme.primary,
      fontWeight: "600",
    },
    listContainer: {
      paddingHorizontal: 18,
      paddingBottom: 32,
      paddingTop: 0,
    },
    rateCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      flexDirection: "row",
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
      width: 60,
      height: 60,
      borderRadius: 12,
      backgroundColor: theme.surfaceSecondary,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
      overflow: "hidden",
    },
    brandImage: {
      width: 40,
      height: 40,
    },
    brandImagePlaceholder: {
      width: 40,
      height: 40,
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
    rateInfo: {
      flex: 1,
    },
    brandName: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
    },
    variantName: {
      color: theme.textSecondary,
      fontSize: 14,
      marginBottom: 4,
    },
    categoryText: {
      color: theme.textMuted,
      fontSize: 12,
      marginBottom: 4,
    },
    rateContainer: {
      alignItems: "flex-end",
    },
    rateValue: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 4,
    },
    rateLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 2,
    },
    rateStatus: {
      fontSize: 10,
      fontWeight: "600",
      marginTop: 2,
    },
    typeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginBottom: 4,
    },
    typeBadgeBuy: {
      backgroundColor: theme.success + "20",
    },
    typeBadgeSell: {
      backgroundColor: theme.warning + "20",
    },
    typeBadgeText: {
      fontSize: 10,
      fontWeight: "600",
    },
    typeBadgeTextBuy: {
      color: theme.success,
    },
    typeBadgeTextSell: {
      color: theme.warning,
    },
    popularityContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
    },
    popularityText: {
      fontSize: 12,
      color: theme.textMuted,
      marginLeft: 4,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 60,
      paddingHorizontal: 24,
    },
    emptyStateTitle: {
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
      paddingHorizontal: 24,
      marginTop: 20,
    },
    skeletonHeader: {
      height: 24,
      width: '60%',
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 4,
      marginBottom: 16,
    },
    skeletonSearchBar: {
      height: 50,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 20,
      marginBottom: 16,
    },
    skeletonFilterChip: {
      height: 36,
      width: 80,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 20,
      marginRight: 8,
    },
    skeletonRateCard: {
      height: 100,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginBottom: 12,
    },
    summaryContainer: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 0,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    summaryTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 12,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    summaryLabel: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    summaryValue: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "600",
    },
  })

  // HottestRatesScreen Skeleton Component
  const HottestRatesScreenSkeleton = () => (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />
      {/* Fixed Header Skeleton */}
      <View style={styles.fixedHeader}>
        <View style={[styles.skeletonHeader, { width: 150, height: 24 }]} />
        <View style={[styles.notificationButton, { backgroundColor: theme.surfaceSecondary, borderRadius: 20, width: 40, height: 40 }]} />
      </View>

      {/* Search Bar Skeleton */}
      <View style={styles.searchContainer}>
        <View style={styles.skeletonSearchBar} />
      </View>

      {/* Filter Chips Skeleton */}
      <View style={styles.filtersContainer}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.skeletonFilterChip} />
        ))}
      </View>

      {/* Rate Cards Skeleton */}
      <FlatList
        data={[1, 2, 3, 4, 5, 6, 7]}
        keyExtractor={(item) => item.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        renderItem={() => (
          <View style={styles.skeletonRateCard} />
        )}
      />
    </View>
  )

  if (loading) {
    return <HottestRatesScreenSkeleton />
  }

  // Calculate summary statistics
  const getSummaryStats = () => {
    const buyRates = rates.filter(rate => rate.type === "buy")
    const sellRates = rates.filter(rate => rate.type === "sell")
    
    const bestBuyRate = buyRates.length > 0 ? Math.max(...buyRates.map(r => r.rate)) : 0
    const bestSellRate = sellRates.length > 0 ? Math.max(...sellRates.map(r => r.rate)) : 0
    const totalBrands = new Set(rates.map(r => r.brandName)).size
    
    return {
      bestBuyRate,
      bestSellRate,
      totalBrands,
      totalRates: rates.length
    }
  }

  const summaryStats = getSummaryStats()

  const renderRateCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.rateCard} 
      onPress={() => handleRatePress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.brandImageContainer}>
        {item.brandImage ? (
          <Image source={{ uri: item.brandImage }} style={styles.brandImage} resizeMode="contain" />
        ) : (
          <View style={styles.brandImagePlaceholder}>
            <Text style={styles.brandImagePlaceholderText}>{item.brandName[0]}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.rateInfo}>
        <Text style={styles.brandName}>{item.brandName}</Text>
        <Text style={styles.variantName}>{item.description}</Text>
        <Text style={styles.categoryText}>{item.category}</Text>
        
        <View style={[styles.typeBadge, item.type === "buy" ? styles.typeBadgeBuy : styles.typeBadgeSell]}>
          <Text style={[styles.typeBadgeText, item.type === "buy" ? styles.typeBadgeTextBuy : styles.typeBadgeTextSell]}>
            {item.type.toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.popularityContainer}>
          <Ionicons name="flame" size={12} color={theme.warning} />
          <Text style={styles.popularityText}>{item.popularity}% popular</Text>
        </View>
      </View>
      
      <View style={styles.rateContainer}>
        <Text style={[styles.rateValue, { color: getRateColor(item.rate, item.type) }]}>
          {item.displayRate}
        </Text>
        <Text style={styles.rateLabel}>{getRateLabel(item.type)}</Text>
        {item.value && (
          <Text style={styles.rateLabel}>{item.displayValue}</Text>
        )}
        <Text style={[styles.rateStatus, { color: getRateColor(item.rate, item.type) }]}>
          {getRateStatus(item.rate, item.type)}
        </Text>
        <Ionicons 
          name={getRateIcon(item.type)} 
          size={16} 
          color={getRateColor(item.rate, item.type)} 
        />
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />

      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
        <Text style={styles.headerTitle}>Hottest Rates</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("NotificationsScreen")}
          style={styles.notificationButton}
        >
          <Ionicons name="notifications-outline" size={24} color={theme.text} />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Fixed Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search brands, variants, categories..."
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

      {/* Fixed Filter Chips */}
      <View style={styles.filtersContainer}>
        {["all", "buy", "sell"].map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.filterChip, filter === option && styles.filterChipActive]}
            onPress={() => setFilter(option)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, filter === option && styles.filterChipTextActive]}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scrollable Content */}
      <FlatList
        data={filteredRates}
        keyExtractor={(item) => item.id}
        renderItem={renderRateCard}
        ListHeaderComponent={() => (
          <View>
            {/* Summary Section */}
            {rates.length > 0 && (
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>📊 Rate Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Best Buy Rate:</Text>
                  <Text style={[styles.summaryValue, { color: theme.success }]}>
                    ₦{summaryStats.bestBuyRate.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Best Sell Rate:</Text>
                  <Text style={[styles.summaryValue, { color: theme.warning }]}>
                    ₦{summaryStats.bestSellRate.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Brands:</Text>
                  <Text style={styles.summaryValue}>{summaryStats.totalBrands}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Rates:</Text>
                  <Text style={styles.summaryValue}>{summaryStats.totalRates}</Text>
                </View>
              </View>
            )}

            {/* Sort Options */}
            <View style={styles.sortContainer}>
              <Text style={styles.sortLabel}>Sort by:</Text>
              {["rate", "name", "popularity"].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.sortButton, sortBy === option && styles.sortButtonActive]}
                  onPress={() => setSortBy(option)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sortButtonText, sortBy === option && styles.sortButtonTextActive]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="trending-up-outline" size={48} color={theme.textMuted} />
            <Text style={styles.emptyStateTitle}>No rates found</Text>
            <Text style={styles.emptyStateSubtext}>
              {search.trim() ? "Try adjusting your search terms" : "Check back later for updated rates"}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchRates}
            tintColor={theme.accent}
            colors={[theme.accent]}
            progressBackgroundColor={theme.surface}
          />
        }
      />
    </View>
  )
}