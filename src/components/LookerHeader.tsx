import React from 'react';
import { Download, FileSpreadsheet, Layers, BookOpen, RefreshCw, Smartphone, Monitor } from 'lucide-react';

interface LookerHeaderProps {
  currentTab: 'dashboard' | 'table' | 'guide';
  onTabChange: (tab: 'dashboard' | 'table' | 'guide') => void;
  onOpenImport: () => void;
  onExportCSV: () => void;
  onReset: () => void;
  isMobileView: boolean;
  onToggleMobileView: () => void;
  lastUpdatedText: string;
}

export const LookerHeader: React.FC<LookerHeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenImport,
  onExportCSV,
  onReset,
  isMobileView,
  onToggleMobileView,
  lastUpdatedText,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      {/* Looker Studio Top System Bar */}
      <div className="bg-slate-900 text-white px-4 md:px-8 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-sm bg-blue-500"></div>
          <span className="font-semibold tracking-tight">Google Looker Studio</span>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <span className="text-slate-300 hidden sm:inline">Desafio 365 Depósitos (Meta R$ 30.000,00)</span>
        </div>
        <div className="flex items-center gap-4 text-slate-300">
          <span className="text-[11px] hidden md:inline">
            Fonte: Google Planilhas · {lastUpdatedText}
          </span>
          <button
            onClick={onToggleMobileView}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors"
            title="Alternar entre modo Paisagem PC e modo Smartphone"
          >
            {isMobileView ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Visão Monitor (16:9)</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Simular Mobile</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="px-4 md:px-8 py-3 flex items-center justify-between gap-4 md:gap-8 overflow-x-auto">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-base md:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            Desafio 365 Depósitos
          </span>
          <span className="text-xs text-slate-500 hidden lg:inline">
            · Painel de Acompanhamento Financeiro
          </span>
        </div>

        {/* Zone 2: Navigation Links / View Switcher */}
        <nav className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentTab === 'dashboard'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dashboard Executivo</span>
          </button>
          <button
            onClick={() => onTabChange('table')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentTab === 'table'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Gerenciar 365 Dias</span>
          </button>
          <button
            onClick={() => onTabChange('guide')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentTab === 'guide'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Guia Looker Studio & Fórmulas</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenImport}
            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            title="Importar ou colar dados da sua planilha Google Sheets"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Importar Minha Planilha</span>
          </button>

          <button
            onClick={onExportCSV}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-2xs"
            title="Baixar modelo ou dados em CSV para abrir no Google Planilhas"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Baixar .CSV</span>
          </button>

          <button
            onClick={onReset}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Restaurar dados padrão do desafio"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
