import React, { useState } from 'react';
import { DepositItem, StatusType } from '../types/challenge';
import { TOTAL_GOAL, MONTHS, formatCurrencyBRL } from '../data/challengeData';
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';

interface ImportSpreadsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: DepositItem[]) => void;
  currentTotal: number;
}

export const ImportSpreadsheetModal: React.FC<ImportSpreadsheetModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'file'>('paste');
  const [pastedText, setPastedText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<DepositItem[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ count: number; sum: number; completedCount: number } | null>(null);

  if (!isOpen) return null;

  const parsePastedData = (text: string) => {
    setErrorMsg(null);
    setSuccessInfo(null);
    setParsedPreview(null);

    const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      setErrorMsg('Nenhum dado encontrado para importar. Cole as linhas da sua planilha.');
      return;
    }

    const items: DepositItem[] = [];
    let isFirstLineHeader = false;

    // Check if first line is header
    const firstLineLower = lines[0].toLowerCase();
    if (
      firstLineLower.includes('mês') ||
      firstLineLower.includes('mes') ||
      firstLineLower.includes('valor') ||
      firstLineLower.includes('status') ||
      firstLineLower.includes('nº') ||
      firstLineLower.includes('numero')
    ) {
      isFirstLineHeader = true;
    }

    const startIndex = isFirstLineHeader ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      // Split by tab, comma or semicolon (supporting Google Sheets copy-paste and CSV)
      let cols: string[] = [];
      if (line.includes('\t')) {
        cols = line.split('\t');
      } else if (line.includes(';')) {
        cols = line.split(';');
      } else {
        // Comma separated, but handle quotes
        cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      }

      cols = cols.map(c => c.trim().replace(/^"|"$/g, ''));

      if (cols.length < 2) continue;

      // Detect column order or fallback to standard order:
      // Col 0: Nº (or auto)
      // Col 1: Mês
      // Col 2: Trimestre
      // Col 3: Valor do Depósito
      // Col 4: Status
      // Col 5: Data
      // Col 6: Observações

      let numero = parseInt(cols[0], 10);
      if (isNaN(numero)) {
        numero = items.length + 1;
      }

      // Find value column (look for currency or number)
      let valor = 0;
      let mes = '';
      let status: StatusType = 'Pendente';
      let dataDeposito = '';
      let observacoes = '';
      let trimestre = '';

      if (cols.length >= 4) {
        mes = cols[1] || '';
        trimestre = cols[2] || '';
        
        // Parse valor
        const rawVal = (cols[3] || '0').replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
        valor = parseFloat(rawVal) || 0;

        // Parse status
        const rawStatus = (cols[4] || '').toLowerCase();
        if (rawStatus.includes('conc') || rawStatus.includes('pago') || rawStatus.includes('ok') || rawStatus.includes('sim') || rawStatus.includes('true')) {
          status = 'Concluído';
        } else {
          status = 'Pendente';
        }

        dataDeposito = cols[5] || '';
        observacoes = cols[6] || '';
      } else {
        // Simple 2-column or 3-column fallback: Nº, Valor, Status
        const rawVal = (cols[1] || '0').replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
        valor = parseFloat(rawVal) || 0;
        if (cols[2]) {
          const rawStatus = cols[2].toLowerCase();
          status = (rawStatus.includes('conc') || rawStatus.includes('pago')) ? 'Concluído' : 'Pendente';
        }
      }

      // If month is missing, calculate from item index
      if (!mes) {
        const itemIdx = items.length;
        let cumulativeDays = 0;
        for (const m of MONTHS) {
          cumulativeDays += m.dias;
          if (itemIdx < cumulativeDays) {
            mes = m.nome;
            trimestre = m.trimestre;
            break;
          }
        }
      }

      // Find matching month object
      const matchedMonth = MONTHS.find(m => m.nome.toLowerCase() === mes.toLowerCase()) || MONTHS[0];
      if (!trimestre) {
        trimestre = matchedMonth.trimestre;
      }

      items.push({
        numero: numero,
        mes: matchedMonth.nome,
        mesNumero: matchedMonth.numero,
        trimestre: trimestre,
        valor: Math.max(0, valor),
        status: status,
        dataDeposito: dataDeposito,
        observacoes: observacoes,
      });
    }

    if (items.length === 0) {
      setErrorMsg('Não foi possível ler as linhas. Verifique o formato colado.');
      return;
    }

    const sum = items.reduce((acc, curr) => acc + curr.valor, 0);
    const completedCount = items.filter(i => i.status === 'Concluído').length;

    setParsedPreview(items);
    setSuccessInfo({
      count: items.length,
      sum: sum,
      completedCount: completedCount,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPastedText(content);
        parsePastedData(content);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleConfirmImport = () => {
    if (!parsedPreview || parsedPreview.length === 0) return;
    
    // If fewer than 365 items or missing months, pad or format to 365
    let finalItems = [...parsedPreview];
    
    if (finalItems.length < 365) {
      // Create a full 365-day array mapping existing items
      const padded: DepositItem[] = [];
      let currentNum = 1;
      let existingIdx = 0;

      for (const m of MONTHS) {
        for (let d = 1; d <= m.dias; d++) {
          if (existingIdx < finalItems.length) {
            padded.push({
              ...finalItems[existingIdx],
              numero: currentNum,
              mes: m.nome,
              mesNumero: m.numero,
              trimestre: m.trimestre,
            });
            existingIdx++;
          } else {
            padded.push({
              numero: currentNum,
              mes: m.nome,
              mesNumero: m.numero,
              trimestre: m.trimestre,
              valor: 82.00,
              status: 'Pendente',
              dataDeposito: '',
              observacoes: '',
            });
          }
          currentNum++;
        }
      }
      finalItems = padded;
    }

    onImport(finalItems);
    onClose();
  };

  const handleCalibrateTo30k = () => {
    if (!parsedPreview) return;
    const currentSum = parsedPreview.reduce((acc, curr) => acc + curr.valor, 0);
    if (currentSum <= 0) return;

    const factor = TOTAL_GOAL / currentSum;
    let runningTotal = 0;
    const adjusted = parsedPreview.map((item, index) => {
      if (index === parsedPreview.length - 1) {
        const remaining = Math.round((TOTAL_GOAL - runningTotal) * 100) / 100;
        return {
          ...item,
          valor: Math.max(1, remaining),
        };
      }
      const val = Math.round(item.valor * factor);
      runningTotal += val;
      return {
        ...item,
        valor: val,
      };
    });

    setParsedPreview(adjusted);
    setSuccessInfo({
      count: adjusted.length,
      sum: TOTAL_GOAL,
      completedCount: adjusted.filter(i => i.status === 'Concluído').length,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Importar Minha Planilha do Google Sheets
              </h2>
              <p className="text-xs text-slate-500">
                Carregue os dados existentes da sua planilha para alimentar o dashboard e o Looker Studio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setActiveTab('paste')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'paste'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Colar Dados Copiados (Ctrl+V)
            </button>
            <button
              onClick={() => setActiveTab('file')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'file'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Enviar Arquivo CSV / TSV
            </button>
          </div>

          {activeTab === 'paste' ? (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700 block">
                Selecione as linhas da sua planilha no Google Sheets, copie (Ctrl+C) e cole abaixo:
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => {
                  setPastedText(e.target.value);
                  parsePastedData(e.target.value);
                }}
                placeholder="Exemplo colado do Google Sheets:&#10;Nº&#9;Mês de Referência&#9;Trimestre&#9;Valor do Depósito&#9;Status&#9;Data do Depósito&#9;Observações&#10;1&#9;Janeiro&#9;1º Trimestre&#9;50,00&#9;Concluído&#9;2026-01-02&#9;Depósito Inicial&#10;2&#9;Janeiro&#9;1º Trimestre&#9;75,00&#9;Pendente&#9;&#9;"
                rows={6}
                className="w-full text-xs font-mono p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-blue-400 transition-colors bg-slate-50">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-600 mb-1">
                Arraste seu arquivo <span className="font-semibold">.csv</span> ou clique para selecionar
              </p>
              <p className="text-[11px] text-slate-400 mb-3">
                Exportado do Google Sheets (Arquivo &gt; Fazer download &gt; Valores separados por vírgula)
              </p>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md cursor-pointer transition-colors shadow-xs">
                <span>Escolher Arquivo</span>
                <input
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Validation Feedback */}
          {errorMsg && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successInfo && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{successInfo.count} registros identificados com sucesso!</span>
                </div>
                <span className="text-xs font-mono font-medium text-emerald-700">
                  Total: {formatCurrencyBRL(successInfo.sum)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-emerald-700 pt-1 border-t border-emerald-100">
                <div>
                  <span className="text-emerald-900 font-medium">Depósitos: </span>
                  {successInfo.count} linhas
                </div>
                <div>
                  <span className="text-emerald-900 font-medium">Concluídos: </span>
                  {successInfo.completedCount} pagos
                </div>
                <div>
                  <span className="text-emerald-900 font-medium">Meta Base: </span>
                  {formatCurrencyBRL(TOTAL_GOAL)}
                </div>
              </div>

              {/* Notice if sum is different from 30,000 */}
              {Math.abs(successInfo.sum - TOTAL_GOAL) > 1 && (
                <div className="mt-2 p-2 bg-white rounded border border-emerald-200 flex items-center justify-between">
                  <span className="text-[11px] text-slate-600">
                    Sua soma atual é {formatCurrencyBRL(successInfo.sum)}. Deseja calibrar proporcionalmente para atingir exatamente R$ 30.000,00?
                  </span>
                  <button
                    onClick={handleCalibrateTo30k}
                    className="ml-2 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium rounded transition-colors shrink-0 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Calibrar para R$ 30k
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick guide format */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600 space-y-1">
            <span className="font-semibold text-slate-700 block">Colunas esperadas da sua planilha:</span>
            <p className="font-mono text-slate-500">
              Nº · Mês de Referência · Trimestre · Valor do Depósito · Status · Data do Depósito · Observações
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={!parsedPreview || parsedPreview.length === 0}
            className={`px-4 py-1.5 text-xs font-medium text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs ${
              parsedPreview && parsedPreview.length > 0
                ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            <span>Aplicar ao Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
