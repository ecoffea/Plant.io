import { View, Text, StyleSheet, FlatList, Pressable, Modal, TextInput, Alert, Platform, Image, Animated, ScrollView, KeyboardAvoidingView, Keyboard, Linking, BackHandler } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as Clipboard from 'expo-clipboard';
import { ScreenContainer } from '@/components/screen-container';
import { BigButton } from '@/components/big-button';
import { useUser, Transaction } from '@/lib/user-context';
import { 
  productsDatabase, 
  findClosestProduct, 
  calculateConsumerTotal,
  getConsumerTablePrice,
  formatConsumerDisplay,
  searchProducts,
  ProductData,
  FORTALEZA_COORDS,
  PRICE_CONSTANTS,
  ProducerOffer,
  calculateDistance,
  calculateDriverFreight
} from '@/lib/products-data';

interface OrderItem {
  id: string;
  product: ProductData;
  quantity: number;
  unit: string;
  totalPrice: number;
  status: 'pending' | 'awaiting_payment' | 'paid' | 'confirmed' | 'in_transit' | 'delivered';
  canEdit: boolean;
  producerCity?: string;
  distanceKm?: number;
}

const PIX_KEY = '85982019013';
const BITCOIN_KEY = 'bc1qmfrmgwtz4d6p6ennsz0qnhhxvxh24wgtu97gf7';

// Ofertas de produtores (em produção viriam do banco de dados)
// Só aparecem para o consumidor quando o produtor aceitar
const mockProducerOffers: (ProducerOffer & { accepted?: boolean })[] = [];

