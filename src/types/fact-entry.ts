export interface Product {
  sku: string;
  description?: string | null;
}

export interface CostCenter {
  code: string;
  description?: string | null;
}

export interface StandardColumn {
  key: string;
  label: string;
  description?: string;
  optional?: boolean;
}

export const STANDARD_COLUMNS: StandardColumn[] = [
  { key: 'period', label: 'Período', description: 'YYYY-MM format' },
  { key: 'version', label: 'Versão', description: 'Actual, Forecast, etc.' },
  { key: 'scenario', label: 'Cenário', description: 'Base Case, Stress Case, etc.' },
  { key: 'bu', label: 'Unidade de Negócio', description: 'Business Unit (e.g., Aesthetics)' },
  { key: 'region', label: 'Região', description: 'Geographic region' },
  { key: 'channel', label: 'Canal', description: 'Sales channel (e.g., Hospital)' },
  { key: 'productSku', label: 'SKU do Produto', description: 'Product code (e.g., NAB-001)' },
  { key: 'product.description', label: 'Descrição do Produto', description: 'Optional product details', optional: true },
  { key: 'customer', label: 'Cliente', description: 'Customer name (e.g., Drogasil)' },
  { key: 'costCenter.code', label: 'Centro de Custo', description: 'Cost center code (e.g., 510002)' },
  { key: 'costCenter.description', label: 'Descrição do Centro de Custo', description: 'Optional cost center details', optional: true },
  { key: 'glAccount', label: 'Conta Contábil', description: 'Full GL account (e.g., 610000 – Net Revenue)' },
  { key: 'pnlLine', label: 'Linha DRE', description: 'P&L line type (e.g., Net Revenue)' },
  { key: 'value', label: 'Valor', description: 'Numeric value in BRL (using . as decimal separator)' }
];

export interface FactEntry {
  id: number;
  version: string;
  value: number;
  period: string;
  scenario: string;
  bu: string;
  region: string;
  channel: string;
  productSku: string;
  customer: string;
  costCenterCode: string;
  glAccount: string;
  pnlLine: string;
  createdAt: Date;
  updatedAt: Date;
  importedAt: Date;
  costCenter?: {
    code: string;
    description: string | null;
  };
  product?: {
    sku: string;
    description: string | null;
  };
} 