import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType, TransactionOwner, PaymentMethod, TransactionStatus } from '../types/finance';
import { DEFAULT_CATEGORIES, PAYMENT_METHOD_LABELS } from '../data/defaultData';
import { getTodayString } from '../utils/formatters';
import { X, Check, ArrowDownLeft, ArrowUpRight, Calendar, Users, DollarSign, CreditCard } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  transactionToEdit,
}) => {
  const { partners, activeDeviceUser, addTransaction, updateTransaction } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState('supermercado');
  const [owner, setOwner] = useState<TransactionOwner>(activeDeviceUser);
  const [date, setDate] = useState(getTodayString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [status, setStatus] = useState<TransactionStatus>('paid');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick suggestions
  const expenseSuggestions = ['Supermercado', 'Aluguel do Mês', 'Energia Elétrica', 'Internet', 'Restaurante', 'Combustível', 'Farmácia', 'Lazer'];
  const incomeSuggestions = ['Salário Mensal', 'Renda Extra / Freelance', 'Dividendos / Investimentos', 'Reembolso'];

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setDescription(transactionToEdit.description);
      setAmountStr(String(transactionToEdit.amount));
      setCategory(transactionToEdit.category);
      setOwner(transactionToEdit.owner);
      setDate(transactionToEdit.date);
      setPaymentMethod(transactionToEdit.payment_method);
      setStatus(transactionToEdit.status);
      setNotes(transactionToEdit.notes || '');
    } else {
      // Reset for new
      setType('expense');
      setDescription('');
      setAmountStr('');
      setCategory('supermercado');
      setOwner(activeDeviceUser);
      setDate(getTodayString());
      setPaymentMethod('pix');
      setStatus('paid');
      setNotes('');
    }
    setErrorMessage(null);
  }, [transactionToEdit, isOpen, activeDeviceUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const numericAmount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage('Por favor, insira um valor válido maior que zero.');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Por favor, informe a descrição do lançamento.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (transactionToEdit) {
        await updateTransaction({
          ...transactionToEdit,
          description: description.trim(),
          amount: numericAmount,
          type,
          category,
          owner,
          date,
          payment_method: paymentMethod,
          status,
          notes: notes.trim() || undefined,
        });
      } else {
        await addTransaction({
          description: description.trim(),
          amount: numericAmount,
          type,
          category,
          owner,
          date,
          payment_method: paymentMethod,
          status,
          notes: notes.trim() || undefined,
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao salvar lançamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCategories = DEFAULT_CATEGORIES.filter(c => c.type === type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white tracking-tight">
            {transactionToEdit ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Type Toggle: Despesa vs Receita */}
          <div>
            <label className="block font-semibold text-slate-300 mb-2">Tipo de Movimentação</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  setCategory('supermercado');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  type === 'expense'
                    ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-rose-400" />
                <span>Despesa (Saída)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('income');
                  setCategory('salario');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  type === 'income'
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                <span>Receita (Entrada)</span>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Valor (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm font-semibold">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-12 pr-4 py-2.5 text-lg font-bold font-mono text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors tabular-nums"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Descrição
            </label>
            <input
              type="text"
              placeholder="Ex: Supermercado Semanal, Conta de Luz..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {/* Suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(type === 'expense' ? expenseSuggestions : incomeSuggestions).map(sug => (
                <button
                  type="button"
                  key={sug}
                  onClick={() => setDescription(sug)}
                  className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[11px] transition-colors cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Owner: Quem Pagou ou Recebeu */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              {type === 'expense' ? 'Quem Pagou / Responsável' : 'Quem Recebeu'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setOwner('partner1')}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  owner === 'partner1'
                    ? 'bg-slate-800 border-indigo-500 text-white font-semibold'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {partners.partner1Avatar ? (
                  <img
                    src={partners.partner1Avatar}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                    {partners.partner1Name[0]}
                  </div>
                )}
                <span className="truncate w-full">{partners.partner1Name}</span>
              </button>

              <button
                type="button"
                onClick={() => setOwner('partner2')}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  owner === 'partner2'
                    ? 'bg-slate-800 border-pink-500 text-white font-semibold'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {partners.partner2Avatar ? (
                  <img
                    src={partners.partner2Avatar}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-xs">
                    {partners.partner2Name[0]}
                  </div>
                )}
                <span className="truncate w-full">{partners.partner2Name}</span>
              </button>

              <button
                type="button"
                onClick={() => setOwner('shared')}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  owner === 'shared'
                    ? 'bg-slate-800 border-emerald-500 text-emerald-300 font-semibold'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <span>Compartilhado</span>
              </button>
            </div>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                {currentCategories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Data do Lançamento
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Payment Method & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('paid')}
                  className={`py-2 rounded-xl border text-center font-medium transition-colors cursor-pointer ${
                    status === 'paid'
                      ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Pago / Recebido
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('pending')}
                  className={`py-2 rounded-xl border text-center font-medium transition-colors cursor-pointer ${
                    status === 'pending'
                      ? 'bg-amber-950/60 border-amber-600 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Pendente
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Observações (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Dividido no cartão em 3x, reembolso no dia 15..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Lançamento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
