import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { Database, Settings, Volume2, VolumeX, Smartphone, Radio } from 'lucide-react';

interface TopBarProps {
  onOpenNewTransaction: () => void;
  onOpenSupabaseModal: () => void;
  onOpenSettingsModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenNewTransaction,
  onOpenSupabaseModal,
  onOpenSettingsModal,
}) => {
  const {
    partners,
    activeDeviceUser,
    setActiveDeviceUser,
    supabaseStatus,
    connectedDevices,
    soundEnabled,
    setSoundEnabled,
  } = useFinance();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 shadow-xs">
      <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
            <span className="font-extrabold text-sm tracking-tight">2x</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-none">
              Finanças a Dois
            </h1>
            <span className="text-[10px] text-slate-600 font-medium">
              Controle Compartilhado
            </span>
          </div>
        </div>

        {/* Center / Right: Spouse Switcher (Thumb-friendly segmented control) */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveDeviceUser('partner1')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                activeDeviceUser === 'partner1'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title={`Este celular pertence a ${partners.partner1Name}`}
            >
              {partners.partner1Avatar ? (
                <img
                  src={partners.partner1Avatar}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-3.5 h-3.5 rounded-full object-cover"
                />
              ) : null}
              <span>{partners.partner1Name}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDeviceUser('partner2')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                activeDeviceUser === 'partner2'
                  ? 'bg-white text-pink-700 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title={`Este celular pertence a ${partners.partner2Name}`}
            >
              {partners.partner2Avatar ? (
                <img
                  src={partners.partner2Avatar}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-3.5 h-3.5 rounded-full object-cover"
                />
              ) : null}
              <span>{partners.partner2Name}</span>
            </button>
          </div>

          {/* Quick Realtime Indicator */}
          <button
            type="button"
            onClick={onOpenSupabaseModal}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${
              supabaseStatus.isConnected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title={
              supabaseStatus.isConnected
                ? 'Supabase Conectado em Tempo Real'
                : 'Conectar Supabase'
            }
          >
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Database className="w-3.5 h-3.5" />
          </button>

          {/* Sound toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title={soundEnabled ? 'Som de notificação ativado' : 'Som desativado'}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
