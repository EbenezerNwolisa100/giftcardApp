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

const HEADER_HEIGHT_FAILURE = Platform.OS === 'android' ? StatusBar.currentHeight + 80 : 100

export default function TransactionFailure() {
  const { theme, isDarkTheme } = useTheme()
  const navigation = useNavigation()
  const route = useRoute()
  const { 
    transactionType, 
    errorMessage, 
    errorCode, 
    brand, 
    variant, 
    quantity, 
    totalAmount,
    onRetry 
  } = route.params || {}
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
  }, [])

  const getTransactionIcon = () => {
    return transactionType === 'buy' ? 'close-circle' : 'alert-circle'
  }

  const getTransactionTitle = () => {
    return transactionType === 'buy' ? 'Purchase Failed' : 'Sale Submission Failed'
  }

  const getTransactionSubtitle = () => {
    return transactionType === 'buy' 
      ? 'We couldn\'t complete your purchase. Please try again.'
      : 'We couldn\'t submit your sale request. Please try again.'
  }

  const getErrorSuggestions = () => {
    const commonSuggestions = [
      'Check your internet connection',
      'Ensure you have sufficient balance (for purchases)',
      'Verify all information is correct'
    ]

    if (transactionType === 'buy') {
      return [
        ...commonSuggestions,
        'Make sure you have enough funds in your wallet',
        'Check if the gift cards are still available'
      ]
    } else {
      return [
        ...commonSuggestions,
        'Ensure your gift card code is valid',
        'Check if the card hasn\'t been used already'
      ]
    }
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      // Navigate back to the form
      navigation.goBack()
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
    failureIconContainer: {
      alignItems: 'center',
      marginBottom: 32,
      marginTop: 20,
    },
    failureIcon: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.error + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      borderWidth: 4,
      borderColor: theme.error,
    },
    failureTitle: {
      color: theme.text,
      fontSize: 28,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
    },
    failureSubtitle: {
      color: theme.textSecondary,
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: 20,
    },
    errorCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.error,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    errorTitle: {
      color: theme.error,
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
    },
    errorMessage: {
      color: theme.text,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 12,
    },
    errorCode: {
      color: theme.textMuted,
      fontSize: 12,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
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
    suggestionsContainer: {
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
    suggestionsTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
    },
    suggestionItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    suggestionIcon: {
      marginRight: 12,
      marginTop: 2,
    },
    suggestionText: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
      flex: 1,
    },
    actionButtons: {
      marginBottom: 24,
    },
    retryButton: {
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
    retryButtonText: {
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
      marginBottom: 12,
    },
    secondaryButtonText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '600',
    },
    supportButton: {
      backgroundColor: theme.warning + '20',
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 32,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.warning,
    },
    supportButtonText: {
      color: theme.warning,
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
        {/* Failure Icon and Title */}
        <View style={styles.failureIconContainer}>
          <View style={styles.failureIcon}>
            <Ionicons name={getTransactionIcon()} size={60} color={theme.error} />
          </View>
          <Text style={styles.failureTitle}>{getTransactionTitle()}</Text>
          <Text style={styles.failureSubtitle}>{getTransactionSubtitle()}</Text>
        </View>

        {/* Error Details */}
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Error Details</Text>
          {errorMessage && (
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          )}
          {errorCode && (
            <Text style={styles.errorCode}>Error Code: {errorCode}</Text>
          )}
        </View>

        {/* Transaction Details (if available) */}
        {(brand || variant || quantity || totalAmount) && (
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
          </View>
        )}

        {/* Suggestions */}
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>What to try:</Text>
          {getErrorSuggestions().map((suggestion, index) => (
            <View key={index} style={styles.suggestionItem}>
              <Ionicons 
                name="checkmark-circle" 
                size={16} 
                color={theme.success} 
                style={styles.suggestionIcon}
              />
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Main', { screen: 'Dashboard' })}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supportButton}
            onPress={() => navigation.navigate('Main', { screen: 'Support' })}
            activeOpacity={0.8}
          >
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}