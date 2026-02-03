import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Animations
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateForm = () => {
    const newErrors: any = {};

    if (!name.trim()) {
      newErrors.name = 'Vui lòng nhập tên';
    }

    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10,11}$/.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), phone.trim(), password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Đăng ký thất bại', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Gradient Background */}
      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#0F3460']}
        style={styles.gradient}
      />

      {/* Decorative Circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['#667EEA', '#764BA2']}
                  style={styles.iconGradient}
                >
                  <Ionicons name="person-add" size={36} color="#FFF" />
                </LinearGradient>
              </View>
              <Text style={styles.title}>Tạo tài khoản</Text>
              <Text style={styles.subtitle}>Đăng ký để bắt đầu đặt đồ ăn</Text>
            </View>

            {/* Glass Card */}
            <View style={styles.glassCard}>
              <BlurView intensity={20} style={styles.blurContainer}>
                <View style={styles.formContainer}>
                  <Input
                    label="Họ và tên"
                    placeholder="Nhập họ và tên"
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      setErrors({ ...errors, name: undefined });
                    }}
                    error={errors.name}
                    autoCapitalize="words"
                    icon="person-outline"
                    variant="glass"
                  />

                  <Input
                    label="Email"
                    placeholder="Nhập email của bạn"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setErrors({ ...errors, email: undefined });
                    }}
                    error={errors.email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    icon="mail-outline"
                    variant="glass"
                  />

                  <Input
                    label="Số điện thoại"
                    placeholder="Nhập số điện thoại"
                    value={phone}
                    onChangeText={(text) => {
                      setPhone(text);
                      setErrors({ ...errors, phone: undefined });
                    }}
                    error={errors.phone}
                    keyboardType="phone-pad"
                    icon="call-outline"
                    variant="glass"
                  />

                  <Input
                    label="Mật khẩu"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setErrors({ ...errors, password: undefined });
                    }}
                    error={errors.password}
                    isPassword
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                    autoCapitalize="none"
                    icon="lock-closed-outline"
                    variant="glass"
                  />

                  <Input
                    label="Xác nhận mật khẩu"
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      setErrors({ ...errors, confirmPassword: undefined });
                    }}
                    error={errors.confirmPassword}
                    isPassword
                    showPassword={showConfirmPassword}
                    onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                    autoCapitalize="none"
                    icon="shield-checkmark-outline"
                    variant="glass"
                  />

                  <Button
                    title="Đăng Ký"
                    onPress={handleRegister}
                    loading={loading}
                    variant="primary"
                    icon="checkmark-circle"
                    iconPosition="right"
                  />
                </View>
              </BlurView>
            </View>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.loginLink}>Đăng nhập ngay</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  circle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    top: -100,
    right: -100,
  },
  circle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(118, 75, 162, 0.1)',
    bottom: 200,
    left: -50,
  },
  circle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    bottom: -50,
    right: 50,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 50,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 16,
    marginTop: 20,
  },
  iconGradient: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667EEA',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  glassCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  blurContainer: {
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
  },
  formContainer: {
    width: '100%',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 24,
  },
  loginText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
  },
  loginLink: {
    color: '#667EEA',
    fontSize: 15,
    fontWeight: '700',
  },
});
