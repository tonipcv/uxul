import { QuizQuestion } from "@/components/quiz/QuestionRenderer";

export type AnswerValue = string | string[] | number | boolean | null;
export type QuizAnswers = Record<string, AnswerValue>;

export interface ProcessedAnswer {
  questionId: string;
  questionText: string;
  variableName: string;
  value: AnswerValue;
  displayValue: string;
  type: string;
}

/**
 * Normaliza um valor de resposta com base no tipo de pergunta
 * Garante consistência nos tipos de dados das respostas
 */
export function normalizeAnswerValue(value: any, questionType: string): AnswerValue {
  if (value === undefined || value === null) return null;
  
  switch (questionType) {
    case 'number':
      return value === '' ? null : Number(value);
    case 'boolean':
      if (typeof value === 'string') {
        return value.toLowerCase() === 'sim' || value.toLowerCase() === 'true';
      }
      return Boolean(value);
    case 'multiselect':
    case 'checkbox':
      if (typeof value === 'string') {
        return value.split(',').map(s => s.trim()).filter(Boolean);
      }
      return Array.isArray(value) ? value : [value].filter(Boolean);
    default:
      return value;
  }
}

/**
 * Converte um valor de resposta para uma string de exibição
 */
export function getDisplayValue(value: AnswerValue, questionType: string): string {
  if (value === null || value === undefined) return '';
  
  switch (questionType) {
    case 'boolean':
      return value === true ? 'Sim' : 'Não';
    case 'multiselect':
    case 'checkbox':
      return Array.isArray(value) ? value.join(', ') : String(value);
    default:
      return String(value);
  }
}

/**
 * Processa as respostas brutas do formulário em um formato estruturado
 * Normaliza os valores e adiciona informações adicionais para cada resposta
 */
export function processQuizAnswers(
  answers: QuizAnswers,
  questions: QuizQuestion[]
): ProcessedAnswer[] {
  const processedAnswers: ProcessedAnswer[] = [];
  
  // Criar um mapa de ID de pergunta para pergunta para consulta rápida
  const questionsMap = new Map(questions.map(q => [q.id, q]));
  
  for (const [questionId, value] of Object.entries(answers)) {
    const question = questionsMap.get(questionId);
    
    if (question) {
      const normalizedValue = normalizeAnswerValue(value, question.type);
      
      processedAnswers.push({
        questionId,
        questionText: question.text,
        variableName: question.variableName,
        value: normalizedValue,
        displayValue: getDisplayValue(normalizedValue, question.type),
        type: question.type
      });
    }
  }
  
  return processedAnswers;
}

/**
 * Gera metadados estruturados a partir das respostas processadas
 * Formato mais limpo e organizado para armazenamento e API
 */
export function generateQuizMetadata(processedAnswers: ProcessedAnswer[]): Record<string, any> {
  const metadata: Record<string, any> = {};
  
  // Organizar respostas por variableName para melhor acesso via API
  processedAnswers.forEach(answer => {
    const key = answer.variableName || `question_${answer.questionId}`;
    
    // Adicionar valor e informações estruturadas
    metadata[key] = {
      value: answer.value,
      text: answer.questionText,
      displayValue: answer.displayValue,
      type: answer.type
    };
    
    // Adicionar também como valor direto para compatibilidade com código existente
    metadata[`${key}_value`] = answer.value;
    metadata[`${key}_text`] = answer.questionText;
    metadata[`${key}_display`] = answer.displayValue;
  });
  
  return metadata;
}

/**
 * Converte respostas do formato antigo para o novo formato estruturado
 * Útil para compatibilidade com código existente
 */
export function convertLegacyAnswers(legacyAnswers: Record<string, any>): Record<string, any> {
  const structuredMetadata: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(legacyAnswers)) {
    // Verificar se é um par de chave/valor normal ou um par de "texto da pergunta"
    if (key.endsWith('_text')) {
      const baseKey = key.replace('_text', '');
      
      // Se já existe uma entrada estruturada, adicionar o texto
      if (structuredMetadata[baseKey]) {
        structuredMetadata[baseKey].text = value;
      } else {
        // Criar uma nova entrada estruturada
        structuredMetadata[baseKey] = {
          text: value,
          value: null,
          displayValue: '',
          type: 'unknown'
        };
      }
    } else {
      // Valor normal - criar ou atualizar entrada
      if (!structuredMetadata[key]) {
        structuredMetadata[key] = {
          value: value,
          text: '',
          displayValue: String(value),
          type: 'unknown'
        };
      } else {
        structuredMetadata[key].value = value;
        structuredMetadata[key].displayValue = String(value);
      }
    }
  }
  
  return structuredMetadata;
} 