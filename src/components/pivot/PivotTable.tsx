'use client';

import { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { PivotRequest } from '@/types/pivot';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

interface PivotTableProps {
  initialConfig: PivotRequest;
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

export function PivotTable({ initialConfig }: PivotTableProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/pivot/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(initialConfig)
        });

        if (!response.ok) {
          throw new Error('Falha ao carregar dados');
        }

        const result = await response.json();
        if (!result.data || !Array.isArray(result.data)) {
          throw new Error('Formato de dados inválido');
        }

        // Transformar os dados para o formato de pivot
        const pivotData = transformData(result.data, initialConfig);
        setData(pivotData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [initialConfig]);

  const transformData = (rawData: any[], config: PivotRequest) => {
    // Primeiro, vamos agrupar por dimensão principal (primeira dimensão em rows)
    const mainDimension = config.rows[0];
    const groups = new Map();

    // Agrupar os dados
    rawData.forEach(row => {
      const mainValue = row[mainDimension];
      if (!groups.has(mainValue)) {
        groups.set(mainValue, {
          [mainDimension]: mainValue,
          details: [],
          ...config.columns.reduce((acc, col) => ({
            ...acc,
            [col]: 0
          }), {})
        });
      }
      
      const group = groups.get(mainValue);
      group.details.push(row);
      
      // Somar valores para as colunas
      config.columns.forEach(col => {
        if (typeof row[col] === 'number') {
          group[col] = (group[col] || 0) + row[col];
        }
      });
    });

    // Converter o Map em array
    return Array.from(groups.values());
  };

  const numberTemplate = (rowData: any, col: { field: string }) => {
    const value = rowData[col.field];
    return typeof value === 'number' ? currencyFormatter(value) : value;
  };

  const rowExpansionTemplate = (data: any) => {
    if (!data.details || !data.details.length) {
      return <div className="p-3">Nenhum detalhe disponível</div>;
    }

    // Determinar as colunas para os detalhes
    const detailColumns = Object.keys(data.details[0])
      .filter(key => !initialConfig.rows.includes(key) || key === initialConfig.rows[0]);

    return (
      <div className="p-3">
        <DataTable value={data.details} className="p-datatable-sm">
          {detailColumns.map(col => (
            <Column
              key={col}
              field={col}
              header={getHeaderName(col)}
              body={typeof data.details[0][col] === 'number' ? numberTemplate : undefined}
              sortable
            />
          ))}
        </DataTable>
      </div>
    );
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
      <DataTable
        value={data}
        expandedRows={expandedRows}
        onRowToggle={(e) => setExpandedRows(e.data)}
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
            header={getHeaderName(field)}
            body={typeof data[0][field] === 'number' ? numberTemplate : undefined}
            sortable
          />
        ))}
      </DataTable>
    </div>
  );
} 