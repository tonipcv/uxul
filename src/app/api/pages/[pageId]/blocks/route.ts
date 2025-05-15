import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { pageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify page ownership
    const page = await prisma.page.findUnique({
      where: {
        id: params.pageId,
        userId: session.user.id,
      },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const { blocks } = await request.json();

    // Validar os blocos
    if (!Array.isArray(blocks)) {
      return NextResponse.json(
        { error: 'Invalid blocks format' },
        { status: 400 }
      );
    }

    // Validar cada bloco
    for (const block of blocks) {
      if (!block.type || !['BUTTON', 'FORM', 'ADDRESS'].includes(block.type)) {
        return NextResponse.json(
          { error: 'Invalid block type' },
          { status: 400 }
        );
      }
      if (typeof block.order !== 'number') {
        return NextResponse.json(
          { error: 'Invalid block order' },
          { status: 400 }
        );
      }
    }

    // Usar withRetry para operações do banco de dados
    const updatedBlocks = await withRetry(async () => {
      // Use a transaction in array form to ensure atomicity
      const deleteQuery = prisma.pageBlock.deleteMany({
        where: { pageId: params.pageId },
      });

      const createQueries = blocks.map((block: any) =>
        prisma.pageBlock.create({
          data: {
            type: block.type,
            content: block.content,
            order: block.order,
            pageId: params.pageId,
          },
        })
      );

      await prisma.$transaction([deleteQuery, ...createQueries]);

      // Fetch and return the updated blocks
      return prisma.pageBlock.findMany({
        where: { pageId: params.pageId },
        orderBy: { order: 'asc' },
      });
    });

    return NextResponse.json(updatedBlocks);
  } catch (error) {
    console.error('Error updating blocks:', error);
    return NextResponse.json(
      { error: 'Failed to update blocks. Please try again.' },
      { status: 500 }
    );
  }
} 