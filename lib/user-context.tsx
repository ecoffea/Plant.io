import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserProfile = 'consumer' | 'producer' | 'driver' | null;

export interface Transaction {
  id: string;
  date: string;
  type: 'purchase' | 'sale' | 'delivery';
  product: string;
  quantity: string;
  value: number;
  status: 'pending' | 'completed' | 'cancelled';
  counterparty?: string;
}

export interface UserData {
  name: string;
  phone: string;
  cpf: string;
  pix: string;
  address: string;
  profile: UserProfile;
  isRegistered: boolean;
  transactions: Transaction[];
  latitude?: number;
  longitude?: number;
}

interface UserContextType {
  userData: UserData;
  setUserData: (data: Partial<UserData>) => void;
  resetUser: () => void;
  saveUser: () => Promise<void>;
  loadUser: () => Promise<boolean>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
  transactions: Transaction[];
  isLoading: boolean;
}

const defaultUserData: UserData = {
  name: '',
  phone: '',
  cpf: '',
  pix: '',
  address: '',
  profile: null,
  isRegistered: false,
  transactions: [],
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userData, setUserDataState] = useState<UserData>(defaultUserData);
  const [isLoading, setIsLoading] = useState(true);

  const setUserData = (data: Partial<UserData>) => {
    setUserDataState(prev => ({ ...prev, ...data }));
  };

  const resetUser = async () => {
    setUserDataState(defaultUserData);
    await AsyncStorage.removeItem('plantio_user');
  };

  const saveUser = async () => {
    try {
      await AsyncStorage.setItem('plantio_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Erro ao salvar dados do usuário:', error);
    }
  };

  const loadUser = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem('plantio_user');
      if (stored) {
        const parsedData = JSON.parse(stored);
        setUserDataState(parsedData);
        return parsedData.isRegistered && parsedData.profile !== null;
      }
      return false;
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'date'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    setUserDataState(prev => ({
      ...prev,
      transactions: [newTransaction, ...prev.transactions],
    }));
  };

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (userData.isRegistered) {
      saveUser();
    }
  }, [userData]);

  return (
    <UserContext.Provider value={{ 
      userData, 
      setUserData, 
      resetUser, 
      saveUser, 
      loadUser, 
      addTransaction,
      transactions: userData.transactions,
      isLoading 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser deve ser usado dentro de um UserProvider');
  }
  return context;
}
