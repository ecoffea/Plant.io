import { View, Text, StyleSheet, FlatList, Pressable, Modal, TextInput, Alert, Platform } from 'react-native';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { BigButton } from '@/components/big-button';

interface Product {
  id: string;
  name: string;
  quantity: string;
  price: string;
  status: string;
}

interface MarketItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  trend: 'up' | 'down';
}

const mockProducts: Product[] = [
  { id: '1', name: 'Tomate Cereja', quantity: '50 kg', price: 'R$4,50/kg', status: 'Disponivel' },
  { id: '2', name: 'Alface Crespa', quantity: '100 unidades', price: 'R$2,00/un', status: 'Vendido' },
];

const mockMarket: MarketItem[] = [
  { id: '1', name: 'Alho', price: 20.35, unit: 'Kg', trend: 'down' },
  { id: '2', name: 'Batata', price: 3.80, unit: 'Kg', trend: 'up' },
  { id: '3', name: 'Tomate', price: 4.20, unit: 'Kg', trend: 'up' },
  { id: '4', name: 'Cebola', price: 5.50, unit: 'Kg', trend: 'down' },
  { id: '5', name: 'Cenoura', price: 4.00, unit: 'Kg', trend: 'down' },
  { id: '6', name: 'Banana', price: 3.20, unit: 'Kg', trend: 'up' },
];

export default function ProducerScreen() {
  const [activeTab, setActiveTab] = useState<'main' | 'market'>('main');
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [showInputModal, setShowInputModal] = useState(false);
  const [newProduct, setNewProduct] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleAddProduct = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowInputModal(true);
  };

  const handleTextSubmit = () => {
    if (newProduct.trim()) {
      const product: Product = {
        id: Date.now().toString(),
        name: newProduct.trim(),
        quantity: '1 unidade',
        price: 'A definir',
        status: 'Disponivel',
      };
      setProducts([...products, product]);
      setNewProduct('');
      setShowInputModal(false);
    }
  };

  const handleAudioSubmit = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsRecording(true);
    Alert.alert(
      'Gravacao de Audio',
      'Fale o produto que deseja ofertar...',
      [
        {
          text: 'Parar Gravacao',
          onPress: () => {
            setIsRecording(false);
            const product: Product = {
              id: Date.now().toString(),
              name: 'Produto via audio',
              quantity: '1 unidade',
              price: 'A definir',
              status: 'Disponivel',
            };
            setProducts([...products, product]);
            setShowInputModal(false);
          },
        },
      ]
    );
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productQuantity}>{item.quantity}</Text>
        <Text style={styles.productPrice}>{item.price}</Text>
      </View>
      <View style={[styles.statusBadge, item.status === 'Vendido' && styles.statusSold]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </View>
  );

  const renderMarketItem = ({ item }: { item: MarketItem }) => (
    <View style={styles.marketCard}>
      <Text style={styles.marketName}>{item.name}</Text>
      <View style={styles.priceContainer}>
        <Text style={styles.marketPrice}>R${item.price.toFixed(2)}/{item.unit}</Text>
        <Text style={[styles.trendIcon, item.trend === 'up' ? styles.trendUp : styles.trendDown]}>
          {item.trend === 'up' ? '↑' : '↓'}
        </Text>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <View style={styles.tabBar}>
          <Pressable
            onPress={() => setActiveTab('main')}
            style={[styles.tab, activeTab === 'main' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'main' && styles.tabTextActive]}>
              Principal
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('market')}
            style={[styles.tab, activeTab === 'market' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'market' && styles.tabTextActive]}>
              Mercado
            </Text>
          </Pressable>
        </View>

        {activeTab === 'main' ? (
          <View style={styles.content}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Produtos disponiveis pra venda</Text>
            </View>
            <FlatList
              data={products}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Nenhum produto cadastrado</Text>
              }
            />
            <View style={styles.buttonContainer}>
              <BigButton title="Ofertar produto" onPress={handleAddProduct} />
            </View>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Cotacoes em Tempo Real</Text>
              <Text style={styles.legend}>
                <Text style={styles.trendUp}>↑ Subiu (bom)</Text>
                {'  '}
                <Text style={styles.trendDown}>↓ Baixou (ruim)</Text>
              </Text>
            </View>
            <FlatList
              data={mockMarket}
              renderItem={renderMarketItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
            />
          </View>
        )}

        <Modal visible={showInputModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Ofertar Produto</Text>
              
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Inserir produto escrito</Text>
                <TextInput
                  style={styles.input}
                  value={newProduct}
                  onChangeText={setNewProduct}
                  placeholder="Ex: 50kg de tomate cereja"
                  placeholderTextColor="#A5D6A7"
                  returnKeyType="done"
                />
                <BigButton
                  title="Confirmar"
                  onPress={handleTextSubmit}
                  disabled={!newProduct.trim()}
                />
              </View>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                onPress={handleAudioSubmit}
                style={({ pressed }) => [
                  styles.audioButton,
                  pressed && styles.audioPressed,
                  isRecording && styles.recording,
                ]}
              >
                <Text style={styles.audioIcon}>🎤</Text>
                <Text style={styles.audioText}>
                  {isRecording ? 'Gravando...' : 'Ofertar produto em audio'}
                </Text>
              </Pressable>

              <Pressable style={styles.closeButton} onPress={() => setShowInputModal(false)}>
                <Text style={styles.closeText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#2E7D32',
  },
  tabText: {
    fontSize: 16,
    color: '#689F38',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#2E7D32',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1B5E20',
  },
  legend: {
    fontSize: 14,
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 16,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F8E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B5E20',
  },
  productQuantity: {
    fontSize: 14,
    color: '#689F38',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: '#81C784',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusSold: {
    backgroundColor: '#C8E6C9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1B5E20',
  },
  marketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F8E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  marketName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B5E20',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marketPrice: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2E7D32',
    marginRight: 8,
  },
  trendIcon: {
    fontSize: 20,
    fontWeight: '700',
  },
  trendUp: {
    color: '#4CAF50',
  },
  trendDown: {
    color: '#F44336',
  },
  emptyText: {
    textAlign: 'center',
    color: '#689F38',
    fontSize: 16,
    marginTop: 32,
  },
  buttonContainer: {
    paddingTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B5E20',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F1F8E9',
    borderWidth: 2,
    borderColor: '#C8E6C9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1B5E20',
    marginBottom: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#C8E6C9',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#689F38',
    fontSize: 14,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F8E9',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#81C784',
  },
  audioPressed: {
    opacity: 0.8,
  },
  recording: {
    backgroundColor: '#FFCDD2',
    borderColor: '#F44336',
  },
  audioIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  audioText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  closeButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  closeText: {
    color: '#689F38',
    fontSize: 16,
  },
});
