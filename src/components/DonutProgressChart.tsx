import React from 'react';
import { formatCurrencyBRL, formatPercent } from '../data/challengeData';
import { PieChart, CheckCircle2, Clock } from 'lucide-react';

interface DonutProgressChartProps {
  completedCount: number;
  pendingCount: number;
  completedValue: number;
  pendingValue: number;
  totalCount: number;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
}

export const DonutProgressChart: React.FC<DonutProgressChartProps> = ({
  completedCount,
  pendingCount,
  completedValue,
  pendingValue,
  totalCount,
  selectedStatus,
  onSelectStatus,
}) => {
  const percentCompleted = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const percentPending = 100 - percentCompleted;

  // SVG circular arc calculations
  const radius = 64;
  const circumference = 2 * Math.PI * radius; // ~402.12
  const completedStroke = (percentCompleted / 100) * circumference;
  const pendingStroke = circumference - completedStroke;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Progresso Geral dos Depósitos
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Total: {totalCount} Dias
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Contagem de registros: Concluído vs. Pendente
        </p>
      </div>

      {/* Donut SVG Graphic */}
      <div className="my-4 flex items-center justify-center relative">
        <svg className="w-44 h-44 -rotate-90" viewBox="0 0 160 160">
          {/* Background circle / Pending */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="#E2E8F0"
            strokeWidth="20"
          />
          {/* Pending arc */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="#94A3B8"
            strokeWidth="20"
            strokeDasharray={`${pendingStroke} ${circumference}`}
            strokeDashoffset={-completedStroke}
            className="transition-all duration-700 ease-out cursor-pointer hover:opacity-85"
            onClick={() => onSelectStatus(selectedStatus === 'Pendente' ? 'Todos' : 'Pendente')}
          />
          {/* Completed arc */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="#10B981"
            strokeWidth="20"
            strokeDasharray={`${completedStroke} ${circumference}`}
            strokeDashoffset="0"
            strokeLinecap="round"
            className="transition-all duration-700 ease-out cursor-pointer hover:opacity-85"
            onClick={() => onSelectStatus(selectedStatus === 'Concluído' ? 'Todos' : 'Concluído')}
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight tabular-nums">
            {formatPercent(percentCompleted)}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            {completedCount} de {totalCount}
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">
            Concluídos
          </span>
        </div>
      </div>

      {/* Segment Breakdown Buttons / Legend */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={() => onSelectStatus(selectedStatus === 'Concluído' ? 'Todos' : 'Concluído')}
          className={`p-2 rounded-lg text-left transition-colors border ${
            selectedStatus === 'Concluído'
              ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400'
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Concluído</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-600 ml-auto" />
          </div>
          <div className="mt-1 text-xs font-mono font-bold text-slate-900">
            {completedCount} <span className="text-[10px] text-slate-500 font-normal">dias ({formatPercent(percentCompleted)})</span>
          </div>
          <div className="text-[11px] font-mono text-emerald-700">
            {formatCurrencyBRL(completedValue)}
          </div>
        </button>

        <button
          onClick={() => onSelectStatus(selectedStatus === 'Pendente' ? 'Todos' : 'Pendente')}
          className={`p-2 rounded-lg text-left transition-colors border ${
            selectedStatus === 'Pendente'
              ? 'bg-slate-200 border-slate-400 ring-1 ring-slate-400'
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            <span>Pendente</span>
            <Clock className="w-3 h-3 text-slate-500 ml-auto" />
          </div>
          <div className="mt-1 text-xs font-mono font-bold text-slate-900">
            {pendingCount} <span className="text-[10px] text-slate-500 font-normal">dias ({formatPercent(percentPending)})</span>
          </div>
          <div className="text-[11px] font-mono text-slate-600">
            {formatCurrencyBRL(pendingValue)}
          </div>
        </button>
      </div>
    </div>
  );
};
