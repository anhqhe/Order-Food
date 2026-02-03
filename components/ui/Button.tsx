import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'glass';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
}

export default function Button({
  title,
  loading,
  variant = 'primary',
  disabled,
  icon,
  iconPosition = 'left',
  ...props
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isGlass = variant === 'glass';

  const renderContent = () => (
    <View style={styles.contentContainer}>
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFF' : '#FF6B35'} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons 
              name={icon} 
              size={20} 
              color={isPrimary || isGlass ? '#FFF' : '#FF6B35'} 
              style={styles.iconLeft}
            />
          )}
          <Text
            style={[
              styles.buttonText,
              isPrimary && styles.primaryText,
              variant === 'secondary' && styles.secondaryText,
              isGlass && styles.glassText,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons 
              name={icon} 
              size={20} 
              color={isPrimary || isGlass ? '#FFF' : '#FF6B35'} 
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </View>
  );

  if (isPrimary) {
    return (
      <TouchableOpacity
        disabled={disabled || loading}
        activeOpacity={0.85}
        {...props}
      >
        <LinearGradient
          colors={['#FF6B35', '#FF8E53', '#FFA07A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.button,
            styles.primaryButton,
            (disabled || loading) && styles.disabledButton,
          ]}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'secondary' && styles.secondaryButton,
        isGlass && styles.glassButton,
        (disabled || loading) && styles.disabledButton,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58,
  },
  primaryButton: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  glassButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  disabledButton: {
    opacity: 0.5,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  primaryText: {
    color: '#FFF',
  },
  secondaryText: {
    color: '#FF6B35',
  },
  glassText: {
    color: '#FFF',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
