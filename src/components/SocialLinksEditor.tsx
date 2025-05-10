'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, Instagram, Youtube, Facebook, Linkedin, Twitter, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useDebouncedCallback } from 'use-debounce';

interface SocialLink {
  id: string;
  platform: 'INSTAGRAM' | 'WHATSAPP' | 'YOUTUBE' | 'FACEBOOK' | 'LINKEDIN' | 'TIKTOK' | 'TWITTER';
  username: string;
  url: string;
}

interface SocialLinksEditorProps {
  links: SocialLink[];
  onLinksChange: (links: SocialLink[]) => void;
}

const PLATFORM_ICONS = {
  INSTAGRAM: Instagram,
  YOUTUBE: Youtube,
  FACEBOOK: Facebook,
  LINKEDIN: Linkedin,
  TWITTER: Twitter,
  WHATSAPP: MessageCircle,
  TIKTOK: PlusCircle,
};

const PLATFORM_LABELS = {
  INSTAGRAM: 'Instagram',
  YOUTUBE: 'YouTube',
  FACEBOOK: 'Facebook',
  LINKEDIN: 'LinkedIn',
  TWITTER: 'Twitter',
  WHATSAPP: 'WhatsApp',
  TIKTOK: 'TikTok',
};

const PLATFORM_URL_PATTERNS = {
  INSTAGRAM: 'https://instagram.com/',
  YOUTUBE: 'https://youtube.com/',
  FACEBOOK: 'https://facebook.com/',
  LINKEDIN: 'https://linkedin.com/in/',
  TWITTER: 'https://twitter.com/',
  WHATSAPP: 'https://wa.me/',
  TIKTOK: 'https://tiktok.com/@',
};

export function SocialLinksEditor({ links, onLinksChange }: SocialLinksEditorProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<SocialLink['platform']>('INSTAGRAM');
  const [localLinks, setLocalLinks] = useState<SocialLink[]>(links);
  const [isDirty, setIsDirty] = useState(false);

  // Update local state when props change, but only if we're not in the middle of an edit
  useEffect(() => {
    if (!isDirty) {
      setLocalLinks(links);
    }
  }, [links, isDirty]);

  // Debounced function to update parent
  const debouncedUpdate = useDebouncedCallback(
    (newLinks: SocialLink[]) => {
      onLinksChange(newLinks);
      setIsDirty(false);
    },
    1000
  );

  const handleAddLink = () => {
    const newLink: SocialLink = {
      id: crypto.randomUUID(),
      platform: selectedPlatform,
      username: '',
      url: PLATFORM_URL_PATTERNS[selectedPlatform],
    };

    setIsDirty(true);
    const updatedLinks = [...localLinks, newLink];
    setLocalLinks(updatedLinks);
    debouncedUpdate(updatedLinks);
  };

  const handleDeleteLink = (linkId: string) => {
    setIsDirty(true);
    const updatedLinks = localLinks.filter((link) => link.id !== linkId);
    setLocalLinks(updatedLinks);
    debouncedUpdate(updatedLinks);
  };

  const handleLinkChange = (linkId: string, field: keyof SocialLink, value: string) => {
    setIsDirty(true);
    const updatedLinks = localLinks.map((link) => {
      if (link.id === linkId) {
        if (field === 'username') {
          // Update URL when username changes
          const baseUrl = PLATFORM_URL_PATTERNS[link.platform];
          return {
            ...link,
            username: value,
            url: `${baseUrl}${value}`,
          };
        }
        return { ...link, [field]: value };
      }
      return link;
    });

    setLocalLinks(updatedLinks);
    debouncedUpdate(updatedLinks);
  };

  const validateUrl = (platform: SocialLink['platform'], url: string) => {
    const baseUrl = PLATFORM_URL_PATTERNS[platform];
    return url.startsWith(baseUrl);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value as SocialLink['platform'])}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2"
        >
          {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <Button 
          onClick={handleAddLink} 
          variant="outline"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Link
        </Button>
      </div>

      <div className="space-y-4">
        {localLinks.map((link) => {
          const Icon = PLATFORM_ICONS[link.platform];
          const baseUrl = PLATFORM_URL_PATTERNS[link.platform];

          return (
            <Card key={link.id}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  <div className="p-2">
                    <Icon className="h-4 w-4 text-gray-400" />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {PLATFORM_LABELS[link.platform]}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`username-${link.id}`}>Username</Label>
                      <Input
                        id={`username-${link.id}`}
                        value={link.username}
                        onChange={(e) =>
                          handleLinkChange(link.id, 'username', e.target.value)
                        }
                        placeholder={`Enter your ${PLATFORM_LABELS[link.platform]} username`}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`url-${link.id}`}>URL</Label>
                      <Input
                        id={`url-${link.id}`}
                        value={link.url}
                        onChange={(e) =>
                          handleLinkChange(link.id, 'url', e.target.value)
                        }
                        className={
                          validateUrl(link.platform, link.url)
                            ? ''
                            : 'border-red-500 focus:ring-red-500'
                        }
                      />
                      {!validateUrl(link.platform, link.url) && (
                        <p className="text-xs text-red-500">
                          URL must start with {baseUrl}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteLink(link.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 