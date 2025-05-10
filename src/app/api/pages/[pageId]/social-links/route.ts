import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for social links
const socialLinkSchema = z.object({
  id: z.string().optional(),
  platform: z.enum(['INSTAGRAM', 'WHATSAPP', 'YOUTUBE', 'FACEBOOK', 'LINKEDIN', 'TIKTOK', 'TWITTER']),
  username: z.string(),
  url: z.string().url(),
});

const updateSocialLinksSchema = z.object({
  links: z.array(socialLinkSchema),
});

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

    const body = await request.json();
    
    // Validate input data
    try {
      updateSocialLinksSchema.parse(body);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    const { links } = body;

    // Use a transaction to ensure data consistency
    const updatedPage = await prisma.$transaction(async (tx) => {
      // First, delete all existing links for this page
      await tx.socialLink.deleteMany({
        where: { pageId: params.pageId },
      });

      // Then create all links as new
      if (links.length > 0) {
        await tx.socialLink.createMany({
          data: links.map(link => ({
            platform: link.platform,
            username: link.username,
            url: link.url,
            pageId: params.pageId,
          })),
        });
      }

      // Return the updated page with all its relations
      return tx.page.findUnique({
        where: { id: params.pageId },
        include: {
          blocks: {
            orderBy: { order: 'asc' }
          },
          socialLinks: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              slug: true
            }
          }
        }
      });
    });

    if (!updatedPage) {
      return NextResponse.json({ error: 'Failed to update social links' }, { status: 500 });
    }

    return NextResponse.json(updatedPage);
  } catch (error) {
    console.error('Error updating social links:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 