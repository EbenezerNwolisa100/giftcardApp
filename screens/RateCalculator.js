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
  ScrollView,
  Platform,
} from "react-native"
import { supabase } from "./supabaseClient"
import { useNavigation, useFocusEffect } from "@react-navigation/native" // Import useFocusEffect
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import Modal from "react-native-modal"
import { useTheme } from "./ThemeContext"

const { width } = Dimensions.get("window")
const HEADER_HEIGHT_CALCULATED = Platform.OS === 'android' ? StatusBar.currentHeight + 80 : 100; // Approximate height for the fixed header

export default function HottestRatesScreen() {
  const navigation = useNavigation()
  const { theme, isDarkTheme } = useTheme()

  // Data states
  const [allSellBrands, setAllSellBrands] = useState([])
  const [allBuyBrands, setAllBuyBrands] = useState([])
  const [buyInventoryVariants, setBuyInventoryVariants] = useState({})

  // UI states
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("sell")
  const [unreadCount, setUnreadCount] = useState(0) // State for unread notifications

  // Calculator states
  const [selectedSellBrand, setSelectedSellBrand] = useState(null)
  const [selectedSellVariant, setSelectedSellVariant] = useState(null)
  const [selectedBuyBrand, setSelectedBuyBrand] = useState(null)
  const [selectedBuyVariant, setSelectedBuyVariant] = useState(null)
  const [calculatorAmount, setCalculatorAmount] = useState("")
  const [calculatedNaira, setCalculatedNaira] = useState("0.00")

  // Picker Modal states
  const [isPickerVisible, setIsPickerVisible] = useState(false)
  const [pickerData, setPickerData] = useState([])
  const [pickerType, setPickerType] = useState("")

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
            items: [],
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

      // Fetch unread notifications count (copied from Dashboard)
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false)
      setUnreadCount(count || 0)

    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchData()
    }, [fetchData]),
  )

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
        setSelectedSellVariant(null)
      } else {
        setSelectedBuyBrand(item)
        setSelectedBuyVariant(null)
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
      // backgroundColor: theme.primary,
      paddingHorizontal: 10,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 5 : 45,
      paddingBottom: 10,
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
      flex: 1, // Allows title to take available space
      textAlign: "center",
      marginLeft: -140, // Counteract back button width to center title
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
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingBottom: 32,
      paddingTop: 0, // Adjusted padding to clear fixed header
    },
    tabContainer: {
      flexDirection: "row",
      marginBottom: 24,
      borderRadius: 16, // Rounded container for tabs
      backgroundColor: theme.surfaceSecondary,
      overflow: 'hidden', // Ensures inner elements respect border radius
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    tab: {
      flex: 1,
      paddingVertical: 14, // Increased padding
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      // No individual border, handled by container and activeTab
    },
    activeTab: {
      backgroundColor: theme.accent, // Accent color for active tab
      // No border here, border is on container
    },
    tabText: {
      color: theme.textSecondary,
      fontSize: 15, // Slightly larger text
      fontWeight: "600",
    },
    activeTabText: {
      color: theme.primary, // Primary color for text on accent background
      fontWeight: "bold",
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 20, // Larger section title
      fontWeight: "bold",
      marginBottom: 20,
      textAlign: "center",
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
    },
    dropdownButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.surface, // Use surface for dropdowns
      borderRadius: 12, // Consistent rounded corners
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    dropdownButtonDisabled: {
      opacity: 0.6,
      backgroundColor: theme.surfaceSecondary, // Different background for disabled
    },
    dropdownButtonText: {
      color: theme.text,
      fontSize: 16,
      flex: 1,
    },
    textInput: {
      backgroundColor: theme.surface, // Use surface for text input
      borderRadius: 12, // Consistent rounded corners
      paddingHorizontal: 16,
      paddingVertical: 16,
      color: theme.text,
      fontSize: 16,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    payoutContainer: {
      backgroundColor: theme.card, // Use card for payout container
      borderRadius: 16,
      padding: 24, // Increased padding
      marginTop: 30, // More space
      marginBottom: 30,
      borderWidth: 1,
      borderColor: theme.accent, // Accent border for emphasis
      alignItems: "center",
      shadowColor: theme.accent, // Accent shadow
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    payoutLabel: {
      color: theme.textSecondary,
      fontSize: 16,
      marginBottom: 10, // More space
    },
    payoutValue: {
      color: theme.accent, // Accent color for the value
      fontSize: 36, // Larger value
      fontWeight: "bold",
    },
    clearButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14, // Increased padding
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surfaceSecondary, // Secondary surface for clear button
      marginBottom: 20,
      gap: 8,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    clearButtonText: {
      color: theme.text,
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
      color: theme.primary, // Primary color for text on gradient
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
      backgroundColor: theme.card, // Modal content background
    },
    modalTitle: {
      color: theme.text,
      fontSize: 22, // Larger modal title
      fontWeight: "bold",
      marginBottom: 20,
      textAlign: "center",
    },
    pickerItem: {
      paddingVertical: 15,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    pickerItemText: {
      color: theme.text,
      fontSize: 16,
    },
    modalCloseButton: {
      marginTop: 20,
      paddingVertical: 15,
      borderRadius: 12,
      alignItems: "center",
      backgroundColor: theme.surfaceSecondary, // Modal close button background
    },
    modalCloseButtonText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "bold",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 40,
    },
    emptyStateText: {
      color: theme.textMuted,
      fontSize: 16,
    },
    // Skeleton Styles
    skeletonContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    skeletonFixedHeader: {
      height: HEADER_HEIGHT_CALCULATED,
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
    skeletonTabContainer: {
      height: 50,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginHorizontal: 24,
      marginTop: 20,
      marginBottom: 24,
    },
    skeletonInputGroup: {
      height: 60,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 12,
      marginBottom: 20,
    },
    skeletonPayoutContainer: {
      height: 120,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginTop: 30,
      marginBottom: 30,
    },
    skeletonButton: {
      height: 50,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 12,
      marginBottom: 20,
    },
  })

  // HottestRatesScreen Skeleton Component
  const HottestRatesSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />
      {/* Fixed Header Skeleton */}
      <View style={styles.skeletonFixedHeader}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60, paddingBottom: 20 }}>
          <View style={{ width: 24, height: 24, backgroundColor: theme.surfaceSecondary, borderRadius: 12 }} /> {/* Back button placeholder */}
          <View style={[styles.skeletonHeader, { width: 180, height: 24, marginLeft: -24 }]} /> {/* Title placeholder */}
          <View style={[styles.notificationButton, { backgroundColor: theme.surfaceSecondary, borderRadius: 20, width: 40, height: 40 }]} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingTop: HEADER_HEIGHT_CALCULATED + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Tab Container Skeleton */}
        <View style={styles.skeletonTabContainer} />

        {/* Calculator Section Skeletons */}
        <View style={{ paddingHorizontal: 24 }}>
          <View style={[styles.skeletonHeader, { width: 200, height: 20, marginBottom: 20, alignSelf: 'center' }]} />
          <View style={styles.skeletonInputGroup} />
          <View style={styles.skeletonInputGroup} />
          <View style={styles.skeletonInputGroup} />
          <View style={styles.skeletonPayoutContainer} />
          <View style={styles.skeletonButton} />
          <View style={styles.skeletonButton} />
        </View>
      </ScrollView>
    </View>
  );

  if (loading) {
    return <HottestRatesSkeleton />;
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
          marginBottom: 20,
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
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold' }}>Rate Calculator</Text>
        <View style={{ width: 32, height: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
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
              activeTab === "sell" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("sell")}
            activeOpacity={0.7}
          >
            {/* <Ionicons
              name="trending-down"
              size={16}
              color={activeTab === "sell" ? theme.primary : theme.textSecondary}
            /> */}
            <Text
              style={[
                styles.tabText,
                activeTab === "sell" ? { color: theme.primary } : { color: theme.textSecondary },
              ]}
            >
              Sell Cards
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "buy" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("buy")}
            activeOpacity={0.7}
          >
            {/* <Ionicons
              name="trending-up"
              size={16}
              color={activeTab === "buy" ? theme.primary : theme.textSecondary}
            /> */}
            <Text
              style={[
                styles.tabText,
                activeTab === "buy" ? { color: theme.primary } : { color: theme.textSecondary },
              ]}
            >
              Buy Cards
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.calculatorContainer}>
          <Text style={styles.sectionTitle}>
            {activeTab === "sell" ? "Sell Card Calculator" : "Buy Card Calculator"}
          </Text>

          {/* Brand Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Select Brand</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={openBrandPicker}
              activeOpacity={0.7}
            >
              <Text style={styles.dropdownButtonText}>
                {activeTab === "sell"
                  ? selectedSellBrand?.name || "Choose a brand"
                  : selectedBuyBrand?.name || "Choose a brand"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Variant Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Select Variant</Text>
            <TouchableOpacity
              style={[
                styles.dropdownButton,
                !(selectedSellBrand || selectedBuyBrand) && styles.dropdownButtonDisabled,
              ]}
              onPress={openVariantPicker}
              disabled={!(selectedSellBrand || selectedBuyBrand)}
              activeOpacity={0.7}
            >
              <Text style={styles.dropdownButtonText}>
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
            <Text style={styles.inputLabel}>Amount (USD)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter amount in USD"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              value={calculatorAmount}
              onChangeText={setCalculatorAmount}
              editable={!!(selectedSellVariant || selectedBuyVariant)}
            />
          </View>

          {/* Calculated Payout */}
          <View style={styles.payoutContainer}>
            <Text style={styles.payoutLabel}>You'll {activeTab === "sell" ? "Receive" : "Pay"}:</Text>
            <Text style={styles.payoutValue}>₦{calculatedNaira}</Text>
          </View>

          {/* Clear Button */}
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setSelectedSellBrand(null)
              setSelectedSellVariant(null)
              setSelectedBuyBrand(null)
              setSelectedBuyVariant(null)
              setCalculatorAmount("")
              setCalculatedNaira("0.00")
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-circle-outline" size={20} color={theme.text} />
            <Text style={styles.clearButtonText}>Clear Calculator</Text>
          </TouchableOpacity>

          {/* Proceed Button (Optional, if user wants to go to form after calculation) */}
          {(selectedSellVariant || selectedBuyVariant) && Number.parseFloat(calculatorAmount) > 0 && (
            <TouchableOpacity
              style={styles.proceedButton}
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
                  const availableItems =
                    buyInventoryVariants[selectedBuyBrand.id]?.[
                      `${selectedBuyVariant.name}_${selectedBuyVariant.value}_${selectedBuyVariant.rate}`
                    ]?.items || []
                  if (availableItems.length > 0) {
                    navigation.navigate("BuyGiftcardForm", {
                      brand: selectedBuyBrand,
                      variant: selectedBuyVariant,
                      quantity: 1,
                    })
                  } else {
                    Alert.alert("Error", "No available cards for this variant.")
                  }
                }
              }}
              activeOpacity={0.8}
            >
              <LinearGradient colors={[theme.accent, theme.secondary]} style={styles.proceedButtonGradient}>
                <Text style={[styles.proceedButtonText, { color: theme.primary }]}>
                  Proceed to {activeTab === "sell" ? "Sell" : "Buy"}
                </Text>
                <Ionicons name="arrow-forward" size={20} color={theme.primary} style={styles.buttonIcon} />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Picker Modal */}
      <Modal isVisible={isPickerVisible} onBackdropPress={() => setIsPickerVisible(false)}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            Select {pickerType === "brand" ? "Brand" : "Variant"}
          </Text>
          <FlatList
            data={pickerData}
            keyExtractor={(item, index) => item.id || `${item.name}-${item.value}-${item.rate}-${index}`}
            renderItem={renderPickerItem}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No {pickerType}s available</Text>
              </View>
            }
          />
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setIsPickerVisible(false)}>
            <Text style={styles.modalCloseButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  )
}
