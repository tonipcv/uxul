# Melhorias no Modelo de Questionário

## Problemas Identificados

1. **Campo `options` armazenado como string JSON**
   - Dificulta validação e tipagem
   - Requer parse/stringify manual em cada operação

2. **Campo `variableName` opcional**
   - Crucial para identificar respostas no metadata
   - Sem padronização nem validação

3. **Ausência de validações específicas por tipo**
   - Tipos diferentes têm requisitos diferentes
   - Sem regras de validação consistentes

4. **Falta de sistema de dependência entre perguntas**
   - Não há como mostrar/esconder perguntas baseado em outras respostas

## Soluções Implementadas

1. **Melhoria na Estrutura de Dados**
   - Campo `options` agora é do tipo `Json` no banco (não mais `String`)
   - Campo `variableName` agora é obrigatório com valor padrão
   - Adicionados tipos TypeScript robustos em `/src/types/quiz.ts`

2. **Validação de Campos**
   - Helper de validação em `/src/lib/helpers/quiz-validation.ts`
   - Validação de formato para `variableName`
   - Geração automática de nomes de variáveis válidos

3. **Normalização de Dados**
   - Estrutura consistente para opções
   - Validação por tipo de pergunta

## Migração

Para aplicar essas alterações no banco de dados:

1. Execute o script SQL de migração:

```bash
psql "postgres://postgres:xxxxxxx@dpbdp1.easypanel.host:654/servidor?sslmode=disable" -f prisma/migrate-quiz-structure.sql
```

2. Atualize o Prisma Client:

```bash
npx prisma generate
```

## Próximos Passos

1. **Sistema de Dependência entre Perguntas**
   - Implementar lógica de mostrar/esconder perguntas baseado em respostas anteriores

2. **Validações Avançadas**
   - Adicionar validações específicas por tipo (min/max para números, regex para texto, etc.)

3. **Normalização Completa**
   - Migrar para um modelo onde as opções são armazenadas em uma tabela separada
   - Adicionar metadados adicionais às perguntas 