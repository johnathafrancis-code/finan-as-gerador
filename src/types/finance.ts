export type TransactionType = 'income' | 'expense';

export type TransactionOwner = 'partner1' | 'partner2' | 'shared';

export type PaymentMethod = 
  | 'pix' 
  | 'cartao_credito' 
  | 'cartao_debito' 
  | 'dinheiro' 
  | 'transferencia' 
  | 'boleto';

export type TransactionStatus = 'paid' | 'pending';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  owner: TransactionOwner;
  date: string; // YYYY-MM-DD
  payment_method: PaymentMethod;
  status: TransactionStatus;
  notes?: string;
  created_at?: string;
}

export interface PartnerConfig {
  partner1Name: string; // e.g., 'Johnatha'
  partner2Name: string; // e.g., 'Raisa'
  partner1Avatar?: string;
  partner2Avatar?: string;
  splitRatio: number; // 0.5 = 50%/50%
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastSync?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface VaultDeposit {
  id: string;
  amount: number;
  type: 'deposit' | 'withdraw';
  date: string;
  owner: TransactionOwner;
  notes?: string;
  created_at: string;
}

export interface VaultGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
  icon?: string;
  deadline?: string;
  notes?: string;
  deposits: VaultDeposit[];
  created_at: string;
  updated_at?: string;
}
