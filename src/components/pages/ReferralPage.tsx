'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import ModernTemplate from './templates/ModernTemplate';
import MinimalTemplate from './templates/MinimalTemplate';
import ClassicTemplate from './templates/ClassicTemplate';
import CollorTemplate from './templates/CollorTemplate';

type SocialPlatform = 'INSTAGRAM' | 'WHATSAPP' | 'YOUTUBE' | 'FACEBOOK' | 'LINKEDIN' | 'TIKTOK' | 'TWITTER';

interface ReferralPageProps {
  referral: {
    id: string;
    slug: string;
    page: {
      id: string;
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
        platform: string;
        url: string;
      }>;
      user: {
        image: string;
        name: string;
        specialty?: string;
      };
    };
    patient: {
      id: string;
      name: string;
    };
    user: {
      id: string;
      name: string;
      image: string | null;
      specialty?: string;
    };
  };
}

interface PageContent {
  id: string;
  title: string;
  subtitle: string | null;
  avatarUrl: string | null;
  primaryColor: string;
  blocks: Array<{
    id: string;
    type: 'BUTTON' | 'FORM';
    content: any;
    order: number;
  }>;
  socialLinks: Array<{
    id: string;
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

const ReferralPage: React.FC<ReferralPageProps> = ({ referral }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          phone,
          email,
          referralId: referral.id,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setName('');
        setPhone('');
        setEmail('');
        toast({
          title: "Sucesso",
          description: "Seus dados foram enviados com sucesso!",
        });
      } else {
        const data = await response.json();
        setError(data.error || 'Ocorreu um erro ao enviar seus dados.');
        toast({
          title: "Erro",
          description: data.error || 'Ocorreu um erro ao enviar seus dados.',
          variant: "destructive"
        });
      }
    } catch (error) {
      setError('Ocorreu um erro ao enviar seus dados. Tente novamente.');
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao enviar seus dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pageContent: PageContent = {
    id: referral.page.id,
    title: referral.page.title,
    subtitle: referral.page.subtitle || null,
    avatarUrl: referral.page.avatarUrl || null,
    primaryColor: referral.page.primaryColor,
    blocks: referral.page.blocks.sort((a, b) => a.order - b.order).map(block => ({
      ...block,
      type: block.type as 'BUTTON' | 'FORM'
    })),
    socialLinks: referral.page.socialLinks.map(link => ({
      id: link.id,
      platform: link.platform as 'INSTAGRAM' | 'WHATSAPP' | 'YOUTUBE' | 'FACEBOOK' | 'LINKEDIN' | 'TWITTER',
      url: link.url
    })),
    user: {
      id: referral.user.id,
      name: referral.user.name,
      image: referral.user.image,
      specialty: referral.user.specialty || null
    },
  };

  // Convert layout to lowercase for case-insensitive comparison
  const layout = referral.page.layout.toLowerCase();

  switch (layout) {
    case 'modern':
      return <ModernTemplate page={pageContent} />;
    case 'minimal':
      return <MinimalTemplate page={pageContent} />;
    case 'collor':
      return <CollorTemplate page={pageContent} />;
    case 'classic':
    default:
      return <ClassicTemplate page={pageContent} />;
  }
};

export default ReferralPage; 