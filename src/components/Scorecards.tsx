import React from 'react';
import { DashboardMetrics } from '../types/challenge';
import { formatCurrencyBRL, formatPercent } from '../data/challengeData';
import { Target, Wallet, ArrowDownRight, CheckCircle2, Calendar } from 'lucide-react';

interface ScorecardsProps {
  metrics: DashboardMetrics;
  isFiltered: boolean;
  filteredDepositsCount: number;
}

export const Scorecards: React.FC<ScorecardsProps> = ({
  metrics,
  isFiltered,
  filteredDepositsCount,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {/* 1. Meta Total */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-colors relative overflow-hidden">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
            Meta Total
          </span>
          <Target className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-xl md:text-2xl font-bold text-slate-900 font-mono tracking-tight tabular-nums">
          {formatCurrencyBRL(metrics.metaTotal)}
        </div>
        <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Meta Fixa do Desafio</span>
          <span className="font-mono text-slate-700">365 Dias</span>
        </div>
        <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div className="bg-blue-600 h-full w-full rounded-full" />
        </div>
      </div>

      {/* 2. Valor Total Guardado */}
      <div className="bg-white border border-emerald-200/80 rounded-xl p-4 shadow-2xs hover:border-emerald-300 transition-colors relative overflow-hidden bg-radial-[at_top_right] from-emerald-50/50 via-white to-white">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-emerald-800 tracking-wide uppercase">
            Valor Total Guardado
          </span>
          <Wallet className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-xl md:text-2xl font-bold text-emerald-600 font-mono tracking-tight tabular-nums">
          {formatCurrencyBRL(metrics.valorTotalGuardado)}
        </div>
        <div className="mt-2 text-[11px] text-emerald-700 flex items-center justify-between">
          <span>Status = "Concluído"</span>
          <span className="font-mono font-semibold">
            {formatPercent(metrics.progressoPercentual)}
          </span>
        </div>
        <div className="mt-2 w-full bg-emerald-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, metrics.progressoPercentual)}%` }}
          />
        </div>
      </div>

      {/* 3. Saldo Restante */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-colors relative overflow-hidden">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
            Saldo Restante
          </span>
          <ArrowDownRight className="w-4 h-4 text-slate-600" />
        </div>
        <div className="text-xl md:text-2xl font-bold text-slate-800 font-mono tracking-tight tabular-nums">
          {formatCurrencyBRL(metrics.saldoRestante)}
        </div>
        <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Meta - Total Guardado</span>
          <span className="font-mono text-slate-700">
            {metrics.saldoRestante <= 0 ? 'Concluído!' : `${formatPercent(100 - metrics.progressoPercentual)} faltante`}
          </span>
        </div>
        <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-slate-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(0, 100 - metrics.progressoPercentual)}%` }}
          />
        </div>
      </div>

      {/* 4. Progresso (%) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-colors relative overflow-hidden">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
            Progresso Geral
          </span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-xl md:text-2xl font-bold text-slate-900 font-mono tracking-tight tabular-nums">
          {formatPercent(metrics.progressoPercentual)}
        </div>
        <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
          <span>{metrics.depositosRealizados} de {metrics.totalDepositos} depósitos</span>
          <span className="font-mono text-slate-700">Meta R$ 30k</span>
        </div>
        <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, metrics.progressoPercentual)}%` }}
          />
        </div>
      </div>

      {/* 5. Depósitos Realizados */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-colors relative overflow-hidden">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
            Depósitos Realizados
          </span>
          <Calendar className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-xl md:text-2xl font-bold text-slate-900 font-mono tracking-tight tabular-nums flex items-baseline gap-1">
          <span>{metrics.depositosRealizados}</span>
          <span className="text-xs text-slate-400 font-normal">/ {metrics.totalDepositos}</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
          <span>
            {isFiltered ? `Filtro ativo (${filteredDepositsCount} itens)` : `${metrics.totalDepositos - metrics.depositosRealizados} pendentes`}
          </span>
          <span className="font-mono font-medium text-emerald-700">
            {Math.round((metrics.depositosRealizados / metrics.totalDepositos) * 100)}% dos dias
          </span>
        </div>
        <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${(metrics.depositosRealizados / metrics.totalDepositos) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
