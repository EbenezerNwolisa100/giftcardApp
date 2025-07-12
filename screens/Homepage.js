// import React from 'react';
// import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// export default function Homepage({ navigation }) {
//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Welcome to GiftcardApp!</Text>
//       <Text style={styles.subtitle}>Get started by registering or logging in.</Text>
//       <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Register')}>
//         <Text style={styles.buttonText}>Register</Text>
//       </TouchableOpacity>
//       <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
//         <Text style={styles.buttonText}>Login</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f6fa',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 24,
//   },
//   title: {
//     fontSize: 32,
//     fontWeight: 'bold',
//     color: '#2d3436',
//     marginBottom: 12,
//   },
//   subtitle: {
//     fontSize: 18,
//     color: '#636e72',
//     marginBottom: 32,
//   },
//   button: {
//     backgroundColor: '#0984e3',
//     paddingVertical: 14,
//     paddingHorizontal: 40,
//     borderRadius: 8,
//     marginVertical: 8,
//     width: '80%',
//     alignItems: 'center',
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '600',
//   },
// }); 



import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"

const { width, height } = Dimensions.get("window")

export default function Homepage({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E2148" />

      {/* Background Gradient */}
      <LinearGradient colors={["#0E2148", "#483AA0"]} style={styles.backgroundGradient} />

      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <MaterialIcons name="card-giftcard" size={32} color="#E3D095" />
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
            <Ionicons name="flash" size={24} color="#E3D095" />
            <Text style={styles.featureText}>Instant Trading</Text>
          </View>
          <View style={styles.featureCard}>
            <Ionicons name="shield-checkmark" size={24} color="#E3D095" />
            <Text style={styles.featureText}>Secure Platform</Text>
          </View>
          <View style={styles.featureCard}>
            <Ionicons name="trending-up" size={24} color="#E3D095" />
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
            <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.buttonGradient}>
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
            </LinearGradient>
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(227, 208, 149, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  welcomeSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 34,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 50,
  },
  featureCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    width: (width - 72) / 3,
    borderWidth: 1,
    borderColor: "rgba(227, 208, 149, 0.3)",
  },
  featureText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },
  buttonContainer: {
    alignItems: "center",
  },
  primaryButton: {
    width: "100%",
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#7965C1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  secondaryButtonText: {
    color: "#E3D095",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  bottomDecoration: {
    position: "absolute",
    bottom: -50,
    right: -50,
  },
  decorationCircle1: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(227, 208, 149, 0.1)",
    position: "absolute",
  },
  decorationCircle2: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(121, 101, 193, 0.2)",
    position: "absolute",
    top: 20,
    left: 20,
  },
})
