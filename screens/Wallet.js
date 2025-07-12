import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  ScrollView,
  FlatList,
} from "react-native";
import { supabase } from "./supabaseClient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "./ThemeContext";

const { width, height } = Dimensions.get("window");

export default function Wallet() {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const navigation = useNavigation();
  const { theme } = useTheme();

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Fetch user balance
      const { data: profile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", user.id)
        .single();
      
      setBalance(profile?.balance || 0);

      // Fetch wallet transactions
      const { data: walletTxs } = await supabase
        .from("wallet_transactions")
        .select(`
          id, 
          type, 
          amount, 
          status, 
          created_at, 
          description,
          payment_method,
          reference
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setTransactions(walletTxs || []);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
    setLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchWalletData();
    }, [])
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case "fund":
        return <Ionicons name="add-circle" size={24} color="#00b894" />;
      case "purchase":
        return <Ionicons name="card" size={24} color="#e17055" />;
      case "withdrawal":
        return <Ionicons name="remove-circle" size={24} color="#d63031" />;
      case "refund":
        return <Ionicons name="refresh-circle" size={24} color="#0984e3" />;
      default:
        return <Ionicons name="wallet" size={24} color="#fdcb6e" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case "fund":
        return "#00b894";
      case "purchase":
        return "#e17055";
      case "withdrawal":
        return "#d63031";
      case "refund":
        return "#0984e3";
      default:
        return "#fdcb6e";
    }
  };

  const getTransactionTitle = (type) => {
    switch (type) {
      case "fund":
        return "Wallet Funded";
      case "purchase":
        return "Gift Card Purchase";
      case "withdrawal":
        return "Withdrawal";
      case "refund":
        return "Refund";
      default:
        return "Transaction";
    }
  };

  const renderTransaction = ({ item }) => (
    <View style={[styles.transactionItem, { backgroundColor: theme.card }]}>
      <View style={styles.transactionLeft}>
        <View style={[styles.transactionIcon, { backgroundColor: getTransactionColor(item.type) + '20' }]}>
          {getTransactionIcon(item.type)}
        </View>
        <View style={styles.transactionInfo}>
          <Text style={[styles.transactionTitle, { color: theme.text }]}>
            {getTransactionTitle(item.type)}
          </Text>
          <Text style={[styles.transactionDate, { color: theme.textSecondary }]}>
            {formatDate(item.created_at)}
          </Text>
          {item.description && (
            <Text style={[styles.transactionDescription, { color: theme.textSecondary }]}>
              {item.description}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          { color: item.type === "fund" || item.type === "refund" ? "#00b894" : "#e17055" }
        ]}>
          {item.type === "fund" || item.type === "refund" ? "+" : "-"}₦{item.amount?.toLocaleString()}
        </Text>
        <Text style={[
          styles.transactionStatus,
          { color: item.status === "completed" ? "#00b894" : item.status === "pending" ? "#fdcb6e" : "#d63031" }
        ]}>
          {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Loading wallet...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
      
      {/* Header */}
      <LinearGradient colors={[theme.primary, theme.secondary]} style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Wallet</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <LinearGradient colors={[theme.accent, theme.secondary]} style={styles.balanceGradient}>
            <View style={styles.balanceHeader}>
              <Ionicons name="wallet" size={24} color="#E3D095" />
              <Text style={styles.balanceLabel}>Available Balance</Text>
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmount}>
                {balanceVisible ? `₦${balance.toLocaleString()}` : "₦****"}
              </Text>
              <TouchableOpacity
                onPress={() => setBalanceVisible(!balanceVisible)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={balanceVisible ? "eye-off" : "eye"}
                  size={20}
                  color="#E3D095"
                />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.card }]}
            onPress={() => navigation.navigate("FundWallet")}
          >
            <LinearGradient colors={["#00b894", "#00a085"]} style={styles.actionGradient}>
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.actionText}>Fund Wallet</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.card }]}
            onPress={() => navigation.navigate("Withdraw")}
          >
            <LinearGradient colors={["#0984e3", "#0769b3"]} style={styles.actionGradient}>
              <Ionicons name="remove-circle" size={24} color="#fff" />
              <Text style={styles.actionText}>Withdraw</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Transaction History */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Transaction History
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("WalletTransactions")}>
            <Text style={[styles.seeAll, { color: theme.accent }]}>See All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={transactions.slice(0, 5)}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTransaction}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                No transactions yet
              </Text>
            </View>
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  headerGradient: {
    height: 120,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingTop: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
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
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  balanceCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 20,
    marginBottom: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  balanceGradient: {
    padding: 24,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  balanceLabel: {
    color: "#E3D095",
    fontSize: 16,
    marginLeft: 8,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceAmount: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  eyeButton: {
    padding: 4,
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  actionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "bold",
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 12,
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
  },
}); 