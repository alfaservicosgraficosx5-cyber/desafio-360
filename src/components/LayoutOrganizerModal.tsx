import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  CheckCircle2,
  FileSpreadsheet,
  GripVertical,
  History,
  LayoutGrid,
  Move,
  Pencil,
  RotateCcw,
  Sparkles,
  Table,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  AppTabId,
  ChallengeInstanceDoc,
  DashboardBlockId,
  DEFAULT_DASHBOARD_ORDER,
  DEFAULT_TAB_ORDER,
  DEFAULT_TABLE_COLUMN_ORDER,
  DepositTableColumnId,
  LayoutPrefs,
} from '../services/challengeService';

interface LayoutOrganizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenges: ChallengeInstanceDoc[];
  activeChallengeId: string | null;
  layoutPrefs: LayoutPrefs;
  isInlineMoveMode: boolean;
  onToggleInlineMoveMode: () => void;
  onUpdateLayoutPrefs: (next: LayoutPrefs) => Promise<void>;
  onSelectChallenge: (challengeId: string) => void;
}

export const TAB_META: Record<AppTabId, { label: string; shortLabel: string; desc: string }> = {
  grid: {
    label: 'Minha Grade de 365 Quadrinhos (1 Clique)',
    shortLabel: 'Grade 365',
    desc: 'Quadrinhos interativos do desafio',
  },
  dashboard: {
    label: 'Dashboard Executivo (Looker Studio)',
    shortLabel: 'Dashboard',
    desc: 'Scorecards, gráficos e tabela mensal',
  },
  table: {
    label: 'Planilha Detalhada (365 Linhas)',
    shortLabel: 'Planilha',
    desc: 'Tabela completa com todos os 365 depósitos',
  },
  history: {
    label: 'Histórico de Movimentações',
    shortLabel: 'Histórico',
    desc: 'Registro de confirmações e estornos',
  },
  names: {
    label: 'Renomear & Participantes',
    shortLabel: 'Renomear',
    desc: 'Editar seu nome e dos demais participantes',
  },
  accounts: {
    label: 'Contas (Criar / Trocar)',
    shortLabel: 'Contas',
    desc: 'Gerenciar conta atual e criar contas individuais',
  },
  guide: {
    label: 'Fórmulas & Passo a Passo Looker Studio',
    shortLabel: 'Guia Looker',
    desc: 'Fórmulas prontas e instruções',
  },
};

export const DASHBOARD_BLOCK_META: Record<DashboardBlockId, { label: string; desc: string }> = {
  filters: {
    label: 'Barra de Filtros Interativos',
    desc: 'Filtros de Mês, Status e Trimestre',
  },
  scorecards: {
    label: '6 Scorecards Executivos',
    desc: 'Meta, Valor Guardado, Saldo, Média, Progresso e Pagos',
  },
  cumulativeChart: {
    label: 'Gráfico de Acúmulo Progressivo (Linha)',
    desc: 'Evolução acumulada rumo aos R$ 30.000,00',
  },
  monthlyCharts: {
    label: 'Comparativo Mensal + Gráfico Donut',
    desc: 'Colunas mensais e proporção concluído vs. pendente',
  },
  monthlyTable: {
    label: 'Tabela de Detalhamento Mensal',
    desc: 'Resumo financeiro dos 12 meses',
  },
};

export const TABLE_COLUMN_META: Record<DepositTableColumnId, { label: string; desc: string }> = {
  status: { label: 'Status', desc: 'Caixa de seleção Concluído / Pendente' },
  numero: { label: 'Nº', desc: 'Número do depósito (#001 a #365)' },
  mes: { label: 'Mês de Referência', desc: 'Janeiro a Dezembro' },
  trimestre: { label: 'Trimestre', desc: '1º ao 4º Trimestre' },
  valor: { label: 'Valor do Depósito', desc: 'Valor em R$ da folha' },
  data: { label: 'Data do Depósito', desc: 'Data em que foi pago' },
  observacoes: { label: 'Observações', desc: 'Notas e marcações' },
};

