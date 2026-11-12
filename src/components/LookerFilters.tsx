import React from 'react';
import { FilterState } from '../types/challenge';
import { MONTHS } from '../data/challengeData';
import { Filter, X, Search } from 'lucide-react';

interface LookerFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  totalFiltered: number;
  totalItems: number;
}

export const LookerFilters: React.FC<LookerFiltersProps> = ({
  filters,
  onFilterChange,
  totalFiltered,
  totalItems,
}) => {
  const hasActiveFilters =
    filters.mes !== 'Todos' ||
    filters.status !== 'Todos' ||
    filters.trimestre !== 'Todos' ||
    filters.search.trim().length > 0;

  const handleReset = () => {
    onFilterChange({
      mes: 'Todos',
      status: 'Todos',
      trimestre: 'Todos',
      search: '',
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 md:p-4 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Controls label & Looker filter icon */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 shrink-0">
          <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <span>Controles de Filtro (Looker Studio)</span>
          <span className="text-slate-400 font-normal">|</span>
          <span className="text-slate-500 font-normal">
            Exibindo {totalFiltered} de {totalItems} registros
          </span>
        </div>

        {/* Filter Dropdowns & Inputs */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-end">
          {/* Mês Dropdown Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <label className="text-slate-500 text-[11px] font-medium">Mês:</label>
            <select
              value={filters.mes}
              onChange={(e) => onFilterChange({ ...filters, mes: e.target.value })}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="Todos">Todos os Meses</option>
              {MONTHS.map((m) => (
                <option key={m.numero} value={m.nome}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <label className="text-slate-500 text-[11px] font-medium">Status:</label>
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="Todos">Todos os Status</option>
              <option value="Concluído">Concluído</option>
              <option value="Pendente">Pendente</option>
            </select>
          </div>

          {/* Trimestre Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <label className="text-slate-500 text-[11px] font-medium">Trimestre:</label>
            <select
              value={filters.trimestre}
              onChange={(e) => onFilterChange({ ...filters, trimestre: e.target.value })}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="Todos">Todos os Trimestres</option>
              <option value="1º Trimestre">1º Trimestre (Jan-Mar)</option>
              <option value="2º Trimestre">2º Trimestre (Abr-Jun)</option>
              <option value="3º Trimestre">3º Trimestre (Jul-Set)</option>
              <option value="4º Trimestre">4º Trimestre (Out-Dez)</option>
            </select>
          </div>

          {/* Quick Search */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              placeholder="Buscar Nº ou nota..."
              className="bg-transparent w-28 md:w-36 text-slate-800 placeholder-slate-400 focus:outline-none text-xs"
            />
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Limpar todos os filtros aplicados"
            >
              <X className="w-3 h-3" />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
