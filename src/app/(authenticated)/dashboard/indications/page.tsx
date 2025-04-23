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
  ArrowPathIcon,
  TrashIcon,
  PencilIcon
} from "@heroicons/react/24/outline";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Edit, Share2, Copy, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

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
  type: string;
  chatbotFlowId?: string;
}

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [currentIndication, setCurrentIndication] = useState<Indication | null>(null);

  // Variáveis adicionais para chatbot
  const [showCreateChatbotModal, setShowCreateChatbotModal] = useState(false);
  const [chatbotName, setChatbotName] = useState('');
  const [chatbotGreeting, setChatbotGreeting] = useState('');
  const [chatbotWelcomeMessage, setChatbotWelcomeMessage] = useState('');

  const router = useRouter();

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
      fetchPatients();
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

  const fetchPatients = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch('/api/patients');
      if (response.ok) {
        const { data } = await response.json();
        setPatients(data);
      }
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de pacientes",
        variant: "destructive"
      });
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
    if (!newIndication.trim() || !session?.user?.id || !selectedPatient) {
      toast({
        title: "Erro",
        description: "Selecione um paciente e defina um nome para a indicação",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Criar a indicação vinculada ao paciente selecionado
      const indicationResponse = await fetch('/api/indications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newIndication,
          patientId: selectedPatient.id
        })
      });
      
      if (indicationResponse.ok) {
        toast({
          title: "Sucesso",
          description: "Link de indicação criado com sucesso",
        });
        setNewIndication('');
        setSelectedPatient(null);
        setShowCreateModal(false);
        fetchIndications();
      } else {
        const errorData = await indicationResponse.json();
        throw new Error(errorData.error || "Não foi possível criar a indicação");
      }
    } catch (error) {
      console.error('Erro ao criar indicação:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao criar a indicação",
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

  // Adicionar useEffect para filtrar pacientes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPatients(patients);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = patients.filter(
      patient => 
        patient.name.toLowerCase().includes(query) ||
        patient.email.toLowerCase().includes(query) ||
        patient.phone.toLowerCase().includes(query)
    );
    setFilteredPatients(filtered);
  }, [searchQuery, patients]);

  // Não renderizar nada no servidor para evitar erros de hidratação
  if (!isClient) {
    return null;
  }
  
  const handleDeleteLink = async (indication: Indication) => {
    if (!indication.slug) {
      console.error('Slug da indicação não fornecido');
      return;
    }

    console.log('Iniciando exclusão da indicação:', indication.slug);
    
    try {
      const url = `/api/indications/${indication.slug}`;
      console.log('Enviando requisição DELETE para:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      console.log('Status da resposta:', response.status);
      
      let responseData;
      try {
        responseData = await response.json();
        console.log('Dados da resposta:', responseData);
      } catch (e) {
        console.error('Erro ao parsear resposta:', e);
        responseData = null;
      }

      if (response.ok) {
        console.log('Exclusão bem-sucedida, atualizando estado local');
        setIndications(prev => prev.filter(ind => ind.id !== indication.id));
        setShowDeleteModal(false);
        setDeletingLinkId(null);
        
        toast({
          title: "Sucesso",
          description: "Link de indicação excluído com sucesso",
        });
      } else {
        const errorMessage = responseData?.error || 'Erro ao excluir link';
        console.error('Erro na resposta:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Erro detalhado ao excluir link:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível excluir o link. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const openDeleteModal = (indication: Indication) => {
    setDeletingLinkId(indication.id);
    setCurrentIndication(indication);
    setShowDeleteModal(true);
  };

  const handleCreateChatbot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatbotName.trim() || !session?.user?.id) {
      toast({
        title: "Erro",
        description: "O nome do chatbot é obrigatório",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Primeiro criar o fluxo de chatbot
      const flowResponse = await fetch('/api/chatbot-flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: chatbotName,
          description: 'Fluxo de chatbot criado através do painel'
        })
      });
      
      if (!flowResponse.ok) {
        const errorData = await flowResponse.json();
        throw new Error(errorData.error || "Não foi possível criar o fluxo de chatbot");
      }
      
      const flowData = await flowResponse.json();
      console.log("Fluxo criado com sucesso:", flowData);
      
      // Agora criar a indicação vinculada ao fluxo
      const response = await fetch('/api/indications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: chatbotName,
          type: 'chatbot',
          chatbotConfig: {
            name: chatbotName,
            greeting: chatbotGreeting || `Olá! Sou o assistente virtual do Dr. ${session?.user?.name}`,
            welcomeMessage: chatbotWelcomeMessage || 'Como posso ajudar você hoje?',
            collectDataInConversation: true,
            flowId: flowData.id
          },
          chatbotFlowId: flowData.id
        })
      });
      
      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Chatbot criado com sucesso! Acesse o editor de fluxo para personalizar as interações.",
        });
        setChatbotName('');
        setChatbotGreeting('');
        setChatbotWelcomeMessage('');
        setShowCreateChatbotModal(false);
        fetchIndications();
      } else {
        const errorData = await response.json();
        console.error("Erro na resposta da API de indicações:", errorData);
        throw new Error(errorData.error || "Não foi possível criar o chatbot");
      }
    } catch (error) {
      console.error('Erro ao criar chatbot:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao criar o chatbot",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gray-100 pt-20 pb-24 md:pt-12 md:pb-16 px-2 sm:px-4">
      <div className="container mx-auto px-0 sm:pl-4 md:pl-8 lg:pl-16 max-w-full sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-[-0.03em] font-inter">Indicações</h1>
            <p className="text-xs md:text-sm text-gray-600 tracking-[-0.03em] font-inter">Gerencie suas indicações</p>
          </div>
          <div className="w-full md:w-auto mt-2 md:mt-0 flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="w-full md:w-auto bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg-gray-800/10 text-xs"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Nova Indicação
            </Button>
            <Button 
              onClick={() => setShowCreateChatbotModal(true)}
              className="w-full md:w-auto bg-blue-600 border-0 shadow-[0_4px_12px_rgba(59,130,246,0.3)] hover:shadow-[0_8px_24px_rgba(59,130,246,0.4)] transition-all duration-300 rounded-2xl text-white hover:bg-blue-700 text-xs"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Criar Chatbot
            </Button>
          </div>
        </div>

        <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-sm md:text-base font-bold text-gray-900 tracking-[-0.03em] font-inter">Links de Indicação</CardTitle>
            <CardDescription className="text-xs text-gray-500 tracking-[-0.03em] font-inter">
              Gerencie seus links de indicação
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <div className="overflow-x-auto -mx-4 px-4">
              {/* Mobile view for small screens */}
              <div className="md:hidden space-y-4">
                {indications.map((indication) => (
                  <div key={indication.id} className="bg-white p-3 rounded-xl shadow-sm">
                    <div className="font-medium text-sm text-gray-900 mb-1">{indication.name}</div>
                    <div className="text-gray-600 text-xs mb-2 truncate">
                      {`${baseUrl}/${userSlug}/${indication.slug}`}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Leads</div>
                        <div className="text-gray-900 font-medium text-sm">
                          {indication._count?.leads || 0}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Conversão</div>
                        <div className="text-gray-900 font-medium text-sm">
                          {indication._count?.events 
                            ? `${Math.round((indication._count.converted / indication._count.events) * 100)}%`
                            : '0%'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white border-sky-300 text-sky-700 hover:bg-sky-50 hover:border-sky-400 hover:text-sky-800 transition-colors text-xs h-7 px-2 flex-1"
                        onClick={() => copyToClipboard(`${baseUrl}/${userSlug}/${indication.slug}`)}
                      >
                        <ClipboardIcon className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white border-sky-300 text-sky-700 hover:bg-sky-50 hover:border-sky-400 hover:text-sky-800 transition-colors text-xs h-7 px-2 flex-1"
                        onClick={() => shareOnWhatsApp(`${baseUrl}/${userSlug}/${indication.slug}`)}
                      >
                        <ShareIcon className="h-3 w-3 mr-1" />
                        Compartilhar
                      </Button>
                      {indication.type === 'chatbot' && indication.chatbotFlowId && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white border-yellow-300 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-400 hover:text-yellow-800 transition-colors text-xs h-7 px-2"
                          onClick={() => router.push(`/dashboard/chatbot-editor/${indication.chatbotFlowId}`)}
                        >
                          <PencilIcon className="h-3 w-3 mr-1" />
                          Editar Chatbot
                        </Button>
                      )}
                      <Button
                        onClick={() => openDeleteModal(indication)}
                        variant="outline"
                        size="sm"
                        className="bg-white border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 hover:text-red-800 transition-colors text-xs h-7 px-2"
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop table view */}
              <table className="w-full hidden md:table">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Nome</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Link</th>
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
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white border-sky-300 text-sky-700 hover:bg-sky-50 hover:border-sky-400 hover:text-sky-800 transition-colors text-xs h-7 px-2"
                            onClick={() => shareOnWhatsApp(`${baseUrl}/${userSlug}/${indication.slug}`)}
                          >
                            <Share2 className="h-3 w-3 mr-1" />
                            Compartilhar
                          </Button>
                          {indication.type === 'chatbot' && indication.chatbotFlowId && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-white border-yellow-300 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-400 hover:text-yellow-800 transition-colors text-xs h-7 px-2"
                              onClick={() => router.push(`/dashboard/chatbot-editor/${indication.chatbotFlowId}`)}
                            >
                              <PencilIcon className="h-3 w-3 mr-1" />
                              Editar Chatbot
                            </Button>
                          )}
                          <Button
                            onClick={() => openDeleteModal(indication)}
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors text-xs h-7 w-7 p-0"
                          >
                            <TrashIcon className="h-3 w-3" />
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
          <DialogContent className="bg-white border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-none rounded-3xl p-4 w-[95vw] max-w-md mx-auto">
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
                  <Label className="text-xs font-medium text-gray-700 tracking-[-0.03em] font-inter">Selecionar Paciente</Label>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className="w-full justify-between bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-9 text-sm"
                      >
                        {selectedPatient ? selectedPatient.name : "Selecione um paciente..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-[var(--radix-popover-trigger-width)] p-0 bg-white shadow-lg border border-gray-200 rounded-xl z-[9999]" 
                      align="start" 
                      sideOffset={4}
                    >
                      <Command>
                        <CommandInput 
                          placeholder="Buscar paciente..." 
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                          className="h-9 border-0 focus:ring-0"
                        />
                        <CommandEmpty className="p-2 text-sm text-gray-500">
                          Nenhum paciente encontrado.
                        </CommandEmpty>
                        <CommandGroup className="max-h-[200px] overflow-auto">
                          {filteredPatients.map((patient) => (
                            <CommandItem
                              key={patient.id}
                              value={patient.name}
                              className="cursor-pointer hover:bg-gray-50 py-2 px-2 flex items-center gap-2"
                              onSelect={() => {
                                setSelectedPatient(patient);
                                setOpenCombobox(false);
                                setSearchQuery("");
                              }}
                            >
                              <Check
                                className={cn(
                                  "h-4 w-4 flex-shrink-0",
                                  selectedPatient?.id === patient.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col flex-1">
                                <span className="font-medium">{patient.name}</span>
                                <span className="text-xs text-gray-500">{patient.email}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedPatient && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
                      <p><strong>Email:</strong> {selectedPatient.email}</p>
                      <p><strong>Telefone:</strong> {selectedPatient.phone}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
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
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-9 flex-1 text-xs mt-2 sm:mt-0"
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
          <DialogContent className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-2xl p-4 w-[95vw] max-w-md mx-auto">
            {/* Modal de edição */}
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="bg-white border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-none rounded-3xl p-4 w-[95vw] max-w-md mx-auto">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-sm md:text-base font-bold text-gray-900 tracking-[-0.03em] font-inter">Confirmar Exclusão</CardTitle>
              <CardDescription className="text-xs text-gray-600 tracking-[-0.03em] font-inter">
                Tem certeza que deseja excluir este link de indicação?
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingLinkId(null);
                    setCurrentIndication(null);
                  }}
                  className="bg-white/50 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl h-9 flex-1 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (currentIndication) {
                      handleDeleteLink(currentIndication);
                    } else {
                      console.error('Indicação não encontrada');
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-9 flex-1 text-xs"
                >
                  Excluir
                </Button>
              </div>
            </CardContent>
          </DialogContent>
        </Dialog>

        {/* Modal de criação de chatbot */}
        <Dialog open={showCreateChatbotModal} onOpenChange={setShowCreateChatbotModal}>
          <DialogContent className="sm:max-w-[425px]">
            <h2 className="text-lg font-semibold mb-2">Criar Chatbot</h2>
            <form onSubmit={handleCreateChatbot} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chatbotName">Nome do Chatbot</Label>
                <Input
                  id="chatbotName"
                  value={chatbotName}
                  onChange={(e) => setChatbotName(e.target.value)}
                  placeholder="Ex: Assistente Virtual"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="chatbotGreeting">Mensagem Inicial (opcional)</Label>
                <Input
                  id="chatbotGreeting"
                  value={chatbotGreeting}
                  onChange={(e) => setChatbotGreeting(e.target.value)}
                  placeholder={`Olá! Sou o assistente virtual do Dr. ${session?.user?.name}`}
                />
                <p className="text-xs text-gray-500">Primeira mensagem exibida ao abrir o chat</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="chatbotWelcomeMessage">Mensagem de Boas-vindas (opcional)</Label>
                <Input
                  id="chatbotWelcomeMessage"
                  value={chatbotWelcomeMessage}
                  onChange={(e) => setChatbotWelcomeMessage(e.target.value)}
                  placeholder="Como posso ajudar você hoje?"
                />
                <p className="text-xs text-gray-500">Mensagem exibida após o usuário se identificar</p>
              </div>
              
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateChatbotModal(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={isLoading || !chatbotName.trim()}
                >
                  {isLoading ? "Criando..." : "Criar Chatbot"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 