'use client';

import { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { PivotRequest, PivotResponse, DERIVED_METRICS, AVAILABLE_METRICS } from '@/types/pivot';
import { Tooltip } from 'primereact/tooltip';
import { Button } from 'primereact/button';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';

interface PivotTableProps {
  initialConfig: PivotRequest;
  onDrillDown?: (dimension: string, value: string) => void;
}

const currencyFormatter = (value: number | null) => {
  if (value == null) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value);
};

const getHeaderName = (field: string): string => {
  const headerMap: Record<string, string> = {
    pnlLine: 'Linha DRE',
    customer: 'Cliente',
    bu: 'Unidade de Negócio',
    region: 'Região',
    channel: 'Canal',
    productSku: 'Produto',
    costCenterCode: 'Centro de Custo',
    glAccount: 'Conta Contábil',
    Actual: 'Atual',
    Forecast: 'Previsão'
  };
  return headerMap[field] || field;
};

// Formatadores para diferentes tipos de valores
const formatters = {
  currency: new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }),
  percentage: new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }),
  number: new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
};

// Helper para determinar o formato baseado na métrica
const getMetricFormat = (field: string) => {
  const metric = [...AVAILABLE_METRICS, ...DERIVED_METRICS].find(m => m.key === field);
  return metric?.format || 'number';
};

// Helper para obter a descrição da métrica
const getMetricDescription = (field: string) => {
  const metric = [...AVAILABLE_METRICS, ...DERIVED_METRICS].find(m => m.key === field);
  return metric?.description || '';
};

// Configurações de alertas
const ALERT_THRESHOLDS = {
  VAR_PCT: -0.05, // -5%
  YOY_PCT: -0.10, // -10%
  GM_PCT: 0.30,   // 30%
  EBITDA_PCT: 0.15 // 15%
};

interface SnapshotDialogProps {
  visible: boolean;
  onHide: () => void;
  onSave: (name: string, description?: string) => void;
}

const SnapshotDialog = ({ visible, onHide, onSave }: SnapshotDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    onSave(name, description);
    setName('');
    setDescription('');
    onHide();
  };

  return (
    <Dialog
      header="Salvar Snapshot"
      visible={visible}
      onHide={onHide}
      modal
      style={{ width: '50vw' }}
      footer={
        <div>
          <Button
            label="Cancelar"
            icon="pi pi-times"
            onClick={onHide}
            className="p-button-text"
          />
          <Button
            label="Salvar"
            icon="pi pi-check"
            onClick={handleSave}
            disabled={!name}
          />
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="name">Nome *</label>
          <InputText
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="description">Descrição</label>
          <InputTextarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
      </div>
    </Dialog>
  );
};

