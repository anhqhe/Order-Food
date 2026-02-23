import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Demo notifications
const notifications = [
  {
    id: 1,
    type: 'order',
    title: 'Đơn hàng đã được xác nhận',
    message: 'Đơn hàng #1234 của bạn đã được xác nhận và đang được chuẩn bị.',
    time: '5 phút trước',
    icon: 'checkmark-circle',
    color: '#2ed573',
    read: false,
  },
  {
    id: 2,
    type: 'promo',
    title: 'Giảm 20% cho đơn hàng tiếp theo!',
    message: 'Sử dụng mã SAVE20 để được giảm 20% cho đơn hàng từ 100.000đ.',
    time: '1 giờ trước',
    icon: 'gift',
    color: '#FFB800',
    read: false,
  },
  {
    id: 3,
    type: 'order',
    title: 'Đơn hàng đang giao',
    message: 'Tài xế đang trên đường giao đơn hàng #1230 cho bạn.',
    time: '3 giờ trước',
    icon: 'bicycle',
    color: '#4B7BE5',
    read: true,
  },
  {
    id: 4,
    type: 'system',
    title: 'Chào mừng bạn đến với FoodApp!',
    message: 'Khám phá hàng trăm món ăn ngon và đặt hàng ngay hôm nay.',
    time: '1 ngày trước',
    icon: 'sparkles',
    color: '#845EC2',
    read: true,
  },
  {
    id: 5,
    type: 'promo',
    title: 'Flash Sale cuối tuần!',
    message: 'Giảm đến 50% cho các món Pizza và Burger. Chỉ trong 2 ngày!',
    time: '2 ngày trước',
    icon: 'flash',
    color: '#FF6B35',
    read: true,
  },
];

export default function NotificationsScreen() {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#1A1A2E']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thông báo</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount} mới</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {notifications.map((item) => (
          <View
            key={item.id}
            style={[
              styles.notifCard,
              !item.read && styles.notifCardUnread,
            ]}
          >
            <View style={[styles.notifIconContainer, { backgroundColor: `${item.color}20` }]}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <View style={styles.notifContent}>
              <View style={styles.notifHeader}>
                <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
                {!item.read && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
              <Text style={styles.notifTime}>{item.time}</Text>
            </View>
          </View>
        ))}

        {notifications.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
            <Text style={styles.emptySubtitle}>Các thông báo mới sẽ hiện tại đây</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
  },
  unreadBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadBadgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  notifCardUnread: {
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.15)',
  },
  notifIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
  },
  notifMessage: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 18,
    marginBottom: 6,
  },
  notifTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
  },
});
