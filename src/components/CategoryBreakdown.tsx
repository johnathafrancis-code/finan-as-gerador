import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { DEFAULT_CATEGORIES } from '../data/defaultData';
import { formatCurrency, formatMonthName } from '../utils/formatters';
import { PieChart, Tag, ArrowUpRight } from 'lucide-react';

interface CategoryBreakdownProps {
  onSelectCategory?: (categoryId: string) => void;
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ onSelectCategory }) => {
  const { transactions, selectedMonth, partners } = useFinance();

  const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));
  const expenseTransactions = monthTransactions.filter(t => t.type === 'expense');
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Group by category
  const categoryMap: Record<string, { categoryId: string; amount: number; count: number }> = {};

  expenseTransactions.forEach(tx => {
    if (!categoryMap[tx.category]) {
      categoryMap[tx.category] = { categoryId: tx.category, amount: 0, count: 0 };
    }
    categoryMap[tx.category].amount += tx.amount;
    categoryMap[tx.category].count += 1;
  });

  const categoryList = Object.values(categoryMap).sort((a, b) => b.amount - a.amount);

  return (
    <section className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Despesas por Categoria
            </h2>
            <p className="text-xs text-slate-400">
              Onde o casal mais investiu recursos em {formatMonthName(selectedMonth)}
            </p>
          </div>
        </div>

        <div className="text-right text-xs">
          <span className="text-slate-400">Total Desembolsado:</span>
          <span className="ml-2 font-bold font-mono text-rose-400 text-sm">
            {formatCurrency(totalExpense)}
          </span>
        </div>
      </div>

      {categoryList.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          Nenhuma despesa registrada para o mês de {formatMonthName(selectedMonth)}.
        </div>
      ) : (
        <div className="space-y-4">
          {categoryList.map((item, index) => {
            const catInfo = DEFAULT_CATEGORIES.find(c => c.id === item.categoryId) || {
              name: item.categoryId,
              color: '#94a3b8',
            };
            const percentage = totalExpense > 0 ? (item.amount / totalExpense) * 100 : 0;

            return (
              <div
                key={item.categoryId}
                onClick={() => onSelectCategory && onSelectCategory(item.categoryId)}
                className="group p-3 rounded-lg hover:bg-slate-800/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 w-4 text-right">{index + 1}.</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: catInfo.color }}
                    />
                    <span className="font-medium text-white group-hover:text-emerald-300 transition-colors">
                      {catInfo.name}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-400">{item.count} {item.count === 1 ? 'item' : 'itens'}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-200 tabular-nums">
                      {formatCurrency(item.amount)}
                    </span>
                    <span className="font-mono text-slate-400 w-12 text-right">
                      {percentage.toFixed(1)}%
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                </div>

                {/* Progress track */}
                <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: catInfo.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
