import React, { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  FolderPlus,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { EXACT_SHEET_VALUES } from '../data/userChallengeGrid';
import {
  ChallengeInstanceDoc,
  InitialSeedMode,
  TOTAL_GOAL,
} from '../services/challengeService';

interface ChallengeNamesTabProps {
  challenges: ChallengeInstanceDoc[];
  activeChallengeId: string | null;
  userDisplayName: string | null;
  onSelectChallenge: (challengeId: string) => void;
  onRenameChallenge: (challengeId: string, newTitle: string) => Promise<void>;
  onCreateChallenge: (options: { title: string; mode: InitialSeedMode }) => Promise<void>;
  onCreateMultipleChallenges: (titles: string[], mode: InitialSeedMode) => Promise<void>;
  onDeleteChallenge: (challengeId: string) => Promise<void>;
  formatBRL: (val: number) => string;
}

export const ChallengeNamesTab: React.FC<ChallengeNamesTabProps> = ({
  challenges,
  activeChallengeId,
  userDisplayName,
  onSelectChallenge,
  onRenameChallenge,
  onCreateChallenge,
  onCreateMultipleChallenges,
  onDeleteChallenge,
  formatBRL,
}) => {
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add new person / family
  const [addMode, setAddMode] = useState<'single' | 'family'>('single');
  const [newPersonName, setNewPersonName] = useState('');
  const [familyNames, setFamilyNames] = useState<string[]>(['', '', '', '', '']);
  const [isCreating, setIsCreating] = useState(false);

  // Sync draftNames whenever challenges list updates
  useEffect(() => {
    setDraftNames((prev) => {
      const next: Record<string, string> = {};
      for (const ch of challenges) {
        next[ch.id] = prev[ch.id] !== undefined && prev[ch.id] !== ch.title ? prev[ch.id] : ch.title;
      }
      return next;
    });
  }, [challenges]);

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

  const dirtyChallenges = challenges.filter((ch) => {
    const draft = (draftNames[ch.id] ?? ch.title).trim();
    return draft.length > 0 && draft !== ch.title;
  });

  const markSaved = (id: string) => {
    setSavedIds((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setSavedIds((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }, 2500);
  };

  const handleSaveOne = async (ch: ChallengeInstanceDoc) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const trimmed = (draftNames[ch.id] ?? '').trim();
    if (!trimmed) {
      setErrorMsg('O nome do desafio não pode ficar vazio.');
      return;
    }
    if (trimmed === ch.title) return;

    setSavingId(ch.id);
    try {
      await onRenameChallenge(ch.id, trimmed);
      markSaved(ch.id);
      setSuccessMsg(`Desafio renomeado para "${trimmed}" com sucesso!`);
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao salvar o novo nome no Firestore.');
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveAll = async () => {
    if (dirtyChallenges.length === 0) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setSavingAll(true);
    try {
      for (const ch of dirtyChallenges) {
        const trimmed = (draftNames[ch.id] ?? ch.title).trim();
        if (trimmed && trimmed !== ch.title) {
          await onRenameChallenge(ch.id, trimmed);
          markSaved(ch.id);
        }
      }
      setSuccessMsg(`${dirtyChallenges.length} nome(s) atualizado(s) no Firestore!`);
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao salvar alguns nomes. Tente novamente.');
    } finally {
      setSavingAll(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (addMode === 'family') {
      const valid = familyNames.map((n) => n.trim()).filter((n) => n.length > 0);
      if (valid.length === 0) {
        setErrorMsg('Digite pelo menos 1 nome na lista da família.');
        return;
      }
      setIsCreating(true);
      try {
        await onCreateMultipleChallenges(valid, 'empty');
        setFamilyNames(['', '', '', '', '']);
        setSuccessMsg(`${valid.length} desafio(s) criado(s) com o nome de cada pessoa!`);
      } catch (err) {
        console.error(err);
        setErrorMsg('Não foi possível criar os desafios no Firestore.');
      } finally {
        setIsCreating(false);
      }
      return;
    }

    const trimmed = newPersonName.trim();
    if (!trimmed) {
      setErrorMsg('Informe o nome da pessoa para criar o desafio.');
      return;
    }
    setIsCreating(true);
    try {
      await onCreateChallenge({ title: trimmed, mode: 'empty' });
      setNewPersonName('');
      setSuccessMsg(`Desafio "${trimmed}" criado!`);
    } catch (err) {
      console.error(err);
      setErrorMsg('Não foi possível criar o desafio no Firestore.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="space-y-4">
      {/* Header & Save All Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Pencil className="w-4 h-4 text-emerald-600" />
              <span>Renomear Meu Desafio e Nomes dos Participantes</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Coloque o seu nome no seu desafio e personalize o nome de cada pessoa da família diretamente abaixo.
            </p>
          </div>

          {dirtyChallenges.length > 0 && (
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={savingAll}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {savingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Salvar Todas as Alterações ({dirtyChallenges.length})</span>
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* List of challenges with direct editable inputs */}
        <div className="space-y-3">
          {challenges.map((ch, idx) => {
            const isActive = ch.id === activeChallengeId;
            const currentDraft = draftNames[ch.id] ?? ch.title;
            const isDirty = currentDraft.trim() !== ch.title && currentDraft.trim().length > 0;
            const isSavingThis = savingId === ch.id;
            const isJustSaved = Boolean(savedIds[ch.id]);
            const stats = calculateSaved(ch);
            const pct = (stats.sum / TOTAL_GOAL) * 100;
            const isConfirmingDelete = confirmDeleteId === ch.id;

            return (
              <div
                key={ch.id}
                className={`p-4 rounded-xl border transition-all ${
                  isActive
                    ? 'border-emerald-400 bg-emerald-50/40 ring-1 ring-emerald-400/30'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        Desafio Ativo (Selecionado)
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectChallenge(ch.id)}
                        className="px-2 py-0.5 rounded bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 hover:text-emerald-700 text-[10px] font-semibold transition-colors cursor-pointer"
                      >
                        Abrir este desafio
                      </button>
                    )}

                    {userDisplayName && currentDraft.trim() !== userDisplayName && idx === 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setDraftNames((prev) => ({
                            ...prev,
                            [ch.id]: userDisplayName.slice(0, 80),
                          }))
                        }
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-[10px] font-semibold cursor-pointer"
                        title="Preencher com o nome da sua conta"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Usar meu nome ({userDisplayName})</span>
                      </button>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-slate-600 flex items-center gap-2">
                    <span>{stats.count}/365 pagos</span>
                    <span>·</span>
                    <span className="font-bold text-emerald-700">{formatBRL(stats.sum)}</span>
                    <span>({pct.toFixed(1)}%)</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Pencil className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={currentDraft}
                      onChange={(e) =>
                        setDraftNames((prev) => ({
                          ...prev,
                          [ch.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSaveOne(ch);
                        }
                      }}
                      maxLength={80}
                      placeholder="Digite o nome da pessoa (Ex: João, Maria...)"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSaveOne(ch)}
                      disabled={!isDirty || isSavingThis}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                        isJustSaved
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isDirty
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                          : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isSavingThis ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isJustSaved ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>{isJustSaved ? 'Salvo!' : 'Salvar Nome'}</span>
                    </button>

                    {challenges.length > 1 && (
                      isConfirmingDelete ? (
                        <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1.5">
                          <span className="text-[10px] font-semibold text-rose-700">Excluir?</span>
                          <button
                            type="button"
                            onClick={async () => {
                              await onDeleteChallenge(ch.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700 cursor-pointer"
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-1.5 py-0.5 bg-white text-slate-600 border border-slate-200 rounded text-[10px] font-medium hover:bg-slate-50 cursor-pointer"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(ch.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir este desafio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add More Named Participants Directly From Tab */}
      <form
        onSubmit={handleCreate}
        className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            {addMode === 'family' ? (
              <Users className="w-4 h-4 text-emerald-600" />
            ) : (
              <FolderPlus className="w-4 h-4 text-emerald-600" />
            )}
            <span>
              {addMode === 'family'
                ? 'Adicionar Vários Nomes da Família (até 5 pessoas)'
                : 'Adicionar Mais Uma Pessoa pelo Nome'}
            </span>
          </div>

          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setAddMode('single')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                addMode === 'single' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1 Pessoa
            </button>
            <button
              type="button"
              onClick={() => setAddMode('family')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                addMode === 'family' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Família (5 Nomes)</span>
            </button>
          </div>
        </div>

        {addMode === 'family' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            {familyNames.map((val, idx) => (
              <div key={idx}>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Pessoa {idx + 1}
                </label>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => {
                    const next = [...familyNames];
                    next[idx] = e.target.value;
                    setFamilyNames(next);
                  }}
                  maxLength={80}
                  placeholder={`Ex: ${['Maria', 'João', 'Pedro', 'Ana', 'Lucas'][idx]}`}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              maxLength={80}
              placeholder="Digite o nome da nova pessoa (Ex: Maria, Filho, Esposa...)"
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Criar Desafio com Este Nome</span>
            </button>
          </div>
        )}

        {addMode === 'family' && (
          <button
            type="submit"
            disabled={isCreating}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>Criar Desafios para Todos os Nomes Preenchidos</span>
          </button>
        )}
      </form>
    </section>
  );
};
