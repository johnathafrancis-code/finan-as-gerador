import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatMonthName, getTodayString } from '../utils/formatters';
import { ArrowRight, Scale, CheckCircle2, DollarSign, HeartHandshake, ShieldCheck } from 'lucide-react';

export const BalanceSettlementCard: React.FC = () => {
  const { transactions, partners, selectedMonth, addTransaction } = useFinance();
  const [settledSuccess, setSettledSuccess] = useState(false);

  // Month transactions
  const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));

  // Shared expenses
  const sharedExpenses = monthTransactions.filter(t => t.type === 'expense' && t.owner === 'shared');
  const totalShared = sharedExpenses.reduce((sum, t) => sum + t.amount, 0);

  // We can look at notes or description to see who paid, or attribute shared expenses.
  // By default, if notes mention partner1, or we can see individual contributions to shared expenses:
  const p1PaidShared = sharedExpenses
    .filter(t => {
      const note = (t.notes || '').toLowerCase();
      const desc = (t.description || '').toLowerCase();
      const p1 = partners.partner1Name.toLowerCase();
      return note.includes(p1) || desc.includes(p1) || (!note.includes(partners.partner2Name.toLowerCase()) && !desc.includes(partners.partner2Name.toLowerCase()));
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const p2PaidShared = totalShared - p1PaidShared;

  // Split target
  const ratioP1 = partners.splitRatio; // default 0.5 (50%)
  const ratioP2 = 1 - ratioP1;

  const targetP1 = totalShared * ratioP1;
  const targetP2 = totalShared * ratioP2;

  // Difference: who owes whom
  // If p1PaidShared > targetP1, partner 2 owes partner 1: (p1PaidShared - targetP1)
  const balance = p1PaidShared - targetP1; // positive: partner 2 owes partner 1; negative: partner 1 owes partner 2

  const whoOwes = balance > 0.01 ? partners.partner2Name : (balance < -0.01 ? partners.partner1Name : null);
  const whoReceives = balance > 0.01 ? partners.partner1Name : (balance < -0.01 ? partners.partner2Name : null);
  const settlementAmount = Math.abs(balance);

  // Income comparison
  const p1Income = monthTransactions
    .filter(t => t.type === 'income' && t.owner === 'partner1')
    .reduce((sum, t) => sum + t.amount, 0);

  const p2Income = monthTransactions
    .filter(t => t.type === 'income' && t.owner === 'partner2')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleRegisterSettlement = async () => {
    if (!whoOwes || settlementAmount <= 0) return;

    await addTransaction({
      description: `Acerto de Contas: ${whoOwes} -> ${whoReceives}`,
      amount: Number(settlementAmount.toFixed(2)),
      type: 'expense',
      category: 'outros_gastos',
      owner: balance > 0 ? 'partner2' : 'partner1',
      date: getTodayString(),
      payment_method: 'pix',
      status: 'paid',
      notes: `Transferência Pix de acerto de despesas compartilhadas de ${formatMonthName(selectedMonth)}.`,
    });

    setSettledSuccess(true);
    setTimeout(() => setSettledSuccess(false), 5000);
  };

  return (
    <section className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Acerto de Contas do Casal
            </h2>
            <p className="text-xs text-slate-400">
              Cálculo transparente de despesas compartilhadas para {formatMonthName(selectedMonth)}
            </p>
          </div>
        </div>

        {/* Proporção atual */}
        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
          <HeartHandshake className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300">Regra de Divisão:</span>
          <span className="font-semibold text-white">
            {Math.round(ratioP1 * 100)}% {partners.partner1Name} / {Math.round(ratioP2 * 100)}% {partners.partner2Name}
          </span>
        </div>
      </div>

      {/* Main Settlement Status Callout */}
      <div className="p-5 rounded-xl border border-slate-700/80 bg-slate-950/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Resultado da Divisão de Gastos Comuns
          </span>

          {whoOwes && settlementAmount > 0.05 ? (
            <div className="flex items-baseline gap-2">
              <span className="text-white text-xl font-medium">
                <span className="text-rose-400 font-bold">{whoOwes}</span> deve pagar a{' '}
                <span className="text-emerald-400 font-bold">{whoReceives}</span>:
              </span>
              <span className="text-2xl lg:text-3xl font-bold font-mono text-emerald-400 tabular-nums">
                {formatCurrency(settlementAmount)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-lg font-semibold">
                Contas do casal 100% equilibradas este mês!
              </span>
            </div>
          )}

          <p className="text-xs text-slate-400 max-w-xl">
            Total de despesas comuns somou <strong className="text-slate-200">{formatCurrency(totalShared)}</strong>.
            {' '}{partners.partner1Name} adiantou {formatCurrency(p1PaidShared)}, enquanto {partners.partner2Name} adiantou {formatCurrency(p2PaidShared)}.
          </p>
        </div>

        {/* Action Button */}
        {whoOwes && settlementAmount > 0.05 && (
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleRegisterSettlement}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Registrar Acerto via Pix</span>
            </button>
          </div>
        )}
      </div>

      {settledSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Lançamento de acerto registrado com sucesso! O valor foi equilibrado.</span>
        </div>
      )}

      {/* Detail grid: Husband vs Wife */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Partner 1 Card */}
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              {partners.partner1Avatar && (
                <img
                  src={partners.partner1Avatar}
                  alt={partners.partner1Name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-slate-700"
                />
              )}
              <span className="font-semibold text-white text-sm">{partners.partner1Name}</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Quota: {Math.round(ratioP1 * 100)}%
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Renda informada no mês:</span>
              <span className="text-emerald-400 font-mono font-medium">{formatCurrency(p1Income)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Gastos comuns adiantados:</span>
              <span className="text-slate-200 font-mono font-medium">{formatCurrency(p1PaidShared)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Sua parte devida ({Math.round(ratioP1 * 100)}%):</span>
              <span className="text-slate-200 font-mono font-medium">{formatCurrency(targetP1)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between font-semibold">
              <span className="text-slate-300">Balanço líquido:</span>
              <span className={`font-mono ${p1PaidShared >= targetP1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {p1PaidShared >= targetP1 ? `+${formatCurrency(p1PaidShared - targetP1)} a receber` : `-${formatCurrency(targetP1 - p1PaidShared)} a pagar`}
              </span>
            </div>
          </div>
        </div>

        {/* Partner 2 Card */}
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              {partners.partner2Avatar && (
                <img
                  src={partners.partner2Avatar}
                  alt={partners.partner2Name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-slate-700"
                />
              )}
              <span className="font-semibold text-white text-sm">{partners.partner2Name}</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Quota: {Math.round(ratioP2 * 100)}%
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Renda informada no mês:</span>
              <span className="text-emerald-400 font-mono font-medium">{formatCurrency(p2Income)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Gastos comuns adiantados:</span>
              <span className="text-slate-200 font-mono font-medium">{formatCurrency(p2PaidShared)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Sua parte devida ({Math.round(ratioP2 * 100)}%):</span>
              <span className="text-slate-200 font-mono font-medium">{formatCurrency(targetP2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between font-semibold">
              <span className="text-slate-300">Balanço líquido:</span>
              <span className={`font-mono ${p2PaidShared >= targetP2 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {p2PaidShared >= targetP2 ? `+${formatCurrency(p2PaidShared - targetP2)} a receber` : `-${formatCurrency(targetP2 - p2PaidShared)} a pagar`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
