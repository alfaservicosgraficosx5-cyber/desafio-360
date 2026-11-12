import React from 'react';
import { MonthlyStats } from '../types/challenge';
import { formatCurrencyBRL, formatPercent } from '../data/challengeData';
import { Table, CheckCircle2 } from 'lucide-react';

interface MonthlyBreakdownTableProps {
  data: MonthlyStats[];
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
}

export const MonthlyBreakdownTable: React.FC<MonthlyBreakdownTableProps> = ({
  data,
  selectedMonth,
  onSelectMonth,
}) => {
  // Aggregate grand totals for the footer
  const totalDias = data.reduce((a, b) => a + b.totalDias, 0);
  const totalConcluidos = data.reduce((a, b) => a + b.diasConcluidos, 0);
  const totalMeta = data.reduce((a, b) => a + b.metaEsperada, 0);
  const totalGuardado = data.reduce((a, b) => a + b.valorGuardado, 0);
  const totalSaldo = data.reduce((a, b) => a + b.saldoRestante, 0);
  const totalPct = totalMeta > 0 ? (totalGuardado / totalMeta) * 100 : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
      {/* Table Header / Title */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Tabela de Detalhamento Mensal
          </h3>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Métricas calculadas por Mês de Referência · 12 Meses
        </span>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-semibold">
              <th className="py-2.5 px-3">Mês</th>
              <th className="py-2.5 px-3 hidden sm:table-cell">Trimestre</th>
              <th className="py-2.5 px-3 text-center">Nº Depósitos</th>
              <th className="py-2.5 px-3 text-right">Meta Esperada</th>
              <th className="py-2.5 px-3 text-right">Valor Guardado</th>
              <th className="py-2.5 px-3 text-right">Saldo do Mês</th>
              <th className="py-2.5 px-3 w-40">% Atingimento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal">
            {data.map((item) => {
              const isSelected = selectedMonth === item.mes;
              const isDone = item.percentual >= 100;

              return (
                <tr
                  key={item.mes}
                  onClick={() => onSelectMonth(selectedMonth === item.mes ? 'Todos' : item.mes)}
                  className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-50/60 font-medium' : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-1.5">
                    {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    <span>{item.mes}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 hidden sm:table-cell">
                    {item.trimestre}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-700">
                    <span className="font-semibold text-emerald-700">{item.diasConcluidos}</span>
                    <span className="text-slate-400"> / {item.totalDias}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                    {formatCurrencyBRL(item.metaEsperada)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-emerald-700">
                    {formatCurrencyBRL(item.valorGuardado)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                    {formatCurrencyBRL(item.saldoRestante)}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex-1">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isDone ? 'bg-emerald-600' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, item.percentual)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-medium text-slate-800 w-11 text-right tabular-nums">
                        {formatPercent(item.percentual)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Summary Row */}
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-100/90 font-bold text-slate-900">
              <td className="py-3 px-3">Total Consolidado</td>
              <td className="py-3 px-3 hidden sm:table-cell text-slate-500">4 Trimestres</td>
              <td className="py-3 px-3 text-center font-mono tabular-nums">
                <span className="text-emerald-700">{totalConcluidos}</span> / {totalDias}
              </td>
              <td className="py-3 px-3 text-right font-mono tabular-nums">
                {formatCurrencyBRL(totalMeta)}
              </td>
              <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-700">
                {formatCurrencyBRL(totalGuardado)}
              </td>
              <td className="py-3 px-3 text-right font-mono tabular-nums">
                {formatCurrencyBRL(totalSaldo)}
              </td>
              <td className="py-3 px-3">
                <div className="flex items-center gap-2">
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex-1">
                    <div
                      className="bg-emerald-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, totalPct)}%` }}
                    />
                  </div>
                  <span className="font-mono text-[11px] text-slate-900 w-11 text-right tabular-nums">
                    {formatPercent(totalPct)}
                  </span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
