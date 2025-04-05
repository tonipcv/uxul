'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Logo } from '@/components/ui/logo';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

interface Doctor {
  name: string;
  specialty: string;
  image: string | null;
  email?: string;
}

// Componente interno que usa useSearchParams
function DrJoaoContent() {
  const searchParams = useSearchParams();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [interest, setInterest] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoadingDoctor, setIsLoadingDoctor] = useState(true);

  // Buscar informações do médico
  useEffect(() => {
    const fetchDoctorInfo = async () => {
      try {
        const userSlug = 'drjoao';
        
        // Verificar se já temos os dados em cache
        const cachedDoctor = localStorage.getItem(`doctor_${userSlug}`);
        if (cachedDoctor) {
          setDoctor(JSON.parse(cachedDoctor));
        }
        
        // Buscar dados atualizados da API
        const response = await fetch(`/api/users/${userSlug}`);
        if (response.ok) {
          const data = await response.json();
          setDoctor(data);
          // Salvar os dados no localStorage para futuras visitas
          localStorage.setItem(`doctor_${userSlug}`, JSON.stringify(data));
        } else {
          console.error('Erro ao buscar médico:', await response.json());
        }
      } catch (error) {
        console.error('Erro ao buscar informações do médico:', error);
      } finally {
        setIsLoadingDoctor(false);
      }
    };

    fetchDoctorInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!name || !phone) {
      setError('Por favor, preencha todos os campos obrigatórios');
      setIsLoading(false);
      return;
    }

    try {
      // Capturar parâmetros UTM da URL
      const utmSource = searchParams.get('utm_source') || localStorage.getItem('utm_source') || 'direct';
      const utmMedium = searchParams.get('utm_medium') || localStorage.getItem('utm_medium') || '';
      const utmCampaign = searchParams.get('utm_campaign') || localStorage.getItem('utm_campaign') || '';
      const utmTerm = searchParams.get('utm_term') || localStorage.getItem('utm_term') || '';
      const utmContent = searchParams.get('utm_content') || localStorage.getItem('utm_content') || '';
      
      // Salvar os parâmetros UTM no localStorage para persistência
      if (typeof window !== 'undefined') {
        if (searchParams.get('utm_source')) localStorage.setItem('utm_source', utmSource);
        if (searchParams.get('utm_medium')) localStorage.setItem('utm_medium', utmMedium);
        if (searchParams.get('utm_campaign')) localStorage.setItem('utm_campaign', utmCampaign);
        if (searchParams.get('utm_term')) localStorage.setItem('utm_term', utmTerm);
        if (searchParams.get('utm_content')) localStorage.setItem('utm_content', utmContent);
      }
      
      // Manter o campo source para compatibilidade
      let source = utmSource;
      if (utmMedium) source += `_${utmMedium}`;
      if (utmCampaign) source += `_${utmCampaign}`;

      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          interest,
          userSlug: 'drjoao',
          indicationSlug: null,
          source,
          utmSource,
          utmMedium,
          utmCampaign,
          utmTerm,
          utmContent
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao enviar seus dados');
      }

      setSuccess(true);
      
      // Limpar os parâmetros UTM após conversão bem-sucedida
      if (typeof window !== 'undefined') {
        localStorage.removeItem('utm_source');
        localStorage.removeItem('utm_medium');
        localStorage.removeItem('utm_campaign');
        localStorage.removeItem('utm_term');
        localStorage.removeItem('utm_content');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao enviar seus dados');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white p-4 md:p-8">
        <div className="w-full max-w-3xl mx-auto">
          <div className="grid grid-cols-1 gap-6">
            <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <h2 className="text-xl font-medium tracking-wide text-gray-800">Obrigado!</h2>
                <p className="text-gray-600">
                  {doctor?.name ? `${doctor.name} receberá seus dados` : 'Seus dados foram enviados'} e entrará em contato em breve.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6 text-center text-xs text-gray-400">
            Powered by <span className="text-blue-700 font-medium">med1.app</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white p-4 md:p-8">
      <div className="w-full max-w-4xl mx-auto">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Doctor Profile Card - Span 1 column on mobile, 1 column on desktop */}
          <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden md:col-span-1">
            <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
              {doctor?.image ? (
                <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-200 shadow-sm">
                  <Image 
                    src={doctor.image} 
                    alt={doctor.name || 'Médico'} 
                    width={96} 
                    height={96}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center text-3xl font-light text-blue-700">
                  {doctor?.name?.charAt(0) || (isLoadingDoctor ? '?' : 'J')}
                </div>
              )}
              
              <div className="text-center">
                <h2 className="text-xl font-medium text-gray-800">
                  {doctor?.name || (isLoadingDoctor ? 'Carregando...' : 'Dr. João')}
                </h2>
                <p className="text-sm font-medium text-gray-600">
                  {doctor?.specialty || (isLoadingDoctor ? '' : 'Médico')}
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Welcome Message Card - Span 1 column on mobile, 2 columns on desktop */}
          <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden md:col-span-2">
            <CardContent className="p-6">
              <div className="bg-blue-50 p-5 rounded-xl">
                <h3 className="text-xl font-medium text-gray-800 mb-2">Bem-vindo!</h3>
                <p className="text-gray-600">
                  {doctor?.name 
                    ? `${doctor.name} está disponível para agendar sua consulta` 
                    : 'Agende sua consulta'}
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Form Card - Span full width */}
          <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden md:col-span-3">
            <CardHeader className="pb-0 pt-6 px-6">
              <h3 className="text-lg font-medium text-gray-800">Agende sua consulta</h3>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-gray-600">Nome</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="border-gray-200 focus:border-blue-700 focus:ring-blue-50 text-gray-800 placeholder:text-gray-500"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-gray-600">Telefone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="border-gray-200 focus:border-blue-700 focus:ring-blue-50 text-gray-800 placeholder:text-gray-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="interest" className="text-gray-600">Interesse</Label>
                  <Select value={interest} onValueChange={setInterest}>
                    <SelectTrigger className="border-gray-200 bg-white focus:border-blue-700 focus:ring-blue-50 text-gray-800 [&_[data-placeholder]]:text-gray-500 data-[state=open]:border-blue-700">
                      <SelectValue placeholder="Selecione seu interesse" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 shadow-md">
                      <SelectItem value="consulta" className="text-gray-800 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700">Consulta</SelectItem>
                      <SelectItem value="avaliacao" className="text-gray-800 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700">Avaliação</SelectItem>
                      <SelectItem value="exames" className="text-gray-800 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700">Exames</SelectItem>
                      <SelectItem value="outros" className="text-gray-800 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {error && (
                  <div className="text-red-500 text-sm bg-red-50 py-2 px-3 rounded">{error}</div>
                )}
                
                {/* Mensagem LGPD */}
                <div className="flex items-start space-x-2 text-xs text-gray-500 bg-gray-50 p-3 rounded">
                  <ShieldCheckIcon className="h-4 w-4 flex-shrink-0 text-blue-700" />
                  <span>Seus dados estão protegidos de acordo com a LGPD (Lei Geral de Proteção de Dados) e serão utilizados apenas para contato.</span>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </span>
                  ) : "Quero ser atendido"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-400">
          Powered by <span className="text-blue-700 font-medium">med1.app</span>
        </div>
      </div>
    </div>
  );
}

// Componente principal com Suspense
export default function DrJoaoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div>
      </div>
    }>
      <DrJoaoContent />
    </Suspense>
  );
} 