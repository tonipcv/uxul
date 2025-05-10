import { prisma } from '@/lib/prisma';

export async function trackPageView(pageId: string, userAgent?: string, ip?: string) {
  try {
    await prisma.event.create({
      data: {
        type: 'PAGE_VIEW',
        userId: pageId,
        userAgent,
        ip,
      },
    });
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
} 