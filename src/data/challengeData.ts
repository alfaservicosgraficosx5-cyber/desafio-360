import { DepositItem, MonthlyStats, QuarterStats, DashboardMetrics } from '../types/challenge';

export const MONTHS = [
  { nome: 'Janeiro', numero: 1, dias: 31, trimestre: '1º Trimestre' },
  { nome: 'Fevereiro', numero: 2, dias: 28, trimestre: '1º Trimestre' },
  { nome: 'Março', numero: 3, dias: 31, trimestre: '1º Trimestre' },
  { nome: 'Abril', numero: 4, dias: 30, trimestre: '2º Trimestre' },
  { nome: 'Maio', numero: 5, dias: 31, trimestre: '2º Trimestre' },
  { nome: 'Junho', numero: 6, dias: 30, trimestre: '2º Trimestre' },
  { nome: 'Julho', numero: 7, dias: 31, trimestre: '3º Trimestre' },
  { nome: 'Agosto', numero: 8, dias: 31, trimestre: '3º Trimestre' },
  { nome: 'Setembro', numero: 9, dias: 30, trimestre: '3º Trimestre' },
  { nome: 'Outubro', numero: 10, dias: 31, trimestre: '4º Trimestre' },
  { nome: 'Novembro', numero: 11, dias: 30, trimestre: '4º Trimestre' },
  { nome: 'Dezembro', numero: 12, dias: 31, trimestre: '4º Trimestre' },
];

export const TOTAL_GOAL = 30000.00;

/**
 * Generates 365 deposits whose values range between R$ 1.00 and R$ 500.00
 * and whose sum is EXACTLY R$ 30,000.00.
 */
export function generateDefaultDeposits(): DepositItem[] {
  const items: DepositItem[] = [];
  let currentNum = 1;

  // We distribute R$ 30,000 across 365 days.
  // Average is ~82.19. We create varied tiers:
  // - 100 days of light deposits: R$ 15 to R$ 45
  // - 150 days of medium deposits: R$ 50 to R$ 100
  // - 80 days of steady deposits: R$ 105 to R$ 180
  // - 35 days of milestone deposits: R$ 190 to R$ 480
  
  // Deterministic pseudo-random sequence with fixed seed for consistency
  let seed = 42;
  function pseudoRandom() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  const rawValues: number[] = [];
  for (let i = 0; i < 365; i++) {
    const r = pseudoRandom();
    let val: number;
    if (i < 90) {
      // Tier 1: R$ 15 to R$ 60
      val = 15 + Math.floor(r * 46);
    } else if (i < 220) {
      // Tier 2: R$ 50 to R$ 115
      val = 50 + Math.floor(r * 66);
    } else if (i < 315) {
      // Tier 3: R$ 90 to R$ 180
      val = 90 + Math.floor(r * 91);
    } else {
      // Tier 4: R$ 160 to R$ 450
      val = 160 + Math.floor(r * 291);
    }
    rawValues.push(val);
  }

  // Scale and calibrate to equal exactly 30,000.00
  const rawSum = rawValues.reduce((a, b) => a + b, 0);
  const factor = TOTAL_GOAL / rawSum;

  let currentTotal = 0;
  const roundedValues = rawValues.map((v, index) => {
    if (index === 364) return 0; // calculated last
    let scaled = Math.round(v * factor);
    // keep within boundaries [1, 500]
    scaled = Math.max(1, Math.min(500, scaled));
    currentTotal += scaled;
    return scaled;
  });

  // Assign the exact difference to the last element (adjusted if needed)
  let remainder = TOTAL_GOAL - currentTotal;
  if (remainder < 1 || remainder > 500) {
    // distribute remainder across multiple items
    let diff = remainder - 250;
    roundedValues[364] = 250;
    let idx = 0;
    while (diff !== 0 && idx < 364) {
      if (diff > 0 && roundedValues[idx] < 490) {
        const step = Math.min(diff, 10);
        roundedValues[idx] += step;
        diff -= step;
      } else if (diff < 0 && roundedValues[idx] > 20) {
        const step = Math.min(-diff, 10);
        roundedValues[idx] -= step;
        diff += step;
      }
      idx++;
    }
  } else {
    roundedValues[364] = remainder;
  }

  // Assign items to months
  for (const m of MONTHS) {
    for (let day = 1; day <= m.dias; day++) {
      const idx = currentNum - 1;
      const valor = roundedValues[idx];
      
      // Default sample progress: mark first ~78 deposits as completed (Jan & Feb + part of Mar)
      const isCompleted = currentNum <= 78;
      const dataDeposito = isCompleted 
        ? `2026-${String(m.numero).padStart(2, '0')}-${String(Math.min(day, 28)).padStart(2, '0')}`
        : '';
      
      let observacao = '';
      if (currentNum === 1) observacao = 'Início do Desafio 365!';
      else if (currentNum === 50) observacao = 'Marco de 50 depósitos alcançado';
      else if (valor >= 400) observacao = 'Depósito de aporte maior (milestone)';
      else if (currentNum === 78) observacao = 'Último depósito realizado';

      items.push({
        numero: currentNum,
        mes: m.nome,
        mesNumero: m.numero,
        trimestre: m.trimestre,
        valor: valor,
        status: isCompleted ? 'Concluído' : 'Pendente',
        dataDeposito: dataDeposito,
        observacoes: observacao,
      });

      currentNum++;
    }
  }

  return items;
}

