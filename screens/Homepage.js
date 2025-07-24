// import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar } from "react-native"
// import { LinearGradient } from "expo-linear-gradient"
// import { Ionicons, MaterialIcons } from "@expo/vector-icons"

// const { width, height } = Dimensions.get("window")

// export default function Homepage({ navigation }) {
//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#0E2148" />

//       {/* Background Gradient */}
//       <LinearGradient colors={["#0E2148", "#483AA0"]} style={styles.backgroundGradient} />

//       {/* Header Section */}
//       <View style={styles.header}>
//         <View style={styles.logoContainer}>
//           <View style={styles.logoIcon}>
//             <MaterialIcons name="card-giftcard" size={32} color="#E3D095" />
//           </View>
//           <Text style={styles.logoText}>GiftcardApp</Text>
//         </View>
//       </View>

//       {/* Main Content */}
//       <View style={styles.content}>
//         <View style={styles.welcomeSection}>
//           <Text style={styles.welcomeTitle}>Welcome to the Future of Gift Cards</Text>
//           <Text style={styles.welcomeSubtitle}>
//             Trade, sell, and manage your gift cards with ease. Join thousands of users who trust us with their digital
//             assets.
//           </Text>
//         </View>

//         {/* Feature Cards */}
//         <View style={styles.featuresContainer}>
//           <View style={styles.featureCard}>
//             <Ionicons name="flash" size={24} color="#E3D095" />
//             <Text style={styles.featureText}>Instant Trading</Text>
//           </View>
//           <View style={styles.featureCard}>
//             <Ionicons name="shield-checkmark" size={24} color="#E3D095" />
//             <Text style={styles.featureText}>Secure Platform</Text>
//           </View>
//           <View style={styles.featureCard}>
//             <Ionicons name="trending-up" size={24} color="#E3D095" />
//             <Text style={styles.featureText}>Best Rates</Text>
//           </View>
//         </View>

//         {/* Action Buttons */}
//         <View style={styles.buttonContainer}>
//           <TouchableOpacity
//             style={styles.primaryButton}
//             onPress={() => navigation.navigate("Register")}
//             activeOpacity={0.8}
//           >
//             <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.buttonGradient}>
//               <Text style={styles.primaryButtonText}>Get Started</Text>
//               <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
//             </LinearGradient>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.secondaryButton}
//             onPress={() => navigation.navigate("Login")}
//             activeOpacity={0.8}
//           >
//             <Text style={styles.secondaryButtonText}>Already have an account? Sign In</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Bottom Decoration */}
//       <View style={styles.bottomDecoration}>
//         <View style={styles.decorationCircle1} />
//         <View style={styles.decorationCircle2} />
//       </View>
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#0E2148",
//   },
//   backgroundGradient: {
//     position: "absolute",
//     left: 0,
//     right: 0,
//     top: 0,
//     height: height,
//   },
//   header: {
//     paddingTop: 60,
//     paddingHorizontal: 24,
//     alignItems: "center",
//   },
//   logoContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   logoIcon: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: "rgba(227, 208, 149, 0.2)",
//     justifyContent: "center",
//     alignItems: "center",
//     marginRight: 12,
//   },
//   logoText: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#fff",
//   },
//   content: {
//     flex: 1,
//     paddingHorizontal: 24,
//     justifyContent: "center",
//   },
//   welcomeSection: {
//     alignItems: "center",
//     marginBottom: 40,
//   },
//   welcomeTitle: {
//     fontSize: 28,
//     fontWeight: "bold",
//     color: "#fff",
//     textAlign: "center",
//     marginBottom: 16,
//     lineHeight: 34,
//   },
//   welcomeSubtitle: {
//     fontSize: 16,
//     color: "rgba(255, 255, 255, 0.8)",
//     textAlign: "center",
//     lineHeight: 24,
//     paddingHorizontal: 20,
//   },
//   featuresContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 50,
//   },
//   featureCard: {
//     backgroundColor: "rgba(255, 255, 255, 0.1)",
//     borderRadius: 16,
//     padding: 20,
//     alignItems: "center",
//     width: (width - 72) / 3,
//     borderWidth: 1,
//     borderColor: "rgba(227, 208, 149, 0.3)",
//   },
//   featureText: {
//     color: "#fff",
//     fontSize: 12,
//     fontWeight: "600",
//     marginTop: 8,
//     textAlign: "center",
//   },
//   buttonContainer: {
//     alignItems: "center",
//   },
//   primaryButton: {
//     width: "100%",
//     marginBottom: 16,
//     borderRadius: 16,
//     overflow: "hidden",
//     elevation: 8,
//     shadowColor: "#7965C1",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//   },
//   buttonGradient: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 18,
//     paddingHorizontal: 32,
//   },
//   primaryButtonText: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "bold",
//     marginRight: 8,
//   },
//   buttonIcon: {
//     marginLeft: 4,
//   },
//   secondaryButton: {
//     paddingVertical: 16,
//     paddingHorizontal: 32,
//   },
//   secondaryButtonText: {
//     color: "#E3D095",
//     fontSize: 16,
//     fontWeight: "600",
//     textAlign: "center",
//   },
//   bottomDecoration: {
//     position: "absolute",
//     bottom: -50,
//     right: -50,
//   },
//   decorationCircle1: {
//     width: 120,
//     height: 120,
//     borderRadius: 60,
//     backgroundColor: "rgba(227, 208, 149, 0.1)",
//     position: "absolute",
//   },
//   decorationCircle2: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: "rgba(121, 101, 193, 0.2)",
//     position: "absolute",
//     top: 20,
//     left: 20,
//   },
// })





