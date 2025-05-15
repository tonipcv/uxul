import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Usar um singleton para o Prisma Client
export const prisma = globalThis.prisma || new PrismaClient({
  log: ['error']
});

// Guardar a instância no objeto global em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

/**
 * Função para tentar executar uma operação do Prisma com retry automático em caso de falha
 * Útil para operações que podem falhar temporariamente devido a problemas de conexão
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt < maxRetries) {
        // Esperar antes de tentar novamente, com aumento exponencial do tempo de espera
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1)));
      }
    }
  }
  throw lastError;
}

export default prisma;
