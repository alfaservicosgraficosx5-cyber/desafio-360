import React, { useState } from 'react';
import { LOOKER_FORMULAS, LOOKER_STEPS } from '../data/lookerGuideData';
import {
  BookOpen,
  Copy,
  Check,
  Code,
  Layers,
  Sparkles,
  ExternalLink,
  Download,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface LookerSetupGuideProps {
  onExportCSV: () => void;
  onCopyTSV: () => void;
}

export const LookerSetupGuide: React.FC<LookerSetupGuideProps> = ({
  onExportCSV,
  onCopyTSV,
}) => {
  const [copiedFormulaId, setCopiedFormulaId] = useState<string | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'formulas' | 'steps'>('all');

  const copyFormula = (id: string, formula: string) => {
    navigator.clipboard.writeText(formula);
    setCopiedFormulaId(id);
    setTimeout(() => setCopiedFormulaId(null), 2500);
  };

  const copyTemplateHeaders = () => {
    onCopyTSV();
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Hero Guide Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-700">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
            <BookOpen className="w-4 h-4" />
            <span>Guia de Engenharia de Dados & Looker Studio</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            Como Conectar o Google Planilhas e Criar o Dashboard no Looker Studio
          </h1>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Siga este roteiro técnico completo para conectar sua planilha do desafio dos 365 depósitos (Meta R$ 30.000,00) ao Looker Studio, configurando os campos calculados, scorecards executivos, gráficos comparativos e filtros interativos.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={copyTemplateHeaders}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              {copiedTemplate ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Copiado para colar no Google Sheets!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Dados para Colar no Google Sheets</span>
                </>
              )}
            </button>

            <button
              onClick={onExportCSV}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-slate-300" />
              <span>Baixar Arquivo .CSV do Desafio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category selector */}
      <div className="flex items-center gap-2 p-1 bg-slate-200/70 rounded-xl w-fit text-xs font-medium">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            selectedCategory === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Visão Completa
        </button>
        <button
          onClick={() => setSelectedCategory('formulas')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            selectedCategory === 'formulas'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Fórmulas dos Campos Calculados
        </button>
        <button
          onClick={() => setSelectedCategory('steps')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            selectedCategory === 'steps'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Passo a Passo de Configuração
        </button>
      </div>

      {/* SECTION 1: CALCULATED FIELDS FORMULAS */}
      {(selectedCategory === 'all' || selectedCategory === 'formulas') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                Fórmulas dos Campos Calculados no Looker Studio
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Copie e cole diretamente em "+ Adicionar campo" no Looker Studio
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {LOOKER_FORMULAS.map((f) => (
              <div
                key={f.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{f.nome}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {f.tipo}
                      </span>
                    </div>
                    <button
                      onClick={() => copyFormula(f.id, f.formula)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                      title="Copiar fórmula"
                    >
                      {copiedFormulaId === f.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Formula Code Box */}
                  <pre className="bg-slate-900 text-blue-200 font-mono text-xs p-3 rounded-lg overflow-x-auto my-2 border border-slate-800 leading-relaxed">
                    <code>{f.formula}</code>
                  </pre>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {f.explicacao}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Onde aplicar: </span>
                  {f.ondeUsar}
                </div>
              </div>
            ))}
          </div>

          {/* Critical Tip Callout */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-950 block mb-0.5">
                Atenção ao Campo "Mês Ordem":
              </span>
              Por padrão, o Looker Studio ordena dimensões de texto alfabeticamente (Abril, Agosto, Dezembro, Fevereiro...). Criar o campo calculado <code>Mês Ordem</code> (retornando números de 1 a 12) e utilizá-lo como campo de ordenação (Sort) no Gráfico Comparativo e na Tabela é indispensável para manter a ordem cronológica correta do ano!
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: STEP BY STEP SETUP */}
      {(selectedCategory === 'all' || selectedCategory === 'steps') && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              Passo a Passo Completo de Construção no Looker Studio
            </h2>
          </div>

          <div className="space-y-4">
            {LOOKER_STEPS.map((step) => (
              <div
                key={step.numero}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {step.numero}
                  </div>
                  <div className="space-y-2 flex-1">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {step.titulo}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {step.subtitulo}
                      </p>
                    </div>

                    <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside leading-relaxed pl-1">
                      {step.detalhes.map((d, idx) => (
                        <li key={idx}>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Pro Tip */}
                    <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-800">Dica de Especialista: </span>
                        {step.dicaEngenharia}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 3: Google Sheets Column Schema Reference */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          Especificação Técnica das Colunas da Planilha Google Sheets
        </h3>
        <p className="text-xs text-slate-600">
          Esta é a especificação exata para garantir 100% de compatibilidade sem erros de tipo no Looker Studio:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-2 px-3">Nome da Coluna</th>
                <th className="py-2 px-3">Tipo no Google Sheets</th>
                <th className="py-2 px-3">Tipo no Looker Studio</th>
                <th className="py-2 px-3">Exemplo de Valor</th>
                <th className="py-2 px-3">Validação / Regra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2 px-3 font-mono font-semibold text-slate-900">Nº</td>
                <td className="py-2 px-3">Número simples</td>
                <td className="py-2 px-3">Numérico (Inteiro)</td>
                <td className="py-2 px-3 font-mono">1 até 365</td>
                <td className="py-2 px-3 text-slate-500">Chave primária sequencial de 1 a 365</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono font-semibold text-slate-900">Mês de Referência</td>
                <td className="py-2 px-3">Texto</td>
                <td className="py-2 px-3">Texto</td>
                <td className="py-2 px-3">Janeiro, Fevereiro...</td>
                <td className="py-2 px-3 text-slate-500">Nome do mês por extenso</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono font-semibold text-slate-900">Trimestre</td>
                <td className="py-2 px-3">Texto</td>
                <td className="py-2 px-3">Texto</td>
                <td className="py-2 px-3">1º Trimestre</td>
                <td className="py-2 px-3 text-slate-500">1º, 2º, 3º ou 4º Trimestre</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono font-semibold text-slate-900">Valor do Depósito</td>
                <td className="py-2 px-3">Moeda (R$)</td>
                <td className="py-2 px-3">Numérico &gt; Moeda &gt; BRL</td>
                <td className="py-2 px-3 font-mono font-bold text-emerald-700">R$ 82,00</td>
                <td className="py-2 px-3 text-slate-500">Entre R$ 1,00 e R$ 500,00 (Total = R$ 30.000)</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono font-semibold text-slate-900">Status</td>
                <td className="py-2 px-3">Texto (Lista suspensa)</td>
                <td className="py-2 px-3">Texto</td>
                <td className="py-2 px-3 font-semibold text-emerald-600">Pendente / Concluído</td>
                <td className="py-2 px-3 text-slate-500">Validação com opções: Concluído, Pendente</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono font-semibold text-slate-900">Data do Depósito</td>
                <td className="py-2 px-3">Data (DD/MM/AAAA)</td>
                <td className="py-2 px-3">Data (AAAA-MM-DD)</td>
                <td className="py-2 px-3 font-mono">2026-02-15</td>
                <td className="py-2 px-3 text-slate-500">Preenchida apenas quando o depósito é realizado</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono font-semibold text-slate-900">Observações</td>
                <td className="py-2 px-3">Texto simples</td>
                <td className="py-2 px-3">Texto</td>
                <td className="py-2 px-3 text-slate-600">Depósito inicial, meta batida...</td>
                <td className="py-2 px-3 text-slate-500">Campo livre para anotações</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
