// import { NavigationContainer } from "@react-navigation/native"
// import { createNativeStackNavigator } from "@react-navigation/native-stack"
// import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
// import { StatusBar } from "expo-status-bar"
// import { useEffect, useState } from "react"
// import { ActivityIndicator, View, Platform } from "react-native"
// import { LinearGradient } from "expo-linear-gradient"
// import { MaterialIcons, Ionicons } from "@expo/vector-icons"
// import { supabase } from "./screens/supabaseClient"

// // Import screens
// import Homepage from "./screens/Homepage"
// import Register from "./screens/Register"
// import Login from "./screens/Login"
// import Dashboard from "./screens/Dashboard"
// import Transactions from "./screens/Transactions"
// import SellGiftcard from "./screens/SellGiftcard"
// import Profile from "./screens/Profile"
// import SellGiftcardForm from "./screens/SellGiftcardForm"
// import ChangePassword from "./screens/ChangePassword"
// import TransactionPin from "./screens/TransactionPin"
// import Withdraw from "./screens/Withdraw"
// import NotificationsScreen from "./screens/NotificationsScreen"
// import HottestRatesScreen from "./screens/HottestRatesScreen"
// import FAQ from "./screens/FAQ"
// import SupportCenter from "./screens/SupportCenter"
// import RateCalculator from "./screens/RateCalculator"
// import BankDetails from './screens/BankDetails';
// import BuyGiftcard from "./screens/BuyGiftcard";
// import BuyGiftcardForm from "./screens/BuyGiftcardForm";
// import Wallet from "./screens/Wallet";
// import FundWallet from "./screens/FundWallet";
// import TransactionDetails from "./screens/TransactionDetails";
// import SellGiftcardVariants from "./screens/SellGiftcardVariants"
// import BuyGiftcardVariants from "./screens/BuyGiftcardVariants"
// import { ThemeProvider } from "./screens/ThemeContext"

// const Stack = createNativeStackNavigator()
// const Tab = createBottomTabNavigator()

// // Custom Tab Bar Background Component
// function TabBarBackground() {
//   return (
//     <LinearGradient
//       colors={["rgba(14, 33, 72, 0.95)", "rgba(72, 58, 160, 0.95)"]}
//       style={{
//         position: "absolute",
//         left: 0,
//         right: 0,
//         top: 0,
//         height: "100%",
//       }}
//     />
//   )
// }

// function AuthStack() {
//   return (
//     <Stack.Navigator initialRouteName="Homepage" screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="Homepage" component={Homepage} />
//       <Stack.Screen name="Register" component={Register} />
//       <Stack.Screen name="Login" component={Login} />
//     </Stack.Navigator>
//   )
// }

// function LoggedInTabs() {
//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => ({
//         headerShown: false,
//         tabBarIcon: ({ focused, size }) => {
//           let iconName
//           let IconComponent = MaterialIcons

//           if (route.name === "Dashboard") {
//             iconName = "dashboard"
//           } else if (route.name === "Transactions") {
//             iconName = "receipt-long"
//           } else if (route.name === "Rates") {
//             iconName = "trending-up"
//           } else if (route.name === "Support") {
//             iconName = "support-agent"
//           } else if (route.name === "Profile") {
//             IconComponent = Ionicons
//             iconName = "person-outline"
//           }

//           const iconColor = focused ? "#E3D095" : "rgba(255, 255, 255, 0.6)"

//           return (
//             <View
//               style={{
//                 alignItems: "center",
//                 justifyContent: "center",
//                 width: 50,
//                 height: 50,
//                 borderRadius: 25,
//                 backgroundColor: focused ? "rgba(227, 208, 149, 0.15)" : "transparent",
//                 marginTop: focused ? -5 : 0,
//               }}
//             >
//               <IconComponent name={iconName} size={focused ? size + 2 : size} color={iconColor} />
//               {focused && (
//                 <View
//                   style={{
//                     width: 4,
//                     height: 4,
//                     borderRadius: 2,
//                     backgroundColor: "#E3D095",
//                     marginTop: 2,
//                   }}
//                 />
//               )}
//             </View>
//           )
//         },
//         tabBarActiveTintColor: "#E3D095",
//         tabBarInactiveTintColor: "rgba(255, 255, 255, 0.6)",
//         tabBarBackground: () => <TabBarBackground />,
//         tabBarStyle: {
//           position: "absolute",
//           bottom: 0,
//           left: 0,
//           right: 0,
//           height: Platform.OS === "ios" ? 85 : 70,
//           borderTopWidth: 0,
//           elevation: 0,
//           shadowColor: "transparent",
//           backgroundColor: "transparent",
//           paddingTop: 8,
//           paddingBottom: Platform.OS === "ios" ? 25 : 8,
//           paddingHorizontal: 16,
//         },
//         tabBarItemStyle: {
//           paddingVertical: 4,
//         },
//         tabBarLabelStyle: {
//           fontSize: 11,
//           fontWeight: "600",
//           marginTop: -2,
//           textAlign: "center",
//         },
//         tabBarHideOnKeyboard: true,
//       })}
//     >
//       <Tab.Screen
//         name="Dashboard"
//         component={Dashboard}
//         options={{
//           tabBarLabel: "Home",
//         }}
//       />
//       <Tab.Screen
//         name="Transactions"
//         component={Transactions}
//         options={{
//           tabBarLabel: "History",
//         }}
//       />
//       <Tab.Screen
//         name="Rates"
//         component={HottestRatesScreen}
//         options={{
//           tabBarLabel: "Rates",
//         }}
//       />
//       <Tab.Screen
//         name="Support"
//         component={SupportCenter}
//         options={{
//           tabBarLabel: "Support",
//         }}
//       />
//       <Tab.Screen
//         name="Profile"
//         component={Profile}
//         options={{
//           tabBarLabel: "Profile",
//         }}
//       />
//     </Tab.Navigator>
//   )
// }

