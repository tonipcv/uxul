'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Instagram, Youtube, Facebook, Linkedin, Twitter, MessageCircle, ArrowUpRight } from 'lucide-react';
import { BsPatchCheckFill } from 'react-icons/bs';
import { FormModal } from '@/components/FormModal';

interface BentoDarkTemplateProps {
  page: {
    id: string;
    title: string;
    subtitle: string | null;
    avatarUrl: string | null;
    primaryColor: string;
    blocks: Array<{
      id: string;
      type: 'BUTTON' | 'FORM';
      content: any;
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

const BentoDarkTemplate = ({ page }: BentoDarkTemplateProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFormBlock, setActiveFormBlock] = useState<any>(null);

  // Gerar cores para o gradiente baseado na cor primária
  const primaryColor = page.primaryColor || '#0070F3';
  const lighterColor = adjustColor(primaryColor, 40);
  const darkerColor = adjustColor(primaryColor, -40);

  return (
    <div 
      className="min-h-screen bg-[#0A0A0B] text-white py-12 px-4 sm:px-6"
      style={{ 
        backgroundImage: `
          radial-gradient(circle at 100% 100%, ${primaryColor}15 0%, transparent 25%),
          radial-gradient(circle at 0% 0%, ${primaryColor}15 0%, transparent 25%)
        `,
      }}
    >
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="relative w-28 h-28 mx-auto mb-6">
            <div 
              className="absolute inset-0 rounded-2xl animate-pulse"
              style={{ 
                background: `linear-gradient(135deg, ${lighterColor}40 0%, ${darkerColor}40 100%)`,
                filter: 'blur(20px)',
                transform: 'scale(1.1)',
              }}
            />
            <img
              src={page.avatarUrl || page.user.image || '/default-avatar.png'}
              alt={page.user.name}
              className="relative w-full h-full object-cover rounded-2xl border-2 border-white/10 shadow-2xl"
            />
          </div>
          <h1 className="text-2xl md:text-4xl font-light tracking-tight flex items-center justify-center gap-2">
            {page.user.name}
          </h1>
          {page.user.specialty && (
            <p className="text-lg md:text-2xl text-gray-200 font-medium tracking-wide">{page.user.specialty}</p>
          )}
          {page.subtitle && (
            <p className="text-base md:text-xl text-gray-300 mt-6 max-w-lg mx-auto">{page.subtitle}</p>
          )}
        </div>

        {/* Blocks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {page.blocks.map((block, index) => {
            if (block.type === 'BUTTON') {
              return (
                <Button
                  key={block.id}
                  className={cn(
                    "w-full h-full min-h-[100px] text-lg font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-2xl border border-white/10 text-white",
                    index % 3 === 0 ? "md:col-span-2" : ""
                  )}
                  style={{ 
                    background: `linear-gradient(135deg, ${primaryColor}40 0%, ${darkerColor}60 100%)`,
                    backdropFilter: 'blur(10px)',
                  }}
                  asChild
                >
                  <a
                    href={block.content.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative flex items-center justify-center w-full p-6 h-full text-white"
                  >
                    <span className="text-center z-10">{block.content.label}</span>
                    <ArrowUpRight className="absolute right-6 w-12 h-12 opacity-80" />
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
                      "w-full h-full min-h-[100px] text-lg font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] rounded-2xl border border-white/10 text-white",
                      index % 3 === 0 ? "md:col-span-2" : ""
                    )}
                    style={{ 
                      background: `linear-gradient(135deg, ${primaryColor}40 0%, ${darkerColor}60 100%)`,
                      backdropFilter: 'blur(10px)',
                    }}
                    onClick={() => {
                      setActiveFormBlock(block);
                      setIsModalOpen(true);
                    }}
                  >
                    <div className="relative flex items-center justify-center w-full p-6 h-full text-white">
                      <span className="text-center z-10">{block.content.title}</span>
                      <ArrowUpRight className="absolute right-6 w-12 h-12 opacity-80" />
                    </div>
                  </Button>
                );
              }

              return (
                <div
                  key={block.id}
                  className={cn(
                    "backdrop-blur-md rounded-2xl p-8 border border-white/10",
                    index % 3 === 0 ? "md:col-span-2" : ""
                  )}
                  style={{ 
                    background: `linear-gradient(135deg, ${lighterColor}10 0%, ${darkerColor}10 100%)`,
                  }}
                >
                  <h2 
                    className="text-2xl font-semibold mb-6"
                    style={{ color: primaryColor }}
                  >
                    {block.content.title}
                  </h2>
                  {/* Form implementation */}
                  <p className="text-gray-400">Form coming soon...</p>
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Social Links */}
        {page.socialLinks.length > 0 && (
          <div className="flex justify-center gap-6 pt-8">
            {page.socialLinks.map((link) => {
              const Icon = SOCIAL_ICONS[link.platform];
              return (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-xl transition-all duration-300 hover:scale-110 hover:-translate-y-1 bg-white/10 backdrop-blur-sm"
                >
                  <Icon className="w-7 h-7 text-white" />
                </a>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 pt-4">
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

export default BentoDarkTemplate; 