import { View, Text, Modal, StyleSheet, TextInput, Pressable, Platform } from 'react-native';
import { useState } from 'react';
import { BigButton } from './big-button';
import * as Haptics from 'expo-haptics';

interface AddressConfirmDialogProps {
  visible: boolean;
  address: string;
  onConfirm: () => void;
  onReject: () => void;
  onManualInput: (address: string) => void;
}

export function AddressConfirmDialog({
  visible,
  address,
  onConfirm,
  onReject,
  onManualInput,
}: AddressConfirmDialogProps) {
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualAddress, setManualAddress] = useState('');

  const handleReject = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowManualInput(true);
  };

  const handleManualSubmit = () => {
    if (manualAddress.trim()) {
      onManualInput(manualAddress.trim());
      setManualAddress('');
      setShowManualInput(false);
    }
  };

  const handleBack = () => {
    setShowManualInput(false);
    onReject();
  };

  if (showManualInput) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.title}>Inserir Endereço</Text>
            
            <View style={styles.optionsContainer}>
              <View style={styles.manualSection}>
                <Text style={styles.optionTitle}>Inserir Manualmente</Text>
                <TextInput
                  style={styles.input}
                  value={manualAddress}
                  onChangeText={setManualAddress}
                  placeholder="Digite o endereço completo"
                  placeholderTextColor="#A5D6A7"
                  multiline
                  returnKeyType="done"
                />
                <BigButton
                  title="Confirmar Endereço"
                  onPress={handleManualSubmit}
                  disabled={!manualAddress.trim()}
                />
              </View>
            </View>

            <Pressable style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backText}>Voltar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Confirmar Endereço</Text>
          <Text style={styles.addressText}>O endereço</Text>
          <Text style={styles.address}>{address}</Text>
          <Text style={styles.addressText}>está correto?</Text>

          <View style={styles.buttonRow}>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.confirmButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.confirmText}>Sim</Text>
            </Pressable>
            <Pressable
              onPress={handleReject}
              style={({ pressed }) => [
                styles.rejectButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.rejectText}>Não</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1B5E20',
    textAlign: 'center',
    marginBottom: 16,
  },
  addressText: {
    fontSize: 14,
    color: '#689F38',
    textAlign: 'center',
  },
  address: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    textAlign: 'center',
    marginVertical: 12,
    padding: 12,
    backgroundColor: '#F1F8E9',
    borderRadius: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#F1F8E9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
  },
  optionsContainer: {
    marginTop: 16,
  },
  manualSection: {
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 14,
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
    fontSize: 14,
    color: '#1B5E20',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backText: {
    color: '#689F38',
    fontSize: 14,
  },
});
