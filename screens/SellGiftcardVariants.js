import { useState, useCallback, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  ScrollView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native"
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native" // Import useFocusEffect
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "./ThemeContext"
import { supabase } from "./supabaseClient" // Import supabase

const { width, height } = Dimensions.get("window")
const HEADER_HEIGHT_VARIANTS = Platform.OS === 'android' ? StatusBar.currentHeight + 80 : 100; // Approximate height for fixed header

export default function SellGiftcardVariants() {
  const route = useRoute()
  const navigation = useNavigation()
  const { brand } = route.params
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [variants, setVariants] = useState([]) // Initialize variants state
  const [loading, setLoading] = useState(true) // Add loading state
  const [refreshing, setRefreshing] = useState(false) // Add refreshing state
  const [unreadCount, setUnreadCount] = useState(0) // State for unread notifications
  const { theme, isDarkTheme } = useTheme()

  const fetchVariantsAndNotifications = useCallback(async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch variants for the brand
      const { data: variantData, error: variantError } = await supabase
        .from("giftcards_sell_variants")
        .select("id, name, sell_rate")
        .eq("brand_id", brand.id)
        .order("name", { ascending: true }); // Order variants for consistency

      if (variantError) throw variantError;
      setVariants(variantData || []);

      // Fetch unread notifications count
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setUnreadCount(count || 0);

    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", error.message || "Failed to load variants or notifications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [brand.id]);

  useFocusEffect(
    useCallback(() => {
      fetchVariantsAndNotifications();
    }, [fetchVariantsAndNotifications])
  );

  const handleVariantSelect = (variant) => {
    const brandWithVariant = {
      ...brand,
      selectedVariant: variant,
      sell_rate: variant.sell_rate, // For backward compatibility
    }
    navigation.navigate("SellGiftcardForm", { brand: brandWithVariant })
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
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 18,
      paddingBottom: Platform.OS === "ios" ? 85 + 20 : 70 + 20, // Account for tab bar height
      paddingTop: 0, // Space after fixed header
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
    variantAction: {
      padding: 8,
    },
    exampleContainer: {
      backgroundColor: theme.success + "1A", // Tint of success
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.success, // Use success for border
      marginTop: 8,
    },
    exampleText: {
      color: theme.success,
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

  })

  // SellGiftcardVariants Skeleton Component
  const SellGiftcardVariantsSkeleton = () => (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />

      {/* Fixed Header Skeleton */}
      <View
        style={{
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
          zIndex: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ width: 24, height: 24, backgroundColor: theme.surfaceSecondary, borderRadius: 12 }} />
        <View style={{ width: 120, height: 24, backgroundColor: theme.surfaceSecondary, borderRadius: 4 }} />
        <View style={{ width: 32, height: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Info Skeleton */}
        <View style={styles.brandCard}>
          <View style={[styles.brandImageContainer, { backgroundColor: theme.surfaceSecondary }]}>
            <View style={{ width: 100, height: 80, backgroundColor: theme.surfaceSecondary, borderRadius: 8 }} />
          </View>
          <View style={styles.brandInfo}>
            <View style={{ width: 120, height: 20, backgroundColor: theme.surfaceSecondary, borderRadius: 4, marginBottom: 4 }} />
            <View style={{ width: 100, height: 14, backgroundColor: theme.surfaceSecondary, borderRadius: 4 }} />
          </View>
        </View>

        {/* Variants List Skeletons */}
        <View style={styles.variantsContainer}>
          <View style={[styles.sectionTitle, { backgroundColor: theme.surfaceSecondary, width: 150, height: 18 }]} />
        {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.variantCard, { backgroundColor: theme.surfaceSecondary }]}>
              <View style={styles.variantContent}>
                <View style={styles.variantInfo}>
                  <View style={{ width: 100, height: 16, backgroundColor: theme.surfaceSecondary, borderRadius: 4, marginBottom: 8 }} />
                  <View style={styles.rateContainer}>
                    <View style={{ width: 80, height: 14, backgroundColor: theme.surfaceSecondary, borderRadius: 4 }} />
                  </View>
                </View>
                <View style={styles.variantAction}>
                  <View style={{ width: 20, height: 20, backgroundColor: theme.surfaceSecondary, borderRadius: 10 }} />
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  if (loading) {
    return <SellGiftcardVariantsSkeleton />;
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
            onRefresh={fetchVariantsAndNotifications}
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
              key={variant.id}
              style={[
                styles.variantCard,
                selectedVariant?.id === variant.id && styles.variantCardSelected,
              ]}
              onPress={() => handleVariantSelect(variant)}
              activeOpacity={0.8}
            >
              <View style={styles.variantContent}>
                <View style={styles.variantInfo}>
                  <Text style={styles.variantName}>
                    {variant.name}
                  </Text>
                  <View style={styles.rateContainer}>
                    {/* <Ionicons name="trending-up" size={16} color={theme.warning} /> */}
                    <Text style={styles.rateText}>₦{variant.sell_rate} per $1</Text>
                  </View>
                  {/* <Text style={styles.availableText}>{variant.available_count} available</Text> */}
                </View>
                <View style={styles.variantAction}>
                  <Ionicons
                    name={
                      selectedVariant?.id === variant.id
                        ? "checkmark-circle"
                        : "arrow-forward"
                    }
                    size={20}
                    color={
                      selectedVariant?.id === variant.id
                        ? theme.success
                        : theme.text
                    }
                  />
                </View>
              </View>
              {/* Example calculation */}
              {/* <View style={styles.exampleContainer}>
                <Text style={styles.exampleText}>
                  Example: $100 card = ₦{(100 * variant.sell_rate).toLocaleString()}
                </Text>
              </View> */}
            </TouchableOpacity>
          ))}
        </View>
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
