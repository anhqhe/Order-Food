import React, { useEffect, useState, useCallback } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { staffAPI } from "@/services/api";

interface OrderItem {
  food: any;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  user: { _id: string; name: string; email: string; phone: string };
  items: OrderItem[];
  totalPrice: number;
  address: string;
  status: string;
  note?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xác nhận", color: "#FFA502" },
  confirmed: { label: "Đã xác nhận", color: "#3742fa" },
  delivering: { label: "Chờ giao hàng", color: "#2ed573" },
  completed: { label: "Hoàn thành", color: "#4CAF50" },
  cancelled: { label: "Đã hủy", color: "#ff4757" },
};

export default function StaffOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>("pending");

  const loadOrders = useCallback(async () => {
    try {
      const response = await staffAPI.getOrders();
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error("Load orders error:", error);
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

  const handleConfirmOrder = async (order: Order) => {
    if (order.status !== "pending") {
      Alert.alert("Lỗi", "Chỉ có thể xác nhận đơn hàng đang chờ xác nhận");
      return;
    }
    try {
      await staffAPI.confirmOrder(order._id);
      Alert.alert("Thành công", "Đã xác nhận đơn hàng");
      loadOrders();
    } catch (error: any) {
      Alert.alert("Lỗi", error.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

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
    const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const canConfirm = item.status === "pending";

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>#{item._id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.color + "20" }]}>
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>

        <View style={styles.customerInfo}>
          <Ionicons name="person-outline" size={14} color="#888" />
          <Text style={styles.customerText}>
            {item.user?.name || "N/A"} • {item.user?.phone || "N/A"}
          </Text>
        </View>

        <View style={styles.itemsList}>
          {item.items.map((oi, idx) => (
            <View key={idx} style={styles.orderItemRow}>
              <Text style={styles.orderItemName}>{oi.name} × {oi.quantity}</Text>
              <Text style={styles.orderItemPrice}>{formatCurrency(oi.price * oi.quantity)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={14} color="#888" />
          <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng cộng</Text>
          <Text style={styles.totalValue}>{formatCurrency(item.totalPrice)}</Text>
        </View>

        {canConfirm && (
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => handleConfirmOrder(item)}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
            <Text style={styles.confirmBtnText}>Xác nhận đơn hàng</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <FlatList
        horizontal
        data={[
          { key: "pending", label: "Chờ xác nhận" },
          { key: "confirmed", label: "Đã xác nhận" },
          { key: "all", label: "Tất cả" },
        ]}
        keyExtractor={(i) => i.key}
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              (item.key === "all" ? filterStatus === null : filterStatus === item.key) && styles.filterChipActive,
            ]}
            onPress={() => setFilterStatus(item.key === "all" ? null : item.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                (item.key === "all" ? filterStatus === null : filterStatus === item.key) && styles.filterChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.orderCount}>{filteredOrders.length} đơn hàng</Text>

      <FlatList
        data={filteredOrders}
        keyExtractor={(i) => i._id}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f23" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f0f23",
  },
  loadingText: { color: "#aaa", marginTop: 12, fontSize: 16 },
  filterBar: { minHeight: 44 },
  filterBarContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    alignItems: "center",
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#1a1a2e",
    borderWidth: 1,
    borderColor: "#2a2a4a",
    marginRight: 8,
    justifyContent: "center",
    minHeight: 40,
  },
  filterChipActive: {
    backgroundColor: "rgba(255,107,107,0.15)",
    borderColor: "#FF6B6B",
  },
  filterChipText: { color: "#888", fontSize: 14, lineHeight: 20 },
  filterChipTextActive: { color: "#FF6B6B", fontWeight: "600", lineHeight: 20 },
  orderCount: { color: "#888", fontSize: 14, paddingHorizontal: 16, paddingBottom: 8 },
  listContainer: { paddingHorizontal: 16, paddingBottom: 30 },
  orderCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderId: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  orderDate: { fontSize: 12, color: "#888", marginTop: 2 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: { fontSize: 12, fontWeight: "600" },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a4a",
  },
  customerText: { fontSize: 13, color: "#aaa" },
  itemsList: { gap: 6, marginBottom: 10 },
  orderItemRow: { flexDirection: "row", justifyContent: "space-between" },
  orderItemName: { fontSize: 14, color: "#ddd" },
  orderItemPrice: { fontSize: 14, color: "#4facfe" },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  addressText: { fontSize: 13, color: "#888", flex: 1 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2a2a4a",
  },
  totalLabel: { fontSize: 15, fontWeight: "600", color: "#aaa" },
  totalValue: { fontSize: 17, fontWeight: "bold", color: "#FF6B6B" },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  confirmBtnText: { fontSize: 15, fontWeight: "600", color: "#FFF" },
  emptyContainer: { alignItems: "center", paddingTop: 60 },
  emptyText: { color: "#666", fontSize: 16, marginTop: 12 },
});
