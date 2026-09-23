import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  clearStoredSupabaseConfig,
  testSupabaseConnection,
  getSupabaseSqlSchema,
} from '../lib/supabase';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  UploadCloud,
  Check,
  Zap,
} from 'lucide-react';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const { supabaseStatus, refreshTransactions, migrateLocalToSupabase } = useFinance();

  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    tableExists: boolean;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = getStoredSupabaseConfig();
      if (config) {
        setUrl(config.url);
        setAnonKey(config.anonKey);
      }
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(url, anonKey);
    setTestResult(res);
    setIsTesting(false);
  };

  const handleSaveConfig = async () => {
    saveStoredSupabaseConfig(url, anonKey);
    await refreshTransactions();
    onClose();
  };

  const handleDisconnect = async () => {
    clearStoredSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setTestResult(null);
    await refreshTransactions();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(getSupabaseSqlSchema());
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    await migrateLocalToSupabase();
    setIsMigrating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Sincronização em Tempo Real com Supabase
              </h3>
              <p className="text-xs text-slate-400">
                Conecte seu banco de dados para que você e sua esposa vejam lançamentos em tempo real
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Status banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              supabaseStatus.isConnected
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                : 'bg-slate-950/60 border-slate-800 text-slate-300'
            }`}
          >
            {supabaseStatus.isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <span className="font-semibold block text-sm">
                {supabaseStatus.isConnected
                  ? 'Supabase Conectado e Sincronizando!'
                  : 'Sincronização entre Aparelhos'}
              </span>
              <p className="text-slate-400 leading-relaxed">
                {supabaseStatus.isConnected
                  ? `Qualquer gasto ou recebimento inserido no seu aparelho aparecerá no celular da sua esposa instantaneamente, sem precisar atualizar a página.`
                  : `Configurando suas credenciais do Supabase, você e sua esposa podem abrir o aplicativo em telefones e computadores diferentes com sincronização automática instantânea.`}
              </p>
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-300">
                  Supabase Project URL
                </label>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px]"
                >
                  <span>Abrir Supabase Dashboard</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Supabase Anon (Public) Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono text-xs"
              />
            </div>

            {/* Test result message */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800 text-rose-300'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !url || !anonKey}
                className="px-3.5 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Testando...' : 'Testar Conexão'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={!url || !anonKey}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Salvar & Conectar</span>
              </button>

              {supabaseStatus.isConnected && (
                <>
                  <button
                    type="button"
                    onClick={handleMigrate}
                    disabled={isMigrating}
                    className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Envia as transações que estão salvas no navegador para a nuvem no Supabase"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{isMigrating ? 'Enviando...' : 'Migrar Dados Locais'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="px-3.5 py-2 rounded-lg border border-rose-900/60 text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer ml-auto"
                  >
                    Desconectar
                  </button>
                </>
              )}
            </div>
          </div>

          {/* SQL Setup Instructions */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block text-xs">
                  Script de Configuração do Banco (SQL Editor)
                </span>
                <span className="text-slate-400 text-[11px]">
                  Basta colar no SQL Editor do Supabase para criar a tabela com Tempo Real ativado
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar SQL</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-44">
                {getSupabaseSqlSchema()}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
