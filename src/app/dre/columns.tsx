'use client';

import { ColumnDef } from "@tanstack/react-table";
import { FactEntry } from "@/types/fact-entry";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

// Função para formatar o período
function formatPeriod(value: string) {
  try {
    const [year, month] = value.split('-');
    return `${year}-${month.padStart(2, '0')}`;
  } catch {
    return value;
  }
}

// Função para atualizar o valor no banco de dados
async function updateFactEntry(id: number, field: string, value: string) {
  try {
    const response = await fetch(`/api/dre/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ [field]: value }),
    });

    if (!response.ok) {
      throw new Error('Falha ao atualizar o valor');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao atualizar:', error);
    throw error;
  }
}

// Componente de célula editável
function EditableCell({
  getValue,
  row,
  column,
  table
}: any) {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);

  const onBlur = async () => {
    setIsEditing(false);
    if (value === initialValue) return;

    try {
      await updateFactEntry(row.original.id, column.id, value);
      table.options.meta?.updateData(row.index, column.id, value);
    } catch (error) {
      setValue(initialValue);
      // Aqui você pode adicionar uma notificação de erro
    }
  };

  if (isEditing) {
    return (
      <Input
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={onBlur}
        onKeyDown={e => {
          if (e.key === "Enter") {
            onBlur();
          }
          if (e.key === "Escape") {
            setValue(initialValue);
            setIsEditing(false);
          }
        }}
        autoFocus
      />
    );
  }

  return (
    <div
      className="cursor-pointer p-2 -m-2 rounded hover:bg-gray-100"
      onDoubleClick={() => setIsEditing(true)}
    >
      {value}
    </div>
  );
}

export const columns: ColumnDef<FactEntry>[] = [
  {
    accessorKey: "period",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Período
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return <div className="font-medium">{formatPeriod(value)}</div>;
    }
  },
  {
    accessorKey: "version",
    header: "Versão",
    cell: EditableCell
  },
  {
    accessorKey: "scenario",
    header: "Cenário",
    cell: EditableCell
  },
  {
    accessorKey: "bu",
    header: "BU",
    cell: EditableCell
  },
  {
    accessorKey: "region",
    header: "Região",
    cell: EditableCell
  },
  {
    accessorKey: "channel",
    header: "Canal",
    cell: EditableCell
  },
  {
    accessorKey: "productSku",
    header: "SKU",
    cell: EditableCell
  },
  {
    accessorKey: "customer",
    header: "Cliente",
    cell: EditableCell
  },
  {
    accessorKey: "costCenterCode",
    header: "Centro de Custo",
    cell: EditableCell
  },
  {
    accessorKey: "glAccount",
    header: "Conta Contábil",
    cell: EditableCell
  },
  {
    accessorKey: "pnlLine",
    header: "Linha DRE",
    cell: EditableCell
  },
  {
    accessorKey: "value",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Valor
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ getValue }) => {
      const value = getValue() as number;
      return <div className="font-medium text-right">{formatCurrency(value)}</div>;
    }
  }
]; 