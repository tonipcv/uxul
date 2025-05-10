import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/utils';

export async function GET(
  request: Request,
  { params }: { params: { pageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const page = await prisma.page.findFirst({
      where: {
        id: params.pageId,
        userId: session.user.id,
      },
      include: {
        blocks: {
          orderBy: {
            order: 'asc',
          },
        },
        socialLinks: true,
        user: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
          },
        },
      },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { pageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, subtitle, avatarUrl, primaryColor, layout, slug } = body;

    // Verify page ownership
    const existingPage = await prisma.page.findUnique({
      where: {
        id: params.pageId,
        userId: session.user.id,
      },
    });

    if (!existingPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Validate and clean slug
    const cleanSlug = slugify(slug || title);

    // Check if slug is already taken (excluding current page)
    const slugExists = await prisma.page.findFirst({
      where: {
        slug: cleanSlug,
        userId: session.user.id,
        NOT: {
          id: params.pageId
        }
      }
    });

    if (slugExists) {
      return NextResponse.json({ 
        error: 'This URL slug is already in use. Please choose another one.' 
      }, { status: 400 });
    }

    const updatedPage = await prisma.page.update({
      where: {
        id: params.pageId,
      },
      data: {
        title,
        subtitle,
        avatarUrl,
        primaryColor,
        layout,
        slug: cleanSlug,
      },
      include: {
        blocks: {
          orderBy: {
            order: 'asc',
          },
        },
        socialLinks: true,
      },
    });

    return NextResponse.json(updatedPage);
  } catch (error) {
    console.error('Error updating page:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { pageId: string } }
) {
  try {
    console.log('Iniciando processo de deleção para pageId:', params.pageId);
    
    const session = await getServerSession(authOptions);
    console.log('Sessão:', session);
    
    if (!session?.user?.id) {
      console.log('Usuário não autenticado');
      return NextResponse.json({ error: 'Não autorizado. Por favor, faça login novamente.' }, { status: 401 });
    }

    console.log('Usuário autenticado:', session.user.id);

    // Use transaction for safer deletion
    const result = await prisma.$transaction(async (tx) => {
      // Verify page ownership
      const page = await tx.page.findFirst({
        where: {
          id: params.pageId,
          userId: session.user.id,
        },
        include: {
          blocks: true,
          socialLinks: true
        }
      });

      if (!page) {
        console.log('Página não encontrada ou não pertence ao usuário');
        throw new Error('Página não encontrada ou você não tem permissão para excluí-la.');
      }

      console.log('Página encontrada:', {
        id: page.id,
        title: page.title,
        userId: page.userId,
        sessionUserId: session.user.id,
        blocksCount: page.blocks.length,
        socialLinksCount: page.socialLinks.length
      });

      // Delete related records first
      if (page.blocks.length > 0) {
        console.log('Deletando blocos...');
        await tx.pageBlock.deleteMany({
          where: { pageId: params.pageId }
        });
        console.log('Blocos deletados com sucesso');
      }

      if (page.socialLinks.length > 0) {
        console.log('Deletando links sociais...');
        await tx.socialLink.deleteMany({
          where: { pageId: params.pageId }
        });
        console.log('Links sociais deletados com sucesso');
      }

      // Finally delete the page
      console.log('Deletando a página...');
      await tx.page.delete({
        where: {
          id: params.pageId,
        },
      });
      console.log('Página deletada com sucesso');

      return page;
    });

    console.log('Transação concluída com sucesso. Página excluída:', result.title);

    return NextResponse.json({ 
      message: 'Página excluída com sucesso',
      deletedPage: {
        id: result.id,
        title: result.title
      }
    });
  } catch (error) {
    console.error('Erro detalhado ao excluir página:', error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Nome do erro:', error.name);
      console.error('Mensagem do erro:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    if (error instanceof Error && error.message.includes('Página não encontrada')) {
      return NextResponse.json({ 
        error: error.message 
      }, { status: 404 });
    }

    // Check for Prisma-specific errors
    if (error instanceof Error && error.message.includes('Prisma')) {
      return NextResponse.json({ 
        error: 'Erro no banco de dados ao excluir a página. Por favor, tente novamente.',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({ 
      error: 'Erro ao excluir a página. Por favor, tente novamente.',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 