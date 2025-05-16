'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusIcon, ArrowUpTrayIcon, XMarkIcon, DocumentIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STANDARD_COLUMNS } from "@/types/fact-entry";
import Link from "next/link";

interface ImportData {
  period: string;
  version: string;
  scenario: string;
  bu: string;
  region: string;
  channel: string;
  productSku: string;
  customer: string;
  'costCenter.code': string;
  'costCenter.description'?: string;
  'product.description'?: string;
  glAccount: string;
  pnlLine: string;
  value: string;
}

interface ColumnMapping {
  [key: string]: string;
}

export function CreateModal() {
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ImportData[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [rawData, setRawData] = useState<any[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      period: formData.get('period'),
      version: formData.get('version'),
      scenario: formData.get('scenario'),
      bu: formData.get('bu'),
      region: formData.get('region'),
      channel: formData.get('channel'),
      productSku: formData.get('productSku'),
      customer: formData.get('customer'),
      costCenter: {
        code: formData.get('costCenter.code'),
        description: formData.get('costCenter.description')
      },
      product: {
        description: formData.get('product.description')
      },
      glAccount: formData.get('glAccount'),
      pnlLine: formData.get('pnlLine'),
      value: parseFloat(formData.get('value') as string),
    };

    try {
      const response = await fetch('/api/dre', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Erro ao criar registro');

      toast({
        title: "Sucesso!",
        description: "Registro criado com sucesso.",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar registro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsProcessing(true);
    setFileColumns([]);
    setColumnMapping({});
    setPreviewData([]);
    const fileType = file.name.split('.').pop()?.toLowerCase();

    try {
      let data: any[] = [];
      let headers: string[] = [];

      if (fileType === 'csv') {
        const text = await file.text();
        const rows = text.split('\n');
        headers = rows[0].split(',').map(h => h.trim());
        
        data = rows.slice(1)
          .filter(row => row.trim())
          .map(row => {
            const values = row.split(',');
            return headers.reduce((obj: any, header, index) => {
              obj[header] = values[index]?.trim() || '';
              return obj;
            }, {});
          });
      } else if (fileType === 'xlsx' || fileType === 'xls') {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json(worksheet);
        
        if (data.length > 0) {
          headers = Object.keys(data[0]);
        }
      } else {
        throw new Error('Formato de arquivo não suportado');
      }

      setFileColumns(headers);
      setRawData(data);

      // Initialize column mapping with best guesses based on similar names
      const initialMapping: ColumnMapping = {};
      STANDARD_COLUMNS.forEach((column) => {
        const bestMatch = headers.find(h => 
          h.toLowerCase().includes(column.key.toLowerCase()) ||
          column.key.toLowerCase().includes(h.toLowerCase())
        );
        if (bestMatch) {
          initialMapping[column.key] = bestMatch;
        }
      });
      setColumnMapping(initialMapping);

    } catch (error) {
      console.error('Erro ao ler arquivo:', error);
      toast({
        title: "Erro",
        description: "Erro ao ler arquivo. Verifique o formato e tente novamente.",
        variant: "destructive",
      });
      setSelectedFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleColumnMappingChange = (dbColumn: string, fileColumn: string) => {
    setColumnMapping(prev => {
      const newMapping = { ...prev };
      if (fileColumn === '') {
        delete newMapping[dbColumn];
      } else {
        newMapping[dbColumn] = fileColumn;
      }
      return newMapping;
    });
  };

  const applyColumnMapping = () => {
    if (!rawData.length) return;

    try {
      const mappedData = rawData.map(row => {
        const mappedRow: any = {};
        Object.entries(columnMapping).forEach(([dbCol, fileCol]) => {
          if (!fileCol) return; // Skip empty mappings
          
          // Handle nested properties
          if (dbCol.includes('.')) {
            const [parent, child] = dbCol.split('.');
            if (!mappedRow[parent]) mappedRow[parent] = {};
            mappedRow[parent][child] = row[fileCol]?.toString() || '';
          } else {
            mappedRow[dbCol] = row[fileCol]?.toString() || '';
          }
        });
        return mappedRow;
      });

      console.log('Mapped Data:', mappedData); // Debug log
      setPreviewData(mappedData);
    } catch (error) {
      console.error('Error mapping data:', error);
      toast({
        title: "Erro",
        description: "Erro ao mapear os dados. Verifique o mapeamento das colunas.",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !previewData.length) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo e mapeie as colunas antes de importar.",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    const requiredFields = STANDARD_COLUMNS
      .filter(col => !col.optional)
      .map(col => col.key);

    const missingFields = requiredFields.filter(field => 
      !columnMapping[field] || !columnMapping[field].trim()
    );

    if (missingFields.length > 0) {
      toast({
        title: "Erro",
        description: `Campos obrigatórios não mapeados: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('fileType', selectedFile.name.split('.').pop()?.toLowerCase() || '');
      formData.append('columnMapping', JSON.stringify(columnMapping));
      formData.append('previewData', JSON.stringify(previewData));

      console.log('Sending data:', {
        fileType: selectedFile.name.split('.').pop()?.toLowerCase(),
        columnMapping,
        previewData
      });

      const response = await fetch('/api/dre/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao importar arquivo');
      }

      toast({
        title: "Sucesso!",
        description: "Arquivo importado com sucesso.",
      });
      router.refresh();
      setPreviewData([]);
      setSelectedFile(null);
      setFileColumns([]);
      setColumnMapping({});
      setRawData([]);
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao importar arquivo. Verifique o formato e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const number = parseFloat(value);
    if (isNaN(number)) return value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(number);
  };

  return (
    <Link href="/dre/novo">
      <Button className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-lg text-sm font-medium">
        <PlusIcon className="h-4 w-4 mr-2" />
        Novo Registro
      </Button>
    </Link>
  );
} 