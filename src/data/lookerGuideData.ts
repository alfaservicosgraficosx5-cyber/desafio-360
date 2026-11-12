import { LookerFormula } from '../types/challenge';

export const LOOKER_FORMULAS: LookerFormula[] = [
  {
    id: 'valor_guardado',
    nome: 'Valor Total Guardado',
    tipo: 'Métrica',
    formula: 'CASE \n  WHEN Status = "Concluído" THEN Valor do Depósito \n  ELSE 0 \nEND',
    explicacao: 'Soma apenas os valores cujo status é "Concluído". No Looker Studio, configure a agregação padrão deste campo como "SOMA" (SUM).',
    ondeUsar: 'Scorecard "Valor Total Guardado", Eixo Y do Gráfico de Colunas Comparativo e Tabela Mensal.',
  },
  {
    id: 'saldo_restante',
    nome: 'Saldo Restante',
    tipo: 'Métrica',
    formula: '30000 - SUM(CASE WHEN Status = "Concluído" THEN Valor do Depósito ELSE 0 END)',
    explicacao: 'Calcula o valor que ainda falta para atingir a meta total de R$ 30.000,00. Pode ser criado diretamente como métrica calculada no scorecard.',
    ondeUsar: 'Scorecard "Saldo Restante" no topo do relatório.',
  },
  {
    id: 'progresso_percentual',
    nome: 'Progresso (%)',
    tipo: 'Métrica',
    formula: 'SUM(CASE WHEN Status = "Concluído" THEN Valor do Depósito ELSE 0 END) / 30000',
    explicacao: 'Calcula a porcentagem da meta de R$ 30.000,00 alcançada. No Looker Studio, altere o tipo de dado para "Numérico > Percentual".',
    ondeUsar: 'Scorecard de Progresso (%) e barra de progresso visual.',
  },
  {
    id: 'depositos_realizados',
    nome: 'Depósitos Realizados (Qtd)',
    tipo: 'Métrica',
    formula: 'COUNT(CASE WHEN Status = "Concluído" THEN Nº ELSE NULL END)',
    explicacao: 'Conta quantos depósitos individuais já foram concluídos dos 365 dias do desafio.',
    ondeUsar: 'Scorecard "Depósitos Realizados" (exibe X de 365).',
  },
  {
    id: 'mes_ordem',
    nome: 'Mês Ordem (Ordenação Cronológica)',
    tipo: 'Dimensão',
    formula: `CASE Mês de Referência
  WHEN "Janeiro" THEN 1
  WHEN "Fevereiro" THEN 2
  WHEN "Março" THEN 3
  WHEN "Abril" THEN 4
  WHEN "Maio" THEN 5
  WHEN "Junho" THEN 6
  WHEN "Julho" THEN 7
  WHEN "Agosto" THEN 8
  WHEN "Setembro" THEN 9
  WHEN "Outubro" THEN 10
  WHEN "Novembro" THEN 11
  WHEN "Dezembro" THEN 12
  ELSE 13
END`,
    explicacao: 'ESSENCIAL: Sem esse campo, o Looker Studio ordena os meses em ordem alfabética (Abril, Agosto, Dezembro...). Use este campo no parâmetro "Classificar por" (Sort) em ordem crescente.',
    ondeUsar: 'Classificação do Gráfico de Colunas Mensal e da Tabela de Detalhamento Mensal.',
  },
  {
    id: 'saldo_mes',
    nome: 'Saldo Pendente do Mês',
    tipo: 'Métrica',
    formula: 'SUM(Valor do Depósito) - SUM(CASE WHEN Status = "Concluído" THEN Valor do Depósito ELSE 0 END)',
    explicacao: 'Mostra o quanto ainda falta pagar no mês corrente ou selecionado.',
    ondeUsar: 'Tabela de Detalhamento Mensal (coluna Saldo do Mês).',
  },
  {
    id: 'atingimento_mes_pct',
    nome: 'Atingimento do Mês (%)',
    tipo: 'Métrica',
    formula: 'SUM(CASE WHEN Status = "Concluído" THEN Valor do Depósito ELSE 0 END) / SUM(Valor do Depósito)',
    explicacao: 'Percentual de cumprimento da meta do mês específico. No Looker Studio, configure como formato "Percentual".',
    ondeUsar: 'Tabela de Detalhamento Mensal com barra de dados colorida.',
  },
];

