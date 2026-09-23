/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { TopBar } from './components/TopBar';
import { OverviewMetrics } from './components/OverviewMetrics';
import { BalanceSettlementCard } from './components/BalanceSettlementCard';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { SupabaseModal } from './components/SupabaseModal';
import { SettingsModal } from './components/SettingsModal';
import { Transaction } from './types/finance';
import { Zap, X, Shield, ArrowRight, Plus, Radio, Sparkles } from 'lucide-react';
import { getTodayString } from './utils/formatters';

const DashboardContent: React.FC = () => {
  const { notification, dismissNotification, supabaseStatus, partners, activeDeviceUser, addTransaction, connectedDevices } = useFinance();

  const [currentTab, setCurrentTab] = useState<'dashboard' | 'transactions' | 'categories' | 'settlement'>('dashboard');
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
      notes: `Lançado pelo celular de ${authorName} para testar a sincronização imediata`,
    });
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans">
      {/* Top Bar matching Top Bar Contract */}
      <TopBar
        onOpenNewTransaction={handleOpenNewTransaction}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

      {/* Realtime Notification Toast */}
      {notification && (
        <div className="bg-emerald-900/90 border-b border-emerald-700/80 px-4 py-2.5 text-xs text-emerald-100 flex items-center justify-between shadow-lg sticky top-[57px] z-20 backdrop-blur-md transition-all">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notification}</span>
            </div>
            <button
              onClick={dismissNotification}
              className="text-emerald-300 hover:text-white p-1 rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Supabase Onboarding Banner if not configured yet */}
      {!supabaseStatus.isConfigured && (
        <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 border-b border-slate-800 px-4 py-2.5 text-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>
                <strong>Quer sincronizar com o celular da sua esposa?</strong> Conecte seu Supabase em 1 minuto para sincronização automática em tempo real.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsSupabaseModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-300 rounded-md font-semibold transition-colors cursor-pointer self-start sm:self-auto whitespace-nowrap"
            >
              <span>Configurar Supabase</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* TAB 1: DASHBOARD (VISÃO GERAL) */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Live Sync Quick Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                </span>
                <span className="text-slate-300 font-medium">
                  Sincronização instantânea ativa:
                </span>
                <span className="text-slate-400">
                  Qualquer lançamento feito por você ou por {partners.partner2Name} aparece na hora em ambos os celulares.
                </span>
              </div>

              <button
                type="button"
                onClick={handleSimulatePartnerSync}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                title={`Simula ${activeDeviceUser === 'partner1' ? partners.partner2Name : partners.partner1Name} cadastrando um gasto no celular dela agora`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simular Lançamento da Esposa (Teste)</span>
              </button>
            </div>

            {/* Overview KPI Metrics & Month Navigator */}
            <OverviewMetrics />

            {/* Split row: Acerto de Contas & Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BalanceSettlementCard />
              <CategoryBreakdown onSelectCategory={handleSelectCategory} />
            </div>

            {/* Recent Transactions Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Lançamentos Recentes
                  </h3>
                  <p className="text-xs text-slate-400">
                    Últimas movimentações registradas por você e {partners.partner2Name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentTab('transactions')}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Ver Todos os Lançamentos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <TransactionList
                onEditTransaction={handleEditTransaction}
                onNewTransaction={handleOpenNewTransaction}
                selectedCategoryFilter={selectedCategoryFilter}
                onClearCategoryFilter={() => setSelectedCategoryFilter(null)}
              />
            </div>
          </div>
        )}

        {/* TAB 2: TRANSACTIONS (LANÇAMENTOS) */}
        {currentTab === 'transactions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Livro de Lançamentos do Casal
                </h2>
                <p className="text-xs text-slate-400">
                  Gerencie, filtre e acompanhe todas as entradas e saídas detalhadamente
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenNewTransaction}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Lançamento</span>
              </button>
            </div>

            <OverviewMetrics />

            <TransactionList
              onEditTransaction={handleEditTransaction}
              onNewTransaction={handleOpenNewTransaction}
              selectedCategoryFilter={selectedCategoryFilter}
              onClearCategoryFilter={() => setSelectedCategoryFilter(null)}
            />
          </div>
        )}

        {/* TAB 3: SETTLEMENT (DIVISÃO & ACERTO) */}
        {currentTab === 'settlement' && (
          <div className="space-y-6">
            <div className="pb-2 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Divisão & Balanço Financeiro do Casal
              </h2>
              <p className="text-xs text-slate-400">
                Acompanhe o equilíbrio dos gastos da casa, quem pagou mais e acertos de contas pendentes
              </p>
            </div>

            <OverviewMetrics />
            <BalanceSettlementCard />

            <div className="pt-4">
              <h3 className="text-sm font-bold text-white mb-3">
                Despesas Marcadas como Compartilhadas
              </h3>
              <TransactionList
                onEditTransaction={handleEditTransaction}
                onNewTransaction={handleOpenNewTransaction}
              />
            </div>
          </div>
        )}

        {/* TAB 4: CATEGORIES (CATEGORIAS) */}
        {currentTab === 'categories' && (
          <div className="space-y-6">
            <div className="pb-2 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Análise por Categorias
              </h2>
              <p className="text-xs text-slate-400">
                Detalhamento dos gastos mensais em moradia, mercado, restaurantes, transporte e lazer
              </p>
            </div>

            <OverviewMetrics />
            <CategoryBreakdown onSelectCategory={handleSelectCategory} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 px-4 lg:px-8 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Finanças a Dois</span>
            <span>·</span>
            <span>Gestão Compartilhada para Casais</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Sincronizado via Supabase</span>
            <span>·</span>
            <button
              type="button"
              onClick={() => setIsSupabaseModalOpen(true)}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Configurar Banco
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Parceiros & Divisão
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
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
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <DashboardContent />
    </FinanceProvider>
  );
}
