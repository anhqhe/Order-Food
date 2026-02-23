import React from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  View, 
  Text,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Menu items
const menuItems = [
  { id: 1, icon: 'receipt-outline', title: 'Đơn hàng của tôi', subtitle: 'Xem lịch sử đặt hàng', color: '#FF6B35' },
  { id: 2, icon: 'heart-outline', title: 'Món yêu thích', subtitle: 'Danh sách món đã lưu', color: '#FF4B8C' },
  { id: 3, icon: 'location-outline', title: 'Địa chỉ giao hàng', subtitle: 'Quản lý địa chỉ', color: '#00C9A7' },
  { id: 4, icon: 'card-outline', title: 'Phương thức thanh toán', subtitle: 'Thẻ và ví điện tử', color: '#4B7BE5' },
  { id: 5, icon: 'gift-outline', title: 'Ưu đãi của tôi', subtitle: 'Mã giảm giá, voucher', color: '#FFB800' },
  { id: 6, icon: 'settings-outline', title: 'Cài đặt', subtitle: 'Thông báo, ngôn ngữ', color: '#845EC2' },
];

// Stats
const stats = [
  { label: 'Đơn hàng', value: '12' },
  { label: 'Yêu thích', value: '28' },
  { label: 'Điểm', value: '450' },
];

import { Platform } from 'react-native';

export default function ProfileScreen() {
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        logout().then(() => router.replace('/auth/login'));
      }
    } else {
      Alert.alert(
        'Đăng xuất',
        'Bạn có chắc chắn muốn đăng xuất?',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Đăng xuất',
            style: 'destructive',
            onPress: async () => {
              await logout();
              router.replace('/auth/login');
            },
          },
        ]
      );
    }
  };

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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tài khoản</Text>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="create-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={['rgba(255,107,53,0.2)', 'rgba(255,142,83,0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileGradient}
          >
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#FF6B35', '#FF8E53']}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </LinearGradient>
              <View style={styles.onlineBadge} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.name || 'Người dùng'}</Text>
              <Text style={styles.userEmail}>{user?.email || ''}</Text>
              {user?.phone && (
                <View style={styles.phoneContainer}>
                  <Ionicons name="call-outline" size={14} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.userPhone}>{user.phone}</Text>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* Stats */}
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <React.Fragment key={stat.label}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
                {index < stats.length - 1 && <View style={styles.statDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Premium Banner */}
        <TouchableOpacity style={styles.premiumBanner}>
          <LinearGradient
            colors={['#667EEA', '#764BA2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.premiumGradient}
          >
            <View style={styles.premiumContent}>
              <Ionicons name="diamond" size={28} color="#FFF" />
              <View style={styles.premiumTextContainer}>
                <Text style={styles.premiumTitle}>Nâng cấp Premium</Text>
                <Text style={styles.premiumSubtitle}>Miễn phí giao hàng & ưu đãi độc quyền</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Admin Panel Button - only for admins */}
        {isAdmin && (
          <TouchableOpacity
            style={styles.adminBanner}
            onPress={() => router.push('/(admin)' as any)}
          >
            <LinearGradient
              colors={['#FF6B6B', '#ee5a24']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.premiumGradient}
            >
              <View style={styles.premiumContent}>
                <Ionicons name="shield-checkmark" size={28} color="#FFF" />
                <View style={styles.premiumTextContainer}>
                  <Text style={styles.premiumTitle}>Admin Panel</Text>
                  <Text style={styles.premiumSubtitle}>Quản lý món ăn & đơn hàng</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Tài khoản của tôi</Text>
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity 
                key={item.id} 
                style={[
                  styles.menuItem,
                  index === menuItems.length - 1 && styles.menuItemLast
                ]}
              >
                <View style={[styles.menuIconBg, { backgroundColor: `${item.color}20` }]}>
                  <Ionicons name={item.icon as any} size={22} color={item.color} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LinearGradient
            colors={['rgba(255,59,48,0.15)', 'rgba(255,59,48,0.05)']}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>FoodieApp v1.0.0</Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
  },
  editBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    marginHorizontal: 24,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 20,
  },
  profileGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00C9A7',
    borderWidth: 3,
    borderColor: '#1A1A2E',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 6,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userPhone: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  premiumBanner: {
    marginHorizontal: 24,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  adminBanner: {
    marginHorizontal: 24,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 28,
  },
  premiumGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  premiumTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  premiumSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  menuSection: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  menuContainer: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  logoutButton: {
    marginHorizontal: 24,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
  },
});
