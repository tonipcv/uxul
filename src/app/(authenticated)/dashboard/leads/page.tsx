'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  MagnifyingGlassIcon, 
  PencilIcon, 
  XMarkIcon, 
  PhoneIcon, 
  UserIcon, 
  CalendarIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  ClockIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  EyeIcon,
  PlusIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone: string;
  interest?: string;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  status?: string;
  potentialValue?: number;
  appointmentDate?: string;
  medicalNotes?: string;
  createdAt: string;
  indication?: {
    name?: string;
    slug: string;
  };
}

interface DashboardData {
  totalLeads: number;
  conversionRate: number;
}

const formatPhoneNumber = (phone: string) => {
  // Remove todos os caracteres não numéricos
  const numbers = phone.replace(/\D/g, '');
  
  // Se não tiver números, retorna vazio
  if (!numbers) return '';
  
  // Se começar com +55, remove
  const cleanNumbers = numbers.startsWith('55') ? numbers.slice(2) : numbers;
  
  // Verifica se tem DDD (2 dígitos após o +55)
  if (cleanNumbers.length >= 2) {
    const ddd = cleanNumbers.slice(0, 2);
    const number = cleanNumbers.slice(2);
    
    // Formata o número final
    return `+55 (${ddd}) ${number}`;
  }
  
  return `+55 ${cleanNumbers}`;
};

