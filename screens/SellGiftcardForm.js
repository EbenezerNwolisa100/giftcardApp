import { useState } from "react"
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
} from "react-native"
import { useRoute, useNavigation } from "@react-navigation/native"
import * as ImagePicker from "expo-image-picker"
import { supabase } from "./supabaseClient"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"

const { width, height } = Dimensions.get("window")

export default function SellGiftcardForm() {
  const route = useRoute()
  const navigation = useNavigation()
  const { brand } = route.params
  const selectedVariant = brand.selectedVariant
  const [amount, setAmount] = useState("")
  const [cardCode, setCardCode] = useState("")
  const [image, setImage] = useState(null)
  const [uploading, setUploading] = useState(false)

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

      Alert.alert("Success", "Your gift card has been submitted for review!", [
        {
          text: "View Transactions",
          onPress: () => navigation.navigate("Transactions"),
        },
        {
          text: "OK",
          onPress: () => navigation.navigate("SellGiftcard"),
        },
      ])
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to submit transaction.")
    }
    setUploading(false)
  }

  const calculatePayout = () => {
    if (!amount || isNaN(amount)) return 0
    return Number(amount) * Number(selectedVariant.sell_rate)
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E2148" />

      <LinearGradient colors={["#0E2148", "#483AA0"]} style={styles.backgroundGradient} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoidingView}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sell Gift Card</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Brand & Variant Info */}
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
                <Text style={styles.variantName}>{selectedVariant.name}</Text>
                <View style={styles.rateContainer}>
                  <Text style={styles.rateText}>₦{selectedVariant.sell_rate} per $1</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Gift Card Amount (USD)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="card" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter amount in USD"
                  placeholderTextColor="rgba(255,255,255,0.6)"
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
                <Ionicons name="key" size={20} color="rgba(255,255,255,0.6)" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter gift card code"
                  placeholderTextColor="rgba(255,255,255,0.6)"
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
                      <Ionicons name="camera" size={24} color="#fff" />
                      <Text style={styles.changeImageText}>Change Image</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.imagePickerContent}>
                    <Ionicons name="camera" size={48} color="rgba(255,255,255,0.6)" />
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
              <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.buttonGradient}>
                {uploading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Submit for Review</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Ionicons name="shield-checkmark" size={16} color="#E3D095" />
            <Text style={styles.securityText}>Your transaction will be reviewed within 24 hours</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardAvoidingView: {
    flex: 1,
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
  variantName: {
    color: "#E3D095",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  rateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rateText: {
    color: "#E3D095",
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 16,
  },
  payoutInfo: {
    backgroundColor: "rgba(227, 208, 149, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(227, 208, 149, 0.3)",
  },
  payoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  payoutLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  payoutValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "rgba(227, 208, 149, 0.3)",
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 0,
  },
  totalLabel: {
    color: "#E3D095",
    fontSize: 16,
    fontWeight: "bold",
  },
  totalValue: {
    color: "#E3D095",
    fontSize: 18,
    fontWeight: "bold",
  },
  imagePicker: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 4,
  },
  imagePickerSubtext: {
    color: "rgba(255,255,255,0.6)",
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
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  submitButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
    elevation: 8,
    shadowColor: "#7965C1",
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
    color: "#fff",
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
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginLeft: 8,
    textAlign: "center",
  },
})
