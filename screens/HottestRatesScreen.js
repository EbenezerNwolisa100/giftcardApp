"use client"

import { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  RefreshControl,
} from "react-native"
import { supabase } from "./supabaseClient"
import { useNavigation } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons, FontAwesome } from "@expo/vector-icons"

const { width } = Dimensions.get("window")

export default function HottestRatesScreen() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('sell') // 'sell' or 'buy'
  const [inventory, setInventory] = useState([])
  const navigation = useNavigation()

  const fetchData = async () => {
    try {
      if (activeTab === 'sell') {
        // Fetch giftcard_brands for sell rates
        const { data, error } = await supabase
          .from("giftcard_brands")
          .select("*")
          .order("sell_rate", { ascending: false })
        if (error) throw error
        setBrands(data || [])
      } else {
        // Fetch giftcard_inventory for buy rates
        const { data, error } = await supabase
          .from("giftcard_inventory")
          .select("*")
          .eq("sold", false)
          .order("value", { ascending: false })
        if (error) throw error
        setInventory(data || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    }
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    setLoading(true)
    fetchData()
  }, [activeTab])

  const onRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const renderHeader = () => (
    <>
      <LinearGradient colors={["#0E2148", "#483AA0"]} style={styles.headerGradient}>
        <StatusBar barStyle="light-content" backgroundColor="#0E2148" />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hottest Rates</Text>
          <View style={{ width: 32 }} /> {/* Placeholder for right side to keep title centered */}
        </View>

        <Text style={styles.headerSubtitle}>Live gift card exchange rates - updated in real time</Text>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <FontAwesome name="line-chart" size={20} color="#E3D095" />
            <Text style={styles.statNumber}>
              {activeTab === 'sell' ? brands.length : inventory.length}
            </Text>
            <Text style={styles.statLabel}>
              {activeTab === 'sell' ? 'Sell Brands' : 'Available Cards'}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={20} color="#E3D095" />
            <Text style={styles.statNumber}>
              {activeTab === 'sell' 
                ? (brands.length > 0 ? `₦${Math.max(...brands.map((b) => b.sell_rate || 0))}` : "₦0")
                : (inventory.length > 0 ? `₦${Math.max(...inventory.map((i) => i.value || 0))}` : "₦0")
              }
            </Text>
            <Text style={styles.statLabel}>
              {activeTab === 'sell' ? 'Highest Sell Rate' : 'Highest Card Value'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sell' && styles.activeTab]}
          onPress={() => setActiveTab('sell')}
        >
          <Ionicons 
            name="trending-down" 
            size={16} 
            color={activeTab === 'sell' ? '#fff' : 'rgba(255,255,255,0.8)'} 
          />
          <Text style={[styles.tabText, activeTab === 'sell' && styles.activeTabText]}>Sell Cards</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'buy' && styles.activeTab]}
          onPress={() => setActiveTab('buy')}
        >
          <Ionicons 
            name="trending-up" 
            size={16} 
            color={activeTab === 'buy' ? '#fff' : 'rgba(255,255,255,0.8)'} 
          />
          <Text style={[styles.tabText, activeTab === 'buy' && styles.activeTabText]}>Buy Cards</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Current Exchange Rates</Text>
        <View style={styles.sortIndicator}>
          <Ionicons name="arrow-down" size={16} color="#7965C1" />
          <Text style={styles.sortText}>Highest First</Text>
        </View>
      </View>
    </>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0E2148" />
        <ActivityIndicator size="large" color="#7965C1" />
        <Text style={styles.loadingText}>Loading exchange rates...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={activeTab === 'sell' ? brands : inventory}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.brandCard}>
            {/* <View style={styles.rankContainer}>
              <Text style={styles.rankNumber}>#{index + 1}</Text>
              {index < 3 && (
                <View
                  style={[
                    styles.rankBadge,
                    { backgroundColor: index === 0 ? "#ffd700" : index === 1 ? "#c0c0c0" : "#cd7f32" },
                  ]}
                >
                  <Ionicons name="trophy" size={12} color="#fff" />
                </View>
              )}
            </View> */}

            <View style={styles.brandInfo}>
              <View style={styles.brandImageContainer}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={styles.brandImage} resizeMode="contain" />
                ) : (
                  <View style={styles.brandImagePlaceholder}>
                    <Text style={styles.brandImagePlaceholderText}>
                      {activeTab === 'sell' ? item.name[0] : item.brand_name[0]}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.brandDetails}>
                <Text style={styles.brandName}>
                  {activeTab === 'sell' ? item.name : item.brand_name}
                </Text>
                <View style={styles.rateContainer}>
                  <Text style={styles.rateLabel}>
                    {activeTab === 'sell' ? 'Sell Rate:' : 'Card Value:'}
                  </Text>
                  <Text style={styles.rateValue}>
                    ₦{(activeTab === 'sell' ? item.sell_rate : item.value)?.toLocaleString() || "0"}
                  </Text>
                </View>
                {activeTab === 'buy' && (
                  <Text style={styles.cardCode}>
                    Code: {item.code?.slice(0, 4)}****
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                if (activeTab === 'sell') {
                  navigation.navigate("SellGiftcardForm", { brand: item })
                } else {
                  navigation.navigate("BuyGiftcardForm", { card: item })
                }
              }}
              activeOpacity={0.8}
            >
              <LinearGradient colors={["#7965C1", "#483AA0"]} style={styles.actionButtonGradient}>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <FontAwesome name="line-chart" size={48} color="rgba(255,255,255,0.3)" />
            </View>
            <Text style={styles.emptyStateTitle}>No rates available</Text>
            <Text style={styles.emptyStateSubtext}>Exchange rates will appear here when available</Text>
          </View>
        }
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#7965C1"]}
            tintColor="#7965C1"
            progressBackgroundColor="#0E2148"
          />
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0E2148",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0E2148",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
  },
  headerGradient: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
},
backButton: {
  paddingVertical: 8,
},
headerTitle: {
  color: '#fff',
  fontSize: 20,
  fontWeight: 'bold',
  flex: 1,
  textAlign: 'center',
},
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  statCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    width: (width - 64) / 2,
    borderWidth: 1,
    borderColor: "rgba(227, 208, 149, 0.2)",
  },
  statNumber: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  sortIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortText: {
    color: "#7965C1",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "600",
  },
  listContainer: {
    paddingBottom: 32,
  },
  brandCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  rankContainer: {
    alignItems: "center",
    marginRight: 16,
    position: "relative",
  },
  rankNumber: {
    color: "#E3D095",
    fontSize: 16,
    fontWeight: "bold",
  },
  rankBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  brandInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  brandImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  brandImage: {
    width: 32,
    height: 32,
  },
  brandImagePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#7965C1",
    justifyContent: "center",
    alignItems: "center",
  },
  brandImagePlaceholderText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  brandDetails: {
    flex: 1,
  },
  brandName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  rateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  rateLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginRight: 6,
  },
  rateValue: {
    color: "#E3D095",
    fontSize: 16,
    fontWeight: "bold",
  },
  changeIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  changeText: {
    color: "#4caf50",
    fontSize: 11,
    marginLeft: 4,
    fontWeight: "600",
  },
  sellButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  sellButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sellButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 6,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyStateTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#7965C1',
    borderColor: '#7965C1',
    shadowColor: '#7965C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tabText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardCode: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
})
