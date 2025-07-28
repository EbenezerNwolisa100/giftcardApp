import { useState, useCallback, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  RefreshControl,
} from "react-native"
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native" // Import useFocusEffect
import * as ImagePicker from "expo-image-picker"
import { supabase } from "./supabaseClient"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "./ThemeContext"

const { height } = Dimensions.get("window")
const HEADER_HEIGHT_FORM = Platform.OS === "android" ? 90 : 100 // Adjusted height for header

export default function SellGiftcardForm() {
  const route = useRoute()
  const navigation = useNavigation()
  const { brand } = route.params
  const selectedVariant = brand.selectedVariant
  const [amount, setAmount] = useState("")
  const [cardCode, setCardCode] = useState("")
  const [image, setImage] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true); // Add loading state for initial data fetch
  const [refreshing, setRefreshing] = useState(false); // Add refreshing state
  const [unreadCount, setUnreadCount] = useState(0); // State for unread notifications
  const { theme, isDarkTheme } = useTheme() // Destructure isDarkTheme here

  const fetchData = useCallback(async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      // Fetch unread notifications count
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setUnreadCount(count || 0);

    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", error.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0])
    }
  }

  const validateForm = () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid gift card amount.")
      return false
    }
    if (!cardCode.trim()) {
      Alert.alert("Error", "Please enter the gift card code.")
      return false
    }
    if (!image) {
      Alert.alert("Error", "Please upload an image of the gift card.")
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setUploading(true)
    let imageUrl = ""

    try {
      // Upload image to Supabase Storage
      const ext = image.uri.split(".").pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
      const response = await fetch(image.uri)
      const blob = await response.blob()

      const { data, error } = await supabase.storage
        .from("giftcard-images")
        .upload(fileName, blob, { contentType: image.type || "image/jpeg" })

      if (error) throw error

      const { data: publicUrlData } = supabase.storage.from("giftcard-images").getPublicUrl(fileName)
      imageUrl = publicUrlData.publicUrl
    } catch (e) {
      setUploading(false)
      Alert.alert("Image Upload Error", e.message || "Failed to upload image.")
      return
    }

    // Insert transaction
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const total = Number(amount) * Number(selectedVariant.sell_rate)

      const { error } = await supabase.from("giftcard_transactions").insert([
        {
          user_id: user.id,
          brand_id: brand.id,
          variant_id: selectedVariant.id,
          variant_name: selectedVariant.name,
          type: "sell",
          amount: Number(amount),
          rate: selectedVariant.sell_rate,
          total,
          status: "pending",
          card_code: cardCode,
          image_url: imageUrl,
        },
      ])

      if (error) throw error

      // Navigate to success screen instead of showing alert
      navigation.navigate("TransactionSuccess", {
        transactionType: "sell",
        transactionData: { id: data?.[0]?.id },
        brand: brand,
        variant: selectedVariant,
        quantity: 1,
        totalAmount: total
      })
    } catch (e) {
      // Navigate to failure screen instead of showing alert
      navigation.navigate("TransactionFailure", {
        transactionType: "sell",
        errorMessage: e.message || "Failed to submit transaction.",
        errorCode: e.code || "SUBMIT_ERROR",
        brand: brand,
        variant: selectedVariant,
        quantity: 1,
        totalAmount: total
      })
    } finally {
      setUploading(false)
    }
  }

  const calculatePayout = () => {
    if (!amount || isNaN(amount)) return 0
    return Number(amount) * Number(selectedVariant.sell_rate)
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
    keyboardAvoidingView: {
      flex: 1,
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
    variantName: {
      color: theme.warning,
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
    },
    rateContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    rateText: {
      color: theme.warning,
      fontSize: 16,
      fontWeight: "600",
    },
    formContainer: {
      gap: 24,
    },
    inputContainer: {
      gap: 8,
    },
    inputLabel: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.surface,
      borderRadius: 16,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      color: theme.text,
      fontSize: 16,
      paddingVertical: 16,
    },
    payoutInfo: {
      backgroundColor: theme.surface, // Tint of warning
      borderRadius: 12,
      padding: 16,
      marginTop: 12,
      borderWidth: 1,
      borderColor: theme.secondary, // Use warning for border
    },
    payoutRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    payoutLabel: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    payoutValue: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "600",
    },
    totalRow: {
      borderTopWidth: 1,
      borderTopColor: theme.secondary, // Use warning for border
      paddingTop: 12,
      marginTop: 4,
      marginBottom: 0,
    },
    totalLabel: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "bold",
    },
    totalValue: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "bold",
    },
    imagePicker: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: theme.border,
      borderStyle: "dashed",
      overflow: "hidden",
    },
    imagePickerContent: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    imagePickerText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "600",
      marginTop: 12,
      marginBottom: 4,
    },
    imagePickerSubtext: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    imagePreviewContainer: {
      position: "relative",
    },
    previewImage: {
      width: "100%",
      height: 200,
      borderRadius: 14,
    },
    imageOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 14,
    },
    changeImageText: {
      color: theme.textContrast,
      fontSize: 14,
      fontWeight: "600",
      marginTop: 8,
    },
    submitButton: {
      borderRadius: 16,
      overflow: "hidden",
      marginTop: 8,
      elevation: 8,
      shadowColor: theme.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    submitButtonDisabled: {
      opacity: 0.7,
    },
    buttonGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 18,
      paddingHorizontal: 32,
    },
    submitButtonText: {
      color: theme.primary,
      fontSize: 18,
      fontWeight: "bold",
      marginRight: 8,
    },
    buttonIcon: {
      marginLeft: 4,
    },
    securityNotice: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 32,
    },
    securityText: {
      color: theme.textSecondary,
      fontSize: 12,
      marginLeft: 8,
      textAlign: "center",
    },
    // Skeleton Styles
    skeletonContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    skeletonFixedHeader: {
      height: HEADER_HEIGHT_FORM,
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
      height: 120,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 20,
      marginHorizontal: 24,
      marginTop: 20,
      marginBottom: 32,
    },
    skeletonInputContainer: {
      height: 100, // Approximate height for input + label
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginBottom: 24,
      marginHorizontal: 24,
    },
    skeletonImagePicker: {
      height: 200,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginBottom: 24,
      marginHorizontal: 24,
    },
    skeletonSubmitButton: {
      height: 60,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 16,
      marginBottom: 24,
      marginHorizontal: 24,
    },
    skeletonSecurityNotice: {
      height: 40,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: 12,
      marginHorizontal: 24,
    },
  })

  // SellGiftcardForm Skeleton Component
  const SellGiftcardFormSkeleton = () => (
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
        contentContainerStyle={[styles.scrollContainer, { paddingTop: HEADER_HEIGHT_FORM + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand & Variant Info Skeleton */}
        <View style={styles.skeletonBrandCard} />

        {/* Form Skeletons */}
        <View style={styles.skeletonInputContainer} />
        <View style={styles.skeletonInputContainer} />
        <View style={styles.skeletonImagePicker} />

        {/* Submit Button Skeleton */}
        <View style={styles.skeletonSubmitButton} />

        {/* Security Notice Skeleton */}
        <View style={styles.skeletonSecurityNotice} />
      </ScrollView>
    </View>
  );

  if (loading) {
    return <SellGiftcardFormSkeleton />;
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
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold' }}>Complete Purchase</Text>
        <View style={{ width: 32, height: 32 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
          {/* Brand & Variant Info */}
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
              <Text style={styles.variantName}>{selectedVariant.name}</Text>
              <View style={styles.rateContainer}>
                <Text style={styles.rateText}>₦{selectedVariant.sell_rate} per $1</Text>
              </View>
            </View>
          </View>
          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Gift Card Amount (USD)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="card" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter amount in USD"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
              {amount && !isNaN(amount) && Number(amount) > 0 && (
                <View style={styles.payoutInfo}>
                  <View style={styles.payoutRow}>
                    <Text style={styles.payoutLabel}>Amount:</Text>
                    <Text style={styles.payoutValue}>${Number(amount).toLocaleString()}</Text>
                  </View>
                  <View style={styles.payoutRow}>
                    <Text style={styles.payoutLabel}>Rate:</Text>
                    <Text style={styles.payoutValue}>₦{selectedVariant.sell_rate}</Text>
                  </View>
                  <View style={[styles.payoutRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>You'll Receive:</Text>
                    <Text style={styles.totalValue}>₦{calculatePayout().toLocaleString()}</Text>
                  </View>
                </View>
              )}
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Gift Card Code</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="key" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter gift card code"
                  placeholderTextColor={theme.textSecondary}
                  value={cardCode}
                  onChangeText={setCardCode}
                  multiline
                />
              </View>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Gift Card Image</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage} activeOpacity={0.8}>
                {image ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: image.uri }} style={styles.previewImage} />
                    <View style={styles.imageOverlay}>
                      <Ionicons name="camera" size={24} color={theme.textContrast} />
                      <Text style={styles.changeImageText}>Change Image</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.imagePickerContent}>
                    <Ionicons name="camera" size={48} color={theme.textSecondary} />
                    <Text style={styles.imagePickerText}>Upload Gift Card Image</Text>
                    <Text style={styles.imagePickerSubtext}>Take a clear photo of your gift card</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={uploading}
              activeOpacity={0.8}
            >
              <LinearGradient colors={[theme.accent, theme.accent]} style={styles.buttonGradient}>
                {uploading ? (
                  <ActivityIndicator color={theme.textContrast} size="small" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Submit for Review</Text>
                    <Ionicons name="arrow-forward" size={20} color={theme.primary} style={styles.buttonIcon} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Ionicons name="shield-checkmark" size={16} color={theme.warning} />
            <Text style={styles.securityText}>Your transaction will be reviewed within 24 hours</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
