import React, { useState } from 'react';
import { DepositItem } from '../types/challenge';
import { formatCurrencyBRL } from '../data/challengeData';
import {
  CheckSquare,
  Square,
  Search,
  Filter,
  Download,
  Copy,
  Check,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface DepositsTableModalProps {
  items: DepositItem[];
  onToggleStatus: (numero: number) => void;
  onUpdateItem: (numero: number, updates: Partial<DepositItem>) => void;
  onExportCSV: () => void;
  onCopyTSV: () => void;
  onBatchCompleteMonth: (mes: string, markAs: 'Concluído' | 'Pendente') => void;
}

export const DepositsTableModal: React.FC<DepositsTableModalProps> = ({
  items,
  onToggleStatus,
  onUpdateItem,
  onExportCSV,
  onCopyTSV,
  onBatchCompleteMonth,
}) => {
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('Todos');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [editingItemNum, setEditingItemNum] = useState<number | null>(null);

  const filteredItems = items.filter((item) => {
    if (selectedMonth !== 'Todos' && item.mes !== selectedMonth) return false;
    if (selectedStatus !== 'Todos' && item.status !== selectedStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = item.numero.toString().includes(q);
      const matchVal = item.valor.toString().includes(q);
      const matchNote = (item.observacoes || '').toLowerCase().includes(q);
      const matchMonth = item.mes.toLowerCase().includes(q);
      if (!matchNum && !matchVal && !matchNote && !matchMonth) return false;
    }
    return true;
  });

  const handleCopy = () => {
    onCopyTSV();
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-4 p-4 md:p-6">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Planilha Gerenciadora dos 365 Depósitos
          </h2>
          <p className="text-xs text-slate-500">
            Clique em qualquer linha ou caixa de seleção para marcar como Concluído. Os dados sincronizam imediatamente com o Dashboard e cálculos do Looker Studio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            title="Copiar dados para colar direto no Google Planilhas (Ctrl+V)"
          >
            {copiedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copiado p/ Área de Transferência!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar p/ Google Sheets</span>
              </>
            )}
          </button>
          <button
            onClick={onExportCSV}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar CSV</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-medium text-slate-700">Filtrar Lista:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-medium bg-white border border-slate-200 rounded px-2 py-1"
          >
            <option value="Todos">Todos os 12 Meses</option>
            {[
              'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
              'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
            ].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs font-medium bg-white border border-slate-200 rounded px-2 py-1"
          >
            <option value="Todos">Todos os Status</option>
            <option value="Concluído">Apenas Concluídos</option>
            <option value="Pendente">Apenas Pendentes</option>
          </select>
        </div>

        {/* Search */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded px-2.5 py-1 text-xs">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por Nº, valor ou nota..."
            className="w-48 text-xs focus:outline-none text-slate-800"
          />
        </div>

        {/* Quick Month Batch Action */}
        {selectedMonth !== 'Todos' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Ações para {selectedMonth}:</span>
            <button
              onClick={() => onBatchCompleteMonth(selectedMonth, 'Concluído')}
              className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-medium transition-colors"
            >
              Marcar Mês como Pago
            </button>
            <button
              onClick={() => onBatchCompleteMonth(selectedMonth, 'Pendente')}
              className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-medium transition-colors"
            >
              Marcar Mês como Pendente
            </button>
          </div>
        )}
      </div>

      {/* Table of Rows */}
      <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-[550px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs z-10 border-b border-slate-200 text-slate-700">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center">Status</th>
              <th className="py-2.5 px-3 w-16 text-center">Nº</th>
              <th className="py-2.5 px-3">Mês de Referência</th>
              <th className="py-2.5 px-3 hidden md:table-cell">Trimestre</th>
              <th className="py-2.5 px-3 text-right">Valor do Depósito</th>
              <th className="py-2.5 px-3">Data do Depósito</th>
              <th className="py-2.5 px-3">Observações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal">
            {filteredItems.map((item) => {
              const isCompleted = item.status === 'Concluído';

              return (
                <tr
                  key={item.numero}
                  className={`hover:bg-slate-50 transition-colors ${
                    isCompleted ? 'bg-emerald-50/30' : ''
                  }`}
                >
                  {/* Status Checkbox */}
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => onToggleStatus(item.numero)}
                      className="cursor-pointer p-0.5 text-slate-400 hover:text-emerald-600 transition-colors"
                      title={isCompleted ? 'Marcar como Pendente' : 'Marcar como Concluído'}
                    >
                      {isCompleted ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 hover:text-slate-400" />
                      )}
                    </button>
                  </td>

                  {/* Number */}
                  <td className="py-2 px-3 text-center font-mono font-semibold text-slate-600">
                    #{item.numero}
                  </td>

                  {/* Month */}
                  <td className="py-2 px-3 font-medium text-slate-800">
                    {item.mes}
                  </td>

                  {/* Quarter */}
                  <td className="py-2 px-3 text-slate-500 hidden md:table-cell">
                    {item.trimestre}
                  </td>

                  {/* Value */}
                  <td className="py-2 px-3 text-right font-mono font-bold tabular-nums text-slate-900">
                    {formatCurrencyBRL(item.valor)}
                  </td>

                  {/* Date paid */}
                  <td className="py-2 px-3 text-slate-600">
                    <input
                      type="date"
                      value={item.dataDeposito}
                      onChange={(e) =>
                        onUpdateItem(item.numero, {
                          dataDeposito: e.target.value,
                          status: e.target.value ? 'Concluído' : item.status,
                        })
                      }
                      className="bg-transparent font-mono text-[11px] p-0.5 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded focus:outline-none"
                    />
                  </td>

                  {/* Observations */}
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.observacoes}
                      onChange={(e) =>
                        onUpdateItem(item.numero, { observacoes: e.target.value })
                      }
                      placeholder="Adicionar nota..."
                      className="w-full bg-transparent text-slate-700 placeholder-slate-300 p-0.5 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded focus:outline-none"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2">
        <span>Exibindo {filteredItems.length} de {items.length} depósitos</span>
        <span>Dica: Ao colar no Google Sheets, use o cabeçalho idêntico para conexão instantânea no Looker Studio.</span>
      </div>
    </div>
  );
};
