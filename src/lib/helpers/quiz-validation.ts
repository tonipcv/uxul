import { Question, QuestionType } from "@/types/quiz";

export function validateQuestion(question: Partial<Question>): string | null {
  // Validar campos obrigatórios
  if (!question.text?.trim()) {
    return "O texto da pergunta é obrigatório";
  }

  // Validar nome da variável
  if (!question.variableName?.trim()) {
    return "O nome da variável é obrigatório";
  }

  // Validar formato do nome da variável (apenas letras, números e underscores)
  if (!/^[a-z0-9_]+$/i.test(question.variableName)) {
    return "O nome da variável deve conter apenas letras, números e underscores";
  }

  // Validar options para tipos que requerem
  if ([
    QuestionType.SELECT, 
    QuestionType.MULTISELECT, 
    QuestionType.RADIO, 
    QuestionType.CHECKBOX
  ].includes(question.type as QuestionType)) {
    if (!question.options || question.options.length === 0) {
      return "Este tipo de pergunta requer pelo menos uma opção";
    }
  }

  return null; // Sem erros
}

export function generateValidVariableName(text: string): string {
  // Remover caracteres especiais, substituir espaços por underscores e converter para minúsculas
  const safeName = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_');
  
  // Se não houver caracteres válidos, use um padrão
  return safeName || `question_${Date.now()}`;
}

export function normalizeQuestionOptions(options: string[] | any[] | null | undefined): any[] {
  // Se não houver opções, retorna array vazio
  if (!options) return [];
  
  // Se as opções já forem objetos com o formato correto, retorna como está
  if (options.length > 0 && typeof options[0] === 'object' && 'value' in options[0]) {
    return options;
  }
  
  // Converte strings simples para o formato de objeto
  return options.map((option, index) => ({
    id: `option_${index}`,
    value: option,
    label: option,
    order: index
  }));
} 