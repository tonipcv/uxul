import { notFound } from 'next/navigation';
import { prisma, withRetry } from '@/lib/prisma';
import { headers } from 'next/headers';
import { trackPageView } from '@/lib/analytics';
import ClassicTemplate from '@/components/pages/templates/ClassicTemplate';
import ModernTemplate from '@/components/pages/templates/ModernTemplate';
import MinimalTemplate from '@/components/pages/templates/MinimalTemplate';
import { ReferralPage } from '@/components/pages';

interface PageProps {
  params: {
    userSlug: string;
    slug: string;
  };
}

interface PageContent {
  type: 'page';
  content: {
    title: string;
    subtitle?: string;
    avatarUrl?: string;
    primaryColor: string;
    layout: string;
    blocks: Array<{
      id: string;
      type: string;
      content: any;
      order: number;
    }>;
    socialLinks: Array<{
      id: string;
      platform: SocialPlatform;
      url: string;
    }>;
    user: {
      id: string;
      name: string;
      image: string | null;
    };
  };
}

interface ReferralContent {
  type: 'referral';
  content: {
    id: string;
    slug: string;
    page: {
      title: string;
      subtitle?: string;
      avatarUrl?: string;
      primaryColor: string;
      layout: string;
      blocks: Array<{
        id: string;
        type: string;
        content: any;
        order: number;
      }>;
      socialLinks: Array<{
        id: string;
        platform: SocialPlatform;
        url: string;
      }>;
    };
    patient: {
      id: string;
      name: string;
    };
    user: {
      id: string;
      name: string;
      image: string | null;
    };
  };
}

type ContentResponse = (PageContent | ReferralContent) | null;

type SocialPlatform = 'INSTAGRAM' | 'WHATSAPP' | 'YOUTUBE' | 'FACEBOOK' | 'LINKEDIN' | 'TIKTOK' | 'TWITTER';

async function getContent(userSlug: string, slug: string): Promise<ContentResponse> {
  try {
    console.log('Fetching content for:', { userSlug, slug });

    // First, find the user with retry logic
    const user = await withRetry(() => 
      prisma.user.findUnique({
        where: { slug: userSlug },
        select: { id: true, name: true, image: true },
      })
    );

    console.log('Found user:', user);

    if (!user) {
      console.log('User not found with slug:', userSlug);
      return null;
    }

    // Then try to find a page with retry logic
    const page = await withRetry(() =>
      prisma.page.findFirst({
        where: {
          slug,
          userId: user.id,
        },
        include: {
          blocks: {
            orderBy: {
              order: 'asc',
            },
          },
          socialLinks: true,
        },
      })
    );

    console.log('Found page:', page);

    if (page) {
      const transformedContent = {
        type: 'page' as const,
        content: {
          title: page.title,
          subtitle: page.subtitle || undefined,
          avatarUrl: page.avatarUrl || undefined,
          primaryColor: page.primaryColor,
          layout: page.layout,
          blocks: page.blocks.map(block => ({
            id: block.id,
            type: block.type,
            content: block.content,
            order: block.order,
          })),
          socialLinks: page.socialLinks.map(link => ({
            id: link.id,
            platform: link.platform as SocialPlatform,
            url: link.url,
          })),
          user,
        },
      };

      console.log('Transformed page content:', transformedContent);
      return transformedContent;
    }

    // If no page found, try to find a patient referral with retry logic
    const referral = await withRetry(() =>
      prisma.patientReferral.findFirst({
        where: {
          slug,
          patient: {
            user: {
              slug: userSlug
            }
          }
        },
        include: {
          page: {
            include: {
              blocks: {
                orderBy: {
                  order: 'asc',
                },
              },
              socialLinks: true,
            },
          },
          patient: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
    );

    console.log('Found referral:', referral);

    if (referral) {
      const transformedContent = {
        type: 'referral' as const,
        content: {
          id: referral.id,
          slug: referral.slug,
          page: {
            title: referral.page.title,
            subtitle: referral.page.subtitle || undefined,
            avatarUrl: referral.page.avatarUrl || undefined,
            primaryColor: referral.page.primaryColor,
            layout: referral.page.layout,
            blocks: referral.page.blocks.map(block => ({
              id: block.id,
              type: block.type,
              content: block.content,
              order: block.order,
            })),
            socialLinks: referral.page.socialLinks.map(link => ({
              id: link.id,
              platform: link.platform as SocialPlatform,
              url: link.url,
            })),
          },
          patient: referral.patient,
          user,
        },
      };

      console.log('Transformed referral content:', transformedContent);
      return transformedContent;
    }

    console.log('No content found for:', { userSlug, slug });
    return null;
  } catch (error) {
    console.error('Error in getContent:', error);
    throw error;
  }
}

export default async function DynamicPage({ params }: PageProps) {
  try {
    console.log('Loading page for params:', params);
    const content = await getContent(params.userSlug, params.slug);
    
    if (!content) {
      console.log('No content found, returning 404');
      notFound();
    }

    const headersList = headers();
    
    // Track page view
    try {
      await trackPageView(
        content.content.user.id,
        headersList.get('user-agent') || undefined,
        headersList.get('x-forwarded-for') || undefined
      );
    } catch (error) {
      console.error('Error tracking page view:', error);
      // Continue even if tracking fails
    }

    console.log('Rendering page with content type:', content.type);

    // Render appropriate component based on content type
    if (content.type === 'page') {
      // Choose template based on layout
      const pageContent = {
        ...content.content,
        user: {
          ...content.content.user,
          image: content.content.user.image || '',
        },
      };

      switch (content.content.layout) {
        case 'modern':
          return <ModernTemplate page={pageContent} />;
        case 'minimal':
          return <MinimalTemplate page={pageContent} />;
        case 'classic':
        default:
          return <ClassicTemplate page={pageContent} />;
      }
    } else {
      return <ReferralPage referral={content.content} />;
    }
  } catch (error) {
    console.error('Error in DynamicPage:', error);
    throw error;
  }
} 