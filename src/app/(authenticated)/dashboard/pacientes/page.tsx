'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { 
  MagnifyingGlassIcon, 
  PencilIcon, 
  XMarkIcon, 
  PhoneIcon, 
  UserIcon, 
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  EyeIcon,
  PlusIcon,
  TrashIcon,
  EnvelopeIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  lead: {
    status: string;
    appointmentDate: string | null;
    medicalNotes: string | null;
  };
}

export default function PacientesPage() {
  const { data: session } = useSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createStep, setCreateStep] = useState<'personal' | 'clinical'>('personal');
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "",
    appointmentDate: "",
    medicalNotes: ""
  });
  const [createFormData, setCreateFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "novo",
    appointmentDate: "",
    medicalNotes: "",
    hasPortalAccess: false
  });
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [sendingPortalConfig, setSendingPortalConfig] = useState<{ [key: string]: boolean }>({});
  const [portalConfigSent, setPortalConfigSent] = useState<{ [key: string]: boolean }>({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isCreateStatusOpen, setIsCreateStatusOpen] = useState(false);
  const router = useRouter();

  // Buscar dados reais de pacientes da API
  useEffect(() => {
    const fetchPatients = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        const response = await fetch('/api/patients');
        
        if (response.ok) {
          const data = await response.json();
          setPatients(data.data || []);
        } else {
          console.error('Erro ao buscar pacientes:', response.statusText);
          setPatients([]);
        }
      } catch (error) {
        console.error('Erro ao buscar pacientes:', error);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [session]);

  // Add click outside handler for both dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.status-dropdown')) {
        setIsStatusOpen(false);
        setIsCreateStatusOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
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
      case 'concluído':
        return (
          <Badge className="bg-green-100 text-green-800 border-none hover:bg-green-200 flex items-center gap-1">
            <CheckCircleIcon className="h-3 w-3" />
            <span>Atendido</span>
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

  const filteredPatients = patients.filter(patient => {
    // Filter by status if not "all"
    if (activeTab !== "all" && patient.lead.status !== activeTab) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        patient.name.toLowerCase().includes(term) ||
        patient.email.toLowerCase().includes(term) ||
        patient.phone.toLowerCase().includes(term)
      );
    }
    
    return true;
  });

  const handleViewPatient = (patient: Patient) => {
    setViewingPatient(patient);
    setIsViewModalOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setEditFormData({
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      status: patient.lead.status,
      appointmentDate: patient.lead.appointmentDate 
        ? new Date(patient.lead.appointmentDate).toISOString().slice(0, 16)
        : "",
      medicalNotes: patient.lead.medicalNotes || ""
    });
    setIsEditModalOpen(true);
  };

  const handleCreatePatient = () => {
    setCreateFormData({
      name: "",
      email: "",
      phone: "",
      status: "novo",
      appointmentDate: "",
      medicalNotes: "",
      hasPortalAccess: false
    });
    setIsCreateModalOpen(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCreateFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: string) => {
    setEditFormData(prev => ({ ...prev, status: value }));
  };

  const handleCreateStatusChange = (status: string) => {
    setCreateFormData(prev => ({
      ...prev,
      status
    }));
  };

  const handleUpdatePatient = async () => {
    if (!editingPatient) return;

    // Validar dados obrigatórios
    if (!editFormData.name || !editFormData.email || !editFormData.phone) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/patients/${editingPatient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editFormData.name.trim(),
          email: editFormData.email.trim(),
          phone: editFormData.phone.trim(),
          lead: {
            status: editFormData.status,
            appointmentDate: editFormData.appointmentDate || null,
            medicalNotes: editFormData.medicalNotes || null
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Atualiza o paciente na lista local
        setPatients(prevPatients => 
          prevPatients.map(p => 
            p.id === editingPatient.id ? data : p
          )
        );
        
        toast({
          title: "Sucesso",
          description: "As informações do paciente foram atualizadas com sucesso.",
        });
        
        setIsEditModalOpen(false);
      } else {
        throw new Error(data.error || 'Erro ao atualizar paciente');
      }
    } catch (error) {
      console.error('Erro ao atualizar paciente:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível atualizar o paciente. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCreateNewPatient = async () => {
    // Validar campos obrigatórios
    if (!createFormData.name || !createFormData.email || !createFormData.phone) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createFormData.email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: createFormData.name,
          email: createFormData.email,
          phone: createFormData.phone,
          hasPortalAccess: createFormData.hasPortalAccess,
          lead: {
            status: createFormData.status,
            appointmentDate: createFormData.appointmentDate || null,
            medicalNotes: createFormData.medicalNotes || null
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Adiciona o novo paciente à lista local
        setPatients(prevPatients => [data.data, ...prevPatients]);
        
        toast({
          title: "Paciente criado",
          description: "O novo paciente foi criado com sucesso.",
        });
        
        // Limpar formulário e fechar modal
        setCreateFormData({
          name: "",
          email: "",
          phone: "",
          status: "novo",
          appointmentDate: "",
          medicalNotes: "",
          hasPortalAccess: false
        });
        setIsCreateModalOpen(false);
        setCreateStep('personal');
      } else {
        // Mostrar mensagem de erro específica da API
        throw new Error(data.error || 'Erro ao criar paciente');
      }
    } catch (error) {
      console.error('Erro ao criar paciente:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível criar o paciente. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleSendPortalConfig = async (patient: Patient) => {
    if (sendingPortalConfig[patient.id]) return;

    try {
      setSendingPortalConfig(prev => ({ ...prev, [patient.id]: true }));
      setPortalConfigSent(prev => ({ ...prev, [patient.id]: false }));

      const response = await fetch(`/api/patients/${patient.id}/send-portal-config`, {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: "E-mail enviado",
          description: "O e-mail de configuração do portal foi enviado com sucesso.",
        });
        setPortalConfigSent(prev => ({ ...prev, [patient.id]: true }));
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao enviar e-mail');
      }
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o e-mail de configuração. Tente novamente.",
        variant: "destructive",
      });
      setPortalConfigSent(prev => ({ ...prev, [patient.id]: false }));
    } finally {
      setSendingPortalConfig(prev => ({ ...prev, [patient.id]: false }));

      // Reset o status de enviado após 3 segundos
      setTimeout(() => {
        setPortalConfigSent(prev => ({ ...prev, [patient.id]: false }));
      }, 3000);
    }
  };

  const handleDeletePatient = async () => {
    if (!patientToDelete) return;

    try {
      const response = await fetch(`/api/patients/${patientToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove o paciente da lista local
        setPatients(prevPatients => prevPatients.filter(p => p.id !== patientToDelete.id));
        
        toast({
          title: "Sucesso",
          description: "Paciente excluído com sucesso.",
        });
        
        setIsDeleteModalOpen(false);
        setPatientToDelete(null);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao excluir paciente');
      }
    } catch (error) {
      console.error('Erro ao excluir paciente:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível excluir o paciente. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-gray-100 pt-20 pb-24 md:pt-12 md:pb-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border border-gray-400 border-t-gray-600"></div>
          <p className="text-xs text-gray-500 tracking-[-0.03em] font-inter">Carregando pacientes...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-[100dvh] bg-gray-100 pt-20 pb-24 md:pt-12 md:pb-16 px-2 sm:px-4">
      <div className="container mx-auto px-0 sm:pl-4 md:pl-8 lg:pl-16 max-w-full sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%]">
          <div className="flex flex-col gap-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
              <div>
                <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-[-0.03em] font-inter">Pacientes</h1>
                <p className="text-xs md:text-sm text-gray-600 tracking-[-0.03em] font-inter">Gerencie seus pacientes</p>
              </div>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full md:w-auto mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl h-11"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Novo Paciente
              </Button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200/50">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar pacientes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Tabs value={activeTab} className="w-full md:w-auto">
                    <TabsList className="h-11 bg-gray-50 p-1 rounded-lg">
                      <TabsTrigger 
                        value="all"
                        onClick={() => setActiveTab("all")}
                        className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Todos
                      </TabsTrigger>
                      <TabsTrigger 
                        value="novo"
                        onClick={() => setActiveTab("novo")}
                        className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Novos
                      </TabsTrigger>
                      <TabsTrigger 
                        value="agendado"
                        onClick={() => setActiveTab("agendado")}
                        className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Agendados
                      </TabsTrigger>
                      <TabsTrigger 
                        value="concluído"
                        onClick={() => setActiveTab("concluído")}
                        className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Concluídos
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </div>

            {/* Patient List */}
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                {/* Mobile view */}
                <div className="md:hidden divide-y divide-gray-200">
                  {filteredPatients.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <UserIcon className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">Nenhum paciente encontrado</h3>
                      <p className="text-sm text-gray-500">Tente ajustar seus filtros ou adicione um novo paciente.</p>
                    </div>
                  ) : (
                    filteredPatients.map((patient) => (
                      <div key={patient.id} className="p-4 bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900">{patient.name}</h3>
                            <p className="text-sm text-gray-500">{patient.email}</p>
                          </div>
                          {getStatusBadge(patient.lead?.status || 'novo')}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9 bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                            onClick={() => handleViewPatient(patient)}
                          >
                            <EyeIcon className="h-4 w-4 mr-1.5" />
                            Ver detalhes
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 px-2.5"
                            onClick={() => handleEditPatient(patient)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 px-2.5"
                            onClick={() => {
                              setPatientToDelete(patient);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                  </div>
                  
                  {/* Desktop table view */}
                <div className="hidden md:block">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                        <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                        <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="py-4 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Cadastro</th>
                        <th className="py-4 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPatients.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <UserIcon className="h-12 w-12 text-gray-400" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 mb-1">Nenhum paciente encontrado</h3>
                            <p className="text-sm text-gray-500">Tente ajustar seus filtros ou adicione um novo paciente.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredPatients.map((patient) => (
                        <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-medium text-gray-900">{patient.name}</div>
                          </td>
                            <td className="py-4 px-6 text-gray-500">{patient.email}</td>
                            <td className="py-4 px-6 text-gray-500">{patient.phone}</td>
                            <td className="py-4 px-6">{getStatusBadge(patient.lead?.status || 'novo')}</td>
                            <td className="py-4 px-6 text-gray-500">
                              {format(new Date(patient.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </td>
                            <td className="py-4 px-6">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                  className="h-9 bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                onClick={() => handleViewPatient(patient)}
                              >
                                  <EyeIcon className="h-4 w-4 mr-1.5" />
                                  Ver detalhes
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                  className="h-9 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 px-2.5"
                                onClick={() => handleEditPatient(patient)}
                              >
                                  <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                  className="h-9 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 px-2.5"
                                  onClick={() => {
                                    setPatientToDelete(patient);
                                    setIsDeleteModalOpen(true);
                                  }}
                                >
                                  <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        </div>

      {/* View Modal */}
      <Sheet open={isViewModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsViewModalOpen(false);
          setIsEditModalOpen(false);
        }
      }}>
        <SheetContent side="right" className="w-full sm:max-w-[900px] p-0 bg-gray-50">
          <div className="flex h-full flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
              <SheetHeader className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-blue-600" />
                    </div>
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-xl font-semibold text-gray-900 truncate">
                      {isEditModalOpen ? 'Editar Paciente' : viewingPatient?.name}
                    </SheetTitle>
                    {!isEditModalOpen && viewingPatient?.lead?.status && (
                      <div className="mt-1">
                        {getStatusBadge(viewingPatient.lead.status)}
                      </div>
                    )}
                        </div>
                      </div>
              </SheetHeader>
                  </div>

            <ScrollArea className="flex-1">
              {isEditModalOpen ? (
                // Edit Form
                <div className="p-6">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="name">Nome completo</Label>
                      <Input 
                        id="name" 
                        name="name"
                        value={editFormData.name}
                        onChange={handleFormChange}
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email"
                        type="email" 
                        value={editFormData.email}
                        onChange={handleFormChange}
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input 
                        id="phone" 
                        name="phone"
                        value={editFormData.phone}
                        onChange={handleFormChange}
                        className="mt-1.5"
                      />
                  </div>
                  
                    <div>
                      <Label>Status</Label>
                      <div className="relative mt-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                          onClick={() => setIsStatusOpen(!isStatusOpen)}
                        >
                          <span>{editFormData.status || 'Selecione um status'}</span>
                          <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                        {isStatusOpen && (
                          <div className="absolute top-full left-0 w-full z-50 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg">
                            <div className="p-1">
                              {['novo', 'contato', 'agendado', 'concluído'].map((status) => (
                                <button
                                  key={status}
                                  className={cn(
                                    'w-full flex items-center px-3 py-2 rounded-md text-sm',
                                    editFormData.status === status ? 'bg-gray-100' : 'hover:bg-gray-50'
                                  )}
                                  onClick={() => {
                                    handleStatusChange(status);
                                    setIsStatusOpen(false);
                                  }}
                                >
                                  {status}
                                </button>
                              ))}
                    </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="appointmentDate">Data da Consulta</Label>
                      <Input
                        id="appointmentDate"
                        name="appointmentDate"
                        type="datetime-local"
                        value={editFormData.appointmentDate}
                        onChange={handleFormChange}
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="medicalNotes">Prontuário Médico</Label>
                      <Textarea 
                        id="medicalNotes" 
                        name="medicalNotes"
                        value={editFormData.medicalNotes}
                        onChange={handleFormChange}
                        className="mt-1.5 min-h-[150px]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // View Content
                <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
                  {/* Sidebar Info */}
                  <div className="lg:col-span-1 bg-white lg:border-r border-gray-200 p-6">
                    <div className="space-y-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Email</Label>
                        <div className="flex items-center gap-2 group mt-1.5">
                          <p className="text-base text-gray-900 truncate flex-1 min-w-0">{viewingPatient?.email}</p>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(viewingPatient?.email || '');
                              toast({
                                title: "Email copiado",
                                description: "O email foi copiado para a área de transferência.",
                              });
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                            title="Copiar email"
                          >
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                        <div className="flex items-center gap-2 group mt-1.5">
                          <p className="text-base text-gray-900 flex-1 min-w-0">{viewingPatient?.phone}</p>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(viewingPatient?.phone || '');
                              toast({
                                title: "Telefone copiado",
                                description: "O telefone foi copiado para a área de transferência.",
                              });
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                            title="Copiar telefone"
                          >
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-500">Data de cadastro</Label>
                        <p className="text-base text-gray-900 mt-1.5">
                          {viewingPatient && format(new Date(viewingPatient.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>

                      <Separator className="my-6" />

              <Button 
                variant="outline" 
                        onClick={() => handleSendPortalConfig(viewingPatient!)}
                        disabled={sendingPortalConfig[viewingPatient?.id || '']}
                        className="w-full h-10"
                      >
                        {sendingPortalConfig[viewingPatient?.id || ''] ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2" />
                            Enviando...
                          </>
                        ) : portalConfigSent[viewingPatient?.id || ''] ? (
                          <>
                            <CheckCircleIcon className="h-4 w-4 mr-2 text-green-600" />
                            Acesso enviado
                          </>
                        ) : (
                          <>
                            <EnvelopeIcon className="h-4 w-4 mr-2" />
                            Enviar acesso ao portal
                          </>
                        )}
              </Button>
            </div>
                  </div>

                  {/* Main Content */}
                  <div className="lg:col-span-2 p-6 space-y-6">
                    {/* Próxima Consulta */}
                    {viewingPatient?.lead?.appointmentDate ? (
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <CalendarIcon className="h-5 w-5 text-purple-600" />
                    </div>
                          <h3 className="text-base font-medium text-gray-900">Próxima Consulta</h3>
                    </div>
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 text-purple-700 rounded-lg w-fit">
                          <CalendarIcon className="h-5 w-5" />
                          <time className="text-base">
                            {format(new Date(viewingPatient.lead.appointmentDate), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                          </time>
                    </div>
                    </div>
                    ) : (
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <CalendarIcon className="h-5 w-5 text-purple-600" />
                  </div>
                          <h3 className="text-base font-medium text-gray-900">Próxima Consulta</h3>
                </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-gray-50 rounded-lg text-base text-gray-600">
                          <div className="flex items-center gap-3">
                            <CalendarIcon className="h-6 w-6 text-gray-400 shrink-0" />
                            <p>Nenhuma consulta agendada</p>
                          </div>
                          <Button
                            variant="link"
                            className="h-auto p-0 text-blue-600 hover:text-blue-700"
                            onClick={() => {
                              setIsViewModalOpen(false);
                              setIsEditModalOpen(true);
                            }}
                          >
                            Agendar consulta
                          </Button>
                    </div>
                    </div>
                    )}

                    {/* Prontuário */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <ClipboardDocumentIcon className="h-5 w-5 text-green-600" />
                    </div>
                          <h3 className="text-base font-medium text-gray-900">Prontuário Médico</h3>
                  </div>
                        {!viewingPatient?.lead?.medicalNotes && (
                          <Button
                            variant="link"
                            className="h-auto p-0 text-blue-600 hover:text-blue-700 whitespace-nowrap"
                            onClick={() => {
                              setIsViewModalOpen(false);
                              setIsEditModalOpen(true);
                            }}
                          >
                            Adicionar anotação
                          </Button>
                        )}
                      </div>
                      
                      {viewingPatient?.lead?.medicalNotes ? (
                        <div className="bg-gray-50 rounded-lg p-6">
                          <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">{viewingPatient.lead.medicalNotes}</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg text-base text-gray-600">
                          <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                          <p>Nenhuma anotação disponível</p>
                </div>
              )}
            </div>
                  </div>
                </div>
              )}
            </ScrollArea>
            
            <div className="px-6 py-4 border-t border-gray-200 bg-white">
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setIsEditModalOpen(false);
                  }} 
                  className="h-10"
                >
                  Cancelar
                </Button>
                {isEditModalOpen ? (
                <Button 
                    onClick={handleUpdatePatient}
                    className="h-10"
                  >
                    Salvar alterações
                  </Button>
                ) : (
                  <Button 
                  onClick={() => {
                      setIsViewModalOpen(false);
                      setIsEditModalOpen(true);
                    }}
                    className="h-10"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Editar
                </Button>
                )}
              </div>
      </div>
    </div>
        </SheetContent>
      </Sheet>
    </>
  );
} 