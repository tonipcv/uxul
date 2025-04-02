'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
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

export default function DoctorPage() {
  const params = useParams<{ userSlug: string }>();
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
          indicationSlug: null, // Não há indicação, é o link principal
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
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-black to-zinc-900 px-4">
        <Card className="w-full max-w-[500px] mx-auto bg-black/20 border-white/10">
          <CardHeader className="space-y-6 pb-6">
            <div className="flex justify-center">
              <Logo className="text-center" />
            </div>
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-light tracking-wide">Obrigado!</h2>
              <p className="text-zinc-400 font-light">
                {doctor?.name ? `${doctor.name} receberá seus dados` : 'Seus dados foram enviados'} e entrará em contato em breve.
              </p>
            </div>
          </CardHeader>
          <CardFooter className="pt-4 text-center text-xs text-zinc-500">
            Powered by med1.app
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-black to-zinc-900 px-4 py-8">
      <Card className="w-full max-w-[500px] mx-auto bg-black/20 border-white/10">
        <CardHeader className="space-y-6 pb-4">
          {/* Logo no topo */}
          <div className="flex justify-center">
            <Logo className="text-center" />
          </div>
          
          {/* Foto e detalhes do médico */}
          <div className="flex flex-col items-center space-y-3">
            {doctor?.image ? (
              <div className="w-20 h-20 rounded-full overflow-hidden border border-white/20">
                <Image 
                  src={doctor.image} 
                  alt={doctor.name || 'Médico'} 
                  width={80} 
                  height={80}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center text-2xl font-light text-white">
                {doctor?.name?.charAt(0) || ''}
              </div>
            )}
            <div className="text-center">
              <h2 className="text-xl font-light tracking-wide text-white">
                {doctor?.name || 'Carregando...'}
              </h2>
              <p className="text-sm text-zinc-400 font-light">
                {doctor?.specialty || ''}
              </p>
            </div>
          </div>

          {/* Mensagem de boas-vindas */}
          <div className="text-center py-3 px-4 rounded-lg bg-black/30">
            <p className="text-zinc-300 font-light">
              {doctor?.name 
                ? `${doctor.name} está disponível para agendar sua consulta` 
                : 'Agende sua consulta'}
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-400 font-light">Nome</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-white/5 border-white/10 focus:border-blue-500/50 focus:ring-blue-500/10 font-light"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-zinc-400 font-light">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="bg-white/5 border-white/10 focus:border-blue-500/50 focus:ring-blue-500/10 font-light"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="interest" className="text-zinc-400 font-light">Interesse</Label>
              <Select value={interest} onValueChange={setInterest}>
                <SelectTrigger className="bg-white/5 border-white/10 focus:border-blue-500/50 focus:ring-blue-500/10 font-light">
                  <SelectValue placeholder="Selecione seu interesse" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  <SelectItem value="consulta">Consulta</SelectItem>
                  <SelectItem value="avaliacao">Avaliação</SelectItem>
                  <SelectItem value="exames">Exames</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {error && (
              <div className="text-red-400 text-sm font-light">{error}</div>
            )}
            
            {/* Mensagem LGPD */}
            <div className="flex items-start space-x-2 text-xs text-zinc-500">
              <ShieldCheckIcon className="h-4 w-4 flex-shrink-0" />
              <span>Seus dados estão protegidos de acordo com a LGPD (Lei Geral de Proteção de Dados) e serão utilizados apenas para contato.</span>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-blue-500/80 hover:bg-blue-500/90 text-white font-light py-6 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Enviando..." : "Quero agendar"}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="pt-0 text-center text-xs text-zinc-500">
          Powered by med1.app
        </CardFooter>
      </Card>
    </div>
  );
} 