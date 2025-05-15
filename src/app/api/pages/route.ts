import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log('GET /api/pages - Session:', session); // Debug session

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pages = await prisma.page.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        blocks: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('GET /api/pages - Found pages:', pages); // Debug pages
    
    if (!Array.isArray(pages)) {
      console.error('Pages is not an array:', pages);
      return NextResponse.json([]); // Return empty array as fallback
    }

    return NextResponse.json(pages);
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('POST /api/pages - Session:', session);

    if (!session?.user?.id) {
      console.log('POST /api/pages - Unauthorized: No session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('POST /api/pages - Request body:', body);
    const { title, subtitle, layout, primaryColor, avatarUrl, address, addresses, slug: customSlug, isModal } = body;

    if (!title?.trim()) {
      console.log('POST /api/pages - Missing title');
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Get user's slug for the page URL
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, slug: true },
    });
    console.log('POST /api/pages - Found user:', user);

    if (!user) {
      console.log('POST /api/pages - User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate or use custom slug
    let slug = customSlug?.trim() 
      ? customSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '')
      : title.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');
    
    let counter = 1;
    const baseSlug = slug;

    // Ensure slug uniqueness
    while (true) {
      const existingPage = await prisma.page.findFirst({
        where: {
          slug,
          userId: session.user.id,
        },
      });

      if (!existingPage) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    console.log('POST /api/pages - Creating page with data:', {
      userId: session.user.id,
      userSlug: user.slug,
      title,
      subtitle,
      layout,
      primaryColor,
      avatarUrl,
      address,
      addresses,
      slug,
    });

    try {
      const page = await prisma.page.create({
        data: {
          userId: session.user.id,
          title,
          subtitle: subtitle || null,
          slug,
          layout: layout || 'classic',
          primaryColor: primaryColor || "#0070df",
          avatarUrl: avatarUrl || null,
          address: address || null,
          isModal: isModal || false,
          addresses: addresses?.length ? {
            create: addresses.map(addr => ({
              name: addr.name,
              address: addr.address,
              isDefault: addr.isDefault
            }))
          } : undefined,
          blocks: {
            create: [] // Initialize empty blocks array
          },
          socialLinks: {
            create: [] // Initialize empty social links array
          }
        },
        include: {
          blocks: true,
          socialLinks: true,
          addresses: true,
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

      console.log('POST /api/pages - Created page:', page);
      console.log('POST /api/pages - Page URL will be:', `med1.app/${user.slug}/${page.slug}`);

      return NextResponse.json(page);
    } catch (prismaError) {
      console.error('POST /api/pages - Prisma error:', prismaError);
      return NextResponse.json(
        { error: 'Database error', details: prismaError instanceof Error ? prismaError.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('POST /api/pages - Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to create page', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 