const STORAGE_KEY = 'looker_365_challenge_deposits';

export function loadDeposits(): DepositItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === 365) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading deposits from localStorage:', e);
  }
  const defaultItems = generateDefaultDeposits();
  saveDeposits(defaultItems);
  return defaultItems;
}

export function saveDeposits(items: DepositItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving deposits to localStorage:', e);
  }
}

export function resetDeposits(): DepositItem[] {
  const fresh = generateDefaultDeposits();
  saveDeposits(fresh);
  return fresh;
}

export function calculateMetrics(items: DepositItem[]): DashboardMetrics {
  const metaTotal = TOTAL_GOAL;
  let valorTotalGuardado = 0;
  let depositosRealizados = 0;

  for (const item of items) {
    if (item.status === 'Concluído') {
      valorTotalGuardado += item.valor;
      depositosRealizados++;
    }
  }

  const saldoRestante = Math.max(0, metaTotal - valorTotalGuardado);
  const progressoPercentual = (valorTotalGuardado / metaTotal) * 100;

  return {
    metaTotal,
    valorTotalGuardado,
    saldoRestante,
    progressoPercentual,
    depositosRealizados,
    totalDepositos: items.length,
  };
}

export function calculateMonthlyStats(items: DepositItem[]): MonthlyStats[] {
  return MONTHS.map((m) => {
    const monthItems = items.filter((item) => item.mesNumero === m.numero);
    const totalDias = monthItems.length;
    const concluidos = monthItems.filter((i) => i.status === 'Concluído');
    const diasConcluidos = concluidos.length;
    
    const metaEsperada = monthItems.reduce((acc, curr) => acc + curr.valor, 0);
    const valorGuardado = concluidos.reduce((acc, curr) => acc + curr.valor, 0);
    const saldoRestante = Math.max(0, metaEsperada - valorGuardado);
    const percentual = metaEsperada > 0 ? (valorGuardado / metaEsperada) * 100 : 0;

    return {
      mes: m.nome,
      mesNumero: m.numero,
      trimestre: m.trimestre,
      totalDias,
      diasConcluidos,
      metaEsperada,
      valorGuardado,
      saldoRestante,
      percentual,
    };
  });
}

export function calculateQuarterStats(items: DepositItem[]): QuarterStats[] {
  const quarters = ['1º Trimestre', '2º Trimestre', '3º Trimestre', '4º Trimestre'];
  return quarters.map((t) => {
    const qItems = items.filter((i) => i.trimestre === t);
    const totalDias = qItems.length;
    const concluidos = qItems.filter((i) => i.status === 'Concluído');
    const diasConcluidos = concluidos.length;
    const metaEsperada = qItems.reduce((acc, curr) => acc + curr.valor, 0);
    const valorGuardado = concluidos.reduce((acc, curr) => acc + curr.valor, 0);
    const saldoRestante = Math.max(0, metaEsperada - valorGuardado);
    const percentual = metaEsperada > 0 ? (valorGuardado / metaEsperada) * 100 : 0;

    return {
      trimestre: t,
      totalDias,
      diasConcluidos,
      metaEsperada,
      valorGuardado,
      saldoRestante,
      percentual,
    };
  });
}

/**
 * Exports the 365 challenge to a CSV formatted for Google Sheets import
 */
export function exportToCSV(items: DepositItem[]): void {
  const headers = [
    'Nº',
    'Mês de Referência',
    'Trimestre',
    'Valor do Depósito',
    'Status',
    'Data do Depósito',
    'Observações',
  ];

  const rows = items.map((i) => [
    i.numero,
    `"${i.mes}"`,
    `"${i.trimestre}"`,
    i.valor.toFixed(2).replace('.', ','), // Brazilian currency decimal convention for Sheets
    `"${i.status}"`,
    i.dataDeposito ? `"${i.dataDeposito}"` : '""',
    `"${(i.observacoes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Desafio_365_Depositos_GoogleSheets.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copies the entire table formatted as TSV for pasting directly into Google Sheets (Ctrl+V)
 */
export async function copyToClipboardForSheets(items: DepositItem[]): Promise<boolean> {
  const headers = [
    'Nº',
    'Mês de Referência',
    'Trimestre',
    'Valor do Depósito',
    'Status',
    'Data do Depósito',
    'Observações',
  ];

  const rows = items.map((i) => [
    i.numero,
    i.mes,
    i.trimestre,
    i.valor.toFixed(2).replace('.', ','),
    i.status,
    i.dataDeposito,
    i.observacoes || '',
  ]);

  const tsvContent = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');

  try {
    await navigator.clipboard.writeText(tsvContent);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Formats a number to Brazilian Real (R$ 1.234,56)
 */
export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats percentage
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1).replace('.', ',')}%`;
}