"use client"
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar } from "react-native"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { useTheme } from "./ThemeContext" // Adjust path as needed

const { width } = Dimensions.get("window")

export default function Homepage({ navigation }) {
  const { theme, isDarkTheme } = useTheme()

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background, // Solid background color
    },
    statusBar: {
      backgroundColor: theme.primary,
    },
    header: {
      paddingTop: 60,
      paddingHorizontal: 24,
      alignItems: "center",
      marginBottom: 40,
    },
    logoContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    logoIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: isDarkTheme ? theme.surface : theme.secondary,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    logoText: {
      fontSize: 28,
      fontWeight: "bold",
      color: theme.text,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: "center",
    },
    welcomeSection: {
      alignItems: "center",
      marginBottom: 50,
    },
    welcomeTitle: {
      fontSize: 32,
      fontWeight: "bold",
      color: theme.text,
      textAlign: "center",
      marginBottom: 16,
      lineHeight: 38,
    },
    welcomeSubtitle: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      paddingHorizontal: 10,
    },
    featuresContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: 60,
      flexWrap: "wrap",
    },
    featureCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
      width: (width - 72) / 3,
      minWidth: 100,
      marginHorizontal: 4,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
      marginBottom: 16,
    },
    featureIcon: {
      color: theme.accent,
    },
    featureText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "600",
      marginTop: 10,
      textAlign: "center",
    },
    buttonContainer: {
      alignItems: "center",
    },
    primaryButton: {
      width: "100%",
      marginBottom: 16,
      borderRadius: 16,
      backgroundColor: theme.accent, // Solid accent color
      paddingVertical: 18,
      paddingHorizontal: 32,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 8,
    },
    primaryButtonText: {
      color: theme.primary, // White text for contrast on Gunmetal
      fontSize: 18,
      fontWeight: "bold",
      marginRight: 8,
    },
    buttonIcon: {
      marginLeft: 4,
      color: theme.primary, // White icon for contrast
    },
    secondaryButton: {
      paddingVertical: 16,
      paddingHorizontal: 32,
    },
    secondaryButtonText: {
      color: theme.accent,
      fontSize: 16,
      fontWeight: "600",
      textAlign: "center",
    },
    bottomDecoration: {
      position: "absolute",
      bottom: -50,
      right: -50,
      opacity: 0.1,
    },
    decorationCircle1: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.accent,
      position: "absolute",
    },
    decorationCircle2: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.secondary,
      position: "absolute",
      top: 20,
      left: 20,
    },
  })

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkTheme ? "light-content" : "dark-content"} backgroundColor={theme.primary} />

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <MaterialIcons name="card-giftcard" size={32} color={theme.accent} />
          </View>
          <Text style={styles.logoText}>GiftcardApp</Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to the Future of Gift Cards</Text>
          <Text style={styles.welcomeSubtitle}>
            Trade, sell, and manage your gift cards with ease. Join thousands of users who trust us with their digital
            assets.
          </Text>
        </View>

        {/* Feature Cards */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureCard}>
            <Ionicons name="flash" size={28} style={styles.featureIcon} />
            <Text style={styles.featureText}>Instant Trading</Text>
          </View>
          <View style={styles.featureCard}>
            <Ionicons name="shield-checkmark" size={28} style={styles.featureIcon} />
            <Text style={styles.featureText}>Secure Platform</Text>
          </View>
          <View style={styles.featureCard}>
            <Ionicons name="trending-up" size={28} style={styles.featureIcon} />
            <Text style={styles.featureText}>Best Rates</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("Register")}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} style={styles.buttonIcon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Decoration */}
      <View style={styles.bottomDecoration}>
        <View style={styles.decorationCircle1} />
        <View style={styles.decorationCircle2} />
      </View>
    </View>
  )
}
