import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Image } from "react-native";
import { supabase } from "./supabaseClient";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function BuyGiftcard() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchCards = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("giftcard_inventory")
        .select("*")
        .eq("sold", false)
        .order("created_at", { ascending: false });
      setCards(data || []);
      setLoading(false);
    };

    // Initial fetch
    fetchCards();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('giftcard_inventory_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'giftcard_inventory' 
        }, 
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            // If a card was marked as sold, remove it from the list
            if (payload.new.sold === true) {
              setCards(prevCards => prevCards.filter(card => card.id !== payload.new.id));
            }
          } else if (payload.eventType === 'INSERT') {
            // If a new card was added and not sold, add it to the list
            if (payload.new.sold === false) {
              setCards(prevCards => [payload.new, ...prevCards]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0E2148", "#483AA0"]} style={styles.headerGradient}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Buy Gift Card</Text>
        </View>
      </LinearGradient>
      <FlatList
        data={cards}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.cardsContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("BuyGiftcardForm", { card: item })}
            activeOpacity={0.8}
          >
            <View style={styles.cardImageContainer}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="contain" />
              ) : (
                <View style={styles.cardImagePlaceholder}>
                  <Text style={styles.cardImagePlaceholderText}>{item.brand_name ? item.brand_name[0] : "?"}</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardBrand}>{item.brand_name}</Text>
              <Text style={styles.cardValue}>${item.value}</Text>
              <Text style={styles.cardCode}>Code: {item.code.slice(0, 4) + "****"}</Text>
              <Text style={styles.cardDate}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}</Text>
            </View>
            <TouchableOpacity style={styles.buyButton} onPress={() => navigation.navigate("BuyGiftcardForm", { card: item })}>
              <Text style={styles.buyButtonText}>Buy</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyStateText}>No gift cards found</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#0E2148" },
  headerGradient: {
    height: 150,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingTop: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    width: "100%",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  cardsContainer: {
    paddingBottom: 20,
  },
  card: {
    marginBottom: 16,
    backgroundColor: "#232e4a",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  cardImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#3b5bfd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#3b5bfd",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  cardImagePlaceholderText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  cardBrand: {
    fontWeight: "bold",
    color: "#fff",
    fontSize: 16,
    marginBottom: 4,
  },
  cardValue: {
    color: "#fff",
    marginBottom: 2,
  },
  cardCode: {
    color: "#fff",
    fontSize: 12,
    marginBottom: 2,
  },
  cardDate: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    marginBottom: 2,
  },
  buyButton: {
    backgroundColor: "#3b5bfd",
    padding: 10,
    borderRadius: 8,
    marginLeft: 8,
    alignSelf: "flex-start",
  },
  buyButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyStateText: {
    color: "rgba(255,255,255,0.5)",
    marginTop: 10,
    fontSize: 16,
  },
}); 