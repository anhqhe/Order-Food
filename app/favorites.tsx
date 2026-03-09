import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { favoriteAPI, orderAPI } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

interface FoodItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category?: string;
}

type CartItem = {
  food: FoodItem;
  quantity: number;
};

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);

  const loadFavorites = useCallback(async () => {
    try {
      const response = await favoriteAPI.getFavorites();
      if (response.success) {
        setFoods(response.data);
      }
    } catch (error) {
      console.error("Load favorites error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFavorites();
  }, [loadFavorites]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);

  const handleAddToCart = (food: FoodItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.food._id === food._id);
      if (existing) {
        return prev.map((item) =>
          item.food._id === food._id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { food, quantity: 1 }];
    });
  };

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const totalPrice = useMemo(
    () => cart.reduce((sum, item) => sum + item.food.price * item.quantity, 0),
    [cart],
  );

  const handlePlaceOrder = async () => {
    if (!cart.length || isOrdering) return;

    try {
      setIsOrdering(true);
      const payload = {
        items: cart.map((item) => ({
          foodId: item.food._id,
          quantity: item.quantity,
        })),
        address: "Địa chỉ giao hàng của " + (user?.name || "khách hàng"),
      };

      const response = await orderAPI.createOrder(payload);
      if (response.success) {
        setCart([]);
      }
    } catch (error) {
      console.error("Create order from favorites error:", error);
    } finally {
      setIsOrdering(false);
    }
  };

  const renderItem = ({ item }: { item: FoodItem }) => (
    <View style={styles.card}>
      <View style={styles.left}>
        <View style={styles.emojiBox}>
          <Text style={styles.emoji}>{item.image || "🍽️"}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          {item.description ? (
            <Text style={styles.desc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          {!!item.category && (
            <Text style={styles.category}>{item.category}</Text>
          )}
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.price}>{formatCurrency(item.price)}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => handleAddToCart(item)}
        >
          <Ionicons name="add" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Đang tải món yêu thích...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Món yêu thích</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.countText}>{foods.length} món ăn</Text>

      <FlatList
        data={foods}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color="#444" />
            <Text style={styles.emptyText}>Bạn chưa lưu món ăn nào</Text>
          </View>
        }
      />

      {totalItems > 0 && (
        <View style={styles.cartBarContainer}>
          <LinearGradient
            colors={["#1A1A2E", "#16213E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cartBar}
          >
            <View style={styles.cartInfo}>
              <Text style={styles.cartTitle}>Giỏ hàng</Text>
              <Text style={styles.cartSubtitle}>
                {totalItems} món • {formatCurrency(totalPrice)}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.cartButton, isOrdering && styles.cartButtonDisabled]}
              onPress={handlePlaceOrder}
              disabled={isOrdering}
            >
              {isOrdering ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="bag-check-outline" size={18} color="#FFF" />
                  <Text style={styles.cartButtonText}>Đặt hàng</Text>
                </>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f23",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f0f23",
  },
  loadingText: {
    color: "#aaa",
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  countText: {
    fontSize: 14,
    color: "#888",
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  emojiBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  emoji: {
    fontSize: 28,
  },
  info: {
    flex: 1,
  },
  right: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 6,
  },
  name: {
    fontSize: 15,
    color: "#FFF",
    fontWeight: "600",
    marginBottom: 2,
  },
  desc: {
    fontSize: 12,
    color: "#aaa",
  },
  category: {
    fontSize: 11,
    color: "#FF6B35",
    marginTop: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FF6B35",
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
    marginTop: 12,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
  },
  cartBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  cartBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  cartInfo: {
    flex: 1,
  },
  cartTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 2,
  },
  cartSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  cartButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF6B35",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 6,
  },
  cartButtonDisabled: {
    opacity: 0.7,
  },
  cartButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
});

