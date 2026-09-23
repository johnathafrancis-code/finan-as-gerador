import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { Plus, Database, Settings, RefreshCw, Smartphone, Volume2, VolumeX, Radio } from 'lucide-react';

interface TopBarProps {
  onOpenNewTransaction: () => void;
  onOpenSupabaseModal: () => void;
  onOpenSettingsModal: () => void;
  currentTab: 'dashboard' | 'transactions' | 'categories' | 'settlement';
  setCurrentTab: (tab: 'dashboard' | 'transactions' | 'categories' | 'settlement') => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenNewTransaction,
  onOpenSupabaseModal,
  onOpenSettingsModal,
  currentTab,
  setCurrentTab,
}) => {
  const {
    partners,
    activeDeviceUser,
    setActiveDeviceUser,
    supabaseStatus,
    refreshTransactions,
    connectedDevices,
    soundEnabled,
    setSoundEnabled,
  } = useFinance();

  const activeAvatar = activeDeviceUser === 'partner1' ? partners.partner1Avatar : partners.partner2Avatar;
  const activeName = activeDeviceUser === 'partner1' ? partners.partner1Name : partners.partner2Name;

  return (
    <header className="border-b border-slate-800/80 bg-[#0f172a]/90 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setCurrentTab('dashboard');
            }}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/60 transition-colors">
              <span className="font-bold text-sm tracking-tight">2x</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">
              Finanças a Dois
            </span>
          </a>

          {/* Quick Active Device Selector */}
          <div className="hidden sm:flex items-center gap-1.5 ml-3 pl-3 border-l border-slate-800 text-xs text-slate-400">
            <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="hidden md:inline">Este aparelho:</span>
            <div className="flex items-center bg-slate-800/80 rounded-md p-0.5 border border-slate-700/60">
              <button
                type="button"
                onClick={() => setActiveDeviceUser('partner1')}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                  activeDeviceUser === 'partner1'
                    ? 'bg-slate-700 text-white font-medium shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Dispositivo de ${partners.partner1Name}`}
              >
                {partners.partner1Avatar && (
                  <img
                    src={partners.partner1Avatar}
                    alt={partners.partner1Name}
                    referrerPolicy="no-referrer"
                    className="w-3.5 h-3.5 rounded-full object-cover"
                  />
                )}
                <span>{partners.partner1Name}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveDeviceUser('partner2')}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                  activeDeviceUser === 'partner2'
                    ? 'bg-slate-700 text-white font-medium shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Dispositivo de ${partners.partner2Name}`}
              >
                {partners.partner2Avatar && (
                  <img
                    src={partners.partner2Avatar}
                    alt={partners.partner2Name}
                    referrerPolicy="no-referrer"
                    className="w-3.5 h-3.5 rounded-full object-cover"
                  />
                )}
                <span>{partners.partner2Name}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Zone 2: 4 clean text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`transition-colors cursor-pointer ${
              currentTab === 'dashboard'
                ? 'text-white border-b-2 border-emerald-500 pb-0.5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setCurrentTab('transactions')}
            className={`transition-colors cursor-pointer ${
              currentTab === 'transactions'
                ? 'text-white border-b-2 border-emerald-500 pb-0.5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Lançamentos
          </button>
          <button
            onClick={() => setCurrentTab('settlement')}
            className={`transition-colors cursor-pointer ${
              currentTab === 'settlement'
                ? 'text-white border-b-2 border-emerald-500 pb-0.5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Divisão & Acerto
          </button>
          <button
            onClick={() => setCurrentTab('categories')}
            className={`transition-colors cursor-pointer ${
              currentTab === 'categories'
                ? 'text-white border-b-2 border-emerald-500 pb-0.5'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Categorias
          </button>
        </nav>

        {/* Zone 3: Primary actions & connection status */}
        <div className="flex items-center gap-2">
          {/* Live Sync Status Pill */}
          <div
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-slate-300"
            title="Sincronização instantânea ativa entre dispositivos conectados"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="font-mono">
              {connectedDevices > 1 ? `${connectedDevices} Aparelhos ao Vivo` : 'Tempo Real Ativo'}
            </span>
          </div>

          {/* Sound toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
            title={soundEnabled ? 'Aviso sonoro ativado quando houver novos lançamentos' : 'Aviso sonoro desativado'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Supabase status indicator button */}
          <button
            type="button"
            onClick={onOpenSupabaseModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              supabaseStatus.isConnected
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/50'
                : supabaseStatus.isConfigured
                ? 'bg-amber-950/40 border-amber-800/80 text-amber-300 hover:bg-amber-900/50'
                : 'bg-slate-800/90 border-slate-700/80 text-slate-300 hover:bg-slate-700/80'
            }`}
            title={
              supabaseStatus.isConnected
                ? 'Supabase conectado: sincronização contínua com banco de dados ativa'
                : 'Clique para conectar banco Supabase'
            }
          >
            <Database className="w-3.5 h-3.5 opacity-80" />
            <span className="hidden sm:inline">
              {supabaseStatus.isConnected
                ? 'Supabase Conectado'
                : supabaseStatus.isConfigured
                ? 'Conectando...'
                : 'Supabase'}
            </span>
          </button>

          {/* Settings button */}
          <button
            type="button"
            onClick={onOpenSettingsModal}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
            title="Configurações do casal"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Primary CTA: Add Transaction */}
          <button
            type="button"
            onClick={onOpenNewTransaction}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="flex lg:hidden items-center justify-around gap-1 pt-3 mt-3 border-t border-slate-800 text-xs font-medium">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`px-3 py-1 rounded transition-colors ${
            currentTab === 'dashboard' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setCurrentTab('transactions')}
          className={`px-3 py-1 rounded transition-colors ${
            currentTab === 'transactions' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          Lançamentos
        </button>
        <button
          onClick={() => setCurrentTab('settlement')}
          className={`px-3 py-1 rounded transition-colors ${
            currentTab === 'settlement' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          Acerto de Contas
        </button>
        <button
          onClick={() => setCurrentTab('categories')}
          className={`px-3 py-1 rounded transition-colors ${
            currentTab === 'categories' ? 'bg-slate-800 text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          Categorias
        </button>
      </div>
    </header>
  );
};
