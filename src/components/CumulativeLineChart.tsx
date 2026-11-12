import React, { useState, useMemo } from 'react';
import { TrendingUp, Target, Calendar, Info } from 'lucide-react';

interface CumulativePoint {
  day: number;
  label: string;
  accumulated: number;
  idealCumulative: number;
  targetCeiling: number;
}

interface CumulativeLineChartProps {
  items: Array<{
    numero: number;
    mes: string;
    valor: number;
    status: 'Concluído' | 'Pendente';
  }>;
  formatBRL: (val: number) => string;
}

export const CumulativeLineChart: React.FC<CumulativeLineChartProps> = ({ items, formatBRL }) => {
  const [hoveredPoint, setHoveredPoint] = useState<CumulativePoint | null>(null);
  const [granularity, setGranularity] = useState<'daily' | 'monthly'>('daily');

  // Compute points
  const points: CumulativePoint[] = useMemo(() => {
    let runningPaid = 0;
    const totalDays = items.length; // 365
    const goal = 30000;

    if (granularity === 'monthly') {
      // Monthly accumulation
      const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];

      let monthlyAcc = 0;
      let monthIndex = 1;

      return months.map((m) => {
        const monthItems = items.filter((it) => it.mes === m);
        const monthPaid = monthItems
          .filter((it) => it.status === 'Concluído')
          .reduce((acc, c) => acc + c.valor, 0);

        monthlyAcc += monthPaid;
        const ideal = (goal / 12) * monthIndex;
        monthIndex++;

        return {
          day: monthIndex - 1,
          label: m,
          accumulated: monthlyAcc,
          idealCumulative: Math.round(ideal),
          targetCeiling: goal,
        };
      });
    }

    // Daily sampled points for crisp rendering (sample every 5 days or all 365)
    // To ensure fluid SVG path on mobile and desktop, we sample 73 points (every 5 days) + final day 365
    const dailyPoints: CumulativePoint[] = [];

    items.forEach((it, idx) => {
      if (it.status === 'Concluído') {
        runningPaid += it.valor;
      }
      const dayNum = idx + 1;
      const ideal = (goal / totalDays) * dayNum;

      if (dayNum === 1 || dayNum % 5 === 0 || dayNum === 365) {
        dailyPoints.push({
          day: dayNum,
          label: `Dia ${dayNum} (${it.mes})`,
          accumulated: runningPaid,
          idealCumulative: Math.round(ideal),
          targetCeiling: goal,
        });
      }
    });

    return dailyPoints;
  }, [items, granularity]);

  const totalCurrentAccumulated = points.length > 0 ? points[points.length - 1].accumulated : 0;
  const currentPaceDiff = points.length > 0
    ? totalCurrentAccumulated - points[points.length - 1].idealCumulative
    : 0;

  // Chart coordinate math
  const width = 800;
  const height = 260;
  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 40;

  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = height - paddingTop - paddingBottom;
  const maxVal = 32000; // Upper Y bound to leave breathing room for R$ 30.000 line

  const getX = (index: number) => {
    return paddingLeft + (index / (points.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(maxVal, val));
    return paddingTop + innerHeight - (clamped / maxVal) * innerHeight;
  };

  // Generate SVG path for accumulated line
  const accumulatedPath = useMemo(() => {
    if (points.length === 0) return '';
    return points
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(p.accumulated).toFixed(1)}`)
      .join(' ');
  }, [points]);

  // Generate SVG area fill path
  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const firstX = getX(0);
    const lastX = getX(points.length - 1);
    const bottomY = getY(0);
    return `${accumulatedPath} L ${lastX.toFixed(1)} ${bottomY.toFixed(1)} L ${firstX.toFixed(1)} ${bottomY.toFixed(1)} Z`;
  }, [accumulatedPath, points]);

  // Generate SVG path for ideal linear trajectory
  const idealPath = useMemo(() => {
    if (points.length === 0) return '';
    return points
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(p.idealCumulative).toFixed(1)}`)
      .join(' ');
  }, [points]);

  const yTicks = [0, 7500, 15000, 22500, 30000];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Curva de Acúmulo Financeiro (Saldo ao Longo do Tempo)</span>
          </h3>
          <p className="text-xs text-slate-500">
            Acompanhe o crescimento acumulado das economias em direção à meta de R$ 30.000,00
          </p>
        </div>

        {/* Legend & Granularity controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Granularity switch */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-[11px] font-semibold">
            <button
              onClick={() => setGranularity('daily')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                granularity === 'daily'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Diário (365 Dias)
            </button>
            <button
              onClick={() => setGranularity('monthly')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                granularity === 'monthly'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mensal (12 Meses)
            </button>
          </div>

          {/* Legend items */}
          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 rounded-full"></span>
              <span className="font-semibold text-slate-800">Acumulado Real</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400"></span>
              <span className="text-slate-500">Trajetória Linear</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-500"></span>
              <span className="text-slate-500">Meta R$ 30k</span>
            </div>
          </div>
        </div>
      </div>

      {/* SVG Interactive Chart Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            {/* Gradient for area fill */}
            <linearGradient id="emeraldAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.28" />
              <stop offset="85%" stopColor="#10B981" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines and Y axis values */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            const isTarget = tick === 30000;

            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke={isTarget ? '#3B82F6' : '#E2E8F0'}
                  strokeWidth={isTarget ? 1.5 : 1}
                  strokeDasharray={isTarget ? '4 3' : 'none'}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className={`text-[10px] font-mono ${isTarget ? 'fill-blue-600 font-bold' : 'fill-slate-400'}`}
                >
                  {formatBRL(tick)}
                </text>
              </g>
            );
          })}

          {/* Area Fill under accumulated line */}
          <path d={areaPath} fill="url(#emeraldAreaGradient)" />

          {/* Ideal linear trajectory line (dashed slate) */}
          <path
            d={idealPath}
            fill="none"
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />

          {/* Real Accumulated line (emerald) */}
          <path
            d={accumulatedPath}
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Target ceiling marker at R$ 30,000 */}
          <text
            x={width - paddingRight}
            y={getY(30000) - 6}
            textAnchor="end"
            className="text-[10px] font-mono font-bold fill-blue-600"
          >
            Meta: R$ 30.000,00
          </text>

          {/* X Axis milestones & labels */}
          {points.map((p, idx) => {
            // Show label every few points
            const shouldShowLabel =
              granularity === 'monthly'
                ? true
                : idx === 0 || idx === Math.floor(points.length / 2) || idx === points.length - 1 || idx % 15 === 0;

            if (!shouldShowLabel) return null;
            const x = getX(idx);

            return (
              <g key={p.day}>
                <line
                  x1={x}
                  y1={height - paddingBottom}
                  x2={x}
                  y2={height - paddingBottom + 5}
                  stroke="#CBD5E1"
                />
                <text
                  x={x}
                  y={height - paddingBottom + 16}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-500 font-mono"
                >
                  {granularity === 'monthly' ? p.label.slice(0, 3) : `D${p.day}`}
                </text>
              </g>
            );
          })}

          {/* Interactive invisible hover rectangles over each point */}
          {points.map((p, idx) => {
            const x = getX(idx);
            const y = getY(p.accumulated);
            const isHovered = hoveredPoint?.day === p.day;

            return (
              <g key={`hit-${p.day}`}>
                <rect
                  x={x - 8}
                  y={paddingTop}
                  width="16"
                  height={innerHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(p)}
                  onTouchStart={() => setHoveredPoint(p)}
                />
                {isHovered && (
                  <>
                    <line
                      x1={x}
                      y1={paddingTop}
                      x2={x}
                      y2={height - paddingBottom}
                      stroke="#10B981"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="5"
                      fill="#10B981"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      className="shadow-sm animate-pulse"
                    />
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip when hovering over a point */}
        {hoveredPoint && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-lg px-3.5 py-2 shadow-xl border border-slate-700 text-xs pointer-events-none flex items-center gap-4 z-20">
            <div>
              <span className="text-[10px] text-slate-400 block">{hoveredPoint.label}</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {formatBRL(hoveredPoint.accumulated)}
              </span>
            </div>

            <div className="h-6 w-px bg-slate-700"></div>

            <div>
              <span className="text-[10px] text-slate-400 block">Trajetória Linear Ideal</span>
              <span className="font-mono text-slate-300">
                {formatBRL(hoveredPoint.idealCumulative)}
              </span>
            </div>

            <div className="h-6 w-px bg-slate-700"></div>

            <div>
              <span className="text-[10px] text-slate-400 block">Ritmo Atual</span>
              {hoveredPoint.accumulated >= hoveredPoint.idealCumulative ? (
                <span className="text-emerald-400 font-semibold font-mono">
                  +{formatBRL(hoveredPoint.accumulated - hoveredPoint.idealCumulative)}
                </span>
              ) : (
                <span className="text-amber-400 font-semibold font-mono">
                  -{formatBRL(hoveredPoint.idealCumulative - hoveredPoint.accumulated)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Summary Footer bar for the chart */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>
            {currentPaceDiff >= 0 ? (
              <span className="text-emerald-700 font-medium">
                Ritmo atual adiantado em <strong>{formatBRL(currentPaceDiff)}</strong> em relação à média linear.
              </span>
            ) : (
              <span className="text-amber-700 font-medium">
                Ritmo atual está a <strong>{formatBRL(Math.abs(currentPaceDiff))}</strong> da média linear programada.
              </span>
            )}
          </span>
        </div>

        <span className="font-mono text-[11px] text-slate-500">
          Progresso: {formatBRL(totalCurrentAccumulated)} de {formatBRL(30000)} ({( (totalCurrentAccumulated / 30000) * 100).toFixed(1)}%)
        </span>
      </div>
    </div>
  );
};
