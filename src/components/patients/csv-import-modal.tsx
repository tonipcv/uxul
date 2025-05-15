import { useState, useRef, useEffect } from "react";
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
  { value: 'medicalNotes', label: 'Anotações Médicas' },
];

export function CSVImportModal({ isOpen, onClose, onImportComplete }: CSVImportModalProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setHeaders([]);
    setPreviewData([]);
    setFieldMapping({});
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
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

    setIsImporting(true);
    try {
      const content = await file.text();
      const { data } = parseCSV(content);
      
      const patients = data.map(row => {
        const patient: Record<string, any> = {
          lead: {}
        };
        headers.forEach((header, index) => {
          const field = fieldMapping[header];
          if (field) {
            if (field === 'status' || field === 'medicalNotes') {
              patient.lead[field] = row[index];
            } else {
              patient[field] = row[index];
            }
          }
        });
        return patient;
      });

      const response = await fetch('/api/patients/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patients })
      });

      if (!response.ok) {
        throw new Error('Erro ao importar pacientes');
      }

      const result = await response.json();
      
      toast({
        title: "Importação concluída",
        description: `${result.imported} pacientes importados com sucesso.`
      });

      handleClose();
      onImportComplete();
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Não foi possível importar os pacientes. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Sheet 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg font-bold text-gray-900">
            Importar Pacientes via CSV
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
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Mapeamento de Campos
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Associe as colunas do seu CSV aos campos do sistema
                </p>
                <div className="space-y-3">
                  {headers.map((header) => (
                    <div key={header} className="flex items-center gap-3">
                      <div className="flex-1 text-sm font-medium text-gray-900">
                        {header}
                      </div>
                      <Select
                        value={fieldMapping[header] || ''}
                        onValueChange={(value) => handleFieldMap(header, value)}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Selecione um campo" />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_FIELDS.map((field) => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {previewData.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Pré-visualização
                  </h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
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
              )}

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!validateMapping() || isImporting}
                >
                  {isImporting ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border border-current border-t-transparent mr-2"></span>
                      Importando...
                    </>
                  ) : "Importar"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
} 