import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { adminAPI } from "@/services/api";

interface UserItem {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "user" | "admin";
  createdAt?: string;
}

type RoleFilter = "all" | "user" | "admin";

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [workingId, setWorkingId] = useState<string | null>(null);

  const loadUsers = useCallback(
    async (opts?: { silent?: boolean }) => {
      try {
        if (!opts?.silent) {
          setLoading(true);
        }

        const params =
          roleFilter === "all"
            ? undefined
            : {
                role: roleFilter,
              };

        const response = await adminAPI.getUsers(params as any);
        if (response.success) {
          setUsers(response.data);
        }
      } catch (error) {
        console.error("Load users error:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [roleFilter],
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUsers({ silent: true });
  }, [loadUsers]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("vi-VN");
  };

  const confirmDelete = (user: UserItem) => {
    Alert.alert(
      "Xóa người dùng",
      `Bạn có chắc muốn xóa "${user.name || user.email}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => handleDelete(user),
        },
      ],
    );
  };

  const handleDelete = async (user: UserItem) => {
    setWorkingId(user._id);
    try {
      const response = await adminAPI.deleteUser(user._id);
      if (response.success) {
        setUsers((prev) => prev.filter((u) => u._id !== user._id));
      } else {
        Alert.alert("Lỗi", response.message || "Không thể xóa người dùng");
      }
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error?.response?.data?.message || error.message || "Không thể xóa người dùng",
      );
    } finally {
      setWorkingId(null);
    }
  };

  const renderUserItem = ({ item }: { item: UserItem }) => {
    const isAdmin = item.role === "admin";
    const busy = workingId === item._id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.name?.charAt(0)?.toUpperCase() ||
                  item.email?.charAt(0)?.toUpperCase() ||
                  "U"}
              </Text>
            </View>
            <View style={styles.userText}>
              <Text style={styles.userName}>{item.name || "Không tên"}</Text>
              <Text style={styles.userEmail}>{item.email}</Text>
              {!!item.phone && <Text style={styles.userPhone}>{item.phone}</Text>}
            </View>
          </View>
          <View style={styles.roleBadge(isAdmin)}>
            <Ionicons
              name={isAdmin ? "shield-checkmark" : "person-circle-outline"}
              size={16}
              color={isAdmin ? "#fff" : "#FF6B6B"}
            />
            <Text style={styles.roleText(isAdmin)}>{isAdmin ? "Admin" : "User"}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.createdText}>
            Tạo ngày: {formatDate(item.createdAt) || "—"}
          </Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => confirmDelete(item)}
            disabled={busy}
          >
            <Ionicons name="trash-outline" size={18} color="#ff4757" />
            <Text style={styles.deleteText}>{busy ? "Đang xóa..." : "Xóa"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Đang tải người dùng...</Text>
      </View>
    );
  }

  const count = users.length;

  return (
    <View style={styles.container}>
      {/* Filter bar */}
      <View style={styles.filterBar}>
        {[
          { key: "all" as RoleFilter, label: "Tất cả" },
          { key: "admin" as RoleFilter, label: "Admin" },
          { key: "user" as RoleFilter, label: "User" },
        ].map((item) => {
          const active = roleFilter === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setRoleFilter(item.key)}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.countText}>{count} người dùng</Text>

      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B6B" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-circle-outline" size={64} color="#444" />
            <Text style={styles.emptyText}>Chưa có người dùng nào</Text>
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
  filterBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2a2a4a",
    backgroundColor: "#1a1a2e",
  },
  filterChipActive: {
    borderColor: "#FF6B6B",
    backgroundColor: "rgba(255,107,107,0.15)",
  },
  filterChipText: {
    fontSize: 13,
    color: "#888",
  },
  filterChipTextActive: {
    color: "#FF6B6B",
    fontWeight: "600",
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
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
  },
  userText: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: "#aaa",
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 12,
    color: "#888",
  },
  roleBadge: (isAdmin: boolean) => ({
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: isAdmin ? "rgba(76,175,80,0.15)" : "rgba(255,107,107,0.12)",
    borderWidth: 1,
    borderColor: isAdmin ? "#4CAF50" : "#FF6B6B",
  }),
  roleText: (isAdmin: boolean) => ({
    fontSize: 12,
    fontWeight: "600",
    color: isAdmin ? "#4CAF50" : "#FF6B6B",
    marginLeft: 4,
  }),
  cardFooter: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  createdText: {
    fontSize: 12,
    color: "#777",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,71,87,0.1)",
  },
  deleteText: {
    fontSize: 12,
    color: "#ff4757",
    marginLeft: 4,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
    marginTop: 12,
  },
});

