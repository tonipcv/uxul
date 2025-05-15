import { notFound } from 'next/navigation';
import { prisma, withRetry } from '@/lib/prisma';
import { headers } from 'next/headers';
import { trackPageView } from '@/lib/analytics';
import ClassicTemplate from '@/components/pages/templates/ClassicTemplate';
import ModernTemplate from '@/components/pages/templates/ModernTemplate';
import MinimalTemplate from '@/components/pages/templates/MinimalTemplate';
import CollorTemplate from '@/components/pages/templates/CollorTemplate';
import BentoDarkTemplate from '@/components/pages/templates/BentoDarkTemplate';
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
    id: string;
    title: string;
    subtitle: string | null;
    avatarUrl: string | null;
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
      specialty: string | null;
    } | null;
  };
}

interface ReferralContent {
  type: 'referral';
  content: {
    id: string;
    slug: string;
    page: {
      id: string;
      title: string;
      subtitle: string | null;
      avatarUrl: string | null;
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
        specialty: string | null;
      } | null;
    };
    patient: {
      id: string;
      name: string;
    };
    user: {
      id: string;
      name: string;
      image: string | null;
      specialty: string | null;
    } | null;
  };
}

type ContentResponse = PageContent | ReferralContent | null;

type SocialPlatform = 'INSTAGRAM' | 'WHATSAPP' | 'YOUTUBE' | 'FACEBOOK' | 'LINKEDIN' | 'TIKTOK' | 'TWITTER';

