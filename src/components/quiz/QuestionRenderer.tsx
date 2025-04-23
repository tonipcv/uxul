import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
} from '@/components/ui/select';

export interface QuizQuestion {
  id: string;
  text: string;
  type: string;
  required: boolean;
  options?: string[];
  variableName: string;
}

type AnswerValue = string | string[] | number | boolean | null;

interface QuestionRendererProps {
  question: QuizQuestion;
  value?: AnswerValue;
  onChange?: (questionId: string, value: AnswerValue) => void;
  disabled?: boolean;
  viewMode?: 'preview' | 'answer';
}

/**
 * Componente para renderizar uma pergunta de questionário com base no seu tipo
 * Pode ser usado tanto para visualização prévia quanto para entrada de dados
 */
export function QuestionRenderer({ 
  question, 
  value, 
  onChange, 
  disabled = false,
  viewMode = 'answer'
}: QuestionRendererProps) {
  const handleChange = (newValue: AnswerValue) => {
    if (onChange) {
      onChange(question.id, newValue);
    }
  };

  // Converter o valor para o tipo apropriado se necessário
  const normalizeValue = (val: any): AnswerValue => {
    if (val === undefined || val === null) return null;
    
    switch (question.type) {
      case 'number':
        return val === '' ? null : Number(val);
      case 'boolean':
        if (typeof val === 'string') {
          return val === 'sim' || val === 'true';
        }
        return Boolean(val);
      case 'multiselect':
      case 'checkbox':
        if (typeof val === 'string') {
          return val.split(',').map(s => s.trim());
        }
        return Array.isArray(val) ? val : [val].filter(Boolean);
      default:
        return val;
    }
  };

  // Normalizar o valor atual
  const currentValue = normalizeValue(value);

  switch (question.type) {
    case 'text':
      return (
        <Input 
          placeholder={viewMode === 'preview' ? "Digite sua resposta" : "Texto curto"}
          value={currentValue as string || ''}
          onChange={(e) => handleChange(e.target.value)}
          className={`w-full ${viewMode === 'answer' ? 'bg-gray-50 border-transparent text-gray-900 placeholder:text-gray-400 p-4 text-lg h-auto focus:ring-1 focus:ring-gray-200 focus:border-gray-200 transition-all rounded-lg' : 'bg-white'}`}
          disabled={disabled}
        />
      );
      
    case 'textarea':
      return (
        <Textarea 
          placeholder={viewMode === 'preview' ? "Digite sua resposta detalhada" : "Resposta detalhada"}
          value={currentValue as string || ''}
          onChange={(e) => handleChange(e.target.value)}
          className={`w-full ${viewMode === 'answer' ? 'bg-gray-50 border-transparent text-gray-900 placeholder:text-gray-400 min-h-[150px] p-4 text-lg focus:ring-1 focus:ring-gray-200 focus:border-gray-200 transition-all rounded-lg' : 'bg-white min-h-[100px]'}`}
          disabled={disabled}
        />
      );
      
    case 'number':
      return (
        <Input 
          type="number"
          placeholder="0"
          value={currentValue as number || ''}
          onChange={(e) => handleChange(e.target.value === '' ? null : Number(e.target.value))}
          className={`w-full ${viewMode === 'answer' ? 'bg-gray-50 border-transparent text-gray-900 placeholder:text-gray-400 p-4 text-lg h-auto focus:ring-1 focus:ring-gray-200 focus:border-gray-200 transition-all rounded-lg' : 'bg-white'}`}
          disabled={disabled}
        />
      );
      
    case 'select':
      return (
        <Select 
          value={currentValue as string || ''}
          onValueChange={handleChange}
          disabled={disabled}
        >
          <SelectTrigger className={`w-full ${viewMode === 'answer' ? 'bg-gray-50 border-transparent text-gray-900 text-lg p-4 h-auto focus:ring-1 focus:ring-gray-200 focus:border-gray-200 transition-all' : 'bg-white'}`}>
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent className="text-gray-900">
            {(question.options || []).map((option, i) => (
              <SelectItem 
                key={i} 
                value={option} 
                className={viewMode === 'answer' ? 'text-gray-900 text-lg' : ''}
              >
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
      
    case 'radio':
      return (
        <RadioGroup 
          value={currentValue as string || ''} 
          onValueChange={handleChange}
          className="space-y-3"
        >
          {(question.options || []).map((option, i) => (
            <div 
              key={i} 
              className={`flex items-center ${
                viewMode === 'answer' 
                  ? 'bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-all duration-200 cursor-pointer' 
                  : 'space-x-3 p-3 rounded-lg border border-gray-200'
              }`}
              onClick={() => !disabled && handleChange(option)}
            >
              <RadioGroupItem 
                value={option} 
                id={`${question.id}-radio-${i}`} 
                disabled={disabled}
                className={viewMode === 'answer' ? 'h-4 w-4 text-blue-500' : ''}
              />
              <Label 
                htmlFor={`${question.id}-radio-${i}`} 
                className={`
                  ${viewMode === 'answer' 
                    ? 'text-gray-700 font-normal cursor-pointer text-base flex-1 ml-3' 
                    : ''
                  }
                `}
              >
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );
      
    case 'checkbox':
    case 'multiselect':
      const selectedOptions = Array.isArray(currentValue) ? currentValue : [];
      
      return (
        <div className="space-y-3">
          {(question.options || []).map((option, i) => (
            <div 
              key={i} 
              className={`flex items-center ${
                viewMode === 'answer' 
                  ? 'bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-all duration-200 cursor-pointer' 
                  : 'space-x-3 p-3 rounded-lg border border-gray-200'
              }`}
              onClick={() => {
                if (disabled) return;
                
                const isSelected = selectedOptions.includes(option);
                const newSelectedOptions = isSelected
                  ? selectedOptions.filter(item => item !== option)
                  : [...selectedOptions, option];
                
                handleChange(newSelectedOptions);
              }}
            >
              <Checkbox 
                id={`${question.id}-checkbox-${i}`}
                checked={selectedOptions.includes(option)}
                onCheckedChange={(checked) => {
                  if (disabled) return;
                  
                  const newSelectedOptions = checked
                    ? [...selectedOptions, option]
                    : selectedOptions.filter(item => item !== option);
                  
                  handleChange(newSelectedOptions);
                }}
                disabled={disabled}
                className={viewMode === 'answer' ? 'h-4 w-4 text-blue-500' : ''}
              />
              <Label 
                htmlFor={`${question.id}-checkbox-${i}`} 
                className={`
                  ${viewMode === 'answer' 
                    ? 'text-gray-700 font-normal cursor-pointer text-base flex-1 ml-3' 
                    : ''
                  }
                `}
              >
                {option}
              </Label>
            </div>
          ))}
        </div>
      );
      
    case 'scale':
      return (
        <div className="flex justify-between items-center py-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <div key={num} className="flex flex-col items-center">
              <Button
                variant={Number(currentValue) === num ? "default" : "outline"}
                size="sm"
                onClick={() => handleChange(num)}
                disabled={disabled}
                className={`w-10 h-10 rounded-full ${viewMode === 'answer' ? 'text-md' : ''}`}
              >
                {num}
              </Button>
            </div>
          ))}
        </div>
      );
      
    case 'date':
      return (
        <Input 
          type="date"
          value={currentValue as string || ''}
          onChange={(e) => handleChange(e.target.value)}
          className={`w-full ${viewMode === 'answer' ? 'bg-gray-50 border-transparent text-gray-900 p-4 text-lg h-auto focus:ring-1 focus:ring-gray-200 focus:border-gray-200 transition-all rounded-lg' : 'bg-white'}`}
          disabled={disabled}
        />
      );
      
    case 'boolean':
      return (
        <div className={viewMode === 'answer' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'flex gap-3'}>
          <div 
            className={
              viewMode === 'answer'
                ? `flex items-center ${currentValue === true ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'} rounded-lg p-4 hover:bg-blue-50 hover:border-blue-200 transition-all duration-150 cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`
                : ''
            }
            onClick={() => !disabled && handleChange(true)}
          >
            {viewMode === 'answer' ? (
              <>
                <RadioGroupItem 
                  value="sim" 
                  id={`${question.id}-sim`} 
                  checked={currentValue === true}
                  className="h-4 w-4 text-blue-600" 
                  disabled={disabled}
                />
                <Label 
                  htmlFor={`${question.id}-sim`} 
                  className="text-gray-800 font-normal cursor-pointer text-lg flex-1 ml-3"
                >
                  Sim
                </Label>
              </>
            ) : (
              <Button variant="outline" disabled={disabled} className="flex-1">Sim</Button>
            )}
          </div>
          
          <div 
            className={
              viewMode === 'answer'
                ? `flex items-center ${currentValue === false ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'} rounded-lg p-4 hover:bg-blue-50 hover:border-blue-200 transition-all duration-150 cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`
                : ''
            }
            onClick={() => !disabled && handleChange(false)}
          >
            {viewMode === 'answer' ? (
              <>
                <RadioGroupItem 
                  value="nao" 
                  id={`${question.id}-nao`} 
                  checked={currentValue === false}
                  className="h-4 w-4 text-blue-600" 
                  disabled={disabled}
                />
                <Label 
                  htmlFor={`${question.id}-nao`} 
                  className="text-gray-800 font-normal cursor-pointer text-lg flex-1 ml-3"
                >
                  Não
                </Label>
              </>
            ) : (
              <Button variant="outline" disabled={disabled} className="flex-1">Não</Button>
            )}
          </div>
        </div>
      );
      
    default:
      return <p className="text-gray-500">Tipo de pergunta não suportado</p>;
  }
} 