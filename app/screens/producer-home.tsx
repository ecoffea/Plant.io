import { View, Text, StyleSheet, FlatList, Pressable, Modal, TextInput, Alert, Platform, Image, Animated, ScrollView, KeyboardAvoidingView, Keyboard, BackHandler } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { ScreenContainer } from '@/components/screen-container';
import { BigButton } from '@/components/big-button';
import { useUser, Transaction } from '@/lib/user-context';
import { 
  productsDatabase, 
  findClosestProduct, 
  calculateProducerTotal,
  getProducerTablePrice,
  formatProducerDisplay,
  searchProducts,
  ProductData,
  FORTALEZA_COORDS,
  PRICE_CONSTANTS,
  ConsumerDemand,
  calculateDistance
} from '@/lib/products-data';

interface ProductItem {
  id: string;
  product: ProductData;
  quantity: number;
  unit: string;
  totalPrice: number;
  status: 'available' | 'sold' | 'in_transit' | 'delivered';
  canEdit: boolean;
  customPrice?: number;
}

// Demandas de consumidores - só aparecem quando pagamento confirmado
const mockConsumerDemands: (ConsumerDemand & { paymentConfirmed?: boolean })[] = [];

export default function ProducerHomeScreen() {
  const router = useRouter();
  const { userData, resetUser, addTransaction, transactions } = useUser();
  const [activeTab, setActiveTab] = useState<'main' | 'market' | 'history'>('main');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [showInputModal, setShowInputModal] = useState(false);
  const [showCustomPriceModal, setShowCustomPriceModal] = useState(false);
  const [showSupplyConfirmModal, setShowSupplyConfirmModal] = useState(false);
  const [productInput, setProductInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<'Kg' | 'Unidades'>('Kg');
  const [customPrice, setCustomPrice] = useState('');
  const [customProductName, setCustomProductName] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceToFortaleza, setDistanceToFortaleza] = useState(100);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [productSuggestions, setProductSuggestions] = useState<ProductData[]>([]);
  const [consumerDemands, setConsumerDemands] = useState<(ConsumerDemand & { paymentConfirmed?: boolean })[]>(mockConsumerDemands);
  const [showDemandDetails, setShowDemandDetails] = useState<ConsumerDemand | null>(null);
  const [pendingDemand, setPendingDemand] = useState<ConsumerDemand | null>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Obter localização do usuário
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });
          const dist = calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            FORTALEZA_COORDS.lat,
            FORTALEZA_COORDS.lng
          );
          setDistanceToFortaleza(Math.max(10, dist));
        }
      } catch (error) {
        console.log('Erro ao obter localização:', error);
      }
    })();
  }, []);

  const handleLogout = async () => {
    await resetUser();
    router.replace('/');
  };

  const handleAddProduct = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditingProduct(null);
    setProductInput('');
    setQuantityInput('');
    setSelectedUnit('Kg');
    setProductSuggestions([]);
    setShowInputModal(true);
  };

  const handleEditProduct = (product: ProductItem) => {
    if (!product.canEdit) {
      Alert.alert('Não é possível editar', 'Este produto já foi vendido.');
      return;
    }
    setEditingProduct(product);
    setProductInput(product.product.name);
    setQuantityInput(product.quantity.toString());
    setSelectedUnit(product.unit as 'Kg' | 'Unidades');
    setShowInputModal(true);
  };

  const handleProductInputChange = (text: string) => {
    setProductInput(text);
    if (text.length >= 2) {
      const suggestions = searchProducts(text);
      setProductSuggestions(suggestions);
    } else {
      setProductSuggestions([]);
    }
  };

  const selectSuggestion = (product: ProductData) => {
    setProductInput(product.name);
    setProductSuggestions([]);
  };

  const handleTextSubmit = () => {
    if (!productInput.trim()) return;

    const foundProduct = findClosestProduct(productInput);
    
    if (!foundProduct) {
      // Produto não encontrado - permitir preço personalizado para produtor
      setCustomProductName(productInput.trim());
      setShowInputModal(false);
      setShowCustomPriceModal(true);
      return;
    }

    if (foundProduct.name.toLowerCase() !== productInput.toLowerCase().trim()) {
      Alert.alert(
        'Correção automática',
        `Você quis dizer "${foundProduct.name}"?`,
        [
          { text: 'Não', onPress: () => {
            setCustomProductName(productInput.trim());
            setShowInputModal(false);
            setShowCustomPriceModal(true);
          }},
          { text: 'Sim', onPress: () => addProductItem(foundProduct) },
        ]
      );
    } else {
      addProductItem(foundProduct);
    }
  };

  const addProductItem = (product: ProductData, customPriceValue?: number) => {
    const qty = parseFloat(quantityInput) || 10;
    
    // Validar quantidade mínima de 10 unidades
    if (qty < 10) {
      Alert.alert('Quantidade mínima', 'A quantidade mínima para ofertas é de 10 Kg/Unidades.');
      return;
    }
    
    // Usar novo sistema de 3 tabelas v6.0
    const basePrice = customPriceValue || product.price;
    const priceInfo = calculateProducerTotal(basePrice, qty);
    const totalPrice = priceInfo.total;
    
    if (editingProduct) {
      setProducts(products.map(p => 
        p.id === editingProduct.id 
          ? { ...p, product, quantity: qty, unit: selectedUnit, totalPrice, customPrice: customPriceValue }
          : p
      ));
    } else {
      const newProduct: ProductItem = {
        id: Date.now().toString(),
        product,
        quantity: qty,
        unit: selectedUnit,
        totalPrice,
        status: 'available',
        canEdit: true,
        customPrice: customPriceValue,
      };
      setProducts([...products, newProduct]);
      
      addTransaction({
        type: 'sale',
        product: product.name,
        quantity: `${qty} ${selectedUnit}`,
        value: totalPrice,
        status: 'pending',
      });
    }
    
    setProductInput('');
    setQuantityInput('');
    setCustomPrice('');
    setCustomProductName('');
    setShowInputModal(false);
    setShowCustomPriceModal(false);
    setEditingProduct(null);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleCustomPriceSubmit = () => {
    const price = parseFloat(customPrice);
    if (!price || price <= 0) {
      Alert.alert('Erro', 'Digite um preço válido.');
      return;
    }

    // Criar produto personalizado
    const customProduct: ProductData = {
      id: `custom_${Date.now()}`,
      name: customProductName,
      price: price,
      unit: selectedUnit === 'Kg' ? 'Kg' : 'Un',
      trend: 'up',
      image: 'https://images.unsplash.com/photo-1597714026720-8f74c62310ba?w=100&h=100&fit=crop',
      category: 'outros',
    };

    addProductItem(customProduct, price);
  };

  const handleDemandClick = (demand: ConsumerDemand) => {
    // Mostrar confirmação se consegue abastecer
    setPendingDemand(demand);
    setShowSupplyConfirmModal(true);
  };

  const confirmSupply = () => {
    if (!pendingDemand) return;
    
    const product = productsDatabase.find(p => p.id === pendingDemand.productId);
    if (!product) return;
    
    setProductInput(product.name);
    setQuantityInput(pendingDemand.quantity.toString());
    setSelectedUnit(pendingDemand.unit as 'Kg' | 'Unidades');
    setShowSupplyConfirmModal(false);
    setPendingDemand(null);
    setShowInputModal(true);
  };

  const handleDeleteProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product && !product.canEdit) {
      Alert.alert('Não é possível excluir', 'Este produto já foi vendido.');
      return;
    }
    
    Alert.alert(
      'Excluir oferta',
      'Tem certeza que deseja excluir esta oferta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => setProducts(products.filter(p => p.id !== productId))
        },
      ]
    );
  };

  const getTotalProductValue = (): number => {
    return products.reduce((sum, product) => sum + product.totalPrice, 0);
  };

  const renderProductItem = ({ item }: { item: ProductItem }) => (
    <View style={styles.productCard}>
      <View style={styles.productHeader}>
        <Image source={{ uri: item.product.image }} style={styles.productImage} />
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.product.name}</Text>
          <Text style={styles.productQuantity}>{item.quantity} {item.unit}</Text>
        </View>
        <View style={styles.productPriceContainer}>
          <Text style={styles.productPrice}>R$ {item.totalPrice.toFixed(2)}</Text>
          <Text style={styles.productStatus}>
            {item.status === 'available' ? 'Disponível' :
             item.status === 'sold' ? 'Vendido' :
             item.status === 'in_transit' ? 'Em trânsito' : 'Entregue'}
          </Text>
        </View>
      </View>
      {item.canEdit && (
        <View style={styles.productActions}>
          <Pressable 
            style={({ pressed }) => [styles.editButton, pressed && { opacity: 0.7 }]}
            onPress={() => handleEditProduct(item)}
          >
            <Text style={styles.editButtonText}>Editar</Text>
          </Pressable>
          <Pressable 
            style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.7 }]}
            onPress={() => handleDeleteProduct(item.id)}
          >
            <Text style={styles.deleteButtonText}>Excluir</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  const renderMarketItem = ({ item }: { item: ProductData }) => {
    const producerPrice = getProducerTablePrice(item.price);
    const displayQty = PRICE_CONSTANTS.DEFAULT_DISPLAY_QTY;
    const totalFor10 = producerPrice * displayQty;
    
    return (
      <View style={styles.marketCard}>
        <Image source={{ uri: item.image }} style={styles.marketImage} />
        <View style={styles.marketInfo}>
          <Text style={styles.marketProductName}>{item.name}</Text>
          <Text style={styles.marketPrice}>
            R$ {producerPrice.toFixed(2)}/{item.unit}
          </Text>
          <Text style={styles.marketDisplayText}>
            Você recebe: R$ {totalFor10.toFixed(2)}/{displayQty}{item.unit === 'Kg' ? 'Kg' : ' un'}
          </Text>
        </View>
        <View style={styles.trendContainer}>
          <Text style={[styles.trendIcon, item.trend === 'up' ? styles.trendUp : styles.trendDown]}>
            {item.trend === 'up' ? '▲' : '▼'}
          </Text>
        </View>
      </View>
    );
  };

  const renderHistoryItem = ({ item }: { item: Transaction }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyInfo}>
        <Text style={styles.historyProduct}>{item.product}</Text>
        <Text style={styles.historyQuantity}>{item.quantity}</Text>
        <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString('pt-BR')}</Text>
      </View>
      <View style={styles.historyValueContainer}>
        <Text style={styles.historyValue}>R$ {item.value.toFixed(2)}</Text>
        <Text style={[
          styles.historyStatus,
          item.status === 'completed' ? styles.statusCompleted : styles.statusPending
        ]}>
          {item.status === 'completed' ? 'Concluído' : 'Pendente'}
        </Text>
      </View>
    </View>
  );

  // Demandas de consumidores (só mostrar quando pagamento confirmado)
  const renderConsumerDemand = ({ item }: { item: ConsumerDemand & { paymentConfirmed?: boolean } }) => {
    if (!item.paymentConfirmed) return null;
    
    const product = productsDatabase.find(p => p.id === item.productId);
    if (!product) return null;
    
    const priceInfo = calculateProducerTotal(product.price, item.quantity);
    
    return (
      <Pressable 
        style={({ pressed }) => [styles.demandCard, pressed && { opacity: 0.8 }]}
        onPress={() => handleDemandClick(item)}
      >
        <Image source={{ uri: product.image }} style={styles.demandImage} />
        <View style={styles.demandInfo}>
          <Text style={styles.demandCity}>{item.city}</Text>
          <Text style={styles.demandProduct}>{item.productName} {item.quantity}{item.unit}</Text>
          <Text style={styles.demandPrice}>Você recebe: R$ {priceInfo.total.toFixed(2)}</Text>
        </View>
        <Text style={styles.demandArrow}>→</Text>
      </Pressable>
    );
  };

  return (
    <ScreenContainer>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Bem-vindo,</Text>
            <Text style={styles.userName}>{userData?.name || 'Produtor'}</Text>
          </View>
          <Pressable 
            style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.7 }]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Sair</Text>
          </Pressable>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <Pressable 
            style={[styles.tab, activeTab === 'main' && styles.activeTab]}
            onPress={() => setActiveTab('main')}
          >
            <Text style={[styles.tabText, activeTab === 'main' && styles.activeTabText]}>Principal</Text>
          </Pressable>
          <Pressable 
            style={[styles.tab, activeTab === 'market' && styles.activeTab]}
            onPress={() => setActiveTab('market')}
          >
            <Text style={[styles.tabText, activeTab === 'market' && styles.activeTabText]}>Mercado</Text>
          </Pressable>
          <Pressable 
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Histórico</Text>
          </Pressable>
        </View>

        {/* Content */}
        {activeTab === 'main' && (
          <View style={styles.mainContent}>
            {/* Demandas de Consumidores (só com pagamento confirmado) */}
            {consumerDemands.filter(d => d.paymentConfirmed).length > 0 && (
              <View style={styles.demandsSection}>
                <Text style={styles.sectionTitle}>Demandas Disponíveis</Text>
                <FlatList
                  data={consumerDemands.filter(d => d.paymentConfirmed)}
                  renderItem={renderConsumerDemand}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.demandsList}
                />
              </View>
            )}

            {/* Produtos */}
            <View style={styles.productsSection}>
              <Text style={styles.sectionTitle}>Produtos Disponíveis para Venda</Text>
              {products.length === 0 ? (
                <View style={styles.emptyProducts}>
                  <Text style={styles.emptyText}>Nenhum produto ainda</Text>
                  <Text style={styles.emptySubtext}>Clique no botão abaixo para ofertar produtos</Text>
                </View>
              ) : (
                <>
                  <FlatList
                    data={products}
                    renderItem={renderProductItem}
                    keyExtractor={(item) => item.id}
                    style={styles.productsList}
                    showsVerticalScrollIndicator={false}
                  />
                  <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Você recebe:</Text>
                    <Text style={styles.totalValue}>R$ {getTotalProductValue().toFixed(2)}</Text>
                  </View>
                </>
              )}
            </View>

            {/* Botão Flutuante Centralizado */}
            <View style={styles.floatingButtonContainer}>
              <Pressable 
                style={({ pressed }) => [styles.floatingButton, pressed && { transform: [{ scale: 0.95 }] }]}
                onPress={handleAddProduct}
              >
                <Text style={styles.floatingButtonText}>Ofertar Produto</Text>
              </Pressable>
            </View>
          </View>
        )}

        {activeTab === 'market' && (
          <View style={styles.marketContent}>
            <Text style={styles.marketTitle}>Tabela de Preços</Text>
            <Text style={styles.marketSubtitle}>Valores que você recebe por {PRICE_CONSTANTS.DEFAULT_DISPLAY_QTY} unidades</Text>
            <FlatList
              data={productsDatabase}
              renderItem={renderMarketItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.marketList}
            />
          </View>
        )}

        {activeTab === 'history' && (
          <View style={styles.historyContent}>
            <Text style={styles.historyTitle}>Histórico de Transações</Text>
            {transactions.filter(t => t.type === 'sale').length === 0 ? (
              <View style={styles.emptyHistory}>
                <Text style={styles.emptyText}>Nenhuma transação ainda</Text>
              </View>
            ) : (
              <FlatList
                data={transactions.filter(t => t.type === 'sale')}
                renderItem={renderHistoryItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        )}

        {/* Modal de Input */}
        <Modal
          visible={showInputModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowInputModal(false)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setShowInputModal(false)}>
              <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                <Text style={styles.modalTitle}>
                  {editingProduct ? 'Editar Produto' : 'Ofertar Produto'}
                </Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Produto</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Digite o nome do produto"
                    placeholderTextColor="#999"
                    value={productInput}
                    onChangeText={handleProductInputChange}
                    autoCapitalize="words"
                  />
                  {productSuggestions.length > 0 && (
                    <ScrollView style={styles.suggestionsContainer} nestedScrollEnabled>
                      {productSuggestions.slice(0, 5).map((product) => (
                        <Pressable
                          key={product.id}
                          style={styles.suggestionItem}
                          onPress={() => selectSuggestion(product)}
                        >
                          <Image source={{ uri: product.image }} style={styles.suggestionImage} />
                          <Text style={styles.suggestionText}>{product.name}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Quantidade</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ex: 10"
                    placeholderTextColor="#999"
                    value={quantityInput}
                    onChangeText={setQuantityInput}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Unidade</Text>
                  <View style={styles.unitSelector}>
                    <Pressable
                      style={[styles.unitOption, selectedUnit === 'Kg' && styles.unitOptionSelected]}
                      onPress={() => setSelectedUnit('Kg')}
                    >
                      <Text style={[styles.unitOptionText, selectedUnit === 'Kg' && styles.unitOptionTextSelected]}>Kg</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.unitOption, selectedUnit === 'Unidades' && styles.unitOptionSelected]}
                      onPress={() => setSelectedUnit('Unidades')}
                    >
                      <Text style={[styles.unitOptionText, selectedUnit === 'Unidades' && styles.unitOptionTextSelected]}>Unidades</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <Pressable 
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowInputModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleTextSubmit}
                  >
                    <Text style={styles.confirmButtonText}>Confirmar</Text>
                  </Pressable>
                </View>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Modal>

        {/* Modal de Preço Personalizado */}
        <Modal
          visible={showCustomPriceModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCustomPriceModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowCustomPriceModal(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Produto Personalizado</Text>
              <Text style={styles.customPriceInfo}>
                O produto "{customProductName}" não está na nossa lista. Defina o preço de venda:
              </Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Preço por {selectedUnit}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ex: 10.00"
                  placeholderTextColor="#999"
                  value={customPrice}
                  onChangeText={setCustomPrice}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.modalButtons}>
                <Pressable 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowCustomPriceModal(false);
                    setShowInputModal(true);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Voltar</Text>
                </Pressable>
                <Pressable 
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleCustomPriceSubmit}
                >
                  <Text style={styles.confirmButtonText}>Confirmar</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Modal de Confirmação de Abastecimento */}
        <Modal
          visible={showSupplyConfirmModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSupplyConfirmModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowSupplyConfirmModal(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Confirmar Abastecimento</Text>
              {pendingDemand && (
                <View style={styles.supplyConfirmContent}>
                  <Text style={styles.supplyConfirmText}>
                    Você consegue abastecer os produtos desta demanda?
                  </Text>
                  <Text style={styles.supplyConfirmProduct}>
                    {pendingDemand.productName} - {pendingDemand.quantity}{pendingDemand.unit}
                  </Text>
                  <Text style={styles.supplyConfirmCity}>
                    Destino: {pendingDemand.city}
                  </Text>
                </View>
              )}
              <View style={styles.modalButtons}>
                <Pressable 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowSupplyConfirmModal(false);
                    setPendingDemand(null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Não</Text>
                </Pressable>
                <Pressable 
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={confirmSupply}
                >
                  <Text style={styles.confirmButtonText}>Sim, Ofertar</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B3A4B',
  },
  logoutButton: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  logoutText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#8BC34A',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  mainContent: {
    flex: 1,
  },
  demandsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B3A4B',
    marginBottom: 12,
  },
  demandsList: {
    maxHeight: 120,
  },
  demandCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
    minWidth: 200,
  },
  demandImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  demandInfo: {
    flex: 1,
    marginLeft: 12,
  },
  demandCity: {
    fontSize: 12,
    color: '#666',
  },
  demandProduct: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B3A4B',
  },
  demandPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8BC34A',
  },
  demandArrow: {
    fontSize: 24,
    color: '#2196F3',
    marginLeft: 8,
  },
  productsSection: {
    flex: 1,
  },
  emptyProducts: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#bbb',
    textAlign: 'center',
  },
  productsList: {
    flex: 1,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B3A4B',
  },
  productQuantity: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  productPriceContainer: {
    alignItems: 'flex-end',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8BC34A',
  },
  productStatus: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    marginRight: 8,
  },
  editButtonText: {
    color: '#1976D2',
    fontWeight: '600',
    fontSize: 13,
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#D32F2F',
    fontWeight: '600',
    fontSize: 13,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8BC34A',
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  floatingButton: {
    backgroundColor: '#8BC34A',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  marketContent: {
    flex: 1,
  },
  marketTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B3A4B',
    marginBottom: 4,
  },
  marketSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  marketList: {
    paddingBottom: 20,
  },
  marketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  marketImage: {
    width: 55,
    height: 55,
    borderRadius: 10,
  },
  marketInfo: {
    flex: 1,
    marginLeft: 14,
  },
  marketProductName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1B3A4B',
  },
  marketPrice: {
    fontSize: 14,
    color: '#8BC34A',
    fontWeight: '600',
    marginTop: 2,
  },
  marketDisplayText: {
    fontSize: 15,
    color: '#1B5E20',
    fontWeight: 'bold',
    marginTop: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trendContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  trendUp: {
    color: '#4CAF50',
  },
  trendDown: {
    color: '#F44336',
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B3A4B',
    marginBottom: 16,
  },
  emptyHistory: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  historyInfo: {
    flex: 1,
  },
  historyProduct: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1B3A4B',
  },
  historyQuantity: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  historyDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  historyValueContainer: {
    alignItems: 'flex-end',
  },
  historyValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#8BC34A',
  },
  historyStatus: {
    fontSize: 11,
    marginTop: 4,
  },
  statusCompleted: {
    color: '#4CAF50',
  },
  statusPending: {
    color: '#FF9800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B3A4B',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    backgroundColor: '#f9f9f9',
  },
  suggestionsContainer: {
    maxHeight: 150,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionImage: {
    width: 36,
    height: 36,
    borderRadius: 6,
    marginRight: 12,
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  unitOption: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  unitOptionSelected: {
    borderColor: '#8BC34A',
    backgroundColor: '#E8F5E9',
  },
  unitOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  unitOptionTextSelected: {
    color: '#8BC34A',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#8BC34A',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  customPriceInfo: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  supplyConfirmContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  supplyConfirmText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  supplyConfirmProduct: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B3A4B',
    marginBottom: 8,
  },
  supplyConfirmCity: {
    fontSize: 14,
    color: '#8BC34A',
  },
});
