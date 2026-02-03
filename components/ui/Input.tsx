import React from 'react';
import {
  TextInput,
  StyleSheet,
  View,
  Text,
  TextInputProps,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
  onTogglePassword?: () => void;
  showPassword?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'default' | 'glass';
}

export default function Input({
  label,
  error,
  isPassword,
  onTogglePassword,
  showPassword,
  icon,
  variant = 'default',
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = React.useState(false);

  const isGlass = variant === 'glass';

  return (
    <View style={styles.container}>
      <Text style={[styles.label, isGlass && styles.labelGlass]}>{label}</Text>
      <View style={[
        styles.inputWrapper,
        isFocused && styles.inputWrapperFocused,
        error && styles.inputWrapperError,
        isGlass && styles.inputWrapperGlass,
      ]}>
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons 
              name={icon} 
              size={20} 
              color={isFocused ? '#FF6B35' : (isGlass ? 'rgba(255,255,255,0.6)' : '#999')} 
            />
          </View>
        )}
        <TextInput
          style={[
            styles.input,
            icon && styles.inputWithIcon,
            isGlass && styles.inputGlass,
          ]}
          placeholderTextColor={isGlass ? 'rgba(255,255,255,0.4)' : '#999'}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={onTogglePassword}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={22}
              color={isGlass ? 'rgba(255,255,255,0.6)' : '#666'}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginLeft: 4,
  },
  labelGlass: {
    color: 'rgba(255,255,255,0.9)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  inputWrapperError: {
    borderColor: '#FF3B30',
  },
  inputWrapperGlass: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  iconContainer: {
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  inputWithIcon: {
    paddingLeft: 12,
  },
  inputGlass: {
    color: '#FFF',
  },
  eyeIcon: {
    padding: 16,
    paddingLeft: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
});
