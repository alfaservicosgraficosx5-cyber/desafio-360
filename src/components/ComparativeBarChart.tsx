import React, { useState } from 'react';
import { MonthlyStats } from '../types/challenge';
import { formatCurrencyBRL, formatPercent } from '../data/challengeData';
import { BarChart3, CheckCircle2 } from 'lucide-react';

interface ComparativeBarChartProps {
  data: MonthlyStats[];
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
}

export const ComparativeBarChart: React.FC<ComparativeBarChartProps> = ({
  data,
  selectedMonth,
  onSelectMonth,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Determine max value for Y-axis scale
  const maxGoal = Math.max(...data.map((d) => Math.max(d.metaEsperada, d.valorGuardado, 1)));
  // Round up to nice upper limit
  const yMax = Math.ceil(maxGoal / 500) * 500;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Comparativo Mensal: Meta do Mês vs. Valor Guardado
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Eixo X: Janeiro a Dezembro (Ordem Cronológica) · Clique em uma barra para filtrar
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-slate-400"></span>
            <span className="text-slate-600 font-medium">Meta do Mês (Esperado)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-500"></span>
            <span className="text-slate-700 font-medium">Valor Guardado (Realizado)</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative pt-2 pb-1">
        {/* Y-Axis Grid Lines & Labels */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40 pb-8 pl-12 pr-2">
          {[1, 0.75, 0.5, 0.25, 0].map((step, idx) => (
            <div key={idx} className="flex items-center w-full">
              <span className="text-[10px] font-mono text-slate-500 w-12 text-right pr-2">
                {formatCurrencyBRL(yMax * step)}
              </span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>
          ))}
        </div>

        {/* Bars Container */}
        <div className="pl-14 pr-2 pt-4 pb-2">
          <div className="grid grid-cols-12 gap-1.5 sm:gap-2.5 h-64 items-end border-b border-slate-300">
            {data.map((item, idx) => {
              const metaHeight = (item.metaEsperada / yMax) * 100;
              const guardadoHeight = (item.valorGuardado / yMax) * 100;
              const isSelected = selectedMonth === item.mes;
              const isCompleted = item.percentual >= 100;

              return (
                <div
                  key={item.mes}
                  onClick={() => onSelectMonth(selectedMonth === item.mes ? 'Todos' : item.mes)}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`flex flex-col items-center justify-end h-full cursor-pointer relative group rounded-t-sm transition-all ${
                    isSelected ? 'bg-blue-50/60 ring-2 ring-blue-500/40 rounded-t-md' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Goal achieved indicator */}
                  {isCompleted && (
                    <div className="absolute -top-3 z-10 text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-100" />
                    </div>
                  )}

                  {/* Dual Column Bars */}
                  <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 px-0.5 h-full">
                    {/* Meta Bar */}
                    <div
                      className="w-1/2 bg-slate-400 group-hover:bg-slate-500 rounded-t-xs transition-all duration-300"
                      style={{ height: `${Math.max(2, metaHeight)}%` }}
                    />
                    {/* Guardado Bar */}
                    <div
                      className={`w-1/2 rounded-t-xs transition-all duration-300 ${
                        isCompleted
                          ? 'bg-emerald-600 group-hover:bg-emerald-700'
                          : 'bg-emerald-500 group-hover:bg-emerald-600'
                      }`}
                      style={{ height: `${Math.max(2, guardadoHeight)}%` }}
                    />
                  </div>

                  {/* Tooltip on Hover */}
                  {hoveredIndex === idx && (
                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white rounded-lg p-2.5 shadow-xl text-xs w-48 pointer-events-none border border-slate-700">
                      <div className="font-semibold text-slate-100 pb-1 mb-1 border-b border-slate-700 flex justify-between">
                        <span>{item.mes}</span>
                        <span className="text-[10px] text-slate-400">{item.trimestre}</span>
                      </div>
                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Meta do Mês:</span>
                          <span className="font-mono text-slate-200">
                            {formatCurrencyBRL(item.metaEsperada)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-emerald-400 font-medium">Valor Guardado:</span>
                          <span className="font-mono text-emerald-300 font-medium">
                            {formatCurrencyBRL(item.valorGuardado)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Saldo Restante:</span>
                          <span className="font-mono text-slate-300">
                            {formatCurrencyBRL(item.saldoRestante)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-800">
                          <span className="text-slate-400">Atingimento:</span>
                          <span className="font-mono font-bold text-white">
                            {formatPercent(item.percentual)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Depósitos pagos:</span>
                          <span>{item.diasConcluidos} de {item.totalDias} dias</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* X-Axis Month Labels */}
          <div className="grid grid-cols-12 gap-1.5 sm:gap-2.5 pt-2">
            {data.map((item) => (
              <div
                key={item.mes}
                onClick={() => onSelectMonth(selectedMonth === item.mes ? 'Todos' : item.mes)}
                className={`text-center cursor-pointer transition-colors ${
                  selectedMonth === item.mes
                    ? 'font-bold text-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="text-[10px] sm:text-xs block truncate">
                  {item.mes.slice(0, 3)}
                </span>
                <span className="text-[9px] font-mono text-slate-400 hidden sm:block">
                  {formatPercent(item.percentual)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
