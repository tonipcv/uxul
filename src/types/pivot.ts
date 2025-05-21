export interface PivotRequest {
  filters?: {
    scenario?: string;
    version?: string[];
    period?: string[];
    bu?: string[];
  };
  rows: string[];
  columns: string[];
  metrics: string[];
  sortBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  page?: number;
  pageSize?: number;
}

export interface PivotResponse {
  data: Record<string, any>[];
  totals: Record<string, number>;
  metadata: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface PivotDimension {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date';
  format?: (value: any) => string;
}

export const AVAILABLE_DIMENSIONS: PivotDimension[] = [
  { key: 'pnlLine', label: 'Linha DRE', type: 'string' },
  { key: 'customer', label: 'Cliente', type: 'string' },
  { key: 'channel', label: 'Canal', type: 'string' },
  { key: 'productSku', label: 'SKU do Produto', type: 'string' },
  { key: 'version', label: 'Versão', type: 'string' },
  { key: 'period', label: 'Período', type: 'string' },
  { key: 'bu', label: 'Unidade de Negócio', type: 'string' },
  { key: 'region', label: 'Região', type: 'string' },
  { key: 'costCenterCode', label: 'Centro de Custo', type: 'string' },
  { key: 'glAccount', label: 'Conta Contábil', type: 'string' },
];

export interface BaseMetric {
  key: string;
  label: string;
  type: string;
  format?: string;
  description?: string;
}

export interface DerivedMetric extends BaseMetric {
  type: 'number';
  calculation: string;
}

export const DERIVED_METRICS: DerivedMetric[] = [
  {
    key: 'VAR_ABS(actual,forecast)',
    label: 'Variação Absoluta',
    type: 'number',
    calculation: 'actual - forecast',
    description: 'Diferença entre valor realizado e previsto'
  },
  {
    key: 'VAR_PCT(actual,forecast)',
    label: 'Variação %',
    type: 'number',
    calculation: '(actual - forecast) / NULLIF(forecast,0)',
    format: 'percentage',
    description: 'Variação percentual entre realizado e previsto'
  },
  {
    key: 'GM_PCT(revenue,cogs)',
    label: 'Margem Bruta %',
    type: 'number',
    calculation: '(revenue - cogs) / NULLIF(revenue,0)',
    format: 'percentage',
    description: 'Margem bruta como percentual da receita'
  },
  {
    key: 'EBITDA_PCT(ebitda,revenue)',
    label: 'Margem EBITDA %',
    type: 'number',
    calculation: 'ebitda / NULLIF(revenue,0)',
    format: 'percentage',
    description: 'Margem EBITDA como percentual da receita'
  },
  {
    key: 'YOY_PCT(current_year,previous_year)',
    label: 'Crescimento YoY %',
    type: 'number',
    calculation: '(current_year - previous_year) / NULLIF(previous_year,0)',
    format: 'percentage',
    description: 'Crescimento ano contra ano'
  }
];

export const AVAILABLE_METRICS: BaseMetric[] = [
  { 
    key: 'SUM(value)', 
    label: 'Valor', 
    type: 'number', 
    format: 'currency',
    description: 'Soma dos valores no período'
  },
  { 
    key: 'AVG(value)', 
    label: 'Média', 
    type: 'number', 
    format: 'currency',
    description: 'Média dos valores no período'
  },
  { 
    key: 'COUNT(*)', 
    label: 'Contagem', 
    type: 'number',
    description: 'Número de registros'
  },
  ...DERIVED_METRICS
]; 