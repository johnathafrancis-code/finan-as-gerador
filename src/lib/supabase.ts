import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Transaction } from '../types/finance';

const CONFIG_STORAGE_KEY = 'financas_supabase_config';

export interface StoredSupabaseConfig {
  url: string;
  anonKey: string;
}

let cachedClient: SupabaseClient | null = null;
let currentClientUrl = '';
let currentClientKey = '';

export function getStoredSupabaseConfig(): StoredSupabaseConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Erro ao ler config do Supabase do localStorage', err);
  }

  // Fallback to env vars if available
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }

  return null;
}

export function saveStoredSupabaseConfig(url: string, anonKey: string): void {
  const trimmedUrl = url.trim().replace(/\/+$/, '');
  const trimmedKey = anonKey.trim();
  localStorage.setItem(
    CONFIG_STORAGE_KEY,
    JSON.stringify({ url: trimmedUrl, anonKey: trimmedKey })
  );
  // Invalidate cached client
  cachedClient = null;
}

export function clearStoredSupabaseConfig(): void {
  localStorage.removeItem(CONFIG_STORAGE_KEY);
  cachedClient = null;
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config?.url || !config?.anonKey) {
    return null;
  }

  if (cachedClient && currentClientUrl === config.url && currentClientKey === config.anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    currentClientUrl = config.url;
    currentClientKey = config.anonKey;
    return cachedClient;
  } catch (e) {
    console.error('Erro ao inicializar Supabase client:', e);
    return null;
  }
}

export async function testSupabaseConnection(url?: string, key?: string): Promise<{ success: boolean; message: string; tableExists: boolean }> {
  const targetUrl = (url || getStoredSupabaseConfig()?.url || '').trim();
  const targetKey = (key || getStoredSupabaseConfig()?.anonKey || '').trim();

  if (!targetUrl || !targetKey) {
    return {
      success: false,
      message: 'URL e Anon Key do Supabase são obrigatórios.',
      tableExists: false,
    };
  }

  try {
    const testClient = createClient(targetUrl, targetKey);
    // Tenta consultar a tabela transactions
    const { data, error } = await testClient
      .from('transactions')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01' || error.message?.includes('relation "public.transactions" does not exist') || error.message?.includes('transactions')) {
        return {
          success: true,
          message: 'Conectado ao Supabase! Porém a tabela "transactions" ainda não foi criada. Copie o script SQL abaixo e execute no SQL Editor do Supabase.',
          tableExists: false,
        };
      }
      return {
        success: false,
        message: `Erro do Supabase: ${error.message}`,
        tableExists: false,
      };
    }

    return {
      success: true,
      message: `Conexão estabelecida com sucesso! Tabela "transactions" pronta e sincronizada.`,
      tableExists: true,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Falha ao conectar: ${err?.message || 'Verifique a URL e a Anon Key fornecidas.'}`,
      tableExists: false,
    };
  }
}

// Fetch all transactions from Supabase
export async function fetchSupabaseTransactions(): Promise<{ data: Transaction[] | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: 'Supabase não configurado' };
  }

  try {
    const { data, error } = await client
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    const mapped: Transaction[] = (data || []).map((row: any) => ({
      id: String(row.id),
      description: row.description,
      amount: Number(row.amount),
      type: row.type as 'income' | 'expense',
      category: row.category,
      owner: row.owner as 'partner1' | 'partner2' | 'shared',
      date: row.date,
      payment_method: row.payment_method,
      status: row.status as 'paid' | 'pending',
      notes: row.notes || undefined,
      created_at: row.created_at,
    }));

    return { data: mapped, error: null };
  } catch (e: any) {
    return { data: null, error: e?.message || 'Erro ao carregar transações do Supabase' };
  }
}

// Save (insert or update) transaction in Supabase
export async function saveSupabaseTransaction(tx: Transaction): Promise<{ error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { error: 'Supabase não configurado' };
  }

  try {
    const payload = {
      id: tx.id,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      owner: tx.owner,
      date: tx.date,
      payment_method: tx.payment_method,
      status: tx.status,
      notes: tx.notes || null,
    };

    const { error } = await client
      .from('transactions')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (e: any) {
    return { error: e?.message || 'Erro ao salvar transação no Supabase' };
  }
}

// Delete transaction in Supabase
export async function deleteSupabaseTransaction(id: string): Promise<{ error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { error: 'Supabase não configurado' };
  }

  try {
    const { error } = await client
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (e: any) {
    return { error: e?.message || 'Erro ao deletar transação no Supabase' };
  }
}

// Bulk sync local transactions to Supabase
export async function bulkUploadToSupabase(transactions: Transaction[]): Promise<{ count: number; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { count: 0, error: 'Supabase não configurado' };
  }

  try {
    const payloads = transactions.map(tx => ({
      id: tx.id,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      owner: tx.owner,
      date: tx.date,
      payment_method: tx.payment_method,
      status: tx.status,
      notes: tx.notes || null,
    }));

    const { data, error } = await client
      .from('transactions')
      .upsert(payloads, { onConflict: 'id' });

    if (error) {
      return { count: 0, error: error.message };
    }

    return { count: payloads.length, error: null };
  } catch (e: any) {
    return { count: 0, error: e?.message || 'Falha ao sincronizar' };
  }
}

// SQL Script generator for the user
export function getSupabaseSqlSchema(): string {
  return `-- 1. Criar a tabela de transações compartilhadas do casal
create table if not exists public.transactions (
  id text primary key,
  description text not null,
  amount numeric(12, 2) not null,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  owner text not null check (owner in ('partner1', 'partner2', 'shared')),
  date text not null,
  payment_method text not null,
  status text not null check (status in ('paid', 'pending')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Habilitar Row Level Security (RLS) com acesso para a chave anônima (anon)
alter table public.transactions enable row level security;

-- 3. Criar política de leitura e escrita pública
drop policy if exists "Acesso total as transações do casal" on public.transactions;
create policy "Acesso total as transações do casal"
  on public.transactions
  for all
  using (true)
  with check (true);

-- 4. Habilitar a publicação em Tempo Real (Realtime)
-- Isso garante que toda alteração apareça instantaneamente no celular da sua esposa e no seu!
alter publication supabase_realtime add table public.transactions;
`;
}
