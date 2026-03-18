import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { addressAPI } from "@/services/api";

interface Address {
  _id: string;
  label: string;
  fullAddress: string;
  phone?: string;
  isDefault: boolean;
}

export default function AddressesScreen() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const loadAddresses = useCallback(async () => {
    try {
      const response = await addressAPI.getAddresses();
      if (response.success) {
        setAddresses(response.data);
      }
    } catch (error) {
      console.error("Load addresses error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAddresses();
  }, [loadAddresses]);

  const openAddModal = () => {
    setEditingId(null);
    setLabel("");
    setFullAddress("");
    setPhone("");
    setModalVisible(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingId(addr._id);
    setLabel(addr.label);
    setFullAddress(addr.fullAddress);
    setPhone(addr.phone || "");
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingId(null);
    setLabel("");
    setFullAddress("");
    setPhone("");
  };

  const handleSave = async () => {
    const trimmed = fullAddress.trim();
    if (!trimmed) {
      Alert.alert("Lỗi", "Vui lòng nhập địa chỉ giao hàng");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const res = await addressAPI.updateAddress(editingId, {
          label: label.trim() || "Địa chỉ",
          fullAddress: trimmed,
          phone: phone.trim(),
        });
        if (res.success) {
          closeModal();
          loadAddresses();
        }
      } else {
        const res = await addressAPI.createAddress({
          label: label.trim() || "Địa chỉ mặc định",
          fullAddress: trimmed,
          phone: phone.trim(),
          isDefault: addresses.length === 0,
        });
        if (res.success) {
          closeModal();
          loadAddresses();
        }
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (addr: Address) => {
    Alert.alert(
      "Xóa địa chỉ",
      `Bạn có chắc muốn xóa "${addr.label || addr.fullAddress}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await addressAPI.deleteAddress(addr._id);
              if (res.success) loadAddresses();
            } catch (e) {
              Alert.alert("Lỗi", "Không thể xóa địa chỉ");
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (addr: Address) => {
    try {
      const res = await addressAPI.setDefault(addr._id);
      if (res.success) loadAddresses();
    } catch (e) {
      Alert.alert("Lỗi", "Không thể đặt địa chỉ mặc định");
    }
  };

  const renderItem = ({ item }: { item: Address }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconBg, { backgroundColor: "#00C9A720" }]}>
            <Ionicons name="location-outline" size={22} color="#00C9A7" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardLabel}>
              {item.label}
              {item.isDefault && (
                <Text style={styles.defaultBadge}> Mặc định</Text>
              )}
            </Text>
            <Text style={styles.cardAddress}>{item.fullAddress}</Text>
            {item.phone ? (
              <Text style={styles.cardPhone}>{item.phone}</Text>
            ) : null}
          </View>
        </View>
        <View style={styles.cardActions}>
          {!item.isDefault && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleSetDefault(item)}
            >
              <Ionicons name="star-outline" size={20} color="#FFB800" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="create-outline" size={20} color="#4B7BE5" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#ff4757" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Đang tải địa chỉ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Địa chỉ giao hàng</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={addresses}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B35"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color="#444" />
            <Text style={styles.emptyText}>Chưa có địa chỉ nào</Text>
            <Text style={styles.emptySubtext}>
              Thêm địa chỉ để giao hàng nhanh hơn
            </Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Ionicons name="add" size={28} color="#FFF" />
        <Text style={styles.fabText}>Thêm địa chỉ</Text>
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? "Sửa địa chỉ" : "Thêm địa chỉ"}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.inputLabel}>Tên gợi nhớ (tùy chọn)</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: Nhà riêng, Công ty"
                placeholderTextColor="#666"
                value={label}
                onChangeText={setLabel}
              />

              <Text style={styles.inputLabel}>Địa chỉ giao hàng *</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Số nhà, đường, phường, quận..."
                placeholderTextColor="#666"
                value={fullAddress}
                onChangeText={setFullAddress}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Số điện thoại (tùy chọn)</Text>
              <TextInput
                style={styles.input}
                placeholder="SĐT người nhận"
                placeholderTextColor="#666"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingId ? "Cập nhật" : "Thêm địa chỉ"}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardLeft: {
    flexDirection: "row",
    flex: 1,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
    marginBottom: 4,
  },
  defaultBadge: {
    fontSize: 12,
    color: "#00C9A7",
    fontWeight: "500",
  },
  cardAddress: {
    fontSize: 14,
    color: "#aaa",
    lineHeight: 20,
  },
  cardPhone: {
    fontSize: 13,
    color: "#888",
    marginTop: 4,
  },
  cardActions: {
    flexDirection: "row",
    gap: 4,
  },
  actionBtn: {
    padding: 8,
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
  emptySubtext: {
    color: "#555",
    fontSize: 14,
    marginTop: 4,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6B35",
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  fabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalContent: {
    backgroundColor: "#1a1a2e",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a4a",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#aaa",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#0f0f23",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#FFF",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2a2a4a",
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  saveBtn: {
    backgroundColor: "#FF6B35",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
});
