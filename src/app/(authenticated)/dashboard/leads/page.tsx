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
  ArrowPathIcon
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

export default function LeadsPage() {
  const { data: session } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
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

  useEffect(() => {
    if (session?.user?.id) {
      fetchLeads();
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

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leads?userId=${session?.user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setLeads(data);
      }
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
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
      let appointmentDate = undefined;
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
      let appointmentDate = undefined;
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
    total: leads.length,
    novos: leads.filter(lead => lead.status === 'Novo' || !lead.status).length,
    emContato: leads.filter(lead => lead.status === 'Em contato').length,
    agendados: leads.filter(lead => lead.status === 'Agendado').length,
    compareceram: leads.filter(lead => lead.status === 'Compareceu').length,
    naoVieram: leads.filter(lead => lead.status === 'Não veio').length,
    fechados: leads.filter(lead => lead.status === 'Fechado').length,
  };

  // Filtra leads por status e termo de busca
  const getFilteredLeads = () => {
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

  const filteredLeads = getFilteredLeads();

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-medium text-white">Leads</h1>
        <div className="flex gap-2 items-center w-full md:w-auto">
          <Input
            placeholder="Buscar leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 md:w-64 h-9 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white placeholder:text-white/60 focus:ring-2 focus:ring-white/50 focus:border-transparent"
          />
          <Button 
            onClick={fetchLeads} 
            size="sm"
            variant="outline" 
            className="bg-white/10 backdrop-blur-sm border-blue-300/30 text-blue-100 hover:bg-blue-600/30 transition-colors h-9 px-3"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/30 shadow-md">
        <div className="p-2">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="hidden md:grid md:grid-cols-6 bg-transparent border border-blue-500/30 p-1 rounded-md">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-blue-600/40 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-300 text-blue-100/70 hover:text-blue-100 transition-colors rounded-md"
              >
                Todos ({leadStats.total})
              </TabsTrigger>
              <TabsTrigger 
                value="novos" 
                className="data-[state=active]:bg-blue-600/40 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-300 text-blue-100/70 hover:text-blue-100 transition-colors rounded-md"
              >
                Novos ({leadStats.novos})
              </TabsTrigger>
              <TabsTrigger 
                value="agendados" 
                className="data-[state=active]:bg-blue-600/40 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-300 text-blue-100/70 hover:text-blue-100 transition-colors rounded-md"
              >
                Agendados ({leadStats.agendados})
              </TabsTrigger>
              <TabsTrigger 
                value="compareceram" 
                className="data-[state=active]:bg-blue-600/40 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-300 text-blue-100/70 hover:text-blue-100 transition-colors rounded-md"
              >
                Compareceram ({leadStats.compareceram})
              </TabsTrigger>
              <TabsTrigger 
                value="fechados" 
                className="data-[state=active]:bg-blue-600/40 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-300 text-blue-100/70 hover:text-blue-100 transition-colors rounded-md"
              >
                Fechados ({leadStats.fechados})
              </TabsTrigger>
              <TabsTrigger 
                value="naoVieram" 
                className="data-[state=active]:bg-blue-600/40 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-300 text-blue-100/70 hover:text-blue-100 transition-colors rounded-md"
              >
                Não vieram ({leadStats.naoVieram})
              </TabsTrigger>
            </TabsList>

            {/* Mobile Filter */}
            <div className="md:hidden mb-2">
              <Select 
                value={activeTab} 
                onValueChange={setActiveTab}
              >
                <SelectTrigger className="w-full h-9 bg-blue-600/40 backdrop-blur-sm text-white border-blue-500/30 focus:ring-blue-600/40 focus:ring-offset-0">
                  <SelectValue>
                    {activeTab === 'all' && `Todos (${leadStats.total})`}
                    {activeTab === 'novos' && `Novos (${leadStats.novos})`}
                    {activeTab === 'agendados' && `Agendados (${leadStats.agendados})`}
                    {activeTab === 'compareceram' && `Compareceram (${leadStats.compareceram})`}
                    {activeTab === 'fechados' && `Fechados (${leadStats.fechados})`}
                    {activeTab === 'naoVieram' && `Não vieram (${leadStats.naoVieram})`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-blue-800/80 backdrop-blur-sm border border-blue-500/30 text-white">
                  <SelectItem value="all" className="text-blue-100 focus:bg-blue-700/50">Todos ({leadStats.total})</SelectItem>
                  <SelectItem value="novos" className="text-blue-100 focus:bg-blue-700/50">Novos ({leadStats.novos})</SelectItem>
                  <SelectItem value="agendados" className="text-blue-100 focus:bg-blue-700/50">Agendados ({leadStats.agendados})</SelectItem>
                  <SelectItem value="compareceram" className="text-blue-100 focus:bg-blue-700/50">Compareceram ({leadStats.compareceram})</SelectItem>
                  <SelectItem value="fechados" className="text-blue-100 focus:bg-blue-700/50">Fechados ({leadStats.fechados})</SelectItem>
                  <SelectItem value="naoVieram" className="text-blue-100 focus:bg-blue-700/50">Não vieram ({leadStats.naoVieram})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="divide-y divide-blue-500/20">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-300 border-t-transparent rounded-full mx-auto mb-2" />
                  <p className="text-sm text-blue-100/80">Carregando...</p>
                </div>
              ) : getFilteredLeads().length > 0 ? (
                <>
                  <div className="md:hidden">
                    {getFilteredLeads().map((lead) => (
                      <div key={lead.id} className="p-3 border-b border-blue-500/20">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-medium text-white mb-0.5">{lead.name}</h3>
                              <div className="flex flex-wrap gap-2 text-sm text-blue-100/80">
                                <span className="flex items-center gap-1">
                                  <PhoneIcon className="h-3.5 w-3.5" />
                                  {lead.phone}
                                </span>
                                {lead.interest && (
                                  <span className="flex items-center gap-1">
                                    <BriefcaseIcon className="h-3.5 w-3.5" />
                                    {lead.interest}
                                  </span>
                                )}
                              </div>
                            </div>
                            {renderStatus(lead)}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setQuickEditLead(lead);
                                setQuickAppointmentDate("");
                                setQuickAppointmentTime("");
                              }}
                              className="flex-1 h-8 px-3 text-sm bg-white text-blue-700 hover:bg-white/90 border-none"
                            >
                              <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                              Agendar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(lead)}
                              className="flex-1 h-8 px-3 text-sm bg-blue-700/30 border-blue-500/30 text-blue-100 hover:bg-blue-600/40"
                            >
                              <PencilIcon className="h-3.5 w-3.5 mr-1.5" />
                              Editar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Desktop List View */}
                  <div className="hidden md:block">
                    <table className="w-full">
                      <tbody>
                        {getFilteredLeads().map((lead) => (
                          <tr key={lead.id} className="border-b border-blue-500/20">
                            <td className="py-3 pl-4 pr-2 w-[30%]">
                              <div className="font-medium text-white">{lead.name}</div>
                            </td>
                            <td className="py-3 px-2 w-[20%]">
                              <div className="text-blue-100/80">{lead.phone}</div>
                            </td>
                            <td className="py-3 px-2 w-[20%]">
                              <div className="text-blue-100/80">{lead.interest}</div>
                            </td>
                            <td className="py-3 px-2 w-[15%]">
                              {renderStatus(lead)}
                            </td>
                            <td className="py-3 pl-2 pr-4 w-[15%]">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setQuickEditLead(lead);
                                    setQuickAppointmentDate("");
                                    setQuickAppointmentTime("");
                                  }}
                                  className="h-8 px-3 text-sm bg-white text-blue-700 hover:bg-white/90 border-none"
                                >
                                  <CalendarIcon className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditModal(lead)}
                                  className="h-8 px-3 text-sm bg-blue-700/30 border-blue-500/30 text-blue-100 hover:bg-blue-600/40"
                                >
                                  <PencilIcon className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <UserIcon className="h-8 w-8 text-blue-300/60 mx-auto mb-2" />
                  <p className="text-sm text-blue-100/80">
                    Nenhum lead {activeTab !== 'all' ? 'nesta categoria' : ''} encontrado
                  </p>
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </div>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={closeEditModal}>
        <DialogContent className="sm:max-w-[425px] bg-blue-800/90 backdrop-blur-sm p-0 rounded-lg border border-white/30">
          <div className="p-4 border-b border-blue-500/30">
            <DialogTitle className="text-lg font-medium text-white">Editar Lead</DialogTitle>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm text-blue-100">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="h-9 bg-white/10 backdrop-blur-sm border-white/30 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm text-blue-100">Telefone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="h-9 bg-white/10 backdrop-blur-sm border-white/30 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm text-blue-100">Status</Label>
                <Select name="status" value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                  <SelectTrigger className="h-9 bg-white/10 backdrop-blur-sm border-white/30 text-white">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent className="bg-blue-800/80 backdrop-blur-sm border border-blue-500/30 text-white">
                    <SelectItem value="Novo" className="text-blue-100 focus:bg-blue-700/50">Novo</SelectItem>
                    <SelectItem value="Agendado" className="text-blue-100 focus:bg-blue-700/50">Agendado</SelectItem>
                    <SelectItem value="Compareceu" className="text-blue-100 focus:bg-blue-700/50">Compareceu</SelectItem>
                    <SelectItem value="Fechado" className="text-blue-100 focus:bg-blue-700/50">Fechado</SelectItem>
                    <SelectItem value="Não veio" className="text-blue-100 focus:bg-blue-700/50">Não veio</SelectItem>
                    <SelectItem value="Cancelado" className="text-blue-100 focus:bg-blue-700/50">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="appointmentDate" className="text-sm text-blue-100">Data</Label>
                  <Input
                    id="appointmentDate"
                    name="appointmentDate"
                    type="date"
                    value={formData.appointmentDate}
                    onChange={handleInputChange}
                    className="h-9 bg-white/10 backdrop-blur-sm border-white/30 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointmentTime" className="text-sm text-blue-100">Hora</Label>
                  <Input
                    id="appointmentTime"
                    name="appointmentTime"
                    type="time"
                    value={formData.appointmentTime}
                    onChange={handleInputChange}
                    className="h-9 bg-white/10 backdrop-blur-sm border-white/30 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="medicalNotes" className="text-sm text-blue-100">Anotações</Label>
                <Textarea
                  id="medicalNotes"
                  name="medicalNotes"
                  value={formData.medicalNotes}
                  onChange={handleInputChange}
                  className="min-h-[80px] bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/50"
                  placeholder="Adicione observações..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeEditModal}
                className="h-9 px-4 bg-blue-700/30 border-blue-500/30 text-blue-100 hover:bg-blue-600/40"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-9 px-4 bg-white text-blue-700 hover:bg-white/90 border-none"
              >
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Agendamento Rápido */}
      <Dialog open={!!quickEditLead} onOpenChange={() => setQuickEditLead(null)}>
        <DialogContent className="sm:max-w-[360px] bg-blue-800/90 backdrop-blur-sm p-0 rounded-lg border border-white/30">
          <div className="p-4 border-b border-blue-500/30">
            <DialogTitle className="text-lg font-medium text-white">Agendar Consulta</DialogTitle>
            <p className="text-sm text-blue-100/80 mt-1">{quickEditLead?.name}</p>
          </div>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-blue-100">Data</Label>
              <Input
                type="date"
                value={quickAppointmentDate}
                onChange={(e) => setQuickAppointmentDate(e.target.value)}
                className="h-9 bg-white/10 backdrop-blur-sm border-white/30 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-blue-100">Hora</Label>
              <Input
                type="time"
                value={quickAppointmentTime}
                onChange={(e) => setQuickAppointmentTime(e.target.value)}
                className="h-9 bg-white/10 backdrop-blur-sm border-white/30 text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setQuickEditLead(null)}
                className="h-9 px-4 bg-blue-700/30 border-blue-500/30 text-blue-100 hover:bg-blue-600/40"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleQuickSchedule}
                disabled={isQuickSubmitting || !quickAppointmentDate}
                className="h-9 px-4 bg-white text-blue-700 hover:bg-white/90 border-none"
              >
                {isQuickSubmitting ? "Agendando..." : "Agendar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 