export default function LeadsPage() {
  const { data: session } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    interest: "",
    status: "",
    potentialValue: "",
    appointmentDate: "",
    appointmentTime: "",
    medicalNotes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickEditLead, setQuickEditLead] = useState<Lead | null>(null);
  const [quickAppointmentDate, setQuickAppointmentDate] = useState("");
  const [quickAppointmentTime, setQuickAppointmentTime] = useState("");
  const [isQuickSubmitting, setIsQuickSubmitting] = useState(false);
  const [statusEditLead, setStatusEditLead] = useState<Lead | null>(null);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    source: "",
    interest: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  const [displayedLeads, setDisplayedLeads] = useState<Lead[]>([]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchLeads();
      fetchDashboardData();
    }
  }, [session]);

  useEffect(() => {
    if (editingLead) {
      const appointmentDate = editingLead.appointmentDate 
        ? format(parseISO(editingLead.appointmentDate), "yyyy-MM-dd")
        : "";
        
      const appointmentTime = editingLead.appointmentDate 
        ? format(parseISO(editingLead.appointmentDate), "HH:mm")
        : "";

      // Remove o código do país se já existir
      const phoneNumber = editingLead.phone.startsWith('+') 
        ? editingLead.phone.substring(editingLead.phone.indexOf(' ') + 1)
        : editingLead.phone;

      setFormData({
        name: editingLead.name || "",
        email: editingLead.email || "",
        phone: phoneNumber,
        interest: editingLead.interest || "",
        status: editingLead.status || "Novo",
        potentialValue: editingLead.potentialValue?.toString() || "",
        appointmentDate,
        appointmentTime,
        medicalNotes: editingLead.medicalNotes || ""
      });
    }
  }, [editingLead]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        setTotalLeads(data.totalLeads);
        setDisplayedLeads(data.totalLeads > 0 ? leads : []);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      console.log('Iniciando busca de leads...');
      
      const response = await fetch(`/api/leads`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Status da resposta:', response.status);
      const result = await response.json();
      console.log('Resposta da API:', result);

      if (response.ok) {
        // A API retorna diretamente um array de leads
        const leadsData = Array.isArray(result) ? result : [];
        console.log('Leads encontrados:', leadsData.length);
        
        setLeads(leadsData);
        setTotalLeads(leadsData.length);
        setDisplayedLeads(leadsData);
        
        // Atualiza os dados do dashboard após carregar os leads
        fetchDashboardData();
      } else {
        console.error('Erro na resposta da API:', result);
        toast({
          title: "Erro",
          description: result.error || "Erro ao carregar leads",
          variant: "destructive"
        });
        setLeads([]);
        setTotalLeads(0);
        setDisplayedLeads([]);
      }
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os leads",
        variant: "destructive"
      });
      setLeads([]);
      setTotalLeads(0);
      setDisplayedLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingLead(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Se for o campo de telefone, formata o número
    if (name === 'phone') {
      setFormData(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'status') {
      setFormData(prev => ({ ...prev, status: value }));
      
      // Se o status for alterado para "Fechado", significa que o lead foi convertido para paciente
      if (value === 'Fechado') {
        toast({
          title: "Lead convertido",
          description: "Lead foi convertido para paciente com sucesso",
        });
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;

    setIsSubmitting(true);
    try {
      // Montar a data da consulta combinando data e hora
      let appointmentDate: string | undefined = undefined;
      if (formData.appointmentDate) {
        const dateStr = formData.appointmentDate;
        const timeStr = formData.appointmentTime || "00:00";
        appointmentDate = new Date(`${dateStr}T${timeStr}`).toISOString();
      }

      // Converter valor para número se preenchido
      const potentialValue = formData.potentialValue 
        ? parseFloat(formData.potentialValue) 
        : undefined;

      const updatedData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        interest: formData.interest,
        status: formData.status,
        potentialValue,
        appointmentDate,
        medicalNotes: formData.medicalNotes
      };

      const response = await fetch(`/api/leads?leadId=${editingLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        toast({
          title: "Lead atualizado",
          description: "As informações foram salvas com sucesso",
        });
        await fetchLeads(); // Recarregar a lista
        closeEditModal();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar lead');
      }
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSchedule = async () => {
    if (!quickEditLead) return;

    setIsQuickSubmitting(true);
    try {
      // Montar a data da consulta combinando data e hora
      let appointmentDate: string | undefined = undefined;
      if (quickAppointmentDate) {
        const dateStr = quickAppointmentDate;
        const timeStr = quickAppointmentTime || "00:00";
        appointmentDate = new Date(`${dateStr}T${timeStr}`).toISOString();
      }

      const updatedData = {
        status: "Agendado",
        appointmentDate
      };

      const response = await fetch(`/api/leads?leadId=${quickEditLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        toast({
          title: "Consulta agendada",
          description: "O lead foi atualizado para Agendado",
        });
        fetchLeads(); // Recarregar a lista
        setQuickEditLead(null);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao agendar consulta');
      }
    } catch (error) {
      console.error('Erro ao agendar consulta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível agendar a consulta",
        variant: "destructive"
      });
    } finally {
      setIsQuickSubmitting(false);
    }
  };

  const handleStatusChange = async (lead: Lead, newStatus: string) => {
    try {
      const response = await fetch(`/api/leads?leadId=${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus
        })
      });

      if (response.ok) {
        toast({
          title: "Lead atualizado",
          description: `Status alterado para ${newStatus}`,
        });
        fetchLeads(); // Recarregar a lista
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar lead');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o lead",
        variant: "destructive"
      });
    }
  };

  const handleViewLead = (lead: Lead) => {
    setViewingLead(lead);
    setIsViewModalOpen(true);
  };

  const handleDeleteLead = async (lead: Lead) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) {
      return;
    }

    try {
      const response = await fetch(`/api/leads?leadId=${lead.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remove o lead da lista local
        setLeads(prev => prev.filter(l => l.id !== lead.id));
        setDisplayedLeads(prev => prev.filter(l => l.id !== lead.id));
        
        toast({
          title: "Sucesso",
          description: "Lead excluído com sucesso",
        });

        // Atualiza os dados do dashboard
        fetchDashboardData();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao excluir lead');
      }
    } catch (error) {
      console.error('Erro ao excluir lead:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível excluir o lead",
        variant: "destructive"
      });
    }
  };

  // Função para renderizar o status com cores diferentes
  const renderStatus = (lead: Lead) => {
    const getStatusBadge = () => {
      switch (lead.status) {
        case 'Novo':
          return <Badge className="bg-blue-500/20 text-blue-100 border-blue-300/40">Novo</Badge>;
        case 'Agendado':
          return <Badge className="bg-emerald-500/20 text-emerald-100 border-emerald-300/40">Agendado</Badge>;
        case 'Compareceu':
          return <Badge className="bg-green-500/20 text-green-100 border-green-300/40">Compareceu</Badge>;
        case 'Fechado':
          return <Badge className="bg-purple-500/20 text-purple-100 border-purple-300/40">Fechado</Badge>;
        case 'Não veio':
          return <Badge className="bg-red-500/20 text-red-100 border-red-300/40">Não veio</Badge>;
        case 'Cancelado':
          return <Badge className="bg-white/20 text-white/80 border-white/40">Cancelado</Badge>;
        default:
          return <Badge className="bg-white/20 text-white/80 border-white/40">{lead.status}</Badge>;
      }
    };

    return (
      <Popover open={statusEditLead?.id === lead.id && isStatusMenuOpen} onOpenChange={(open) => {
        setIsStatusMenuOpen(open);
        if (!open) setStatusEditLead(null);
      }}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            className="p-0 h-auto hover:bg-transparent"
            onClick={() => {
              setStatusEditLead(lead);
              setIsStatusMenuOpen(true);
            }}
          >
            {getStatusBadge()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2 bg-blue-800/80 backdrop-blur-sm border border-white/20">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-blue-100 hover:bg-blue-700/50"
              onClick={() => handleStatusChange(lead, 'Novo')}
            >
              Novo
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-emerald-100 hover:bg-emerald-700/50"
              onClick={() => handleStatusChange(lead, 'Agendado')}
            >
              Agendado
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-green-100 hover:bg-green-700/50"
              onClick={() => handleStatusChange(lead, 'Compareceu')}
            >
              Compareceu
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-purple-100 hover:bg-purple-700/50"
              onClick={() => handleStatusChange(lead, 'Fechado')}
            >
              Fechado
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-100 hover:bg-red-700/50"
              onClick={() => handleStatusChange(lead, 'Não veio')}
            >
              Não veio
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-white/80 hover:bg-white/10"
              onClick={() => handleStatusChange(lead, 'Cancelado')}
            >
              Cancelado
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  // Calcula estatísticas de leads
  const leadStats = {
    total: dashboardData?.totalLeads || 0,
    novos: Array.isArray(leads) ? leads.filter(lead => lead.status === 'Novo' || !lead.status).length : 0,
    emContato: Array.isArray(leads) ? leads.filter(lead => lead.status === 'Em contato').length : 0,
    agendados: Array.isArray(leads) ? leads.filter(lead => lead.status === 'Agendado').length : 0,
    compareceram: Array.isArray(leads) ? leads.filter(lead => lead.status === 'Compareceu').length : 0,
    naoVieram: Array.isArray(leads) ? leads.filter(lead => lead.status === 'Não veio').length : 0,
    fechados: Array.isArray(leads) ? leads.filter(lead => lead.status === 'Fechado').length : 0,
  };

  // Add function to get lead type counts
  const getLeadTypeCounts = () => {
    if (!Array.isArray(leads)) return { leads: 0, patients: 0, vips: 0 };
    
    return leads.reduce((acc, lead) => {
      if (lead.status === 'Fechado') {
        acc.patients++;
      } else if (lead.indication?.name) {
        acc.vips++;
      } else {
        acc.leads++;
      }
      return acc;
    }, { leads: 0, patients: 0, vips: 0 });
  };

  // Modify getFilteredLeads to include type filtering
  const getFilteredLeads = () => {
    if (!Array.isArray(leads)) return [];
    
    let filtered = leads;
    
    // Filtrar por status
    if (activeTab !== 'all') {
      const statusMap: {[key: string]: string} = {
        'novos': 'Novo',
        'emContato': 'Em contato',
        'agendados': 'Agendado',
        'compareceram': 'Compareceu',
        'naoVieram': 'Não veio',
        'fechados': 'Fechado'
      };

      // Filtrar por tipo
      if (activeTab === 'leads') {
        filtered = leads.filter(lead => 
          !lead.indication?.name && lead.status !== 'Fechado'
        );
      } else if (activeTab === 'patients') {
        filtered = leads.filter(lead => 
          lead.status === 'Fechado'
        );
      } else if (activeTab === 'vips') {
        filtered = leads.filter(lead => 
          !!lead.indication?.name
        );
      } else if (statusMap[activeTab]) {
        filtered = leads.filter(lead => 
          lead.status === statusMap[activeTab] || 
          (!lead.status && activeTab === 'novos')
        );
      }
    }
    
    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(lead => 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        (lead.interest?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (lead.source?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (lead.indication?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  // Get lead type counts
  const typeCounts = getLeadTypeCounts();

  const filteredLeads = Array.isArray(leads) ? getFilteredLeads() : [];

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead)
      });

      if (response.ok) {
        toast({
          title: "Lead criado",
          description: "O lead foi criado com sucesso",
        });
        fetchLeads();
        setShowCreateModal(false);
        setNewLead({
          name: "",
          email: "",
          phone: "",
          source: "",
          interest: ""
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar lead');
      }
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o lead",
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
            <h1 className="text-xl sm:text-lg md:text-xl font-bold text-gray-900 tracking-[-0.03em] font-inter">Leads</h1>
            <p className="text-sm sm:text-xs md:text-sm text-gray-600 tracking-[-0.03em] font-inter">Gerencie seus leads</p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="w-full md:w-auto mt-4 md:mt-0 h-10 sm:h-8 bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg-gray-800/10 text-sm sm:text-xs"
          >
            <PlusIcon className="h-4 w-4 sm:h-3.5 sm:w-3.5 mr-2 sm:mr-1.5" />
            Novo Lead
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
            <CardHeader className="pb-2 sm:pb-1 pt-4 sm:pt-3 px-6 sm:px-4">
              <CardTitle className="text-base sm:text-sm md:text-base font-bold flex items-center text-gray-900 tracking-[-0.03em] font-inter">
                <UserIcon className="h-5 w-5 sm:h-4 sm:w-4 mr-2 text-sky-500" />
                Total de Leads
              </CardTitle>
              <CardDescription className="text-sm sm:text-xs text-gray-500 tracking-[-0.03em] font-inter">
                Todos os leads registrados
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-4 sm:pb-3 px-6 sm:px-4">
              <div className="flex items-end justify-between">
                <p className="text-2xl sm:text-xl md:text-2xl font-semibold text-gray-900">
                  {dashboardData?.totalLeads || 0}
                </p>
                <Badge variant="outline" className="bg-sky-50 text-sky-600 border-sky-200 text-sm sm:text-xs">
                  Ativo
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
            <CardHeader className="pb-2 sm:pb-1 pt-4 sm:pt-3 px-6 sm:px-4">
              <CardTitle className="text-base sm:text-sm md:text-base font-bold flex items-center text-gray-900 tracking-[-0.03em] font-inter">
                <CheckCircleIcon className="h-5 w-5 sm:h-4 sm:w-4 mr-2 text-emerald-500" />
                Pacientes Fechados
              </CardTitle>
              <CardDescription className="text-sm sm:text-xs text-gray-500 tracking-[-0.03em] font-inter">
                Pacientes que fecharam no pipeline
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-4 sm:pb-3 px-6 sm:px-4">
              <div className="flex items-end justify-between">
                <p className="text-2xl sm:text-xl md:text-2xl font-semibold text-gray-900">
                  {leads.filter(lead => lead.status === 'Fechado').length}
                </p>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-sm sm:text-xs">
                  <ArrowTrendingUpIcon className="h-4 w-4 sm:h-3 sm:w-3 mr-1" />
                  Crescendo
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
            <CardHeader className="pb-2 sm:pb-1 pt-4 sm:pt-3 px-6 sm:px-4">
              <CardTitle className="text-base sm:text-sm md:text-base font-bold flex items-center text-gray-900 tracking-[-0.03em] font-inter">
                <ChartBarIcon className="h-5 w-5 sm:h-4 sm:w-4 mr-2 text-purple-500" />
                Taxa de Conversão
              </CardTitle>
              <CardDescription className="text-sm sm:text-xs text-gray-500 tracking-[-0.03em] font-inter">
                Média de conversão
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-4 sm:pb-3 px-6 sm:px-4">
              <div className="flex items-end justify-between">
                <p className="text-2xl sm:text-xl md:text-2xl font-semibold text-gray-900">
                  {dashboardData?.conversionRate || 0}%
                </p>
                <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200 text-sm sm:text-xs">
                  Média
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
          <CardHeader className="pb-2 sm:pb-1 pt-4 sm:pt-3 px-6 sm:px-4">
            <CardTitle className="text-base sm:text-sm md:text-base font-bold text-gray-900 tracking-[-0.03em] font-inter">Lista de Leads</CardTitle>
            <CardDescription className="text-sm sm:text-xs text-gray-500 tracking-[-0.03em] font-inter">
              Gerencie seus leads e pacientes
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4 sm:pb-3 px-6 sm:px-4">
            {/* Desktop Search and Filter */}
            <div className="hidden md:flex items-center justify-end gap-4 mb-6">
              <Select
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <SelectTrigger className="w-[180px] bg-white border-gray-200 focus:border-gray-300 text-gray-900 rounded-xl h-10">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Status</SelectLabel>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="novos">Novos</SelectItem>
                    <SelectItem value="agendados">Agendados</SelectItem>
                    <SelectItem value="compareceram">Compareceram</SelectItem>
                    <SelectItem value="fechados">Fechados</SelectItem>
                    <SelectItem value="naoVieram">Não vieram</SelectItem>
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Tipo</SelectLabel>
                    <SelectItem value="leads">Leads</SelectItem>
                    <SelectItem value="patients">Pacientes</SelectItem>
                    <SelectItem value="vips">VIPs</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              
              <div className="relative w-[200px]">
                <Input
                  type="text"
                  placeholder="Buscar leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-white text-sm border-gray-200 rounded-xl"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Mobile Search and Filter */}
            <div className="md:hidden mb-3">
              <div className="flex gap-3 mb-3">
                <Select
                  value={activeTab}
                  onValueChange={setActiveTab}
                >
                  <SelectTrigger className="flex-1 bg-white border-gray-200 focus:border-gray-300 text-gray-900 rounded-xl h-10">
                    <SelectValue placeholder="Filtrar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Status</SelectLabel>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="novos">Novos</SelectItem>
                      <SelectItem value="agendados">Agendados</SelectItem>
                      <SelectItem value="compareceram">Compareceram</SelectItem>
                      <SelectItem value="fechados">Fechados</SelectItem>
                      <SelectItem value="naoVieram">Não vieram</SelectItem>
                    </SelectGroup>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>Tipo</SelectLabel>
                      <SelectItem value="leads">Leads</SelectItem>
                      <SelectItem value="patients">Pacientes</SelectItem>
                      <SelectItem value="vips">VIPs</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <div className="relative w-[140px]">
                  <Input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-white text-sm border-gray-200 rounded-xl"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto -mx-4 px-4">
              {/* Mobile view for small screens */}
              <div className="md:hidden space-y-3">
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead) => (
                    <div key={lead.id} className="bg-white p-3.5 rounded-xl shadow-sm border border-gray-100">
                      <div className="flex justify-between items-start mb-2.5">
                        <div className="font-semibold text-base text-gray-900">{lead.name}</div>
                        <div>
                          {(() => {
                            switch (lead.status) {
                              case 'Novo':
                                return <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-[10px]">Novo</Badge>;
                              case 'Agendado':
                                return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px]">Agendado</Badge>;
                              case 'Compareceu':
                                return <Badge className="bg-green-50 text-green-600 border-green-200 text-[10px]">Compareceu</Badge>;
                              case 'Fechado':
                                return <Badge className="bg-purple-50 text-purple-600 border-purple-200 text-[10px]">Fechado</Badge>;
                              case 'Não veio':
                                return <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px]">Não veio</Badge>;
                              case 'Cancelado':
                                return <Badge className="bg-gray-50 text-gray-600 border-gray-200 text-[10px]">Cancelado</Badge>;
                              case 'converted':
                                return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px]">Paciente</Badge>;
                              default:
                                return <Badge className="bg-sky-50 text-sky-600 border-sky-200 text-[10px]">Lead</Badge>;
                            }
                          })()}
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-3 text-xs">
                        <div className="flex">
                          <div className="w-20 flex items-center gap-1 text-gray-500">
                            <PhoneIcon className="h-3 w-3" />
                            <span>Telefone:</span>
                          </div>
                          <div className="text-gray-700 font-medium">{lead.phone}</div>
                        </div>
                        
                        <div className="flex">
                          <div className="w-20 flex items-center gap-1 text-gray-500">
                            <UserIcon className="h-3 w-3" />
                            <span>Email:</span>
                          </div>
                          <div className="text-gray-700 font-medium truncate">{lead.email || 'Não informado'}</div>
                        </div>
                        
                        <div className="flex">
                          <div className="w-20 flex items-center gap-1 text-gray-500">
                            <BriefcaseIcon className="h-3 w-3" />
                            <span>Origem:</span>
                          </div>
                          <div className="text-gray-700 font-medium">
                            {lead.source ? (
                              <Badge variant="outline" className="bg-gray-50/50 text-gray-600 border-gray-200 text-[10px] px-1.5 py-0 h-4">
                                {lead.source}
                              </Badge>
                            ) : (
                              'Não informado'
                            )}
                          </div>
                        </div>
                        
                        <div className="flex">
                          <div className="w-20 flex items-center gap-1 text-gray-500">
                            <CalendarIcon className="h-3 w-3" />
                            <span>Data:</span>
                          </div>
                          <div className="text-gray-700 font-medium">
                            {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewLead(lead)}
                          className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors text-xs h-7 w-7 p-0"
                        >
                          <EyeIcon className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(lead)}
                          className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors text-xs h-7 w-7 p-0"
                        >
                          <PencilIcon className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLead(lead)}
                          className="text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors text-xs h-7 w-7 p-0"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : !loading ? (
                  <div className="bg-white p-4 rounded-xl shadow-sm text-center text-gray-500 text-sm">
                    Nenhum lead encontrado
                  </div>
                ) : null}
                
                {loading && (
                  <div className="bg-white p-4 rounded-xl shadow-sm text-center text-gray-500 text-sm">
                    <ArrowPathIcon className="h-5 w-5 mx-auto animate-spin text-gray-400 mb-2" />
                    Carregando leads...
                  </div>
                )}
              </div>
              
              {/* Desktop table view */}
              <table className="w-full hidden md:table">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 sm:py-2 px-4 sm:px-3 text-left text-sm sm:text-xs font-medium text-gray-500">Nome</th>
                    <th className="py-3 sm:py-2 px-4 sm:px-3 text-left text-sm sm:text-xs font-medium text-gray-500">Email</th>
                    <th className="py-3 sm:py-2 px-4 sm:px-3 text-left text-sm sm:text-xs font-medium text-gray-500">Telefone</th>
                    <th className="py-3 sm:py-2 px-4 sm:px-3 text-left text-sm sm:text-xs font-medium text-gray-500">Origem</th>
                    <th className="py-3 sm:py-2 px-4 sm:px-3 text-left text-sm sm:text-xs font-medium text-gray-500">Tipo</th>
                    <th className="py-3 sm:py-2 px-4 sm:px-3 text-left text-sm sm:text-xs font-medium text-gray-500">Status</th>
                    <th className="py-3 sm:py-2 px-4 sm:px-3 text-left text-sm sm:text-xs font-medium text-gray-500">Data</th>
                    <th className="py-3 sm:py-2 px-4 sm:px-3 text-right text-sm sm:text-xs font-medium text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 sm:py-2 px-4 sm:px-3">
                        <div className="font-medium text-base sm:text-sm text-gray-900">{lead.name}</div>
                      </td>
                      <td className="py-3 sm:py-2 px-4 sm:px-3">
                        <div className="text-gray-600 text-sm sm:text-xs">{lead.email || 'Não informado'}</div>
                      </td>
                      <td className="py-3 sm:py-2 px-4 sm:px-3">
                        <div className="text-gray-600 text-sm sm:text-xs">{lead.phone}</div>
                      </td>
                      <td className="py-3 sm:py-2 px-4 sm:px-3">
                        <div className="text-gray-600 text-sm sm:text-xs">{lead.source || 'Não informado'}</div>
                      </td>
                      <td className="py-3 sm:py-2 px-4 sm:px-3">
                        {lead.status === 'Fechado' ? (
                          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-xs">Paciente</Badge>
                        ) : lead.indication?.name ? (
                          <Badge className="bg-purple-50 text-purple-600 border-purple-200 text-xs">VIP</Badge>
                        ) : (
                          <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-xs">Lead</Badge>
                        )}
                      </td>
                      <td className="py-3 sm:py-2 px-4 sm:px-3">
                        {(() => {
                          switch (lead.status) {
                            case 'Novo':
                              return <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-xs">Novo</Badge>;
                            case 'Agendado':
                              return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-xs">Agendado</Badge>;
                            case 'Compareceu':
                              return <Badge className="bg-green-50 text-green-600 border-green-200 text-xs">Compareceu</Badge>;
                            case 'Fechado':
                              return <Badge className="bg-purple-50 text-purple-600 border-purple-200 text-xs">Fechado</Badge>;
                            case 'Não veio':
                              return <Badge className="bg-red-50 text-red-600 border-red-200 text-xs">Não veio</Badge>;
                            case 'Cancelado':
                              return <Badge className="bg-gray-50 text-gray-600 border-gray-200 text-xs">Cancelado</Badge>;
                            case 'converted':
                              return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-xs">Paciente</Badge>;
                            default:
                              return <Badge className="bg-sky-50 text-sky-600 border-sky-200 text-xs">Lead</Badge>;
                          }
                        })()}
                      </td>
                      <td className="py-3 sm:py-2 px-4 sm:px-3">
                        <div className="text-gray-600 text-sm sm:text-xs">
                          {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="py-3 sm:py-2 px-4 sm:px-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white border-sky-300 text-sky-700 hover:bg-sky-50 hover:border-sky-400 hover:text-sky-800 transition-colors text-sm sm:text-xs h-9 sm:h-7 px-3 sm:px-2"
                            onClick={() => openEditModal(lead)}
                          >
                            <PencilIcon className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white border-sky-300 text-sky-700 hover:bg-sky-50 hover:border-sky-400 hover:text-sky-800 transition-colors text-sm sm:text-xs h-9 sm:h-7 px-3 sm:px-2"
                            onClick={() => handleViewLead(lead)}
                          >
                            <EyeIcon className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLead(lead)}
                            className="text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors text-xs h-7 w-7 p-0"
                          >
                            <TrashIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {filteredLeads.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-gray-500 text-sm">
                        Nenhum lead encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de criação */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-white/90 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-3xl p-5 sm:p-4 w-[95vw] max-w-md mx-auto">
          <CardHeader className="p-0 mb-5 sm:mb-4">
            <CardTitle className="text-lg sm:text-base font-bold text-gray-900 tracking-[-0.03em] font-inter">Novo Lead</CardTitle>
            <CardDescription className="text-sm sm:text-xs text-gray-600 tracking-[-0.03em] font-inter">
              Adicione um novo lead ao sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleCreateLead} className="space-y-5 sm:space-y-4">
              <div className="space-y-2 sm:space-y-1">
                <Label htmlFor="name" className="text-sm sm:text-xs font-medium text-gray-700 tracking-[-0.03em] font-inter">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  placeholder="Nome completo"
                  className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-10 sm:h-9 text-base sm:text-sm"
                />
              </div>

              <div className="space-y-2 sm:space-y-1">
                <Label htmlFor="email" className="text-sm sm:text-xs font-medium text-gray-700 tracking-[-0.03em] font-inter">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  placeholder="E-mail do lead"
                  className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-10 sm:h-9 text-base sm:text-sm"
                />
              </div>

              <div className="space-y-2 sm:space-y-1">
                <Label htmlFor="phone" className="text-sm sm:text-xs font-medium text-gray-700 tracking-[-0.03em] font-inter">Telefone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: formatPhoneNumber(e.target.value) })}
                  placeholder="Digite o telefone"
                  className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-10 sm:h-9 text-base sm:text-sm"
                />
              </div>

              <div className="space-y-2 sm:space-y-1">
                <Label htmlFor="source" className="text-sm sm:text-xs font-medium text-gray-700 tracking-[-0.03em] font-inter">Origem</Label>
                <Select
                  value={newLead.source}
                  onValueChange={(value) => setNewLead({ ...newLead, source: value })}
                >
                  <SelectTrigger className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 rounded-xl h-10 sm:h-9 text-base sm:text-sm">
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="social">Redes Sociais</SelectItem>
                    <SelectItem value="referral">Indicação</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-white/50 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl h-10 sm:h-9 flex-1 text-sm sm:text-xs"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-10 sm:h-9 flex-1 text-sm sm:text-xs mt-2 sm:mt-0"
                >
                  {isLoading ? (
                    <ArrowPathIcon className="h-4 w-4 sm:h-3 sm:w-3 animate-spin" />
                  ) : (
                    "Criar Lead"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </DialogContent>
      </Dialog>

      {/* Modal de edição */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-white/90 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-3xl p-6 sm:p-4 w-[95vw] max-w-md mx-auto overflow-y-auto max-h-[90vh]">
          <CardHeader className="p-0 mb-6 sm:mb-4">
            <CardTitle className="text-xl sm:text-lg font-bold text-gray-900 tracking-[-0.03em] font-inter">Editar Lead</CardTitle>
            <CardDescription className="text-sm sm:text-xs text-gray-600 tracking-[-0.03em] font-inter">
              Edite as informações do lead
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-4">
              <div className="space-y-2 sm:space-y-1">
                <Label htmlFor="name" className="text-sm sm:text-xs font-medium text-gray-700 tracking-[-0.03em] font-inter">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nome completo"
                  className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-11 sm:h-9 text-base sm:text-sm"
                />
              </div>

              <div className="space-y-2 sm:space-y-1">
                <Label htmlFor="email" className="text-sm sm:text-xs font-medium text-gray-700 tracking-[-0.03em] font-inter">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="E-mail do lead"
                  className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-11 sm:h-9 text-base sm:text-sm"
                />
              </div>

              <div className="space-y-2 sm:space-y-1">
                <Label htmlFor="phone" className="text-sm sm:text-xs font-medium text-gray-700 tracking-[-0.03em] font-inter">Telefone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Digite o telefone"
                  className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-11 sm:h-9 text-base sm:text-sm"
                />
              </div>

              <div className="space-y-2 sm:space-y-1">
                <Label htmlFor="interest" className="text-sm sm:text-xs font-medium text-gray-700 tracking-[-0.03em] font-inter">Interesse</Label>
                <Input
                  id="interest"
                  name="interest"
                  value={formData.interest}
                  onChange={handleInputChange}
                  placeholder="Interesse do lead"
                  className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-11 sm:h-9 text-base sm:text-sm"
                />
              </div>

              <div className="space-y-2 sm:space-y-1">
                <Label htmlFor="status" className="text-sm sm:text-xs font-medium text-gray-700 tracking-[-0.03em] font-inter">Status</Label>
                <Select
                  name="status"
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger id="status" className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 rounded-xl h-11 sm:h-9 text-base sm:text-sm">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent 
                    className="bg-white border border-gray-200 shadow-lg rounded-lg z-[9999] relative"
                    align="center"
                    side="bottom"
                    avoidCollisions={false}
                  >
                    <SelectGroup>
                      <SelectLabel className="text-xs text-gray-500 font-medium">Lead</SelectLabel>
                      <SelectItem value="Novo" className="text-sm text-gray-700">Novo</SelectItem>
                      <SelectItem value="Agendado" className="text-sm text-gray-700">Agendado</SelectItem>
                      <SelectItem value="Compareceu" className="text-sm text-gray-700">Compareceu</SelectItem>
                      <SelectItem value="Não veio" className="text-sm text-gray-700">Não veio</SelectItem>
                      <SelectItem value="Cancelado" className="text-sm text-gray-700">Cancelado</SelectItem>
                    </SelectGroup>
                    <SelectSeparator className="bg-gray-200" />
                    <SelectGroup>
                      <SelectLabel className="text-xs text-gray-500 font-medium">Converter para</SelectLabel>
                      <SelectItem value="Fechado" className="text-sm text-gray-700">Paciente</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:space-y-1">
                <Label htmlFor="potentialValue" className="text-sm sm:text-xs font-medium text-gray-700 tracking-[-0.03em] font-inter">Valor Potencial</Label>
                <Input
                  id="potentialValue"
                  name="potentialValue"
                  type="number"
                  value={formData.potentialValue}
                  onChange={handleInputChange}
                  placeholder="Valor potencial do lead"
                  className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-11 sm:h-9 text-base sm:text-sm"
                />
              </div>

              <div className="space-y-2 sm:space-y-1">
                <Label htmlFor="appointmentDate" className="text-sm sm:text-xs font-medium text-gray-700 tracking-[-0.03em] font-inter">Data da Consulta</Label>
                <Input
                  id="appointmentDate"
                  name="appointmentDate"
                  type="date"
                  value={formData.appointmentDate}
                  onChange={handleInputChange}
                  className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-11 sm:h-9 text-base sm:text-sm"
                />
              </div>

              <div className="space-y-2 sm:space-y-1">
                <Label htmlFor="appointmentTime" className="text-sm sm:text-xs font-medium text-gray-700 tracking-[-0.03em] font-inter">Horário da Consulta</Label>
                <Input
                  id="appointmentTime"
                  name="appointmentTime"
                  type="time"
                  value={formData.appointmentTime}
                  onChange={handleInputChange}
                  className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-11 sm:h-9 text-base sm:text-sm"
                />
              </div>

              <div className="space-y-2 sm:space-y-1">
                <Label htmlFor="medicalNotes" className="text-sm sm:text-xs font-medium text-gray-700 tracking-[-0.03em] font-inter">Observações</Label>
                <Textarea
                  id="medicalNotes"
                  name="medicalNotes"
                  value={formData.medicalNotes}
                  onChange={handleInputChange}
                  placeholder="Observações sobre o lead"
                  className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-24 sm:h-20 text-base sm:text-sm"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeEditModal}
                  className="bg-white/50 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl h-11 sm:h-9 flex-1 text-base sm:text-sm"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-11 sm:h-9 flex-1 text-base sm:text-sm mt-2 sm:mt-0"
                >
                  {isSubmitting ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="bg-white/90 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-3xl p-5 sm:p-4 w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-base font-bold text-gray-900 tracking-[-0.03em] font-inter">Detalhes do Lead</DialogTitle>
          </DialogHeader>
          {viewingLead && (
            <div className="grid gap-4 sm:gap-3 py-4 sm:py-3">
              <div className="grid grid-cols-3 items-center gap-4 sm:gap-2">
                <Label className="text-right text-sm sm:text-xs font-medium text-gray-700">Nome</Label>
                <div className="col-span-2 text-base sm:text-sm text-gray-900">{viewingLead.name}</div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4 sm:gap-2">
                <Label className="text-right text-sm sm:text-xs font-medium text-gray-700">Email</Label>
                <div className="col-span-2 text-base sm:text-sm text-gray-900">{viewingLead.email || 'Não informado'}</div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4 sm:gap-2">
                <Label className="text-right text-sm sm:text-xs font-medium text-gray-700">Telefone</Label>
                <div className="col-span-2 text-base sm:text-sm text-gray-900">{viewingLead.phone}</div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4 sm:gap-2">
                <Label className="text-right text-sm sm:text-xs font-medium text-gray-700">Origem</Label>
                <div className="col-span-2 text-base sm:text-sm text-gray-900">{viewingLead.source || 'Não informado'}</div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4 sm:gap-2">
                <Label className="text-right text-sm sm:text-xs font-medium text-gray-700">Status</Label>
                <div className="col-span-2 text-base sm:text-sm text-gray-900">{viewingLead.status || 'Novo'}</div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4 sm:gap-2">
                <Label className="text-right text-sm sm:text-xs font-medium text-gray-700">Data</Label>
                <div className="col-span-2 text-base sm:text-sm text-gray-900">
                  {new Date(viewingLead.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
              {viewingLead.appointmentDate && (
                <div className="grid grid-cols-3 items-center gap-4 sm:gap-2">
                  <Label className="text-right text-sm sm:text-xs font-medium text-gray-700">Consulta</Label>
                  <div className="col-span-2 text-base sm:text-sm text-gray-900">
                    {new Date(viewingLead.appointmentDate).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              )}
              {viewingLead.medicalNotes && (
                <div className="grid grid-cols-3 items-center gap-4 sm:gap-2">
                  <Label className="text-right text-sm sm:text-xs font-medium text-gray-700">Observações</Label>
                  <div className="col-span-2 text-base sm:text-sm text-gray-900">{viewingLead.medicalNotes}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="secondary" 
              onClick={() => setIsViewModalOpen(false)}
              className="w-full sm:w-auto text-sm sm:text-xs"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 