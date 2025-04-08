import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Buscar opções de interesse de um usuário pelo slug ou uma opção específica pelo ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Caso 1: Se o slug for um ID válido (formato UUID), buscar opção específica
    if (slug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      // Verificar se o usuário está autenticado
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Usuário não autenticado' },
          { status: 401 }
        );
      }

      // Buscar opção específica pelo ID
      const option = await prisma.interestOption.findUnique({
        where: {
          id: slug,
          userId: session.user.id
        }
      });

      if (!option) {
        return NextResponse.json(
          { error: 'Opção não encontrada' },
          { status: 404 }
        );
      }

      return NextResponse.json(option);
    } 
    
    // Caso 2: Buscar opções de interesse pelo slug do usuário
    const userSlug = slug;
    
    if (!userSlug) {
      return NextResponse.json(
        { error: 'Slug do usuário é obrigatório' },
        { status: 400 }
      );
    }
    
    // Buscar o usuário pelo slug
    const user = await prisma.user.findUnique({
      where: { slug: userSlug }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Buscar as opções de interesse do usuário
    const interestOptions = await prisma.interestOption.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        label: true,
        value: true,
        redirectUrl: true,
        isDefault: true
      },
      orderBy: { createdAt: 'asc' }
    });
    
    return NextResponse.json(interestOptions);
  } catch (error) {
    console.error('Erro ao buscar opções de interesse:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

/**
 * Atualiza informações de uma opção de interesse específica
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Verificar se o slug é um ID válido
    if (!slug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }
    
    // Obter a sessão atual
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Extrair dados do corpo da requisição
    const data = await req.json();
    const { label, value, redirectUrl, isDefault } = data;

    // Verificar se a opção existe e pertence ao usuário
    const optionExists = await prisma.interestOption.findUnique({
      where: {
        id: slug,
        userId: session.user.id
      }
    });

    if (!optionExists) {
      return NextResponse.json(
        { error: 'Opção não encontrada' },
        { status: 404 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {};
    if (label !== undefined) updateData.label = label;
    if (value !== undefined) updateData.value = value;
    if (redirectUrl !== undefined) updateData.redirectUrl = redirectUrl || null;
    
    if (isDefault !== undefined) {
      updateData.isDefault = isDefault;
      
      // Se esta opção for definida como padrão, desmarcar as outras
      if (isDefault) {
        await prisma.interestOption.updateMany({
          where: {
            userId: session.user.id,
            isDefault: true,
            id: {
              not: slug
            }
          },
          data: {
            isDefault: false
          }
        });
      }
    }

    // Atualizar a opção
    const updatedOption = await prisma.interestOption.update({
      where: {
        id: slug
      },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      data: updatedOption,
      message: 'Opção atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar opção:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

/**
 * Remove uma opção de interesse específica
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Verificar se o slug é um ID válido
    if (!slug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }
    
    // Obter a sessão atual
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se a opção existe e pertence ao usuário
    const optionExists = await prisma.interestOption.findUnique({
      where: {
        id: slug,
        userId: session.user.id
      }
    });

    if (!optionExists) {
      return NextResponse.json(
        { error: 'Opção não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se é a única opção padrão do usuário
    if (optionExists.isDefault) {
      const defaultOptionsCount = await prisma.interestOption.count({
        where: {
          userId: session.user.id,
          isDefault: true
        }
      });

      if (defaultOptionsCount <= 1) {
        // Tentar definir outra opção como padrão
        const anotherOption = await prisma.interestOption.findFirst({
          where: {
            userId: session.user.id,
            id: {
              not: slug
            }
          }
        });

        if (anotherOption) {
          await prisma.interestOption.update({
            where: {
              id: anotherOption.id
            },
            data: {
              isDefault: true
            }
          });
        }
      }
    }

    // Excluir a opção
    await prisma.interestOption.delete({
      where: {
        id: slug
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Opção removida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover opção:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 