import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatMonthName } from '../utils/formatters';
import { DEFAULT_CATEGORIES, PAYMENT_METHOD_LABELS } from '../data/defaultData';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  TrendingDown,
  Calendar,
  Wallet,
  PiggyBank,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { MonthPickerModal } from './MonthPickerModal';

export const ChartsView: React.FC = () => {
  const {
    transactions,
    partners,
    selectedMonth,
    setSelectedMonth,
    vaultGoals,
  } = useFinance();

  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [chartPerspective, setChartPerspective] = useState<'all' | 'partner1' | 'partner2'>('all');
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);
  const [activeMonthHover, setActiveMonthHover] = useState<number | null>(null);

  const transactionMonths = useMemo(() => Array.from(new Set(transactions.map(t => t.date.slice(0, 7)))), [transactions]);

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

  // Transactions filtered by selected month and perspective
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (!t.date.startsWith(selectedMonth)) return false;
      if (chartPerspective === 'all') return true;
      return t.owner === chartPerspective || t.owner === 'shared';
    });
  }, [transactions, selectedMonth, chartPerspective]);

  // Totals for current selected month
  const totalIncome = useMemo(() => {
    return monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const totalExpense = useMemo(() => {
    return monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Breakdown of expenses by category
  const categoryExpenses = useMemo(() => {
    const expenseList = monthTransactions.filter(t => t.type === 'expense');
    const map = new Map<string, number>();

    expenseList.forEach(t => {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    });

    const categoriesMap = new Map(DEFAULT_CATEGORIES.map(c => [c.name, c]));

    const result: { name: string; amount: number; percentage: number; color: string }[] = [];
    map.forEach((amount, name) => {
      const catConfig = categoriesMap.get(name);
      const color = catConfig?.color || '#94a3b8';
      const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
      result.push({ name, amount, percentage, color });
    });

    return result.sort((a, b) => b.amount - a.amount);
  }, [monthTransactions, totalExpense]);

  // Partner distribution (Who spent how much)
  const partnerSpending = useMemo(() => {
    const currentMonthExpenses = transactions.filter(t => t.date.startsWith(selectedMonth) && t.type === 'expense');
    const p1 = currentMonthExpenses.filter(t => t.owner === 'partner1').reduce((sum, t) => sum + t.amount, 0);
    const p2 = currentMonthExpenses.filter(t => t.owner === 'partner2').reduce((sum, t) => sum + t.amount, 0);
    const shared = currentMonthExpenses.filter(t => t.owner === 'shared').reduce((sum, t) => sum + t.amount, 0);
    const total = p1 + p2 + shared;

    return {
      p1: { name: partners.partner1Name, amount: p1, pct: total > 0 ? (p1 / total) * 100 : 0 },
      p2: { name: partners.partner2Name, amount: p2, pct: total > 0 ? (p2 / total) * 100 : 0 },
      shared: { name: 'Compartilhado', amount: shared, pct: total > 0 ? (shared / total) * 100 : 0 },
      total,
    };
  }, [transactions, selectedMonth, partners]);

  // Payment method distribution
  const paymentMethodsDistribution = useMemo(() => {
    const expenseList = monthTransactions.filter(t => t.type === 'expense');
    const map = new Map<string, number>();

    expenseList.forEach(t => {
      const pm = t.payment_method || 'pix';
      map.set(pm, (map.get(pm) || 0) + t.amount);
    });

    const result: { key: string; label: string; amount: number; percentage: number }[] = [];
    map.forEach((amount, key) => {
      const label = PAYMENT_METHOD_LABELS[key] || key;
      const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
      result.push({ key, label, amount, percentage });
    });

    return result.sort((a, b) => b.amount - a.amount);
  }, [monthTransactions, totalExpense]);

  // 6-Month comparative history (from selectedMonth backwards 5 months)
  const sixMonthsHistory = useMemo(() => {
    const [selYear, selMonth] = selectedMonth.split('-').map(Number);
    const monthsData: {
      monthKey: string;
      label: string;
      income: number;
      expense: number;
      savings: number;
      savingsRate: number;
    }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(selYear, selMonth - 1 - i, 1);
      const yearStr = d.getFullYear();
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${yearStr}-${monthStr}`;

      const txs = transactions.filter(t => t.date.startsWith(key));
      const inc = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const sav = inc - exp;
      const rate = inc > 0 ? (sav / inc) * 100 : 0;

      const shortMonthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const label = `${shortMonthNames[d.getMonth()]}/${String(yearStr).slice(2)}`;

      monthsData.push({
        monthKey: key,
        label,
        income: inc,
        expense: exp,
        savings: sav,
        savingsRate: rate,
      });
    }

    return monthsData;
  }, [transactions, selectedMonth]);

  // Max value for 6-months bar chart scaling
  const maxHistoryValue = useMemo(() => {
    let max = 0;
    sixMonthsHistory.forEach(m => {
      if (m.income > max) max = m.income;
      if (m.expense > max) max = m.expense;
    });
    return max > 0 ? max * 1.15 : 1000;
  }, [sixMonthsHistory]);

  // Total saved in Vault goals
  const vaultTotalSaved = useMemo(() => {
    return vaultGoals.reduce((sum, g) => sum + g.current_amount, 0);
  }, [vaultGoals]);

  const vaultTargetTotal = useMemo(() => {
    return vaultGoals.reduce((sum, g) => sum + g.target_amount, 0);
  }, [vaultGoals]);

  // Days in selected month for daily average
  const daysInSelectedMonth = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    return new Date(y, m, 0).getDate();
  }, [selectedMonth]);

  const dailyExpenseAverage = totalExpense / (daysInSelectedMonth || 30);

  // SVG Donut Slices calculation
  const donutSlices = useMemo(() => {
    if (totalExpense === 0 || categoryExpenses.length === 0) return [];

    let accumulatedAngle = 0;
    const radius = 38;
    const center = 50;

    return categoryExpenses.map((cat, idx) => {
      const sliceAngle = (cat.amount / totalExpense) * 360;
      const startAngle = accumulatedAngle;
      const endAngle = accumulatedAngle + sliceAngle;
      accumulatedAngle = endAngle;

      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);

      const largeArcFlag = sliceAngle > 180 ? 1 : 0;

      // Handle full circle (single category 100%)
      const pathData =
        sliceAngle >= 359.9
          ? `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center - 0.01} ${center - radius} Z`
          : `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      return {
        ...cat,
        pathData,
        index: idx,
      };
    });
  }, [categoryExpenses, totalExpense]);

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* 1. Header with Month Navigator */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200/90 px-3.5 py-2 shadow-xs">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
          title="Mês Anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setIsMonthPickerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 active:scale-95 transition-all text-xs font-bold text-slate-800 capitalize tracking-tight cursor-pointer group"
          title="Clique para abrir o calendário e selecionar o mês"
        >
          <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          <span>{formatMonthName(selectedMonth)}</span>
        </button>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
          title="Próximo Mês"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Filter Perspective Pill Selector */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-1 flex items-center shadow-2xs">
        <button
          type="button"
          onClick={() => setChartPerspective('all')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
            chartPerspective === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Casal (Geral)
        </button>
        <button
          type="button"
          onClick={() => setChartPerspective('partner1')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
            chartPerspective === 'partner1'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {partners.partner1Name}
        </button>
        <button
          type="button"
          onClick={() => setChartPerspective('partner2')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
            chartPerspective === 'partner2'
              ? 'bg-pink-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {partners.partner2Name}
        </button>
      </div>

      {/* 3. Key Financial Summary Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Receitas */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Receitas (Entradas)</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-base sm:text-lg font-bold text-emerald-600 font-mono tracking-tight block">
              {formatCurrency(totalIncome)}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {monthTransactions.filter(t => t.type === 'income').length} lançamento(s)
            </span>
          </div>
        </div>

        {/* Despesas */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Gastos (Saídas)</span>
            <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-base sm:text-lg font-bold text-rose-600 font-mono tracking-tight block">
              {formatCurrency(totalExpense)}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {monthTransactions.filter(t => t.type === 'expense').length} lançamento(s)
            </span>
          </div>
        </div>

        {/* Economia Líquida / Saldo do Mês */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Economia Líquida</span>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${netSavings >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className={`text-base sm:text-lg font-bold font-mono tracking-tight block ${netSavings >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {formatCurrency(netSavings)}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {totalIncome > 0 ? `${savingsRate.toFixed(1)}% economizado` : 'Sem entradas'}
            </span>
          </div>
        </div>

        {/* Média Diária de Gastos */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Média Diária</span>
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-base sm:text-lg font-bold text-slate-900 font-mono tracking-tight block">
              {formatCurrency(dailyExpenseAverage)}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              em {daysInSelectedMonth} dias do mês
            </span>
          </div>
        </div>
      </div>

      {/* 4. Gráfico 1: Evolução Histórica (6 Meses) - Entradas vs Saídas vs Economia */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                Evolução dos Últimos 6 Meses
              </h3>
              <p className="text-[10.5px] text-slate-500">
                Comparativo de receitas e gastos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-semibold">
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Receitas
            </span>
            <span className="flex items-center gap-1 text-rose-500">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span> Gastos
            </span>
          </div>
        </div>

        {/* Interactive SVG / HTML Bar Chart */}
        <div className="pt-4 pb-1">
          <div className="h-44 flex items-end justify-between gap-2 sm:gap-3 px-1 border-b border-slate-200">
            {sixMonthsHistory.map((m, idx) => {
              const incomeHeight = Math.max(4, Math.round((m.income / maxHistoryValue) * 100));
              const expenseHeight = Math.max(4, Math.round((m.expense / maxHistoryValue) * 100));
              const isSelected = m.monthKey === selectedMonth;
              const isHovered = activeMonthHover === idx;

              return (
                <div
                  key={m.monthKey}
                  className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                  onClick={() => setSelectedMonth(m.monthKey)}
                  onMouseEnter={() => setActiveMonthHover(idx)}
                  onMouseLeave={() => setActiveMonthHover(null)}
                >
                  {/* Floating tooltip on hover/select */}
                  {(isHovered || isSelected) && (
                    <div className="absolute -top-10 z-20 bg-slate-900 text-white text-[9.5px] py-1 px-2 rounded-lg shadow-md whitespace-nowrap pointer-events-none flex flex-col items-center">
                      <span>{m.label}</span>
                      <span className="font-mono text-emerald-300 font-bold">
                        {m.savings >= 0 ? `+${formatCurrency(m.savings)}` : formatCurrency(m.savings)}
                      </span>
                    </div>
                  )}

                  {/* Dual Bars */}
                  <div className="w-full flex items-end justify-center gap-1 max-w-[42px] h-full pb-0.5">
                    {/* Income Bar */}
                    <div
                      style={{ height: `${m.income > 0 ? incomeHeight : 4}%` }}
                      className={`w-1/2 rounded-t-md transition-all ${
                        isSelected
                          ? 'bg-emerald-600 shadow-xs'
                          : 'bg-emerald-400/80 hover:bg-emerald-500'
                      }`}
                      title={`Receita: ${formatCurrency(m.income)}`}
                    />
                    {/* Expense Bar */}
                    <div
                      style={{ height: `${m.expense > 0 ? expenseHeight : 4}%` }}
                      className={`w-1/2 rounded-t-md transition-all ${
                        isSelected
                          ? 'bg-rose-500 shadow-xs'
                          : 'bg-rose-300/80 hover:bg-rose-400'
                      }`}
                      title={`Gasto: ${formatCurrency(m.expense)}`}
                    />
                  </div>

                  {/* Month Label below baseline */}
                  <span
                    className={`text-[10px] mt-2 font-mono transition-colors ${
                      isSelected
                        ? 'font-bold text-emerald-700 bg-emerald-50 px-1 rounded'
                        : 'text-slate-500'
                    }`}
                  >
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400" />
            Toque em qualquer mês para ver os detalhes
          </span>
          <span className="font-mono text-[10px]">
            {selectedMonth} selecionado
          </span>
        </div>
      </div>

      {/* 5. Gráfico 2: Medidor de Economia / Taxa de Poupança (Gauge Meter) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <PiggyBank className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight">
              Taxa de Economia do Mês
            </h3>
            <p className="text-[10.5px] text-slate-500">
              Quanto da renda do casal foi poupada
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 py-2">
          {/* Radial Circular Progress SVG */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background track circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#e2e8f0"
                strokeWidth="10"
                fill="none"
              />
              {/* Colored progress arc */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={savingsRate >= 20 ? '#10b981' : savingsRate > 0 ? '#3b82f6' : '#ef4444'}
                strokeWidth="10"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - Math.min(100, Math.max(0, savingsRate)) / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
              <span className={`text-xl font-extrabold font-mono leading-tight ${savingsRate >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {savingsRate > 0 ? `${savingsRate.toFixed(0)}%` : '0%'}
              </span>
              <span className="text-[9.5px] text-slate-500 font-semibold uppercase tracking-wider">
                Economizado
              </span>
            </div>
          </div>

          {/* Diagnosis description */}
          <div className="flex-1 space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                {savingsRate >= 20 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-emerald-800">Excelente Ritmo! 🚀</span>
                  </>
                ) : savingsRate > 10 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-blue-800">Bom Ritmo de Poupança 👏</span>
                  </>
                ) : savingsRate > 0 ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-amber-800">Margem Apertada ⚠️</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="text-rose-800">Gastos Acima das Entradas 🚨</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {savingsRate >= 20
                  ? `Parabéns! Vocês economizaram ${savingsRate.toFixed(1)}% da renda neste mês. O recomendado por especialistas é acima de 20%.`
                  : savingsRate > 0
                  ? `Sobrou ${formatCurrency(netSavings)} após pagar todas as contas do mês. Vale destinar uma parte para o Cofre.`
                  : 'Neste mês os gastos superaram as entradas. Revise as categorias abaixo para identificar onde estão as maiores saídas.'}
              </p>
            </div>

            {/* Cofre Quick Stats */}
            {vaultTargetTotal > 0 && (
              <div className="flex items-center justify-between text-[11px] px-1 text-slate-600">
                <span>Total guardado no Cofre:</span>
                <span className="font-bold text-emerald-700 font-mono">
                  {formatCurrency(vaultTotalSaved)} de {formatCurrency(vaultTargetTotal)} ({((vaultTotalSaved / vaultTargetTotal) * 100).toFixed(0)}%)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Gráfico 3: Gastos por Categoria (Donut SVG + Detalhamento) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                Gastos por Categoria
              </h3>
              <p className="text-[10.5px] text-slate-500">
                Onde foi parar o dinheiro do casal
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-800">
            {formatCurrency(totalExpense)}
          </span>
        </div>

        {categoryExpenses.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Nenhuma despesa registrada em {formatMonthName(selectedMonth)}.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Visual Donut Chart SVG */}
            <div className="flex justify-center py-2">
              <div className="relative w-44 h-44">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {donutSlices.map(slice => {
                    const isHovered = activeCategoryIndex === slice.index;
                    return (
                      <path
                        key={slice.name}
                        d={slice.pathData}
                        fill={slice.color}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        className={`transition-all duration-200 cursor-pointer ${
                          isHovered ? 'opacity-100 scale-105 origin-center' : 'opacity-90 hover:opacity-100'
                        }`}
                        onMouseEnter={() => setActiveCategoryIndex(slice.index)}
                        onMouseLeave={() => setActiveCategoryIndex(null)}
                      />
                    );
                  })}
                  {/* Donut Inner Hole */}
                  <circle cx="50" cy="50" r="24" fill="#ffffff" />
                </svg>

                {/* Donut Center Info */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2">
                  <span className="text-[9px] text-slate-500 uppercase font-semibold">
                    {activeCategoryIndex !== null && categoryExpenses[activeCategoryIndex]
                      ? categoryExpenses[activeCategoryIndex].name
                      : 'Total'}
                  </span>
                  <span className="text-xs font-bold font-mono text-slate-900 truncate max-w-[80px]">
                    {activeCategoryIndex !== null && categoryExpenses[activeCategoryIndex]
                      ? formatCurrency(categoryExpenses[activeCategoryIndex].amount)
                      : formatCurrency(totalExpense)}
                  </span>
                </div>
              </div>
            </div>

            {/* Categories List with Progress Bars */}
            <div className="space-y-2.5 pt-1">
              {categoryExpenses.map((cat, idx) => {
                const isHovered = activeCategoryIndex === idx;
                return (
                  <div
                    key={cat.name}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      isHovered ? 'bg-slate-100/90 scale-[1.01]' : 'hover:bg-slate-50'
                    }`}
                    onMouseEnter={() => setActiveCategoryIndex(idx)}
                    onMouseLeave={() => setActiveCategoryIndex(null)}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-semibold text-slate-800 truncate">
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono shrink-0 ml-2">
                        <span className="font-bold text-slate-900">
                          {formatCurrency(cat.amount)}
                        </span>
                        <span className="text-[10px] text-slate-500 w-10 text-right">
                          {cat.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(2, cat.percentage)}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 7. Gráfico 4: Divisão de Gastos do Casal (Johnatha vs Raisa vs Compartilhado) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight">
              Quem Gastou Mais no Mês?
            </h3>
            <p className="text-[10.5px] text-slate-500">
              Proporção individual vs compartilhada
            </p>
          </div>
          <span className="text-xs font-bold text-slate-800 font-mono">
            {formatCurrency(partnerSpending.total)}
          </span>
        </div>

        {partnerSpending.total === 0 ? (
          <div className="py-4 text-center text-xs text-slate-500">
            Nenhum gasto registrado.
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {/* Horizontal Stacked Bar */}
            <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100">
              {partnerSpending.p1.pct > 0 && (
                <div
                  style={{ width: `${partnerSpending.p1.pct}%` }}
                  className="bg-indigo-500 h-full transition-all"
                  title={`${partnerSpending.p1.name}: ${partnerSpending.p1.pct.toFixed(1)}%`}
                />
              )}
              {partnerSpending.p2.pct > 0 && (
                <div
                  style={{ width: `${partnerSpending.p2.pct}%` }}
                  className="bg-pink-500 h-full transition-all"
                  title={`${partnerSpending.p2.name}: ${partnerSpending.p2.pct.toFixed(1)}%`}
                />
              )}
              {partnerSpending.shared.pct > 0 && (
                <div
                  style={{ width: `${partnerSpending.shared.pct}%` }}
                  className="bg-emerald-500 h-full transition-all"
                  title={`Compartilhado: ${partnerSpending.shared.pct.toFixed(1)}%`}
                />
              )}
            </div>

            {/* Details for each */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2 bg-indigo-50/60 rounded-xl border border-indigo-100">
                <span className="text-[10px] text-indigo-700 font-bold block truncate">
                  {partnerSpending.p1.name}
                </span>
                <span className="text-xs font-extrabold text-indigo-950 font-mono block mt-0.5 truncate">
                  {formatCurrency(partnerSpending.p1.amount)}
                </span>
                <span className="text-[9.5px] text-indigo-600 font-semibold block">
                  {partnerSpending.p1.pct.toFixed(0)}%
                </span>
              </div>

              <div className="p-2 bg-pink-50/60 rounded-xl border border-pink-100">
                <span className="text-[10px] text-pink-700 font-bold block truncate">
                  {partnerSpending.p2.name}
                </span>
                <span className="text-xs font-extrabold text-pink-950 font-mono block mt-0.5 truncate">
                  {formatCurrency(partnerSpending.p2.amount)}
                </span>
                <span className="text-[9.5px] text-pink-600 font-semibold block">
                  {partnerSpending.p2.pct.toFixed(0)}%
                </span>
              </div>

              <div className="p-2 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-emerald-700 font-bold block truncate">
                  Compartilhado
                </span>
                <span className="text-xs font-extrabold text-emerald-950 font-mono block mt-0.5 truncate">
                  {formatCurrency(partnerSpending.shared.amount)}
                </span>
                <span className="text-[9.5px] text-emerald-600 font-semibold block">
                  {partnerSpending.shared.pct.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 8. Gráfico 5: Formas de Pagamento Mais Utilizadas */}
      {paymentMethodsDistribution.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight">
              Formas de Pagamento Mais Usadas
            </h3>
            <p className="text-[10.5px] text-slate-500">
              Pix vs Cartões vs Dinheiro
            </p>
          </div>

          <div className="space-y-2">
            {paymentMethodsDistribution.map(pm => (
              <div key={pm.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{pm.label}</span>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="font-bold text-slate-900">{formatCurrency(pm.amount)}</span>
                    <span className="text-slate-500 w-10 text-right">({pm.percentage.toFixed(0)}%)</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-800 rounded-full"
                    style={{ width: `${Math.max(3, pm.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month Picker Calendar Modal */}
      <MonthPickerModal
        isOpen={isMonthPickerOpen}
        onClose={() => setIsMonthPickerOpen(false)}
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
        transactionMonths={transactionMonths}
      />
    </div>
  );
};
