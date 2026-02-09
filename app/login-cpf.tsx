import { View, Text, StyleSheet, TextInput, Alert, Platform, Pressable, Animated, Switch } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { BigButton } from '@/components/big-button';
import { useUser } from '@/lib/user-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginCPFScreen() {
  const router = useRouter();
  const { setUserData } = useUser();
  const [cpf, setCpf] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const formatCPF = (text: string): string => {
    const numbers = text.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const handleCPFChange = (text: string) => {
    setCpf(formatCPF(text));
  };

  const handleLogin = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) {
      Alert.alert('Erro', 'CPF inválido. Digite os 11 dígitos.');
      return;
    }

    // Verificar se usuário existe no AsyncStorage
    try {
      const storedUsers = await AsyncStorage.getItem('plantio_registered_users');
      const users = storedUsers ? JSON.parse(storedUsers) : {};
      
      if (users[cleanCPF]) {
        const userData = users[cleanCPF];
        
        // Salvar "Lembrar de mim" se marcado
        if (rememberMe) {
          await AsyncStorage.setItem('plantio_remember_cpf', cleanCPF);
        } else {
          await AsyncStorage.removeItem('plantio_remember_cpf');
        }
        
        setUserData({
          cpf: cleanCPF,
          name: userData.name,
          phone: userData.phone || '',
          pix: userData.pix || '',
          address: userData.address || '',
          latitude: userData.latitude,
          longitude: userData.longitude,
          profile: userData.profile,
          isRegistered: true,
        });

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Navegar para tela correspondente ao perfil
        if (userData.profile === 'consumer') {
          router.replace('/screens/consumer-home');
        } else if (userData.profile === 'producer') {
          router.replace('/screens/producer-home');
        } else if (userData.profile === 'driver') {
          router.replace('/screens/driver-home');
        } else {
          // Se não tem perfil definido, vai para seleção
          router.replace('/profile-selection');
        }
      } else {
        Alert.alert(
          'Usuário não encontrado',
          'Este CPF não está cadastrado. Deseja fazer um novo cadastro?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Cadastrar', onPress: () => router.push('/registration') },
          ]
        );
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao verificar o cadastro.');
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Acesso</Text>
          <Text style={styles.subtitle}>Digite seu CPF para entrar</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>CPF</Text>
            <TextInput
              style={styles.input}
              value={cpf}
              onChangeText={handleCPFChange}
              placeholder="000.000.000-00"
              placeholderTextColor="#A5D6A7"
              keyboardType="numeric"
              maxLength={14}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>

          <View style={styles.rememberContainer}>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: '#C5E1A5', true: '#8BC34A' }}
              thumbColor={rememberMe ? '#FFFFFF' : '#F5F9F0'}
            />
            <Text style={styles.rememberText}>Lembrar de mim</Text>
          </View>

          <View style={styles.buttonContainer}>
            <BigButton
              title="Entrar"
              onPress={handleLogin}
              disabled={cpf.replace(/\D/g, '').length !== 11}
            />
          </View>

          <Pressable 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>Voltar</Text>
          </Pressable>
        </View>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1B3A4B',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B8E23',
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B3A4B',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F5F9F0',
    borderWidth: 2,
    borderColor: '#C5E1A5',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: 18,
    color: '#1B3A4B',
    textAlign: 'center',
    letterSpacing: 2,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  rememberText: {
    fontSize: 14,
    color: '#1B3A4B',
  },
  buttonContainer: {
    marginTop: 16,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 16,
  },
  backText: {
    color: '#1B3A4B',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
