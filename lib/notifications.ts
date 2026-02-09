import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PUSH_TOKEN_KEY = '@plantio_push_token';

// Configurar comportamento das notificações com som
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'web') {
    console.log('Push notifications not supported on web');
    return null;
  }

  // Verificar permissões
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return null;
  }

  // Obter token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'plantio',
    });
    token = tokenData.data;
    
    // Salvar token localmente
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
  } catch (error) {
    console.log('Error getting push token:', error);
  }

  // Configurar canal de notificação para Android com som
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Plant.io',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8BC34A',
      sound: 'default',
      enableVibrate: true,
    });

    // Canal para notificações urgentes (novas viagens, vendas)
    await Notifications.setNotificationChannelAsync('urgent', {
      name: 'Notificações Urgentes',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: '#FF9800',
      sound: 'default',
      enableVibrate: true,
    });
  }

  return token;
}

export async function getPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  } catch {
    return null;
  }
}

// Tipos de notificação
export type NotificationType = 
  | 'new_trip'              // Nova viagem disponível (motorista)
  | 'trip_accepted'         // Viagem aceita por motorista (produtor/consumidor)
  | 'order_status'          // Status do pedido (consumidor)
  | 'product_sold'          // Produto vendido (produtor)
  | 'buyer_found'           // Comprador encontrado (produtor)
  | 'advance_approved'      // Adiantamento aprovado (motorista)
  | 'advance_request'       // Solicitação de adiantamento (admin)
  | 'payment_request'       // Solicitação de confirmação de pagamento (admin)
  | 'payment_confirmed'     // Pagamento confirmado (usuário)
  | 'producer_payment'      // Pagamento ao produtor (produtor)
  | 'driver_payment'        // Pagamento ao motorista (motorista)
  | 'price_alert';          // Alerta de preço (todos)

interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  urgent?: boolean;
}

// Enviar notificação local com som
export async function sendLocalNotification(payload: NotificationPayload): Promise<void> {
  if (Platform.OS === 'web') {
    console.log('Local notification:', payload);
    // No web, tentar usar Web Notifications API
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(payload.title, {
        body: payload.body,
        icon: '/assets/images/icon.png',
      });
    }
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: payload.title,
      body: payload.body,
      data: { type: payload.type, ...payload.data },
      sound: true,
      priority: payload.urgent ? Notifications.AndroidNotificationPriority.MAX : Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null, // Enviar imediatamente
  });
}

// Enviar notificação em background (quando app não está aberto)
export async function scheduleBackgroundNotification(
  payload: NotificationPayload,
  delaySeconds: number = 0
): Promise<string> {
  if (Platform.OS === 'web') {
    console.log('Background notification scheduled:', payload);
    return '';
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: payload.title,
      body: payload.body,
      data: { type: payload.type, ...payload.data },
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: delaySeconds > 0 ? { seconds: delaySeconds, repeats: false } as Notifications.TimeIntervalTriggerInput : null,
  });

  return identifier;
}

// Notificações predefinidas com acentuação correta
export const NotificationTemplates = {
  // Motorista - Nova viagem disponível (somente após pagamento confirmado)
  newTrip: (origin: string, destination: string, value: number) => ({
    type: 'new_trip' as NotificationType,
    title: '🚚 Nova Viagem Disponível!',
    body: `${origin} → ${destination} - R$ ${value.toFixed(2)}`,
    data: { origin, destination, value },
    urgent: true,
  }),

  // Produtor/Consumidor - Motorista aceitou a corrida
  tripAccepted: (driverName: string, product: string) => ({
    type: 'trip_accepted' as NotificationType,
    title: '🚗 Motorista a Caminho!',
    body: `${driverName} aceitou transportar ${product}`,
    data: { driverName, product },
    urgent: true,
  }),

  // Consumidor - Status do pedido
  orderStatusUpdate: (productName: string, status: string) => ({
    type: 'order_status' as NotificationType,
    title: '📦 Atualização do Pedido',
    body: `Seu pedido de ${productName} está: ${status}`,
    data: { productName, status },
  }),

  // Produtor - Comprador encontrado (somente quando há match real)
  buyerFound: (productName: string, quantity: string, buyerName: string) => ({
    type: 'buyer_found' as NotificationType,
    title: '🎉 Comprador Encontrado!',
    body: `${buyerName} quer comprar ${quantity} de ${productName}`,
    data: { productName, quantity, buyerName },
    urgent: true,
  }),

  // Motorista - Adiantamento aprovado
  advanceApproved: (tripId: string, amount: number) => ({
    type: 'advance_approved' as NotificationType,
    title: '✅ Adiantamento Aprovado!',
    body: `Seu adiantamento de R$ ${amount.toFixed(2)} foi aprovado`,
    data: { tripId, amount },
    urgent: true,
  }),

  // Admin - Solicitação de adiantamento
  advanceRequest: (driverName: string, amount: number, tripValue: number) => ({
    type: 'advance_request' as NotificationType,
    title: '⚠️ Solicitação de Adiantamento',
    body: `${driverName} solicitou R$ ${amount.toFixed(2)} (viagem de R$ ${tripValue.toFixed(2)})`,
    data: { driverName, amount, tripValue },
    urgent: true,
  }),

  // Admin - Solicitação de confirmação de pagamento
  paymentRequest: (userName: string, userType: string, amount: number) => ({
    type: 'payment_request' as NotificationType,
    title: '💳 Confirmação de Pagamento',
    body: `${userName} (${userType}) aguarda confirmação de R$ ${amount.toFixed(2)}`,
    data: { userName, userType, amount },
    urgent: true,
  }),

  // Usuário - Pagamento confirmado pelo admin
  paymentConfirmed: (amount: number) => ({
    type: 'payment_confirmed' as NotificationType,
    title: '✅ Pagamento Confirmado!',
    body: `Seu pagamento de R$ ${amount.toFixed(2)} foi confirmado`,
    data: { amount },
    urgent: true,
  }),

  // Produtor - Recebimento após motorista retirar mercadoria
  producerPayment: (productName: string, amount: number) => ({
    type: 'producer_payment' as NotificationType,
    title: '💰 Pagamento Liberado!',
    body: `Você receberá R$ ${amount.toFixed(2)} pela venda de ${productName}`,
    data: { productName, amount },
    urgent: true,
  }),

  // Motorista - Pagamento após confirmar entrega
  driverPayment: (tripOrigin: string, tripDestination: string, amount: number) => ({
    type: 'driver_payment' as NotificationType,
    title: '💰 Pagamento da Viagem!',
    body: `Você receberá R$ ${amount.toFixed(2)} pela viagem ${tripOrigin} → ${tripDestination}`,
    data: { tripOrigin, tripDestination, amount },
    urgent: true,
  }),

  // Alerta de preço
  priceAlert: (productName: string, newPrice: number, trend: 'up' | 'down') => ({
    type: 'price_alert' as NotificationType,
    title: '📊 Alerta de Preço',
    body: `${productName} ${trend === 'up' ? 'subiu' : 'baixou'} para R$ ${newPrice.toFixed(2)}`,
    data: { productName, newPrice, trend },
  }),
};

// Listener para notificações recebidas
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

// Listener para quando usuário interage com notificação
export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// Verificar e solicitar permissão para notificações web
export async function requestWebNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'web') return true;
  
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Cancelar todas as notificações agendadas
export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Obter todas as notificações agendadas
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  if (Platform.OS === 'web') return [];
  return await Notifications.getAllScheduledNotificationsAsync();
}
