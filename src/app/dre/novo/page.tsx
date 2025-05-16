'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusIcon, ArrowUpTrayIcon, XMarkIcon, DocumentIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
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
import { STANDARD_COLUMNS } from "@/types/fact-entry";
import Navigation from "@/components/Navigation";

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

export default function NovoDREPage() {
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
      router.push('/dre');
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
          if (!fileCol) return;
          
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
      router.push('/dre');
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
    <>
      <Navigation />
      <div className="min-h-[100dvh] bg-gray-50 pb-24 lg:pb-16 lg:ml-16">
        <div className="container mx-auto px-4 max-w-[90%] pt-20 lg:pt-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Novo Registro DRE</h1>
              <p className="text-sm text-gray-500 mt-1">Adicione um novo registro manualmente ou importe um arquivo</p>
            </div>
            <Button
              onClick={() => router.push('/dre')}
              variant="outline"
              className="h-10 px-4 bg-white gap-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Voltar
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <Tabs defaultValue="manual" className="w-full">
              <div className="px-6 pt-6">
                <TabsList className="w-full grid grid-cols-2 gap-4 bg-gray-100/80 p-1 rounded-lg">
                  <TabsTrigger 
                    value="manual" 
                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-md py-2.5"
                  >
                    Entrada Manual
                  </TabsTrigger>
                  <TabsTrigger 
                    value="import" 
                    className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-md py-2.5"
                  >
                    Importar Arquivo
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="manual" className="p-6">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="bg-gray-50/50 rounded-lg p-6 space-y-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Informações Básicas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="period" className="text-sm text-gray-700">Período</Label>
                        <Input 
                          id="period" 
                          name="period" 
                          placeholder="2024-01" 
                          className="bg-white/50 border-gray-200 focus:border-blue-500 h-10"
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="version" className="text-sm text-gray-700">Versão</Label>
                        <Input 
                          id="version" 
                          name="version" 
                          placeholder="Actual" 
                          className="bg-white/50 border-gray-200 focus:border-blue-500 h-10"
                          required 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50/50 rounded-lg p-6 space-y-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Detalhes do Negócio</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="scenario" className="text-sm text-gray-700">Cenário</Label>
                        <Input 
                          id="scenario" 
                          name="scenario" 
                          placeholder="Base Case" 
                          className="bg-white/50 border-gray-200 focus:border-blue-500 h-10"
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bu" className="text-sm text-gray-700">Unidade de Negócio</Label>
                        <Input 
                          id="bu" 
                          name="bu" 
                          className="bg-white/50 border-gray-200 focus:border-blue-500 h-10"
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="region" className="text-sm text-gray-700">Região</Label>
                        <Input 
                          id="region" 
                          name="region" 
                          className="bg-white/50 border-gray-200 focus:border-blue-500 h-10"
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="channel" className="text-sm text-gray-700">Canal</Label>
                        <Input 
                          id="channel" 
                          name="channel" 
                          className="bg-white/50 border-gray-200 focus:border-blue-500 h-10"
                          required 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50/50 rounded-lg p-6 space-y-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Informações Financeiras</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="productSku" className="text-sm text-gray-700">SKU do Produto</Label>
                        <Input 
                          id="productSku" 
                          name="productSku" 
                          className="bg-white/50 border-gray-200 focus:border-blue-500 h-10"
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customer" className="text-sm text-gray-700">Cliente</Label>
                        <Input 
                          id="customer" 
                          name="customer" 
                          className="bg-white/50 border-gray-200 focus:border-blue-500 h-10"
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="costCenterCode" className="text-sm text-gray-700">Código Centro de Custo</Label>
                        <Input 
                          id="costCenterCode" 
                          name="costCenter.code" 
                          className="bg-white/50 border-gray-200 focus:border-blue-500 h-10"
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="glAccount" className="text-sm text-gray-700">Conta Contábil</Label>
                        <Input 
                          id="glAccount" 
                          name="glAccount" 
                          className="bg-white/50 border-gray-200 focus:border-blue-500 h-10"
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pnlLine" className="text-sm text-gray-700">Linha DRE</Label>
                        <Input 
                          id="pnlLine" 
                          name="pnlLine" 
                          className="bg-white/50 border-gray-200 focus:border-blue-500 h-10"
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="value" className="text-sm text-gray-700">Valor</Label>
                        <Input 
                          id="value" 
                          name="value" 
                          type="number" 
                          step="0.01" 
                          className="bg-white/50 border-gray-200 focus:border-blue-500 h-10"
                          required 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => document.querySelector('form')?.reset()}
                      className="h-10 px-4 bg-white"
                    >
                      Limpar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isLoading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                          Salvando...
                        </>
                      ) : "Salvar"}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="import" className="p-6">
                <div className="bg-gray-50/50 rounded-lg p-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Importar Arquivo</h3>
                  <Label htmlFor="file" className="text-sm text-gray-700">Arquivo (CSV, XLS, XLSX)</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <Input
                      id="file"
                      type="file"
                      accept=".csv,.xls,.xlsx"
                      onChange={handleFileSelect}
                      disabled={isLoading || isProcessing}
                      className="bg-white/50 border-gray-200 focus:border-blue-500 h-10"
                    />
                    {selectedFile && (
                      <Button 
                        onClick={() => {
                          setPreviewData([]);
                          setSelectedFile(null);
                          setFileColumns([]);
                          setColumnMapping({});
                          setRawData([]);
                        }}
                        variant="outline"
                        size="icon"
                        disabled={isLoading || isProcessing}
                        className="h-10 w-10"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {isProcessing && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                      Processando arquivo...
                    </div>
                  )}
                </div>

                {fileColumns.length > 0 && (
                  <div className="mt-6 bg-gray-50/50 rounded-lg p-6">
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-900 mb-1">Mapeamento de Colunas</h3>
                      <p className="text-sm text-gray-500">Selecione as colunas do seu arquivo que correspondem aos campos do DRE</p>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                      {STANDARD_COLUMNS.map((column) => (
                        <div key={column.key} className="space-y-2">
                          <Label className="text-sm text-gray-700" htmlFor={`select-${column.key}`}>
                            {column.label}
                            {column.optional && (
                              <span className="text-gray-400 ml-1">(opcional)</span>
                            )}
                          </Label>
                          <select
                            id={`select-${column.key}`}
                            value={columnMapping[column.key] || ''}
                            onChange={(e) => handleColumnMappingChange(column.key, e.target.value)}
                            className="w-full h-10 rounded-md border border-gray-200 bg-white/50 px-3 text-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                              disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Selecione uma coluna</option>
                            {fileColumns.map((fileColumn) => (
                              <option key={fileColumn} value={fileColumn}>
                                {fileColumn}
                              </option>
                            ))}
                          </select>
                          {column.description && (
                            <p className="text-xs text-gray-500">{column.description}</p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t mt-6">
                      <div className="text-sm text-gray-500">
                        {Object.keys(columnMapping).length} de {STANDARD_COLUMNS.length} campos mapeados
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setColumnMapping({})}
                          disabled={Object.keys(columnMapping).length === 0}
                          className="h-10 px-4 bg-white"
                        >
                          Limpar Mapeamento
                        </Button>
                        <Button
                          onClick={applyColumnMapping}
                          disabled={Object.keys(columnMapping).length === 0}
                          className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        >
                          <DocumentIcon className="h-4 w-4" />
                          Visualizar Dados
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {previewData.length > 0 && (
                  <>
                    <div className="mt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <DocumentIcon className="h-4 w-4 text-gray-500" />
                        <h3 className="text-sm font-medium">
                          Prévia dos dados ({previewData.length} registros)
                        </h3>
                      </div>
                      <ScrollArea className="h-[400px] border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent border-b border-gray-200">
                              <TableHead className="text-xs font-medium text-gray-500">Período</TableHead>
                              <TableHead className="text-xs font-medium text-gray-500">Versão</TableHead>
                              <TableHead className="text-xs font-medium text-gray-500">Cenário</TableHead>
                              <TableHead className="text-xs font-medium text-gray-500">UN</TableHead>
                              <TableHead className="text-xs font-medium text-gray-500">Região</TableHead>
                              <TableHead className="text-xs font-medium text-gray-500">Canal</TableHead>
                              <TableHead className="text-xs font-medium text-gray-500">SKU</TableHead>
                              <TableHead className="text-xs font-medium text-gray-500">Cliente</TableHead>
                              <TableHead className="text-xs font-medium text-gray-500">CC</TableHead>
                              <TableHead className="text-xs font-medium text-gray-500">Conta</TableHead>
                              <TableHead className="text-xs font-medium text-gray-500">Linha</TableHead>
                              <TableHead className="text-xs font-medium text-gray-500 text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewData.map((row, index) => (
                              <TableRow key={index} className="hover:bg-gray-50/50 border-b border-gray-100">
                                <TableCell className="text-sm">{row.period}</TableCell>
                                <TableCell className="text-sm">{row.version}</TableCell>
                                <TableCell className="text-sm">{row.scenario}</TableCell>
                                <TableCell className="text-sm">{row.bu}</TableCell>
                                <TableCell className="text-sm">{row.region}</TableCell>
                                <TableCell className="text-sm">{row.channel}</TableCell>
                                <TableCell className="text-sm">{row.productSku}</TableCell>
                                <TableCell className="text-sm">{row.customer}</TableCell>
                                <TableCell className="text-sm">{row['costCenter.code']}</TableCell>
                                <TableCell className="text-sm">{row.glAccount}</TableCell>
                                <TableCell className="text-sm">{row.pnlLine}</TableCell>
                                <TableCell className="text-sm text-right font-medium">
                                  {formatCurrency(row.value)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPreviewData([]);
                          setSelectedFile(null);
                          setFileColumns([]);
                          setColumnMapping({});
                          setRawData([]);
                        }}
                        disabled={isLoading || isProcessing}
                        className="h-10 px-4 bg-white"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleImport}
                        disabled={isLoading || isProcessing || !previewData.length}
                        className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white gap-2"
                      >
                        <ArrowUpTrayIcon className="h-4 w-4" />
                        {isLoading ? "Importando..." : "Confirmar Importação"}
                      </Button>
                    </div>
                  </>
                )}

                {!isProcessing && !fileColumns.length && !previewData.length && (
                  <p className="text-sm text-gray-500 mt-2">
                    Selecione um arquivo para começar a importação.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
} 