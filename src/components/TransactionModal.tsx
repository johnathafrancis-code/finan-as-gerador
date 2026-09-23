import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType, TransactionOwner, PaymentMethod, TransactionStatus } from '../types/finance';
import { DEFAULT_CATEGORIES, PAYMENT_METHOD_LABELS } from '../data/defaultData';
import { getTodayString } from '../utils/formatters';
import { X, Check, ArrowDownLeft, ArrowUpRight, Users } from 'lucide-react';

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

  // Suggestions
  const expenseSuggestions = ['Supermercado', 'Aluguel / Condomínio', 'Energia Elétrica', 'Internet', 'Restaurante / Lanche', 'Combustível', 'Farmácia'];
  const incomeSuggestions = ['Salário Mensal', 'Freelance / Extra', 'Rendimentos', 'Reembolso'];

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
      setErrorMessage('Por favor, informe um valor maior que zero.');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Por favor, digite o nome do lançamento.');
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
      setErrorMessage(err?.message || 'Erro ao salvar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCategories = DEFAULT_CATEGORIES.filter(c => c.type === type);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white border-t sm:border border-slate-200 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Grab Handle */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            {transactionToEdit ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Type Toggle: Despesa vs Receita */}
          <div>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  setCategory('supermercado');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  type === 'expense'
                    ? 'bg-white text-rose-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                <span>Despesa</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('income');
                  setCategory('salario');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  type === 'income'
                    ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                <span>Receita</span>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Valor
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm font-semibold">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                required
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-2.5 text-xl font-bold font-mono text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors tabular-nums shadow-xs"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Descrição
            </label>
            <input
              type="text"
              placeholder="Ex: Mercado da Semana, Conta de Luz..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors shadow-xs"
            />
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(type === 'expense' ? expenseSuggestions : incomeSuggestions).map(sug => (
                <button
                  type="button"
                  key={sug}
                  onClick={() => setDescription(sug)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] transition-colors cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Quem Pagou / Quem Recebeu */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {type === 'expense' ? 'Quem Pagou / Responsável' : 'Quem Recebeu'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setOwner('partner1')}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  owner === 'partner1'
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-800 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {partners.partner1Avatar ? (
                  <img
                    src={partners.partner1Avatar}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : null}
                <span className="truncate w-full">{partners.partner1Name}</span>
              </button>

              <button
                type="button"
                onClick={() => setOwner('partner2')}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  owner === 'partner2'
                    ? 'bg-pink-50 border-pink-400 text-pink-800 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {partners.partner2Avatar ? (
                  <img
                    src={partners.partner2Avatar}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : null}
                <span className="truncate w-full">{partners.partner2Name}</span>
              </button>

              <button
                type="button"
                onClick={() => setOwner('shared')}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  owner === 'shared'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Users className="w-3 h-3" />
                </div>
                <span>Compartilhado</span>
              </button>
            </div>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 text-xs shadow-xs"
              >
                {currentCategories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 font-mono text-xs shadow-xs"
              />
            </div>
          </div>

          {/* Payment Method & Status */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 text-xs shadow-xs"
              >
                {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Status
              </label>
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setStatus('paid')}
                  className={`py-1.5 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer ${
                    status === 'paid'
                      ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pago
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('pending')}
                  className={`py-1.5 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer ${
                    status === 'pending'
                      ? 'bg-white text-amber-700 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Pendente
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Observações (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Parcela 1 de 3, pago no cartão da Raisa..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-600 shadow-xs"
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isSubmitting ? 'Salvando...' : 'Salvar Lançamento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
