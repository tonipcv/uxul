'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from '@/components/ui/logo';
import { ShieldCheckIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

// Importar os templates disponíveis
import DefaultTemplate from '@/components/templates/default';
import DarkTemplate from '@/components/templates/dark';

interface Doctor {
  name: string;
  specialty?: string;
  email?: string;
  image?: string;
  pageTemplate?: string;
}

// Este é o roteador de template que decidirá qual template renderizar
export default function DoctorPage() {
  const params = useParams<{ userSlug: string }>();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [template, setTemplate] = useState<string>('default');

  // Buscar informações do médico incluindo o template preferido
  useEffect(() => {
    const fetchDoctorInfo = async () => {
      try {
        setIsLoading(true);
        // Define o userSlug padrão se não for fornecido
        const userSlugToFetch = params.userSlug || 'default';
        
        // Buscar dados do médico incluindo o template preferido
        const response = await fetch(`/api/users/${userSlugToFetch}?includeTemplate=true`);
        if (response.ok) {
          const data = await response.json();
          setDoctor(data);
          // Usar o template do médico ou o padrão se não estiver definido
          setTemplate(data.pageTemplate || 'default');
        }
      } catch (error) {
        console.error('Erro ao buscar informações do médico:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctorInfo();
  }, [params.userSlug]);

  // Enquanto carrega, mostra um indicador de carregamento
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Renderizar o template apropriado baseado na preferência do médico
  switch (template) {
    case 'dark':
      return <DarkTemplate doctor={doctor} slug={params.userSlug as string} />;
    case 'default':
    default:
      return <DefaultTemplate doctor={doctor} slug={params.userSlug as string} />;
  }
} 