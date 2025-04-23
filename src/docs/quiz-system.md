# Sistema de Questionários - Documentação

## Principais componentes e utilitários

### 1. QuestionRenderer

Componente reutilizável para renderizar perguntas de questionário, independente do contexto (preview ou resposta real).

**Localização**: `src/components/quiz/QuestionRenderer.tsx`

**Uso básico**:
```tsx
import { QuestionRenderer } from '@/components/quiz/QuestionRenderer';

// Para visualização (preview)
<QuestionRenderer 
  question={question}
  disabled={true}
  viewMode="preview"
/>

// Para resposta real
<QuestionRenderer
  question={question}
  value={answers[question.id]}
  onChange={handleQuizAnswer}
  viewMode="answer"
/>
```

### 2. Utilitários de Processamento de Respostas

Um conjunto de funções para garantir consistência no processamento das respostas dos questionários.

**Localização**: `src/lib/quiz/answer-processing.ts`

**Principais funções**:

1. `normalizeAnswerValue`: Normaliza um valor de resposta para seu tipo apropriado
2. `getDisplayValue`: Converte um valor normalizado em uma string para exibição
3. `processQuizAnswers`: Processa todas as respostas do questionário
4. `generateQuizMetadata`: Gera metadados estruturados para armazenamento e API

**Exemplo de uso**:
```tsx
import { 
  normalizeAnswerValue, 
  processQuizAnswers, 
  generateQuizMetadata 
} from '@/lib/quiz/answer-processing';

// Normalizar uma resposta individual
const normalizedValue = normalizeAnswerValue(value, question.type);

// Processar todas as respostas
const processedAnswers = processQuizAnswers(answers, questions);

// Gerar metadados para API/DB
const metadata = generateQuizMetadata(processedAnswers);
```

## Melhorias implementadas

### 1. Consistência de dados

- Todas as respostas são normalizadas para seus tipos apropriados:
  - `boolean` para perguntas tipo boolean (true/false ao invés de "sim"/"não")
  - `number` para perguntas numéricas
  - `string[]` para perguntas de multiple-choice
  
### 2. Reutilização de código

- Um único componente `QuestionRenderer` substitui a duplicação de lógica de renderização
- Suporte consistente para todos os tipos de perguntas
- Modos "preview" e "answer" para adaptar a aparência ao contexto

### 3. Metadados estruturados

- Formato consistente para armazenamento de respostas
- Organização clara separando valor, texto da pergunta e exibição
- Compatibilidade com o formato legado através das funções de conversão

### 4. Tipagem forte

- Interfaces TypeScript para todos os componentes e funções
- Tratamento de valores nulos/undefined
- Validação embutida

## Implementação da API

A API de submissão de questionários (`/api/quiz/submit`) foi atualizada para usar esses novos utilitários, garantindo consistência no processamento e armazenamento das respostas.

## Práticas recomendadas

1. Sempre use `normalizeAnswerValue` ao processar uma resposta do usuário
2. Use o componente `QuestionRenderer` em vez de implementar a lógica de renderização manualmente
3. Armazene os metadados usando o formato estruturado gerado por `generateQuizMetadata`
4. Ao exibir respostas, use `getDisplayValue` para garantir formato consistente

## Considerações sobre migração

Sistemas existentes que utilizavam o formato antigo de metadados ainda funcionarão. Use a função `convertLegacyAnswers` para converter dados antigos para o novo formato estruturado.

```tsx
import { convertLegacyAnswers } from '@/lib/quiz/answer-processing';

// Converter dados antigos
const structuredData = convertLegacyAnswers(legacyMetadata);
``` 