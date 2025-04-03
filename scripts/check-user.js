const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'xppsalvador@gmail.com' },
      select: { 
        id: true, 
        email: true, 
        plan: true, 
        planExpiresAt: true 
      }
    });
    
    console.log('Detalhes do usuário:');
    console.log('------------------');
    console.log('ID:', user?.id);
    console.log('Email:', user?.email);
    console.log('Plano atual:', user?.plan);
    console.log('Expira em:', user?.planExpiresAt ? new Date(user.planExpiresAt).toLocaleString() : 'N/A');
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 