'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Instagram, Youtube, Facebook, Linkedin, Twitter, MessageCircle, MapPin } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FormModal } from '@/components/FormModal';
import { LocationMap } from '@/components/ui/location-map';
import { Address } from '@/components/ui/address-manager';

const PLATFORM_ICONS = {
  INSTAGRAM: Instagram,
  YOUTUBE: Youtube,
  FACEBOOK: Facebook,
  LINKEDIN: Linkedin,
  TWITTER: Twitter,
  WHATSAPP: MessageCircle,
  TIKTOK: MessageCircle,
};

// Componente de verificação 
const VerifiedBadge = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="8" cy="8" r="8" fill="#0095F6"/>
    <path
      d="M11.5 6.5a.75.75 0 0 0-1.036-.248l-2.464 1.65-.87-1.218a.75.75 0 0 0-1.225.873l1.3 1.82a.75.75 0 0 0 1.129.076l3.25-2.703a.75.75 0 0 0-.084-1.25z"
      fill="#fff"
    />
  </svg>
);

interface MinimalTemplateProps {
  page: {
    id: string;
    title: string;
    subtitle: string | null;
    avatarUrl: string | null;
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
        address?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
      };
      order: number;
    }>;
    socialLinks: Array<{
      id: string;
      platform: keyof typeof PLATFORM_ICONS;
      url: string;
    }>;
    user: {
      id: string;
      name: string;
      image: string | null;
      specialty: string | null;
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

  // Ajustar as cores
  const primaryColor = page.primaryColor;

  return (
    <div className="min-h-screen bg-white py-16 px-4 sm:px-6">
      <div className="max-w-lg mx-auto space-y-10">
        {/* Header - Design minimalista profissional */}
        <div className="text-center space-y-5">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <img
              src={page.avatarUrl || page.user.image || '/default-avatar.png'}
              alt={page.user.name}
              className="w-full h-full object-cover rounded-full shadow-md"
            />
          </div>
          <h1 className="text-2xl font-medium tracking-tight text-gray-800 flex items-center justify-center gap-2">
            {page.user.name}
            <span className="ml-1">
              <VerifiedBadge />
            </span>
          </h1>
          {page.user.specialty && (
            <p className="text-gray-600 text-base font-normal">{page.user.specialty}</p>
          )}
          {page.subtitle && (
            <p className="text-gray-500 text-sm max-w-sm mx-auto mt-2">{page.subtitle}</p>
          )}
        </div>

        {/* Content Blocks - Design minimalista profissional */}
        <div className="space-y-4">
          {page.blocks.map((block) => {
            if (block.type === 'BUTTON') {
              return (
                <Button
                  key={block.id}
                  className="w-full py-3 text-base font-medium rounded-md shadow-sm hover:shadow-md transition-all duration-300"
                  style={{
                    backgroundColor: primaryColor,
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
                    className="w-full py-3 text-base font-medium rounded-md shadow-sm hover:shadow-md transition-all duration-300"
                    style={{
                      backgroundColor: primaryColor,
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
                  className="bg-gray-50 rounded-md p-5 shadow-sm border border-gray-100"
                >
                  <h2 
                    className="text-base font-medium mb-4"
                    style={{ color: primaryColor }}
                  >
                    {block.content.title}
                  </h2>
                  <form onSubmit={(e) => handleSubmit(e, block)} className="space-y-3">
                    <div>
                      <Label htmlFor="name" className="text-sm text-gray-600">Nome</Label>
                      <Input 
                        id="name" 
                        name="name"
                        placeholder="Seu nome completo"
                        className="mt-1 text-sm"
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
                        className="mt-1 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm text-gray-600">WhatsApp</Label>
                      <Input 
                        id="phone" 
                        name="phone"
                        placeholder="(00) 00000-0000"
                        className="mt-1 text-sm"
                        required
                      />
                    </div>
                    <Button 
                      type="submit"
                      className="w-full mt-2 font-medium"
                      style={{
                        backgroundColor: primaryColor,
                        color: 'white',
                      }}
                    >
                      Enviar
                    </Button>
                  </form>
                </div>
              );
            }

            if (block.type === 'ADDRESS') {
              // Criar um objeto de endereço para o LocationMap
              const addressObject: Address = {
                id: block.id,
                name: block.content.city || 'Location',
                address: `${block.content.address}, ${block.content.city}, ${block.content.state} ${block.content.zipCode}, ${block.content.country}`,
                isDefault: true
              };
              
              return (
                <div
                  key={block.id}
                  className="bg-gray-50 rounded-md p-5 shadow-sm border border-gray-100"
                >
                  <h2 
                    className="text-base font-medium mb-4 flex items-center gap-2"
                    style={{ color: primaryColor }}
                  >
                    <MapPin size={16} />
                    {block.content.city || 'Location'}
                  </h2>
                  <LocationMap 
                    addresses={[addressObject]} 
                    primaryColor={primaryColor}
                    height="180px"
                  />
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Social Links - Design minimalista profissional */}
        {page.socialLinks.length > 0 && (
          <div className="flex justify-center gap-4 mt-8">
            {page.socialLinks.map((link) => {
              const Icon = PLATFORM_ICONS[link.platform] || MessageCircle;
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  <Icon className="h-5 w-5" />
                </a>
              );
            })}
          </div>
        )}

        {/* Footer - Design minimalista profissional */}
        <div className="text-center text-xs text-gray-400 pt-6">
          <p className="opacity-70">Created with Med1</p>
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