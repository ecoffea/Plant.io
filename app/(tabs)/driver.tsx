import { View, Text, StyleSheet, FlatList, Pressable, Modal, Alert, Platform } from 'react-native';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { BigButton } from '@/components/big-button';

interface Trip {
  id: string;
  origin: string;
  destination: string;
  cargo: string;
  value: number;
}

interface ActiveTrip extends Trip {
  selfieTaken: boolean;
  productPhotoTaken: boolean;
  advanceRequested: boolean;
}

const mockTrips: Trip[] = [
  { id: '1', origin: 'Guaraciaba', destination: 'Fortaleza', cargo: '3 caixas de tomate', value: 560 },
  { id: '2', origin: 'Mulungu', destination: 'Maranguape', cargo: '6 caixas de Banana', value: 340 },
  { id: '3', origin: 'Pacoti', destination: 'Maracanau', cargo: '10 caixas de Alface', value: 280 },
  { id: '4', origin: 'Baturite', destination: 'Caucaia', cargo: '5 caixas de Cenoura', value: 620 },
];

export default function DriverScreen() {
  const [trips] = useState<Trip[]>(mockTrips);
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [showTripModal, setShowTripModal] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);

  const handleStartTrip = (trip: Trip) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setActiveTrip({
      ...trip,
      selfieTaken: false,
      productPhotoTaken: false,
      advanceRequested: false,
    });
    setShowTripModal(true);
    setTimeout(() => {
      setShowPhotoDialog(true);
    }, 500);
  };

  const handleTakeSelfie = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert(
      'Selfie do Motorista',
      'Tire uma selfie para confirmar sua identidade',
      [
        {
          text: 'Tirar Foto',
          onPress: () => {
            if (activeTrip) {
              setActiveTrip({ ...activeTrip, selfieTaken: true });
            }
            Alert.alert('Sucesso', 'Selfie registrada com sucesso!');
          },
        },
      ]
    );
  };

  const handleTakeProductPhoto = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert(
      'Foto do Produto',
      'Tire uma foto do produto para confirmar a coleta',
      [
        {
          text: 'Tirar Foto',
          onPress: () => {
            if (activeTrip) {
              setActiveTrip({ ...activeTrip, productPhotoTaken: true });
            }
            Alert.alert('Sucesso', 'Foto do produto registrada com sucesso!');
          },
        },
      ]
    );
  };

  const handleRequestAdvance = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert(
      'Solicitar Adiantamento',
      'Deseja solicitar adiantamento de 50% do valor da viagem?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            if (activeTrip) {
              setActiveTrip({ ...activeTrip, advanceRequested: true });
            }
            Alert.alert('Sucesso', 'Adiantamento solicitado! Aguarde a aprovacao.');
          },
        },
      ]
    );
  };

  const handleFinishTrip = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert('Viagem Concluida', 'Parabens! Viagem finalizada com sucesso.');
    setActiveTrip(null);
    setShowTripModal(false);
  };

  const renderTrip = ({ item }: { item: Trip }) => (
    <View style={styles.tripCard}>
      <View style={styles.routeContainer}>
        <Text style={styles.location}>{item.origin}</Text>
        <Text style={styles.arrow}>→</Text>
        <Text style={styles.location}>{item.destination}</Text>
      </View>
      <Text style={styles.cargo}>{item.cargo}</Text>
      <Text style={styles.value}>R${item.value.toFixed(2)}</Text>
      <Pressable
        onPress={() => handleStartTrip(item)}
        style={({ pressed }) => [
          styles.startButton,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.startButtonText}>Iniciar Transporte</Text>
      </Pressable>
    </View>
  );

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Aba Motorista</Text>
          <Text style={styles.subtitle}>Viagens disponiveis</Text>
        </View>

        <FlatList
          data={trips}
          renderItem={renderTrip}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhuma viagem disponivel no momento</Text>
          }
        />

        <Modal visible={showTripModal} animationType="slide">
          <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Transporte Ativo</Text>
              
              {activeTrip && (
                <View style={styles.tripDetails}>
                  <View style={styles.routeContainerLarge}>
                    <Text style={styles.locationLarge}>{activeTrip.origin}</Text>
                    <Text style={styles.arrowLarge}>→</Text>
                    <Text style={styles.locationLarge}>{activeTrip.destination}</Text>
                  </View>
                  <Text style={styles.cargoLarge}>{activeTrip.cargo}</Text>
                  <Text style={styles.valueLarge}>R${activeTrip.value.toFixed(2)}</Text>
                </View>
              )}

              <View style={styles.actionsContainer}>
                {activeTrip && activeTrip.value > 500 && !activeTrip.advanceRequested && (
                  <BigButton
                    title="Solicitar Adiantamento de 50%"
                    onPress={handleRequestAdvance}
                    variant="secondary"
                  />
                )}

                {activeTrip && activeTrip.advanceRequested && (
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Adiantamento Solicitado</Text>
                  </View>
                )}

                <View style={styles.spacer} />

                <BigButton
                  title={activeTrip?.selfieTaken ? "Selfie Registrada" : "Inserir Selfie do motorista"}
                  onPress={handleTakeSelfie}
                  variant={activeTrip?.selfieTaken ? "secondary" : "primary"}
                  disabled={activeTrip?.selfieTaken}
                />

                <View style={styles.spacer} />

                <BigButton
                  title={activeTrip?.productPhotoTaken ? "Foto Registrada" : "Inserir Foto do produto"}
                  onPress={handleTakeProductPhoto}
                  variant={activeTrip?.productPhotoTaken ? "secondary" : "outline"}
                />

                <View style={styles.spacer} />

                {activeTrip?.selfieTaken && activeTrip?.productPhotoTaken && (
                  <BigButton
                    title="Finalizar Viagem"
                    onPress={handleFinishTrip}
                    variant="primary"
                  />
                )}
              </View>

              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setActiveTrip(null);
                  setShowTripModal(false);
                }}
              >
                <Text style={styles.cancelText}>Cancelar Viagem</Text>
              </Pressable>
            </View>
          </ScreenContainer>
        </Modal>

        <Modal visible={showPhotoDialog} transparent animationType="fade">
          <View style={styles.dialogOverlay}>
            <View style={styles.dialogContent}>
              <Text style={styles.dialogTitle}>Aviso Importante</Text>
              <Text style={styles.dialogText}>
                Quando chegar ao produtor, clique no botao "Inserir Foto do produto" para registrar a coleta.
              </Text>
              <BigButton
                title="Entendi"
                onPress={() => setShowPhotoDialog(false)}
              />
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1B5E20',
  },
  subtitle: {
    fontSize: 16,
    color: '#689F38',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  tripCard: {
    backgroundColor: '#F1F8E9',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  location: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B5E20',
  },
  arrow: {
    fontSize: 20,
    color: '#4CAF50',
    marginHorizontal: 12,
    fontWeight: '700',
  },
  cargo: {
    fontSize: 16,
    color: '#689F38',
    marginBottom: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#689F38',
    fontSize: 16,
    marginTop: 32,
  },
  modalContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1B5E20',
    textAlign: 'center',
    marginBottom: 24,
  },
  tripDetails: {
    backgroundColor: '#F1F8E9',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  routeContainerLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  locationLarge: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1B5E20',
  },
  arrowLarge: {
    fontSize: 28,
    color: '#4CAF50',
    marginHorizontal: 16,
    fontWeight: '700',
  },
  cargoLarge: {
    fontSize: 18,
    color: '#689F38',
    textAlign: 'center',
    marginBottom: 8,
  },
  valueLarge: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2E7D32',
    textAlign: 'center',
  },
  actionsContainer: {
    flex: 1,
  },
  spacer: {
    height: 12,
  },
  statusBadge: {
    backgroundColor: '#81C784',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    color: '#1B5E20',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  cancelText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '500',
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  dialogTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1B5E20',
    textAlign: 'center',
    marginBottom: 16,
  },
  dialogText: {
    fontSize: 16,
    color: '#689F38',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
});
