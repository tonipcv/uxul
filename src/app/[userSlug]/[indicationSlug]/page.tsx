'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
}

export default function IndicationPage() {
  const params = useParams<{ userSlug: string, indicationSlug: string }>();
  const searchParams = useSearchParams();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [interest, setInterest] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Buscar informações do médico
  useEffect(() => {
    const fetchDoctorInfo = async () => {
      try {
        const response = await fetch(`/api/users/${params.userSlug}`);
        if (response.ok) {
          const data = await response.json();
          setDoctor(data);
        }
      } catch (error) {
        console.error('Erro ao buscar informações do médico:', error);
      }
    };

    if (params.userSlug) {
      fetchDoctorInfo();
    }
  }, [params.userSlug]);

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
          userSlug: params.userSlug,
          indicationSlug: params.indicationSlug,
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
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-[500px] mx-auto bg-white border-gray-100 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="space-y-6 pb-6">
            <div className="flex justify-center">
              <Logo className="text-center text-turquoise" />
            </div>
            
            {/* Ícone de sucesso */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-medium tracking-wide text-gray-800">Obrigado!</h2>
              <p className="text-gray-600">
                {doctor?.name ? `${doctor.name} receberá seus dados` : 'Seus dados foram enviados'} e entrará em contato em breve.
              </p>
            </div>
          </CardHeader>
          <CardFooter className="pt-2 text-center text-xs text-gray-400">
            Powered by <span className="text-turquoise font-medium">med1.app</span>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-[500px] mx-auto bg-white border-gray-100 shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="space-y-6 pb-4">
          {/* Logo no topo */}
          <div className="flex justify-center">
            <Logo className="text-center text-turquoise" />
          </div>
          
          {/* Foto e detalhes do médico */}
          <div className="flex flex-col items-center space-y-3">
            {doctor?.image ? (
              <div className="w-20 h-20 rounded-full overflow-hidden border border-gray-100 shadow-sm">
                <Image 
                  src={doctor.image} 
                  alt={doctor.name || 'Médico'} 
                  width={80} 
                  height={80}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-light text-gray-500">
                {doctor?.name?.charAt(0) || ''}
              </div>
            )}
            <div className="text-center">
              <h2 className="text-xl font-medium text-gray-800">
                {doctor?.name || 'Carregando...'}
              </h2>
              <p className="text-sm font-medium text-gray-600">
                {doctor?.specialty || ''}
              </p>
            </div>
          </div>

          {/* Mensagem de boas-vindas */}
          <div className="text-center py-3 px-4 rounded-lg bg-gray-50">
            <p className="text-gray-600">
              {doctor?.name 
                ? `${doctor.name} te convidou para agendar sua avaliação gratuita` 
                : 'Você foi convidado para agendar sua avaliação gratuita'}
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-gray-600 text-sm">Nome</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="border-gray-200 focus:border-turquoise focus:ring-turquoise/10 h-10 rounded"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-gray-600 text-sm">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="border-gray-200 focus:border-turquoise focus:ring-turquoise/10 h-10 rounded"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="interest" className="text-gray-600 text-sm">Interesse</Label>
              <Select value={interest} onValueChange={setInterest}>
                <SelectTrigger className="border-gray-200 bg-white focus:border-turquoise focus:ring-turquoise/10 h-10 rounded text-gray-600">
                  <SelectValue placeholder="Selecione seu interesse" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-100">
                  <SelectItem value="consulta" className="text-gray-600 hover:bg-gray-50">Consulta</SelectItem>
                  <SelectItem value="avaliacao" className="text-gray-600 hover:bg-gray-50">Avaliação</SelectItem>
                  <SelectItem value="exames" className="text-gray-600 hover:bg-gray-50">Exames</SelectItem>
                  <SelectItem value="outros" className="text-gray-600 hover:bg-gray-50">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {error && (
              <div className="text-red-500 text-sm bg-red-50 py-2 px-3 rounded">{error}</div>
            )}
            
            {/* Mensagem LGPD */}
            <div className="flex items-start space-x-2 text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <ShieldCheckIcon className="h-4 w-4 flex-shrink-0 text-turquoise" />
              <span>Seus dados estão protegidos de acordo com a LGPD (Lei Geral de Proteção de Dados) e serão utilizados apenas para contato.</span>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-turquoise hover:bg-turquoise/90 text-white font-medium py-2.5 rounded transition-colors"
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
        
        <CardFooter className="pt-2 text-center text-xs text-gray-400">
          Powered by <span className="text-turquoise font-medium">med1.app</span>
        </CardFooter>
      </Card>
    </div>
  );
} 