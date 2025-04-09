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

    try {
      const response = await fetch(`/api/patients/${editingPatient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editFormData.name,
          email: editFormData.email,
          phone: editFormData.phone,
          lead: {
            status: editFormData.status,
            appointmentDate: editFormData.appointmentDate || null,
            medicalNotes: editFormData.medicalNotes || null
          }
        }),
      });

      if (response.ok) {
        // Atualiza o paciente na lista local
        setPatients(prevPatients => 
          prevPatients.map(p => 
            p.id === editingPatient.id 
              ? {
                  ...p,
                  name: editFormData.name,
                  email: editFormData.email,
                  phone: editFormData.phone,
                  lead: {
                    ...p.lead,
                    status: editFormData.status,
                    appointmentDate: editFormData.appointmentDate || null,
                    medicalNotes: editFormData.medicalNotes || null
                  }
                }
              : p
          )
        );
        
        toast({
          title: "Paciente atualizado",
          description: "As informações do paciente foram atualizadas com sucesso.",
        });
        
        setIsEditModalOpen(false);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar paciente');
      }
    } catch (error) {
      console.error('Erro ao atualizar paciente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o paciente. Tente novamente.",
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
    try {
      const response = await fetch(`/api/patients/${patient.id}/send-portal-config`, {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: "E-mail enviado",
          description: "O e-mail de configuração do portal foi enviado com sucesso.",
        });
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
    <div className="bg-blue-50 min-h-screen pt-20 pb-24 px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
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
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
              onClick={handleCreatePatient}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Novo Paciente
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 mb-6 bg-gray-100 rounded-xl p-1">
            <TabsTrigger 
              value="all" 
              className={`rounded-lg text-sm px-3 py-1.5 ${activeTab === "all" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600"}`}
            >
              Todos
            </TabsTrigger>
            <TabsTrigger 
              value="novo" 
              className={`rounded-lg text-sm px-3 py-1.5 ${activeTab === "novo" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600"}`}
            >
              Novos
            </TabsTrigger>
            <TabsTrigger 
              value="contato" 
              className={`rounded-lg text-sm px-3 py-1.5 ${activeTab === "contato" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600"}`}
            >
              Contato
            </TabsTrigger>
            <TabsTrigger 
              value="agendado" 
              className={`rounded-lg text-sm px-3 py-1.5 ${activeTab === "agendado" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600"}`}
            >
              Agendados
            </TabsTrigger>
            <TabsTrigger 
              value="concluído" 
              className={`rounded-lg text-sm px-3 py-1.5 ${activeTab === "concluído" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600"}`}
            >
              Atendidos
            </TabsTrigger>
          </TabsList>

          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredPatients.length > 0 ? (
              <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-gray-600">
                        <th className="px-4 py-3 font-medium">
                          <Checkbox
                            checked={selectedPatients.length === filteredPatients.length && filteredPatients.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </th>
                        <th className="px-4 py-3 font-medium">Nome</th>
                        <th className="px-4 py-3 font-medium">Email</th>
                        <th className="px-4 py-3 font-medium">Telefone</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Data de Cadastro</th>
                        <th className="px-4 py-3 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map((patient) => (
                        <tr key={patient.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <Checkbox
                              checked={selectedPatients.includes(patient.id)}
                              onCheckedChange={() => handleSelectPatient(patient.id)}
                            />
                          </td>
                          <td className="px-4 py-3 text-gray-900 font-medium">{patient.name}</td>
                          <td className="px-4 py-3 text-gray-700">{patient.email}</td>
                          <td className="px-4 py-3 text-gray-700">{patient.phone}</td>
                          <td className="px-4 py-3">{getStatusBadge(patient.lead?.status || 'novo')}</td>
                          <td className="px-4 py-3 text-gray-700">
                            {format(new Date(patient.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline"
                                className="h-10 px-4 bg-white border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                                onClick={() => handleViewPatient(patient)}
                              >
                                <EyeIcon className="h-5 w-5 mr-2" />
                                Visualizar
                              </Button>
                              <Button 
                                variant="outline"
                                className="h-10 px-4 bg-white border-gray-200 text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                                onClick={() => handleEditPatient(patient)}
                              >
                                <PencilIcon className="h-5 w-5 mr-2" />
                                Editar
                              </Button>
                              <Button 
                                variant="outline"
                                className="h-10 px-4 bg-white border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeletePatient(patient.id)}
                              >
                                <TrashIcon className="h-5 w-5 mr-2" />
                                Excluir
                              </Button>
                              <Button 
                                variant="outline"
                                className="h-10 px-4 bg-white border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => handleSendPortalConfig(patient)}
                              >
                                <EnvelopeIcon className="h-5 w-5 mr-2" />
                                Enviar Portal
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <Card className="border border-gray-200 shadow-sm bg-white">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-gray-100 p-4 mb-4">
                    <UserIcon className="h-8 w-8 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum paciente encontrado</h3>
                  <p className="text-gray-500 mb-6 text-center max-w-md">
                    {searchTerm ? 'Nenhum paciente corresponde aos critérios de busca.' : 'Você ainda não possui pacientes cadastrados.'}
                  </p>
                  <Button onClick={handleCreatePatient} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Adicionar Paciente
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </Tabs>

        {/* Modal de visualização do paciente */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-3xl">
            <DialogHeader className="px-6 py-4 border-b border-gray-200">
              <DialogTitle className="text-xl font-semibold text-gray-900">Detalhes do Paciente</DialogTitle>
            </DialogHeader>
            
            {viewingPatient && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="border border-gray-200 shadow-sm bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium text-gray-900">Informações Pessoais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-0">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Nome completo</p>
                        <p className="font-medium text-gray-900">{viewingPatient.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Email</p>
                        <p className="font-medium text-gray-900">{viewingPatient.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Telefone</p>
                        <p className="font-medium text-gray-900">{viewingPatient.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Data de cadastro</p>
                        <p className="font-medium text-gray-900">
                          {format(new Date(viewingPatient.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-gray-200 shadow-sm bg-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium text-gray-900">Dados Clínicos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-0">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <div className="mt-1">{getStatusBadge(viewingPatient.lead?.status || 'novo')}</div>
                      </div>
                      {viewingPatient.lead?.appointmentDate && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Próxima consulta</p>
                          <p className="font-medium text-gray-900">
                            {format(new Date(viewingPatient.lead.appointmentDate), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      )}
                      {viewingPatient.lead?.medicalNotes && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Prontuário médico</p>
                          <div className="mt-1 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                            <p className="whitespace-pre-wrap text-gray-800">{viewingPatient.lead.medicalNotes}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            
            <DialogFooter className="px-6 py-4 border-t border-gray-200">
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)} className="h-10 bg-white">
                Fechar
              </Button>
              {viewingPatient && (
                <Button className="bg-gray-900 hover:bg-gray-800 text-white h-10" onClick={() => {
                  setIsViewModalOpen(false);
                  handleEditPatient(viewingPatient);
                }}>
                  <PencilIcon className="h-5 w-5 mr-2" />
                  Editar Paciente
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de edição */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-3xl">
            <DialogHeader className="px-6 py-4 border-b border-gray-200">
              <DialogTitle className="text-xl font-semibold text-gray-900">Editar Paciente</DialogTitle>
            </DialogHeader>
            
            {editingPatient && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">Nome completo</Label>
                      <Input 
                        id="name" 
                        name="name"
                        value={editFormData.name}
                        onChange={handleFormChange}
                        className="mt-1 h-10 bg-white" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                      <Input 
                        id="email" 
                        name="email"
                        type="email" 
                        value={editFormData.email}
                        onChange={handleFormChange}
                        className="mt-1 h-10 bg-white" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Telefone</Label>
                      <Input 
                        id="phone" 
                        name="phone"
                        value={editFormData.phone}
                        onChange={handleFormChange}
                        className="mt-1 h-10 bg-white" 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                      <Select 
                        value={editFormData.status}
                        onValueChange={handleStatusChange}
                      >
                        <SelectTrigger className="mt-1 h-10 bg-white">
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
                      <Label htmlFor="appointmentDate" className="text-sm font-medium text-gray-700">Data da consulta</Label>
                      <Input
                        id="appointmentDate"
                        name="appointmentDate"
                        type="datetime-local"
                        value={editFormData.appointmentDate}
                        onChange={handleFormChange}
                        className="mt-1 h-10 bg-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="medicalNotes" className="text-sm font-medium text-gray-700">Prontuário médico</Label>
                      <Textarea 
                        id="medicalNotes" 
                        name="medicalNotes"
                        value={editFormData.medicalNotes}
                        onChange={handleFormChange}
                        className="mt-1 min-h-32 bg-white" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter className="px-6 py-4 border-t border-gray-200">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="h-10 bg-white">
                Cancelar
              </Button>
              <Button 
                className="bg-gray-900 hover:bg-gray-800 text-white h-10" 
                onClick={handleUpdatePatient}
              >
                Salvar alterações
              </Button>
            </DialogFooter>
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