'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MagnifyingGlassIcon, PencilIcon, XMarkIcon } from "@heroicons/react/24/outline";
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
import { CalendarIcon } from "@heroicons/react/24/outline";

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
      // Como o campo status pode não estar disponível no banco de dados, 
      // vamos atualizar os campos que sabemos que existem
      const response = await fetch(`/api/leads?leadId=${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: lead.name,
          phone: lead.phone
        })
      });

      if (response.ok) {
        toast({
          title: "Lead atualizado",
          description: `Operação realizada com sucesso`,
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
    const status = lead.status || 'Novo';
    
    const getStatusBadge = () => {
      switch (status) {
        case 'Novo':
          return <Badge variant="outline">Novo</Badge>;
        case 'Em contato':
          return <Badge className="bg-blue-700/20 text-blue-400 border-blue-700/30">Em contato</Badge>;
        case 'Agendado':
          return <Badge className="bg-green-700/20 text-green-400 border-green-700/30">Agendado</Badge>;
        case 'Compareceu':
          return <Badge className="bg-emerald-700/20 text-emerald-400 border-emerald-700/30">Compareceu</Badge>;
        case 'Não veio':
          return <Badge className="bg-red-700/20 text-red-400 border-red-700/30">Não veio</Badge>;
        case 'Fechado':
          return <Badge className="bg-purple-700/20 text-purple-400 border-purple-700/30">Fechado</Badge>;
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    };

    return (
      <Popover onOpenChange={(open: boolean) => {
        if (open) setStatusEditLead(lead);
        else if (!open) setStatusEditLead(null);
      }}>
        <PopoverTrigger asChild>
          <button className="cursor-pointer hover:opacity-80">
            {getStatusBadge()}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-0 bg-zinc-900 border-white/10">
          <div className="py-1.5">
            <p className="px-3 py-1.5 text-xs text-zinc-500 border-b border-white/10">Mudar status</p>
            <div className="divide-y divide-white/5">
              <button 
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-white/5 ${status === 'Novo' ? 'text-turquoise' : 'text-zinc-300'}`}
                onClick={() => handleStatusChange(lead, 'Novo')}
              >
                Novo
              </button>
              <button 
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-white/5 ${status === 'Em contato' ? 'text-turquoise' : 'text-zinc-300'}`}
                onClick={() => handleStatusChange(lead, 'Em contato')}
              >
                Em contato
              </button>
              <button 
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-white/5 ${status === 'Agendado' ? 'text-turquoise' : 'text-zinc-300'}`}
                onClick={() => handleStatusChange(lead, 'Agendado')}
              >
                Agendado
              </button>
              <button 
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-white/5 ${status === 'Compareceu' ? 'text-turquoise' : 'text-zinc-300'}`}
                onClick={() => handleStatusChange(lead, 'Compareceu')}
              >
                Compareceu
              </button>
              <button 
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-white/5 ${status === 'Não veio' ? 'text-turquoise' : 'text-zinc-300'}`}
                onClick={() => handleStatusChange(lead, 'Não veio')}
              >
                Não veio
              </button>
              <button 
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-white/5 ${status === 'Fechado' ? 'text-turquoise' : 'text-zinc-300'}`}
                onClick={() => handleStatusChange(lead, 'Fechado')}
              >
                Fechado
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone.includes(searchTerm) ||
    (lead.status?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (lead.source?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (lead.indication?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-light">Leads</h1>
        <p className="text-zinc-400">Gerencie seus contatos</p>
      </div>

      <Card className="bg-black/20 border-white/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-light">Lista de Leads</CardTitle>
          <div className="relative w-full max-w-sm">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Buscar leads..."
              className="pl-9 bg-white/5 border-white/10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-white/10">
            <div className="grid grid-cols-7 gap-4 p-4 text-zinc-400 text-sm font-medium border-b border-white/10">
              <div>Nome</div>
              <div>Telefone</div>
              <div>Status</div>
              <div>Origem</div>
              <div>Valor</div>
              <div>Consulta</div>
              <div>Ações</div>
            </div>
            
            {loading ? (
              <div className="p-4 text-zinc-400">
                Carregando leads...
              </div>
            ) : filteredLeads.length > 0 ? (
              <div className="divide-y divide-white/5">
                {filteredLeads.map((lead) => (
                  <div key={lead.id} className="grid grid-cols-7 gap-4 p-4 text-zinc-300 hover:bg-white/5 transition-colors">
                    <div className="truncate">
                      {lead.name}
                      <div className="text-xs text-zinc-500">
                        {lead.indication?.name || lead.indication?.slug || "Link principal"}
                      </div>
                    </div>
                    <div>{lead.phone}</div>
                    <div>{renderStatus(lead)}</div>
                    <div className="truncate">
                      {lead.utmSource ? (
                        <div>
                          <span className="text-xs text-zinc-400">{lead.utmSource}</span>
                          {lead.utmMedium && (
                            <span className="text-xs text-zinc-500"> / {lead.utmMedium}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-400">Direto</span>
                      )}
                    </div>
                    <div>
                      {lead.potentialValue 
                        ? <span className="text-green-100">R$ {lead.potentialValue.toFixed(0)}</span>
                        : <span className="text-zinc-500">-</span>
                      }
                    </div>
                    <div>
                      {lead.appointmentDate 
                        ? format(new Date(lead.appointmentDate), "dd/MM HH:mm", { locale: ptBR })
                        : (
                          <Popover onOpenChange={(open: boolean) => {
                            if (open) setQuickEditLead(lead);
                            else if (!open) setQuickEditLead(null);
                          }}>
                            <PopoverTrigger asChild>
                              <button className="text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1">
                                <span>Não agendado</span>
                                <CalendarIcon className="h-3.5 w-3.5" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-4 bg-zinc-900 border-white/10">
                              <div className="space-y-4">
                                <h4 className="font-medium">Agendar consulta para</h4>
                                <p className="text-sm text-zinc-400">{lead.name}</p>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <Label htmlFor="quick-date">Data</Label>
                                    <Input
                                      id="quick-date"
                                      type="date"
                                      className="bg-white/5 border-white/10"
                                      value={quickAppointmentDate}
                                      onChange={(e) => setQuickAppointmentDate(e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label htmlFor="quick-time">Hora</Label>
                                    <Input
                                      id="quick-time"
                                      type="time"
                                      className="bg-white/5 border-white/10"
                                      value={quickAppointmentTime}
                                      onChange={(e) => setQuickAppointmentTime(e.target.value)}
                                    />
                                  </div>
                                </div>
                                
                                <div className="flex justify-end">
                                  <Button
                                    className="bg-gradient-to-r from-turquoise/80 to-turquoise/60"
                                    disabled={isQuickSubmitting || !quickAppointmentDate}
                                    onClick={handleQuickSchedule}
                                  >
                                    {isQuickSubmitting ? "Agendando..." : "Agendar"}
                                  </Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )
                      }
                    </div>
                    <div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 bg-white/5 hover:bg-white/10 border border-white/10"
                        title="Editar lead"
                        onClick={() => openEditModal(lead)}
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-zinc-400">
                Nenhum lead encontrado.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>Editar Lead</DialogTitle>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={closeEditModal}
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="bg-white/5 border-white/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10">
                    <SelectItem value="Novo">Novo</SelectItem>
                    <SelectItem value="Em contato">Em contato</SelectItem>
                    <SelectItem value="Agendado">Agendado</SelectItem>
                    <SelectItem value="Compareceu">Compareceu</SelectItem>
                    <SelectItem value="Não veio">Não veio</SelectItem>
                    <SelectItem value="Fechado">Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="interest">Interesse</Label>
                <Input
                  id="interest"
                  name="interest"
                  value={formData.interest}
                  onChange={handleInputChange}
                  className="bg-white/5 border-white/10"
                  placeholder="Ex: Consulta, Exame..."
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="potentialValue">Valor Potencial (R$)</Label>
                <Input
                  id="potentialValue"
                  name="potentialValue"
                  value={formData.potentialValue}
                  onChange={handleInputChange}
                  className="bg-white/5 border-white/10"
                  placeholder="Ex: 350.00"
                  type="number"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointmentDate">Data da Consulta</Label>
                <Input
                  id="appointmentDate"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleInputChange}
                  className="bg-white/5 border-white/10"
                  type="date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointmentTime">Hora</Label>
                <Input
                  id="appointmentTime"
                  name="appointmentTime"
                  value={formData.appointmentTime}
                  onChange={handleInputChange}
                  className="bg-white/5 border-white/10"
                  type="time"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalNotes">Anotações Médicas</Label>
              <Textarea
                id="medicalNotes"
                name="medicalNotes"
                value={formData.medicalNotes}
                onChange={handleInputChange}
                className="bg-white/5 border-white/10 min-h-[100px]"
                placeholder="Observações sobre o paciente, condição, histórico..."
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline"
                onClick={closeEditModal}
                className="bg-white/5 hover:bg-white/10 border-white/10"
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-turquoise/80 to-turquoise/60"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 