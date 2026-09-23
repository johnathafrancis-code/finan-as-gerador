/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { TopBar } from './components/TopBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OverviewMetrics } from './components/OverviewMetrics';
import { BalanceSettlementCard } from './components/BalanceSettlementCard';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { SupabaseModal } from './components/SupabaseModal';
import { SettingsModal } from './components/SettingsModal';
import { Transaction } from './types/finance';
import {
  Zap,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Database,
  ReceiptText,
  HeartHandshake,
  Trash2,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { getTodayString } from './utils/formatters';

const DashboardContent: React.FC = () => {
  const {
    notification,
    dismissNotification,
    supabaseStatus,
    partners,
    activeDeviceUser,
    addTransaction,
    transactions,
    selectedMonth,
  } = useFinance();

  const [currentTab, setCurrentTab] = useState<'dashboard' | 'transactions' | 'categories' | 'settlement' | 'settings'>('dashboard');
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  const handleOpenNewTransaction = () => {
    setTransactionToEdit(null);
    setIsTransactionModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setTransactionToEdit(tx);
    setIsTransactionModalOpen(true);
  };

  const handleSelectCategory = (catId: string) => {
    setSelectedCategoryFilter(catId);
    setCurrentTab('transactions');
  };

  const handleSimulatePartnerSync = async () => {
    const isP1 = activeDeviceUser === 'partner1';
    const targetOwner = isP1 ? 'partner2' : 'partner1';
    const authorName = isP1 ? partners.partner2Name : partners.partner1Name;
    const samples = [
      { desc: 'Farmácia (Remédios)', amount: 64.90, cat: 'saude' },
      { desc: 'Supermercado (Feira da Semana)', amount: 135.50, cat: 'supermercado' },
      { desc: 'Cafeteria & Lanche', amount: 28.00, cat: 'restaurante' },
      { desc: 'Uber para o Trabalho', amount: 24.80, cat: 'transporte' },
    ];
    const pick = samples[Math.floor(Math.random() * samples.length)];

    await addTransaction({
      description: pick.desc,
      amount: pick.amount,
      type: 'expense',
      category: pick.cat,
      owner: targetOwner,
      date: getTodayString(),
      payment_method: 'pix',
      status: 'paid',
      notes: `Lançado pelo celular de ${authorName} para testar a sincronização em tempo real`,
    });
  };

  const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center text-slate-900 font-sans">
      {/* Mobile Frame Container (Max width 430px for authentic phone feel on any screen) */}
      <div className="w-full max-w-md min-h-screen bg-slate-50 flex flex-col relative shadow-xl shadow-slate-200/80 border-x border-slate-200/60 pb-20">
        
        {/* Sticky Mobile Top Bar */}
        <TopBar
          onOpenNewTransaction={handleOpenNewTransaction}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        />

        {/* Realtime Notification Banner */}
        {notification && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs text-emerald-800 flex items-center justify-between sticky top-[53px] z-20 shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2 truncate pr-2">
              <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium truncate">{notification}</span>
            </div>
            <button
              type="button"
              onClick={dismissNotification}
              className="text-emerald-600 hover:text-emerald-900 p-1 rounded-md cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-3.5 space-y-3.5">
          {/* TAB 1: INÍCIO (DASHBOARD) */}
          {currentTab === 'dashboard' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              {/* Overview Metrics (Month scroller + Balance Card + Partner cards) */}
              <OverviewMetrics />

              {/* Quick Actions Shortcuts */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleOpenNewTransaction}
                  className="p-3 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:border-slate-300 active:scale-[0.98] transition-all flex items-center gap-2.5 cursor-pointer text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block leading-tight">
                      + Despesa
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Gasto comum ou seu
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleOpenNewTransaction}
                  className="p-3 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:border-slate-300 active:scale-[0.98] transition-all flex items-center gap-2.5 cursor-pointer text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <ArrowDownLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block leading-tight">
                      + Receita
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Salário ou entrada
                    </span>
                  </div>
                </button>
              </div>

              {/* Fast Realtime Test Simulation Button */}
              <button
                type="button"
                onClick={handleSimulatePartnerSync}
                className="w-full py-2.5 px-3 bg-white border border-dashed border-emerald-300 rounded-xl text-xs font-semibold text-emerald-800 hover:bg-emerald-50/50 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Simular Lançamento da Esposa (Teste em Tempo Real)</span>
              </button>

              {/* Balance Settlement (Divisão & Acerto) */}
              <BalanceSettlementCard />

              {/* Category Breakdown (Gastos por Categoria) */}
              <CategoryBreakdown onSelectCategory={handleSelectCategory} />

              {/* Recent Transactions Preview */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <ReceiptText className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Lançamentos Recentes
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentTab('transactions')}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Ver todos ({monthTransactions.length})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {monthTransactions.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    Nenhum lançamento cadastrado neste mês.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {monthTransactions.slice(0, 4).map(tx => (
                      <div
                        key={tx.id}
                        onClick={() => handleEditTransaction(tx)}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="text-xs font-semibold text-slate-800 block truncate">
                            {tx.description}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {tx.date} · {tx.owner === 'partner1' ? partners.partner1Name : (tx.owner === 'partner2' ? partners.partner2Name : 'Compartilhado')}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-bold font-mono shrink-0 tabular-nums ${
                            tx.type === 'expense' ? 'text-slate-900' : 'text-emerald-700'
                          }`}
                        >
                          {tx.type === 'expense' ? '- ' : '+ '}
                          R$ {tx.amount.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: EXTRATO COMPLETO */}
          {currentTab === 'transactions' && (
            <div className="animate-in fade-in duration-150">
              <TransactionList
                onEditTransaction={handleEditTransaction}
                onNewTransaction={handleOpenNewTransaction}
                selectedCategoryFilter={selectedCategoryFilter}
                onClearCategoryFilter={() => setSelectedCategoryFilter(null)}
              />
            </div>
          )}

          {/* TAB 3: DIVISÃO & ACERTO */}
          {currentTab === 'settlement' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <BalanceSettlementCard />
              <CategoryBreakdown onSelectCategory={handleSelectCategory} />
            </div>
          )}

          {/* TAB 4: AJUSTES */}
          {currentTab === 'settings' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Ajustes & Conexões
                </h3>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 text-left flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                        <HeartHandshake className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Configurações do Casal
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {partners.partner1Name} & {partners.partner2Name} ({Math.round(partners.splitRatio * 100)}% / {Math.round((1 - partners.splitRatio) * 100)}%)
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSupabaseModalOpen(true)}
                    className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 text-left flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Conexão Nuvem Supabase
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {supabaseStatus.isConnected
                            ? 'Conectado em tempo real'
                            : 'Configurar URL e Chave do Supabase'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="w-full p-3 bg-rose-50 hover:bg-rose-100/70 rounded-xl border border-rose-200 text-left flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                        <Trash2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-rose-800 block">
                          Zerar Lançamentos
                        </span>
                        <span className="text-[10px] text-rose-600">
                          Limpar todos os dados para começar do zero
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-rose-400" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Fixed Mobile Bottom Tab Bar (Thumb Zone) */}
        <MobileBottomNav
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onOpenNewTransaction={handleOpenNewTransaction}
        />

        {/* Modals as Mobile Bottom Sheets */}
        <TransactionModal
          isOpen={isTransactionModalOpen}
          onClose={() => {
            setIsTransactionModalOpen(false);
            setTransactionToEdit(null);
          }}
          transactionToEdit={transactionToEdit}
        />

        <SupabaseModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
        />

        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <DashboardContent />
    </FinanceProvider>
  );
}
