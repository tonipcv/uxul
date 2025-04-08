'use client';

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  PlusIcon, 
  ClipboardIcon, 
  QrCodeIcon,
  ShareIcon,
  LinkIcon,
  ChevronRightIcon,
  ArrowTrendingUpIcon,
  UserIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface IndicationCount {
  events: number;
  leads: number;
  converted: number;
}

interface IndicationStats {
  clicks: number;
  leads: number;
  conversionRate: number;
  period: string;
}

interface Indication {
  id: string;
  slug: string;
  name?: string;
  createdAt: string;
  _count?: IndicationCount;
  stats?: IndicationStats;
  leads?: Array<{
    id: string;
    patient?: {
      id: string;
      name: string;
      email: string;
      phone: string;
    };
  }>;
}

export default function IndicationsPage() {
  const { data: session } = useSession();
  const [newIndication, setNewIndication] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [generatedSlug, setGeneratedSlug] = useState('');
  const [indications, setIndications] = useState<Indication[]>([]);
  const [baseUrl, setBaseUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userSlug, setUserSlug] = useState('');
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [dashboardData, setDashboardData] = useState<{ 
    totalLeads: number;
    totalIndications: number;
    totalClicks: number;
  } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    // Marcador de renderização client-side para evitar problemas de hidratação
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
    
    if (session?.user?.id) {
      fetchIndications();
      fetchUserProfile();
      fetchDashboardData();
    }
  }, [session, isClient]);

  const fetchUserProfile = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/users/profile?userId=${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.slug) {
          setUserSlug(data.slug);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
    }
  };

  const fetchIndications = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/indications?withStats=true`);
      if (response.ok) {
        const data = await response.json();
        setIndications(data);
        
        // Calcular totais diretamente dos dados
        const totalLeads = data.reduce((acc: number, curr: any) => acc + (curr._count?.leads || 0), 0);
        const totalClicks = data.reduce((acc: number, curr: any) => acc + (curr._count?.events || 0), 0);
        
        setTotalLeads(totalLeads);
        setTotalClicks(totalClicks);
      }
    } catch (error) {
      console.error('Erro ao buscar indicações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as indicações",
        variant: "destructive"
      });
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    }
  };

  const handleGenerateSlug = async () => {
    if (!newIndication.trim() || !session?.user?.id) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/slugify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          name: newIndication
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setGeneratedSlug(data.slug);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível gerar o slug",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao gerar slug:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateIndication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIndication.trim() || !session?.user?.id) return;
    if (!patientName.trim() || !patientEmail.trim() || !patientPhone.trim()) {
      toast({
        title: "Erro",
        description: "Preencha todos os dados do paciente",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Se não gerou slug ainda, precisamos gerar
      let slug = generatedSlug;
      if (!slug) {
        const response = await fetch('/api/slugify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: session.user.id,
            name: newIndication
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          slug = data.slug;
        } else {
          throw new Error('Não foi possível gerar o slug');
        }
      }
      
      // Criar a indicação com os dados do paciente
      const response = await fetch('/api/indications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newIndication,
          patientName,
          patientEmail,
          patientPhone
        })
      });
      
      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Link de indicação criado com sucesso",
        });
        setNewIndication('');
        setPatientName('');
        setPatientEmail('');
        setPatientPhone('');
        setGeneratedSlug('');
        fetchIndications();
      } else {
        const errorData = await response.json();
        toast({
          title: "Erro",
          description: errorData.error || "Não foi possível criar a indicação",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao criar indicação:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar a indicação",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (isClient && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast({
        title: "Link copiado",
        description: "Link copiado para a área de transferência",
      });
    }
  };

  const shareOnWhatsApp = (link: string) => {
    // Adicionar UTMs ao compartilhar via WhatsApp para rastreamento
    const fullLink = `${baseUrl}/${userSlug}/${link.split('/').pop()}`;
    const linkWithUtm = `${fullLink}?utm_source=whatsapp&utm_medium=share&utm_campaign=indication`;
    // Garantir que só execute no cliente
    if (isClient && typeof window !== 'undefined') {
      window.open(`https://wa.me/?text=Olha esse link: ${encodeURIComponent(linkWithUtm)}`, '_blank');
    }
  };

  // Formatar link sem https://
  const formatLink = (url: string) => {
    return url.replace(/^https?:\/\//, '');
  };

  // Carregar dados imediatamente após montagem do componente
  useEffect(() => {
    if (session?.user?.id) {
      fetchIndications();
      fetchUserProfile();
      fetchDashboardData();
    }
  }, [session?.user?.id]);

  // Atualizar dados periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      if (session?.user?.id) {
        fetchIndications();
        fetchDashboardData();
      }
    }, 30000); // Atualizar a cada 30 segundos

    return () => clearInterval(interval);
  }, [session?.user?.id]);

  // Não renderizar nada no servidor para evitar erros de hidratação
  if (!isClient) {
    return null;
  }
  
  return (
    <div className="min-h-[100dvh] bg-gray-100 pt-20 pb-24 md:pt-12 md:pb-16 px-4">
      <div className="container mx-auto pl-4 md:pl-8 lg:pl-16 max-w-[95%] md:max-w-[90%] lg:max-w-[85%]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-[-0.03em] font-inter">Indicações</h1>
            <p className="text-xs md:text-sm text-gray-600 tracking-[-0.03em] font-inter">Gerencie suas indicações</p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="mt-2 md:mt-0 bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg-gray-800/10 text-xs"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nova Indicação
          </Button>
        </div>

        <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-sm md:text-base font-bold text-gray-900 tracking-[-0.03em] font-inter">Links de Indicação</CardTitle>
            <CardDescription className="text-xs text-gray-500 tracking-[-0.03em] font-inter">
              Gerencie seus links de indicação
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Nome</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Link</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Cliques</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Leads</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Pacientes</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Conversão</th>
                    <th className="py-2 px-3 text-right text-xs font-medium text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {indications.map((indication) => (
                    <tr key={indication.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2 px-3">
                        <div className="font-medium text-sm text-gray-900">{indication.name}</div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="text-gray-600 text-xs">
                          {`${baseUrl}/${userSlug}/${indication.slug}`}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="text-gray-900 font-medium text-sm">
                          {indication._count?.events || 0}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="text-gray-900 font-medium text-sm">
                          {indication._count?.leads || 0}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="text-gray-900 font-medium text-sm">
                          {indication._count?.converted || 0}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="text-gray-900 font-medium text-sm">
                          {indication._count?.events 
                            ? `${Math.round((indication._count.converted / indication._count.events) * 100)}%`
                            : '0%'}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white border-sky-300 text-sky-700 hover:bg-sky-50 hover:border-sky-400 hover:text-sky-800 transition-colors text-xs h-7 px-2"
                            onClick={() => copyToClipboard(`${baseUrl}/${userSlug}/${indication.slug}`)}
                          >
                            <ClipboardIcon className="h-3 w-3 mr-1" />
                            Copiar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white border-sky-300 text-sky-700 hover:bg-sky-50 hover:border-sky-400 hover:text-sky-800 transition-colors text-xs h-7 px-2"
                            onClick={() => shareOnWhatsApp(`${baseUrl}/${userSlug}/${indication.slug}`)}
                          >
                            <ShareIcon className="h-3 w-3 mr-1" />
                            Compartilhar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="bg-white/90 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-3xl p-4">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-sm md:text-base font-bold text-gray-900 tracking-[-0.03em] font-inter">Criar Novo Link</CardTitle>
              <CardDescription className="text-xs text-gray-600 tracking-[-0.03em] font-inter">
                Gere um novo link de indicação
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={handleCreateIndication} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-xs font-medium text-gray-700 tracking-[-0.03em] font-inter">Nome do Link</Label>
                  <Input
                    id="name"
                    value={newIndication}
                    onChange={(e) => setNewIndication(e.target.value)}
                    placeholder="Ex: Consulta de Check-up"
                    className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-9 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="patientName" className="text-xs font-medium text-gray-700 tracking-[-0.03em] font-inter">Nome do Paciente</Label>
                  <Input
                    id="patientName"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Nome completo do paciente"
                    className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-9 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="patientEmail" className="text-xs font-medium text-gray-700 tracking-[-0.03em] font-inter">E-mail do Paciente</Label>
                  <Input
                    id="patientEmail"
                    type="email"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    placeholder="E-mail do paciente"
                    className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-9 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="patientPhone" className="text-xs font-medium text-gray-700 tracking-[-0.03em] font-inter">Telefone do Paciente</Label>
                  <Input
                    id="patientPhone"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="Telefone do paciente"
                    className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-9 text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateSlug}
                    disabled={isGenerating}
                    className="bg-white/50 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl h-9 flex-1 text-xs"
                  >
                    {isGenerating ? (
                      <ArrowPathIcon className="h-3 w-3 animate-spin" />
                    ) : (
                      "Gerar Slug"
                    )}
                  </Button>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-9 flex-1 text-xs"
                  >
                    {isLoading ? (
                      <ArrowPathIcon className="h-3 w-3 animate-spin" />
                    ) : (
                      "Criar Link"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-2xl p-4">
            {/* Modal de edição */}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 