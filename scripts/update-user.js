const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.update({
      where: { email: 'tonitypebot@gmail.com' },
      data: {
        plan: 'premium',
        planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    });
    console.log('Usuário atualizado para premium:', user.email);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 