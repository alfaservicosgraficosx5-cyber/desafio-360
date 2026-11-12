import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cloud,
  Database,
  Download,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { BackupSnapshotDoc, ChallengeItem } from '../services/challengeService';

interface StorageBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  challengeId: string;
  challengeTitle: string;
  items: ChallengeItem[];
  cloudBackups: BackupSnapshotDoc[];
  onCreateCloudBackup: () => Promise<void>;
  onRestoreCloudBackup: (backup: BackupSnapshotDoc) => Promise<void>;
  onDeleteCloudBackup: (backupId: string) => Promise<void>;
  onRestoreItems: (items: ChallengeItem[]) => Promise<void> | void;
  onClearAll: () => void;
  lastSavedTime: string;
  formatBRL: (val: number) => string;
}

export const StorageBackupModal: React.FC<StorageBackupModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  challengeId,
  challengeTitle,
  items,
  cloudBackups,
  onCreateCloudBackup,
  onRestoreCloudBackup,
  onDeleteCloudBackup,
  onRestoreItems,
  onClearAll,
  lastSavedTime,
  formatBRL,
}) => {
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [isCreatingCloud, setIsCreatingCloud] = useState(false);
  const [busyBackupId, setBusyBackupId] = useState<string | null>(null);

  if (!isOpen) return null;

  const paidCount = items.filter((i) => i.status === 'Concluído').length;
  const totalPaidVal = items
    .filter((i) => i.status === 'Concluído')
    .reduce((acc, c) => acc + c.valor, 0);

  const handleExportJSON = () => {
    const backupData = {
      app: 'Desafio 365 Depositos R$ 30.000',
      ownerId: userId,
      userEmail,
      challengeId,
      challengeTitle,
      exportedAt: new Date().toISOString(),
      totalDepositos: items.length,
      depositosConcluidos: paidCount,
      valorTotalGuardado: totalPaidVal,
      items,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `Desafio365_Backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (parsed && parsed.ownerId && parsed.ownerId !== userId) {
          setImportError(
            'Este arquivo de backup pertence a outra conta de usuário e não pode ser importado aqui.'
          );
          return;
        }

        let restoredList: ChallengeItem[] | null = null;
        if (Array.isArray(parsed)) {
          restoredList = parsed;
        } else if (parsed && Array.isArray(parsed.items)) {
          restoredList = parsed.items;
        }

        if (restoredList && restoredList.length === 365) {
          await onRestoreItems(restoredList);
          setImportSuccess(
            `Backup restaurado no Firestore! ${
              restoredList.filter((i) => i.status === 'Concluído').length
            } depósitos marcados.`
          );
        } else {
          setImportError('O arquivo selecionado não contém os 365 registros válidos do desafio.');
        }
      } catch {
        setImportError('Erro ao ler o arquivo JSON de backup. Verifique se o arquivo está íntegro.');
      }
    };
    reader.readAsText(file);
  };

  const handleCloudSnapshot = async () => {
    setIsCreatingCloud(true);
    setImportError(null);
    setImportSuccess(null);
    try {
      await onCreateCloudBackup();
      setImportSuccess('Ponto de restauração privado salvo na sua conta no Firestore!');
    } catch {
      setImportError('Não foi possível criar o backup na nuvem.');
    } finally {
      setIsCreatingCloud(false);
    }
  };

  const handleRestoreCloud = async (bkp: BackupSnapshotDoc) => {
    setBusyBackupId(bkp.id);
    setImportError(null);
    setImportSuccess(null);
    try {
      await onRestoreCloudBackup(bkp);
      setImportSuccess(`Snapshot de "${bkp.challengeTitle}" restaurado com sucesso!`);
    } catch {
      setImportError('Não foi possível restaurar o backup na nuvem.');
    } finally {
      setBusyBackupId(null);
    }
  };

  const handleDeleteCloud = async (backupId: string) => {
    setBusyBackupId(backupId);
    try {
      await onDeleteCloudBackup(backupId);
    } catch {
      setImportError('Erro ao excluir o backup na nuvem.');
    } finally {
      setBusyBackupId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Backups Privados & Sincronização na Nuvem
              </h2>
              <p className="text-xs text-slate-500">
                Backups vinculados exclusivamente à conta {userEmail}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto">
          {/* Real-time Storage Status Card */}
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-emerald-900 font-bold">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Isolamento por Usuário Ativo no Firestore</span>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Todos os depósitos, histórico e backups desta instância estão isolados pelo seu identificador único no Firebase e protegidos por regras de segurança no banco.
            </p>
            <div className="pt-2 border-t border-emerald-200/80 grid grid-cols-2 gap-2 text-[11px] font-mono text-emerald-950">
              <div>
                <span className="text-emerald-700">Depósitos Salvos:</span> {paidCount} de 365
              </div>
              <div>
                <span className="text-emerald-700">Total Guardado:</span> {formatBRL(totalPaidVal)}
              </div>
              <div className="col-span-2 flex items-center gap-1 text-[10px] text-emerald-800">
                <Clock className="w-3 h-3 text-emerald-600" />
                <span>
                  Última atualização na nuvem: <strong>{lastSavedTime || 'Ativa agora'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Cloud Backups in Firestore */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-blue-600" />
                <span>Backups na Nuvem ({cloudBackups.length})</span>
              </h3>
              <button
                onClick={handleCloudSnapshot}
                disabled={isCreatingCloud}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                {isCreatingCloud ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Cloud className="w-3 h-3" />
                )}
                <span>Salvar Backup Agora</span>
              </button>
            </div>

            {cloudBackups.length === 0 ? (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                Nenhum ponto de restauração salvo na nuvem ainda. Clique em &ldquo;Salvar Backup Agora&rdquo; para criar um snapshot privado da sua conta.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {cloudBackups.map((bkp) => {
                  const isBusy = busyBackupId === bkp.id;
                  const createdLabel = bkp.createdAt
                    ? bkp.createdAt.toDate().toLocaleString('pt-BR')
                    : 'Agora';

                  return (
                    <div
                      key={bkp.id}
                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">
                          {bkp.challengeTitle}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {bkp.paidCount}/365 · {formatBRL(bkp.totalSaved)} · {createdLabel}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleRestoreCloud(bkp)}
                          disabled={isBusy}
                          className="px-2 py-1 bg-white border border-slate-200 hover:border-emerald-400 hover:text-emerald-700 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                          title="Restaurar este backup na instância atual"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restaurar</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCloud(bkp.id)}
                          disabled={isBusy}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Excluir backup"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Local File Export & Import */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-slate-800 text-xs">
              Exportar ou Importar Arquivo .JSON da Sua Conta:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={handleExportJSON}
                className="p-3 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-blue-300 transition-colors flex flex-col items-center text-center gap-1.5 cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Download className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-800 text-xs">Baixar Arquivo Backup</span>
                <span className="text-[10px] text-slate-500">Salva arquivo .JSON vinculado ao seu ID</span>
              </button>

              <label className="p-3 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-emerald-300 transition-colors flex flex-col items-center text-center gap-1.5 cursor-pointer group">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-800 text-xs">Restaurar Backup .JSON</span>
                <span className="text-[10px] text-slate-500">Valida propriedade da conta ao importar</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {importSuccess && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg flex items-center gap-2 text-[11px]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{importSuccess}</span>
            </div>
          )}

          {importError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2 text-[11px]">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {/* Danger zone / Reset option */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Quer iniciar esta instância do zero?
            </span>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    'Tem certeza? Isso marcará todos os 365 quadrinhos como pendentes (R$ 0,00 guardados).'
                  )
                ) {
                  onClearAll();
                  onClose();
                }
              }}
              className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer underline"
            >
              Zerar todos os quadrinhos
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
