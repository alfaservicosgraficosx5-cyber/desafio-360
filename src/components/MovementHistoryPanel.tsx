import React from 'react';
import { ArrowDownLeft, ArrowUpRight, History, RotateCcw, ShieldCheck, Upload } from 'lucide-react';
import { MovementEntryDoc } from '../services/challengeService';

interface MovementHistoryPanelProps {
  movements: MovementEntryDoc[];
  challengeTitle: string;
  formatBRL: (val: number) => string;
}

export const MovementHistoryPanel: React.FC<MovementHistoryPanelProps> = ({
  movements,
  challengeTitle,
  formatBRL,
}) => {
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 md:p-6 shadow-2xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            <span>Histórico de Movimentações — {challengeTitle}</span>
          </h2>
          <p className="text-xs text-slate-500">
            Registro imutável por usuário salvo no Cloud Firestore (preservado ao sair e entrar novamente).
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>{movements.length} movimentações registradas</span>
        </div>
      </div>

      {movements.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
          <History className="w-6 h-6 text-slate-400 mx-auto" />
          <p className="text-xs font-semibold text-slate-700">
            Nenhuma movimentação registrada ainda nesta instância.
          </p>
          <p className="text-[11px] text-slate-500">
            Ao marcar ou desmarcar um quadrinho na grade, a movimentação será gravada automaticamente no histórico da sua conta.
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-100 z-10 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Descrição</th>
                <th className="py-2.5 px-3 text-center">Quadrinho</th>
                <th className="py-2.5 px-3 text-right">Valor</th>
                <th className="py-2.5 px-3 text-right">Data / Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((mov) => {
                const dateLabel = mov.createdAt
                  ? mov.createdAt.toDate().toLocaleString('pt-BR')
                  : 'Sincronizando...';

                return (
                  <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3">
                      {mov.type === 'deposit' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          <ArrowUpRight className="w-3 h-3" />
                          Depósito
                        </span>
                      )}
                      {mov.type === 'undo' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                          <ArrowDownLeft className="w-3 h-3" />
                          Estorno
                        </span>
                      )}
                      {mov.type === 'reset' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                          <RotateCcw className="w-3 h-3" />
                          Zerado
                        </span>
                      )}
                      {mov.type === 'restore' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                          <Upload className="w-3 h-3" />
                          Restauração
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{mov.description}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                      {mov.depositNumber > 0
                        ? `#${String(mov.depositNumber).padStart(3, '0')}`
                        : 'Lote'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-slate-900">
                      {formatBRL(mov.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {dateLabel}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
