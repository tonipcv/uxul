import { Button } from '@/components/ui/button';
import { Instagram, Youtube, Facebook, Linkedin, Twitter, MessageCircle } from 'lucide-react';

const PLATFORM_ICONS = {
  INSTAGRAM: Instagram,
  YOUTUBE: Youtube,
  FACEBOOK: Facebook,
  LINKEDIN: Linkedin,
  TWITTER: Twitter,
  WHATSAPP: MessageCircle,
  TIKTOK: MessageCircle,
};

interface LinksPageProps {
  page: {
    title: string;
    subtitle?: string;
    avatarUrl?: string;
    primaryColor: string;
    blocks: Array<{
      id: string;
      type: string;
      content: any;
      order: number;
    }>;
    socialLinks: Array<{
      id: string;
      platform: keyof typeof PLATFORM_ICONS;
      url: string;
    }>;
    user?: {
      image: string | null;
    };
  };
}

export default function LinksPage({ page }: LinksPageProps) {
  return (
    <div
      className="min-h-screen py-12 px-4"
      style={{ backgroundColor: page.primaryColor + '10' }}
    >
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <img
              src={page.avatarUrl || page.user?.image || '/default-avatar.png'}
              alt={page.title}
              className="w-full h-full rounded-full object-cover shadow-lg ring-4 ring-white"
              style={{ backgroundColor: page.primaryColor + '20' }}
            />
            <div 
              className="absolute inset-0 rounded-full shadow-inner"
              style={{ boxShadow: `inset 0 0 20px ${page.primaryColor}10` }}
            />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: page.primaryColor }}>{page.title}</h1>
          {page.subtitle && (
            <p className="text-gray-600">{page.subtitle}</p>
          )}
        </div>

        {/* Social Links */}
        {page.socialLinks.length > 0 && (
          <div className="flex justify-center gap-4">
            {page.socialLinks.map((link) => {
              const Icon = PLATFORM_ICONS[link.platform] || MessageCircle;
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
                  style={{ color: page.primaryColor + '90' }}
                >
                  <Icon className="h-6 w-6" />
                </a>
              );
            })}
          </div>
        )}

        {/* Content Blocks */}
        <div className="space-y-4">
          {page.blocks.map((block) => {
            if (block.type === 'BUTTON') {
              return (
                <Button
                  key={block.id}
                  className="w-full py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: page.primaryColor,
                    color: 'white',
                  }}
                  asChild
                >
                  <a
                    href={block.content.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    {block.content.label}
                  </a>
                </Button>
              );
            }

            if (block.type === 'FORM') {
              return (
                <div
                  key={block.id}
                  className="bg-white rounded-lg shadow-lg p-6 transform transition-all duration-300 hover:shadow-xl"
                  style={{ borderColor: page.primaryColor + '20', borderWidth: '1px' }}
                >
                  <h2 
                    className="text-xl font-semibold mb-4"
                    style={{ color: page.primaryColor }}
                  >
                    {block.content.title}
                  </h2>
                  {/* Form implementation will be added later */}
                  <p className="text-gray-500">Form coming soon...</p>
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-8">
          <p className="opacity-75">Created with Med1</p>
        </div>
      </div>
    </div>
  );
} 