import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Dummy data for food categories
const categories = [
  { id: 1, name: 'Pizza', icon: 'pizza-outline', color: '#FF6B35' },
  { id: 2, name: 'Burger', icon: 'fast-food-outline', color: '#FFB800' },
  { id: 3, name: 'Sushi', icon: 'fish-outline', color: '#00C9A7' },
  { id: 4, name: 'Noodles', icon: 'restaurant-outline', color: '#845EC2' },
  { id: 5, name: 'Drinks', icon: 'cafe-outline', color: '#4B7BE5' },
];

// Dummy featured items
const featuredItems = [
  { id: 1, name: 'Combo Pizza Đặc Biệt', price: '199.000đ', rating: 4.8, image: '🍕' },
  { id: 2, name: 'Burger King Size', price: '89.000đ', rating: 4.5, image: '🍔' },
  { id: 3, name: 'Sushi Set 12 pcs', price: '259.000đ', rating: 4.9, image: '🍣' },
];

export default function IndexScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();

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
      }
    }
  }, [isAuthenticated, isLoading]);

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
          <TouchableOpacity style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="rgba(255,255,255,0.5)" />
            <Text style={styles.searchPlaceholder}>Tìm kiếm món ăn...</Text>
            <View style={styles.filterBtn}>
              <Ionicons name="options-outline" size={18} color="#FF6B35" />
            </View>
          </TouchableOpacity>

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

          {/* Featured Items */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Món nổi bật</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.featuredContainer}>
            {featuredItems.map((item) => (
              <TouchableOpacity key={item.id} style={styles.featuredCard}>
                <View style={styles.featuredImageContainer}>
                  <Text style={styles.featuredEmoji}>{item.image}</Text>
                </View>
                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredName}>{item.name}</Text>
                  <View style={styles.featuredMeta}>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color="#FFB800" />
                      <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                    <Text style={styles.featuredPrice}>{item.price}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.addBtn}>
                  <Ionicons name="add" size={20} color="#FFF" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
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

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>
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
  searchPlaceholder: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: 'rgba(255,255,255,0.4)',
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
