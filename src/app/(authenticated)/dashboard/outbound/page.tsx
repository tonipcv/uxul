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
  TableCellsIcon,
  CameraIcon,
  AtSymbolIcon
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

interface Outbound {
  id: string;
  userId: string;
  nome: string;
  especialidade?: string;
  imagem?: string;
  instagram?: string;
  whatsapp?: string;
  status?: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

const formatPhoneNumber = (phone: string) => {
  if (!phone) return '';
  const numbers = phone.replace(/\D/g, '');
  if (!numbers) return '';
  const cleanNumbers = numbers.startsWith('55') ? numbers.slice(2) : numbers;
  if (cleanNumbers.length >= 2) {
    const ddd = cleanNumbers.slice(0, 2);
    const number = cleanNumbers.slice(2);
    return `+55 (${ddd}) ${number}`;
  }
  return `+55 ${cleanNumbers}`;
};

export default function OutboundPage() {
  const { data: session } = useSession();
  const [outbounds, setOutbounds] = useState<Outbound[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingOutbound, setViewingOutbound] = useState<Outbound | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [outboundToDelete, setOutboundToDelete] = useState<Outbound | null>(null);
  const [displayedOutbounds, setDisplayedOutbounds] = useState<Outbound[]>([]);
  const [editFormData, setEditFormData] = useState({
    nome: "",
    especialidade: "",
    instagram: "",
    whatsapp: "",
    status: "",
    observacoes: "",
    imagem: ""
  });
  const [createFormData, setCreateFormData] = useState({
    nome: "",
    especialidade: "",
    instagram: "",
    whatsapp: "",
    status: "abordado",
    observacoes: "",
    imagem: ""
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetchOutbounds();
    }
  }, [session]);

  useEffect(() => {
    setDisplayedOutbounds(filterOutbounds());
  }, [outbounds, searchTerm, activeTab]);

  const fetchOutbounds = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/outbound');
      
