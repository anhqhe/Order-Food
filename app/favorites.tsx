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
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { favoriteAPI, orderAPI, addressAPI } from "@/services/api";
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
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [orderAddress, setOrderAddress] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [addresses, setAddresses] = useState<
    { _id: string; fullAddress: string; label?: string; isDefault?: boolean }[]
  >([]);

  const loadAddresses = useCallback(async () => {
    try {
      const response = await addressAPI.getAddresses();
      if (response.success && Array.isArray(response.data)) {
        setAddresses(response.data);
      }
    } catch (error) {
      console.error("Load addresses error:", error);
    }
  }, []);

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
    loadAddresses();
  }, [loadFavorites, loadAddresses]);

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

  const openOrderModal = async () => {
    setOrderModalVisible(true);
    try {
      const res = await addressAPI.getAddresses();
      if (res.success && Array.isArray(res.data)) {
        setAddresses(res.data);
        const defaultAddr =
          res.data.find((a: any) => a.isDefault) || res.data[0];
        setOrderAddress(defaultAddr?.fullAddress || "");
      }
    } catch (e) {
      console.error("Load addresses error:", e);
    }
    setOrderNote("");
  };

  const handlePlaceOrder = async () => {
    const addr = orderAddress.trim();
    if (!addr) {
      Alert.alert("Lỗi", "Vui lòng nhập địa chỉ giao hàng");
      return;
    }
    if (!cart.length || isOrdering) return;

    try {
      setIsOrdering(true);
      const payload = {
        items: cart.map((item) => ({
          foodId: item.food._id,
          quantity: item.quantity,
        })),
        address: addr,
        note: orderNote.trim() || undefined,
      };

      const response = await orderAPI.createOrder(payload);
      if (response.success) {
        setCart([]);
        setOrderModalVisible(false);
        router.push("/orders/history");
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error.response?.data?.message || "Không thể đặt hàng");
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
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B35"
          />
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
              style={styles.cartButton}
              onPress={openOrderModal}
            >
              <Ionicons name="bag-check-outline" size={18} color="#FFF" />
              <Text style={styles.cartButtonText}>Đặt hàng</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      <Modal
        visible={orderModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOrderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            style={styles.orderModalScroll}
            contentContainerStyle={styles.orderModalContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.orderModalHeader}>
              <Text style={styles.orderModalTitle}>Địa chỉ giao hàng</Text>
              <TouchableOpacity onPress={() => setOrderModalVisible(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <View style={styles.savedAddresses}>
              <Text style={styles.savedLabel}>Chọn địa chỉ đã lưu</Text>
              {addresses.length > 0 ? (
                addresses.map((addr) => (
                  <TouchableOpacity
                    key={addr._id}
                    style={[
                      styles.addressChip,
                      orderAddress === addr.fullAddress &&
                        styles.addressChipActive,
                    ]}
                    onPress={() => setOrderAddress(addr.fullAddress)}
                  >
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={
                        orderAddress === addr.fullAddress ? "#FF6B35" : "#888"
                      }
                    />
                    <Text
                      style={[
                        styles.addressChipText,
                        orderAddress === addr.fullAddress &&
                          styles.addressChipTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {addr.label || addr.fullAddress}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noAddressHint}>
                  Chưa có địa chỉ. Vào mục Địa chỉ giao hàng để thêm, hoặc nhập
                  bên dưới.
                </Text>
              )}
            </View>

            <Text style={styles.inputLabel}>Địa chỉ giao hàng *</Text>
            <TextInput
              style={[styles.modalInput, styles.modalInputMultiline]}
              placeholder="Số nhà, đường, phường, quận..."
              placeholderTextColor="#666"
              value={orderAddress}
              onChangeText={setOrderAddress}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Ghi chú (tùy chọn)</Text>
            <TextInput
              style={[styles.modalInput, styles.modalInputMultiline]}
              placeholder="Ghi chú cho đơn hàng..."
              placeholderTextColor="#666"
              value={orderNote}
              onChangeText={setOrderNote}
              multiline
            />

            <TouchableOpacity
              style={[
                styles.confirmOrderBtn,
                isOrdering && styles.confirmOrderBtnDisabled,
              ]}
              onPress={handlePlaceOrder}
              disabled={isOrdering}
            >
              {isOrdering ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="bag-check-outline" size={20} color="#FFF" />
                  <Text style={styles.confirmOrderBtnText}>
                    Xác nhận đặt hàng
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  orderModalScroll: {
    maxHeight: "85%",
  },
  orderModalContent: {
    backgroundColor: "#1a1a2e",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  orderModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  orderModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
  },
  savedAddresses: {
    marginBottom: 16,
  },
  savedLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#aaa",
    marginBottom: 10,
  },
  noAddressHint: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 8,
  },
  addressChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#0f0f23",
    borderWidth: 1,
    borderColor: "#2a2a4a",
    marginBottom: 8,
  },
  addressChipActive: {
    borderColor: "#FF6B35",
    backgroundColor: "rgba(255,107,53,0.1)",
  },
  addressChipText: {
    flex: 1,
    fontSize: 14,
    color: "#aaa",
  },
  addressChipTextActive: {
    color: "#FF6B35",
    fontWeight: "600",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#aaa",
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: "#0f0f23",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#FFF",
    borderWidth: 1,
    borderColor: "#2a2a4a",
    marginBottom: 16,
  },
  modalInputMultiline: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  confirmOrderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6B35",
    borderRadius: 16,
    padding: 16,
    gap: 8,
    marginTop: 8,
  },
  confirmOrderBtnDisabled: {
    opacity: 0.7,
  },
  confirmOrderBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
});
