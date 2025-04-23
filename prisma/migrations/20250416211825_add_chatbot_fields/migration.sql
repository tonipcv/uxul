-- This is an empty migration.

-- Adiciona campo `type` à tabela `Indication` para diferenciar indicações regulares de chatbots
ALTER TABLE "Indication" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'regular';

-- Adiciona campo `chatbotConfig` para armazenar configurações do chatbot
ALTER TABLE "Indication" ADD COLUMN "chatbotConfig" JSONB;

-- Cria tabela para mensagens do chatbot
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "indicationId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- Adiciona a relação entre mensagens e indicações
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_indicationId_fkey" FOREIGN KEY ("indicationId") REFERENCES "Indication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Adiciona índice para melhorar performance da busca de mensagens
CREATE INDEX "ChatMessage_indicationId_idx" ON "ChatMessage"("indicationId");