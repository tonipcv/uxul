import { useState, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpTrayIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

const REQUIRED_FIELDS = ['name', 'phone'];
const AVAILABLE_FIELDS = [
  { value: 'name', label: 'Nome' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Telefone' },
  { value: 'status', label: 'Status' },
  { value: 'source', label: 'Origem' },
  { value: 'interest', label: 'Interesse' },
  { value: 'potentialValue', label: 'Valor Potencial' },
];

export function CSVImportModal({ isOpen, onClose, onImportComplete }: CSVImportModalProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setHeaders([]);
    setPreviewData([]);
    setFieldMapping({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const parseCSV = (content: string) => {
    const lines = content.split('\\n');
    const headers = lines[0].split(',').map(header => header.trim());
    const data = lines.slice(1)
      .filter(line => line.trim())
      .map(line => line.split(',').map(cell => cell.trim()));
    return { headers, data };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const { headers, data } = parseCSV(content);
      
      setFile(file);
      setHeaders(headers);
      setPreviewData(data.slice(0, 5)); // Preview first 5 rows
      setStep('mapping');

      // Initialize field mapping with best guesses
      const initialMapping: Record<string, string> = {};
      headers.forEach(header => {
        const normalizedHeader = header.toLowerCase();
        const match = AVAILABLE_FIELDS.find(field => 
          normalizedHeader.includes(field.value) || 
          field.label.toLowerCase().includes(normalizedHeader)
        );
        if (match) {
          initialMapping[header] = match.value;
        }
      });
      setFieldMapping(initialMapping);
    } catch (error) {
      toast({
        title: "Erro ao ler arquivo",
        description: "Não foi possível ler o arquivo CSV. Certifique-se que o formato está correto.",
        variant: "destructive"
      });
    }
  };

  const handleFieldMap = (header: string, value: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [header]: value
    }));
  };

  const validateMapping = () => {
    const mappedFields = new Set(Object.values(fieldMapping));
    return REQUIRED_FIELDS.every(field => mappedFields.has(field));
  };

  const handleImport = async () => {
    if (!file || !validateMapping()) return;

    try {
      const content = await file.text();
      const { data } = parseCSV(content);
      
      const leads = data.map(row => {
        const lead: Record<string, any> = {};
        headers.forEach((header, index) => {
          const field = fieldMapping[header];
          if (field) {
            lead[field] = row[index];
          }
        });
        return lead;
      });

      const response = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads })
      });

      if (!response.ok) {
        throw new Error('Erro ao importar leads');
      }

      const result = await response.json();
      
      toast({
        title: "Importação concluída",
        description: `${result.imported} leads importados com sucesso.`
      });

      handleClose();
      onImportComplete();
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Não foi possível importar os leads. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg font-bold text-gray-900">
            Importar Leads via CSV
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                <ArrowUpTrayIcon className="h-8 w-8 mx-auto text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-gray-600">Arraste seu arquivo CSV ou</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white"
                  >
                    Selecione um arquivo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Formato: CSV com cabeçalhos
                </p>
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">
                  Mapeamento de Campos
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Coluna do CSV</TableHead>
                      <TableHead>Campo do Lead</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {headers.map((header) => (
                      <TableRow key={header}>
                        <TableCell>{header}</TableCell>
                        <TableCell>
                          <Select
                            value={fieldMapping[header] || ''}
                            onValueChange={(value) => handleFieldMap(header, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione o campo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Ignorar</SelectItem>
                              {AVAILABLE_FIELDS.map((field) => (
                                <SelectItem key={field.value} value={field.value}>
                                  {field.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">
                  Prévia dos Dados
                </h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {headers.map((header) => (
                          <TableHead key={header}>{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, i) => (
                        <TableRow key={i}>
                          {row.map((cell, j) => (
                            <TableCell key={j}>{cell}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="bg-white"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!validateMapping()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Importar Leads
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
} 