      if (response.ok) {
        const data = await response.json();
        setOutbounds(Array.isArray(data) ? data : []);
      } else {
        console.error('Erro ao buscar contatos:', response.statusText);
        setOutbounds([]);
      }
    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
      setOutbounds([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (!status) return (
      <Badge className="bg-gray-100 text-gray-800 border-none hover:bg-gray-200 flex items-center gap-1">
        <UserIcon className="h-3 w-3" />
        <span>N/A</span>
      </Badge>
    );
    
    switch (status.toLowerCase()) {
      case 'abordado':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-none hover:bg-blue-200 flex items-center gap-1">
            <UserIcon className="h-3 w-3" />
            <span>Abordado</span>
          </Badge>
        );
      case 'respondeu':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-none hover:bg-amber-200 flex items-center gap-1">
            <PhoneIcon className="h-3 w-3" />
            <span>Respondeu</span>
          </Badge>
        );
      case 'interessado':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-none hover:bg-purple-200 flex items-center gap-1">
            <EyeIcon className="h-3 w-3" />
            <span>Interessado</span>
          </Badge>
        );
      case 'publicou link':
        return (
          <Badge className="bg-green-100 text-green-800 border-none hover:bg-green-200 flex items-center gap-1">
            <ClipboardDocumentIcon className="h-3 w-3" />
            <span>Publicou Link</span>
          </Badge>
        );
      case 'upgrade lead':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-none hover:bg-yellow-200 flex items-center gap-1">
            <ArrowTrendingUpIcon className="h-3 w-3" />
            <span>Upgrade Lead</span>
          </Badge>
        );
      case 'convertido':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-none hover:bg-emerald-200 flex items-center gap-1">
            <CheckCircleIcon className="h-3 w-3" />
            <span>Convertido</span>
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-none hover:bg-gray-200 flex items-center gap-1">
            <UserIcon className="h-3 w-3" />
            <span>{status}</span>
          </Badge>
        );
    }
  };

  const openEditModal = (outbound: Outbound) => {
    setEditFormData({
      nome: outbound.nome || "",
      especialidade: outbound.especialidade || "",
      instagram: outbound.instagram || "",
      whatsapp: outbound.whatsapp || "",
      status: outbound.status || "",
      observacoes: outbound.observacoes || "",
      imagem: outbound.imagem || ""
    });
    setIsEditModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (isEditModalOpen) {
      setEditFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setCreateFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (isEditModalOpen) {
      setEditFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setCreateFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingOutbound) return;
    
    try {
      const response = await fetch(`/api/outbound/${viewingOutbound.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        const updatedOutbound = await response.json();
        setOutbounds(prev => 
          prev.map(item => 
            item.id === updatedOutbound.id ? updatedOutbound : item
          )
        );
        setIsEditModalOpen(false);
        toast({
          title: "Contato atualizado",
          description: "As informações foram atualizadas com sucesso.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao atualizar",
          description: error.message || "Ocorreu um erro ao atualizar o contato.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar contato:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar o contato.",
        variant: "destructive",
      });
    }
  };

  const handleViewOutbound = (outbound: Outbound) => {
    setViewingOutbound(outbound);
    setIsViewModalOpen(true);
  };

  const handleDeleteOutbound = (outbound: Outbound) => {
    setOutboundToDelete(outbound);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!outboundToDelete) return;
    
    try {
      const response = await fetch(`/api/outbound/${outboundToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setOutbounds(prev => prev.filter(item => item.id !== outboundToDelete.id));
        setIsDeleteModalOpen(false);
        toast({
          title: "Contato excluído",
          description: "O contato foi removido com sucesso.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao excluir",
          description: error.message || "Ocorreu um erro ao excluir o contato.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao excluir contato:', error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o contato.",
        variant: "destructive",
      });
    }
  };

  const filterOutbounds = () => {
    return outbounds.filter(outbound => {
      // Filtro de pesquisa
      const matchesSearch = 
        searchTerm === "" || 
        outbound.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        outbound.especialidade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        outbound.instagram?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        outbound.status?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro de status
      const matchesTab = 
        activeTab === "all" || 
        (activeTab === "abordado" && outbound.status?.toLowerCase() === "abordado") ||
        (activeTab === "respondeu" && outbound.status?.toLowerCase() === "respondeu") ||
        (activeTab === "interessado" && outbound.status?.toLowerCase() === "interessado") ||
        (activeTab === "publicou" && outbound.status?.toLowerCase() === "publicou link") ||
        (activeTab === "upgrade" && outbound.status?.toLowerCase() === "upgrade lead") ||
        (activeTab === "convertido" && outbound.status?.toLowerCase() === "convertido");
      
      return matchesSearch && matchesTab;
    });
  };

  const handleCreateOutbound = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/outbound', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createFormData),
      });

      if (response.ok) {
        const newOutbound = await response.json();
        setOutbounds(prev => [newOutbound, ...prev]);
        setIsCreateModalOpen(false);
        // Resetar o formulário
        setCreateFormData({
          nome: "",
          especialidade: "",
          instagram: "",
          whatsapp: "",
          status: "abordado",
          observacoes: "",
          imagem: ""
        });
        toast({
          title: "Contato criado",
          description: "O novo contato foi adicionado com sucesso.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erro ao criar",
          description: error.message || "Ocorreu um erro ao criar o contato.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao criar contato:', error);
      toast({
        title: "Erro ao criar",
        description: "Ocorreu um erro ao criar o contato.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gray-100 pt-20 pb-24 md:pt-12 md:pb-16 px-4">
      <div className="container mx-auto max-w-[95%] lg:max-w-[90%]">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Outbound</h1>
            <p className="text-sm text-gray-600 mt-1">
              Acompanhe e gerencie seus contatos para marketing outbound
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar contatos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg border-gray-300 bg-white shadow-sm w-full sm:w-64"
              />
            </div>
            
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center justify-center bg-primary hover:bg-primary/90"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Novo Contato
            </Button>
          </div>
        </div>
        
        {/* Tabs de filtro */}
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="mb-6"
        >
          <TabsList className="bg-white border rounded-lg p-1 shadow-sm">
            <TabsTrigger 
              value="all"
              className="rounded-md data-[state=active]:bg-gray-100"
            >
              Todos
            </TabsTrigger>
            <TabsTrigger 
              value="abordado"
              className="rounded-md data-[state=active]:bg-gray-100"
            >
              Abordados
            </TabsTrigger>
            <TabsTrigger 
              value="respondeu"
              className="rounded-md data-[state=active]:bg-gray-100"
            >
              Responderam
            </TabsTrigger>
            <TabsTrigger 
              value="interessado"
              className="rounded-md data-[state=active]:bg-gray-100"
            >
              Interessados
            </TabsTrigger>
            <TabsTrigger 
              value="publicou"
              className="rounded-md data-[state=active]:bg-gray-100"
            >
              Publicaram
            </TabsTrigger>
            <TabsTrigger 
              value="convertido"
              className="rounded-md data-[state=active]:bg-gray-100"
            >
              Convertidos
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Listagem de contatos */}
        <Card className="bg-white shadow-sm border-gray-200">
          <CardHeader className="p-4 pb-0">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-bold text-gray-900">
                Contatos ({displayedOutbounds.length})
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={fetchOutbounds}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin h-6 w-6 border-2 border-gray-500 border-t-transparent rounded-full"></div>
              </div>
            ) : displayedOutbounds.length === 0 ? (
              <div className="text-center py-10 px-4">
                <p className="text-gray-500">Nenhum contato encontrado.</p>
                <p className="text-gray-400 text-sm mt-1">
                  {searchTerm || activeTab !== "all" 
                    ? "Tente ajustar seus filtros de busca." 
                    : "Adicione seu primeiro contato clicando em 'Novo Contato'."}
                </p>
              </div>
            ) : (
              <div className="border-t border-gray-200 mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Especialidade
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Instagram
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data de Criação
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {displayedOutbounds.map((outbound) => (
                        <tr 
                          key={outbound.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{outbound.nome}</div>
                                {outbound.whatsapp && (
                                  <div className="text-sm text-gray-500">
                                    {formatPhoneNumber(outbound.whatsapp)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{outbound.especialidade || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {outbound.instagram ? (
                              <a 
                                href={`https://instagram.com/${outbound.instagram}`} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                              >
                                <AtSymbolIcon className="h-4 w-4 mr-1" />
                                {outbound.instagram}
                              </a>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(outbound.status || '')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(outbound.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewOutbound(outbound)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(outbound)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteOutbound(outbound)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Modal de visualização */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Detalhes do Contato</DialogTitle>
            </DialogHeader>
            {viewingOutbound && (
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500 text-xs uppercase">Nome</Label>
                    <div className="text-gray-900 font-medium">{viewingOutbound.nome}</div>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs uppercase">Especialidade</Label>
                    <div className="text-gray-900">{viewingOutbound.especialidade || '-'}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500 text-xs uppercase">Instagram</Label>
                    <div className="text-gray-900">
                      {viewingOutbound.instagram ? (
                        <a 
                          href={`https://instagram.com/${viewingOutbound.instagram}`} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                        >
                          <AtSymbolIcon className="h-4 w-4 mr-1" />
                          {viewingOutbound.instagram}
                        </a>
                      ) : (
                        '-'
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs uppercase">WhatsApp</Label>
                    <div className="text-gray-900">
                      {viewingOutbound.whatsapp ? (
                        <a 
                          href={`https://wa.me/${viewingOutbound.whatsapp.replace(/\D/g, '')}`} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 hover:underline flex items-center"
                        >
                          <PhoneIcon className="h-4 w-4 mr-1" />
                          {formatPhoneNumber(viewingOutbound.whatsapp)}
                        </a>
                      ) : (
                        '-'
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-gray-500 text-xs uppercase">Status</Label>
                  <div className="mt-1">{getStatusBadge(viewingOutbound.status || '')}</div>
                </div>
                
                <div>
                  <Label className="text-gray-500 text-xs uppercase">Observações</Label>
                  <div className="text-gray-900 mt-1 bg-gray-50 p-3 rounded-md">
                    {viewingOutbound.observacoes || 'Nenhuma observação registrada.'}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <Label className="text-gray-500 text-xs uppercase">Data de Criação</Label>
                    <div className="text-gray-900">
                      {format(new Date(viewingOutbound.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-500 text-xs uppercase">Última Atualização</Label>
                    <div className="text-gray-900">
                      {format(new Date(viewingOutbound.updatedAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button onClick={() => setIsViewModalOpen(false)}>Fechar</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 