export default function ConsumerHomeScreen() {
  const router = useRouter();
  const { userData, resetUser, addTransaction, transactions } = useUser();
  const [activeTab, setActiveTab] = useState<'main' | 'market' | 'history'>('main');
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [showInputModal, setShowInputModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [productInput, setProductInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<'Kg' | 'Unidades'>('Kg');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceToProducer, setDistanceToProducer] = useState(100);
  const [editingOrder, setEditingOrder] = useState<OrderItem | null>(null);
  const [productSuggestions, setProductSuggestions] = useState<ProductData[]>([]);
  const [producerOffers, setProducerOffers] = useState<(ProducerOffer & { accepted?: boolean })[]>(mockProducerOffers);
  const [showOfferDetails, setShowOfferDetails] = useState<ProducerOffer | null>(null);
  
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
          setDistanceToProducer(Math.max(10, dist));
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

  const handleAddOrder = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditingOrder(null);
    setProductInput('');
    setQuantityInput('');
    setSelectedUnit('Kg');
    setProductSuggestions([]);
    setShowInputModal(true);
  };

  const handleEditOrder = (order: OrderItem) => {
    if (!order.canEdit) {
      Alert.alert('Não é possível editar', 'Este pedido já foi aceito por um motorista.');
      return;
    }
    setEditingOrder(order);
    setProductInput(order.product.name);
    setQuantityInput(order.quantity.toString());
    setSelectedUnit(order.unit as 'Kg' | 'Unidades');
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
      Alert.alert('Produto não encontrado', 'Este produto não está disponível na nossa lista. Consulte o mercado para ver os produtos disponíveis.');
      return;
    }

    if (foundProduct.name.toLowerCase() !== productInput.toLowerCase().trim()) {
      Alert.alert(
        'Correção automática',
        `Você quis dizer "${foundProduct.name}"?`,
        [
          { text: 'Não', style: 'cancel' },
          { text: 'Sim', onPress: () => addOrderItem(foundProduct) },
        ]
      );
    } else {
      addOrderItem(foundProduct);
    }
  };

  const addOrderItem = (product: ProductData, fromOffer?: ProducerOffer) => {
    const qty = parseFloat(quantityInput) || 10; // Padrão 10 unidades
    
    // Validar quantidade mínima de 10 unidades
    if (qty < 10) {
      Alert.alert('Quantidade mínima', 'A quantidade mínima para pedidos é de 10 Kg/Unidades.');
      return;
    }
    
    // Calcular distância - usar oferta do produtor se disponível
    let distance = distanceToProducer;
    let producerCity = 'Fortaleza';
    
    if (fromOffer && userLocation) {
      distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        fromOffer.producerLat,
        fromOffer.producerLng
      );
      producerCity = fromOffer.city;
    }
    
    // Usar novo sistema de 3 tabelas v6.0
    const priceInfo = calculateConsumerTotal(product.price, qty, distance);
    const totalPrice = priceInfo.total;
    
    if (editingOrder) {
      setOrders(orders.map(o => 
        o.id === editingOrder.id 
          ? { ...o, product, quantity: qty, unit: selectedUnit, totalPrice, producerCity, distanceKm: distance }
          : o
      ));
    } else {
      const newOrder: OrderItem = {
        id: Date.now().toString(),
        product,
        quantity: qty,
        unit: selectedUnit,
        totalPrice,
        status: 'pending',
        canEdit: true,
        producerCity,
        distanceKm: distance,
      };
      setOrders([...orders, newOrder]);
      
      addTransaction({
        type: 'purchase',
        product: product.name,
        quantity: `${qty} ${selectedUnit}`,
        value: totalPrice,
        status: 'pending',
      });
    }
    
    setProductInput('');
    setQuantityInput('');
    setShowInputModal(false);
    setEditingOrder(null);
    setShowOfferDetails(null);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleOfferClick = (offer: ProducerOffer) => {
    const product = productsDatabase.find(p => p.id === offer.productId);
    if (!product) return;
    
    setShowOfferDetails(offer);
    setProductInput(product.name);
    setQuantityInput(offer.quantity.toString());
    setSelectedUnit(offer.unit as 'Kg' | 'Unidades');
  };

  const confirmOfferPurchase = () => {
    if (!showOfferDetails) return;
    
    const product = productsDatabase.find(p => p.id === showOfferDetails.productId);
    if (!product) return;
    
    addOrderItem(product, showOfferDetails);
  };

  const handleDeleteOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order && !order.canEdit) {
      Alert.alert('Não é possível excluir', 'Este pedido já foi aceito por um motorista.');
      return;
    }
    
    Alert.alert(
      'Excluir pedido',
      'Tem certeza que deseja excluir este pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => setOrders(orders.filter(o => o.id !== orderId))
        },
      ]
    );
  };

  const handlePayment = () => {
    setShowPaymentModal(true);
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

  const confirmPayment = () => {
    setOrders(orders.map(o => ({ ...o, status: 'awaiting_payment' as const, canEdit: false })));
    setShowPaymentModal(false);
    Alert.alert('Aguarde', 'Aguarde confirmação de pagamento pelo administrador.');
  };

  const getTotalOrderValue = (): number => {
    return orders.reduce((sum, order) => sum + order.totalPrice, 0);
  };

  // Formatar preço para exibição (sem mostrar taxas)
  const formatPriceDisplay = (product: ProductData): string => {
    const display = formatConsumerDisplay(product.price, product.unit);
    return display.pricePerUnit;
  };

  const renderOrderItem = ({ item }: { item: OrderItem }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Image source={{ uri: item.product.image }} style={styles.productImage} />
        <View style={styles.orderInfo}>
          <Text style={styles.orderProductName}>{item.product.name}</Text>
          <Text style={styles.orderQuantity}>{item.quantity} {item.unit}</Text>
          
        </View>
        <View style={styles.orderPriceContainer}>
          <Text style={styles.orderPrice}>R$ {item.totalPrice.toFixed(2)}</Text>
          <Text style={styles.orderStatus}>
            {item.status === 'pending' ? 'Pendente' :
             item.status === 'awaiting_payment' ? 'Aguardando' :
             item.status === 'paid' ? 'Pago' :
             item.status === 'confirmed' ? 'Confirmado' :
             item.status === 'in_transit' ? 'Em trânsito' : 'Entregue'}
          </Text>
        </View>
      </View>
      {item.canEdit && (
        <View style={styles.orderActions}>
          <Pressable 
            style={({ pressed }) => [styles.editButton, pressed && { opacity: 0.7 }]}
            onPress={() => handleEditOrder(item)}
          >
            <Text style={styles.editButtonText}>Editar</Text>
          </Pressable>
          <Pressable 
            style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.7 }]}
            onPress={() => handleDeleteOrder(item.id)}
          >
            <Text style={styles.deleteButtonText}>Excluir</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  const renderMarketItem = ({ item }: { item: ProductData }) => {
    const consumerPrice = getConsumerTablePrice(item.price);
    const displayQty = PRICE_CONSTANTS.DEFAULT_DISPLAY_QTY;
    const totalFor10 = consumerPrice * displayQty;
    
    return (
      <View style={styles.marketCard}>
        <Image source={{ uri: item.image }} style={styles.marketImage} />
        <View style={styles.marketInfo}>
          <Text style={styles.marketProductName}>{item.name}</Text>
          <Text style={styles.marketPrice}>
            R$ {consumerPrice.toFixed(2)}/{item.unit}
          </Text>
          <Text style={styles.marketDisplayText}>
            Você paga: R$ {totalFor10.toFixed(2)}/{displayQty}{item.unit === 'Kg' ? 'Kg' : ' un'}
          </Text>
        </View>
        <View style={styles.trendContainer}>
          <Text style={[styles.trendIcon, item.trend === 'down' ? styles.trendDown : styles.trendUp]}>
            {item.trend === 'down' ? '▼' : '▲'}
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

  // Ofertas de produtores visíveis (só mostrar cidade, não nome)
  const renderProducerOffer = ({ item }: { item: ProducerOffer }) => {
    const product = productsDatabase.find(p => p.id === item.productId);
    if (!product) return null;
    
    let distance = distanceToProducer;
    if (userLocation) {
      distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        item.producerLat,
        item.producerLng
      );
    }
    
    const priceInfo = calculateConsumerTotal(product.price, item.quantity, distance);
    
    return (
      <Pressable 
        style={({ pressed }) => [styles.offerCard, pressed && { opacity: 0.8 }]}
        onPress={() => handleOfferClick(item)}
      >
        <Image source={{ uri: product.image }} style={styles.offerImage} />
        <View style={styles.offerInfo}>
          <Text style={styles.offerCity}>{item.city}</Text>
          <Text style={styles.offerProduct}>{item.productName} {item.quantity}{item.unit}</Text>
          <Text style={styles.offerPrice}>R$ {priceInfo.total.toFixed(2)}</Text>
        </View>
        <Text style={styles.offerArrow}>→</Text>
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
            <Text style={styles.userName}>{userData?.name || 'Consumidor'}</Text>
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
            {/* Ofertas de Produtores */}
            {producerOffers.length > 0 && (
              <View style={styles.offersSection}>
                <Text style={styles.sectionTitle}>Ofertas Disponíveis</Text>
                <FlatList
                  data={producerOffers}
                  renderItem={renderProducerOffer}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.offersList}
                />
              </View>
            )}

            {/* Pedidos */}
            <View style={styles.ordersSection}>
              <Text style={styles.sectionTitle}>Produtos Solicitados</Text>
              {orders.length === 0 ? (
                <View style={styles.emptyOrders}>
                  <Text style={styles.emptyText}>Nenhum pedido ainda</Text>
                  <Text style={styles.emptySubtext}>Clique no botão abaixo para solicitar produtos</Text>
                </View>
              ) : (
                <>
                  <FlatList
                    data={orders}
                    renderItem={renderOrderItem}
                    keyExtractor={(item) => item.id}
                    style={styles.ordersList}
                    showsVerticalScrollIndicator={false}
                  />
                  <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Você paga:</Text>
                    <Text style={styles.totalValue}>R$ {getTotalOrderValue().toFixed(2)}</Text>
                  </View>
                  {orders.length > 0 && orders.some(o => o.status === 'pending') && (
                    <Pressable 
                      style={({ pressed }) => [styles.payButton, pressed && { opacity: 0.8 }]}
                      onPress={handlePayment}
                    >
                      <Text style={styles.payButtonText}>Finalizar Compra</Text>
                    </Pressable>
                  )}
                </>
              )}
            </View>

            {/* Botão Flutuante Centralizado */}
            <View style={styles.floatingButtonContainer}>
              <Pressable 
                style={({ pressed }) => [styles.floatingButton, pressed && { transform: [{ scale: 0.95 }] }]}
                onPress={handleAddOrder}
              >
                <Text style={styles.floatingButtonText}>Solicitar Produto</Text>
              </Pressable>
            </View>
          </View>
        )}

        {activeTab === 'market' && (
          <View style={styles.marketContent}>
            <Text style={styles.marketTitle}>Tabela de Preços</Text>
            <Text style={styles.marketSubtitle}>Preços para compra de {PRICE_CONSTANTS.DEFAULT_DISPLAY_QTY} unidades</Text>
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
            {transactions.filter(t => t.type === 'purchase').length === 0 ? (
              <View style={styles.emptyHistory}>
                <Text style={styles.emptyText}>Nenhuma transação ainda</Text>
              </View>
            ) : (
              <FlatList
                data={transactions.filter(t => t.type === 'purchase')}
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
                  {editingOrder ? 'Editar Pedido' : 'Solicitar Produto'}
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

        {/* Modal de Detalhes da Oferta */}
        <Modal
          visible={showOfferDetails !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setShowOfferDetails(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowOfferDetails(null)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              {showOfferDetails && (
                <>
                  <Text style={styles.modalTitle}>Finalizar Compra</Text>
                  <View style={styles.offerDetailsContent}>
                    <Text style={styles.offerDetailCity}>{showOfferDetails.city}</Text>
                    <Text style={styles.offerDetailProduct}>
                      {showOfferDetails.productName} - {showOfferDetails.quantity}{showOfferDetails.unit}
                    </Text>
                    {(() => {
                      const product = productsDatabase.find(p => p.id === showOfferDetails.productId);
                      if (!product) return null;
                      let distance = distanceToProducer;
                      if (userLocation) {
                        distance = calculateDistance(
                          userLocation.lat,
                          userLocation.lng,
                          showOfferDetails.producerLat,
                          showOfferDetails.producerLng
                        );
                      }
                      const priceInfo = calculateConsumerTotal(product.price, showOfferDetails.quantity, distance);
                      return (
                        <Text style={styles.offerDetailPrice}>
                          Você paga: R$ {priceInfo.total.toFixed(2)}
                        </Text>
                      );
                    })()}
                  </View>
                  <View style={styles.modalButtons}>
                    <Pressable 
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => setShowOfferDetails(null)}
                    >
                      <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.modalButton, styles.confirmButton]}
                      onPress={confirmOfferPurchase}
                    >
                      <Text style={styles.confirmButtonText}>Comprar</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Modal de Pagamento PIX */}
        <Modal
          visible={showPaymentModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPaymentModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowPaymentModal(false)}>
            <Pressable style={styles.paymentModalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.paymentTitle}>Forma de Pagamento</Text>
              
              {/* Detalhamento do valor */}
              <View style={styles.paymentBreakdown}>
                {orders.map((order, index) => (
                  <View key={order.id} style={styles.breakdownItem}>
                    <Text style={styles.breakdownProduct}>{order.product.name} ({order.quantity}{order.unit})</Text>
                    <Text style={styles.breakdownValue}>R$ {(order.totalPrice * 0.7).toFixed(2)}</Text>
                  </View>
                ))}
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownProduct}>Frete</Text>
                  <Text style={styles.breakdownValue}>R$ {(getTotalOrderValue() * 0.3).toFixed(2)}</Text>
                </View>
                <View style={styles.breakdownDivider} />
              </View>
              
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentLabel}>Total:</Text>
                <Text style={styles.paymentValue}>R$ {getTotalOrderValue().toFixed(2)}</Text>
              </View>

              <View style={styles.paymentMethodsContainer}>
                <View style={styles.pixContainer}>
                  <Text style={styles.pixLabel}>PIX (Telefone):</Text>
                  <View style={styles.pixKeyContainer}>
                    <Text style={styles.pixKey}>(85) 98201-9013</Text>
                    <Pressable 
                      style={({ pressed }) => [styles.copyButton, pressed && { opacity: 0.7 }]}
                      onPress={copyPixKey}
                    >
                      <Text style={styles.copyButtonText}>Copiar</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.bitcoinContainer}>
                  <Text style={styles.bitcoinLabel}>Bitcoin:</Text>
                  <View style={styles.bitcoinKeyContainer}>
                    <Text style={styles.bitcoinKey} numberOfLines={2}>bc1qmfrmgwtz4d6p6ennsz0qnhhxvxh24wgtu97gf7</Text>
                    <Pressable 
                      style={({ pressed }) => [styles.copyButton, pressed && { opacity: 0.7 }]}
                      onPress={copyBitcoinKey}
                    >
                      <Text style={styles.copyButtonText}>Copiar</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <Text style={styles.paymentInstructions}>
                Após realizar o pagamento, clique em "Confirmar Pagamento" e aguarde a confirmação do administrador.
              </Text>

              <View style={styles.modalButtons}>
                <Pressable 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowPaymentModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </Pressable>
                <Pressable 
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={confirmPayment}
                >
                  <Text style={styles.confirmButtonText}>Confirmar Pagamento</Text>
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
  offersSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B3A4B',
    marginBottom: 12,
  },
  offersList: {
    maxHeight: 120,
  },
  offerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#8BC34A',
    minWidth: 200,
  },
  offerImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  offerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  offerCity: {
    fontSize: 12,
    color: '#666',
  },
  offerProduct: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B3A4B',
  },
  offerPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8BC34A',
  },
  offerArrow: {
    fontSize: 24,
    color: '#8BC34A',
    marginLeft: 8,
  },
  ordersSection: {
    flex: 1,
  },
  emptyOrders: {
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
  ordersList: {
    flex: 1,
  },
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  orderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  orderProductName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B3A4B',
  },
  orderQuantity: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  orderCity: {
    fontSize: 12,
    color: '#8BC34A',
    marginTop: 2,
  },
  orderPriceContainer: {
    alignItems: 'flex-end',
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8BC34A',
  },
  orderStatus: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  orderActions: {
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
  payButton: {
    backgroundColor: '#8BC34A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
    color: '#F44336',
  },
  trendDown: {
    color: '#4CAF50',
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
  offerDetailsContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  offerDetailCity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  offerDetailProduct: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B3A4B',
    marginBottom: 12,
  },
  offerDetailPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8BC34A',
  },
  paymentModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  paymentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B3A4B',
    marginBottom: 20,
    textAlign: 'center',
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  paymentLabel: {
    fontSize: 15,
    color: '#666',
  },
  paymentValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8BC34A',
  },
  pixContainer: {
    marginBottom: 20,
  },
  pixLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  pixKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 14,
    borderRadius: 12,
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
    paddingVertical: 10,
    borderRadius: 8,
  },
  copyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  paymentInstructions: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  paymentBreakdown: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  breakdownProduct: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  breakdownValue: {
    fontSize: 13,
    color: '#1B3A4B',
    fontWeight: '600',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#ddd',
    marginTop: 8,
  },
  paymentMethodsContainer: {
    gap: 16,
    marginBottom: 16,
  },
  bitcoinContainer: {
    marginBottom: 0,
  },
  bitcoinLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  bitcoinKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 14,
    borderRadius: 12,
  },
  bitcoinKey: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1B3A4B',
  },
});
