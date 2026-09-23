import React from 'react';
import { Home, ReceiptText, Plus, HeartHandshake, PiggyBank } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: 'dashboard' | 'transactions' | 'categories' | 'settlement' | 'vault';
  setCurrentTab: (tab: 'dashboard' | 'transactions' | 'categories' | 'settlement' | 'vault') => void;
  onOpenNewTransaction: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  setCurrentTab,
  onOpenNewTransaction,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-lg">
      <div className="max-w-md mx-auto px-3 py-1 flex items-center justify-around h-16">
        {/* Tab 1: Início */}
        <button
          type="button"
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-colors cursor-pointer ${
            currentTab === 'dashboard'
              ? 'text-emerald-600 font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Home className={`w-5 h-5 ${currentTab === 'dashboard' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
          <span className="text-[10px] mt-1 tracking-tight">Início</span>
        </button>

        {/* Tab 2: Extrato */}
        <button
          type="button"
          onClick={() => setCurrentTab('transactions')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-colors cursor-pointer ${
            currentTab === 'transactions'
              ? 'text-emerald-600 font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ReceiptText className={`w-5 h-5 ${currentTab === 'transactions' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
          <span className="text-[10px] mt-1 tracking-tight">Extrato</span>
        </button>

        {/* Tab 3: Central Primary Action [+] */}
        <div className="flex items-center justify-center px-2">
          <button
            type="button"
            onClick={onOpenNewTransaction}
            className="w-13 h-13 -mt-5 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 border-4 border-white transition-all cursor-pointer"
            aria-label="Novo Lançamento"
            title="Novo Lançamento"
          >
            <Plus className="w-6 h-6 stroke-[2.75]" />
          </button>
        </div>

        {/* Tab 4: Acerto de Contas */}
        <button
          type="button"
          onClick={() => setCurrentTab('settlement')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-colors cursor-pointer ${
            currentTab === 'settlement'
              ? 'text-emerald-600 font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HeartHandshake className={`w-5 h-5 ${currentTab === 'settlement' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
          <span className="text-[10px] mt-1 tracking-tight">Divisão</span>
        </button>

        {/* Tab 5: Cofre (Caixinhas de Metas) */}
        <button
          type="button"
          onClick={() => setCurrentTab('vault')}
          className={`flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 transition-colors cursor-pointer ${
            currentTab === 'vault'
              ? 'text-emerald-600 font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PiggyBank className={`w-5 h-5 ${currentTab === 'vault' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
          <span className="text-[10px] mt-1 tracking-tight">Cofre</span>
        </button>
      </div>
    </div>
  );
};
