'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Instagram, Youtube, Facebook, Linkedin, Twitter, MessageCircle, MapPin } from 'lucide-react';
import { BsPatchCheckFill } from 'react-icons/bs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FormModal } from '@/components/FormModal';
import { LocationMap } from '@/components/ui/location-map';
import { Address } from '@/components/ui/address-manager';

interface CollorTemplateProps {
  page: {
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
  };
}

const SOCIAL_ICONS = {
  INSTAGRAM: Instagram,
  YOUTUBE: Youtube,
  FACEBOOK: Facebook,
  LINKEDIN: Linkedin,
  TWITTER: Twitter,
  WHATSAPP: MessageCircle,
};

// Função para ajustar a cor (tornar mais clara ou escura)
const adjustColor = (color: string, amount: number) => {
  return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
};

const CollorTemplate = ({ page }: CollorTemplateProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFormBlock, setActiveFormBlock] = useState<any>(null);

  // Gerar cores para o gradiente baseado na cor primária
  const primaryColor = page.primaryColor || '#000000';
  const lighterColor = adjustColor(primaryColor, 20);
  const darkerColor = adjustColor(primaryColor, -20);

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
    <div 
      className="min-h-screen text-gray-800 py-16 px-4 sm:px-6"
      style={{ 
        background: `linear-gradient(135deg, ${lighterColor}10 0%, ${darkerColor}10 100%)`,
      }}
    >
      <div className="max-w-lg mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div 
              className="absolute inset-0 rounded-full"
              style={{ 
                background: `linear-gradient(135deg, ${lighterColor} 0%, ${darkerColor} 100%)`,
                opacity: 0.1,
              }}
            />
            <img
              src={page.avatarUrl || page.user.image || '/default-avatar.png'}
              alt={page.user.name}
              className="relative w-full h-full object-cover rounded-full border-4 border-white shadow-lg"
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
            {page.user.name}
            <div className="rounded-full drop-shadow-[0_2px_4px_rgba(0,149,246,0.2)]">
              <BsPatchCheckFill size={24} style={{ color: primaryColor }} />
            </div>
          </h1>
          {page.user.specialty && (
            <p className="text-gray-600 text-lg font-medium">{page.user.specialty}</p>
          )}
          {page.subtitle && (
            <p className="text-gray-500 text-base">{page.subtitle}</p>
          )}
        </div>

        {/* Social Links */}
        {page.socialLinks.length > 0 && (
          <div className="flex justify-center gap-4">
            {page.socialLinks.map((link) => {
              const Icon = SOCIAL_ICONS[link.platform];
              return (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full transition-all duration-200 hover:scale-110"
                  style={{ 
                    background: `linear-gradient(135deg, ${lighterColor}20 0%, ${darkerColor}20 100%)`,
                    color: primaryColor,
                  }}
                >
                  <Icon className="w-5 h-5" />
                </a>
              );
            })}
          </div>
        )}

        {/* Blocks */}
        <div className="space-y-4">
          {page.blocks.map((block, index) => {
            if (block.type === 'BUTTON') {
              return (
                <Button
                  key={block.id}
                  className={cn(
                    "w-full py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-xl",
                  )}
                  style={{ 
                    background: `linear-gradient(135deg, ${lighterColor} 0%, ${darkerColor} 100%)`,
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
                    className={cn(
                      "w-full py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-xl",
                    )}
                    style={{ 
                      background: `linear-gradient(135deg, ${lighterColor} 0%, ${darkerColor} 100%)`,
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
                  className="backdrop-blur-sm rounded-xl p-8 shadow-xl"
                  style={{ 
                    background: `linear-gradient(135deg, ${lighterColor}10 0%, ${darkerColor}10 100%)`,
                    borderColor: `${primaryColor}20`,
                    borderWidth: '1px',
                  }}
                >
                  <h2 
                    className="text-2xl font-semibold mb-6"
                    style={{ color: primaryColor }}
                  >
                    {block.content.title}
                  </h2>
                  <form onSubmit={(e) => handleSubmit(e, block)} className="space-y-6">
                    <div>
                      <Label htmlFor="name" className="text-sm text-gray-400">Nome</Label>
                      <Input 
                        id="name" 
                        name="name"
                        placeholder="Seu nome completo"
                        className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm text-gray-400">Email</Label>
                      <Input 
                        id="email" 
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm text-gray-400">WhatsApp</Label>
                      <Input 
                        id="phone" 
                        name="phone"
                        placeholder="(00) 00000-0000"
                        className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                        required
                      />
                    </div>
                    <Button 
                      type="submit"
                      className={cn(
                        "w-full py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-xl",
                      )}
                      style={{ 
                        background: `linear-gradient(135deg, ${lighterColor} 0%, ${darkerColor} 100%)`,
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
                  className="backdrop-blur-sm rounded-xl p-8 shadow-xl"
                  style={{ 
                    background: `linear-gradient(135deg, ${lighterColor}10 0%, ${darkerColor}10 100%)`,
                    borderColor: `${primaryColor}20`,
                    borderWidth: '1px',
                  }}
                >
                  <h2 
                    className="text-2xl font-semibold mb-6 flex items-center gap-2"
                    style={{ color: primaryColor }}
                  >
                    <MapPin size={20} />
                    {block.content.city || 'Location'}
                  </h2>
                  <LocationMap 
                    addresses={[addressObject]} 
                    primaryColor={primaryColor}
                  />
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-400 pt-8">
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
          primaryColor={primaryColor}
          pipelineId={activeFormBlock.content.pipelineId}
          successPage={activeFormBlock.content.successPage}
        />
      )}
    </div>
  );
};

export default CollorTemplate; 