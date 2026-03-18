import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StatusBar,
  Modal,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { foodAPI, orderAPI, favoriteAPI, addressAPI } from "@/services/api";

const { width } = Dimensions.get("window");

// Icon mapping cho categories
const CATEGORY_ICONS: Record<string, { icon: string; color: string }> = {
  Cơm: { icon: "restaurant-outline", color: "#FF6B35" },
  "Phở & Bún": { icon: "water-outline", color: "#845EC2" },
  Pizza: { icon: "pizza-outline", color: "#e84118" },
  Burger: { icon: "fast-food-outline", color: "#FFB800" },
  "Đồ uống": { icon: "cafe-outline", color: "#4B7BE5" },
  "Tráng miệng": { icon: "ice-cream-outline", color: "#FF4B8C" },
};
const DEFAULT_ICON = { icon: "grid-outline", color: "#00C9A7" };

type FoodItem = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category?: string;
};

type CartItem = {
  food: FoodItem;
  quantity: number;
};

export default function IndexScreen() {
  const { isAuthenticated, isLoading, user, isAdmin } = useAuth();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<
    { name: string; count: number }[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [isFoodsLoading, setIsFoodsLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [orderAddress, setOrderAddress] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [addresses, setAddresses] = useState<
    { _id: string; fullAddress: string; label?: string; isDefault?: boolean }[]
  >([]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/auth/login");
      } else if (isAdmin) {
        router.replace("/(admin)" as any);
      } else {
        loadFoods();
        loadCategories();
        loadFavorites();
      }
    }
  }, [isAuthenticated, isLoading]);

  const loadCategories = async () => {
    try {
      const response = await foodAPI.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadFoods = async (category?: string) => {
    try {
      setIsFoodsLoading(true);
      const response = await foodAPI.getFoods(category || undefined);
      if (response.success) {
        setFoods(response.data);
      }
    } catch (error) {
      console.error("Error loading foods:", error);
    } finally {
      setIsFoodsLoading(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    // Khi người dùng bắt đầu tìm kiếm, luôn tải lại tất cả món (không lọc theo category)
    if (text.trim().length > 0 && selectedCategory !== null) {
      setSelectedCategory(null);
      loadFoods(undefined);
    }
  };

  const loadFavorites = async () => {
    try {
      const response = await favoriteAPI.getFavorites();
      if (response.success && Array.isArray(response.data)) {
        const ids = response.data.map((f: any) => f._id);
        setFavoriteIds(ids);
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  const loadAddresses = useCallback(async () => {
    try {
      const response = await addressAPI.getAddresses();
      if (response.success && Array.isArray(response.data)) {
        setAddresses(response.data);
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) loadAddresses();
  }, [isAuthenticated, isAdmin, loadAddresses]);

  const handleCategoryPress = (categoryName: string | null) => {
    setSelectedCategory(categoryName);
    loadFoods(categoryName || undefined);
  };

  const ITEMS_PER_CATEGORY = 5;

  const toggleExpandCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

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

  const handleRemoveFromCart = (foodId: string) => {
    setCart((prev) => prev.filter((item) => item.food._id !== foodId));
  };

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const totalPrice = useMemo(
    () => cart.reduce((sum, item) => sum + item.food.price * item.quantity, 0),
    [cart],
  );

  const normalizeText = (value: string) =>
    value
      ?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) return foods;
    const q = normalizeText(searchQuery.trim());
    return foods.filter((item) => {
      const name = normalizeText(item.name || "");
      const desc = normalizeText(item.description || "");
      const category = normalizeText(item.category || "");
      return name.includes(q) || desc.includes(q) || category.includes(q);
    });
  }, [foods, searchQuery]);

  // Group foods by category
  const groupedFoods = useMemo(() => {
    const source = searchQuery.trim() ? filteredFoods : foods;
    const groups: Record<string, FoodItem[]> = {};
    source.forEach((item) => {
      const cat = item.category || "Khác";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [foods, filteredFoods, searchQuery]);

  const isFavorite = (foodId: string) => favoriteIds.includes(foodId);

  const toggleFavorite = async (food: FoodItem) => {
    try {
      const exists = isFavorite(food._id);
      if (exists) {
        await favoriteAPI.removeFavorite(food._id);
        setFavoriteIds((prev) => prev.filter((id) => id !== food._id));
      } else {
        await favoriteAPI.addFavorite(food._id);
        setFavoriteIds((prev) => [...prev, food._id]);
      }
    } catch (error) {
      console.error("Toggle favorite error:", error);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });
  };

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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={["#1A1A2E", "#16213E"]}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#1A1A2E", "#16213E", "#1A1A2E"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Xin chào, 👋</Text>
              <Text style={styles.userName}>{user?.name || "Bạn"}</Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Ionicons
              name="search-outline"
              size={20}
              color="rgba(255,255,255,0.5)"
            />
            <TextInput
              placeholder="Tìm kiếm món ăn (pizza, burger, sushi...)"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={handleSearchChange}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color="rgba(255,255,255,0.5)"
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Actions - moved up for easier access */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push("/orders/history")}
              >
                <LinearGradient
                  colors={["#667EEA", "#764BA2"]}
                  style={styles.actionIconBg}
                >
                  <Ionicons name="time-outline" size={24} color="#FFF" />
                </LinearGradient>
                <Text style={styles.actionText}>Lịch sử</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push("/favorites")}
              >
                <LinearGradient
                  colors={["#00C9A7", "#00B894"]}
                  style={styles.actionIconBg}
                >
                  <Ionicons name="heart-outline" size={24} color="#FFF" />
                </LinearGradient>
                <Text style={styles.actionText}>Yêu thích</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push("/addresses")}
              >
                <LinearGradient
                  colors={["#FF6B35", "#FF8E53"]}
                  style={styles.actionIconBg}
                >
                  <Ionicons name="location-outline" size={24} color="#FFF" />
                </LinearGradient>
                <Text style={styles.actionText}>Địa chỉ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <LinearGradient
                  colors={["#4B7BE5", "#6C63FF"]}
                  style={styles.actionIconBg}
                >
                  <Ionicons name="gift-outline" size={24} color="#FFF" />
                </LinearGradient>
                <Text style={styles.actionText}>Ưu đãi</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Categories */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Danh mục</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {/* Nút Tất cả */}
            <TouchableOpacity
              style={[
                styles.categoryCard,
                selectedCategory === null && styles.categoryCardActive,
              ]}
              onPress={() => handleCategoryPress(null)}
            >
              <View
                style={[
                  styles.categoryIcon,
                  {
                    backgroundColor:
                      selectedCategory === null
                        ? "#FF6B3530"
                        : "rgba(255,255,255,0.1)",
                  },
                ]}
              >
                <Ionicons
                  name="grid-outline"
                  size={28}
                  color={selectedCategory === null ? "#FF6B35" : "#888"}
                />
              </View>
              <Text
                style={[
                  styles.categoryName,
                  selectedCategory === null && styles.categoryNameActive,
                ]}
              >
                Tất cả
              </Text>
            </TouchableOpacity>

            {categories.map((cat) => {
              const iconData = CATEGORY_ICONS[cat.name] || DEFAULT_ICON;
              const isActive = selectedCategory === cat.name;
              return (
                <TouchableOpacity
                  key={cat.name}
                  style={[
                    styles.categoryCard,
                    isActive && styles.categoryCardActive,
                  ]}
                  onPress={() => handleCategoryPress(cat.name)}
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      {
                        backgroundColor: isActive
                          ? `${iconData.color}30`
                          : "rgba(255,255,255,0.1)",
                      },
                    ]}
                  >
                    <Ionicons
                      name={iconData.icon as any}
                      size={28}
                      color={isActive ? iconData.color : "#888"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryName,
                      isActive && styles.categoryNameActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                  <Text style={styles.categoryCount}>{cat.count}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Food List - grouped by category */}
          {isFoodsLoading ? (
            <View style={styles.foodLoadingContainer}>
              <ActivityIndicator size="small" color="#FF6B35" />
              <Text style={styles.foodLoadingText}>Đang tải món ăn...</Text>
            </View>
          ) : foods.length === 0 ? (
            <Text style={styles.emptyFoodText}>Chưa có món ăn nào.</Text>
          ) : (
            Object.entries(groupedFoods).map(([categoryName, items]) => {
              const iconData = CATEGORY_ICONS[categoryName] || DEFAULT_ICON;
              const isExpanded = expandedCategories.has(categoryName);
              const displayItems = isExpanded
                ? items
                : items.slice(0, ITEMS_PER_CATEGORY);
              const hasMore = items.length > ITEMS_PER_CATEGORY;

              return (
                <View key={categoryName} style={styles.categorySection}>
                  {/* Category header */}
                  <View style={styles.categorySectionHeader}>
                    <View style={styles.categorySectionLeft}>
                      <View
                        style={[
                          styles.categorySectionIcon,
                          { backgroundColor: `${iconData.color}25` },
                        ]}
                      >
                        <Ionicons
                          name={iconData.icon as any}
                          size={20}
                          color={iconData.color}
                        />
                      </View>
                      <Text style={styles.categorySectionTitle}>
                        {categoryName}
                      </Text>
                      <View
                        style={[
                          styles.categorySectionBadge,
                          { backgroundColor: `${iconData.color}25` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.categorySectionBadgeText,
                            { color: iconData.color },
                          ]}
                        >
                          {items.length}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Food items */}
                  {displayItems.map((item) => (
                    <View key={item._id} style={styles.featuredCard}>
                      <View style={styles.featuredImageContainer}>
                        <Text style={styles.featuredEmoji}>
                          {item.image || "🍽️"}
                        </Text>
                      </View>
                      <View style={styles.featuredInfo}>
                        <Text style={styles.featuredName}>{item.name}</Text>
                        {item.description ? (
                          <Text
                            style={styles.featuredDescription}
                            numberOfLines={2}
                          >
                            {item.description}
                          </Text>
                        ) : null}
                        <View style={styles.featuredMeta}>
                          <Text style={styles.featuredPrice}>
                            {formatCurrency(item.price)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.actionsRight}>
                        <TouchableOpacity
                          style={[
                            styles.favoriteBtn,
                            isFavorite(item._id) && styles.favoriteBtnActive,
                          ]}
                          onPress={() => toggleFavorite(item)}
                        >
                          <Ionicons
                            name={
                              isFavorite(item._id) ? "heart" : "heart-outline"
                            }
                            size={18}
                            color={isFavorite(item._id) ? "#FF4B8C" : "#FFF"}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.addBtn}
                          onPress={() => handleAddToCart(item)}
                        >
                          <Ionicons name="add" size={20} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  {/* Show more / less button */}
                  {hasMore && (
                    <TouchableOpacity
                      style={styles.showMoreBtn}
                      onPress={() => toggleExpandCategory(categoryName)}
                    >
                      <Text style={styles.showMoreText}>
                        {isExpanded
                          ? "Thu gọn"
                          : `Xem thêm ${items.length - ITEMS_PER_CATEGORY} món`}
                      </Text>
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={16}
                        color="#FF6B35"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}

          <View style={{ height: 140 }} />
        </View>
      </ScrollView>

      {/* Cart Summary */}
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

      {/* Order Address Modal */}
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
    backgroundColor: "#1A1A2E",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFF",
  },
  notificationBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF6B35",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    marginHorizontal: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,107,53,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  promoBanner: {
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFF",
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 12,
  },
  promoBtn: {
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    alignSelf: "flex-start",
  },
  promoBtnText: {
    color: "#FF6B35",
    fontWeight: "700",
    fontSize: 14,
  },
  promoEmoji: {
    fontSize: 48,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
  },
  seeAll: {
    fontSize: 14,
    color: "#FF6B35",
    fontWeight: "600",
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  categoryCard: {
    alignItems: "center",
    marginHorizontal: 8,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
  },
  categoryCardActive: {
    transform: [{ scale: 1.05 }],
  },
  categoryNameActive: {
    color: "#FFF",
    fontWeight: "700",
  },
  categoryCount: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    marginTop: 2,
  },
  categorySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  categorySectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categorySectionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  categorySectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  categorySectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },
  categorySectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categorySectionBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  showMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255, 107, 53, 0.1)",
    gap: 6,
  },
  showMoreText: {
    fontSize: 14,
    color: "#FF6B35",
    fontWeight: "600",
  },
  featuredContainer: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  featuredCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  featuredImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  featuredEmoji: {
    fontSize: 36,
  },
  featuredInfo: {
    flex: 1,
    marginLeft: 16,
  },
  featuredName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 8,
  },
  featuredDescription: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 4,
  },
  featuredMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginLeft: 4,
  },
  featuredPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FF6B35",
  },
  actionsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  favoriteBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  favoriteBtnActive: {
    borderColor: "#FF4B8C",
    backgroundColor: "rgba(255,75,140,0.15)",
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  foodLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  foodLoadingText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  emptyFoodText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
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
  quickActions: {
    paddingHorizontal: 24,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
  },
  actionCard: {
    width: (width - 64) / 4,
    alignItems: "center",
    marginBottom: 16,
  },
  actionIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
    textAlign: "center",
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
