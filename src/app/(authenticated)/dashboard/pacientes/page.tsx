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
  BriefcaseIcon,
  ClockIcon,
  CheckCircleIcon,
  EyeIcon,
  PlusIcon,
  TrashIcon,
  ArrowRightIcon,
  EnvelopeIcon
} from "@heroicons/react/24/outline";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

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

  const handleCreateStatusChange = (value: string) => {
    setCreateFormData(prev => ({ ...prev, status: value }));
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

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatients(prev => {
      if (prev.includes(patientId)) {
        return prev.filter(id => id !== patientId)
      }
      return [...prev, patientId]
    })
  }

  const handleSelectAll = () => {
    if (selectedPatients.length === filteredPatients.length) {
      setSelectedPatients([])
    } else {
      setSelectedPatients(filteredPatients.map(patient => patient.id))
    }
  }

  const handleDeletePatient = async (patientId: string) => {
    if (!confirm('Tem certeza que deseja excluir este paciente?')) {
      return;
    }

    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove o paciente da lista local
        setPatients(prevPatients => prevPatients.filter(p => p.id !== patientId));
        
        toast({
          title: "Paciente excluído",
          description: "O paciente foi excluído com sucesso.",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao excluir paciente');
      }
    } catch (error) {
      console.error('Erro ao excluir paciente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o paciente. Tente novamente.",
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-600"></div>
        </div>
        <p className="text-center mt-4 text-gray-600">Carregando pacientes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-100 pt-20 pb-24 md:pt-12 md:pb-16 px-2 sm:px-4">
      <div className="container mx-auto px-0 sm:pl-4 md:pl-8 lg:pl-16 max-w-full sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-[-0.03em] font-inter">Pacientes</h1>
            <p className="text-xs md:text-sm text-gray-600 tracking-[-0.03em] font-inter">Gerencie seus pacientes</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-2">
            <div className="relative">
              <Input
                type="text"
                placeholder="Buscar pacientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full md:w-[280px] rounded-full border-gray-300 bg-white"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
            <Button 
              className="bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg-gray-800/10 text-xs"
              onClick={handleCreatePatient}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Novo Paciente
            </Button>
          </div>
        </div>

        <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-sm md:text-base font-bold text-gray-900 tracking-[-0.03em] font-inter">Lista de Pacientes</CardTitle>
            <CardDescription className="text-xs text-gray-500 tracking-[-0.03em] font-inter">
              Gerencie seus pacientes
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <div className="overflow-x-auto -mx-4 px-4">
              {/* Mobile view for small screens */}
              <div className="md:hidden space-y-4">
                {filteredPatients.map((patient) => (
                  <div key={patient.id} className="bg-white p-3 rounded-xl shadow-sm">
                    <div className="font-medium text-sm text-gray-900 mb-1">{patient.name}</div>
                    <div className="text-gray-600 text-xs mb-2">{patient.email}</div>
                    <div className="text-gray-600 text-xs mb-2">{patient.phone}</div>
                    <div className="mb-3">{getStatusBadge(patient.lead?.status || 'novo')}</div>
                    <div className="flex justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white border-sky-300 text-sky-700 hover:bg-sky-50 hover:border-sky-400 hover:text-sky-800 transition-colors text-xs h-7 px-2 flex-1"
                        onClick={() => handleViewPatient(patient)}
                      >
                        <EyeIcon className="h-3 w-3 mr-1" />
                        Visualizar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white border-sky-300 text-sky-700 hover:bg-sky-50 hover:border-sky-400 hover:text-sky-800 transition-colors text-xs h-7 px-2 flex-1"
                        onClick={() => handleEditPatient(patient)}
                      >
                        <PencilIcon className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white border-sky-300 text-sky-700 hover:bg-sky-50 hover:border-sky-400 hover:text-sky-800 transition-colors text-xs h-7 px-2 flex-1"
                        onClick={() => handleSendPortalConfig(patient)}
                        disabled={sendingPortalConfig[patient.id]}
                      >
                        {sendingPortalConfig[patient.id] ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-sky-700 mr-1" />
                            Enviando...
                          </>
                        ) : portalConfigSent[patient.id] ? (
                          <>
                            <CheckCircleIcon className="h-3 w-3 mr-1 text-green-600" />
                            Enviado
                          </>
                        ) : (
                          <>
                            <EnvelopeIcon className="h-3 w-3 mr-1" />
                            Enviar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop table view */}
              <table className="w-full hidden md:table">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">
                      <Checkbox
                        checked={selectedPatients.length === filteredPatients.length && filteredPatients.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Nome</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Email</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Telefone</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="py-2 px-3 text-left text-xs font-medium text-gray-500">Data de Cadastro</th>
                    <th className="py-2 px-3 text-right text-xs font-medium text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-2 px-3">
                        <Checkbox
                          checked={selectedPatients.includes(patient.id)}
                          onCheckedChange={() => handleSelectPatient(patient.id)}
                        />
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-medium text-sm text-gray-900">{patient.name}</div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="text-gray-600 text-xs">{patient.email}</div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="text-gray-600 text-xs">{patient.phone}</div>
                      </td>
                      <td className="py-2 px-3">
                        {getStatusBadge(patient.lead?.status || 'novo')}
                      </td>
                      <td className="py-2 px-3">
                        <div className="text-gray-600 text-xs">
                          {format(new Date(patient.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white border-sky-300 text-sky-700 hover:bg-sky-50 hover:border-sky-400 hover:text-sky-800 transition-colors text-xs h-7 px-2"
                            onClick={() => handleViewPatient(patient)}
                          >
                            <EyeIcon className="h-3 w-3 mr-1" />
                            Visualizar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white border-sky-300 text-sky-700 hover:bg-sky-50 hover:border-sky-400 hover:text-sky-800 transition-colors text-xs h-7 px-2"
                            onClick={() => handleEditPatient(patient)}
                          >
                            <PencilIcon className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white border-sky-300 text-sky-700 hover:bg-sky-50 hover:border-sky-400 hover:text-sky-800 transition-colors text-xs h-7 px-2"
                            onClick={() => handleSendPortalConfig(patient)}
                            disabled={sendingPortalConfig[patient.id]}
                          >
                            {sendingPortalConfig[patient.id] ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-sky-700 mr-1" />
                                Enviando...
                              </>
                            ) : portalConfigSent[patient.id] ? (
                              <>
                                <CheckCircleIcon className="h-3 w-3 mr-1 text-green-600" />
                                Enviado
                              </>
                            ) : (
                              <>
                                <EnvelopeIcon className="h-3 w-3 mr-1" />
                                Enviar confirmação
                              </>
                            )}
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

        {/* Modal de visualização do paciente */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="bg-white/90 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-3xl p-4 w-[95vw] max-w-4xl mx-auto">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-sm md:text-base font-bold text-gray-900 tracking-[-0.03em] font-inter">Detalhes do Paciente</CardTitle>
              <CardDescription className="text-xs text-gray-600 tracking-[-0.03em] font-inter">
                Informações detalhadas do paciente
              </CardDescription>
            </CardHeader>
            
            {viewingPatient && (
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50/50 rounded-2xl p-4 space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 tracking-[-0.03em] font-inter mb-1">Nome completo</p>
                      <p className="text-sm font-medium text-gray-900">{viewingPatient.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 tracking-[-0.03em] font-inter mb-1">Email</p>
                      <p className="text-sm font-medium text-gray-900">{viewingPatient.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 tracking-[-0.03em] font-inter mb-1">Telefone</p>
                      <p className="text-sm font-medium text-gray-900">{viewingPatient.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 tracking-[-0.03em] font-inter mb-1">Data de cadastro</p>
                      <p className="text-sm font-medium text-gray-900">
                        {format(new Date(viewingPatient.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50/50 rounded-2xl p-4 space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 tracking-[-0.03em] font-inter mb-1">Status</p>
                      <div>{getStatusBadge(viewingPatient.lead?.status || 'novo')}</div>
                    </div>
                    {viewingPatient.lead?.appointmentDate && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 tracking-[-0.03em] font-inter mb-1">Próxima consulta</p>
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(viewingPatient.lead.appointmentDate), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    )}
                    {viewingPatient.lead?.medicalNotes && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 tracking-[-0.03em] font-inter mb-1">Prontuário médico</p>
                        <div className="bg-white rounded-xl p-3 border border-gray-100">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewingPatient.lead.medicalNotes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
            
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setIsViewModalOpen(false)} 
                className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl h-9 text-xs px-4"
              >
                Fechar
              </Button>
              {viewingPatient && (
                <Button 
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-9 text-xs px-4" 
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleEditPatient(viewingPatient);
                  }}
                >
                  <PencilIcon className="h-3 w-3 mr-2" />
                  Editar Paciente
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de edição */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="bg-white/90 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-3xl p-4 w-[95vw] max-w-4xl mx-auto">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-sm md:text-base font-bold text-gray-900 tracking-[-0.03em] font-inter">Editar Paciente</CardTitle>
              <CardDescription className="text-xs text-gray-600 tracking-[-0.03em] font-inter">
                Atualize as informações do paciente
              </CardDescription>
            </CardHeader>
            
            {editingPatient && (
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50/50 rounded-2xl p-4 space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-xs font-medium text-gray-500 tracking-[-0.03em] font-inter">Nome completo</Label>
                      <Input 
                        id="name" 
                        name="name"
                        value={editFormData.name}
                        onChange={handleFormChange}
                        className="mt-1 h-9 bg-white border-gray-200 focus:border-gray-300 text-gray-900 text-sm rounded-xl" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-xs font-medium text-gray-500 tracking-[-0.03em] font-inter">Email</Label>
                      <Input 
                        id="email" 
                        name="email"
                        type="email" 
                        value={editFormData.email}
                        onChange={handleFormChange}
                        className="mt-1 h-9 bg-white border-gray-200 focus:border-gray-300 text-gray-900 text-sm rounded-xl" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-xs font-medium text-gray-500 tracking-[-0.03em] font-inter">Telefone</Label>
                      <Input 
                        id="phone" 
                        name="phone"
                        value={editFormData.phone}
                        onChange={handleFormChange}
                        className="mt-1 h-9 bg-white border-gray-200 focus:border-gray-300 text-gray-900 text-sm rounded-xl" 
                      />
                    </div>
                  </div>
                  
                  <div className="bg-gray-50/50 rounded-2xl p-4 space-y-4">
                    <div>
                      <Label htmlFor="status" className="text-xs font-medium text-gray-500 tracking-[-0.03em] font-inter">Status</Label>
                      <Select 
                        value={editFormData.status}
                        onValueChange={handleStatusChange}
                      >
                        <SelectTrigger className="mt-1 h-9 bg-white border-gray-200 focus:border-gray-300 text-gray-900 text-sm rounded-xl">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="novo">Novo</SelectItem>
                          <SelectItem value="contato">Contato</SelectItem>
                          <SelectItem value="agendado">Agendado</SelectItem>
                          <SelectItem value="concluído">Atendido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="appointmentDate" className="text-xs font-medium text-gray-500 tracking-[-0.03em] font-inter">Data da consulta</Label>
                      <Input
                        id="appointmentDate"
                        name="appointmentDate"
                        type="datetime-local"
                        value={editFormData.appointmentDate}
                        onChange={handleFormChange}
                        className="mt-1 h-9 bg-white border-gray-200 focus:border-gray-300 text-gray-900 text-sm rounded-xl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="medicalNotes" className="text-xs font-medium text-gray-500 tracking-[-0.03em] font-inter">Prontuário médico</Label>
                      <Textarea 
                        id="medicalNotes" 
                        name="medicalNotes"
                        value={editFormData.medicalNotes}
                        onChange={handleFormChange}
                        className="mt-1 min-h-[120px] bg-white border-gray-200 focus:border-gray-300 text-gray-900 text-sm rounded-xl" 
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
            
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setIsEditModalOpen(false)} 
                className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl h-9 text-xs px-4"
              >
                Cancelar
              </Button>
              <Button 
                className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-9 text-xs px-4" 
                onClick={handleUpdatePatient}
              >
                Salvar alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de criação de paciente */}
        <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) setCreateStep('personal');
        }}>
          <DialogContent className="max-w-[95vw] w-[1600px] p-0 overflow-hidden bg-white border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-3xl">
            <DialogHeader className="px-8 py-6 border-b border-gray-200 bg-gray-50">
              <DialogTitle className="text-2xl font-semibold text-gray-900">
                {createStep === 'personal' ? 'Informações Pessoais' : 'Dados Clínicos'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="p-8">
              {createStep === 'personal' ? (
                <div className="max-w-2xl mx-auto">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="create-name" className="text-sm font-medium text-gray-700">
                        Nome completo <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        id="create-name" 
                        name="name"
                        value={createFormData.name}
                        onChange={handleCreateFormChange}
                        className="mt-2 h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500" 
                        placeholder="Digite o nome completo do paciente"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="create-email" className="text-sm font-medium text-gray-700">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        id="create-email" 
                        name="email"
                        type="email" 
                        value={createFormData.email}
                        onChange={handleCreateFormChange}
                        className="mt-2 h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500" 
                        placeholder="Digite o email do paciente"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="create-phone" className="text-sm font-medium text-gray-700">
                        Telefone <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        id="create-phone" 
                        name="phone"
                        value={createFormData.phone}
                        onChange={handleCreateFormChange}
                        className="mt-2 h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500" 
                        placeholder="Digite o telefone do paciente"
                        required
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="portal-access"
                        checked={createFormData.hasPortalAccess}
                        onCheckedChange={(checked) => 
                          setCreateFormData(prev => ({ ...prev, hasPortalAccess: checked as boolean }))
                        }
                        className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-5 w-5"
                      />
                      <Label htmlFor="portal-access" className="text-sm font-medium text-gray-700">
                        Permitir acesso ao portal do paciente
                      </Label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="create-status" className="text-sm font-medium text-gray-700">Status</Label>
                      <Select 
                        value={createFormData.status}
                        onValueChange={handleCreateStatusChange}
                      >
                        <SelectTrigger className="mt-2 h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="novo">Novo</SelectItem>
                          <SelectItem value="contato">Contato</SelectItem>
                          <SelectItem value="agendado">Agendado</SelectItem>
                          <SelectItem value="concluído">Atendido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="create-appointmentDate" className="text-sm font-medium text-gray-700">Data da consulta</Label>
                      <Input
                        id="create-appointmentDate"
                        name="appointmentDate"
                        type="datetime-local"
                        value={createFormData.appointmentDate}
                        onChange={handleCreateFormChange}
                        className="mt-2 h-11 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                      />
                    </div>
                    <div>
                      <Label htmlFor="create-medicalNotes" className="text-sm font-medium text-gray-700">Prontuário médico</Label>
                      <Textarea 
                        id="create-medicalNotes" 
                        name="medicalNotes"
                        value={createFormData.medicalNotes}
                        onChange={handleCreateFormChange}
                        className="mt-2 min-h-40 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder:text-gray-500" 
                        placeholder="Digite as observações médicas do paciente"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="px-8 py-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between w-full">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if (createStep === 'clinical') {
                      setCreateStep('personal');
                    } else {
                      setIsCreateModalOpen(false);
                    }
                  }} 
                  className="h-11 px-6 bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
                >
                  {createStep === 'clinical' ? 'Voltar' : 'Cancelar'}
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-6" 
                  onClick={() => {
                    if (createStep === 'personal') {
                      // Validar campos do primeiro passo
                      if (!createFormData.name || !createFormData.email || !createFormData.phone) {
                        toast({
                          title: "Campos obrigatórios",
                          description: "Por favor, preencha nome, email e telefone antes de continuar.",
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

                      setCreateStep('clinical');
                    } else {
                      handleCreateNewPatient();
                    }
                  }}
                >
                  {createStep === 'personal' ? (
                    <>
                      Continuar
                      <ArrowRightIcon className="h-5 w-5 ml-2" />
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Criar Paciente
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 