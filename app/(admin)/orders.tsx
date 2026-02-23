import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '@/services/api';

interface OrderItem {
  food: any;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  items: OrderItem[];
  totalPrice: number;
  address: string;
  status: string;
  note?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'Chờ xác nhận', color: '#FFA502', icon: 'time-outline' },
  confirmed: { label: 'Đã xác nhận', color: '#3742fa', icon: 'checkmark-circle-outline' },
  delivering: { label: 'Đang giao', color: '#1e90ff', icon: 'bicycle-outline' },
  completed: { label: 'Hoàn thành', color: '#2ed573', icon: 'checkmark-done-circle-outline' },
  cancelled: { label: 'Đã hủy', color: '#ff4757', icon: 'close-circle-outline' },
};

const STATUS_FLOW = ['pending', 'confirmed', 'delivering', 'completed', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const response = await adminAPI.getOrders();
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error('Load orders error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrders();
  }, [loadOrders]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await adminAPI.updateOrderStatus(orderId, newStatus);
      setStatusModalVisible(false);
      setSelectedOrder(null);
      Alert.alert('Thành công', 'Cập nhật trạng thái thành công');
      loadOrders();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setStatusModalVisible(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredOrders = filterStatus
    ? orders.filter((o) => o.status === filterStatus)
    : orders;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;

    return (
      <View style={styles.orderCard}>
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>#{item._id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}
            onPress={() => openStatusModal(item)}
          >
            <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
            <Ionicons name="chevron-down" size={12} color={statusConfig.color} />
          </TouchableOpacity>
        </View>

        {/* Customer Info */}
        <View style={styles.customerInfo}>
          <Ionicons name="person-outline" size={14} color="#888" />
          <Text style={styles.customerText}>
            {item.user?.name || 'N/A'} • {item.user?.phone || 'N/A'}
          </Text>
        </View>

        {/* Items */}
        <View style={styles.itemsList}>
          {item.items.map((orderItem, index) => (
            <View key={index} style={styles.orderItemRow}>
              <Text style={styles.orderItemName}>
                {orderItem.name} × {orderItem.quantity}
              </Text>
              <Text style={styles.orderItemPrice}>
                {formatCurrency(orderItem.price * orderItem.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Address & Note */}
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={14} color="#888" />
          <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
        </View>
        {item.note ? (
          <View style={styles.addressRow}>
            <Ionicons name="chatbubble-outline" size={14} color="#888" />
            <Text style={styles.addressText} numberOfLines={1}>{item.note}</Text>
          </View>
        ) : null}

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng cộng</Text>
          <Text style={styles.totalValue}>{formatCurrency(item.totalPrice)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Filter Bar */}
      <FlatList
        horizontal
        data={[{ key: 'all', label: 'Tất cả' }, ...STATUS_FLOW.map((s) => ({ key: s, label: STATUS_CONFIG[s].label }))]}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              (item.key === 'all' ? filterStatus === null : filterStatus === item.key) &&
                styles.filterChipActive,
            ]}
            onPress={() => setFilterStatus(item.key === 'all' ? null : item.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                (item.key === 'all' ? filterStatus === null : filterStatus === item.key) &&
                  styles.filterChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Order Count */}
      <Text style={styles.orderCount}>{filteredOrders.length} đơn hàng</Text>

      {/* Order List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item._id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B6B" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#444" />
            <Text style={styles.emptyText}>Không có đơn hàng nào</Text>
          </View>
        }
      />

      {/* Status Update Modal */}
      <Modal
        visible={statusModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📦 Cập nhật trạng thái</Text>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#888" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <View style={styles.modalBody}>
                <Text style={styles.modalOrderId}>
                  Đơn hàng #{selectedOrder._id.slice(-6).toUpperCase()}
                </Text>

                {STATUS_FLOW.map((status) => {
                  const config = STATUS_CONFIG[status];
                  const isActive = selectedOrder.status === status;
                  return (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusOption,
                        isActive && { borderColor: config.color, borderWidth: 2 },
                      ]}
                      onPress={() => handleUpdateStatus(selectedOrder._id, status)}
                    >
                      <View style={styles.statusOptionLeft}>
                        <Ionicons
                          name={config.icon as any}
                          size={22}
                          color={config.color}
                        />
                        <Text style={[styles.statusOptionText, { color: config.color }]}>
                          {config.label}
                        </Text>
                      </View>
                      {isActive && (
                        <Ionicons name="checkmark-circle" size={22} color={config.color} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  filterBar: {
    maxHeight: 50,
  },
  filterBarContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a4a',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: 'rgba(255,107,107,0.15)',
    borderColor: '#FF6B6B',
  },
  filterChipText: {
    color: '#888',
    fontSize: 13,
  },
  filterChipTextActive: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  orderCount: {
    color: '#888',
    fontSize: 14,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  orderCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  orderDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  customerText: {
    fontSize: 13,
    color: '#aaa',
  },
  itemsList: {
    gap: 6,
    marginBottom: 10,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderItemName: {
    fontSize: 14,
    color: '#ddd',
  },
  orderItemPrice: {
    fontSize: 14,
    color: '#4facfe',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  addressText: {
    fontSize: 13,
    color: '#888',
    flex: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a4a',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#aaa',
  },
  totalValue: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 12,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a4a',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalBody: {
    padding: 20,
  },
  modalOrderId: {
    fontSize: 15,
    color: '#aaa',
    marginBottom: 16,
  },
  statusOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  statusOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusOptionText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
