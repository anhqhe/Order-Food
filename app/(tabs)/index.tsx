import React, { useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { foodAPI, orderAPI } from '@/services/api';

const { width } = Dimensions.get('window');

// Dummy data for food categories
const categories = [
  { id: 1, name: 'Pizza', icon: 'pizza-outline', color: '#FF6B35' },
  { id: 2, name: 'Burger', icon: 'fast-food-outline', color: '#FFB800' },
  { id: 3, name: 'Sushi', icon: 'fish-outline', color: '#00C9A7' },
  { id: 4, name: 'Noodles', icon: 'restaurant-outline', color: '#845EC2' },
  { id: 5, name: 'Drinks', icon: 'cafe-outline', color: '#4B7BE5' },
];

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
  const { isAuthenticated, isLoading, user } = useAuth();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [isFoodsLoading, setIsFoodsLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOrdering, setIsOrdering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Animations
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/auth/login');
      } else {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
        loadFoods();
      }
    }
  }, [isAuthenticated, isLoading]);

  const loadFoods = async () => {
    try {
      setIsFoodsLoading(true);
      const response = await foodAPI.getFoods();
      if (response.success) {
        setFoods(response.data);
      }
    } catch (error) {
      console.error('Error loading foods:', error);
    } finally {
      setIsFoodsLoading(false);
    }
  };

  const handleAddToCart = (food: FoodItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.food._id === food._id);
      if (existing) {
        return prev.map((item) =>
          item.food._id === food._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
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
    [cart]
  );

  const totalPrice = useMemo(
    () => cart.reduce((sum, item) => sum + item.food.price * item.quantity, 0),
    [cart]
  );

  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) return foods;
    const q = searchQuery.trim().toLowerCase();
    return foods.filter((item) => {
      const name = item.name?.toLowerCase() || '';
      const desc = item.description?.toLowerCase() || '';
      const category = item.category?.toLowerCase() || '';
      return (
        name.includes(q) ||
        desc.includes(q) ||
        category.includes(q)
      );
    });
  }, [foods, searchQuery]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  const handlePlaceOrder = async () => {
    if (!cart.length || isOrdering) return;

    try {
      setIsOrdering(true);
      const payload = {
        items: cart.map((item) => ({
          foodId: item.food._id,
          quantity: item.quantity,
        })),
        // Đơn giản: dùng tên user làm địa chỉ demo
        address: 'Địa chỉ giao hàng của ' + (user?.name || 'khách hàng'),
      };

      const response = await orderAPI.createOrder(payload);

      if (response.success) {
        setCart([]);
        // Có thể điều hướng sang màn hình lịch sử / thông báo sau
        console.log('Order created:', response.data);
      }
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setIsOrdering(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#1A1A2E', '#16213E']}
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
        colors={['#1A1A2E', '#16213E', '#1A1A2E']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Xin chào, 👋</Text>
              <Text style={styles.userName}>{user?.name || 'Bạn'}</Text>
            </View>
            <TouchableOpacity style={styles.notificationBtn}>
              <Ionicons name="notifications-outline" size={24} color="#FFF" />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="rgba(255,255,255,0.5)" />
            <TextInput
              placeholder="Tìm kiếm món ăn (pizza, burger, sushi...)"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            )}
          </View>

          {/* Promo Banner */}
          <LinearGradient
            colors={['#FF6B35', '#FF8E53']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.promoBanner}
          >
            <View style={styles.promoContent}>
              <Text style={styles.promoTitle}>Giảm 30%</Text>
              <Text style={styles.promoSubtitle}>Cho đơn hàng đầu tiên</Text>
              <TouchableOpacity style={styles.promoBtn}>
                <Text style={styles.promoBtnText}>Đặt ngay</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.promoEmoji}>🍕🍔🍟</Text>
          </LinearGradient>

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
            {categories.map((category) => (
              <TouchableOpacity key={category.id} style={styles.categoryCard}>
                <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
                  <Ionicons name={category.icon as any} size={28} color={category.color} />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Featured Items / Food List */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Món nổi bật</Text>
            <TouchableOpacity onPress={loadFoods}>
              <Text style={styles.seeAll}>Làm mới</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.featuredContainer}>
            {isFoodsLoading ? (
              <View style={styles.foodLoadingContainer}>
                <ActivityIndicator size="small" color="#FF6B35" />
                <Text style={styles.foodLoadingText}>Đang tải món ăn...</Text>
              </View>
            ) : foods.length === 0 ? (
              <Text style={styles.emptyFoodText}>Chưa có món ăn nào. Hãy seed dữ liệu từ backend.</Text>
            ) : (
              filteredFoods.map((item) => (
                <View key={item._id} style={styles.featuredCard}>
                  <View style={styles.featuredImageContainer}>
                    <Text style={styles.featuredEmoji}>{item.image || '🍽️'}</Text>
                  </View>
                  <View style={styles.featuredInfo}>
                    <Text style={styles.featuredName}>{item.name}</Text>
                    {item.description ? (
                      <Text style={styles.featuredDescription} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                    <View style={styles.featuredMeta}>
                      <Text style={styles.featuredPrice}>{formatCurrency(item.price)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => handleAddToCart(item)}
                  >
                    <Ionicons name="add" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard}>
                <LinearGradient
                  colors={['#667EEA', '#764BA2']}
                  style={styles.actionIconBg}
                >
                  <Ionicons name="time-outline" size={24} color="#FFF" />
                </LinearGradient>
                <Text style={styles.actionText}>Lịch sử</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <LinearGradient
                  colors={['#00C9A7', '#00B894']}
                  style={styles.actionIconBg}
                >
                  <Ionicons name="heart-outline" size={24} color="#FFF" />
                </LinearGradient>
                <Text style={styles.actionText}>Yêu thích</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <LinearGradient
                  colors={['#FF6B35', '#FF8E53']}
                  style={styles.actionIconBg}
                >
                  <Ionicons name="location-outline" size={24} color="#FFF" />
                </LinearGradient>
                <Text style={styles.actionText}>Địa chỉ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard}>
                <LinearGradient
                  colors={['#4B7BE5', '#6C63FF']}
                  style={styles.actionIconBg}
                >
                  <Ionicons name="gift-outline" size={24} color="#FFF" />
                </LinearGradient>
                <Text style={styles.actionText}>Ưu đãi</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 140 }} />
        </Animated.View>
      </ScrollView>

      {/* Cart Summary */}
      {totalItems > 0 && (
        <View style={styles.cartBarContainer}>
          <LinearGradient
            colors={['#1A1A2E', '#16213E']}
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
    backgroundColor: '#1A1A2E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  notificationBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
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
    color: 'rgba(255,255,255,0.9)',
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,107,53,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoBanner: {
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
    shadowColor: '#FF6B35',
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
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  promoSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  promoBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  promoBtnText: {
    color: '#FF6B35',
    fontWeight: '700',
    fontSize: 14,
  },
  promoEmoji: {
    fontSize: 48,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  seeAll: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  categoryCard: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  featuredContainer: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  featuredCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  featuredImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
  },
  featuredDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 4,
  },
  featuredPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF6B35',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  foodLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  foodLoadingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  emptyFoodText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  cartBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cartInfo: {
    flex: 1,
  },
  cartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  cartSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
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
    fontWeight: '600',
    color: '#FFF',
  },
  quickActions: {
    paddingHorizontal: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionCard: {
    width: (width - 64) / 4,
    alignItems: 'center',
    marginBottom: 16,
  },
  actionIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    textAlign: 'center',
  },
});
