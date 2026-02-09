import { View, Text, StyleSheet, TextInput, Alert, Platform, Pressable, Animated } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { BigButton } from '@/components/big-button';

export default function AdminLoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogin = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Credenciais do administrador (em produção, usar autenticação segura)
    if (username === 'admin' && password === 'plantio1234568') {
      router.replace('/admin/dashboard');
    } else {
      Alert.alert('Erro', 'Usuário ou senha incorretos');
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Painel Admin</Text>
          <Text style={styles.subtitle}>Acesso restrito</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Usuário</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Digite seu usuário"
              placeholderTextColor="#A5D6A7"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Digite sua senha"
                placeholderTextColor="#A5D6A7"
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Pressable 
                style={styles.showPasswordButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.showPasswordText}>
                  {showPassword ? 'Ocultar' : 'Ver'}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <BigButton
              title="Entrar"
              onPress={handleLogin}
              disabled={!username || !password}
            />
          </View>

          <BigButton
            title="Voltar"
            onPress={() => router.back()}
            variant="outline"
          />
        </View>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1B3A4B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B8E23',
  },
  form: {
    gap: 16,
    paddingHorizontal: 8,
  },
  inputGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B3A4B',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#F5F9F0',
    borderWidth: 2,
    borderColor: '#C5E1A5',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 18,
    color: '#1B3A4B',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F9F0',
    borderWidth: 2,
    borderColor: '#C5E1A5',
    borderRadius: 14,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 18,
    color: '#1B3A4B',
  },
  showPasswordButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  showPasswordText: {
    color: '#8BC34A',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 12,
  },
});
