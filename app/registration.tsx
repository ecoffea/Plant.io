import { View, Text, StyleSheet, Alert, Platform, Animated, ScrollView, KeyboardAvoidingView, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenContainer } from '@/components/screen-container';
import { BigButton } from '@/components/big-button';
import { InputField } from '@/components/input-field';
import { useUser } from '@/lib/user-context';
import { AddressConfirmDialog } from '@/components/address-confirm-dialog';

export default function RegistrationScreen() {
  const router = useRouter();
  const { setUserData } = useUser();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [pix, setPix] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePixFocus = () => {
    // Scroll apenas para o campo PIX (o último campo)
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 200);
  };

  const getLocation = async () => {
    Keyboard.dismiss();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da sua localização para continuar.');
        setIsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);
      
      const [result] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (result) {
        const formattedAddress = `${result.street || ''}, ${result.streetNumber || 'S/N'} - ${result.district || ''}, ${result.city || ''} - ${result.region || ''}`;
        setAddress(formattedAddress);
        setShowAddressDialog(true);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível obter sua localização.');
    }
    setIsLoading(false);
  };

  const handleAddressConfirm = async () => {
    setShowAddressDialog(false);
    
    const cleanCPF = cpf.replace(/\D/g, '');
    
    // Verificar se CPF já está cadastrado (1 cadastro por CPF)
    try {
      const storedUsers = await AsyncStorage.getItem('plantio_registered_users');
      const users = storedUsers ? JSON.parse(storedUsers) : {};
      
      if (users[cleanCPF]) {
        Alert.alert(
          'CPF já cadastrado',
          'Este CPF já possui um cadastro. Cada CPF pode ter apenas um cadastro. Use a opção "Já tenho cadastro" para acessar.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      users[cleanCPF] = {
        name,
        phone,
        cpf: cleanCPF,
        pix,
        address,
        latitude,
        longitude,
        profile: null,
        registeredAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem('plantio_registered_users', JSON.stringify(users));
      
      setUserData({
        name,
        phone,
        cpf: cleanCPF,
        pix,
        address,
        latitude,
        longitude,
        profile: null,
        isRegistered: true,
      });
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      router.push('/profile-selection');
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      Alert.alert('Erro', 'Não foi possível salvar o cadastro.');
    }
  };

  const handleAddressReject = () => {
    setShowAddressDialog(false);
  };

  const handleManualAddress = (newAddress: string) => {
    setAddress(newAddress);
    setShowAddressDialog(true);
  };

  const isFormValid = name.length >= 3 && phone.length >= 14 && cpf.length >= 14 && pix.length >= 3;

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <ScrollView 
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>Novo Cadastro</Text>
            <Text style={styles.subtitle}>Preencha seus dados</Text>

            <View style={styles.form}>
              <InputField
                label="Nome Completo"
                value={name}
                onChangeText={setName}
                placeholder="Digite seu nome"
                autoCapitalize="words"
                onFocus={() => {}}
              />
              
              <InputField
                label="Telefone"
                value={phone}
                onChangeText={setPhone}
                placeholder="(99) 99999-9999"
                mask="phone"
                keyboardType="phone-pad"
                onFocus={() => {}}
              />
              
              <InputField
                label="CPF"
                value={cpf}
                onChangeText={setCpf}
                placeholder="999.999.999-99"
                mask="cpf"
                keyboardType="numeric"
                onFocus={() => {}}
              />
              
              <InputField
                label="Chave Pix"
                value={pix}
                onChangeText={setPix}
                placeholder="CPF, e-mail ou telefone"
                onFocus={handlePixFocus}
              />
            </View>

            <View style={styles.buttonContainer}>
              <BigButton
                title={isLoading ? "Obtendo localização..." : "Obter localização GPS"}
                onPress={getLocation}
                disabled={isLoading || !isFormValid}
              />
              
              <BigButton
                title="Voltar"
                onPress={() => router.back()}
                variant="outline"
              />
            </View>
            
            {/* Espaço extra para evitar que o teclado cubra os campos */}
            <View style={styles.keyboardSpacer} />
          </ScrollView>

          <AddressConfirmDialog
            visible={showAddressDialog}
            address={address}
            onConfirm={handleAddressConfirm}
            onReject={handleAddressReject}
            onManualInput={handleManualAddress}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1B3A4B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B8E23',
    marginBottom: 32,
  },
  form: {
    gap: 8,
  },
  buttonContainer: {
    marginTop: 32,
    gap: 16,
  },
  keyboardSpacer: {
    height: 150,
  },
});
