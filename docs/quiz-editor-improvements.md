# Melhorias no Gerenciamento de Estado do Editor de Questionários

## Problemas Identificados

1. **Estado muito concentrado em um único componente**
   - Todo o estado do quiz (perguntas, telas, configurações) está em um único componente
   - As funções de manipulação do estado estão misturadas com a renderização
   - Difícil manutenção e extensão do código

2. **Lógica de edição misturada com lógica de preview**
   - O mesmo componente gerencia tanto a edição quanto a visualização
   - Dificulta a implementação de validações específicas para cada contexto

3. **Ausência de validação em tempo real**
   - Não há feedback imediato sobre erros de validação
   - Falta verificação de campos obrigatórios e formatos

4. **Preview acoplado ao componente principal**
   - Componente de preview não é reutilizável
   - Mudanças no preview afetam o editor e vice-versa

## Soluções Implementadas

1. **Hook Personalizado para Gerenciamento de Estado**
   - Criado `useQuizEditor` em `/src/hooks/useQuizEditor.ts`
   - Encapsula toda a lógica de manipulação do estado e operações assíncronas
   - Implementa validação de mudanças não salvas

2. **Componentes Separados para Edição e Preview**
   - Componente `QuizPreview` em `/src/components/quiz/QuizPreview.tsx`
     - Renderiza o questionário como o usuário final verá
     - Pode ser usado em qualquer lugar da aplicação
     - Mantém seu próprio estado interno
   
   - Componente `QuestionEditor` em `/src/components/quiz/QuestionEditor.tsx`
     - Foca na edição de uma única pergunta
     - Implementa validação em tempo real
     - Centraliza a lógica de edição

3. **Validação em Tempo Real**
   - Feedback visual imediato de erros
   - Validação específica por tipo de pergunta
   - Mensagens de erro contextuais

4. **Melhorias na Experiência do Usuário**
   - Detecção de mudanças não salvas
   - Alertas antes de sair da página
   - Feedback visual mais claro

## Como Implementar

1. **Instalar os Novos Componentes**
   - Copiar os arquivos para as pastas correspondentes:
     - `/src/hooks/useQuizEditor.ts`
     - `/src/components/quiz/QuizPreview.tsx`
     - `/src/components/quiz/QuestionEditor.tsx`

2. **Refatorar o Componente Principal**
   - Substituir o estado local pelo hook `useQuizEditor`
   - Substituir a renderização direta por componentes separados
   - Remover funções redundantes

3. **Testar a Integração**
   - Verificar a edição de todos os tipos de perguntas
   - Testar a validação em tempo real
   - Verificar a detecção de mudanças não salvas

## Benefícios

1. **Código mais Organizado**
   - Separação clara de responsabilidades
   - Componentes com propósito único
   - Fácil manutenção e extensão

2. **Melhor Experiência do Usuário**
   - Feedback visual imediato
   - Validação mais robusta
   - Menos erros ao salvar

3. **Maior Reutilização**
   - Componentes podem ser usados em diferentes contextos
   - Hook de estado pode ser adaptado para outros editores
   - Validações aplicáveis em outros lugares

4. **Facilidade para Adicionar Novos Recursos**
   - Sistema de dependência entre perguntas
   - Lógica condicional no fluxo do questionário
   - Novos tipos de perguntas

## Próximos Passos

1. **Sistema de Dependência entre Perguntas**
   - Implementar lógica para mostrar/esconder perguntas baseado em respostas anteriores
   - Adicionar interface para configurar dependências

2. **Editor Visual para Fluxos de Questionário**
   - Permitir criar fluxos não lineares
   - Visualização gráfica do fluxo

3. **Versões do Questionário**
   - Implementar controle de versões
   - Permitir reverter para versões anteriores 