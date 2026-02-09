import { View, Text, StyleSheet, Pressable, Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { BigButton } from '@/components/big-button';

export default function AuthOptionsScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleExistingUser = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/login-cpf');
  };

  const handleNewUser = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/registration');
  };

  const handleAdminAccess = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/admin/login');
  };

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
        <View style={styles.header}>
          <Text style={styles.title}>Como deseja continuar?</Text>
        </View>

        <View style={styles.buttonContainer}>
          <BigButton 
            title="Já tenho Cadastro" 
            onPress={handleExistingUser}
            variant="primary"
          />
          <View style={styles.spacer} />
          <BigButton 
            title="Novo cadastro" 
            onPress={handleNewUser}
            variant="outline"
          />
        </View>

        <Pressable style={styles.adminLink} onPress={handleAdminAccess}>
          <Text style={styles.adminText}>Acesso Administrador</Text>
        </Pressable>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FAFAFA',
  },
  header: {
    marginBottom: 56,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1B3A4B',
    textAlign: 'center',
    lineHeight: 42,
  },
  buttonContainer: {
    width: '100%',
  },
  spacer: {
    height: 20,
  },
  adminLink: {
    marginTop: 56,
    paddingVertical: 16,
  },
  adminText: {
    color: '#1B3A4B',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
