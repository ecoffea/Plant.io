import { View, Text, StyleSheet, FlatList, Pressable, Modal, Alert, Platform, Image, Animated, ScrollView, TextInput } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenContainer } from '@/components/screen-container';
import { BigButton } from '@/components/big-button';
import { InputField } from '@/components/input-field';
import { productsDatabase, ProductData } from '@/lib/products-data';

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
  consumerPaid?: boolean;
  producerPaid?: boolean;
  driverPaid?: boolean;
}

interface AdvanceRequest {
  id: string;
  tripId: string;
  driverCpf: string;
  driverName: string;
  amount: number;
  tripValue: number;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

interface UserLocation {
  name: string;
  lat: number;
  lng: number;
  lastUpdate: string;
  currentTrip: string | null;
}

interface RegisteredUser {
  name: string;
  phone: string;
  cpf: string;
  pix: string;
  address: string;
  latitude?: number;
  longitude?: number;
  profile?: string;
  registeredAt: string;
}

interface Transaction {
  id: string;
  type: 'purchase' | 'sale' | 'delivery';
  product: string;
  quantity: string;
  value: number;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
  userCpf?: string;
  userName?: string;
  userProfile?: string;
}

interface TripPhoto {
  uri: string;
  driverCpf: string;
  driverName: string;
  timestamp: string;
}

interface PaymentRequest {
  id: string;
  type: 'consumer' | 'producer' | 'driver';
  userCpf: string;
  userName: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'rejected';
  requestedAt: string;
  tripId?: string;
}

type AdminTab = 'cotacoes' | 'usuarios' | 'transacoes' | 'adiantamentos' | 'fotos' | 'pagamentos';

// Cores por categoria de usuário
const PROFILE_COLORS = {
  consumer: { bg: '#E3F2FD', border: '#2196F3', text: '#1565C0' },
  producer: { bg: '#E8F5E9', border: '#4CAF50', text: '#2E7D32' },
  driver: { bg: '#FFF3E0', border: '#FF9800', text: '#E65100' },
};

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('cotacoes');
  const [products, setProducts] = useState<ProductData[]>([...productsDatabase]);
  const [advanceRequests, setAdvanceRequests] = useState<AdvanceRequest[]>([]);
  const [users, setUsers] = useState<Record<string, RegisteredUser>>({});
  const [driverLocations, setDriverLocations] = useState<Record<string, UserLocation>>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tripPhotos, setTripPhotos] = useState<Record<string, { selfie?: TripPhoto; product?: TripPhoto }>>({});
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  
  // Filtros e busca
  const [searchText, setSearchText] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [profileFilter, setProfileFilter] = useState<'all' | 'consumer' | 'producer' | 'driver'>('all');
  const [userSuggestions, setUserSuggestions] = useState<RegisteredUser[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [selectedProductImage, setSelectedProductImage] = useState<string>('');
  
  // Form states
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productUnit, setProductUnit] = useState('Kg');
  const [productTrend, setProductTrend] = useState<'up' | 'down'>('up');
  const [productImage, setProductImage] = useState('');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    
    loadData();
    
    const interval = setInterval(() => {
      loadData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const storedAdvances = await AsyncStorage.getItem('plantio_advance_requests');
      if (storedAdvances) {
        setAdvanceRequests(JSON.parse(storedAdvances));
      }
      
      const storedUsers = await AsyncStorage.getItem('plantio_registered_users');
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      }
      
      const storedLocations = await AsyncStorage.getItem('plantio_driver_locations');
      if (storedLocations) {
        setDriverLocations(JSON.parse(storedLocations));
      }
      
      const storedTransactions = await AsyncStorage.getItem('plantio_all_transactions');
      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      }
      
      const storedPhotos = await AsyncStorage.getItem('plantio_trip_photos');
      if (storedPhotos) {
        setTripPhotos(JSON.parse(storedPhotos));
      }
      
      const storedPayments = await AsyncStorage.getItem('plantio_payment_requests');
      if (storedPayments) {
        setPaymentRequests(JSON.parse(storedPayments));
      }
    } catch (error) {
      console.log('Erro ao carregar dados:', error);
    }
  };

  const handleLogout = () => {
    router.replace('/');
  };

  // Funções de cotações
  const handleEditProduct = (product: ProductData) => {
    setEditingProduct(product);
    setProductName(product.name);
    setProductPrice(product.price.toString());
    setProductUnit(product.unit);
    setProductTrend(product.trend);
    setProductImage(product.image);
    setShowProductModal(true);
  };

  const handlePickProductImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProductImage(result.assets[0].uri);
    }
  };

  const handleSaveProduct = async () => {
    if (!productName || !productPrice) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    const updatedProducts = products.map(p => {
      if (p.id === editingProduct?.id) {
        return {
          ...p,
          name: productName,
          price: parseFloat(productPrice),
          unit: productUnit,
          trend: productTrend,
          image: productImage || p.image,
        };
      }
      return p;
    });

    setProducts(updatedProducts);
    setShowProductModal(false);
    setEditingProduct(null);
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    Alert.alert('Sucesso', 'Cotação atualizada com sucesso!');
  };

  // Funções de usuários
  const handleDeleteUser = async (cpf: string) => {
    Alert.alert(
      'Excluir Cadastro',
      'Deseja realmente excluir este usuário?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const updatedUsers = { ...users };
            delete updatedUsers[cpf];
            setUsers(updatedUsers);
            await AsyncStorage.setItem('plantio_registered_users', JSON.stringify(updatedUsers));
            Alert.alert('Sucesso', 'Usuário excluído');
          },
        },
      ]
    );
  };

  // Funções de pagamento
  const handleConfirmPayment = async (request: PaymentRequest) => {
    const profileLabel = request.type === 'consumer' ? 'Consumidor' : 
                         request.type === 'producer' ? 'Produtor' : 'Motorista';
    
    Alert.alert(
      'Confirmar Pagamento',
      `${profileLabel} ${request.userName} realizou pagamento de R$${request.amount.toFixed(2)}?`,
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim',
          onPress: async () => {
            const updatedRequests = paymentRequests.map(r => {
              if (r.id === request.id) {
                return { ...r, status: 'confirmed' as const };
              }
              return r;
            });
            
            setPaymentRequests(updatedRequests);
            await AsyncStorage.setItem('plantio_payment_requests', JSON.stringify(updatedRequests));
            
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            
            Alert.alert('Sucesso', `Pagamento confirmado para ${request.userName}`);
          },
        },
      ]
    );
  };

  // Funções de adiantamento
  const handleApproveAdvance = async (request: AdvanceRequest) => {
    const updatedRequests = advanceRequests.map(r => {
      if (r.id === request.id) {
        return { ...r, status: 'approved' as const };
      }
      return r;
    });
    
    setAdvanceRequests(updatedRequests);
    await AsyncStorage.setItem('plantio_advance_requests', JSON.stringify(updatedRequests));
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    Alert.alert('Sucesso', `Adiantamento de R$${request.amount.toFixed(2)} aprovado para ${request.driverName}`);
  };

  const handleRejectAdvance = async (request: AdvanceRequest) => {
    const updatedRequests = advanceRequests.map(r => {
      if (r.id === request.id) {
        return { ...r, status: 'rejected' as const };
      }
      return r;
    });
    
    setAdvanceRequests(updatedRequests);
    await AsyncStorage.setItem('plantio_advance_requests', JSON.stringify(updatedRequests));
    
    Alert.alert('Adiantamento rejeitado');
  };

  // Busca inteligente com sugestões
  const handleSearchChange = (text: string) => {
    setSearchText(text);
    
    if (activeTab === 'usuarios' && text.length >= 2) {
      const suggestions = Object.values(users).filter(user => 
        user.name.toLowerCase().includes(text.toLowerCase())
      ).slice(0, 5);
      setUserSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setUserSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectUserSuggestion = (user: RegisteredUser) => {
    setSearchText(user.name);
    setShowSuggestions(false);
  };

  // Filtrar dados
  const filterBySearch = <T extends { [key: string]: any }>(items: T[], keys: string[]): T[] => {
    if (!searchText.trim()) return items;
    const search = searchText.toLowerCase();
    return items.filter(item => 
      keys.some(key => {
        const value = item[key];
        return value && String(value).toLowerCase().includes(search);
      })
    );
  };

  const filterByDate = <T extends { date?: string; requestedAt?: string; registeredAt?: string }>(items: T[]): T[] => {
    if (!dateFilter) return items;
    return items.filter(item => {
      const itemDate = item.date || item.requestedAt || item.registeredAt;
      if (!itemDate) return true;
      return itemDate.startsWith(dateFilter);
    });
  };

  const filterByProfile = (items: [string, RegisteredUser][]): [string, RegisteredUser][] => {
    if (profileFilter === 'all') return items;
    return items.filter(([_, user]) => user.profile === profileFilter);
  };

  const getProfileColor = (profile?: string) => {
    if (profile === 'consumer') return PROFILE_COLORS.consumer;
    if (profile === 'producer') return PROFILE_COLORS.producer;
    if (profile === 'driver') return PROFILE_COLORS.driver;
    return { bg: '#F5F5F5', border: '#E0E0E0', text: '#666' };
  };

  const renderProduct = ({ item }: { item: ProductData }) => (
    <View style={styles.itemCard}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>R$ {item.price.toFixed(2)}/{item.unit}</Text>
        <Text style={[styles.itemTrend, item.trend === 'up' ? styles.trendUp : styles.trendDown]}>
          {item.trend === 'up' ? '↑ Subindo' : '↓ Baixando'}
        </Text>
      </View>
      <Pressable style={styles.editButton} onPress={() => handleEditProduct(item)}>
        <Text style={styles.editButtonText}>Editar</Text>
      </Pressable>
    </View>
  );

  const renderUser = ({ item }: { item: [string, RegisteredUser] }) => {
    const [cpf, user] = item;
    const location = driverLocations[cpf];
    const colors = getProfileColor(user.profile);
    
    return (
      <View style={[styles.userCard, { backgroundColor: colors.bg, borderColor: colors.border }]}>
        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
            <View style={[styles.profileBadge, { backgroundColor: colors.border }]}>
              <Text style={styles.profileBadgeText}>
                {user.profile === 'consumer' ? 'Consumidor' : 
                 user.profile === 'producer' ? 'Produtor' : 
                 user.profile === 'driver' ? 'Motorista' : 'N/D'}
              </Text>
            </View>
          </View>
          <Text style={styles.userDetail}>CPF: {cpf}</Text>
          <Text style={styles.userDetail}>Tel: {user.phone}</Text>
          <Text style={styles.userDetail}>PIX: {user.pix}</Text>
          {user.address && (
            <Text style={styles.userDetail}>Endereço: {user.address}</Text>
          )}
          {location && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </Text>
              <Text style={styles.locationTime}>
                Atualizado: {new Date(location.lastUpdate).toLocaleString('pt-BR')}
              </Text>
            </View>
          )}
        </View>
        <Pressable style={styles.deleteUserButton} onPress={() => handleDeleteUser(cpf)}>
          <Text style={styles.deleteUserText}>Excluir</Text>
        </Pressable>
      </View>
    );
  };

  const renderAdvanceRequest = ({ item }: { item: AdvanceRequest }) => (
    <View style={[styles.advanceCard, item.status === 'pending' && styles.advancePending]}>
      <View style={styles.advanceInfo}>
        <Text style={styles.advanceName}>{item.driverName}</Text>
        <Text style={styles.advanceAmount}>Solicitado: R$ {item.amount.toFixed(2)}</Text>
        <Text style={styles.advanceTrip}>Viagem: R$ {item.tripValue.toFixed(2)}</Text>
        <Text style={styles.advanceDate}>
          {new Date(item.requestedAt).toLocaleString('pt-BR')}
        </Text>
        <Text style={[styles.advanceStatus,
          item.status === 'approved' && styles.statusApproved,
          item.status === 'rejected' && styles.statusRejected
        ]}>
          {item.status === 'pending' ? '⏳ Pendente' : 
           item.status === 'approved' ? '✅ Aprovado' : '❌ Rejeitado'}
        </Text>
      </View>
      {item.status === 'pending' && (
        <View style={styles.advanceActions}>
          <Pressable 
            style={styles.approveButton} 
            onPress={() => handleApproveAdvance(item)}
          >
            <Text style={styles.approveText}>Aprovar</Text>
          </Pressable>
          <Pressable 
            style={styles.rejectButton} 
            onPress={() => handleRejectAdvance(item)}
          >
            <Text style={styles.rejectText}>Rejeitar</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const colors = getProfileColor(item.userProfile);
    return (
      <View style={[styles.transactionCard, { borderLeftWidth: 4, borderLeftColor: colors.border }]}>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionType}>
            {item.type === 'purchase' ? '🛒 Compra' : 
             item.type === 'sale' ? '💰 Venda' : '🚚 Entrega'}
          </Text>
          <Text style={styles.transactionProduct}>{item.product}</Text>
          <Text style={styles.transactionQuantity}>{item.quantity}</Text>
          {item.userName && (
            <Text style={[styles.transactionUser, { color: colors.text }]}>
              {item.userName}
            </Text>
          )}
          <Text style={styles.transactionDate}>
            {new Date(item.date).toLocaleString('pt-BR')}
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
  };

  const renderPaymentRequest = ({ item }: { item: PaymentRequest }) => {
    const colors = getProfileColor(item.type);
    return (
      <View style={[styles.paymentCard, item.status === 'pending' && styles.paymentPending, { borderLeftWidth: 4, borderLeftColor: colors.border }]}>
        <View style={styles.paymentInfo}>
          <View style={[styles.profileBadge, { backgroundColor: colors.border }]}>
            <Text style={styles.profileBadgeText}>
              {item.type === 'consumer' ? 'Consumidor' : 
               item.type === 'producer' ? 'Produtor' : 'Motorista'}
            </Text>
          </View>
          <Text style={styles.paymentName}>{item.userName}</Text>
          <Text style={styles.paymentAmount}>R$ {item.amount.toFixed(2)}</Text>
          <Text style={styles.paymentDate}>
            {new Date(item.requestedAt).toLocaleString('pt-BR')}
          </Text>
        </View>
        {item.status === 'pending' && (
          <Pressable 
            style={styles.confirmPaymentButton} 
            onPress={() => handleConfirmPayment(item)}
          >
            <Text style={styles.confirmPaymentText}>Confirmar</Text>
          </Pressable>
        )}
        {item.status === 'confirmed' && (
          <Text style={styles.paymentConfirmed}>✅ Confirmado</Text>
        )}
      </View>
    );
  };

  const renderTripPhoto = ({ item }: { item: [string, { selfie?: TripPhoto; product?: TripPhoto }] }) => {
    const [tripId, photos] = item;
    
    return (
      <View style={styles.photoCard}>
        <Text style={styles.photoTripId}>Viagem #{tripId}</Text>
        {photos.selfie && (
          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>Selfie do Motorista</Text>
            <Image source={{ uri: photos.selfie.uri }} style={styles.photoImage} />
            <Text style={styles.photoInfo}>
              {photos.selfie.driverName} - {new Date(photos.selfie.timestamp).toLocaleString('pt-BR')}
            </Text>
          </View>
        )}
        {photos.product && (
          <View style={styles.photoSection}>
            <Text style={styles.photoLabel}>Foto do Produto</Text>
            <Image source={{ uri: photos.product.uri }} style={styles.photoImage} />
            <Text style={styles.photoInfo}>
              {new Date(photos.product.timestamp).toLocaleString('pt-BR')}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const pendingAdvances = advanceRequests.filter(r => r.status === 'pending');
  const pendingPayments = paymentRequests.filter(r => r.status === 'pending');

  // Aplicar filtros
  const filteredProducts = filterBySearch(products, ['name']);
  const filteredUsers = filterByProfile(filterBySearch(Object.entries(users), ['1.name', '1.phone', '0']));
  const filteredTransactions = filterByDate(filterBySearch(transactions, ['product', 'userName']));
  const filteredAdvances = filterByDate(filterBySearch(advanceRequests, ['driverName']));
  const filteredPayments = filterByDate(filterBySearch(paymentRequests, ['userName']));
  const filteredPhotos = filterBySearch(Object.entries(tripPhotos), ['0']);

  return (
    <ScreenContainer>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Painel Administrativo</Text>
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Sair</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          <View style={styles.tabBar}>
            {[
              { key: 'cotacoes', label: 'Cotações' },
              { key: 'usuarios', label: 'Usuários' },
              { key: 'transacoes', label: 'Transações' },
              { key: 'adiantamentos', label: `Adiant. ${pendingAdvances.length > 0 ? `(${pendingAdvances.length})` : ''}` },
              { key: 'pagamentos', label: `Pagam. ${pendingPayments.length > 0 ? `(${pendingPayments.length})` : ''}` },
              { key: 'fotos', label: 'Fotos' },
            ].map(tab => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key as AdminTab)}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Barra de busca e filtros */}
        <View style={styles.filterBar}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar..."
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={handleSearchChange}
              onFocus={() => setShowSuggestions(userSuggestions.length > 0)}
            />
            {showSuggestions && activeTab === 'usuarios' && (
              <View style={styles.suggestionsDropdown}>
                {userSuggestions.map((user, index) => (
                  <Pressable
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => selectUserSuggestion(user)}
                  >
                    <Text style={styles.suggestionName}>{user.name}</Text>
                    <Text style={styles.suggestionProfile}>
                      {user.profile === 'consumer' ? 'Consumidor' : 
                       user.profile === 'producer' ? 'Produtor' : 'Motorista'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          {activeTab !== 'cotacoes' && (
            <TextInput
              style={styles.dateInput}
              placeholder="Data (AAAA-MM)"
              placeholderTextColor="#999"
              value={dateFilter}
              onChangeText={setDateFilter}
            />
          )}
        </View>

        {/* Filtro por perfil (apenas na aba usuários) */}
        {activeTab === 'usuarios' && (
          <View style={styles.profileFilterBar}>
            {['all', 'consumer', 'producer', 'driver'].map(profile => (
              <Pressable
                key={profile}
                style={[
                  styles.profileFilterBtn,
                  profileFilter === profile && styles.profileFilterBtnActive,
                  profile !== 'all' && { backgroundColor: getProfileColor(profile).bg }
                ]}
                onPress={() => setProfileFilter(profile as any)}
              >
                <Text style={[
                  styles.profileFilterText,
                  profileFilter === profile && styles.profileFilterTextActive
                ]}>
                  {profile === 'all' ? 'Todos' : 
                   profile === 'consumer' ? 'Consumidor' : 
                   profile === 'producer' ? 'Produtor' : 'Motorista'}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.content}>
          {activeTab === 'cotacoes' && (
            <>
              <Text style={styles.sectionTitle}>Cotações de Produtos</Text>
              <Text style={styles.sectionSubtitle}>Toque para editar preços e fotos</Text>
              <FlatList
                data={filteredProducts}
                renderItem={renderProduct}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
              />
            </>
          )}

          {activeTab === 'usuarios' && (
            <>
              <Text style={styles.sectionTitle}>Usuários Cadastrados</Text>
              <Text style={styles.sectionSubtitle}>
                {Object.keys(users).length} usuários • {Object.keys(driverLocations).length} motoristas ativos
              </Text>
              <FlatList
                data={filteredUsers}
                renderItem={renderUser}
                keyExtractor={([cpf]) => cpf}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Nenhum usuário encontrado</Text>
                }
              />
            </>
          )}

          {activeTab === 'transacoes' && (
            <>
              <Text style={styles.sectionTitle}>Histórico de Transações</Text>
              <FlatList
                data={filteredTransactions}
                renderItem={renderTransaction}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Nenhuma transação encontrada</Text>
                }
              />
            </>
          )}

          {activeTab === 'adiantamentos' && (
            <>
              <Text style={styles.sectionTitle}>Solicitações de Adiantamento</Text>
              {pendingAdvances.length > 0 && (
                <Text style={styles.pendingAlert}>
                  ⚠️ {pendingAdvances.length} solicitação(ões) pendente(s)
                </Text>
              )}
              <FlatList
                data={filteredAdvances}
                renderItem={renderAdvanceRequest}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Nenhuma solicitação encontrada</Text>
                }
              />
            </>
          )}

          {activeTab === 'pagamentos' && (
            <>
              <Text style={styles.sectionTitle}>Confirmação de Pagamentos</Text>
              {pendingPayments.length > 0 && (
                <Text style={styles.pendingAlert}>
                  ⚠️ {pendingPayments.length} pagamento(s) aguardando confirmação
                </Text>
              )}
              <FlatList
                data={filteredPayments}
                renderItem={renderPaymentRequest}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Nenhum pagamento pendente</Text>
                }
              />
            </>
          )}

          {activeTab === 'fotos' && (
            <>
              <Text style={styles.sectionTitle}>Fotos das Viagens</Text>
              <Text style={styles.sectionSubtitle}>Selfies e fotos de produtos</Text>
              <FlatList
                data={filteredPhotos}
                renderItem={renderTripPhoto}
                keyExtractor={([tripId]) => tripId}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Nenhuma foto encontrada</Text>
                }
              />
            </>
          )}
        </View>

        {/* Modal de edição de produto */}
        <Modal visible={showProductModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Editar Cotação</Text>
                
                {/* Foto do produto */}
                <Pressable style={styles.productImagePicker} onPress={handlePickProductImage}>
                  {productImage ? (
                    <Image source={{ uri: productImage }} style={styles.productImagePreview} />
                  ) : (
                    <Text style={styles.productImagePlaceholder}>Toque para selecionar foto</Text>
                  )}
                </Pressable>
                
                <InputField
                  label="Produto"
                  value={productName}
                  onChangeText={setProductName}
                  placeholder="Nome do produto"
                />
                
                <InputField
                  label="Preço (R$)"
                  value={productPrice}
                  onChangeText={setProductPrice}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
                
                <InputField
                  label="Unidade"
                  value={productUnit}
                  onChangeText={setProductUnit}
                  placeholder="Kg, Unidade, Maço..."
                />

                <View style={styles.trendSelector}>
                  <Text style={styles.trendLabel}>Tendência:</Text>
                  <View style={styles.trendButtons}>
                    <Pressable
                      style={[styles.trendBtn, productTrend === 'up' && styles.trendBtnUp]}
                      onPress={() => setProductTrend('up')}
                    >
                      <Text style={[styles.trendBtnText, productTrend === 'up' && styles.trendBtnTextActive]}>
                        ↑ Subindo
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.trendBtn, productTrend === 'down' && styles.trendBtnDown]}
                      onPress={() => setProductTrend('down')}
                    >
                      <Text style={[styles.trendBtnText, productTrend === 'down' && styles.trendBtnTextActive]}>
                        ↓ Baixando
                      </Text>
                    </Pressable>
                  </View>
                </View>
                
                <View style={styles.modalButtons}>
                  <BigButton title="Salvar" onPress={handleSaveProduct} />
                  <Pressable 
                    style={styles.cancelButton} 
                    onPress={() => setShowProductModal(false)}
                  >
                    <Text style={styles.cancelText}>Cancelar</Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#C5E1A5',
    backgroundColor: '#1B3A4B',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF20',
    borderRadius: 8,
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  tabScroll: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#C5E1A5',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginHorizontal: 2,
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#8BC34A',
  },
  tabText: {
    fontSize: 12,
    color: '#6B8E23',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#1B3A4B',
    fontWeight: '700',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#F5F9F0',
  },
  searchContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 10,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#C5E1A5',
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C5E1A5',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  suggestionItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1B3A4B',
  },
  suggestionProfile: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  dateInput: {
    width: 130,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#C5E1A5',
  },
  profileFilterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    backgroundColor: '#F5F9F0',
  },
  profileFilterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  profileFilterBtnActive: {
    borderWidth: 2,
    borderColor: '#1B3A4B',
  },
  profileFilterText: {
    fontSize: 11,
    color: '#666',
  },
  profileFilterTextActive: {
    fontWeight: '700',
    color: '#1B3A4B',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B3A4B',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B8E23',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F9F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#C5E1A5',
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B3A4B',
  },
  itemPrice: {
    fontSize: 12,
    color: '#8BC34A',
    fontWeight: '600',
    marginTop: 2,
  },
  itemTrend: {
    fontSize: 12,
    marginTop: 2,
  },
  trendUp: {
    color: '#F44336',
  },
  trendDown: {
    color: '#4CAF50',
  },
  editButton: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#1B3A4B',
    fontWeight: '600',
    fontSize: 12,
  },
  userCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  profileBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  profileBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  userDetail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  locationInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 8,
  },
  locationText: {
    fontSize: 11,
    color: '#1B3A4B',
  },
  locationTime: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  deleteUserButton: {
    marginTop: 12,
    backgroundColor: '#FFEBEE',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteUserText: {
    color: '#F44336',
    fontWeight: '600',
  },
  advanceCard: {
    backgroundColor: '#F5F9F0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C5E1A5',
  },
  advancePending: {
    borderColor: '#FF9800',
    borderWidth: 2,
  },
  advanceInfo: {
    marginBottom: 12,
  },
  advanceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B3A4B',
  },
  advanceAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8BC34A',
    marginTop: 4,
  },
  advanceTrip: {
    fontSize: 12,
    color: '#6B8E23',
    marginTop: 2,
  },
  advanceDate: {
    fontSize: 12,
    color: '#A5D6A7',
    marginTop: 4,
  },
  advanceStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    color: '#FF9800',
  },
  statusApproved: {
    color: '#4CAF50',
  },
  statusRejected: {
    color: '#F44336',
  },
  advanceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  approveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FFEBEE',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  rejectText: {
    color: '#F44336',
    fontWeight: '700',
    fontSize: 15,
  },
  pendingAlert: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 15,
    color: '#E65100',
    fontWeight: '600',
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F9F0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#C5E1A5',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B3A4B',
  },
  transactionProduct: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B3A4B',
    marginTop: 2,
  },
  transactionQuantity: {
    fontSize: 14,
    color: '#6B8E23',
  },
  transactionUser: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 11,
    color: '#A5D6A7',
    marginTop: 4,
  },
  transactionValue: {
    alignItems: 'flex-end',
  },
  transactionPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B3A4B',
  },
  transactionStatus: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 4,
  },
  statusCompleted: {
    color: '#4CAF50',
  },
  paymentCard: {
    backgroundColor: '#F5F9F0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C5E1A5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentPending: {
    borderColor: '#FF9800',
    borderWidth: 2,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B3A4B',
    marginTop: 8,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8BC34A',
    marginTop: 4,
  },
  paymentDate: {
    fontSize: 12,
    color: '#A5D6A7',
    marginTop: 4,
  },
  confirmPaymentButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  confirmPaymentText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  paymentConfirmed: {
    color: '#4CAF50',
    fontWeight: '700',
    fontSize: 14,
  },
  photoCard: {
    backgroundColor: '#F5F9F0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C5E1A5',
  },
  photoTripId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B3A4B',
    marginBottom: 12,
  },
  photoSection: {
    marginBottom: 12,
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B8E23',
    marginBottom: 8,
  },
  photoImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
  },
  photoInfo: {
    fontSize: 12,
    color: '#6B8E23',
    marginTop: 6,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B8E23',
    fontSize: 16,
    marginTop: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B3A4B',
    textAlign: 'center',
    marginBottom: 24,
  },
  productImagePicker: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: '#F5F9F0',
    borderWidth: 2,
    borderColor: '#C5E1A5',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  productImagePreview: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    color: '#6B8E23',
    fontSize: 12,
    textAlign: 'center',
    padding: 10,
  },
  trendSelector: {
    marginTop: 16,
  },
  trendLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B3A4B',
    marginBottom: 10,
  },
  trendButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  trendBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F5F9F0',
    borderWidth: 1,
    borderColor: '#C5E1A5',
  },
  trendBtnUp: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  trendBtnDown: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  trendBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B8E23',
  },
  trendBtnTextActive: {
    color: '#1B3A4B',
  },
  modalButtons: {
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  cancelText: {
    color: '#1B3A4B',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
