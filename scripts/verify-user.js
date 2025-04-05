const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'tonitypebot@gmail.com' },
      select: {
        email: true,
        name: true,
        plan: true,
        planExpiresAt: true
      }
    });
    
    if (user) {
      console.log('Detalhes do usuário:');
      console.log('Email:', user.email);
      console.log('Nome:', user.name);
      console.log('Plano atual:', user.plan);
      console.log('Expira em:', user.planExpiresAt ? user.planExpiresAt.toLocaleDateString() : 'N/A');
      
      // Verifica se o usuário está com plano premium
      if (user.plan === 'premium') {
        console.log('\n✅ SUCESSO: Usuário está com plano premium!');
        
        // Verifica se a data de expiração está aproximadamente 1 ano no futuro
        if (user.planExpiresAt) {
          const oneYearFromNow = new Date();
          oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
          
          const diffTime = Math.abs(oneYearFromNow - user.planExpiresAt);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays < 30) {
            console.log('✅ Data de expiração está corretamente definida para aproximadamente 1 ano.');
          } else {
            console.log('⚠️ Data de expiração parece incorreta. Difere em', diffDays, 'dias de 1 ano completo.');
          }
        }
      } else {
        console.log('\n❌ ERRO: Usuário NÃO está com plano premium!');
      }
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