// export default function App() {
//   const [session, setSession] = useState(null)
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     const getSession = async () => {
//       const { data, error } = await supabase.auth.getSession()
//       setSession(data.session)
//       setLoading(false)
//     }
//     getSession()

//     const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
//       setSession(newSession)
//     })

//     return () => {
//       listener.subscription.unsubscribe()
//     }
//   }, [])

//   if (loading) {
//     return (
//       <View
//         style={{
//           flex: 1,
//           justifyContent: "center",
//           alignItems: "center",
//           backgroundColor: "#0E2148",
//         }}
//       >
//         <LinearGradient
//           colors={["#0E2148", "#483AA0"]}
//           style={{
//             position: "absolute",
//             left: 0,
//             right: 0,
//             top: 0,
//             bottom: 0,
//           }}
//         />
//         <ActivityIndicator size="large" color="#7965C1" />
//       </View>
//     )
//   }

//   return (
//     <ThemeProvider>
//       <NavigationContainer>
//         {session ? (
//           <Stack.Navigator screenOptions={{ headerShown: false }}>
//             <Stack.Screen name="Main" component={LoggedInTabs} />
//             <Stack.Screen name="SellGiftcardForm" component={SellGiftcardForm} />
//             <Stack.Screen name="SellGiftcardVariants" component={SellGiftcardVariants} />
//             <Stack.Screen name="BuyGiftcardForm" component={BuyGiftcardForm} />
//             <Stack.Screen name="BuyGiftcardVariants" component={BuyGiftcardVariants} />
//             <Stack.Screen name="ChangePassword" component={ChangePassword} />
//             <Stack.Screen name="TransactionPin" component={TransactionPin} />
//             <Stack.Screen name="Withdraw" component={Withdraw} />
//             <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
//             <Stack.Screen name="HottestRatesScreen" component={HottestRatesScreen} />
//             <Stack.Screen name="FAQ" component={FAQ} />
//             <Stack.Screen name="SupportCenter" component={SupportCenter} />
//             <Stack.Screen name="RateCalculator" component={RateCalculator} />
//             <Stack.Screen name="BankDetails" component={BankDetails} />
//             <Stack.Screen name="Wallet" component={Wallet} />
//             <Stack.Screen name="FundWallet" component={FundWallet} />
//             <Stack.Screen name="TransactionDetails" component={TransactionDetails} />
//             <Stack.Screen name="SellGiftcard" component={SellGiftcard} />
//             <Stack.Screen name="BuyGiftcard" component={BuyGiftcard} />
//           </Stack.Navigator>
//         ) : (
//           <AuthStack />
//         )}
//         <StatusBar style="light" backgroundColor="#0E2148" />
//       </NavigationContainer>
//     </ThemeProvider>
//   )
// }








"use client"

import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { useEffect, useState } from "react"
import { ActivityIndicator, View, Platform } from "react-native"
import { MaterialIcons, Ionicons } from "@expo/vector-icons"
import { supabase } from "./screens/supabaseClient"
import { GestureHandlerRootView } from "react-native-gesture-handler"

// Import screens
import Homepage from "./screens/Homepage"
import Register from "./screens/Register"
import Login from "./screens/Login"
import Dashboard from "./screens/Dashboard"
import Transactions from "./screens/Transactions"
import SellGiftcard from "./screens/SellGiftcard"
import Profile from "./screens/Profile"
import SellGiftcardForm from "./screens/SellGiftcardForm"
import ChangePassword from "./screens/ChangePassword"
import TransactionPin from "./screens/TransactionPin"
import Withdraw from "./screens/Withdraw"
import NotificationsScreen from "./screens/NotificationsScreen"
import HottestRatesScreen from "./screens/HottestRatesScreen"
import FAQ from "./screens/FAQ"
import SupportCenter from "./screens/SupportCenter"
import RateCalculator from "./screens/RateCalculator"
import BankDetails from "./screens/BankDetails"
import BuyGiftcard from "./screens/BuyGiftcard"
import BuyGiftcardForm from "./screens/BuyGiftcardForm"
import Wallet from "./screens/Wallet"
import FundWallet from "./screens/FundWallet"
import TransactionDetails from "./screens/TransactionDetails"
import SellGiftcardVariants from "./screens/SellGiftcardVariants"
import BuyGiftcardVariants from "./screens/BuyGiftcardVariants"
import { ThemeProvider, useTheme } from "./screens/ThemeContext" // Import useTheme

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// Custom Tab Bar Background Component
function TabBarBackground() {
  const { theme } = useTheme() // Use theme context
  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        height: "100%",
        backgroundColor: theme.tabBar, // Use solid color from theme
      }}
    />
  )
}

