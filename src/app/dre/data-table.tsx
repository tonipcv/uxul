'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  RowSelectionState,
} from "@tanstack/react-table";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { TrashIcon } from "@heroicons/react/24/outline";
import React from "react";
import { useRouter } from "next/navigation";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [selectAll, setSelectAll] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Handle global selection across all pages
  React.useEffect(() => {
    if (selectAll) {
      const allRows: RowSelectionState = {};
      data.forEach((_, index) => {
        allRows[index] = true;
      });
      setRowSelection(allRows);
    } else if (Object.keys(rowSelection).length === data.length) {
      // If unselecting all
      setRowSelection({});
    }
  }, [selectAll, data]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      globalFilter,
      rowSelection,
    },
    enableRowSelection: true,
  });

  const handleDelete = async () => {
    const selectedIds = Object.keys(rowSelection).map(index => (data[parseInt(index)] as any).id);
    if (selectedIds.length === 0) return;

    try {
      setIsDeleting(true);
      const response = await fetch('/api/dre/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) throw new Error('Erro ao excluir registros');

      toast({
        title: "Sucesso!",
        description: `${selectedIds.length} registros excluídos com sucesso.`,
      });

      setRowSelection({});
      router.refresh();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir registros. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <Input
            placeholder="Buscar em todos os campos..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="max-w-sm bg-white"
          />
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectAll || Object.keys(rowSelection).length === data.length}
              onCheckedChange={(value) => {
                setSelectAll(!!value);
              }}
              aria-label="Selecionar todos os registros"
            />
            <span className="text-sm text-gray-500">
              Selecionar todos os registros
            </span>
          </div>
        </div>
        {table.getSelectedRowModel().rows.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2"
          >
            <TrashIcon className="h-4 w-4" />
            {isDeleting ? "Excluindo..." : `Excluir (${table.getSelectedRowModel().rows.length})`}
          </Button>
        )}
      </div>
      <div className="rounded-md border border-gray-200">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-gray-200">
                <TableHead className="w-[40px] text-xs font-medium text-gray-500 py-3">
                  <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (selectAll && table.getRowModel().rows.every(row => rowSelection[row.index]))}
                    onCheckedChange={(value) => {
                      table.toggleAllPageRowsSelected(!!value);
                      // If all pages are selected and we're unchecking, clear selectAll
                      if (selectAll && !value) {
                        setSelectAll(false);
                      }
                    }}
                    aria-label="Selecionar página atual"
                  />
                </TableHead>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-xs font-medium text-gray-500 py-3">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-gray-50/50 border-b border-gray-100 text-sm"
                >
                  <TableCell className="w-[40px] py-2">
                    <Checkbox
                      checked={row.getIsSelected()}
                      onCheckedChange={(value) => row.toggleSelected(!!value)}
                      aria-label="Selecionar linha"
                    />
                  </TableCell>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center text-sm text-gray-500"
                >
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between py-3">
        <div className="text-sm text-gray-500">
          {table.getSelectedRowModel().rows.length > 0 && (
            <span>{table.getSelectedRowModel().rows.length} registro(s) selecionado(s)</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="bg-white"
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="bg-white"
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
} 