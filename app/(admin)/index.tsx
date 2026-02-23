import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

interface Stats {
  totalOrders: number;
  totalFoods: number;
  totalUsers: number;
  totalRevenue: number;
  ordersByStatus: {
    pending: number;
    confirmed: number;
    delivering: number;
    completed: number;
    cancelled: number;
  };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const response = await adminAPI.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Load stats error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStats();
  }, [loadStats]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  const statCards = [
    {
      title: 'Tổng đơn hàng',
      value: stats?.totalOrders || 0,
      icon: 'receipt-outline' as const,
      gradient: ['#FF6B6B', '#ee5a24'] as const,
    },
    {
      title: 'Doanh thu',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: 'cash-outline' as const,
      gradient: ['#4facfe', '#00f2fe'] as const,
    },
    {
      title: 'Số món ăn',
      value: stats?.totalFoods || 0,
      icon: 'fast-food-outline' as const,
      gradient: ['#43e97b', '#38f9d7'] as const,
    },
    {
      title: 'Người dùng',
      value: stats?.totalUsers || 0,
      icon: 'people-outline' as const,
      gradient: ['#a18cd1', '#fbc2eb'] as const,
    },
  ];

  const statusItems = [
    { label: 'Chờ xác nhận', value: stats?.ordersByStatus.pending || 0, color: '#FFA502' },
    { label: 'Đã xác nhận', value: stats?.ordersByStatus.confirmed || 0, color: '#3742fa' },
    { label: 'Đang giao', value: stats?.ordersByStatus.delivering || 0, color: '#1e90ff' },
    { label: 'Hoàn thành', value: stats?.ordersByStatus.completed || 0, color: '#2ed573' },
    { label: 'Đã hủy', value: stats?.ordersByStatus.cancelled || 0, color: '#ff4757' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B6B" />
        }
      >
        {/* Welcome Banner */}
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={styles.welcomeBanner}
        >
          <Text style={styles.welcomeText}>Xin chào, {user?.name} 👋</Text>
          <Text style={styles.welcomeSubtext}>Tổng quan hệ thống</Text>
        </LinearGradient>

        {/* Stat Cards */}
        <View style={styles.statsGrid}>
          {statCards.map((card, index) => (
            <LinearGradient
              key={index}
              colors={[...card.gradient]}
              style={styles.statCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.statIconContainer}>
                <Ionicons name={card.icon} size={28} color="rgba(255,255,255,0.9)" />
              </View>
              <Text style={styles.statValue}>
                {typeof card.value === 'number' ? card.value.toString() : card.value}
              </Text>
              <Text style={styles.statTitle}>{card.title}</Text>
            </LinearGradient>
          ))}
        </View>

        {/* Order Status Breakdown */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>📊 Trạng thái đơn hàng</Text>
          <View style={styles.statusList}>
            {statusItems.map((item, index) => (
              <View key={index} style={styles.statusItem}>
                <View style={styles.statusLeft}>
                  <View style={[styles.statusDot, { backgroundColor: item.color }]} />
                  <Text style={styles.statusLabel}>{item.label}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.color + '20' }]}>
                  <Text style={[styles.statusValue, { color: item.color }]}>{item.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
  },
  loadingText: {
    color: '#aaa',
    marginTop: 12,
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  welcomeBanner: {
    padding: 24,
    paddingTop: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    width: (width - 36) / 2,
    borderRadius: 20,
    padding: 20,
    minHeight: 130,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  sectionContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  statusList: {
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLabel: {
    fontSize: 15,
    color: '#ccc',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
