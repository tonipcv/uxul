'use client';

import React, { useState, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { PivotRequest, PivotResponse, AVAILABLE_DIMENSIONS, AVAILABLE_METRICS } from '@/types/pivot';
import { formatCurrency } from '@/lib/format';
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { usePivotData } from '@/hooks/usePivotData';
import { UseQueryResult } from '@tanstack/react-query';
import { Skeleton } from "@/components/ui/skeleton";

interface PivotTableProps {
  initialConfig?: Partial<PivotRequest>;
}

export function PivotTable({ initialConfig }: PivotTableProps) {
  const [config, setConfig] = useState<PivotRequest>({
    filters: {
      scenario: 'Base Case',
      version: ['Actual', 'Forecast'],
    },
    rows: ['pnlLine', 'customer', 'channel'],
    columns: ['version'],
    metrics: ['SUM(value)'],
    page: 1,
    pageSize: 100,
    ...initialConfig,
  });

  const { data, isLoading, error, isFetching } = usePivotData(config);

  // Gerar colunas dinamicamente
  const columns = React.useMemo<ColumnDef<Record<string, any>>[]>(() => {
    const cols: ColumnDef<Record<string, any>>[] = [];

    // Adicionar colunas de dimensões (rows)
    config.rows.forEach(row => {
      const dimension = AVAILABLE_DIMENSIONS.find(d => d.key === row);
      if (dimension) {
        cols.push({
          id: row,
          accessorKey: row,
          header: dimension.label,
          cell: info => info.getValue() || '-',
        });
      }
    });

    // Adicionar colunas de métricas
    if (config.columns.length === 0) {
      config.metrics.forEach(metric => {
        cols.push({
          id: metric,
          accessorKey: metric,
          header: AVAILABLE_METRICS.find(m => m.key === metric)?.label || metric,
          cell: info => {
            const value = info.getValue();
            return typeof value === 'number' ? formatCurrency(value) : '-';
          },
        });
      });
    } else if (data?.data) {
      // Adicionar colunas pivotadas
      const uniqueColumnValues = Array.from(new Set(data.data.map(row => row[config.columns[0]])));
      
      console.log('Frontend data sample:', {
        firstRow: data.data[0],
        availableColumns: Object.keys(data.data[0] || {})
      });

      uniqueColumnValues.forEach(colValue => {
        if (!colValue) {
          console.warn('Found null/undefined column value');
          return;
        }

        const columnKey = String(colValue);
        
        cols.push({
          id: columnKey,
          accessorFn: (row: Record<string, any>) => {
            const value = row[columnKey];
            // Garantir que undefined/null seja tratado como 0
            if (value === undefined || value === null) {
              return 0;
            }
            // Converter para número
            return typeof value === 'string' ? parseFloat(value) : value;
          },
          header: columnKey,
          cell: info => {
            const value = info.getValue() as number;
            return formatCurrency(value);
          },
        });
      });

      console.log('Generated columns:', cols.map(col => ({
        id: col.id,
        columnKey: col.id
      })));
    }

    return cols;
  }, [config, data]);

  // Adicionar log para dados da tabela
  React.useEffect(() => {
    if (data?.data) {
      console.log('Table data:', {
        columns,
        firstRow: data.data[0],
        rowCount: data.data.length
      });
    }
  }, [data, columns]);

  const table = useReactTable({
    data: data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: config.pageSize || 100,
      },
    },
    manualPagination: true,
    pageCount: Math.ceil((data?.metadata.total || 0) / (config.pageSize || 100)),
  });

  const handleDimensionChange = useCallback((value: string) => {
    setConfig(prev => ({
      ...prev,
      rows: [value, ...prev.rows.slice(1)],
      page: 1 // Reset para primeira página ao mudar dimensão
    }));
  }, []);

  const handleColumnChange = useCallback((value: string) => {
    setConfig(prev => ({
      ...prev,
      columns: [value],
      page: 1 // Reset para primeira página ao mudar coluna
    }));
  }, []);

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Erro ao carregar dados: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <Select
          value={config.rows[0]}
          onValueChange={handleDimensionChange}
          disabled={isLoading || isFetching}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Selecione a dimensão principal" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_DIMENSIONS.map(dim => (
              <SelectItem key={dim.key} value={dim.key}>
                {dim.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={config.columns[0]}
          onValueChange={handleColumnChange}
          disabled={isLoading || isFetching}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Selecione a dimensão de coluna" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_DIMENSIONS.map(dim => (
              <SelectItem key={dim.key} value={dim.key}>
                {dim.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading || isFetching ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      {columns.map((col, colIndex) => (
                        <TableCell key={colIndex}>
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      Nenhum resultado encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {data?.metadata.total || 0} registro(s)
          {data?.totals && (
            <span className="ml-2">
              · Total: {formatCurrency(data.totals.total_value)}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Registros por página</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
                setConfig(prev => ({ 
                  ...prev, 
                  pageSize: Number(value),
                  page: 1
                }));
              }}
              disabled={isLoading || isFetching}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[50, 100, 150].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => {
                table.setPageIndex(0);
                setConfig(prev => ({ ...prev, page: 1 }));
              }}
              disabled={!table.getCanPreviousPage() || isLoading || isFetching}
            >
              <span className="sr-only">Ir para primeira página</span>
              <ChevronLeftIcon className="h-4 w-4" />
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => {
                table.previousPage();
                setConfig(prev => ({ ...prev, page: prev.page! - 1 }));
              }}
              disabled={!table.getCanPreviousPage() || isLoading || isFetching}
            >
              <span className="sr-only">Ir para página anterior</span>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => {
                table.nextPage();
                setConfig(prev => ({ ...prev, page: prev.page! + 1 }));
              }}
              disabled={!table.getCanNextPage() || isLoading || isFetching}
            >
              <span className="sr-only">Ir para próxima página</span>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => {
                const lastPage = table.getPageCount();
                table.setPageIndex(lastPage - 1);
                setConfig(prev => ({ ...prev, page: lastPage }));
              }}
              disabled={!table.getCanNextPage() || isLoading || isFetching}
            >
              <span className="sr-only">Ir para última página</span>
              <ChevronRightIcon className="h-4 w-4" />
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 