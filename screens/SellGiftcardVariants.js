"use client"

import { useState } from "react"
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
} from "react-native"
import { useRoute, useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "./ThemeContext"

const { height } = Dimensions.get("window")
const HEADER_HEIGHT = Platform.OS === "android" ? 90 : 100 // Adjusted height for header

export default function SellGiftcardVariants() {
  const route = useRoute()
  const navigation = useNavigation()
  const { brand } = route.params
  const [selectedVariant, setSelectedVariant] = useState(null)
  const variants = brand.giftcards_sell_variants || []
  const { theme } = useTheme()

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
    fixedHeader: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: HEADER_HEIGHT,
      backgroundColor: theme.primary,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      zIndex: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 50,
    },
    backButton: {
      paddingVertical: 8,
    },
    headerTitle: {
      color: theme.textContrast,
      fontSize: 20,
      fontWeight: "bold",
    },
    placeholder: {
      width: 40,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: HEADER_HEIGHT, // Offset for the fixed header
      paddingBottom: 40,
    },
    brandCard: {
      borderRadius: 20,
      overflow: "hidden",
      marginBottom: 32,
      elevation: 8,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      backgroundColor: theme.card, // Use theme.card for brand card background
      borderWidth: 1,
      borderColor: theme.border,
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
      backgroundColor: theme.background,
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
      backgroundColor: theme.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    brandImagePlaceholderText: {
      color: theme.textContrast,
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
      gap: 16,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 16,
    },
    variantCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 2,
      borderColor: theme.border,
    },
    variantCardSelected: {
      borderColor: theme.warning,
      backgroundColor: theme.warningBackground,
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
      color: theme.text,
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 8,
    },
    rateContainer: {
      flexDirection: "row",
      alignItems: "center",
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
      backgroundColor: theme.successBackground,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.successBorder,
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.primary} />
      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.textContrast} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Variant</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Brand Info */}
        <View style={styles.brandCard}>
          <View style={styles.brandGradient}>
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
          </View>
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
                    <Ionicons name="trending-up" size={16} color={theme.warning} />
                    <Text style={styles.rateText}>₦{variant.sell_rate} per $1</Text>
                  </View>
                </View>
                <View style={styles.variantAction}>
                  <Ionicons name="arrow-forward" size={20} color={theme.textContrast} />
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
            <Ionicons name="alert-circle-outline" size={48} color={theme.textMuted} />
            <Text style={styles.emptyStateText}>No variants available</Text>
            <Text style={styles.emptyStateSubtext}>This brand doesn't have any variants configured yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