function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="Homepage" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Homepage" component={Homepage} />
      <Stack.Screen name="Register" component={Register} />
      <Stack.Screen name="Login" component={Login} />
    </Stack.Navigator>
  )
}

function LoggedInTabs() {
  const { theme } = useTheme() // Use theme context

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, size }) => {
          let iconName
          let IconComponent = MaterialIcons
          if (route.name === "Dashboard") {
            iconName = "dashboard"
          } else if (route.name === "Transactions") {
            iconName = "receipt-long"
          } else if (route.name === "Rates") {
            iconName = "trending-up"
          } else if (route.name === "Support") {
            iconName = "support-agent"
          } else if (route.name === "Profile") {
            IconComponent = Ionicons
            iconName = "person-outline"
          }
          const iconColor = focused ? theme.tabBarActive : theme.tabBarInactive // Use theme colors
          return (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: focused ? theme.surfaceSecondary : "transparent", // Use theme color
                marginTop: focused ? -5 : 0,
              }}
            >
              <IconComponent name={iconName} size={focused ? size + 2 : size} color={iconColor} />
              {focused && (
                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: theme.tabBarActive, // Use theme color
                    marginTop: 2,
                  }}
                />
              )}
            </View>
          )
        },
        tabBarActiveTintColor: theme.tabBarActive, // Use theme color
        tabBarInactiveTintColor: theme.tabBarInactive, // Use theme color
        tabBarBackground: () => <TabBarBackground />,
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: Platform.OS === "ios" ? 85 : 70,
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: "transparent",
          backgroundColor: "transparent",
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 25 : 8,
          paddingHorizontal: 16,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: -2,
          textAlign: "center",
        },
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{
          tabBarLabel: "Home",
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={Transactions}
        options={{
          tabBarLabel: "History",
        }}
      />
      <Tab.Screen
        name="Rates"
        component={HottestRatesScreen}
        options={{
          tabBarLabel: "Rates",
        }}
      />
      <Tab.Screen
        name="Support"
        component={SupportCenter}
        options={{
          tabBarLabel: "Support",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarLabel: "Profile",
        }}
      />
    </Tab.Navigator>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  // Removed `const { theme } = useTheme()` from here

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      setSession(data.session)
      setLoading(false)
    }
    getSession()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0A1F44", // Hardcoded darkTheme.primary for initial loading
        }}
      >
        <ActivityIndicator size="large" color="#3D7DFF" /> {/* Hardcoded darkTheme.accent */}
      </View>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <NavigationContainer>
          {session ? (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Main" component={LoggedInTabs} />
              <Stack.Screen name="SellGiftcardForm" component={SellGiftcardForm} />
              <Stack.Screen name="SellGiftcardVariants" component={SellGiftcardVariants} />
              <Stack.Screen name="BuyGiftcardForm" component={BuyGiftcardForm} />
              <Stack.Screen name="BuyGiftcardVariants" component={BuyGiftcardVariants} />
              <Stack.Screen name="ChangePassword" component={ChangePassword} />
              <Stack.Screen name="TransactionPin" component={TransactionPin} />
              <Stack.Screen name="Withdraw" component={Withdraw} />
              <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
              <Stack.Screen name="HottestRatesScreen" component={HottestRatesScreen} />
              <Stack.Screen name="FAQ" component={FAQ} />
              <Stack.Screen name="SupportCenter" component={SupportCenter} />
              <Stack.Screen name="RateCalculator" component={RateCalculator} />
              <Stack.Screen name="BankDetails" component={BankDetails} />
              <Stack.Screen name="Wallet" component={Wallet} />
              <Stack.Screen name="FundWallet" component={FundWallet} />
              <Stack.Screen name="TransactionDetails" component={TransactionDetails} />
              <Stack.Screen name="SellGiftcard" component={SellGiftcard} />
              <Stack.Screen name="BuyGiftcard" component={BuyGiftcard} />
            </Stack.Navigator>
          ) : (
            <AuthStack />
          )}
          {/* Removed global StatusBar here, as individual screens handle it */}
        </NavigationContainer>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}
