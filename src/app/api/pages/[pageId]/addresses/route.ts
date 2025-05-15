import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Adicionar um novo endereço
export async function POST(
  request: Request,
  { params }: { params: { pageId: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se a página existe e pertence ao usuário
    const page = await prisma.page.findFirst({
      where: {
        id: params.pageId,
        userId: session.user.id,
      },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Obter dados do corpo da requisição
    const body = await request.json();
    const { name, address, isDefault } = body;

    if (!name || !address) {
      return NextResponse.json({ error: 'Name and address are required' }, { status: 400 });
    }

    // Se o novo endereço for padrão, remover o status de padrão dos outros
    if (isDefault) {
      await prisma.pageAddress.updateMany({
        where: {
          pageId: params.pageId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Criar o novo endereço
    const newAddress = await prisma.pageAddress.create({
      data: {
        pageId: params.pageId,
        name,
        address,
        isDefault: isDefault ?? false,
      },
    });

    return NextResponse.json(newAddress);
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json(
      { error: 'Failed to create address' },
      { status: 500 }
    );
  }
}

// GET - Obter todos os endereços de uma página
export async function GET(
  request: Request,
  { params }: { params: { pageId: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se a página existe e pertence ao usuário
    const page = await prisma.page.findFirst({
      where: {
        id: params.pageId,
        userId: session.user.id,
      },
      include: {
        addresses: true,
      },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json(page.addresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar todos os endereços de uma página
export async function PUT(
  request: Request,
  { params }: { params: { pageId: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se a página existe e pertence ao usuário
    const page = await prisma.page.findFirst({
      where: {
        id: params.pageId,
        userId: session.user.id,
      },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Obter lista de endereços do corpo da requisição
    const body = await request.json();
    const { addresses } = body;

    if (!Array.isArray(addresses)) {
      return NextResponse.json({ error: 'Addresses must be an array' }, { status: 400 });
    }

    // Validar que cada endereço tem os campos obrigatórios
    for (const addr of addresses) {
      if (!addr.name || !addr.address) {
        return NextResponse.json({ 
          error: 'Each address must have name and address fields' 
        }, { status: 400 });
      }
    }

    // Verificar que há pelo menos um endereço padrão se houver endereços
    let updatedAddresses = [...addresses];
    if (updatedAddresses.length > 0 && !updatedAddresses.some(addr => addr.isDefault)) {
      // Se não houver um endereço padrão, defina o primeiro como padrão
      updatedAddresses[0].isDefault = true;
    }

    // Buscar endereços atuais
    const currentAddresses = await prisma.$queryRaw`
      SELECT * FROM "PageAddress" WHERE "pageId" = ${params.pageId}
    `;
    
    // Excluir endereços atuais
    await prisma.$executeRaw`
      DELETE FROM "PageAddress" WHERE "pageId" = ${params.pageId}
    `;
    
    // Criar novos endereços
    for (const addr of updatedAddresses) {
      await prisma.$executeRaw`
        INSERT INTO "PageAddress" 
        ("id", "pageId", "name", "address", "isDefault", "createdAt", "updatedAt")
        VALUES 
        (gen_random_uuid(), ${params.pageId}, ${addr.name}, ${addr.address}, ${addr.isDefault}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
    }
    
    // Buscar endereços atualizados
    const newAddresses = await prisma.$queryRaw`
      SELECT * FROM "PageAddress" WHERE "pageId" = ${params.pageId}
    `;
    
    return NextResponse.json(newAddresses);
  } catch (error) {
    console.error('Error updating addresses:', error);
    return NextResponse.json(
      { error: 'Failed to update addresses', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 