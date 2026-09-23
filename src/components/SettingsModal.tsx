import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { X, Check, User, HeartHandshake, RotateCcw } from 'lucide-react';
import { INITIAL_TRANSACTIONS } from '../data/defaultData';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { partners, updatePartners } = useFinance();

  const [p1Name, setP1Name] = useState(partners.partner1Name);
  const [p2Name, setP2Name] = useState(partners.partner2Name);
  const [splitPercent, setSplitPercent] = useState(Math.round(partners.splitRatio * 100));

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePartners({
      partner1Name: p1Name.trim() || 'Ele',
      partner2Name: p2Name.trim() || 'Ela',
      splitRatio: splitPercent / 100,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Configurações do Casal
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5 text-xs">
          {/* Partner 1 Name */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Nome do Parceiro 1
            </label>
            <div className="relative">
              <input
                type="text"
                value={p1Name}
                onChange={(e) => setP1Name(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Partner 2 Name */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Nome da Parceira 2
            </label>
            <div className="relative">
              <input
                type="text"
                value={p2Name}
                onChange={(e) => setP2Name(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Split Ratio Slider */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300">
                Divisão Padrão de Despesas Compartilhadas
              </label>
              <span className="font-mono font-bold text-emerald-400">
                {splitPercent}% {p1Name} / {100 - splitPercent}% {p2Name}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={splitPercent}
              onChange={(e) => setSplitPercent(Number(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />

            <div className="flex justify-between text-[11px] text-slate-400">
              <button
                type="button"
                onClick={() => setSplitPercent(50)}
                className="hover:text-emerald-400 cursor-pointer underline"
              >
                50% / 50% (Meio a Meio)
              </button>
              <button
                type="button"
                onClick={() => setSplitPercent(60)}
                className="hover:text-emerald-400 cursor-pointer underline"
              >
                60% / 40%
              </button>
              <button
                type="button"
                onClick={() => setSplitPercent(70)}
                className="hover:text-emerald-400 cursor-pointer underline"
              >
                70% / 30%
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
