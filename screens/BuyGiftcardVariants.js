import { useState, useEffect, useCallback } from "react"
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
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { supabase } from "./supabaseClient"
import { useTheme } from "./ThemeContext"

const { width, height } = Dimensions.get("window")
const HEADER_HEIGHT_VARIANTS = Platform.OS === 'android' ? StatusBar.currentHeight + 80 : 100; // Approximate height for fixed header

export default function BuyGiftcardVariants() {
  const { theme, isDarkTheme } = useTheme()
  const route = useRoute()
  const navigation = useNavigation()
  const { brand } = route.params
  const [variants, setVariants] = useState([])
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [quantity, setQuantity] = useState("1")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0) // State for unread notifications

  const fetchVariants = useCallback(async () => {
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

      // Get available variants for this brand from giftcards_buy
      const { data, error } = await supabase
        .from("giftcards_buy")
        .select("variant_name, rate, value")
        .eq("buy_brand_id", brand.id)
        .eq("sold", false)
        .is("assigned_to", null)
      if (error) throw error

      // Group by variant_name and value, and count available
      const variantMap = {}
      ;(data || []).forEach((item) => {
        const key = `${item.variant_name}_${item.value}_${item.rate}`
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
        if (a.name < b.name) return -1
        if (a.name > b.name) return 1
        return a.value - b.value
      })
      setVariants(variantList)

      // Fetch unread notifications count
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false)
      setUnreadCount(count || 0)

    } catch (error) {
      console.error("Error fetching variants:", error)
      Alert.alert("Error", error.message || "Failed to load variants.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [brand.id])

  useFocusEffect(
    useCallback(() => {
      fetchVariants();
    }, [fetchVariants])
  );

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant)
    setQuantity("1")
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
      brand,
      variant: selectedVariant,
      quantity: qty,
    })
  }

  const calculateTotal = () => {
    if (!selectedVariant) return 0
    const qty = Number.parseInt(quantity) || 1
    return selectedVariant.value * selectedVariant.rate * qty
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
      backgroundColor: theme.primary,
      paddingHorizontal: 18,
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
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 18,
      paddingBottom: Platform.OS === "ios" ? 85 + 20 : 70 + 20, // Account for tab bar height
      paddingTop: 10, // Space after fixed header
    },
    brandCard: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      overflow: "hidden",
      marginBottom: 32,
      elevation: 5,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      padding: 24,
    },
    brandImageContainer: {
      width: 130,
      height: 100,
      borderRadius: 12,
      backgroundColor: theme.background,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    brandImage: {
      width: 100,
      height: 80,
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
    brandInfo: {
      flex: 1,
    },
    brandName: {
      color: theme.text,
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 4,
    },
    brandSubtext: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    variantsContainer: {
      marginBottom: 24,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 16,
    },
    variantCard: {
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      padding: 20,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    variantCardSelected: {
      borderColor: theme.accent,
      backgroundColor: theme.surface, // Changed to use theme.surface
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
      color: theme.text,
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
      color: theme.warning,
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 6,
    },
    availableText: {
      color: theme.success,
      fontSize: 12,
      fontWeight: "600",
      marginBottom: 4,
    },
    valuesText: {
      color: theme.textMuted,
      fontSize: 12,
    },
    variantAction: {
      padding: 8,
    },
    quantityContainer: {
      marginBottom: 24,
    },
    quantityCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    quantityInputContainer: {
      marginBottom: 16,
    },
    quantityLabel: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 8,
    },
    quantityInput: {
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: theme.text,
      fontSize: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    totalContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    totalLabel: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
    },
    totalValue: {
      color: theme.warning,
      fontSize: 18,
      fontWeight: "bold",
    },
    proceedButton: {
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 32,
      elevation: 8,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      backgroundColor: theme.accent,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 18,
      paddingHorizontal: 32,
    },
    proceedButtonText: {
      color: theme.primary,
      fontSize: 18,
      fontWeight: "bold",
      marginRight: 8,
    },
    buttonIcon: {
      marginLeft: 4,
      color: theme.primary,
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
      height: HEADER_HEIGHT_VARIANTS,
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
    skeletonBrandCard: {
      height: 120, // Approximate height of brand card
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 20,
      marginHorizontal: 24,
      marginTop: 20,
      marginBottom: 32,
    },
    skeletonSectionTitle: {
      height: 20,
      width: '50%',
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 4,
      marginBottom: 16,
      alignSelf: 'flex-start',
      marginLeft: 24,
    },
    skeletonVariantCard: {
      height: 100, // Approximate height of variant card
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginBottom: 12,
      marginHorizontal: 24,
    },
    skeletonQuantityCard: {
      height: 150, // Approximate height of quantity card
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginBottom: 24,
      marginHorizontal: 24,
    },
    skeletonProceedButton: {
      height: 60,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginBottom: 32,
      marginHorizontal: 24,
    },
  })

  // BuyGiftcardVariants Skeleton Component
  const BuyGiftcardVariantsSkeleton = () => (
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

      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingTop: HEADER_HEIGHT_VARIANTS + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Info Skeleton */}
        <View style={styles.skeletonBrandCard} />

        {/* Variants List Skeletons */}
        <View style={styles.skeletonSectionTitle} />
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.skeletonVariantCard} />
        ))}

        {/* Quantity Selection Skeleton */}
        <View style={styles.skeletonSectionTitle} />
        <View style={styles.skeletonQuantityCard} />

        {/* Proceed Button Skeleton */}
        <View style={styles.skeletonProceedButton} />
      </ScrollView>
    </View>
  );

  if (loading) {
    return <BuyGiftcardVariantsSkeleton />;
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
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold' }}>Select Variant</Text>
        <View style={{ width: 32, height: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchVariants}
            tintColor={theme.accent}
            colors={[theme.accent]}
            progressBackgroundColor={theme.surface}
          />
        }
      >
        {/* Brand Info */}
        <View style={styles.brandCard}>
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
            {/* <Text style={styles.brandSubtext}>{brand.available_count} cards available</Text> */}
          </View>
        </View>

        {/* Variants List */}
        <View style={styles.variantsContainer}>
          <Text style={styles.sectionTitle}>Available Variants</Text>
          {variants.map((variant, index) => (
            <TouchableOpacity
              key={`${variant.name}-${variant.value}-${variant.rate}-${index}`}
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
                    {/* <Ionicons name="trending-up" size={16} color={theme.warning} /> */}
                    <Text style={styles.rateText}>₦{variant.rate} per $1</Text>
                  </View>
                  {/* <Text style={styles.availableText}>{variant.available_count} available</Text> */}
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
                        ? theme.success
                        : theme.text
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
                  placeholderTextColor={theme.textMuted}
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
            <Text style={styles.proceedButtonText}>Proceed to Purchase</Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color={theme.primary}
              style={styles.buttonIcon}
            />
          </TouchableOpacity>
        )}

        {variants.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={48} color={theme.textMuted} />
            <Text style={styles.emptyStateText}>No variants available</Text>
            <Text style={styles.emptyStateSubtext}>This brand doesn't have any available inventory</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
