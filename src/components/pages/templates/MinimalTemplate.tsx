'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Instagram, Youtube, Facebook, Linkedin, Twitter, MessageCircle } from 'lucide-react';
import { BsPatchCheckFill } from 'react-icons/bs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FormModal } from '@/components/FormModal';

const PLATFORM_ICONS = {
  INSTAGRAM: Instagram,
  YOUTUBE: Youtube,
  FACEBOOK: Facebook,
  LINKEDIN: Linkedin,
  TWITTER: Twitter,
  WHATSAPP: MessageCircle,
  TIKTOK: MessageCircle,
};

const VerifiedBadge = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="9" cy="9" r="9" fill="#0095F6"/>
    <path
      d="M13.093 6.436a.75.75 0 0 0-1.036-.248l-3.144 2.115-1.17-1.635a.75.75 0 0 0-1.222.873l1.75 2.444a.75.75 0 0 0 1.129.076l3.75-3.125a.75.75 0 0 0-.057-1.5z"
      fill="#fff"
    />
  </svg>
);

interface MinimalTemplateProps {
  page: {
    title: string;
    subtitle?: string;
    avatarUrl?: string;
    primaryColor: string;
    blocks: Array<{
      id: string;
      type: string;
      content: {
        title?: string;
        label?: string;
        url?: string;
        pipelineId?: string;
        isModal?: boolean;
        modalTitle?: string;
        successPage?: string;
      };
      order: number;
    }>;
    socialLinks: Array<{
      id: string;
      platform: keyof typeof PLATFORM_ICONS;
      url: string;
    }>;
    user: {
      image: string;
      name: string;
    };
  };
}

export default function MinimalTemplate({ page }: MinimalTemplateProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFormBlock, setActiveFormBlock] = useState<typeof page.blocks[0] | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, block: typeof page.blocks[0]) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          pipelineId: block.content.pipelineId,
          status: 'Novo'
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar formulário');
      }

      // Limpa o formulário
      form.reset();
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-white">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <img
              src={page.avatarUrl || page.user.image || '/default-avatar.png'}
              alt={page.title}
              className="w-full h-full rounded-full object-cover shadow-sm"
              style={{ backgroundColor: page.primaryColor + '10' }}
            />
          </div>
          <h1 
            className="text-xl font-medium flex items-center justify-center gap-1"
            style={{ color: page.primaryColor }}
          >
            {page.user.name}
            <div className="rounded-full drop-shadow-[0_2px_4px_rgba(0,149,246,0.2)]">
              <BsPatchCheckFill size={18} className="text-[#0095F6]" />
            </div>
          </h1>
          <p className="text-gray-600 text-sm">{page.title}</p>
          {page.subtitle && (
            <p className="text-gray-600 text-sm">{page.subtitle}</p>
          )}
        </div>

        {/* Content Blocks */}
        <div className="space-y-3">
          {page.blocks.map((block) => {
            if (block.type === 'BUTTON') {
              return (
                <Button
                  key={block.id}
                  className="w-full py-4 text-base font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
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
              if (block.content.isModal) {
                return (
                  <Button
                    key={block.id}
                    className="w-full py-4 text-base font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    style={{
                      backgroundColor: page.primaryColor,
                      color: 'white',
                    }}
                    onClick={() => {
                      setActiveFormBlock(block);
                      setIsModalOpen(true);
                    }}
                  >
                    {block.content.title}
                  </Button>
                );
              }

              return (
                <div
                  key={block.id}
                  className="bg-gray-50 rounded-xl p-4 shadow-lg"
                >
                  <h2 
                    className="text-lg font-medium mb-3"
                    style={{ color: page.primaryColor }}
                  >
                    {block.content.title}
                  </h2>
                  <form onSubmit={(e) => handleSubmit(e, block)} className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-sm text-gray-600">Nome</Label>
                      <Input 
                        id="name" 
                        name="name"
                        placeholder="Seu nome completo"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm text-gray-600">Email</Label>
                      <Input 
                        id="email" 
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm text-gray-600">WhatsApp</Label>
                      <Input 
                        id="phone" 
                        name="phone"
                        placeholder="(00) 00000-0000"
                        className="mt-1"
                        required
                      />
                    </div>
                    <Button 
                      type="submit"
                      className="w-full"
                      style={{
                        backgroundColor: page.primaryColor,
                        color: 'white',
                      }}
                    >
                      Enviar
                    </Button>
                  </form>
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Social Links */}
        {page.socialLinks.length > 0 && (
          <div className="flex justify-center gap-3 mt-6">
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
                  <Icon className="h-5 w-5" />
                </a>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pt-6">
          <p className="opacity-75">Created with Med1</p>
        </div>
      </div>

      {/* Modal Form */}
      {activeFormBlock && (
        <FormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setActiveFormBlock(null);
          }}
          title={activeFormBlock.content.modalTitle || activeFormBlock.content.title || ''}
          primaryColor={page.primaryColor}
          pipelineId={activeFormBlock.content.pipelineId}
          successPage={activeFormBlock.content.successPage}
        />
      )}
    </div>
  );
} 