export function PivotTable({ initialConfig, onDrillDown }: PivotTableProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [metadata, setMetadata] = useState<{ page: number; pageSize: number; total: number } | null>(null);
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const toast = useRef<Toast>(null);
  const [snapshotDialogVisible, setSnapshotDialogVisible] = useState(false);

  // Função para verificar alertas
  const checkAlerts = (newData: any[]) => {
    newData.forEach(row => {
      Object.entries(row).forEach(([field, value]) => {
        if (typeof value === 'number') {
          const metric = DERIVED_METRICS.find(m => m.key === field);
          if (metric) {
            const threshold = ALERT_THRESHOLDS[metric.key.split('(')[0] as keyof typeof ALERT_THRESHOLDS];
            if (threshold !== undefined) {
              if (
                (metric.key.includes('VAR_') || metric.key.includes('YOY_')) && value < threshold ||
                (metric.key.includes('GM_') || metric.key.includes('EBITDA_')) && value < threshold
              ) {
                toast.current?.show({
                  severity: 'warn',
                  summary: 'Alerta de Variação',
                  detail: `${metric.label} em ${getHeaderName(row.pnlLine || '')}: ${formatters.percentage.format(value)}`,
                  life: 5000
                });
              }
            }
          }
        }
      });
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Validate initial config
        if (!initialConfig.rows?.length || !initialConfig.metrics?.length) {
          throw new Error('Invalid configuration: rows and metrics are required');
        }

        const response = await fetch('/api/pivot/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(initialConfig)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to fetch pivot data: ${response.status}`);
        }

        const result: PivotResponse = await response.json();
        
        if (!result.data || !Array.isArray(result.data)) {
          throw new Error('Invalid data format received from server');
        }

        setData(result.data);
        setTotals(result.totals);
        setMetadata(result.metadata);
        
        // Check alerts after loading new data
        checkAlerts(result.data);
      } catch (err) {
        console.error('Error fetching pivot data:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        if (toast.current) {
          toast.current.show({
            severity: 'error',
            summary: 'Error',
            detail: err instanceof Error ? err.message : 'Failed to load pivot data',
            life: 5000
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [initialConfig]);

  const transformData = (rawData: any[], config: PivotRequest) => {
    if (!rawData.length) return [];
    
    // If there are no columns to pivot, return the raw data
    if (!config.columns.length) {
      return rawData;
    }

    // Group by rows dimensions
    const groupedData = rawData.reduce((acc, row) => {
      const groupKey = config.rows.map(r => row[r]).join('|');
      if (!acc.has(groupKey)) {
        const groupRow = config.rows.reduce((obj, key) => ({
          ...obj,
          [key]: row[key]
        }), {});
        acc.set(groupKey, { ...groupRow, details: [] });
      }
      acc.get(groupKey).details.push(row);
      return acc;
    }, new Map());

    return Array.from(groupedData.values());
  };

  const numberTemplate = (rowData: any, col: { field: string }) => {
    const value = rowData[col.field];
    if (typeof value !== 'number' || isNaN(value)) return '-';

    const format = getMetricFormat(col.field);
    const formatted = formatters[format].format(format === 'percentage' ? value : value);
    
    // Aplicar cores baseadas no tipo de métrica e valor
    let className = '';
    if (col.field.includes('VAR_') || col.field.includes('YOY_')) {
      className = value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : '';
    }

    return <span className={className}>{formatted}</span>;
  };

  const rowExpansionTemplate = (data: any) => {
    if (!data.details || !data.details.length) {
      return <div className="p-3">Nenhum detalhe disponível</div>;
    }

    // Determinar as colunas para os detalhes
    const detailColumns = ['period', 'version', 'value', 'scenario', 'bu'];

    return (
      <div className="p-3">
        <h4 className="mb-3 text-lg font-semibold">Detalhes</h4>
        <DataTable 
          value={data.details} 
          className="p-datatable-sm"
          showGridlines
          stripedRows
          scrollable
          scrollHeight="300px"
        >
          {detailColumns.map(col => (
            <Column
              key={col}
              field={col}
              header={getHeaderName(col)}
              body={col === 'value' ? numberTemplate : undefined}
              sortable
            />
          ))}
        </DataTable>
      </div>
    );
  };

  // Função para exportar dados
  const exportData = async (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const csvData = Papa.unparse(data);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `pivot_export_${new Date().toISOString()}.csv`);
    }
    // TODO: Implementar exportação PDF
  };

  // Template para células clicáveis (drill-down)
  const drillDownTemplate = (rowData: any, col: { field: string }) => {
    const value = rowData[col.field];
    
    if (onDrillDown && AVAILABLE_METRICS.some(m => m.key === col.field)) {
      return (
        <Button
          className="p-button-text p-button-plain"
          onClick={() => onDrillDown(col.field, value)}
        >
          {value}
        </Button>
      );
    }
    
    return value;
  };

  const saveSnapshot = async (name: string, description?: string) => {
    try {
      const response = await fetch('/api/pivot/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          config: initialConfig,
          data,
          totals: {}, // TODO: Implementar totais
          metadata: {
            createdBy: 'current-user', // TODO: Implementar autenticação
            createdAt: new Date().toISOString(),
            tags: ['pivot']
          }
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar snapshot');
      }

      toast.current?.show({
        severity: 'success',
        summary: 'Snapshot Salvo',
        detail: 'O snapshot foi salvo com sucesso',
        life: 3000
      });
    } catch (error) {
      console.error('Erro ao salvar snapshot:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Erro',
        detail: 'Falha ao salvar o snapshot',
        life: 5000
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow">
        <p>Nenhum dado encontrado.</p>
      </div>
    );
  }

  // Determinar as colunas principais
  const mainColumns = Object.keys(data[0])
    .filter(key => key !== 'details');

  return (
    <div className="card">
      <Toast ref={toast} position="top-right" />
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Resultados</h3>
        <div className="flex gap-2">
          <Button
            icon="pi pi-camera"
            label="Snapshot"
            className="p-button-outlined"
            onClick={() => setSnapshotDialogVisible(true)}
          />
          <Button
            icon="pi pi-file"
            label="CSV"
            className="p-button-outlined"
            onClick={() => exportData('csv')}
          />
          <Button
            icon="pi pi-file-pdf"
            label="PDF"
            className="p-button-outlined"
            onClick={() => exportData('pdf')}
          />
        </div>
      </div>

      <DataTable
        value={data}
        expandedRows={expandedRows}
        onRowToggle={(e) => setExpandedRows(e.data)}
        selectionMode="single"
        selection={selectedRow}
        onSelectionChange={(e) => setSelectedRow(e.value)}
        rowExpansionTemplate={rowExpansionTemplate}
        className="p-datatable-gridlines"
        showGridlines
        stripedRows
        removableSort
        resizableColumns
        scrollable
        scrollHeight="500px"
      >
        <Column expander style={{ width: '3em' }} />
        {mainColumns.map(field => (
          <Column
            key={field}
            field={field}
            header={
              <div className="flex items-center gap-2">
                {getHeaderName(field)}
                {getMetricDescription(field) && (
                  <i 
                    className="pi pi-info-circle cursor-help text-gray-400"
                    data-pr-tooltip={getMetricDescription(field)}
                  />
                )}
              </div>
            }
            body={
              typeof data[0][field] === 'number' 
                ? numberTemplate 
                : (rowData: any) => drillDownTemplate(rowData, { field })
            }
            sortable
          />
        ))}
      </DataTable>
      <Tooltip target=".cursor-help" />

      <SnapshotDialog
        visible={snapshotDialogVisible}
        onHide={() => setSnapshotDialogVisible(false)}
        onSave={saveSnapshot}
      />
    </div>
  );
} 