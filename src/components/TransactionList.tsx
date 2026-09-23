import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType, TransactionOwner } from '../types/finance';
import { DEFAULT_CATEGORIES, PAYMENT_METHOD_LABELS } from '../data/defaultData';
import { formatCurrency, formatDateBR, formatMonthName } from '../utils/formatters';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  Copy,
  Download,
  Users,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

interface TransactionListProps {
  onEditTransaction: (tx: Transaction) => void;
  onNewTransaction: () => void;
  selectedCategoryFilter?: string | null;
  onClearCategoryFilter?: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  onEditTransaction,
  onNewTransaction,
  selectedCategoryFilter,
  onClearCategoryFilter,
}) => {
  const {
    transactions,
    partners,
    selectedMonth,
    deleteTransaction,
    updateTransaction,
    addTransaction,
  } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income' | 'pending'>('all');
  const [ownerFilter, setOwnerFilter] = useState<'all' | 'partner1' | 'partner2' | 'shared'>('all');
  const [activeCategoryId, setActiveCategoryId] = useState<string>(selectedCategoryFilter || 'all');

  // Filter transactions
  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      // Month
      if (!tx.date.startsWith(selectedMonth)) return false;

      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesDesc = tx.description.toLowerCase().includes(query);
        const matchesNotes = tx.notes?.toLowerCase().includes(query) || false;
        if (!matchesDesc && !matchesNotes) return false;
      }

      // Type filter
      if (typeFilter === 'expense' && tx.type !== 'expense') return false;
      if (typeFilter === 'income' && tx.type !== 'income') return false;
      if (typeFilter === 'pending' && tx.status !== 'pending') return false;

      // Owner filter
      if (ownerFilter !== 'all' && tx.owner !== ownerFilter) return false;

      // Category filter
      if (activeCategoryId !== 'all' && tx.category !== activeCategoryId) return false;

      return true;
    });
  }, [transactions, selectedMonth, searchTerm, typeFilter, ownerFilter, activeCategoryId]);

  const handleToggleStatus = async (tx: Transaction) => {
    const updatedStatus = tx.status === 'paid' ? 'pending' : 'paid';
    await updateTransaction({ ...tx, status: updatedStatus });
  };

  const handleDuplicate = async (tx: Transaction) => {
    await addTransaction({
      description: `${tx.description} (Cópia)`,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      owner: tx.owner,
      date: tx.date,
      payment_method: tx.payment_method,
      status: tx.status,
      notes: tx.notes,
    });
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) return;

    const headers = ['Data', 'Descricao', 'Tipo', 'Valor', 'Categoria', 'Responsavel', 'Pagamento', 'Status', 'Observacoes'];
    const rows = filtered.map(tx => [
      tx.date,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.type === 'income' ? 'Receita' : 'Despesa',
      tx.amount.toFixed(2),
      tx.category,
      tx.owner === 'partner1' ? partners.partner1Name : (tx.owner === 'partner2' ? partners.partner2Name : 'Compartilhado'),
      PAYMENT_METHOD_LABELS[tx.payment_method] || tx.payment_method,
      tx.status === 'paid' ? 'Pago' : 'Pendente',
      `"${(tx.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financas_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 space-y-5">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por descrição ou observações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Action button CSV */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-lg text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Exportar lançamentos do mês em formato CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Segmented Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/80 text-xs">
        {/* Status / Type tabs */}
        <div className="flex items-center p-1 bg-slate-950/70 rounded-lg border border-slate-800 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-slate-800 text-white font-medium shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('expense')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              typeFilter === 'expense'
                ? 'bg-slate-800 text-rose-300 font-medium shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Despesas
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('income')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              typeFilter === 'income'
                ? 'bg-slate-800 text-emerald-300 font-medium shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Receitas
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('pending')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              typeFilter === 'pending'
                ? 'bg-slate-800 text-amber-300 font-medium shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pendentes
          </button>
        </div>

        {/* Owner filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 hidden sm:inline">Pessoa:</span>
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value as any)}
            className="bg-slate-950/80 border border-slate-700/80 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">Todos os responsáveis</option>
            <option value="partner1">{partners.partner1Name}</option>
            <option value="partner2">{partners.partner2Name}</option>
            <option value="shared">Compartilhado</option>
          </select>
        </div>
      </div>

      {/* Transactions Data Grid */}
      {filtered.length === 0 ? (
        <div className="py-14 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
            <Filter className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-300">
              Nenhum lançamento encontrado para estes filtros
            </p>
            <p className="text-xs text-slate-400">
              Altere os filtros ou registre um novo gasto ou recebimento para o casal.
            </p>
          </div>
          <button
            type="button"
            onClick={onNewTransaction}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Lançamento</span>
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-3 px-3 font-semibold">Data</th>
                <th className="py-3 px-3 font-semibold">Descrição</th>
                <th className="py-3 px-3 font-semibold">Categoria</th>
                <th className="py-3 px-3 font-semibold">Responsável</th>
                <th className="py-3 px-3 font-semibold">Pagamento</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-3 font-semibold text-right">Valor</th>
                <th className="py-3 px-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(tx => {
                const cat = DEFAULT_CATEGORIES.find(c => c.id === tx.category);
                const isIncome = tx.type === 'income';

                // Owner visual
                const isP1 = tx.owner === 'partner1';
                const isP2 = tx.owner === 'partner2';
                const ownerName = isP1 ? partners.partner1Name : (isP2 ? partners.partner2Name : 'Compartilhado');
                const ownerAvatar = isP1 ? partners.partner1Avatar : (isP2 ? partners.partner2Avatar : null);

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Date */}
                    <td className="py-3 px-3 text-slate-400 font-mono whitespace-nowrap">
                      {formatDateBR(tx.date)}
                    </td>

                    {/* Description */}
                    <td className="py-3 px-3 font-medium text-slate-100 min-w-[180px]">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                            isIncome
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {isIncome ? (
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <span className="block">{tx.description}</span>
                          {tx.notes && (
                            <span className="text-[11px] text-slate-400 block font-normal truncate max-w-xs">
                              {tx.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat?.color || '#94a3b8' }}
                        />
                        <span>{cat?.name || tx.category}</span>
                      </div>
                    </td>

                    {/* Owner */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        {ownerAvatar ? (
                          <img
                            src={ownerAvatar}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        ) : (
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span>{ownerName}</span>
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {PAYMENT_METHOD_LABELS[tx.payment_method] || tx.payment_method}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(tx)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                          tx.status === 'paid'
                            ? 'text-emerald-400 hover:bg-emerald-950/40'
                            : 'text-amber-400 hover:bg-amber-950/40'
                        }`}
                        title="Clique para alternar entre Pago e Pendente"
                      >
                        {tx.status === 'paid' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Pago</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>Pendente</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap tabular-nums">
                      <span className={isIncome ? 'text-emerald-400' : 'text-slate-100'}>
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => handleDuplicate(tx)}
                          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Duplicar este lançamento"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditTransaction(tx)}
                          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Editar lançamento"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTransaction(tx.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors cursor-pointer"
                          title="Excluir lançamento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
