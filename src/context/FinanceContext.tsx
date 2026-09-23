import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Transaction, PartnerConfig, TransactionOwner } from '../types/finance';
import { DEFAULT_PARTNERS, INITIAL_TRANSACTIONS } from '../data/defaultData';
import { 
  getStoredSupabaseConfig, 
  getSupabaseClient, 
  fetchSupabaseTransactions, 
  saveSupabaseTransaction, 
  deleteSupabaseTransaction,
  bulkUploadToSupabase 
} from '../lib/supabase';
import { getCurrentMonthString } from '../utils/formatters';

interface FinanceContextType {
  transactions: Transaction[];
  partners: PartnerConfig;
  activeDeviceUser: 'partner1' | 'partner2';
  selectedMonth: string; // 'YYYY-MM'
  filterOwner: 'all' | 'partner1' | 'partner2' | 'shared';
  searchQuery: string;
  supabaseStatus: {
    isConfigured: boolean;
    isConnected: boolean;
    isSyncing: boolean;
    error: string | null;
    lastEventTime?: string;
  };
  notification: string | null;
  setActiveDeviceUser: (user: 'partner1' | 'partner2') => void;
  setSelectedMonth: (month: string) => void;
  setFilterOwner: (owner: 'all' | 'partner1' | 'partner2' | 'shared') => void;
  setSearchQuery: (q: string) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<boolean>;
  updateTransaction: (tx: Transaction) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  updatePartners: (config: Partial<PartnerConfig>) => void;
  refreshTransactions: () => Promise<void>;
  migrateLocalToSupabase: () => Promise<{ count: number; error: string | null }>;
  dismissNotification: () => void;
}

