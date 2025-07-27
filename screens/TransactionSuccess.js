import { useState, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  ScrollView,
  RefreshControl,
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "./ThemeContext"

const HEADER_HEIGHT_SUCCESS = Platform.OS === 'android' ? StatusBar.currentHeight + 80 : 100

export default function TransactionSuccess() {
  const { theme, isDarkTheme } = useTheme()
  const navigation = useNavigation()
  const route = useRoute()
  const { transactionType, transactionData, brand, variant, quantity, totalAmount } = route.params || {}
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
  }, [])

  const getTransactionIcon = () => {
    return transactionType === 'buy' ? 'checkmark-circle' : 'arrow-up-circle'
  }

  const getTransactionTitle = () => {
    return transactionType === 'buy' ? 'Purchase Successful!' : 'Sale Submitted!'
  }

  const getTransactionSubtitle = () => {
    return transactionType === 'buy' 
      ? 'Your gift cards have been added to your account'
      : 'Your sale request has been submitted for review'
  }

  const getNextSteps = () => {
    if (transactionType === 'buy') {
      return [
        'Your gift card codes are available in your transaction history',
        'You can copy the codes anytime from the transaction details',
        'Use the codes for your intended purchases'
      ]
    } else {
      return [
        'Your sale request is being reviewed by our team',
        'You will receive a notification once approved',
        'Payment will be processed within 24-48 hours'
      ]
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    fixedHeader: {
      backgroundColor: theme.primary,
      paddingHorizontal: 24,
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
      marginLeft: -40,
    },
    placeholder: {
      width: 40,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingBottom: Platform.OS === "ios" ? 85 + 20 : 70 + 20,
      paddingTop: 20,
    },
    successIconContainer: {
      alignItems: 'center',
      marginBottom: 32,
      marginTop: 20,
    },
    successIcon: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.success + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      borderWidth: 4,
      borderColor: theme.success,
    },
    successTitle: {
      color: theme.text,
      fontSize: 28,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
    },
    successSubtitle: {
      color: theme.textSecondary,
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: 20,
    },
    transactionCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    cardTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
    },
    transactionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    transactionLabel: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    transactionValue: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '600',
    },
    nextStepsContainer: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    nextStepsTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
    },
    stepItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    stepNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      marginTop: 2,
    },
    stepNumberText: {
      color: theme.primary,
      fontSize: 12,
      fontWeight: 'bold',
    },
    stepText: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      flex: 1,
    },
    actionButtons: {
      marginBottom: 24,
    },
    primaryButton: {
      backgroundColor: theme.accent,
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 32,
      alignItems: 'center',
      marginBottom: 12,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    primaryButtonText: {
      color: theme.primary,
      fontSize: 18,
      fontWeight: 'bold',
    },
    secondaryButton: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 32,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    secondaryButtonText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '600',
    },
  })

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
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold' }}></Text>
        <View style={{ width: 32, height: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
            progressBackgroundColor={theme.surface}
          />
        }
      >
        {/* Success Icon and Title */}
        <View style={styles.successIconContainer}>
          <View style={styles.successIcon}>
            <Ionicons name={getTransactionIcon()} size={60} color={theme.surface} />
          </View>
          <Text style={styles.successTitle}>{getTransactionTitle()}</Text>
          <Text style={styles.successSubtitle}>{getTransactionSubtitle()}</Text>
        </View>

        {/* Transaction Details */}
        <View style={styles.transactionCard}>
          <Text style={styles.cardTitle}>Transaction Details</Text>
          {brand && (
            <View style={styles.transactionRow}>
              <Text style={styles.transactionLabel}>Brand:</Text>
              <Text style={styles.transactionValue}>{brand.name}</Text>
            </View>
          )}
          {variant && (
            <View style={styles.transactionRow}>
              <Text style={styles.transactionLabel}>Variant:</Text>
              <Text style={styles.transactionValue}>
                {variant.name} - ${variant.value}
              </Text>
            </View>
          )}
          {quantity && (
            <View style={styles.transactionRow}>
              <Text style={styles.transactionLabel}>Quantity:</Text>
              <Text style={styles.transactionValue}>{quantity}</Text>
            </View>
          )}
          {totalAmount && (
            <View style={styles.transactionRow}>
              <Text style={styles.transactionLabel}>Total Amount:</Text>
              <Text style={styles.transactionValue}>₦{totalAmount.toLocaleString()}</Text>
            </View>
          )}
          {transactionData?.id && (
            <View style={styles.transactionRow}>
              <Text style={styles.transactionLabel}>Transaction ID:</Text>
              <Text style={styles.transactionValue}>{transactionData.id.slice(0, 8)}...</Text>
            </View>
          )}
        </View>

        {/* Next Steps */}
        <View style={styles.nextStepsContainer}>
          <Text style={styles.nextStepsTitle}>What's Next?</Text>
          {getNextSteps().map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {transactionType === 'buy' ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Main', { screen: 'Transactions' })}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>View Transaction</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Main', { screen: 'Transactions' })}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Track Sale</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Main', { screen: 'Dashboard' })}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}