import React, { useState } from 'react';
import { EXACT_SHEET_VALUES } from '../data/userChallengeGrid';
import { Check, Search, Sparkles, Printer, Palette, Smartphone, Monitor } from 'lucide-react';

export type MarkerColor = 'yellow' | 'red' | 'green';

interface ChallengeSheetGridProps {
  paidSet: Set<number>;
  onToggleSquare: (num: number) => void;
  onClearAll: () => void;
  formatBRL: (val: number) => string;
  markerColor?: MarkerColor;
  onChangeMarkerColor?: (color: MarkerColor) => void;
}

export const ChallengeSheetGrid: React.FC<ChallengeSheetGridProps> = ({
  paidSet,
  onToggleSquare,
  onClearAll,
  formatBRL,
  markerColor: controlledMarkerColor,
  onChangeMarkerColor,
}) => {
  const [internalMarkerColor, setInternalMarkerColor] = useState<MarkerColor>('yellow');
  const markerColor = controlledMarkerColor ?? internalMarkerColor;
  const setMarkerColor = (color: MarkerColor) => {
    setInternalMarkerColor(color);
    onChangeMarkerColor?.(color);
  };
  const [searchVal, setSearchVal] = useState('');
  const [filterQuarter, setFilterQuarter] = useState<'all' | '1' | '2' | '3' | '4'>('all');
  const [gridDensity, setGridDensity] = useState<'auto' | 'sheet'>('auto');

  const totalAccumulated = EXACT_SHEET_VALUES.reduce((acc, val, idx) => {
    return paidSet.has(idx + 1) ? acc + val : acc;
  }, 0);

  // Trimestre metrics
  const q1Saved = EXACT_SHEET_VALUES.slice(0, 90).reduce((acc, val, idx) => (paidSet.has(idx + 1) ? acc + val : acc), 0);
  const q2Saved = EXACT_SHEET_VALUES.slice(90, 180).reduce((acc, val, idx) => (paidSet.has(idx + 91) ? acc + val : acc), 0);
  const q3Saved = EXACT_SHEET_VALUES.slice(180, 270).reduce((acc, val, idx) => (paidSet.has(idx + 181) ? acc + val : acc), 0);
  const q4Saved = EXACT_SHEET_VALUES.slice(270, 365).reduce((acc, val, idx) => (paidSet.has(idx + 271) ? acc + val : acc), 0);

  // Color classes for paid cells
  const getPaidClasses = () => {
    switch (markerColor) {
      case 'red':
        return 'bg-rose-500 text-white border-rose-600 font-bold shadow-xs';
      case 'green':
        return 'bg-emerald-500 text-white border-emerald-600 font-bold shadow-xs';
      case 'yellow':
      default:
        return 'bg-amber-300 text-slate-900 border-amber-400 font-bold shadow-xs';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 md:p-6 shadow-2xs space-y-4 w-full">
      {/* Top Banner Matching the Original PDF */}
      <div className="border-b border-slate-200 pb-3 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-base sm:text-lg md:text-xl font-black tracking-tight text-slate-900 flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-emerald-700">DESAFIO DOS 365 DEPÓSITOS</span>
              <span className="text-slate-400 font-normal hidden sm:inline">—</span>
              <span className="text-slate-800">META R$ 30.000,00</span>
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Toque em qualquer quadrinho no celular ou clique no PC para marcar como pago.
            </p>
          </div>

          {/* Color Switcher & Adaptive View Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Color selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
              <Palette className="w-3.5 h-3.5 text-slate-500 ml-1 hidden xs:inline" />
              <span className="text-[10px] sm:text-[11px] text-slate-600 mr-0.5">Cor:</span>
              <button
                onClick={() => setMarkerColor('yellow')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  markerColor === 'yellow'
                    ? 'bg-amber-300 text-slate-900 shadow-xs ring-2 ring-amber-400'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Amarelo
              </button>
              <button
                onClick={() => setMarkerColor('red')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  markerColor === 'red'
                    ? 'bg-rose-500 text-white shadow-xs ring-2 ring-rose-400'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Vermelho
              </button>
              <button
                onClick={() => setMarkerColor('green')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  markerColor === 'green'
                    ? 'bg-emerald-500 text-white shadow-xs ring-2 ring-emerald-400'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Verde
              </button>
            </div>

            {/* Layout Density Selector: Auto Fit vs 25 Columns */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setGridDensity('auto')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                  gridDensity === 'auto'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Adapta automaticamente o número de colunas à tela do celular ou PC"
              >
                <Smartphone className="w-3 h-3 text-blue-600" />
                <span className="hidden sm:inline">Auto</span>
                <span className="sm:hidden">Adapta</span>
              </button>
              <button
                onClick={() => setGridDensity('sheet')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                  gridDensity === 'sheet'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Formato folha original 25 colunas lado a lado"
              >
                <Monitor className="w-3 h-3 text-slate-600" />
                <span>25 cols</span>
              </button>
            </div>

            <button
              onClick={() => window.print()}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Imprimir grade completa"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Imprimir</span>
            </button>
          </div>
        </div>

        {/* PDF Metric Cards Header Strip (Responsive Grid) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 pt-3 border-t border-slate-100 text-center">
          <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Meta Total</span>
            <span className="text-sm md:text-base font-extrabold text-slate-900 font-mono">R$ 30.000,00</span>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Depósitos</span>
            <span className="text-sm md:text-base font-extrabold text-slate-900 font-mono">365 dias</span>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Menor Valor</span>
            <span className="text-sm md:text-base font-extrabold text-emerald-600 font-mono">R$ 1,00</span>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">Maior Valor</span>
            <span className="text-sm md:text-base font-extrabold text-amber-600 font-mono">R$ 500,00</span>
          </div>
          <div className="col-span-2 sm:col-span-1 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Acumulado Atual</span>
            <span className="text-sm md:text-base font-black text-emerald-700 font-mono">
              {formatBRL(totalAccumulated)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar for the Grid */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs bg-slate-50 p-2 sm:p-2.5 rounded-lg border border-slate-200">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-slate-700 text-[11px] sm:text-xs">Trimestre:</span>
          <div className="flex flex-wrap items-center gap-1 bg-white p-0.5 rounded border border-slate-200">
            <button
              onClick={() => setFilterQuarter('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                filterQuarter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos (365)
            </button>
            <button
              onClick={() => setFilterQuarter('1')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                filterQuarter === '1' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1º Trim
            </button>
            <button
              onClick={() => setFilterQuarter('2')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                filterQuarter === '2' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2º Trim
            </button>
            <button
              onClick={() => setFilterQuarter('3')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                filterQuarter === '3' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3º Trim
            </button>
            <button
              onClick={() => setFilterQuarter('4')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                filterQuarter === '4' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4º Trim
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-1 flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Buscar Nº (ex: 260) ou R$..."
              className="w-full sm:w-36 text-xs focus:outline-none text-slate-800"
            />
          </div>

          <div className="text-[11px] text-slate-500 font-mono whitespace-nowrap shrink-0">
            {paidSet.size}/365 ({((paidSet.size / 365) * 100).toFixed(0)}%)
          </div>
        </div>
      </div>

      {/* THE 365 SQUARES GRID: 100% AUTOMATICALLY ADAPTIVE TO MOBILE PHONE, TABLET & PC */}
      <div className={gridDensity === 'sheet' ? 'overflow-x-auto pb-2' : 'w-full'}>
        <div
          className={`select-none w-full ${
            gridDensity === 'sheet'
              ? 'min-w-[900px] grid grid-cols-[repeat(25,minmax(0,1fr))] gap-1'
              : 'grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(52px,1fr))] lg:grid-cols-[repeat(25,minmax(0,1fr))] gap-1 sm:gap-1.5'
          }`}
        >
          {EXACT_SHEET_VALUES.map((val, idx) => {
            const num = idx + 1;
            const isPaid = paidSet.has(num);

            // Filter check
            if (filterQuarter === '1' && num > 90) return null;
            if (filterQuarter === '2' && (num <= 90 || num > 180)) return null;
            if (filterQuarter === '3' && (num <= 180 || num > 270)) return null;
            if (filterQuarter === '4' && num <= 270) return null;

            if (searchVal.trim()) {
              const q = searchVal.toLowerCase();
              const numStr = String(num).padStart(3, '0');
              const valStr = String(val);
              if (!numStr.includes(q) && !valStr.includes(q) && !`r$ ${valStr}`.includes(q)) {
                return null;
              }
            }

            const formattedNum = String(num).padStart(3, '0');
            const isMin = val === 1; // 081, 181, 237, 245
            const isMax = val === 500; // 260

            return (
              <button
                key={num}
                onClick={() => onToggleSquare(num)}
                title={`Quadrinho #${formattedNum} - R$ ${val},00 (${isPaid ? 'Pago' : 'Clique para marcar como pago'})`}
                className={`relative flex flex-col items-center justify-center p-1 sm:p-1 rounded-sm border text-center transition-all cursor-pointer active:scale-95 touch-manipulation min-h-[44px] sm:min-h-[38px] ${
                  isPaid
                    ? getPaidClasses()
                    : isMax
                    ? 'bg-amber-100/90 border-amber-300 text-amber-900 font-bold hover:bg-amber-200'
                    : isMin
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold hover:bg-emerald-100'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                {/* 3-Digit Number */}
                <span className={`text-[10px] sm:text-[9px] font-mono leading-none ${isPaid ? 'opacity-90' : 'text-slate-500'}`}>
                  {formattedNum}
                </span>

                {/* Value in BRL */}
                <span className="text-xs sm:text-[10px] font-mono font-bold leading-tight mt-0.5 whitespace-nowrap">
                  R$ {val}
                </span>

                {/* Subtle paid badge icon */}
                {isPaid && (
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-3 sm:h-3 rounded-full bg-slate-900 text-white flex items-center justify-center text-[8px] shadow-xs">
                    <Check className="w-2.5 h-2.5 sm:w-2 sm:h-2" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* FOOTER QUARTER STRIP MATCHING ORIGINAL PDF (Responsive Columns) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-3 border-t border-slate-200 text-xs">
        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="font-bold text-slate-700 text-[11px] sm:text-xs">1º TRIM (001–090)</div>
          <div className="text-emerald-700 font-mono font-semibold text-[11px]">Meta: R$ 6.876</div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 font-mono">Pago: {formatBRL(q1Saved)}</div>
        </div>

        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="font-bold text-slate-700 text-[11px] sm:text-xs">2º TRIM (091–180)</div>
          <div className="text-emerald-700 font-mono font-semibold text-[11px]">Meta: R$ 8.175</div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 font-mono">Pago: {formatBRL(q2Saved)}</div>
        </div>

        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="font-bold text-slate-700 text-[11px] sm:text-xs">3º TRIM (181–270)</div>
          <div className="text-emerald-700 font-mono font-semibold text-[11px]">Meta: R$ 7.208</div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 font-mono">Pago: {formatBRL(q3Saved)}</div>
        </div>

        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="font-bold text-slate-700 text-[11px] sm:text-xs">4º TRIM (271–365)</div>
          <div className="text-emerald-700 font-mono font-semibold text-[11px]">Meta: R$ 7.741</div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 font-mono">Pago: {formatBRL(q4Saved)}</div>
        </div>

        <div className="col-span-2 md:col-span-1 p-2 bg-slate-900 text-white rounded-lg">
          <div className="font-bold text-blue-300 text-[11px] sm:text-xs">SOMA 365 DIAS</div>
          <div className="text-emerald-400 font-mono font-bold text-xs sm:text-sm">R$ 30.000,00</div>
          <div className="text-[10px] sm:text-[11px] text-slate-300 font-mono">Total Pago: {formatBRL(totalAccumulated)}</div>
        </div>
      </div>

      {/* Explanatory Note matching page 2 of PDF */}
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800">Orientação Original: </span>
          Os valores dos 365 quadrinhos somam exatamente <strong>R$ 30.000,00</strong> (média de R$ 2.500,00/mês). Destacados os depósitos mínimos de <strong>R$ 1,00</strong> (081, 181, 237, 245) e o depósito máximo de <strong>R$ 500,00</strong> (260). Ao clicar no celular ou PC, o quadrinho é preenchido na cor selecionada (Amarelo, Vermelho ou Verde); se não pago, exibe o número e o valor correspondente.
        </div>
      </div>
    </div>
  );
};
