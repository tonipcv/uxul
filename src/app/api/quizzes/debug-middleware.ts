import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function debugMiddleware(req: NextRequest) {
  console.log("------ DEBUG MIDDLEWARE ------");
  console.log("Método:", req.method);
  console.log("URL:", req.url);
  
  try {
    // Testar sessão
    const session = await getServerSession(authOptions);
    console.log("Sessão:", session ? "Disponível" : "Não disponível");
    console.log("ID do usuário:", session?.user?.id || "Não disponível");
    
    // Testar conexão com o banco de dados
    if (session?.user?.id) {
      try {
        const userCount = await prisma.user.count({
          where: { id: session.user.id }
        });
        console.log("Conexão com BD:", "OK");
        console.log("Usuário encontrado no BD:", userCount > 0 ? "Sim" : "Não");
        
        // Verificar modelo Quiz
        try {
          const quizCount = await prisma.quiz.count({
            where: { userId: session.user.id }
          });
          console.log("Acesso ao modelo Quiz:", "OK");
          console.log("Contagem de quizzes do usuário:", quizCount);
        } catch (quizError) {
          console.error("Erro ao acessar modelo Quiz:", quizError);
        }
      } catch (dbError) {
        console.error("Erro ao conectar com o banco de dados:", dbError);
      }
    }
  } catch (sessionError) {
    console.error("Erro ao obter sessão:", sessionError);
  }
  
  console.log("------------------------------");
  
  // Continuar com a requisição normal
  return NextResponse.next();
} 