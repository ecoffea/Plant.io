import { View, Text, StyleSheet, FlatList, Pressable, Modal, TextInput, Alert, Platform, Image, Animated, ScrollView, Linking } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { ScreenContainer } from '@/components/screen-container';
import { BigButton } from '@/components/big-button';
import { useUser, Transaction } from '@/lib/user-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Trip {
  id: string;
  origin: string;
  destination: string;
  product: string;
  quantity: string;
  distance: number;
  value: number;
  status: 'available' | 'accepted' | 'at_pickup' | 'in_transit' | 'delivered';
  paymentConfirmed: boolean;
  selfieUri?: string;
  productPhotoUri?: string;
  advanceRequested?: boolean;
}

const PIX_KEY = '85982019013';
const BITCOIN_KEY = 'bc1qmfrmgwtz4d6p6ennsz0qnhhxvxh24wgtu97gf7';

export default function DriverHomeScreen() {
  const router = useRouter();
  const { userData, resetUser, addTransaction } = useUser();
  const [activeTab, setActiveTab] = useState<'trips' | 'history'>('trips');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [showTripModal, setShowTripModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    loadTrips();
    startLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const loadTrips = async () => {
    try {
      const storedTrips = await AsyncStorage.getItem('plantio_trips');
      if (storedTrips) {
        const parsedTrips = JSON.parse(storedTrips);
        // Ordenar por valor (mais caro primeiro) e filtrar apenas com pagamento confirmado
        const sortedTrips = parsedTrips.sort((a: Trip, b: Trip) => b.value - a.value);
        setTrips(sortedTrips);
      }
    } catch (error) {
      console.log('Erro ao carregar viagens:', error);
    }
  };

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos da sua localização para rastrear a viagem.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });

      await saveDriverLocation(location.coords.latitude, location.coords.longitude);

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 50,
        },
        async (newLocation) => {
          setCurrentLocation({
            lat: newLocation.coords.latitude,
            lng: newLocation.coords.longitude,
          });
          await saveDriverLocation(newLocation.coords.latitude, newLocation.coords.longitude);
        }
      );
      setLocationSubscription(sub);
    } catch (error) {
      console.log('Erro ao iniciar rastreamento:', error);
    }
  };

  const saveDriverLocation = async (lat: number, lng: number) => {
    try {
      const driverLocations = await AsyncStorage.getItem('plantio_driver_locations');
      const locations = driverLocations ? JSON.parse(driverLocations) : {};
      locations[userData.cpf || 'unknown'] = {
        name: userData.name,
        lat,
        lng,
        lastUpdate: new Date().toISOString(),
        currentTrip: activeTrip?.id || null,
      };
      await AsyncStorage.setItem('plantio_driver_locations', JSON.stringify(locations));
    } catch (error) {
      console.log('Erro ao salvar localização:', error);
    }
  };

  const handleLogout = async () => {
    if (locationSubscription) {
      locationSubscription.remove();
    }
    await resetUser();
    router.replace('/');
  };



  const openGoogleMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address + ', Ceará, Brasil');
    const url = Platform.select({
      ios: `maps://app?daddr=${encodedAddress}`,
      android: `google.navigation:q=${encodedAddress}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`,
    });
    
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback para URL web
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`);
      }
    });
  };

  const handleAcceptTrip = (trip: Trip) => {
    if (!trip.paymentConfirmed) {
      Alert.alert('Aguardando pagamento', 'Esta viagem ainda não teve o pagamento confirmado.');
      return;
    }
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    Alert.alert(
      'Aceitar Viagem',
      `Deseja aceitar a viagem de ${trip.origin} para ${trip.destination}?\n\nVocê recebe: R$ ${trip.value.toFixed(2)}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Aceitar', 
          onPress: () => {
            const updatedTrip = { ...trip, status: 'accepted' as const };
            setActiveTrip(updatedTrip);
            updateTripStatus(trip.id, 'accepted');
            setShowTripModal(true);
            
            // Abrir Google Maps com endereço do produtor
            Alert.alert(
              'Navegação',
              'Deseja abrir o Google Maps para navegar até o produtor?',
              [
                { text: 'Depois', style: 'cancel' },
                { text: 'Abrir Maps', onPress: () => openGoogleMaps(trip.origin) }
              ]
            );
          }
        },
      ]
    );
  };

  const updateTripStatus = async (tripId: string, status: Trip['status']) => {
    const updatedTrips = trips.map(t => 
      t.id === tripId ? { ...t, status } : t
    );
    setTrips(updatedTrips);
    await AsyncStorage.setItem('plantio_trips', JSON.stringify(updatedTrips));
  };

  const handleTakeSelfie = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para tirar a selfie.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      cameraType: ImagePicker.CameraType.front,
    });

    if (!result.canceled && activeTrip) {
      const updatedTrip = { ...activeTrip, selfieUri: result.assets[0].uri };
      setActiveTrip(updatedTrip);
      await saveTripPhoto('selfie', result.assets[0].uri);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  const handleArrivedAtPickup = () => {
    if (!activeTrip?.selfieUri) {
      Alert.alert('Selfie obrigatória', 'Por favor, tire uma selfie antes de continuar.');
      return;
    }
    
    Alert.alert(
      'Chegou ao Produtor',
      'Quando chegar ao produtor, clique no botão "Tirar foto do produto" para registrar a carga.',
      [{ text: 'OK' }]
    );
    
    const updatedTrip = { ...activeTrip, status: 'at_pickup' as const };
    setActiveTrip(updatedTrip);
    updateTripStatus(activeTrip.id, 'at_pickup');
  };

  const handleTakeProductPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para tirar a foto.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && activeTrip) {
      const updatedTrip = { ...activeTrip, productPhotoUri: result.assets[0].uri, status: 'in_transit' as const };
      setActiveTrip(updatedTrip);
      await saveTripPhoto('product', result.assets[0].uri);
      updateTripStatus(activeTrip.id, 'in_transit');
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Alert.alert('Foto registrada', 'Agora você pode iniciar o transporte até o destino final.');
    }
  };

  const saveTripPhoto = async (type: 'selfie' | 'product', uri: string) => {
    try {
      const tripPhotos = await AsyncStorage.getItem('plantio_trip_photos');
      const photos = tripPhotos ? JSON.parse(tripPhotos) : {};
      
      if (!photos[activeTrip?.id || 'unknown']) {
        photos[activeTrip?.id || 'unknown'] = {};
      }
      
      photos[activeTrip?.id || 'unknown'][type] = {
        uri,
        driverCpf: userData.cpf,
        driverName: userData.name,
        timestamp: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem('plantio_trip_photos', JSON.stringify(photos));
    } catch (error) {
      console.log('Erro ao salvar foto:', error);
    }
  };

  const handleArrivedAtDestination = () => {
    if (!activeTrip) return;
    
    Alert.alert(
      'Confirmar Entrega',
      'Você chegou ao destino final. Confirmar entrega do produto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: async () => {
            const updatedTrip = { ...activeTrip, status: 'delivered' as const };
            setActiveTrip(updatedTrip);
            updateTripStatus(activeTrip.id, 'delivered');
            
            addTransaction({
              type: 'delivery',
              product: activeTrip.product,
              quantity: activeTrip.quantity,
              value: activeTrip.value,
              status: 'pending',
            });
            
            Alert.alert(
              'Entrega Concluída',
              'Aguarde a confirmação do administrador para receber o pagamento.',
              [{ text: 'OK', onPress: () => {
                setShowTripModal(false);
                setActiveTrip(null);
              }}]
            );
          }
        },
      ]
    );
  };

  const handleRequestAdvance = async () => {
    if (!activeTrip) return;
    
    if (activeTrip.value < 500) {
      Alert.alert('Não disponível', 'Adiantamento disponível apenas para viagens acima de R$500.');
      return;
    }
    
    const advanceAmount = activeTrip.value * 0.5;
    
    Alert.alert(
      'Solicitar Adiantamento',
      `Deseja solicitar 50% de adiantamento?\n\nValor: R$ ${advanceAmount.toFixed(2)}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Solicitar', 
          onPress: async () => {
            try {
              const advances = await AsyncStorage.getItem('plantio_advance_requests');
              const requests = advances ? JSON.parse(advances) : [];
              requests.push({
                id: Date.now().toString(),
                tripId: activeTrip.id,
                driverCpf: userData.cpf,
                driverName: userData.name,
                amount: advanceAmount,
                tripValue: activeTrip.value,
                status: 'pending',
                requestedAt: new Date().toISOString(),
              });
              await AsyncStorage.setItem('plantio_advance_requests', JSON.stringify(requests));
              
              const updatedTrip = { ...activeTrip, advanceRequested: true };
              setActiveTrip(updatedTrip);
              
              Alert.alert('Solicitação Enviada', 'O administrador foi notificado. Aguarde a confirmação.');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível solicitar o adiantamento.');
            }
          }
        },
      ]
    );
  };

  const copyPixKey = async () => {
    await Clipboard.setStringAsync(PIX_KEY);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert('Copiado!', 'Chave PIX copiada para a área de transferência.');
  };

  const copyBitcoinKey = async () => {
    await Clipboard.setStringAsync(BITCOIN_KEY);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert('Copiado!', 'Endereço Bitcoin copiado para a área de transferência.');
  };

  const renderTrip = ({ item }: { item: Trip }) => {
    // Só mostrar viagens disponíveis com pagamento confirmado
    if (item.status !== 'available' || !item.paymentConfirmed) return null;
    
    return (
      <View style={styles.tripCard}>
        <View style={styles.tripRoute}>
          <Text style={styles.tripOrigin}>{item.origin}</Text>
          <Text style={styles.tripArrow}>→</Text>
          <Text style={styles.tripDestination}>{item.destination}</Text>
        </View>
        
        <View style={styles.tripDetails}>
          <Text style={styles.tripProduct}>{item.quantity} de {item.product}</Text>
        </View>
        
        <View style={styles.tripFooter}>
          <Text style={styles.tripValue}>R$ {item.value.toFixed(2)}</Text>
          <Pressable 
            style={styles.acceptButton}
            onPress={() => handleAcceptTrip(item)}
          >
            <Text style={styles.acceptButtonText}>Iniciar Transporte</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionProduct}>{item.product}</Text>
        <Text style={styles.transactionQuantity}>{item.quantity}</Text>
        <Text style={styles.transactionDate}>
          {new Date(item.date).toLocaleDateString('pt-BR')}
        </Text>
      </View>
      <View style={styles.transactionValue}>
        <Text style={styles.transactionPrice}>R$ {item.value.toFixed(2)}</Text>
        <Text style={[styles.transactionStatus, 
          item.status === 'completed' && styles.statusCompleted
        ]}>
          {item.status === 'pending' ? 'Pendente' : 
           item.status === 'completed' ? 'Concluído' : 'Cancelado'}
        </Text>
      </View>
    </View>
  );

  // Ordenar viagens por valor (maior para menor) e filtrar disponíveis com pagamento
  const availableTrips = trips
    .filter(t => t.status === 'available' && t.paymentConfirmed)
    .sort((a, b) => b.value - a.value);

  return (
    <ScreenContainer>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Bem-vindo,</Text>
            <Text style={styles.headerTitle}>{userData.name || 'Motorista'}</Text>
          </View>
          <View style={styles.headerButtons}>
            <Pressable onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Sair</Text>
            </Pressable>
          </View>
        </View>

        {currentLocation && (
          <View style={styles.locationBanner}>
            <Text style={styles.locationText}>📍 GPS Ativo</Text>
          </View>
        )}

        <View style={styles.tabBar}>
          <Pressable
            onPress={() => setActiveTab('trips')}
            style={[styles.tab, activeTab === 'trips' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'trips' && styles.tabTextActive]}>
              Viagens
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('history')}
            style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              Histórico
            </Text>
          </Pressable>
        </View>

        {activeTab === 'trips' ? (
          <View style={styles.content}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Viagens Disponíveis</Text>
              <Text style={styles.sectionSubtitle}>Ordenadas por valor (maior primeiro)</Text>
            </View>
            <FlatList
              data={availableTrips}
              renderItem={renderTrip}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Nenhuma viagem disponível</Text>
                  <Text style={styles.emptySubtext}>Aguarde novas solicitações</Text>
                </View>
              }
            />
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Histórico de Entregas</Text>
            </View>
            <FlatList
              data={userData.transactions?.filter(t => t.type === 'delivery') || []}
              renderItem={renderTransaction}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Nenhuma entrega realizada</Text>
                </View>
              }
            />
          </View>
        )}

        {/* Modal de Viagem Ativa */}
        <Modal
          visible={showTripModal}
          transparent
          animationType="slide"
          onRequestClose={() => {}}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {activeTrip && (
                <>
                  <Text style={styles.modalTitle}>Viagem em Andamento</Text>
                  
                  <View style={styles.tripInfo}>
                    <Text style={styles.tripInfoRoute}>
                      {activeTrip.origin} → {activeTrip.destination}
                    </Text>
                    <Text style={styles.tripInfoProduct}>
                      {activeTrip.quantity} de {activeTrip.product}
                    </Text>
                    <Text style={styles.tripInfoValue}>
                      Você recebe: R$ {activeTrip.value.toFixed(2)}
                    </Text>
                    
                    {/* Botões de navegação */}
                    <View style={styles.navigationButtons}>
                      {activeTrip.status !== 'in_transit' && activeTrip.status !== 'delivered' && (
                        <Pressable 
                          style={styles.mapsButton}
                          onPress={() => openGoogleMaps(activeTrip.origin)}
                        >
                          <Text style={styles.mapsButtonText}>Navegar até Produtor</Text>
                        </Pressable>
                      )}
                      {(activeTrip.status === 'in_transit' || activeTrip.status === 'at_pickup') && (
                        <Pressable 
                          style={[styles.mapsButton, styles.mapsButtonSecondary]}
                          onPress={() => openGoogleMaps(activeTrip.destination)}
                        >
                          <Text style={styles.mapsButtonText}>Navegar até Consumidor</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>

                  <View style={styles.stepsContainer}>
                    {/* Step 1: Selfie */}
                    <View style={[styles.step, activeTrip.selfieUri && styles.stepCompleted]}>
                      <Text style={styles.stepNumber}>1</Text>
                      <Text style={styles.stepText}>Selfie do Motorista</Text>
                      {!activeTrip.selfieUri ? (
                        <BigButton title="Tirar Selfie" onPress={handleTakeSelfie} />
                      ) : (
                        <View style={styles.photoPreview}>
                          <Image source={{ uri: activeTrip.selfieUri }} style={styles.previewImage} />
                          <Text style={styles.checkmark}>✓</Text>
                        </View>
                      )}
                    </View>

                    {/* Step 2: Chegou ao produtor */}
                    {activeTrip.selfieUri && activeTrip.status === 'accepted' && (
                      <View style={styles.step}>
                        <Text style={styles.stepNumber}>2</Text>
                        <Text style={styles.stepText}>Chegou ao Produtor</Text>
                        <BigButton title="Cheguei no destino de busca" onPress={handleArrivedAtPickup} />
                      </View>
                    )}

                    {/* Step 3: Foto do produto */}
                    {activeTrip.status === 'at_pickup' && (
                      <View style={[styles.step, activeTrip.productPhotoUri && styles.stepCompleted]}>
                        <Text style={styles.stepNumber}>3</Text>
                        <Text style={styles.stepText}>Foto do Produto</Text>
                        {!activeTrip.productPhotoUri ? (
                          <BigButton title="Tirar foto do produto" onPress={handleTakeProductPhoto} />
                        ) : (
                          <View style={styles.photoPreview}>
                            <Image source={{ uri: activeTrip.productPhotoUri }} style={styles.previewImage} />
                            <Text style={styles.checkmark}>✓</Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Step 4: Chegou ao destino */}
                    {activeTrip.status === 'in_transit' && (
                      <View style={styles.step}>
                        <Text style={styles.stepNumber}>4</Text>
                        <Text style={styles.stepText}>Destino Final</Text>
                        <BigButton title="Cheguei no destino de entrega" onPress={handleArrivedAtDestination} />
                      </View>
                    )}
                  </View>

                  {/* Adiantamento */}
                  {activeTrip.value >= 500 && !activeTrip.advanceRequested && activeTrip.status !== 'delivered' && (
                    <View style={styles.advanceContainer}>
                      <BigButton 
                        title={`Solicitar Adiantamento de 50% (R$ ${(activeTrip.value * 0.5).toFixed(2)})`}
                        onPress={handleRequestAdvance}
                        variant="outline"
                      />
                    </View>
                  )}

                  {activeTrip.advanceRequested && (
                    <View style={styles.advanceStatus}>
                      <Text style={styles.advanceStatusText}>
                        ⏳ Adiantamento solicitado - Aguardando confirmação
                      </Text>
                    </View>
                  )}

                  {/* Formas de Recebimento */}
                  <View style={styles.paymentMethodsContainer}>
                    <View style={styles.pixContainer}>
                      <Text style={styles.pixLabel}>PIX para recebimento:</Text>
                      <View style={styles.pixKeyContainer}>
                        <Text style={styles.pixKey}>(85) 98201-9013</Text>
                        <Pressable style={styles.copyButton} onPress={copyPixKey}>
                          <Text style={styles.copyButtonText}>Copiar</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.bitcoinContainer}>
                      <Text style={styles.bitcoinLabel}>Bitcoin:</Text>
                      <View style={styles.bitcoinKeyContainer}>
                        <Text style={styles.bitcoinKey} numberOfLines={2}>bc1qmfrmgwtz4d6p6ennsz0qnhhxvxh24wgtu97gf7</Text>
                        <Pressable style={styles.copyButton} onPress={copyBitcoinKey}>
                          <Text style={styles.copyButtonText}>Copiar</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: '#6B8E23',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1B3A4B',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },

  logoutButton: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  logoutText: {
    color: '#F44336',
    fontWeight: '600',
    fontSize: 14,
  },
  locationBanner: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    paddingHorizontal: 24,
    marginHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  locationText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  tabActive: {
    backgroundColor: '#8BC34A',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B3A4B',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 16,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tripRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripOrigin: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B3A4B',
    flex: 1,
  },
  tripArrow: {
    fontSize: 18,
    color: '#8BC34A',
    marginHorizontal: 12,
  },
  tripDestination: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B3A4B',
    flex: 1,
    textAlign: 'right',
  },
  tripDetails: {
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  tripProduct: {
    fontSize: 14,
    color: '#666',
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#8BC34A',
  },
  acceptButton: {
    backgroundColor: '#8BC34A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionProduct: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1B3A4B',
  },
  transactionQuantity: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  transactionValue: {
    alignItems: 'flex-end',
  },
  transactionPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8BC34A',
  },
  transactionStatus: {
    fontSize: 11,
    color: '#FF9800',
    marginTop: 4,
  },
  statusCompleted: {
    color: '#4CAF50',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#BBB',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1B3A4B',
    marginBottom: 20,
    textAlign: 'center',
  },
  tripInfo: {
    backgroundColor: '#F5F9F0',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  tripInfoRoute: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B3A4B',
    marginBottom: 8,
  },
  tripInfoProduct: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  tripInfoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8BC34A',
  },
  stepsContainer: {
    gap: 16,
  },
  step: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
  },
  stepCompleted: {
    backgroundColor: '#E8F5E9',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8BC34A',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B3A4B',
    marginBottom: 12,
  },
  photoPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  checkmark: {
    fontSize: 24,
    color: '#4CAF50',
  },
  advanceContainer: {
    marginTop: 20,
  },
  advanceStatus: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  advanceStatusText: {
    color: '#FF9800',
    fontSize: 12,
    textAlign: 'center',
  },
  pixContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F5F9F0',
    borderRadius: 12,
  },
  pixLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1B3A4B',
    marginBottom: 10,
  },
  pixKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pixKey: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1B3A4B',
  },
  copyButton: {
    backgroundColor: '#8BC34A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  mapsButton: {
    flex: 1,
    backgroundColor: '#1B3A4B',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  mapsButtonSecondary: {
    backgroundColor: '#8BC34A',
  },
  mapsButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  paymentMethodsContainer: {
    gap: 12,
    marginTop: 16,
  },
  bitcoinContainer: {
    padding: 16,
    backgroundColor: '#F5F9F0',
    borderRadius: 12,
  },
  bitcoinLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1B3A4B',
    marginBottom: 8,
  },
  bitcoinKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bitcoinKey: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1B3A4B',
  },
});