function renderTabIcon(id: AppTabId) {
  switch (id) {
    case 'grid':
      return <LayoutGrid className="w-4 h-4 text-emerald-600" />;
    case 'dashboard':
      return <BarChart3 className="w-4 h-4 text-blue-600" />;
    case 'table':
      return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
    case 'history':
      return <History className="w-4 h-4 text-amber-600" />;
    case 'names':
      return <Pencil className="w-4 h-4 text-emerald-600" />;
    case 'accounts':
      return <UserPlus className="w-4 h-4 text-blue-600" />;
    case 'guide':
      return <Sparkles className="w-4 h-4 text-purple-600" />;
  }
}

function reorderArray<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex >= list.length) {
    return list;
  }
  const next = [...list];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export const LayoutOrganizerModal: React.FC<LayoutOrganizerModalProps> = ({
  isOpen,
  onClose,
  challenges,
  activeChallengeId,
  layoutPrefs,
  isInlineMoveMode,
  onToggleInlineMoveMode,
  onUpdateLayoutPrefs,
  onSelectChallenge,
}) => {
  const [section, setSection] = useState<'participants' | 'tabs' | 'tables'>('participants');
  const [dragInfo, setDragInfo] = useState<{ group: string; index: number } | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ group: string; index: number } | null>(null);

  if (!isOpen) return null;

  const participantIds = challenges.map((c) => c.id);

  const commitParticipants = (nextIds: string[]) => {
    onUpdateLayoutPrefs({
      ...layoutPrefs,
      participantOrder: nextIds,
    });
  };

  const commitTabs = (nextTabs: AppTabId[]) => {
    onUpdateLayoutPrefs({
      ...layoutPrefs,
      tabOrder: nextTabs,
    });
  };

  const commitDashboard = (nextDash: DashboardBlockId[]) => {
    onUpdateLayoutPrefs({
      ...layoutPrefs,
      dashboardOrder: nextDash,
    });
  };

  const commitColumns = (nextCols: DepositTableColumnId[]) => {
    onUpdateLayoutPrefs({
      ...layoutPrefs,
      tableColumnOrder: nextCols,
    });
  };

  const handleResetAll = () => {
    onUpdateLayoutPrefs({
      participantOrder: [],
      tabOrder: [...DEFAULT_TAB_ORDER],
      dashboardOrder: [...DEFAULT_DASHBOARD_ORDER],
      tableColumnOrder: [...DEFAULT_TABLE_COLUMN_ORDER],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/55 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl border-l border-slate-200 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
              <ArrowUpDown className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">Organizar Painel &amp; Ordem</h2>
              <p className="text-[11px] text-slate-300">
                Arraste ou use as setas para mover participantes, ícones, blocos e colunas.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Fechar organizador"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inline Live-Move Switch */}
        <div className="px-5 py-3 bg-emerald-50/70 border-b border-emerald-200/80 flex items-center justify-between gap-3">
          <div className="text-xs">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-emerald-600" />
              <span>Modo Movimentação Direta na Tela</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Exibe alças de arrastar e setas direto nos ícones, participantes e tabelas do painel.
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleInlineMoveMode}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 border ${
              isInlineMoveMode
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {isInlineMoveMode ? 'Ativo' : 'Ativar'}
          </button>
        </div>

        {/* Section Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-200 flex items-center gap-1.5 bg-slate-50 text-xs">
          <button
            type="button"
            onClick={() => setSection('participants')}
            className={`flex-1 py-2 px-2.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              section === 'participants'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Pessoas ({challenges.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSection('tabs')}
            className={`flex-1 py-2 px-2.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              section === 'tabs'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Ícones / Abas</span>
          </button>
          <button
            type="button"
            onClick={() => setSection('tables')}
            className={`flex-1 py-2 px-2.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              section === 'tables'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Tabelas &amp; Painel</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* SECTION 1: PARTICIPANTS */}
          {section === 'participants' && (
            <div className="space-y-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Ordem das Pessoas no Painel Principal
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Arraste pelo ícone lateral ou use as setas ▲ ▼ para definir quem aparece primeiro na barra de Participantes.
                </p>
              </div>

              {challenges.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-center">
                  Nenhum participante criado ainda.
                </div>
              ) : (
                <div className="space-y-2">
                  {challenges.map((ch, idx) => {
                    const isActive = ch.id === activeChallengeId;
                    const paidCount = Object.keys(ch.paidDeposits || {}).length;
                    const isDropTarget =
                      hoverInfo?.group === 'participants' && hoverInfo.index === idx;

                    return (
                      <div
                        key={ch.id}
                        draggable
                        onDragStart={() => setDragInfo({ group: 'participants', index: idx })}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setHoverInfo({ group: 'participants', index: idx });
                        }}
                        onDrop={() => {
                          if (dragInfo?.group === 'participants') {
                            commitParticipants(reorderArray(participantIds, dragInfo.index, idx));
                          }
                          setDragInfo(null);
                          setHoverInfo(null);
                        }}
                        onDragEnd={() => {
                          setDragInfo(null);
                          setHoverInfo(null);
                        }}
                        className={`p-3 rounded-xl border bg-white flex items-center justify-between gap-2 transition-all cursor-grab active:cursor-grabbing ${
                          isDropTarget
                            ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/40'
                            : isActive
                            ? 'border-emerald-400 bg-emerald-50/40'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="w-5 h-5 rounded bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onSelectChallenge(ch.id)}
                                className="font-bold text-slate-900 hover:text-emerald-700 truncate text-left cursor-pointer"
                              >
                                {ch.title}
                              </button>
                              {isActive && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">
                              {paidCount}/365 pagos
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => commitParticipants(reorderArray(participantIds, idx, idx - 1))}
                            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-35 text-slate-700 cursor-pointer"
                            title="Mover para cima / esquerda"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === challenges.length - 1}
                            onClick={() => commitParticipants(reorderArray(participantIds, idx, idx + 1))}
                            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-35 text-slate-700 cursor-pointer"
                            title="Mover para baixo / direita"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: NAVIGATION ICONS / TABS */}
          {section === 'tabs' && (
            <div className="space-y-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Ordem dos Ícones e Abas de Navegação
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Escolha a sequência dos ícones na barra superior conforme o que você mais acessa.
                </p>
              </div>

              <div className="space-y-2">
                {layoutPrefs.tabOrder.map((tabId, idx) => {
                  const meta = TAB_META[tabId];
                  const isDropTarget = hoverInfo?.group === 'tabs' && hoverInfo.index === idx;

                  return (
                    <div
                      key={tabId}
                      draggable
                      onDragStart={() => setDragInfo({ group: 'tabs', index: idx })}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setHoverInfo({ group: 'tabs', index: idx });
                      }}
                      onDrop={() => {
                        if (dragInfo?.group === 'tabs') {
                          commitTabs(reorderArray(layoutPrefs.tabOrder, dragInfo.index, idx));
                        }
                        setDragInfo(null);
                        setHoverInfo(null);
                      }}
                      onDragEnd={() => {
                        setDragInfo(null);
                        setHoverInfo(null);
                      }}
                      className={`p-3 rounded-xl border bg-white flex items-center justify-between gap-2 transition-all cursor-grab active:cursor-grabbing ${
                        isDropTarget
                          ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/40'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          {renderTabIcon(tabId)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{meta.shortLabel}</div>
                          <div className="text-[10px] text-slate-500 truncate">{meta.desc}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => commitTabs(reorderArray(layoutPrefs.tabOrder, idx, idx - 1))}
                          className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-35 text-slate-700 cursor-pointer"
                          title="Mover para antes"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === layoutPrefs.tabOrder.length - 1}
                          onClick={() => commitTabs(reorderArray(layoutPrefs.tabOrder, idx, idx + 1))}
                          className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-35 text-slate-700 cursor-pointer"
                          title="Mover para depois"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 3: DASHBOARD & TABLES */}
          {section === 'tables' && (
            <div className="space-y-6">
              {/* Dashboard Blocks */}
              <div className="space-y-2.5">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Ordem dos Blocos no Dashboard Executivo
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Movimente gráficos, scorecards, filtros e a tabela mensal na ordem desejada.
                  </p>
                </div>

                <div className="space-y-2">
                  {layoutPrefs.dashboardOrder.map((blockId, idx) => {
                    const meta = DASHBOARD_BLOCK_META[blockId];
                    const isDropTarget = hoverInfo?.group === 'dash' && hoverInfo.index === idx;

                    return (
                      <div
                        key={blockId}
                        draggable
                        onDragStart={() => setDragInfo({ group: 'dash', index: idx })}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setHoverInfo({ group: 'dash', index: idx });
                        }}
                        onDrop={() => {
                          if (dragInfo?.group === 'dash') {
                            commitDashboard(
                              reorderArray(layoutPrefs.dashboardOrder, dragInfo.index, idx)
                            );
                          }
                          setDragInfo(null);
                          setHoverInfo(null);
                        }}
                        onDragEnd={() => {
                          setDragInfo(null);
                          setHoverInfo(null);
                        }}
                        className={`p-3 rounded-xl border bg-white flex items-center justify-between gap-2 transition-all cursor-grab active:cursor-grabbing ${
                          isDropTarget
                            ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/40'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="w-5 h-5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{meta.label}</div>
                            <div className="text-[10px] text-slate-500 truncate">{meta.desc}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() =>
                              commitDashboard(reorderArray(layoutPrefs.dashboardOrder, idx, idx - 1))
                            }
                            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-35 text-slate-700 cursor-pointer"
                            title="Subir bloco"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === layoutPrefs.dashboardOrder.length - 1}
                            onClick={() =>
                              commitDashboard(reorderArray(layoutPrefs.dashboardOrder, idx, idx + 1))
                            }
                            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-35 text-slate-700 cursor-pointer"
                            title="Descer bloco"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 365-Row Table Columns */}
              <div className="space-y-2.5 pt-3 border-t border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Ordem das Colunas da Planilha (365 Linhas)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Reordene quais colunas aparecem primeiro na tabela detalhada de depósitos.
                  </p>
                </div>

                <div className="space-y-2">
                  {layoutPrefs.tableColumnOrder.map((colId, idx) => {
                    const meta = TABLE_COLUMN_META[colId];
                    const isDropTarget = hoverInfo?.group === 'cols' && hoverInfo.index === idx;

                    return (
                      <div
                        key={colId}
                        draggable
                        onDragStart={() => setDragInfo({ group: 'cols', index: idx })}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setHoverInfo({ group: 'cols', index: idx });
                        }}
                        onDrop={() => {
                          if (dragInfo?.group === 'cols') {
                            commitColumns(
                              reorderArray(layoutPrefs.tableColumnOrder, dragInfo.index, idx)
                            );
                          }
                          setDragInfo(null);
                          setHoverInfo(null);
                        }}
                        onDragEnd={() => {
                          setDragInfo(null);
                          setHoverInfo(null);
                        }}
                        className={`p-2.5 rounded-xl border bg-white flex items-center justify-between gap-2 transition-all cursor-grab active:cursor-grabbing ${
                          isDropTarget
                            ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/40'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{meta.label}</div>
                            <div className="text-[10px] text-slate-500 truncate">{meta.desc}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() =>
                              commitColumns(reorderArray(layoutPrefs.tableColumnOrder, idx, idx - 1))
                            }
                            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-35 text-slate-700 cursor-pointer"
                            title="Mover coluna para esquerda"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === layoutPrefs.tableColumnOrder.length - 1}
                            onClick={() =>
                              commitColumns(reorderArray(layoutPrefs.tableColumnOrder, idx, idx + 1))
                            }
                            className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-35 text-slate-700 cursor-pointer"
                            title="Mover coluna para direita"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleResetAll}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
          >
            Concluir Organização
          </button>
        </div>
      </div>
    </div>
  );
};