export interface SetupStep {
  numero: number;
  titulo: string;
  subtitulo: string;
  detalhes: string[];
  dicaEngenharia: string;
}

export const LOOKER_STEPS: SetupStep[] = [
  {
    numero: 1,
    titulo: 'Estruturar o Google Sheets',
    subtitulo: 'Padronização de tipos de dados e nomes de colunas',
    detalhes: [
      'Crie ou utilize uma planilha com uma aba chamada "Desafio 365".',
      'Certifique-se de que a linha 1 contenha os cabeçalhos exatos: Nº, Mês de Referência, Trimestre, Valor do Depósito, Status, Data do Depósito, Observações.',
      'Na coluna "Valor do Depósito", selecione toda a coluna e formate como Moeda: Formatar > Número > Moeda (R$). Não digite "R$" manualmente na célula.',
      'Na coluna "Status", crie uma validação de lista suspensa: Dados > Validação de dados > Regras > Lista de itens: "Concluído, Pendente".',
      'Na coluna "Data do Depósito", formate como Data: Formatar > Número > Data.',
    ],
    dicaEngenharia: 'Garantir que os números não contenham texto (como "R$" digitado à mão) evita que o Looker Studio interprete a coluna como Texto em vez de Numérico/Moeda.',
  },
  {
    numero: 2,
    titulo: 'Conectar ao Google Looker Studio',
    subtitulo: 'Criação do relatório e mapeamento da fonte de dados',
    detalhes: [
      'Acesse lookerstudio.google.com e clique em "Criar" > "Relatório".',
      'Na tela "Adicionar dados ao relatório", selecione o conector "Google Planilhas".',
      'Selecione sua planilha e a aba correspondente.',
      'Mantenha marcadas as opções "Usar a primeira linha como cabeçalho" e "Incluir células ocultas e filtradas".',
      'Clique em "Adicionar" no canto inferior direito.',
    ],
    dicaEngenharia: 'Após adicionar, clique em "Editar fonte de dados" e confirme os tipos semânticos: "Valor do Depósito" como Numérico > Moeda > BRL (R$), "Data do Depósito" como Data (AAAA-MM-DD), e "Nº" como Numérico.',
  },
  {
    numero: 3,
    titulo: 'Criar os Campos Calculados',
    subtitulo: 'Lógica matemática de agregação e ordenação',
    detalhes: [
      'No painel direito do Looker Studio (Dados), clique em "+ Adicionar campo".',
      'Crie o campo "Valor Guardado" com a fórmula CASE WHEN Status = "Concluído" THEN Valor do Depósito ELSE 0 END.',
      'Crie o campo "Mês Ordem" para garantir que Janeiro venha antes de Fevereiro nos gráficos.',
      'Crie os campos de Saldo e Percentual conforme as fórmulas disponibilizadas abaixo.',
      'Clique em "Salvar" e "Concluído" em cada campo.',
    ],
    dicaEngenharia: 'O Looker Studio processa a cláusula CASE em nível de linha antes da agregação. Portanto, definir o tipo de agregação padrão como "SOMA" no campo "Valor Guardado" garante performance máxima.',
  },
  {
    numero: 4,
    titulo: 'Adicionar os 5 Scorecards (Visão Geral)',
    subtitulo: 'Indicadores chave de desempenho (KPIs) no topo',
    detalhes: [
      'Clique em "Adicionar um gráfico" > "Visão Geral" (Scorecard).',
      'Scorecard 1 (Meta Total): Crie um campo com valor fixo 30000 ou adicione métrica "Valor do Depósito" com agregação SOMA e renomeie para "Meta Total (R$ 30.000,00)".',
      'Scorecard 2 (Valor Total Guardado): Métrica = "Valor Guardado", Agregação = SOMA. No estilo, defina a cor do texto como Verde (#10B981).',
      'Scorecard 3 (Saldo Restante): Métrica = "Saldo Restante" ou campo calculado (30000 - SUM(Valor Guardado)). Cor = Azul Escuro / Cinza Neutro.',
      'Scorecard 4 (Progresso %): Métrica = "Progresso (%)", Formato Numérico = Percentual (1 casa decimal).',
      'Scorecard 5 (Depósitos Realizados): Métrica = "Depósitos Realizados", Agregação = SOMA. Pode adicionar subtítulo textual "de 365 dias".',
    ],
    dicaEngenharia: 'Agrupe os 5 cartões horizontalmente com altura uniforme (ex: 80px a 95px) e fundo branco com borda sutil (#E2E8F0) para o padrão executivo.',
  },
  {
    numero: 5,
    titulo: 'Configurar o Gráfico Comparativo Mensal',
    subtitulo: 'Barras / Colunas: Meta do Mês vs. Valor Guardado',
    detalhes: [
      'Clique em "Adicionar um gráfico" > "Gráfico de colunas".',
      'Dimensão: "Mês de Referência".',
      'Métrica 1: "Valor do Depósito" (Renomeie no gráfico para "Meta do Mês").',
      'Métrica 2: "Valor Guardado" (Renomeie no gráfico para "Valor Guardado").',
      'Classificar por: "Mês Ordem" em ordem "Crescente" (evita bagunça alfabética).',
      'Na aba Estilo: Série 1 (Meta) com tom neutro (#64748B ou #94A3B8) e Série 2 (Guardado) com verde vibrante (#10B981). Ative "Mostrar rótulos de dados".',
    ],
    dicaEngenharia: 'Definir barras agrupadas (lado a lado) permite enxergar instantaneamente os meses em que você superou ou ficou abaixo da meta.',
  },
  {
    numero: 6,
    titulo: 'Configurar Gráfico de Rosca (Donut)',
    subtitulo: 'Distribuição da contagem de depósitos (Concluído vs Pendente)',
    detalhes: [
      'Clique em "Adicionar um gráfico" > "Gráfico de pizza / rosca".',
      'Dimensão: "Status".',
      'Métrica: "Record Count" (Contagem de registros).',
      'Na aba Estilo: Defina o orifício central como 50% ou 60% (estilo donut moderno).',
      'Gerenciamento de cores por dimensão: Associe "Concluído" a #10B981 (Verde) e "Pendente" a #CBD5E1 (Cinza Neutro).',
    ],
    dicaEngenharia: 'Evite cores automáticas aleatórias. Fixar "Concluído" em verde e "Pendente" em cinza torna a leitura intuitiva em qualquer dispositivo.',
  },
  {
    numero: 7,
    titulo: 'Montar a Tabela Mensal com Barras de Progresso',
    subtitulo: 'Detalhamento analítico por mês e trimestre',
    detalhes: [
      'Clique em "Adicionar um gráfico" > "Tabela com barras".',
      'Dimensões: "Mês de Referência" e "Trimestre".',
      'Métricas: "Nº" (Contagem = 30 ou 31 dias), "Valor do Depósito" (Meta SOMA), "Valor Guardado" (SOMA), "Saldo Pendente do Mês" e "Atingimento do Mês (%)".',
      'Na aba Estilo da métrica %: altere a exibição para "Barras" com cor verde.',
      'Ative a linha de resumo com o Total geral no rodapé da tabela.',
    ],
    dicaEngenharia: 'A tabela detalhada responde instantaneamente aos filtros de Mês e Trimestre, permitindo auditoria rápida de qualquer período.',
  },
  {
    numero: 8,
    titulo: 'Adicionar Controles de Filtros Interativos',
    subtitulo: 'Listas suspensas para celular e PC',
    detalhes: [
      'Clique em "Adicionar um controle" > "Lista suspensa".',
      'Filtro 1: Campo de controle = "Mês de Referência".',
      'Filtro 2: Campo de controle = "Status" ("Concluído" / "Pendente").',
      'Filtro 3 (Opcional recomendado): Campo de controle = "Trimestre".',
      'Posicione os filtros em uma barra horizontal abaixo do título do relatório.',
    ],
    dicaEngenharia: 'Nas propriedades do relatório, configure para aplicar filtros em nível de página para que todos os 5 scorecards e 3 gráficos reajam juntos.',
  },
];