const LOCAL_STORAGE_TX_KEY = 'financas_casal_transactions';
const LOCAL_STORAGE_PARTNERS_KEY = 'financas_casal_partners';
const LOCAL_STORAGE_DEVICE_USER_KEY = 'financas_casal_device_user';

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [partners, setPartners] = useState<PartnerConfig>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_PARTNERS_KEY);
      if (stored) return { ...DEFAULT_PARTNERS, ...JSON.parse(stored) };
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_PARTNERS;
  });

  const [activeDeviceUser, setActiveDeviceUserState] = useState<'partner1' | 'partner2'>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_DEVICE_USER_KEY);
      if (stored === 'partner1' || stored === 'partner2') return stored;
    } catch (e) {
      console.error(e);
    }
    return 'partner1';
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_TX_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TRANSACTIONS;
  });

  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthString());
  const [filterOwner, setFilterOwner] = useState<'all' | 'partner1' | 'partner2' | 'shared'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);

  const [supabaseStatus, setSupabaseStatus] = useState<{
    isConfigured: boolean;
    isConnected: boolean;
    isSyncing: boolean;
    error: string | null;
    lastEventTime?: string;
  }>({
    isConfigured: false,
    isConnected: false,
    isSyncing: false,
    error: null,
  });

  const setActiveDeviceUser = (user: 'partner1' | 'partner2') => {
    setActiveDeviceUserState(user);
    localStorage.setItem(LOCAL_STORAGE_DEVICE_USER_KEY, user);
  };

  const updatePartners = (config: Partial<PartnerConfig>) => {
    setPartners(prev => {
      const updated = { ...prev, ...config };
      localStorage.setItem(LOCAL_STORAGE_PARTNERS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const dismissNotification = () => setNotification(null);

  // Sync to local storage as fallback/cache
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_TX_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error('Falha ao salvar no localStorage', e);
    }
  }, [transactions]);

  // Check Supabase connection and load remote transactions
  const loadSupabaseData = useCallback(async () => {
    const config = getStoredSupabaseConfig();
    if (!config?.url || !config?.anonKey) {
      setSupabaseStatus({
        isConfigured: false,
        isConnected: false,
        isSyncing: false,
        error: null,
      });
      return;
    }

    setSupabaseStatus(prev => ({ ...prev, isConfigured: true, isSyncing: true, error: null }));
    const { data, error } = await fetchSupabaseTransactions();

    if (error) {
      setSupabaseStatus({
        isConfigured: true,
        isConnected: false,
        isSyncing: false,
        error,
      });
    } else if (data) {
      setTransactions(data);
      setSupabaseStatus({
        isConfigured: true,
        isConnected: true,
        isSyncing: false,
        error: null,
        lastEventTime: new Date().toLocaleTimeString('pt-BR'),
      });
    }
  }, []);

  useEffect(() => {
    loadSupabaseData();
  }, [loadSupabaseData]);

  // Realtime subscription setup
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;

    let isSubscribed = true;

    const channel = client
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
        },
        (payload) => {
          if (!isSubscribed) return;

          const nowStr = new Date().toLocaleTimeString('pt-BR');
          setSupabaseStatus(prev => ({
            ...prev,
            isConnected: true,
            lastEventTime: nowStr,
          }));

          if (payload.eventType === 'INSERT') {
            const newRow = payload.new as any;
            const newTx: Transaction = {
              id: String(newRow.id),
              description: newRow.description,
              amount: Number(newRow.amount),
              type: newRow.type,
              category: newRow.category,
              owner: newRow.owner,
              date: newRow.date,
              payment_method: newRow.payment_method,
              status: newRow.status,
              notes: newRow.notes || undefined,
              created_at: newRow.created_at,
            };

            setTransactions(prev => {
              if (prev.some(t => t.id === newTx.id)) return prev;
              return [newTx, ...prev];
            });

            // Show friendly notification if added by partner
            const partnerName = newTx.owner === 'partner1' ? partners.partner1Name : (newTx.owner === 'partner2' ? partners.partner2Name : 'Compartilhado');
            setNotification(`⚡ Sincronizado em tempo real: "${newTx.description}" (${partnerName})`);
          } else if (payload.eventType === 'UPDATE') {
            const updatedRow = payload.new as any;
            const updatedTx: Transaction = {
              id: String(updatedRow.id),
              description: updatedRow.description,
              amount: Number(updatedRow.amount),
              type: updatedRow.type,
              category: updatedRow.category,
              owner: updatedRow.owner,
              date: updatedRow.date,
              payment_method: updatedRow.payment_method,
              status: updatedRow.status,
              notes: updatedRow.notes || undefined,
              created_at: updatedRow.created_at,
            };

            setTransactions(prev =>
              prev.map(t => (t.id === updatedTx.id ? updatedTx : t))
            );
            setNotification(`⚡ Transação atualizada em tempo real: "${updatedTx.description}"`);
          } else if (payload.eventType === 'DELETE') {
            const deletedId = String((payload.old as any).id);
            setTransactions(prev => prev.filter(t => t.id !== deletedId));
            setNotification(`⚡ Transação removida em tempo real.`);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setSupabaseStatus(prev => ({ ...prev, isConnected: true, error: null }));
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setSupabaseStatus(prev => ({
            ...prev,
            isConnected: false,
            error: 'Canal de tempo real desconectado',
          }));
        }
      });

    return () => {
      isSubscribed = false;
      client.removeChannel(channel);
    };
  }, [partners.partner1Name, partners.partner2Name]);

  // Actions
  const addTransaction = async (data: Omit<Transaction, 'id'>): Promise<boolean> => {
    const newTx: Transaction = {
      ...data,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      created_at: new Date().toISOString(),
    };

    // Optimistically update local state
    setTransactions(prev => [newTx, ...prev]);

    // If Supabase is connected, save to Supabase
    if (supabaseStatus.isConfigured) {
      setSupabaseStatus(prev => ({ ...prev, isSyncing: true }));
      const { error } = await saveSupabaseTransaction(newTx);
      setSupabaseStatus(prev => ({ ...prev, isSyncing: false, error: error || null }));
      if (error) {
        setNotification(`Erro ao sincronizar com Supabase: ${error}`);
        return false;
      }
    }
    return true;
  };

  const updateTransaction = async (tx: Transaction): Promise<boolean> => {
    setTransactions(prev => prev.map(t => (t.id === tx.id ? tx : t)));

    if (supabaseStatus.isConfigured) {
      setSupabaseStatus(prev => ({ ...prev, isSyncing: true }));
      const { error } = await saveSupabaseTransaction(tx);
      setSupabaseStatus(prev => ({ ...prev, isSyncing: false, error: error || null }));
      if (error) {
        setNotification(`Erro ao salvar no Supabase: ${error}`);
        return false;
      }
    }
    return true;
  };

  const deleteTransaction = async (id: string): Promise<boolean> => {
    setTransactions(prev => prev.filter(t => t.id !== id));

    if (supabaseStatus.isConfigured) {
      setSupabaseStatus(prev => ({ ...prev, isSyncing: true }));
      const { error } = await deleteSupabaseTransaction(id);
      setSupabaseStatus(prev => ({ ...prev, isSyncing: false, error: error || null }));
      if (error) {
        setNotification(`Erro ao excluir no Supabase: ${error}`);
        return false;
      }
    }
    return true;
  };

  const refreshTransactions = async () => {
    await loadSupabaseData();
  };

  const migrateLocalToSupabase = async () => {
    setSupabaseStatus(prev => ({ ...prev, isSyncing: true }));
    const result = await bulkUploadToSupabase(transactions);
    setSupabaseStatus(prev => ({ ...prev, isSyncing: false, error: result.error }));
    if (!result.error) {
      setNotification(`Sucesso! ${result.count} transações enviadas para o Supabase.`);
    }
    return result;
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        partners,
        activeDeviceUser,
        selectedMonth,
        filterOwner,
        searchQuery,
        supabaseStatus,
        notification,
        setActiveDeviceUser,
        setSelectedMonth,
        setFilterOwner,
        setSearchQuery,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        updatePartners,
        refreshTransactions,
        migrateLocalToSupabase,
        dismissNotification,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance deve ser usado dentro de um FinanceProvider');
  }
  return context;
};
