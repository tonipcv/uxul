const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'tonitypebot@gmail.com' },
      select: {
        id: true,
        email: true,
        plan: true
      }
    });
    
    if (user) {
      console.log('Detalhes do usuário:');
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('Plano atual:', user.plan);
      console.log('\nID hardcoded no middleware: cm8zamrep0000lb0420xkta5z');
      console.log('ID corresponde?', user.id === 'cm8zamrep0000lb0420xkta5z' ? 'SIM ✅' : 'NÃO ❌');
    } else {
      console.log('❌ ERRO: Usuário não encontrado!');
    }
  } catch (error) {
    console.error('Erro ao verificar usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 