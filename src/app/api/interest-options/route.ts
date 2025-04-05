import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Listar todas as opções de interesse do usuário atual
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const interestOptions = await prisma.interestOption.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' }
    });
    
    return NextResponse.json(interestOptions);
  } catch (error) {
    console.error('Erro ao buscar opções de interesse:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar opções de interesse' },
      { status: 500 }
    );
  }
}

// Criar uma nova opção de interesse
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const { label, value, redirectUrl, isDefault } = await req.json();
    
    // Validação básica
    if (!label || !value) {
      return NextResponse.json(
        { error: 'Label e value são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Se esta opção for definida como padrão, remove o padrão das outras
    if (isDefault) {
      await prisma.interestOption.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false }
      });
    }
    
    const newOption = await prisma.interestOption.create({
      data: {
        label,
        value,
        redirectUrl,
        isDefault: !!isDefault,
        userId: session.user.id
      }
    });
    
    return NextResponse.json(newOption, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar opção de interesse:', error);
    
    // Verificar se o erro é de unicidade (valor duplicado)
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return NextResponse.json(
        { error: 'Já existe uma opção com este valor para este usuário' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro ao criar opção de interesse' },
      { status: 500 }
    );
  }
}

// Atualizar uma opção de interesse existente
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const { id, label, value, redirectUrl, isDefault } = await req.json();
    
    // Validação básica
    if (!id || !label || !value) {
      return NextResponse.json(
        { error: 'ID, label e value são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Verificar se a opção pertence ao usuário
    const existingOption = await prisma.interestOption.findUnique({
      where: { id }
    });
    
    if (!existingOption || existingOption.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Opção não encontrada ou não pertence ao usuário' },
        { status: 404 }
      );
    }
    
    // Se esta opção for definida como padrão, remove o padrão das outras
    if (isDefault) {
      await prisma.interestOption.updateMany({
        where: { 
          userId: session.user.id,
          id: { not: id }
        },
        data: { isDefault: false }
      });
    }
    
    const updatedOption = await prisma.interestOption.update({
      where: { id },
      data: {
        label,
        value,
        redirectUrl,
        isDefault: !!isDefault
      }
    });
    
    return NextResponse.json(updatedOption);
  } catch (error) {
    console.error('Erro ao atualizar opção de interesse:', error);
    
    // Verificar se o erro é de unicidade (valor duplicado)
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return NextResponse.json(
        { error: 'Já existe uma opção com este valor para este usuário' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro ao atualizar opção de interesse' },
      { status: 500 }
    );
  }
}

// Excluir uma opção de interesse
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }
    
    // Verificar se a opção pertence ao usuário
    const existingOption = await prisma.interestOption.findUnique({
      where: { id }
    });
    
    if (!existingOption || existingOption.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Opção não encontrada ou não pertence ao usuário' },
        { status: 404 }
      );
    }
    
    await prisma.interestOption.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir opção de interesse:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir opção de interesse' },
      { status: 500 }
    );
  }
} 