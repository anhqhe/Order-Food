import { Stack } from "expo-router";
import React from "react";
import {
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

export default function StaffLayout() {
  const { logout } = useAuth();

  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
        logout().then(() => router.replace("/auth/login"));
      }
    } else {
      Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/auth/login");
          },
        },
      ]);
    }
  };

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#1a1a2e" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
        headerRight: () => (
          <TouchableOpacity
            onPress={handleLogout}
            style={{ marginRight: 15, flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <Ionicons name="log-out-outline" size={22} color="#FF6B6B" />
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Xác nhận đơn hàng",
          headerTitle: "📋 Staff - Xác nhận đơn hàng",
        }}
      />
    </Stack>
  );
}
