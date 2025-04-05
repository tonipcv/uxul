'use client';

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import Image from "next/image";
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

interface Doctor {
  name: string;
  specialty?: string;
  email?: string;
  image?: string;
}

export default function DarkTemplatePage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Buscar informações do médico
  useEffect(() => {
    const fetchDoctorInfo = async () => {
      try {
        // Define o slug padrão se não for fornecido
        const slugToFetch = params.slug || 'default';
        
        // Verificar se já temos os dados em cache
        const cachedDoctor = localStorage.getItem(`doctor_${slugToFetch}`);
        if (cachedDoctor) {
          setDoctor(JSON.parse(cachedDoctor));
        }
        
        // Buscar dados atualizados da API
        const response = await fetch(`/api/users/${slugToFetch}`);
        if (response.ok) {
          const data = await response.json();
          setDoctor(data);
          // Salvar os dados no localStorage para futuras visitas
          localStorage.setItem(`doctor_${slugToFetch}`, JSON.stringify(data));
        }
      } catch (error) {
        console.error('Erro ao buscar informações do médico:', error);
      }
    };

    fetchDoctorInfo();
  }, [params.slug]);
  
  // Rastrear a fonte do lead (UTM)
  const utmSource = searchParams.get('utm_source');
  const utmMedium = searchParams.get('utm_medium');
  const utmCampaign = searchParams.get('utm_campaign');
  const source = searchParams.get('source');
  
  // Rastrear o evento de clique na página
  useEffect(() => {
    const trackPageView = async () => {
      try {
        const slugToTrack = params.slug || 'default';
        const response = await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'view',
            slug: slugToTrack,
            utmSource,
            utmMedium,
            utmCampaign,
            source,
            page: 'profile',
          }),
        });
      } catch (error) {
        // Silenciosamente falhar
        console.error('Erro ao rastrear visualização:', error);
      }
    };

    trackPageView();
  }, [params.slug, utmSource, utmMedium, utmCampaign, source]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (!name || !phone) {
      setError('Por favor, preencha os campos obrigatórios.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/form-submission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          phone,
          utmSource,
          utmMedium,
          utmCampaign,
          source,
          indication: params.slug,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setName('');
        setPhone('');
        toast({
          title: "Enviado com sucesso!",
          description: "Entraremos em contato em breve.",
        });
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao enviar o formulário.');
      }
    } catch (error) {
      setError('Ocorreu um erro ao enviar o formulário. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-900 text-gray-100 p-4 md:p-8">
      <div className="w-full max-w-4xl mx-auto">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Doctor Profile Card - Span 1 column on mobile, 1 column on desktop */}
          <Card className="bg-gray-800 border border-gray-700 shadow-md rounded-xl overflow-hidden md:col-span-1">
            <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
              {doctor?.image ? (
                <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-600 shadow-lg">
                  <Image 
                    src={doctor.image} 
                    alt={doctor.name || 'Médico'} 
                    width={96} 
                    height={96}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-3xl font-light text-blue-400">
                  {doctor?.name?.charAt(0) || ''}
                </div>
              )}
              
              <div className="text-center">
                <h2 className="text-xl font-medium text-white flex items-center justify-center gap-1">
                  {doctor?.name || 'Carregando...'}
                  <CheckCircleSolid className="h-5 w-5 text-blue-400" />
                </h2>
                <p className="text-sm font-medium text-gray-400">
                  {doctor?.specialty || ''}
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Welcome Message Card - Span 1 column on mobile, 2 columns on desktop */}
          <Card className="bg-gray-800 border border-gray-700 shadow-md rounded-xl overflow-hidden md:col-span-2">
            <CardContent className="p-6">
              <div className="bg-gray-700 p-5 rounded-xl">
                <h3 className="text-xl font-medium text-white mb-2">Bem-vindo!</h3>
                <p className="text-gray-300">
                  {doctor?.name 
                    ? `${doctor.name} está disponível para agendar sua consulta` 
                    : 'Agende sua consulta'}
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Form Card - Span full width */}
          <Card className="bg-gray-800 border border-gray-700 shadow-md rounded-xl overflow-hidden md:col-span-3">
            <CardHeader className="pb-0 pt-6 px-6">
              <h3 className="text-lg font-medium text-white">Agende sua consulta</h3>
            </CardHeader>
            <CardContent className="p-6">
              {success ? (
                <div className="bg-blue-900/30 border border-blue-800/50 rounded-lg p-4 text-blue-300">
                  <h4 className="text-lg font-medium mb-2">Obrigado pelo seu contato!</h4>
                  <p className="text-sm">Recebemos sua solicitação e entraremos em contato em breve.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-900/30 border border-red-800/50 text-red-300 p-4 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-300">Nome completo *</Label>
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="Seu nome completo"
                      required
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-blue-600 focus:ring-blue-600/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-300">WhatsApp *</Label>
                    <Input 
                      id="phone" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="(00) 00000-0000"
                      required
                      className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-blue-600 focus:ring-blue-600/20"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    {isLoading ? 'Enviando...' : 'Solicitar Consulta'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 