import React, { useState, useMemo } from 'react';
import {
  ChallengeInstanceDoc,
  ChallengeItem,
  InitialSeedMode,
  TOTAL_GOAL,
  getLegacyLocalStorageItems,
} from '../services/challengeService';
import { EXACT_SHEET_VALUES } from '../data/userChallengeGrid';
import {
  CheckCircle2,
  FolderPlus,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
  Check,
} from 'lucide-react';

interface ChallengeInstanceModalProps {
  isOpen: boolean;
  canClose: boolean;
  onClose: () => void;
  challenges: ChallengeInstanceDoc[];
  activeChallengeId: string | null;
  onSelectChallenge: (challengeId: string) => void;
  onCreateChallenge: (options: {
    title: string;
    mode: InitialSeedMode;
    legacyItems?: ChallengeItem[] | null;
  }) => Promise<void>;
  onCreateMultipleChallenges: (titles: string[], mode: InitialSeedMode) => Promise<void>;
  onRenameChallenge: (challengeId: string, newTitle: string) => Promise<void>;
  onDeleteChallenge: (challengeId: string) => Promise<void>;
  formatBRL: (val: number) => string;
}

export const ChallengeInstanceModal: React.FC<ChallengeInstanceModalProps> = ({
  isOpen,
  canClose,
  onClose,
  challenges,
  activeChallengeId,
  onSelectChallenge,
  onCreateChallenge,
  onCreateMultipleChallenges,
  onRenameChallenge,
  onDeleteChallenge,
  formatBRL,
}) => {
  const [createTab, setCreateTab] = useState<'single' | 'family'>('single');
  const [title, setTitle] = useState('Meu Desafio 365 — 2026');
  const [familyNames, setFamilyNames] = useState<string[]>(['', '', '', '', '']);
  const [seedMode, setSeedMode] = useState<InitialSeedMode>('empty');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const legacyItems = useMemo(() => getLegacyLocalStorageItems(), []);
  const legacyPaidCount = useMemo(
    () => (legacyItems ? legacyItems.filter((it) => it.status === 'Concluído').length : 0),
    [legacyItems]
  );

  if (!isOpen) return null;

  const calculateSaved = (ch: ChallengeInstanceDoc) => {
    const keys = Object.keys(ch.paidDeposits || {});
    let sum = 0;
    for (const k of keys) {
      const idx = Number(k) - 1;
      if (idx >= 0 && idx < EXACT_SHEET_VALUES.length) {
        sum += EXACT_SHEET_VALUES[idx];
      }
    }
    return { count: keys.length, sum };
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (createTab === 'family') {
      const validNames = familyNames.map((n) => n.trim()).filter((n) => n.length > 0);
      if (validNames.length === 0) {
        setErrorMsg('Preencha pelo menos 1 nome para criar as instâncias da família.');
        return;
      }
      setIsSubmitting(true);
      try {
        await onCreateMultipleChallenges(validNames, 'empty');
        setFamilyNames(['', '', '', '', '']);
        if (canClose) {
          onClose();
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Erro ao criar instâncias da família no Firestore. Tente novamente.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const trimmed = title.trim();
    if (!trimmed) {
      setErrorMsg('Informe o nome da pessoa ou da instância do desafio.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onCreateChallenge({
        title: trimmed,
        mode: seedMode,
        legacyItems: seedMode === 'legacy_local' ? legacyItems : null,
      });
      setTitle(`Participante #${challenges.length + 2}`);
      if (canClose) {
        onClose();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao criar instância no Firestore. Verifique sua conexão e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveRename = async (challengeId: string) => {
    const trimmed = editingTitle.trim();
    if (!trimmed) return;
    try {
      await onRenameChallenge(challengeId, trimmed);
      setEditingId(null);
    } catch (err) {
      console.error(err);
      setErrorMsg('Não foi possível renomear o desafio.');
    }
  };

  const handleConfirmDelete = async (challengeId: string) => {
    try {
      await onDeleteChallenge(challengeId);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
      setErrorMsg('Não foi possível excluir a instância.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">
                {challenges.length === 0
                  ? 'Criar Instância Individual ou da Família'
                  : 'Participantes & Instâncias do Desafio (Firestore)'}
              </h2>
              <p className="text-[11px] text-slate-300">
                Crie 1 desafio para você ou até vários perfis com o nome de cada pessoa da família.
              </p>
            </div>
          </div>
          {canClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto text-xs">
          {/* Existing Challenges List */}
          {challenges.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Instâncias / Participantes Salvos ({challenges.length})
                </h3>
                <span className="text-[11px] text-slate-500">Clique para abrir ou renomear</span>
              </div>

              <div className="space-y-2">
                {challenges.map((ch) => {
                  const stats = calculateSaved(ch);
                  const isActive = ch.id === activeChallengeId;
                  const pct = (stats.sum / TOTAL_GOAL) * 100;
                  const isEditing = editingId === ch.id;
                  const isConfirmingDelete = confirmDeleteId === ch.id;

                  return (
                    <div
                      key={ch.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isActive
                          ? 'border-emerald-400 bg-emerald-50/50 ring-1 ring-emerald-400/40'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                maxLength={80}
                                className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveRename(ch.id)}
                                className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
                                title="Salvar nome"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 cursor-pointer"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                onSelectChallenge(ch.id);
                                if (canClose) onClose();
                              }}
                              className="text-left w-full cursor-pointer group"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm truncate group-hover:text-emerald-700">
                                  {ch.title}
                                </span>
                                {isActive && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-semibold shrink-0">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    Ativa
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-slate-600 font-mono mt-1">
                                <span>{stats.count}/365 pagos</span>
                                <span>·</span>
                                <span className="text-emerald-700 font-semibold">{formatBRL(stats.sum)}</span>
                                <span>({pct.toFixed(1)}%)</span>
                              </div>
                            </button>
                          )}
                        </div>

                        {/* Row actions */}
                        {!isEditing && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setEditingId(ch.id);
                                setEditingTitle(ch.title);
                                setConfirmDeleteId(null);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Renomear participante / instância"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {isConfirmingDelete ? (
                              <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1">
                                <span className="text-[10px] font-semibold text-rose-700">Excluir?</span>
                                <button
                                  onClick={() => handleConfirmDelete(ch.id)}
                                  className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700 cursor-pointer"
                                >
                                  Sim
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-1.5 py-0.5 bg-white text-slate-600 border border-slate-200 rounded text-[10px] font-medium hover:bg-slate-50 cursor-pointer"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(ch.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Excluir instância"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Create New Instance Form */}
          <form onSubmit={handleCreate} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
            {/* Switch between 1 person vs 5 family members */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs sm:text-sm">
                {createTab === 'family' ? (
                  <Users className="w-4 h-4 text-emerald-600" />
                ) : (
                  <FolderPlus className="w-4 h-4 text-emerald-600" />
                )}
                <span>
                  {createTab === 'family'
                    ? 'Criar para Toda a Família (até 5 pessoas)'
                    : 'Adicionar Nova Pessoa / Instância'}
                </span>
              </div>

              <div className="flex items-center gap-1 p-0.5 bg-slate-200/80 rounded-lg text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setCreateTab('single');
                    setErrorMsg(null);
                  }}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    createTab === 'single' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1 Pessoa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreateTab('family');
                    setErrorMsg(null);
                  }}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                    createTab === 'family' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span>Família (5 Nomes)</span>
                </button>
              </div>
            </div>

            {createTab === 'family' ? (
              <div className="space-y-2.5">
                <p className="text-[11px] text-slate-600">
                  Digite o nome de cada pessoa da família. Será criada uma aba individual com 365 quadrinhos (Meta R$ 30.000,00) para cada nome preenchido:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {familyNames.map((nameVal, idx) => (
                    <div key={idx}>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Pessoa {idx + 1}
                      </label>
                      <input
                        type="text"
                        value={nameVal}
                        onChange={(e) => {
                          const next = [...familyNames];
                          next[idx] = e.target.value;
                          setFamilyNames(next);
                        }}
                        maxLength={80}
                        placeholder={`Ex: ${['Maria', 'João', 'Pedro', 'Ana', 'Lucas'][idx]}`}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nome da Pessoa ou da Instância
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={80}
                    placeholder="Ex: Maria, João ou Reserva de Emergência"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Estado Inicial dos 365 Depósitos
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSeedMode('empty')}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        seedMode === 'empty'
                          ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Começar do Zero</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Todos os 365 quadrinhos pendentes (R$ 0,00).
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSeedMode('sample60')}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        seedMode === 'sample60'
                          ? 'bg-white border-blue-500 ring-2 ring-blue-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Exemplo (60 Dias Pagos)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Preenche os 60 primeiros dias para explorar gráficos.
                      </p>
                    </button>

                    {legacyItems && (
                      <button
                        type="button"
                        onClick={() => setSeedMode('legacy_local')}
                        className={`sm:col-span-2 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                          seedMode === 'legacy_local'
                            ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20'
                            : 'bg-white border-amber-200 hover:border-amber-300'
                        }`}
                      >
                        <div className="font-bold text-amber-900 flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-amber-600" />
                          <span>Migrar Progresso Local Anterior ({legacyPaidCount}/365 pagos)</span>
                        </div>
                        <p className="text-[11px] text-amber-700 mt-0.5">
                          Encontramos um desafio salvo anteriormente neste navegador. Importe para sua conta no Firestore.
                        </p>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-700">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Criando no Firestore...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>
                    {createTab === 'family'
                      ? 'Criar Instâncias para Todos os Nomes'
                      : 'Criar e Abrir Instância no Firestore'}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
