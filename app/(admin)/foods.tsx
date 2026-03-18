import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  RefreshControl,
  Switch,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '@/services/api';

interface FoodItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category?: string;
  isAvailable: boolean;
}

interface FoodFormData {
  name: string;
  description: string;
  price: string;
  image: string;
  category: string;
}

const emptyForm: FoodFormData = {
  name: '',
  description: '',
  price: '',
  image: '🍽️',
  category: 'Khác',
};

const EMOJI_OPTIONS = ['🍕', '🍔', '🍣', '🍜', '🍝', '🥗', '🌮', '🍗', '🥩', '🍰', '☕', '🥤', '🍽️'];

export default function AdminFoods() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [formData, setFormData] = useState<FoodFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const response = await adminAPI.getCategories();
      if (response.success && Array.isArray(response.data)) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Load categories error:', error);
    }
  }, []);

  const loadFoods = useCallback(async () => {
    try {
      const response = await adminAPI.getFoods();
      if (response.success) {
        setFoods(response.data);
      }
    } catch (error) {
      console.error('Load foods error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFoods();
  }, [loadFoods]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFoods();
  }, [loadFoods]);

  const openAddModal = () => {
    setEditingFood(null);
    setFormData(emptyForm);
    loadCategories();
    setModalVisible(true);
  };

  const openEditModal = (food: FoodItem) => {
    setEditingFood(food);
    setFormData({
      name: food.name,
      description: food.description || '',
      price: food.price.toString(),
      image: food.image || '🍽️',
      category: food.category || 'Khác',
    });
    loadCategories();
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên món ăn');
      return;
    }
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập giá hợp lệ');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        image: formData.image,
        category: (formData.category || 'Khác').trim(),
      };

      if (editingFood) {
        await adminAPI.updateFood(editingFood._id, data);
        Alert.alert('Thành công', 'Cập nhật món ăn thành công');
      } else {
        await adminAPI.createFood(data);
        Alert.alert('Thành công', 'Thêm món ăn thành công');
      }
      setModalVisible(false);
      loadFoods();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (food: FoodItem) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa "${food.name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminAPI.deleteFood(food._id);
              Alert.alert('Thành công', 'Đã xóa món ăn');
              loadFoods();
            } catch (error: any) {
              Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra');
            }
          },
        },
      ]
    );
  };

  const handleToggleAvailable = async (food: FoodItem) => {
    try {
      await adminAPI.updateFood(food._id, { isAvailable: !food.isAvailable });
      loadFoods();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

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

  const renderFoodItem = ({ item }: { item: FoodItem }) => (
    <View style={[styles.foodCard, !item.isAvailable && styles.foodCardDisabled]}>
      <View style={styles.foodLeft}>
        <Text style={styles.foodEmoji}>{item.image || '🍽️'}</Text>
        <View style={styles.foodInfo}>
          <Text style={styles.foodName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.foodPrice}>{formatCurrency(item.price)}</Text>
          {item.category ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.foodActions}>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{item.isAvailable ? 'On' : 'Off'}</Text>
          <Switch
            value={item.isAvailable}
            onValueChange={() => handleToggleAvailable(item)}
            trackColor={{ false: '#333', true: '#4CAF50' }}
            thumbColor={item.isAvailable ? '#fff' : '#888'}
          />
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => openEditModal(item)}
          >
            <Ionicons name="pencil" size={16} color="#4facfe" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash" size={16} color="#ff4757" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header Info */}
      <View style={styles.headerInfo}>
        <Text style={styles.headerCount}>{foods.length} món ăn</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addButtonText}>Thêm món</Text>
        </TouchableOpacity>
      </View>

      {/* Food List */}
      <FlatList
        data={foods}
        keyExtractor={(item) => item._id}
        renderItem={renderFoodItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B6B" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="fast-food-outline" size={64} color="#444" />
            <Text style={styles.emptyText}>Chưa có món ăn nào</Text>
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingFood ? '✏️ Sửa món ăn' : '➕ Thêm món mới'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#888" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              {/* Emoji Picker */}
              <Text style={styles.inputLabel}>Icon</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.emojiPicker}
              >
                {EMOJI_OPTIONS.map((emoji, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.emojiOption,
                      formData.image === emoji && styles.emojiSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, image: emoji })}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Tên món ăn *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="VD: Combo Pizza Đặc Biệt"
                placeholderTextColor="#666"
              />

              <Text style={styles.inputLabel}>Mô tả</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Mô tả món ăn..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Giá (VNĐ) *</Text>
              <TextInput
                style={styles.input}
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                placeholder="VD: 199000"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Danh mục</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryPicker}
              >
                {[
                  ...new Set([
                    'Khác',
                    ...categories.filter(Boolean),
                    ...(formData.category?.trim() &&
                    !['Khác', ...categories].includes(formData.category.trim())
                      ? [formData.category.trim()]
                      : []),
                  ]),
                ].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      formData.category === cat && styles.categoryChipSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, category: cat })}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        formData.category === cat && styles.categoryChipTextSelected,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingFood ? 'Cập nhật' : 'Thêm món'}
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
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerCount: {
    fontSize: 16,
    color: '#aaa',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  foodCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodCardDisabled: {
    opacity: 0.5,
  },
  foodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  foodEmoji: {
    fontSize: 36,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  foodPrice: {
    fontSize: 14,
    color: '#4facfe',
    fontWeight: '500',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,107,107,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  categoryText: {
    fontSize: 11,
    color: '#FF6B6B',
  },
  foodActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  switchLabel: {
    fontSize: 11,
    color: '#888',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtn: {
    backgroundColor: 'rgba(79,172,254,0.15)',
  },
  deleteBtn: {
    backgroundColor: 'rgba(255,71,87,0.15)',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 30,
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
  formContainer: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#0f0f23',
    borderWidth: 1,
    borderColor: '#2a2a4a',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  emojiPicker: {
    marginBottom: 4,
  },
  emojiOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255,107,107,0.1)',
  },
  emojiText: {
    fontSize: 24,
  },
  categoryPicker: {
    marginBottom: 4,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#0f0f23',
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: 8,
  },
  categoryChipSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255,107,107,0.15)',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#aaa',
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
