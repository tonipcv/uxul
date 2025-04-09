import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { password } = await req.json();

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 12);

    // Atualiza a senha do paciente e marca como não sendo mais primeiro acesso
    await prisma.patient.update({
      where: {
        id: session.user.id,
      },
      data: {
        password: hashedPassword,
        firstAccess: false,
      },
    });

    return NextResponse.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Erro ao alterar senha' },
      { status: 500 }
    );
  }
} 