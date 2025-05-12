'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import ClassicTemplate from '@/components/pages/templates/ClassicTemplate';
import ModernTemplate from '@/components/pages/templates/ModernTemplate';
import MinimalTemplate from '@/components/pages/templates/MinimalTemplate';

type SocialPlatform = 'INSTAGRAM' | 'WHATSAPP' | 'YOUTUBE' | 'FACEBOOK' | 'LINKEDIN' | 'TIKTOK' | 'TWITTER';

interface ReferralPageProps {
  referral: {
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

  // Choose template based on layout
  const pageContent = {
    ...referral.page,
    user: {
      ...referral.user,
      image: referral.user.image || '',
    },
  };

  switch (referral.page.layout) {
    case 'modern':
      return <ModernTemplate page={pageContent} />;
    case 'minimal':
      return <MinimalTemplate page={pageContent} />;
    case 'classic':
    default:
      return <ClassicTemplate page={pageContent} />;
  }
};

export default ReferralPage; 