// Add type for template page props
interface TemplatePageProps {
  id: string;
  title: string;
  subtitle: string | null;
  avatarUrl: string | null;
  primaryColor: string;
  blocks: Array<{
    id: string;
    type: 'BUTTON' | 'FORM' | 'ADDRESS';
    content: {
      title?: string;
      label?: string;
      url?: string;
      pipelineId?: string;
      isModal?: boolean;
      modalTitle?: string;
      successPage?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    order: number;
  }>;
  socialLinks: Array<{
    platform: 'INSTAGRAM' | 'WHATSAPP' | 'YOUTUBE' | 'FACEBOOK' | 'LINKEDIN' | 'TWITTER';
    url: string;
  }>;
  user: {
    id: string;
    name: string;
    image: string | null;
    specialty: string | null;
  };
}

// Transform page content to match template props
function transformPageContent(page: any, templateType: string): any {
  const baseContent = {
    id: page.id,
    title: page.title,
    subtitle: page.subtitle || null,
    avatarUrl: page.avatarUrl || null,
    primaryColor: page.primaryColor,
    blocks: page.blocks.map((block: any) => ({
      id: block.id,
      type: block.type as 'BUTTON' | 'FORM' | 'ADDRESS',
      content: {
        title: block.content.title,
        label: block.content.label,
        url: block.content.url,
        pipelineId: block.content.pipelineId,
        isModal: block.content.isModal,
        modalTitle: block.content.modalTitle,
        successPage: block.content.successPage,
        address: block.content.address,
        city: block.content.city,
        state: block.content.state,
        zipCode: block.content.zipCode,
        country: block.content.country
      },
      order: block.order
    })),
    user: page.user ? {
      id: page.user.id,
      name: page.user.name,
      image: page.user.image || null,
      specialty: page.user.specialty || null
    } : null
  };

  // Handle social links based on template type
  switch (templateType.toLowerCase()) {
    case 'collor':
    case 'bentodark':
      return {
        ...baseContent,
        socialLinks: page.socialLinks
          .filter((link: any) => {
            const platform = link.platform as 'INSTAGRAM' | 'WHATSAPP' | 'YOUTUBE' | 'FACEBOOK' | 'LINKEDIN' | 'TWITTER';
            return ['INSTAGRAM', 'WHATSAPP', 'YOUTUBE', 'FACEBOOK', 'LINKEDIN', 'TWITTER'].includes(platform);
          })
          .map((link: any) => ({
            platform: link.platform as 'INSTAGRAM' | 'WHATSAPP' | 'YOUTUBE' | 'FACEBOOK' | 'LINKEDIN' | 'TWITTER',
            url: link.url
          }))
      };
    default:
      return {
        ...baseContent,
        socialLinks: page.socialLinks
          .filter((link: any) => {
            const platform = link.platform as 'INSTAGRAM' | 'WHATSAPP' | 'YOUTUBE' | 'FACEBOOK' | 'LINKEDIN' | 'TWITTER';
            return ['INSTAGRAM', 'WHATSAPP', 'YOUTUBE', 'FACEBOOK', 'LINKEDIN', 'TWITTER'].includes(platform);
          })
          .map((link: any) => ({
            id: link.id,
            platform: link.platform as 'INSTAGRAM' | 'WHATSAPP' | 'YOUTUBE' | 'FACEBOOK' | 'LINKEDIN' | 'TWITTER',
            url: link.url
          }))
      };
  }
}

async function getContent(userSlug: string, slug: string): Promise<ContentResponse> {
  try {
    console.log('Fetching content for:', { userSlug, slug });

    // First, find the user with retry logic
    const user = await withRetry(() => 
      prisma.user.findUnique({
        where: { slug: userSlug },
        select: { id: true, name: true, image: true, specialty: true },
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
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              specialty: true,
            },
          },
        },
      })
    );

    console.log('Found page:', page);

    if (page) {
      const transformedContent = {
        type: 'page' as const,
        content: {
          id: page.id,
          title: page.title,
          subtitle: page.subtitle,
          avatarUrl: page.avatarUrl,
          primaryColor: page.primaryColor,
          layout: page.layout,
          blocks: page.blocks.map(block => ({
            id: block.id,
            type: block.type as 'BUTTON' | 'FORM' | 'ADDRESS',
            content: block.content,
            order: block.order,
          })),
          socialLinks: page.socialLinks.map(link => ({
            id: link.id,
            platform: link.platform as SocialPlatform,
            url: link.url,
          })),
          user: page.user ? {
            id: page.user.id,
            name: page.user.name,
            image: page.user.image,
            specialty: page.user.specialty,
          } : null,
        },
      };

      console.log('Transformed page content:', transformedContent);
      return transformedContent;
    }

    // Try to find a referral with retry logic
    const referral = await withRetry(() =>
      prisma.patientReferral.findFirst({
        where: {
          slug,
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
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  specialty: true,
                },
              },
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

    if (referral) {
      const transformedContent = {
        type: 'referral' as const,
        content: {
          id: referral.id,
          slug: referral.slug,
          page: {
            id: referral.page.id,
            title: referral.page.title,
            subtitle: referral.page.subtitle,
            avatarUrl: referral.page.avatarUrl,
            primaryColor: referral.page.primaryColor,
            layout: referral.page.layout,
            blocks: referral.page.blocks.map(block => ({
              id: block.id,
              type: block.type as 'BUTTON' | 'FORM' | 'ADDRESS',
              content: block.content,
              order: block.order,
            })),
            socialLinks: referral.page.socialLinks.map(link => ({
              id: link.id,
              platform: link.platform as SocialPlatform,
              url: link.url,
            })),
            user: referral.page.user ? {
              id: referral.page.user.id,
              name: referral.page.user.name,
              image: referral.page.user.image,
              specialty: referral.page.user.specialty,
            } : null,
          },
          patient: referral.patient,
          user: referral.page.user ? {
            id: referral.page.user.id,
            name: referral.page.user.name,
            image: referral.page.user.image,
            specialty: referral.page.user.specialty,
          } : null,
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

// Add dynamic route configuration
export const dynamic = 'force-dynamic';

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
      if (content.content.user) {
      await trackPageView(
        content.content.user.id,
        headersList.get('user-agent') || undefined,
        headersList.get('x-forwarded-for') || undefined
      );
      }
    } catch (error) {
      console.error('Error tracking page view:', error);
      // Continue even if tracking fails
    }

    console.log('Rendering page with content type:', content.type);

    // Render appropriate component based on content type
    if (content.type === 'page') {
      const layout = content.content.layout.toLowerCase();
      const pageContent = transformPageContent(content.content, layout);

      switch (layout) {
        case 'modern':
          return <ModernTemplate page={pageContent} />;
        case 'minimal':
          return <MinimalTemplate page={pageContent} />;
        case 'collor':
          return <CollorTemplate page={pageContent} />;
        case 'bentodark':
          return <BentoDarkTemplate page={pageContent} />;
        case 'classic':
        default:
          return <ClassicTemplate page={pageContent} />;
      }
    } else {
      // Handle referral content
      const layout = content.content.page.layout.toLowerCase();
      const pageContent = transformPageContent(content.content.page, layout);

      switch (layout) {
        case 'modern':
          return <ModernTemplate page={pageContent} />;
        case 'minimal':
          return <MinimalTemplate page={pageContent} />;
        case 'collor':
          return <CollorTemplate page={pageContent} />;
        case 'bentodark':
          return <BentoDarkTemplate page={pageContent} />;
        case 'classic':
        default:
          return <ClassicTemplate page={pageContent} />;
      }
    }
  } catch (error) {
    console.error('Error in DynamicPage:', error);
    throw error;
  }
} 