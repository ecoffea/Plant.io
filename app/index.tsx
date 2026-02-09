import { View, Text, Image, StyleSheet, Animated, BackHandler, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenContainer } from '@/components/screen-container';
import { BigButton } from '@/components/big-button';
import { useUser } from '@/lib/user-context';

export default function WelcomeScreen() {
  const router = useRouter();
  const { userData, setUserData, loadUser, isLoading } = useUser();
  const [checkingSession, setCheckingSession] = useState(true);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Fechar app ao pressionar voltar na tela inicial
  useEffect(() => {
    const backAction = () => {
      if (Platform.OS === 'android') {
        BackHandler.exitApp();
      }
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    // Animação de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Verificar sessão existente e "Lembrar de mim"
    const checkSession = async () => {
      try {
        // Primeiro, verificar se há CPF salvo em "Lembrar de mim"
        const rememberedCPF = await AsyncStorage.getItem('plantio_remember_cpf');
        
        if (rememberedCPF) {
          // Carregar dados do usuário pelo CPF
          const storedUsers = await AsyncStorage.getItem('plantio_registered_users');
          const users = storedUsers ? JSON.parse(storedUsers) : {};
          
          if (users[rememberedCPF]) {
            const savedUser = users[rememberedCPF];
            setUserData({
              cpf: rememberedCPF,
              name: savedUser.name,
              phone: savedUser.phone || '',
              pix: savedUser.pix || '',
              address: savedUser.address || '',
              latitude: savedUser.latitude,
              longitude: savedUser.longitude,
              profile: savedUser.profile,
              isRegistered: true,
            });
            
            // Redirecionar para tela do perfil
            setTimeout(() => {
              if (savedUser.profile === 'consumer') {
                router.replace('/screens/consumer-home');
              } else if (savedUser.profile === 'producer') {
                router.replace('/screens/producer-home');
              } else if (savedUser.profile === 'driver') {
                router.replace('/screens/driver-home');
              } else {
                router.replace('/profile-selection');
              }
            }, 500);
            setCheckingSession(false);
            return;
          }
        }
        
        // Se não há "Lembrar de mim", verificar sessão normal
        const hasSession = await loadUser();
        
        if (hasSession && userData.isRegistered && userData.profile) {
          // Redirecionar para última tela acessada
          setTimeout(() => {
            if (userData.profile === 'consumer') {
              router.replace('/screens/consumer-home');
            } else if (userData.profile === 'producer') {
              router.replace('/screens/producer-home');
            } else if (userData.profile === 'driver') {
              router.replace('/screens/driver-home');
            }
          }, 500);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
      }
      setCheckingSession(false);
    };

    checkSession();
  }, []);

  // Verificar novamente quando userData mudar
  useEffect(() => {
    if (!checkingSession && userData.isRegistered && userData.profile) {
      if (userData.profile === 'consumer') {
        router.replace('/screens/consumer-home');
      } else if (userData.profile === 'producer') {
        router.replace('/screens/producer-home');
      } else if (userData.profile === 'driver') {
        router.replace('/screens/driver-home');
      }
    }
  }, [userData, checkingSession]);

  const handleStart = () => {
    // Animação de saída
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push('/auth-options');
    });
  };

  if (checkingSession || isLoading) {
    return (
      <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <Image
            source={require('@/assets/images/logo-plantio.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
      <Animated.View 
        style={[
          styles.container, 
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/logo-plantio.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.subtitle}>
            Conectando produtores, consumidores e motoristas
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <BigButton title="Iniciar" onPress={handleStart} />
        </View>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    marginTop: 24,
    fontSize: 16,
    color: '#6B8E23',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 300,
    height: 130,
    marginBottom: 28,
  },
  subtitle: {
    fontSize: 16,
    color: '#1B3A4B',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 26,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
});
