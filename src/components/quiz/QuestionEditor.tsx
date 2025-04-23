import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoveUp, MoveDown, Trash } from 'lucide-react';
import { validateQuestion } from '@/lib/helpers/quiz-validation';

// Tipos de perguntas disponíveis
const QUESTION_TYPES = [
  { value: 'text', label: 'Texto Curto' },
  { value: 'textarea', label: 'Texto Longo' },
  { value: 'number', label: 'Número' },
  { value: 'select', label: 'Escolha Única' },
  { value: 'multiselect', label: 'Múltipla Escolha' },
  { value: 'radio', label: 'Opções (Radio)' },
  { value: 'checkbox', label: 'Caixas de Seleção' },
  { value: 'scale', label: 'Escala (1-10)' },
  { value: 'date', label: 'Data' },
  { value: 'boolean', label: 'Sim/Não' },
];

interface QuizQuestion {
  id: string;
  type: string;
  text: string;
  required: boolean;
  options?: any[];
  variableName: string;
}

interface QuestionEditorProps {
  question: QuizQuestion;
  index: number;
  totalQuestions: number;
  onUpdate: (id: string, data: Partial<QuizQuestion>) => void;
  onRemove: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export function QuestionEditor({ 
  question, 
  index, 
  totalQuestions, 
  onUpdate, 
  onRemove, 
  onMoveUp, 
  onMoveDown 
}: QuestionEditorProps) {
  const [newOption, setNewOption] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleAddOption = () => {
    if (!newOption.trim()) return;
    
    const currentOptions = [...(question.options || [])];
    currentOptions.push(newOption.trim());
    
    onUpdate(question.id, { options: currentOptions });
    setNewOption('');
  };

  const handleRemoveOption = (optionIndex: number) => {
    const updatedOptions = [...(question.options || [])];
    updatedOptions.splice(optionIndex, 1);
    onUpdate(question.id, { options: updatedOptions });
  };

  const validateField = (field: string, value: any) => {
    // Validação específica por campo
    if (field === 'text' && !value.trim()) {
      setValidationErrors(prev => ({ ...prev, text: 'O texto da pergunta é obrigatório' }));
      return false;
    }
    
    if (field === 'variableName') {
      if (!value.trim()) {
        setValidationErrors(prev => ({ ...prev, variableName: 'O nome da variável é obrigatório' }));
        return false;
      }
      
      if (!/^[a-z0-9_]+$/i.test(value)) {
        setValidationErrors(prev => ({ 
          ...prev, 
          variableName: 'Use apenas letras, números e underscores (sem espaços ou caracteres especiais)' 
        }));
        return false;
      }
    }
    
    // Se chegou aqui, limpar erro
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    
    return true;
  };

  const handleFieldChange = (field: string, value: any) => {
    if (validateField(field, value)) {
      onUpdate(question.id, { [field]: value });
    }
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-medium">Pergunta {index + 1}</CardTitle>
          <CardDescription className="text-xs">
            {QUESTION_TYPES.find(t => t.value === question.type)?.label || 'Texto'}
          </CardDescription>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            className="h-8 w-8 rounded-full hover:bg-gray-100 text-gray-600"
          >
            <MoveUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMoveDown(index)}
            disabled={index === totalQuestions - 1}
            className="h-8 w-8 rounded-full hover:bg-gray-100 text-gray-600"
          >
            <MoveDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(question.id)}
            className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-700"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="space-y-2">
          <Label 
            htmlFor={`question-${question.id}-text`} 
            className={`text-gray-700 ${validationErrors.text ? 'text-red-500' : ''}`}
          >
            Texto da Pergunta
          </Label>
          <Textarea
            id={`question-${question.id}-text`}
            value={question.text}
            onChange={(e) => handleFieldChange('text', e.target.value)}
            placeholder="Digite sua pergunta aqui"
            className={`bg-white border-gray-300 text-gray-800 placeholder:text-gray-400 ${
              validationErrors.text ? 'border-red-500 focus:ring-red-500' : ''
            }`}
          />
          {validationErrors.text && (
            <p className="text-xs text-red-500 mt-1">{validationErrors.text}</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`question-${question.id}-type`} className="text-gray-700">Tipo de Resposta</Label>
            <Select
              value={question.type}
              onValueChange={(value) => handleFieldChange('type', value)}
            >
              <SelectTrigger className="bg-white border-gray-300 text-gray-800">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 text-gray-800">
                {QUESTION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="focus:bg-gray-100 focus:text-gray-800">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label 
              htmlFor={`question-${question.id}-var`} 
              className={`text-gray-700 ${validationErrors.variableName ? 'text-red-500' : ''}`}
            >
              Nome da Variável
            </Label>
            <Input
              id={`question-${question.id}-var`}
              value={question.variableName}
              onChange={(e) => handleFieldChange('variableName', e.target.value)}
              placeholder="Ex: nome_paciente, idade, sintoma"
              className={`bg-white border-gray-300 text-gray-800 placeholder:text-gray-400 ${
                validationErrors.variableName ? 'border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {validationErrors.variableName ? (
              <p className="text-xs text-red-500 mt-1">{validationErrors.variableName}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Use apenas letras, números e underscores</p>
            )}
          </div>
        </div>
        
        {/* Campo de opções para perguntas de múltipla escolha */}
        {['select', 'multiselect', 'radio', 'checkbox'].includes(question.type) && (
          <div className="space-y-3">
            <Label htmlFor={`question-${question.id}-options`} className="text-gray-700">
              Opções
              <span className="block text-xs text-gray-500 mt-1">
                Adicione as opções do seu questionário abaixo
              </span>
            </Label>
            
            <div className="flex items-center">
              <Input
                id={`question-${question.id}-options-input`}
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="Digite uma nova opção"
                className="mr-2 border-gray-300 text-gray-800 placeholder:text-gray-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddOption();
                  }
                }}
              />
              <Button 
                type="button"
                onClick={handleAddOption}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!newOption.trim()}
              >
                Adicionar Opção
              </Button>
            </div>
            
            {question.options && question.options.length > 0 ? (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Opções adicionadas:</p>
                <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                  <ul className="text-sm space-y-1">
                    {question.options.map((option, i) => (
                      <li key={i} className="flex items-center justify-between text-gray-700 px-2 py-1 rounded hover:bg-gray-100">
                        <span>{option}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOption(i)}
                          className="h-6 w-6 p-0 rounded-full hover:bg-red-100 hover:text-red-600"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-xs text-red-500">
                Este tipo de pergunta requer pelo menos uma opção
              </p>
            )}
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Switch
            checked={question.required}
            onCheckedChange={(value) => handleFieldChange('required', value)}
            id={`question-${question.id}-required`}
          />
          <Label htmlFor={`question-${question.id}-required`} className="text-sm text-gray-700">
            Resposta obrigatória
          </Label>
        </div>
      </CardContent>
    </Card>
  );
} 