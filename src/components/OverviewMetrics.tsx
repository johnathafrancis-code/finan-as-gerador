import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatMonthName } from '../utils/formatters';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, PiggyBank, Calendar } from 'lucide-react';

export const OverviewMetrics: React.FC = () => {
  const {
    transactions,
    partners,
    selectedMonth,
    setSelectedMonth,
    filterOwner,
    setFilterOwner,
  } = useFinance();

  // Month navigation helpers
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const prevYear = date.getFullYear();
    const prevMonth = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${prevYear}-${prevMonth}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    const nextYear = date.getFullYear();
    const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${nextYear}-${nextMonth}`);
  };

  // Filter transactions for current selected month
  const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));

  // Transactions filtered by perspective
  const filteredTransactions = monthTransactions.filter(t => {
    if (filterOwner === 'all') return true;
    return t.owner === filterOwner;
  });

  // Totals
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  // Breakdown by partner
  const p1Expenses = monthTransactions
    .filter(t => t.type === 'expense' && t.owner === 'partner1')
    .reduce((sum, t) => sum + t.amount, 0);

  const p2Expenses = monthTransactions
    .filter(t => t.type === 'expense' && t.owner === 'partner2')
    .reduce((sum, t) => sum + t.amount, 0);

  const sharedExpenses = monthTransactions
    .filter(t => t.type === 'expense' && t.owner === 'shared')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingExpenses = monthTransactions
    .filter(t => t.type === 'expense' && t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <section className="space-y-6">
      {/* Month Navigation & Perspective Segmented Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/60 rounded-lg border border-slate-700/50">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-white tracking-wide">
              {formatMonthName(selectedMonth)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Perspective Filter Tabs */}
        <div className="flex items-center p-1 bg-slate-950/70 rounded-lg border border-slate-800 text-xs font-medium overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterOwner('all')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              filterOwner === 'all'
                ? 'bg-slate-800 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Visão Geral Casal
          </button>
          <button
            type="button"
            onClick={() => setFilterOwner('partner1')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              filterOwner === 'partner1'
                ? 'bg-slate-800 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {partners.partner1Avatar && (
              <img
                src={partners.partner1Avatar}
                alt=""
                referrerPolicy="no-referrer"
                className="w-3.5 h-3.5 rounded-full object-cover"
              />
            )}
            <span>{partners.partner1Name}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterOwner('partner2')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              filterOwner === 'partner2'
                ? 'bg-slate-800 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {partners.partner2Avatar && (
              <img
                src={partners.partner2Avatar}
                alt=""
                referrerPolicy="no-referrer"
                className="w-3.5 h-3.5 rounded-full object-cover"
              />
            )}
            <span>{partners.partner2Name}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterOwner('shared')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              filterOwner === 'shared'
                ? 'bg-slate-800 text-emerald-400 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Compartilhado
          </button>
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receitas */}
        <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total de Entradas</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-bold tracking-tight text-emerald-400 font-mono tabular-nums block">
              {formatCurrency(totalIncome)}
            </span>
            <div className="text-xs text-slate-400">
              <span>{filteredTransactions.filter(t => t.type === 'income').length} lançamentos</span>
              <span className="mx-1.5">·</span>
              <span>{formatMonthName(selectedMonth).split(' ')[0]}</span>
            </div>
          </div>
        </div>

        {/* Despesas */}
        <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Total de Saídas</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-bold tracking-tight text-rose-400 font-mono tabular-nums block">
              {formatCurrency(totalExpense)}
            </span>
            <div className="text-xs text-slate-400">
              <span>{filteredTransactions.filter(t => t.type === 'expense').length} despesas</span>
              {pendingExpenses > 0 && (
                <>
                  <span className="mx-1.5">·</span>
                  <span className="text-amber-400 font-medium">
                    {formatCurrency(pendingExpenses)} pendente
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Saldo Líquido */}
        <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Saldo Líquido</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              netBalance >= 0 ? 'bg-sky-500/10 text-sky-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span
              className={`text-2xl font-bold tracking-tight font-mono tabular-nums block ${
                netBalance >= 0 ? 'text-white' : 'text-rose-400'
              }`}
            >
              {formatCurrency(netBalance)}
            </span>
            <div className="text-xs text-slate-400">
              {netBalance >= 0 ? 'Superávit no período' : 'Déficit no período'}
              <span className="mx-1.5">·</span>
              <span>{netBalance >= 0 ? 'Positivo' : 'Atenção aos gastos'}</span>
            </div>
          </div>
        </div>

        {/* Taxa de Poupança */}
        <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Taxa de Poupança</span>
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-2xl font-bold tracking-tight text-violet-300 font-mono tabular-nums block">
              {savingsRate.toFixed(1)}%
            </span>
            <div className="text-xs text-slate-400">
              <span>{savingsRate >= 20 ? 'Meta saudável atingida (>20%)' : 'Abaixo da meta recomendada'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Distribution Bar: Quem Gastou Quanto */}
      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/60">
        <div className="flex items-center justify-between text-xs text-slate-300 mb-3">
          <span className="font-semibold text-slate-200">Divisão dos Gastos deste Mês</span>
          <span className="text-slate-400 font-mono">
            Total Despesas: {formatCurrency(p1Expenses + p2Expenses + sharedExpenses)}
          </span>
        </div>

        {/* Progress bar */}
        {p1Expenses + p2Expenses + sharedExpenses > 0 ? (
          <div className="h-3.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
            {p1Expenses > 0 && (
              <div
                style={{
                  width: `${(p1Expenses / (p1Expenses + p2Expenses + sharedExpenses)) * 100}%`,
                }}
                className="bg-indigo-500 h-full transition-all"
                title={`${partners.partner1Name}: ${formatCurrency(p1Expenses)}`}
              />
            )}
            {p2Expenses > 0 && (
              <div
                style={{
                  width: `${(p2Expenses / (p1Expenses + p2Expenses + sharedExpenses)) * 100}%`,
                }}
                className="bg-pink-500 h-full transition-all"
                title={`${partners.partner2Name}: ${formatCurrency(p2Expenses)}`}
              />
            )}
            {sharedExpenses > 0 && (
              <div
                style={{
                  width: `${(sharedExpenses / (p1Expenses + p2Expenses + sharedExpenses)) * 100}%`,
                }}
                className="bg-emerald-500 h-full transition-all"
                title={`Compartilhado: ${formatCurrency(sharedExpenses)}`}
              />
            )}
          </div>
        ) : (
          <div className="h-3.5 w-full bg-slate-800 rounded-full" />
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs mt-3 pt-2 text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
            <span>{partners.partner1Name}:</span>
            <span className="text-slate-200 font-mono font-medium">{formatCurrency(p1Expenses)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block"></span>
            <span>{partners.partner2Name}:</span>
            <span className="text-slate-200 font-mono font-medium">{formatCurrency(p2Expenses)}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Compartilhado:</span>
            <span className="text-slate-200 font-mono font-medium">{formatCurrency(sharedExpenses)}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
