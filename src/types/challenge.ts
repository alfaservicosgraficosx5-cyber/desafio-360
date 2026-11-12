export type StatusType = 'Pendente' | 'Concluído';

export interface DepositItem {
  numero: number; // 1 to 365
  mes: string; // Janeiro, Fevereiro, etc.
  mesNumero: number; // 1 to 12
  trimestre: string; // 1º Trimestre, 2º Trimestre, etc.
  valor: number; // R$ 1.00 to R$ 500.00
  status: StatusType; // 'Pendente' | 'Concluído'
  dataDeposito: string; // YYYY-MM-DD or empty
  observacoes: string;
}

export interface MonthlyStats {
  mes: string;
  mesNumero: number;
  trimestre: string;
  totalDias: number;
  diasConcluidos: number;
  metaEsperada: number;
  valorGuardado: number;
  saldoRestante: number;
  percentual: number;
}

export interface QuarterStats {
  trimestre: string;
  totalDias: number;
  diasConcluidos: number;
  metaEsperada: number;
  valorGuardado: number;
  saldoRestante: number;
  percentual: number;
}

export interface DashboardMetrics {
  metaTotal: number;
  valorTotalGuardado: number;
  saldoRestante: number;
  progressoPercentual: number;
  depositosRealizados: number;
  totalDepositos: number;
}

export interface FilterState {
  mes: string;
  status: string;
  trimestre: string;
  search: string;
}

export interface LookerFormula {
  id: string;
  nome: string;
  descricao?: string;
  tipo: 'Métrica' | 'Dimensão';
  formula: string;
  explicacao: string;
  ondeUsar: string;
}
