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
  TouchableOpacity,
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

type RevenuePeriod = 'today' | 'week' | 'month' | 'all';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenueData, setRevenueData] = useState<{
    revenue: number;
    orderCount: number;
    period: string;
  } | null>(null);
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('month');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const [statsRes, revenueRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getRevenue(revenuePeriod),
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (revenueRes.success) setRevenueData(revenueRes.data);
    } catch (error) {
      console.error('Load stats error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [revenuePeriod]);

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
    { label: 'Chờ giao hàng', value: stats?.ordersByStatus.delivering || 0, color: '#2ed573' },
    { label: 'Hoàn thành', value: stats?.ordersByStatus.completed || 0, color: '#4CAF50' },
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

        {/* Revenue Statistics */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>💰 Thống kê doanh thu</Text>
          <View style={styles.periodRow}>
            {[
              { key: 'today' as RevenuePeriod, label: 'Hôm nay' },
              { key: 'week' as RevenuePeriod, label: 'Tuần' },
              { key: 'month' as RevenuePeriod, label: 'Tháng' },
              { key: 'all' as RevenuePeriod, label: 'Tất cả' },
            ].map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[
                  styles.periodChip,
                  revenuePeriod === p.key && styles.periodChipActive,
                ]}
                onPress={() => setRevenuePeriod(p.key)}
              >
                <Text
                  style={[
                    styles.periodChipText,
                    revenuePeriod === p.key && styles.periodChipTextActive,
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.revenueRow}>
            <View style={styles.revenueItem}>
              <Text style={styles.revenueLabel}>Doanh thu</Text>
              <Text style={styles.revenueValue}>
                {formatCurrency(revenueData?.revenue || 0)}
              </Text>
            </View>
            <View style={styles.revenueItem}>
              <Text style={styles.revenueLabel}>Số đơn hoàn thành</Text>
              <Text style={styles.revenueValue}>
                {revenueData?.orderCount || 0}
              </Text>
            </View>
          </View>
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
  periodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#0f0f23',
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  periodChipActive: {
    borderColor: '#4facfe',
    backgroundColor: 'rgba(79,172,254,0.15)',
  },
  periodChipText: {
    fontSize: 13,
    color: '#888',
  },
  periodChipTextActive: {
    color: '#4facfe',
    fontWeight: '600',
  },
  revenueRow: {
    flexDirection: 'row',
    gap: 16,
  },
  revenueItem: {
    flex: 1,
    backgroundColor: '#0f0f23',
    borderRadius: 12,
    padding: 16,
  },
  revenueLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4facfe',
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
