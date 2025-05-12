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
  TrashIcon,
  EnvelopeIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
  DocumentTextIcon,
  TableCellsIcon
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Select as UISelect,
  SelectContent as UISelectContent,
  SelectGroup as UISelectGroup,
  SelectItem as UISelectItem,
  SelectLabel as UISelectLabel,
  SelectTrigger as UISelectTrigger,
  SelectValue as UISelectValue,
  SelectSeparator as UISelectSeparator
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CSVImportModal } from "@/components/leads/csv-import-modal";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  interest?: string;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  status: string;
  potentialValue?: number;
  appointmentDate: string | null;
  medicalNotes: string | null;
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
  const [activeTab, setActiveTab] = useState("all");
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "",
    appointmentDate: "",
    appointmentTime: "",
    medicalNotes: "",
    interest: "",
    potentialValue: "",
    source: ""
  });
  const [createFormData, setCreateFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "novo",
    appointmentDate: "",
    appointmentTime: "",
    medicalNotes: "",
    interest: "",
    potentialValue: "",
    source: ""
  });
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isCreateStatusOpen, setIsCreateStatusOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [totalLeads, setTotalLeads] = useState(0);
  const [displayedLeads, setDisplayedLeads] = useState<Lead[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchLeads();
      fetchDashboardData();
    }
  }, [session]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/leads');
      
      if (response.ok) {
        const data = await response.json();
        setLeads(Array.isArray(data) ? data : []);
      } else {
        console.error('Erro ao buscar leads:', response.statusText);
        setLeads([]);
      }
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'novo':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-none hover:bg-blue-200 flex items-center gap-1">
            <UserIcon className="h-3 w-3" />
            <span>Novo</span>
          </Badge>
        );
      case 'contato':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-none hover:bg-amber-200 flex items-center gap-1">
            <PhoneIcon className="h-3 w-3" />
            <span>Contato</span>
          </Badge>
        );
      case 'agendado':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-none hover:bg-purple-200 flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            <span>Agendado</span>
          </Badge>
        );
      case 'convertido':
        return (
          <Badge className="bg-green-100 text-green-800 border-none hover:bg-green-200 flex items-center gap-1">
            <CheckCircleIcon className="h-3 w-3" />
            <span>Convertido</span>
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-none hover:bg-gray-200 flex items-center gap-1">
            <ClockIcon className="h-3 w-3" />
            <span>{status || 'Desconhecido'}</span>
          </Badge>
        );
    }
  };

  // Filtering logic is handled by getFilteredLeads function below

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
    
    // Se for o campo de telefone, formata o número
    if (name === 'phone') {
      setEditFormData(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
    } else {
      setEditFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'status') {
      setEditFormData(prev => ({ ...prev, status: value }));
      
      // Se o status for alterado para "Fechado", significa que o lead foi convertido para paciente
      if (value === 'Fechado') {
        toast({
          title: "Lead convertido",
          description: "Lead foi convertido para paciente com sucesso",
        });
      }
    } else {
      setEditFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;

    try {
      const response = await fetch(`/api/leads?leadId=${editingLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });

      if (response.ok) {
        toast({
          title: "Lead atualizado",
          description: "O lead foi atualizado com sucesso",
        });
        await fetchLeads();
        await fetchDashboardData();
        setIsEditModalOpen(false);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar lead');
      }
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
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
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createFormData)
      });

      if (response.ok) {
        toast({
          title: "Lead criado",
          description: "O lead foi criado com sucesso",
        });
        await fetchLeads();
        await fetchDashboardData();
        setIsCreateModalOpen(false);
        setCreateFormData({
          name: "",
          email: "",
          phone: "",
          status: "novo",
          appointmentDate: "",
          appointmentTime: "",
          medicalNotes: "",
          interest: "",
          potentialValue: "",
          source: ""
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
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gray-100 pt-20 pb-24 md:pt-12 md:pb-16 px-2 sm:px-4">
      <div className="container mx-auto px-0 sm:pl-4 md:pl-8 lg:pl-16 max-w-full sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-[-0.03em] font-inter">Lista de Leads</h2>
            <p className="text-xs md:text-sm text-gray-600 tracking-[-0.03em] font-inter">Gerencie seus leads e pacientes</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 bg-white text-gray-700 border-gray-200 hover:bg-gray-100">
                <PlusIcon className="h-4 w-4 mr-2" />
                <span>Adicionar</span>
                <ChevronDownIcon className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsCreateModalOpen(true)} className="cursor-pointer">
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                <span>Novo Lead</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsImportModalOpen(true)} className="cursor-pointer">
                <TableCellsIcon className="h-4 w-4 mr-2" />
                <span>Import CSV</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
          <CardContent className="pt-6 pb-4 sm:pb-3 px-6 sm:px-4">
            {/* Desktop Search and Filter */}
            <div className="hidden md:flex items-center justify-end gap-4 mb-8">
              <UISelect
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <UISelectTrigger className="w-[180px] bg-white border-gray-200 focus:border-gray-300 text-gray-900 rounded-xl h-10">
                  <UISelectValue placeholder="Filtrar por status" />
                </UISelectTrigger>
                <UISelectContent>
                  <UISelectGroup>
                    <UISelectLabel>Status</UISelectLabel>
                    <UISelectItem value="all">Todos</UISelectItem>
                    <UISelectItem value="novos">Novos</UISelectItem>
                    <UISelectItem value="agendados">Agendados</UISelectItem>
                    <UISelectItem value="compareceram">Compareceram</UISelectItem>
                    <UISelectItem value="fechados">Fechados</UISelectItem>
                    <UISelectItem value="naoVieram">Não vieram</UISelectItem>
                  </UISelectGroup>
                  <UISelectSeparator />
                  <UISelectGroup>
                    <UISelectLabel>Tipo</UISelectLabel>
                    <UISelectItem value="leads">Leads</UISelectItem>
                    <UISelectItem value="patients">Pacientes</UISelectItem>
                    <UISelectItem value="vips">VIPs</UISelectItem>
                  </UISelectGroup>
                </UISelectContent>
              </UISelect>
              
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
                <UISelect
                  value={activeTab}
                  onValueChange={setActiveTab}
                >
                  <UISelectTrigger className="flex-1 bg-white border-gray-200 focus:border-gray-300 text-gray-900 rounded-xl h-10">
                    <UISelectValue placeholder="Filtrar" />
                  </UISelectTrigger>
                  <UISelectContent>
                    <UISelectGroup>
                      <UISelectLabel>Status</UISelectLabel>
                      <UISelectItem value="all">Todos</UISelectItem>
                      <UISelectItem value="novos">Novos</UISelectItem>
                      <UISelectItem value="agendados">Agendados</UISelectItem>
                      <UISelectItem value="compareceram">Compareceram</UISelectItem>
                      <UISelectItem value="fechados">Fechados</UISelectItem>
                      <UISelectItem value="naoVieram">Não vieram</UISelectItem>
                    </UISelectGroup>
                    <UISelectSeparator />
                    <UISelectGroup>
                      <UISelectLabel>Tipo</UISelectLabel>
                      <UISelectItem value="leads">Leads</UISelectItem>
                      <UISelectItem value="patients">Pacientes</UISelectItem>
                      <UISelectItem value="vips">VIPs</UISelectItem>
                    </UISelectGroup>
                  </UISelectContent>
                </UISelect>

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
                          {getStatusBadge(lead.status)}
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
                        {getStatusBadge(lead.status)}
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
      <Sheet open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <div className="space-y-4">
            <SheetHeader>
              <SheetTitle className="text-lg font-bold text-gray-900">Novo Lead</SheetTitle>
            </SheetHeader>

            <form onSubmit={handleCreateLead} className="space-y-6">
              {/* Informações Básicas */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Informações Básicas</h3>
                <div className="grid gap-4 bg-gray-50/50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm text-gray-700">Nome</Label>
                    <Input
                      id="name"
                      name="name"
                      value={createFormData.name}
                      onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                      placeholder="Nome completo"
                      className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm text-gray-700">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={createFormData.email}
                      onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                      placeholder="Email do lead"
                      className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm text-gray-700">Telefone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={createFormData.phone}
                      onChange={(e) => setCreateFormData({ ...createFormData, phone: formatPhoneNumber(e.target.value) })}
                      placeholder="Telefone do lead"
                      className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Status e Origem */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Status e Origem</h3>
                <div className="grid gap-4 bg-gray-50/50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="source" className="text-sm text-gray-700">Origem</Label>
                    <UISelect
                      value={createFormData.source}
                      onValueChange={(value) => setCreateFormData({ ...createFormData, source: value })}
                    >
                      <UISelectTrigger className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900">
                        <UISelectValue placeholder="Selecione a origem" />
                      </UISelectTrigger>
                      <UISelectContent>
                        <UISelectItem value="website">Website</UISelectItem>
                        <UISelectItem value="social">Redes Sociais</UISelectItem>
                        <UISelectItem value="referral">Indicação</UISelectItem>
                        <UISelectItem value="other">Outro</UISelectItem>
                      </UISelectContent>
                    </UISelect>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  Criar Lead
                </Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      {/* Modal de edição */}
      <Sheet open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <div className="space-y-4">
            <SheetHeader>
              <SheetTitle className="text-lg font-bold text-gray-900">Editar Lead</SheetTitle>
            </SheetHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações Básicas */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Informações Básicas</h3>
                <div className="grid gap-4 bg-gray-50/50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm text-gray-700">Nome</Label>
                    <Input
                      id="name"
                      name="name"
                      value={editFormData.name}
                      onChange={handleInputChange}
                      placeholder="Nome completo"
                      className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm text-gray-700">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={editFormData.email}
                      onChange={handleInputChange}
                      placeholder="Email do lead"
                      className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm text-gray-700">Telefone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={editFormData.phone}
                      onChange={handleInputChange}
                      placeholder="Telefone do lead"
                      className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Status e Origem */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Status e Origem</h3>
                <div className="grid gap-4 bg-gray-50/50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm text-gray-700">Status</Label>
                    <UISelect
                      name="status"
                      value={editFormData.status}
                      onValueChange={(value) => handleSelectChange('status', value)}
                    >
                      <UISelectTrigger id="status" className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900">
                        <UISelectValue placeholder="Selecione o status" />
                      </UISelectTrigger>
                      <UISelectContent>
                        <UISelectGroup>
                          <UISelectLabel>Lead</UISelectLabel>
                          <UISelectItem value="Novo">Novo</UISelectItem>
                          <UISelectItem value="Agendado">Agendado</UISelectItem>
                          <UISelectItem value="Compareceu">Compareceu</UISelectItem>
                          <UISelectItem value="Não veio">Não veio</UISelectItem>
                          <UISelectItem value="Cancelado">Cancelado</UISelectItem>
                        </UISelectGroup>
                        <UISelectSeparator />
                        <UISelectGroup>
                          <UISelectLabel>Converter para</UISelectLabel>
                          <UISelectItem value="Fechado">Paciente</UISelectItem>
                        </UISelectGroup>
                      </UISelectContent>
                    </UISelect>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="source" className="text-sm text-gray-700">Origem</Label>
                    <UISelect
                      value={editFormData.source}
                      onValueChange={(value) => handleSelectChange('source', value)}
                    >
                      <UISelectTrigger className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900">
                        <UISelectValue placeholder="Selecione a origem" />
                      </UISelectTrigger>
                      <UISelectContent>
                        <UISelectItem value="website">Website</UISelectItem>
                        <UISelectItem value="social">Redes Sociais</UISelectItem>
                        <UISelectItem value="referral">Indicação</UISelectItem>
                        <UISelectItem value="other">Outro</UISelectItem>
                      </UISelectContent>
                    </UISelect>
                  </div>
                </div>
              </div>

              {/* Interesse e Valor */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Interesse e Valor</h3>
                <div className="grid gap-4 bg-gray-50/50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="interest" className="text-sm text-gray-700">Interesse</Label>
                    <Input
                      id="interest"
                      name="interest"
                      value={editFormData.interest}
                      onChange={handleInputChange}
                      placeholder="Interesse do lead"
                      className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="potentialValue" className="text-sm text-gray-700">Valor Potencial</Label>
                    <Input
                      id="potentialValue"
                      name="potentialValue"
                      type="number"
                      value={editFormData.potentialValue}
                      onChange={handleInputChange}
                      placeholder="Valor potencial do lead"
                      className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Agendamento */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Agendamento</h3>
                <div className="grid gap-4 bg-gray-50/50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="appointmentDate" className="text-sm text-gray-700">Data da Consulta</Label>
                    <Input
                      id="appointmentDate"
                      name="appointmentDate"
                      type="date"
                      value={editFormData.appointmentDate}
                      onChange={handleInputChange}
                      className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="appointmentTime" className="text-sm text-gray-700">Horário da Consulta</Label>
                    <Input
                      id="appointmentTime"
                      name="appointmentTime"
                      type="time"
                      value={editFormData.appointmentTime}
                      onChange={handleInputChange}
                      className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Observações</h3>
                <div className="bg-gray-50/50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="medicalNotes" className="text-sm text-gray-700">Observações</Label>
                    <Textarea
                      id="medicalNotes"
                      name="medicalNotes"
                      value={editFormData.medicalNotes}
                      onChange={handleInputChange}
                      placeholder="Observações sobre o lead"
                      className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 min-h-[100px]"
                    />
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeEditModal}
                  className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      {/* Modal de Visualização */}
      <Sheet open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <div className="space-y-4">
            <SheetHeader>
              <SheetTitle className="text-lg font-bold text-gray-900">Detalhes do Lead</SheetTitle>
            </SheetHeader>

            {viewingLead && (
              <div className="space-y-6">
                {/* Informações Básicas */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Informações Básicas</h3>
                  <div className="grid gap-4 bg-gray-50/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{viewingLead.name}</p>
                        <p className="text-xs text-gray-500">Nome completo</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{viewingLead.email || 'Não informado'}</p>
                        <p className="text-xs text-gray-500">Email</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{viewingLead.phone}</p>
                        <p className="text-xs text-gray-500">Telefone</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status e Origem */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Status e Origem</h3>
                  <div className="grid gap-4 bg-gray-50/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ChartBarIcon className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(viewingLead.status)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Status atual</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BriefcaseIcon className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{viewingLead.source || 'Não informado'}</p>
                        <p className="text-xs text-gray-500">Origem do lead</p>
                      </div>
                    </div>
                    {viewingLead.indication?.name && (
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{viewingLead.indication.name}</p>
                          <p className="text-xs text-gray-500">Indicação</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Interesse e Valor */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Interesse e Valor</h3>
                  <div className="grid gap-4 bg-gray-50/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{viewingLead.interest || 'Não informado'}</p>
                        <p className="text-xs text-gray-500">Interesse</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {viewingLead.potentialValue 
                            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(viewingLead.potentialValue)
                            : 'Não informado'
                          }
                        </p>
                        <p className="text-xs text-gray-500">Valor potencial</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Agendamento */}
                {viewingLead.appointmentDate && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Agendamento</h3>
                    <div className="grid gap-4 bg-gray-50/50 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(viewingLead.appointmentDate).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-xs text-gray-500">Data da consulta</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Observações */}
                {viewingLead.medicalNotes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Observações</h3>
                    <div className="bg-gray-50/50 p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <ClipboardDocumentIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewingLead.medicalNotes}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ações */}
                <div className="flex items-center justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      openEditModal(viewingLead);
                    }}
                    className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleDeleteLead(viewingLead);
                    }}
                    className="bg-white border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={() => {
          fetchLeads();
          fetchDashboardData();
        }}
      />
    </div>
  );
} 