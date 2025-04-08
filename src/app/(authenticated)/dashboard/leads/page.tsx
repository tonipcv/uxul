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
  PlusIcon
} from "@heroicons/react/24/outline";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export default function LeadsPage() {
  const { data: session } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
  const [showEditModal, setShowEditModal] = useState(false);

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

      setFormData({
        name: editingLead.name || "",
        email: editingLead.email || "",
        phone: editingLead.phone || "",
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
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leads`);
      if (response.ok) {
        const result = await response.json();
        // Verificar se data existe na resposta e é um array
        if (result.data && Array.isArray(result.data)) {
          setLeads(result.data);
        } else if (Array.isArray(result)) {
          // Fallback para o caso de a API retornar diretamente um array
          setLeads(result);
        } else {
          setLeads([]);
        }
      } else {
        setLeads([]);
      }
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingLead(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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
        fetchLeads(); // Recarregar a lista
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

  // Filtra leads por status e termo de busca
  const getFilteredLeads = () => {
    if (!Array.isArray(leads)) return [];
    
    let filteredByStatus = leads;
    
    if (activeTab !== 'all') {
      const statusMap: {[key: string]: string} = {
        'novos': 'Novo',
        'emContato': 'Em contato',
        'agendados': 'Agendado',
        'compareceram': 'Compareceu',
        'naoVieram': 'Não veio',
        'fechados': 'Fechado'
      };
      
      filteredByStatus = leads.filter(lead => 
        lead.status === statusMap[activeTab] || 
        (!lead.status && activeTab === 'novos')
      );
    }
    
    return filteredByStatus.filter(lead => 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      (lead.interest?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (lead.source?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (lead.indication?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );
  };

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
    <div className="min-h-[100dvh] bg-gray-100 pt-8 pb-16 px-4">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-[-0.03em] font-inter">Leads</h1>
            <p className="text-sm md:text-base text-gray-600 tracking-[-0.03em] font-inter">Gerencie seus leads</p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="mt-2 md:mt-0 bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg-gray-800/10"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center text-gray-900">
                <UserIcon className="h-5 w-5 mr-2 text-sky-500" />
                Total de Leads
              </CardTitle>
              <CardDescription className="text-gray-500">
                Todos os leads registrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <p className="text-4xl font-semibold text-gray-900">
                  {dashboardData?.totalLeads || 0}
                </p>
                <Badge variant="outline" className="bg-sky-50 text-sky-600 border-sky-200">
                  Ativo
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center text-gray-900">
                <CheckCircleIcon className="h-5 w-5 mr-2 text-emerald-500" />
                Pacientes Fechados
              </CardTitle>
              <CardDescription className="text-gray-500">
                Pacientes que fecharam no pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <p className="text-4xl font-semibold text-gray-900">
                  {leads.filter(lead => lead.status === 'Fechado').length}
                </p>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                  <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                  Crescendo
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center text-gray-900">
                <ChartBarIcon className="h-5 w-5 mr-2 text-purple-500" />
                Taxa de Conversão
              </CardTitle>
              <CardDescription className="text-gray-500">
                Média de conversão
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <p className="text-4xl font-semibold text-gray-900">
                  {dashboardData?.conversionRate || 0}%
                </p>
                <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                  Média
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-900">Lista de Leads</CardTitle>
            <CardDescription className="text-gray-500">
              Gerencie seus leads e pacientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Nome</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Email</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Telefone</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Origem</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Status</th>
                    <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">Data</th>
                    <th className="py-3 px-4 text-right text-sm font-medium text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{lead.name}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-gray-600">{lead.email || 'Não informado'}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-gray-600">{lead.phone}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-gray-600">{lead.source || 'Não informado'}</div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge 
                          variant="outline" 
                          className={`${
                            lead.status === 'converted' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                              : 'bg-sky-50 text-sky-600 border-sky-200'
                          }`}
                        >
                          {lead.status === 'converted' ? 'Paciente' : 'Lead'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-gray-600">
                          {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white border-sky-300 text-sky-700 hover:bg-sky-50 hover:border-sky-400 hover:text-sky-800 transition-colors"
                            onClick={() => openEditModal(lead)}
                          >
                            <PencilIcon className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white border-sky-300 text-sky-700 hover:bg-sky-50 hover:border-sky-400 hover:text-sky-800 transition-colors"
                            onClick={() => handleViewLead(lead)}
                          >
                            <EyeIcon className="h-4 w-4 mr-2" />
                            Ver
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

        {/* Modal de criação */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="bg-white/90 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-3xl p-6">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-xl font-bold text-gray-900 tracking-[-0.03em] font-inter">Novo Lead</CardTitle>
              <CardDescription className="text-sm text-gray-600 tracking-[-0.03em] font-inter">
                Adicione um novo lead ao sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={handleCreateLead} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700 tracking-[-0.03em] font-inter">Nome</Label>
                  <Input
                    id="name"
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                    placeholder="Nome completo"
                    className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 tracking-[-0.03em] font-inter">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    placeholder="E-mail do lead"
                    className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700 tracking-[-0.03em] font-inter">Telefone</Label>
                  <Input
                    id="phone"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    placeholder="Telefone do lead"
                    className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source" className="text-sm font-medium text-gray-700 tracking-[-0.03em] font-inter">Origem</Label>
                  <Select
                    value={newLead.source}
                    onValueChange={(value) => setNewLead({ ...newLead, source: value })}
                  >
                    <SelectTrigger className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 rounded-xl h-11">
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

                <div className="flex gap-4 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="bg-white/50 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl h-11 flex-1"
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-11 flex-1"
                  >
                    {isLoading ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
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
          <DialogContent className="bg-white/90 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-3xl p-6">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-xl font-bold text-gray-900 tracking-[-0.03em] font-inter">Editar Lead</CardTitle>
              <CardDescription className="text-sm text-gray-600 tracking-[-0.03em] font-inter">
                Edite as informações do lead
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700 tracking-[-0.03em] font-inter">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nome completo"
                    className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 tracking-[-0.03em] font-inter">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="E-mail do lead"
                    className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700 tracking-[-0.03em] font-inter">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Telefone do lead"
                    className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interest" className="text-sm font-medium text-gray-700 tracking-[-0.03em] font-inter">Interesse</Label>
                  <Input
                    id="interest"
                    value={formData.interest}
                    onChange={handleInputChange}
                    placeholder="Interesse do lead"
                    className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700 tracking-[-0.03em] font-inter">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={handleSelectChange.bind(null, 'status')}
                  >
                    <SelectTrigger className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 rounded-xl h-11">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Novo">Novo</SelectItem>
                      <SelectItem value="Agendado">Agendado</SelectItem>
                      <SelectItem value="Compareceu">Compareceu</SelectItem>
                      <SelectItem value="Fechado">Fechado</SelectItem>
                      <SelectItem value="Não veio">Não veio</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="potentialValue" className="text-sm font-medium text-gray-700 tracking-[-0.03em] font-inter">Valor Potencial</Label>
                  <Input
                    id="potentialValue"
                    type="number"
                    value={formData.potentialValue}
                    onChange={handleInputChange}
                    placeholder="Valor potencial do lead"
                    className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointmentDate" className="text-sm font-medium text-gray-700 tracking-[-0.03em] font-inter">Data da Consulta</Label>
                  <Input
                    id="appointmentDate"
                    type="datetime-local"
                    value={formData.appointmentDate}
                    onChange={handleInputChange}
                    className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointmentTime" className="text-sm font-medium text-gray-700 tracking-[-0.03em] font-inter">Horário da Consulta</Label>
                  <Input
                    id="appointmentTime"
                    type="time"
                    value={formData.appointmentTime}
                    onChange={handleInputChange}
                    className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicalNotes" className="text-sm font-medium text-gray-700 tracking-[-0.03em] font-inter">Observações</Label>
                  <Textarea
                    id="medicalNotes"
                    value={formData.medicalNotes}
                    onChange={handleInputChange}
                    placeholder="Observações sobre o lead"
                    className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-24"
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeEditModal}
                    className="bg-white/50 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl h-11 flex-1"
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-11 flex-1"
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Detalhes do Lead</DialogTitle>
            </DialogHeader>
            {viewingLead && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Nome</Label>
                  <div className="col-span-3">{viewingLead.name}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Email</Label>
                  <div className="col-span-3">{viewingLead.email || 'Não informado'}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Telefone</Label>
                  <div className="col-span-3">{viewingLead.phone}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Origem</Label>
                  <div className="col-span-3">{viewingLead.source || 'Não informado'}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Status</Label>
                  <div className="col-span-3">{viewingLead.status || 'Novo'}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Data</Label>
                  <div className="col-span-3">
                    {new Date(viewingLead.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                {viewingLead.appointmentDate && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Consulta</Label>
                    <div className="col-span-3">
                      {new Date(viewingLead.appointmentDate).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                )}
                {viewingLead.medicalNotes && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Observações</Label>
                    <div className="col-span-3">{viewingLead.medicalNotes}</div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 