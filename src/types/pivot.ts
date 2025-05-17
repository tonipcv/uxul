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

export const AVAILABLE_METRICS = [
  { key: 'SUM(value)', label: 'Soma', type: 'number' },
  { key: 'AVG(value)', label: 'Média', type: 'number' },
  { key: 'COUNT(*)', label: 'Contagem', type: 'number' },
]; 