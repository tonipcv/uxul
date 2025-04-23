-- Migração dos dados de options para formato JSON
UPDATE "QuizQuestion"
SET options = CASE 
  WHEN options IS NOT NULL AND options != '' 
  THEN options -- Já é JSON, só manter
  ELSE NULL 
END;

-- Adicionar valor padrão para variableName onde for nulo
UPDATE "QuizQuestion"
SET "variableName" = CONCAT('question_', SUBSTRING(id, 1, 8))
WHERE "variableName" IS NULL;

-- Alterar o tipo da coluna options para json (se ainda não estiver)
ALTER TABLE "QuizQuestion" 
ALTER COLUMN options TYPE JSONB USING options::JSONB;

-- Tornar variableName NOT NULL com valor padrão
ALTER TABLE "QuizQuestion" 
ALTER COLUMN "variableName" SET NOT NULL,
ALTER COLUMN "variableName" SET DEFAULT 'question'; 