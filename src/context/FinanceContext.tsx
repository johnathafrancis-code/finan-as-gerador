import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
import { getCurrentMonthString, formatCurrency } from '../utils/formatters';
import { playSyncChime } from '../utils/sound';

interface FinanceContextType {
  transactions: Transaction[];
  partners: PartnerConfig;
  activeDeviceUser: 'partner1' | 'partner2';
  selectedMonth: string; // 'YYYY-MM'
  filterOwner: 'all' | 'partner1' | 'partner2' | 'shared';
  searchQuery: string;
  connectedDevices: number;
  supabaseStatus: {
    isConfigured: boolean;
    isConnected: boolean;
    isSyncing: boolean;
    error: string | null;
    lastEventTime?: string;
  };
  notification: string | null;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
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
  clearAllTransactions: () => Promise<void>;
  dismissNotification: () => void;
}

const LOCAL_STORAGE_TX_KEY = 'financas_casal_transactions';
const LOCAL_STORAGE_PARTNERS_KEY = 'financas_casal_partners';
const LOCAL_STORAGE_DEVICE_USER_KEY = 'financas_casal_device_user';
const LOCAL_STORAGE_SOUND_KEY = 'financas_casal_sound';

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

  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_SOUND_KEY);
      if (stored !== null) return stored === 'true';
    } catch (e) {}
    return true;
  });

  const setSoundEnabled = (val: boolean) => {
    setSoundEnabledState(val);
    localStorage.setItem(LOCAL_STORAGE_SOUND_KEY, String(val));
  };

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_TX_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // If stored data contains the old mock tx-001, clear it
          if (parsed.some((t: any) => t.id === 'tx-001')) {
            localStorage.removeItem(LOCAL_STORAGE_TX_KEY);
            return [];
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthString());
  const [filterOwner, setFilterOwner] = useState<'all' | 'partner1' | 'partner2' | 'shared'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<number>(1);

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

  const clientIdRef = useRef<string>(`client-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`);

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

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_TX_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error('Falha ao salvar no localStorage', e);
    }
  }, [transactions]);

  // Load from backend API initially
  const loadInitialData = useCallback(async () => {
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.transactions) && json.transactions.length > 0) {
          setTransactions(json.transactions);
        }
      }
    } catch (e) {
      console.log('Modo client-only ou offline ativo');
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 1. Instant Realtime SSE (Server-Sent Events) synchronization across devices
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    function connectSSE() {
      try {
        eventSource = new EventSource('/api/events');

        eventSource.onopen = () => {
          // Connected to SSE stream
        };

        eventSource.addEventListener('connected', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data.connectedDevices) {
              setConnectedDevices(data.connectedDevices);
            }
          } catch (err) {}
        });

        eventSource.onmessage = (e: MessageEvent) => {
          try {
            const payload = JSON.parse(e.data);
            if (!payload || !payload.eventType) return;

            if (payload.eventType === 'CONNECTED_DEVICES') {
              setConnectedDevices(payload.count || 1);
              return;
            }

            if (payload.eventType === 'INSERT') {
              const newTx = payload.data as Transaction;
              setTransactions(prev => {
                if (prev.some(t => t.id === newTx.id)) return prev;
                return [newTx, ...prev];
              });

              if (soundEnabled) {
                playSyncChime();
              }

              const author = newTx.owner === 'partner1'
                ? partners.partner1Name
                : (newTx.owner === 'partner2' ? partners.partner2Name : 'Compartilhado');

              setNotification(
                `⚡ Sincronizado agora: ${author} adicionou "${newTx.description}" (${formatCurrency(newTx.amount)})`
              );
            } else if (payload.eventType === 'UPDATE') {
              const updatedTx = payload.data as Transaction;
              setTransactions(prev =>
                prev.map(t => (t.id === updatedTx.id ? updatedTx : t))
              );
              setNotification(`⚡ Sincronizado agora: "${updatedTx.description}" foi atualizado`);
            } else if (payload.eventType === 'DELETE') {
              const { id } = payload.data;
              setTransactions(prev => prev.filter(t => t.id !== id));
              setNotification(`⚡ Sincronizado agora: um lançamento foi excluído`);
            } else if (payload.eventType === 'RELOAD') {
              if (Array.isArray(payload.data?.transactions)) {
                setTransactions(payload.data.transactions);
              }
            }
          } catch (err) {
            console.error('Erro ao processar mensagem SSE', err);
          }
        };

        eventSource.onerror = () => {
          eventSource?.close();
          // Auto-reconnect in 3s
          reconnectTimeout = setTimeout(connectSSE, 3000);
        };
      } catch (err) {
        // SSE not supported or offline
      }
    }

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [partners.partner1Name, partners.partner2Name, soundEnabled]);

  // 2. Supabase Realtime synchronization setup
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
    } else if (data && data.length > 0) {
      setTransactions(data);
      setSupabaseStatus({
        isConfigured: true,
        isConnected: true,
        isSyncing: false,
        error: null,
        lastEventTime: new Date().toLocaleTimeString('pt-BR'),
      });
    } else {
      setSupabaseStatus({
        isConfigured: true,
        isConnected: true,
        isSyncing: false,
        error: null,
      });
    }
  }, []);

  useEffect(() => {
    loadSupabaseData();
  }, [loadSupabaseData]);

  // Supabase Realtime WebSocket subscription
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

            if (soundEnabled) {
              playSyncChime();
            }

            const author = newTx.owner === 'partner1'
              ? partners.partner1Name
              : (newTx.owner === 'partner2' ? partners.partner2Name : 'Compartilhado');

            setNotification(`⚡ Sincronizado via Supabase: ${author} adicionou "${newTx.description}"`);
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
  }, [partners.partner1Name, partners.partner2Name, soundEnabled, supabaseStatus.isConfigured]);

  // Actions
  const addTransaction = async (data: Omit<Transaction, 'id'>): Promise<boolean> => {
    const newTx: Transaction = {
      ...data,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      created_at: new Date().toISOString(),
    };

    // 1. Optimistic local update
    setTransactions(prev => [newTx, ...prev]);

    // 2. Broadcast immediately via backend server API to all open devices
    try {
      fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientIdRef.current,
        },
        body: JSON.stringify(newTx),
      }).catch(e => console.error('Erro na sincronização backend', e));
    } catch (e) {}

    // 3. If Supabase is connected, save to Supabase
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

    // Broadcast via backend API
    try {
      fetch(`/api/transactions/${tx.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': clientIdRef.current,
        },
        body: JSON.stringify(tx),
      }).catch(e => console.error('Erro na sincronização backend', e));
    } catch (e) {}

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

    // Broadcast via backend API
    try {
      fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
        headers: {
          'x-client-id': clientIdRef.current,
        },
      }).catch(e => console.error('Erro na sincronização backend', e));
    } catch (e) {}

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
    await loadInitialData();
    await loadSupabaseData();
  };

  const clearAllTransactions = async () => {
    setTransactions([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_TX_KEY);
      await fetch('/api/transactions/clear', {
        method: 'POST',
        headers: {
          'x-client-id': clientIdRef.current,
        },
      });
    } catch (e) {
      console.error('Erro ao limpar lançamentos', e);
    }
    setNotification('Todos os lançamentos foram zerados. Pronto para começar do zero!');
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
        connectedDevices,
        supabaseStatus,
        notification,
        soundEnabled,
        setSoundEnabled,
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
        clearAllTransactions,
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
