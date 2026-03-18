import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { orderAPI } from "@/services/api";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  status: string;
  totalPrice: number;
  address: string;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  delivering: "Chờ giao hàng",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

export default function OrdersHistoryScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const response = await orderAPI.getMyOrders();
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error("Load my orders error:", error);
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const label = STATUS_LABELS[item.status] || item.status;
    const isConfirmed = ["confirmed", "delivering", "completed"].includes(item.status);
    const isCancelled = item.status === "cancelled";

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/orders/${item._id}`)}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>Đơn #{item._id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              isConfirmed && { backgroundColor: "rgba(55,66,250,0.2)" },
              isCancelled && { backgroundColor: "rgba(255,71,87,0.2)" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isConfirmed && { color: "#3742fa" },
                isCancelled && { color: "#ff4757" },
              ]}
            >
              {label}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.itemSummary}>
            {item.items
              .slice(0, 2)
              .map((i) => `${i.name} × ${i.quantity}`)
              .join(" • ")}
            {item.items.length > 2 && ` • +${item.items.length - 2} món nữa`}
          </Text>
          <Text style={styles.totalText}>{formatCurrency(item.totalPrice)}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Ionicons name="location-outline" size={14} color="#888" />
          <Text style={styles.addressText} numberOfLines={1}>
            {item.address}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color="rgba(255,255,255,0.4)"
          />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.countText}>{orders.length} đơn hàng</Text>

      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#444" />
            <Text style={styles.emptyText}>Bạn chưa có đơn hàng nào</Text>
          </View>
        }
      />
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
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderId: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },
  orderDate: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  statusText: {
    fontSize: 12,
    color: "#FFF",
    fontWeight: "600",
  },
  cardBody: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemSummary: {
    fontSize: 13,
    color: "#ccc",
    flex: 1,
    marginRight: 10,
  },
  totalText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FF6B35",
  },
  cardFooter: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addressText: {
    fontSize: 12,
    color: "#888",
    flex: 1,
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
});

