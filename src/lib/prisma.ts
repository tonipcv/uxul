
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

export default prisma;
