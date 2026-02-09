import { View, Text, StyleSheet, Pressable, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenContainer } from '@/components/screen-container';
import { useUser, UserProfile } from '@/lib/user-context';

interface ProfileOption {
  id: UserProfile;
  title: string;
  icon: string;
  description: string;
}

const profiles: ProfileOption[] = [
  {
    id: 'consumer',
    title: 'Consumidor',
    icon: '🛒',
    description: 'Compre produtos frescos direto do produtor',
  },
  {
    id: 'producer',
    title: 'Produtor Rural',
    icon: '🌾',
    description: 'Venda seus produtos para consumidores',
  },
  {
    id: 'driver',
    title: 'Motorista',
    icon: '🚚',
    description: 'Transporte produtos e ganhe dinheiro',
  },
];

export default function ProfileSelectionScreen() {
  const router = useRouter();
  const { userData, setUserData, saveUser } = useUser();

  const handleSelectProfile = async (profile: UserProfile) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    try {
      // Salvar perfil no banco de dados de usuários registrados
      const storedUsers = await AsyncStorage.getItem('plantio_registered_users');
      const users = storedUsers ? JSON.parse(storedUsers) : {};
      
      if (userData.cpf && users[userData.cpf]) {
        users[userData.cpf].profile = profile;
        await AsyncStorage.setItem('plantio_registered_users', JSON.stringify(users));
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      Alert.alert('Erro', 'Nao foi possivel salvar o perfil.');
      return;
    }
    
    setUserData({ profile });
    await saveUser();

    // Navegar para tela isolada de cada perfil (sem tabs compartilhadas)
    switch (profile) {
      case 'consumer':
        router.replace('/screens/consumer-home');
        break;
      case 'producer':
        router.replace('/screens/producer-home');
        break;
      case 'driver':
        router.replace('/screens/driver-home');
        break;
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.container}>
        <Text style={styles.title}>Eu sou:</Text>
        <Text style={styles.subtitle}>Selecione seu perfil</Text>

        <View style={styles.profilesContainer}>
          {profiles.map((profile) => (
            <Pressable
              key={profile.id}
              onPress={() => handleSelectProfile(profile.id)}
              style={({ pressed }) => [
                styles.profileCard,
                pressed && styles.profileCardPressed,
              ]}
            >
              <Text style={styles.profileIcon}>{profile.icon}</Text>
              <View style={styles.profileInfo}>
                <Text style={styles.profileTitle}>{profile.title}</Text>
                <Text style={styles.profileDescription}>{profile.description}</Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    backgroundColor: '#FAFAFA',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1B3A4B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B8E23',
    marginBottom: 32,
  },
  profilesContainer: {
    gap: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F9F0',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#C5E1A5',
  },
  profileCardPressed: {
    backgroundColor: '#C5E1A5',
    transform: [{ scale: 0.98 }],
  },
  profileIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B3A4B',
    marginBottom: 4,
  },
  profileDescription: {
    fontSize: 12,
    color: '#6B8E23',
  },
  arrow: {
    fontSize: 22,
    color: '#8BC34A',
    fontWeight: '600',
  },
});
