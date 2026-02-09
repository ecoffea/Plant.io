import { View, Text, TextInput, StyleSheet, Pressable, TextInputProps } from 'react-native';
import { useState } from 'react';

export interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  mask?: 'phone' | 'cpf' | 'none';
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  autoCapitalize?: TextInputProps['autoCapitalize'];
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  editable?: boolean;
}

export function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  mask = 'none',
  keyboardType = 'default',
  autoCapitalize = 'none',
  secureTextEntry = false,
  showPasswordToggle = false,
  multiline = false,
  numberOfLines = 1,
  onFocus,
  onBlur,
  editable = true,
}: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const applyMask = (text: string): string => {
    const numbers = text.replace(/\D/g, '');
    
    if (mask === 'phone') {
      // Format: (99) 99999-9999
      if (numbers.length <= 2) return numbers;
      if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
      if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
    
    if (mask === 'cpf') {
      // Format: 999.999.999-99
      if (numbers.length <= 3) return numbers;
      if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
      if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
    }
    
    return text;
  };

  const handleChangeText = (text: string) => {
    const maskedText = applyMask(text);
    onChangeText(maskedText);
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input, 
            isFocused && styles.inputFocused,
            multiline && styles.inputMultiline,
            !editable && styles.inputDisabled,
          ]}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A5D6A7"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry && !showPassword}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="done"
          editable={editable}
        />
        {showPasswordToggle && secureTextEntry && (
          <Pressable 
            style={styles.toggleButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.toggleText}>
              {showPassword ? 'Ocultar' : 'Ver'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B3A4B',
    marginBottom: 10,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#F5F9F0',
    borderWidth: 2,
    borderColor: '#C5E1A5',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#1B3A4B',
  },
  inputFocused: {
    borderColor: '#8BC34A',
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputDisabled: {
    backgroundColor: '#E8E8E8',
    color: '#999',
  },
  toggleButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  toggleText: {
    color: '#8BC34A',
    fontSize: 14,
    fontWeight: '600',
  },
});
