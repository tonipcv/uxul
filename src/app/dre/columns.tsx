'use client';

import { ColumnDef } from "@tanstack/react-table";
import { FactEntry, STANDARD_COLUMNS } from "@/types/fact-entry";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatPeriod = (value: string) => {
  try {
    const [year, month] = value.split('-');
    return `${year}-${month}`;
  } catch {
    return value;
  }
};

export const columns: ColumnDef<FactEntry>[] = STANDARD_COLUMNS.map(column => ({
  accessorKey: column.key,
  header: column.label,
  cell: ({ row }) => {
    // Handle nested fields
    if (column.key === 'costCenter.code') {
      return <div>{row.original.costCenter?.code || row.original.costCenterCode}</div>;
    }
    if (column.key === 'costCenter.description') {
      return <div>{row.original.costCenter?.description || '-'}</div>;
    }
    if (column.key === 'product.description') {
      return <div>{row.original.product?.description || '-'}</div>;
    }

    const value = row.getValue(column.key);

    // Handle special formatting cases
    if (column.key === 'period') {
      return <div className="font-medium">{formatPeriod(value as string)}</div>;
    }
    
    if (column.key === 'value') {
      return <div className="font-medium text-right">{formatCurrency(value as number)}</div>;
    }

    if (column.optional && !value) {
      return <div className="text-gray-500">-</div>;
    }

    return <div>{value}</div>;
  }
})); 