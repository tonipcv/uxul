'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import dynamic from 'next/dynamic';
import { PhoneIcon, CalendarIcon, PencilIcon, LinkIcon, ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

// Importação dinâmica para resolver problema de renderização no servidor
const DragDropContextLib = dynamic(
  () => import('@hello-pangea/dnd').then(mod => ({
    default: mod.DragDropContext,
  })),
  { ssr: false }
);

const DroppableLib = dynamic(
  () => import('@hello-pangea/dnd').then(mod => ({
    default: mod.Droppable,
  })),
  { ssr: false }
);

const DraggableLib = dynamic(
  () => import('@hello-pangea/dnd').then(mod => ({
    default: mod.Draggable,
  })),
  { ssr: false }
);

// Tipos para o caso de importação dinâmica
type DroppableProvided = any;
type DraggableProvided = any;
type DropResult = any;

interface Lead {
  id: string;
  name: string;
  phone: string;
  interest?: string;
  status?: string;
  appointmentDate?: string;
  createdAt?: string;
  source?: string;
  indication?: {
    name?: string;
    slug: string;
  };
}

const columns = [
  { id: 'novos', title: 'Novos' },
  { id: 'agendados', title: 'Agendados' },
  { id: 'compareceram', title: 'Compareceram' },
  { id: 'fechados', title: 'Fechados' },
  { id: 'naoVieram', title: 'Não vieram' }
];

const statusMap: { [key: string]: string } = {
  'novos': 'Novo',
  'agendados': 'Agendado',
  'compareceram': 'Compareceu',
  'fechados': 'Fechado',
  'naoVieram': 'Não veio'
};

export default function PipelinePage() {
  const { data: session, status } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [dashboardData, setDashboardData] = useState<{ 
    totalLeads: number;
    totalIndications: number;
  } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLead, setNewLead] = useState<Lead>({
    id: '',
    name: '',
    phone: ''
  });

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchLeads();
      fetchDashboardData();
    } else if (status === 'unauthenticated') {
      // Session foi carregada mas não há usuário (não autenticado)
      setLoading(false);
      setLeads([]);
    }
    // Não fazer nada se status === "loading" (ainda carregando)
  }, [session, status]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        console.error('Erro ao buscar dados do dashboard:', await response.text());
        toast({
          title: "Erro",
          description: "Não foi possível obter os dados do dashboard",
          variant: "destructive"
        });
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
        
        if (result.data && Array.isArray(result.data)) {
          setLeads(result.data);
        } else if (Array.isArray(result)) {
          setLeads(result);
        } else {
          console.warn("Dados recebidos não são um array");
          setLeads([]);
        }
      } else {
        console.error("Erro na resposta da API:", await response.text());
        toast({
          title: "Erro",
          description: "Não foi possível obter os dados dos leads",
          variant: "destructive"
        });
        setLeads([]);
      }
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao buscar os dados",
        variant: "destructive"
      });
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const newStatus = statusMap[destination.droppableId];
    const lead = leads.find(l => l.id === draggableId);
    if (!lead) return;

    // Atualiza o estado local imediatamente
      setLeads(leads.map(l => 
        l.id === draggableId ? { ...l, status: newStatus } : l
      ));

    // Envia atualização para o servidor
    try {
      await fetch(`/api/leads?leadId=${draggableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      // Atualiza os dados do dashboard
      fetchDashboardData();
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      // Em caso de erro, apenas exibe um toast - não reverte o estado
      // para evitar efeitos visuais disruptivos
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive"
      });
    }
  };

  const getColumnLeads = (columnId: string) => {
    // Garante que leads é sempre um array
    if (!Array.isArray(leads)) return [];
    
    try {
    return leads.filter(lead => {
      if (columnId === 'novos') {
        return lead.status === 'Novo' || !lead.status;
      }
      return lead.status === statusMap[columnId];
    });
    } catch (error) {
      console.error('Erro ao filtrar leads para a coluna:', columnId, error);
      return [];
    }
  };

  const handleEditLead = async (updatedLead: Lead) => {
    try {
      if (!updatedLead || !updatedLead.id) {
        throw new Error('Lead inválido para atualização');
      }
      
      const response = await fetch(`/api/leads?leadId=${updatedLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLead)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Erro ao atualizar lead: ${response.status}`);
      }

      // Atualiza o lead na lista local
      if (Array.isArray(leads)) {
        const updatedLeads = leads.map(lead => 
        lead.id === updatedLead.id ? updatedLead : lead
        );
        setLeads(updatedLeads);
      }

      toast({
        title: "Lead atualizado",
        description: "As informações foram atualizadas com sucesso",
      });

      // Fecha o modal de edição
      setIsEditModalOpen(false);
      setEditingLead(null);
      
      // Atualiza dados do dashboard
      fetchDashboardData();
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível atualizar o lead",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-blue-800">
        <div className="animate-spin h-6 w-6 border-2 border-blue-300 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <DragDropContextLib onDragEnd={handleDragEnd}>
      <div className="min-h-[100dvh] bg-gray-100 pt-20 pb-24 md:pt-12 md:pb-16 px-4">
        <div className="container mx-auto pl-1 sm:pl-4 md:pl-8 lg:pl-16 max-w-[98%] sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-xl md:text-xl font-bold text-gray-900 tracking-[-0.03em] font-inter">Pipeline de Vendas</h1>
              <p className="text-base sm:text-sm md:text-sm text-gray-600 tracking-[-0.03em] font-inter">Acompanhe a evolução dos seus leads</p>
            </div>
            <Button
              onClick={() => fetchLeads()}
              className="mt-4 md:mt-0 h-12 sm:h-10 md:h-8 bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg-gray-800/10 text-base sm:text-sm md:text-xs"
            >
              <ArrowPathIcon className="h-5 w-5 sm:h-4 sm:w-4 mr-2 sm:mr-1.5" />
              Atualizar
            </Button>
          </div>

          <div className="px-1">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-3 w-full">
              {columns.map((column) => (
                <div key={column.id} className="min-h-[300px] flex flex-col">
                  <div className="bg-gray-800/5 rounded-lg p-4 sm:p-3 shadow-[0_2px_8px_rgba(0,0,0,0.05)] mb-3">
                    <h2 className="text-base sm:text-sm font-semibold text-gray-800 flex items-center">
                      {column.title}
                      <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 sm:py-0.5 rounded text-sm sm:text-xs font-semibold">
                        {getColumnLeads(column.id).length}
                      </span>
                    </h2>
                  </div>

                  <div className="flex-1 bg-gray-800/5 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden">
                    <DroppableLib droppableId={column.id} key={column.id}>
                      {(provided: DroppableProvided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="p-3 sm:p-2 h-full min-h-[50vh] lg:min-h-[60vh] overflow-y-auto"
                        >
                          {getColumnLeads(column.id).map((lead, index) => (
                            <DraggableLib key={lead.id} draggableId={lead.id} index={index}>
                              {(provided: DraggableProvided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="bg-white rounded-xl mb-3 sm:mb-2 shadow-[0_2px_6px_rgba(0,0,0,0.05)] p-4 sm:p-3 cursor-pointer hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-shadow duration-300"
                                  onClick={() => {
                                    setEditingLead(lead);
                                    setIsEditModalOpen(true);
                                  }}
                                >
                                  <div className="space-y-3 sm:space-y-1.5">
                                    <div>
                                      <h4 className="font-medium text-gray-800 text-base sm:text-sm mb-1 sm:mb-0.5 truncate" title={lead.name}>{lead.name}</h4>
                                      <div className="flex items-center gap-2 sm:gap-1 text-base sm:text-sm text-gray-600">
                                        <PhoneIcon className="flex-shrink-0 h-4 w-4 sm:h-3.5 sm:w-3.5" />
                                        <span className="truncate text-base sm:text-sm">{lead.phone}</span>
                                      </div>
                                    </div>

                                    {/* Adicionar um indicador de origem/indicação na parte superior do card */}
                                    {(lead.indication?.name || lead.source) && (
                                      <div className="flex items-center gap-2 sm:gap-1 bg-blue-50 px-3 sm:px-2 py-1.5 sm:py-1 rounded border border-blue-100">
                                        <LinkIcon className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-blue-500" />
                                        <span className="text-sm sm:text-xs font-medium text-blue-700 truncate">
                                          {lead.indication?.name || (lead.source?.includes('/') 
                                            ? lead.source.split('/').filter(Boolean)[1] 
                                            : lead.source)}
                                        </span>
                                      </div>
                                    )}

                                    <div className="pt-2 sm:pt-1 border-t border-gray-200">
                                      <div className="grid grid-cols-2 gap-3 sm:gap-2 text-base sm:text-sm">
                                        {lead.interest && (
                                          <div>
                                            <p className="text-sm sm:text-xs font-medium text-gray-500 mb-0.5">Interesse</p>
                                            <p className="text-gray-900 truncate text-base sm:text-sm" title={lead.interest}>{lead.interest}</p>
                                          </div>
                                        )}
                                        {lead.appointmentDate && (
                                          <div>
                                            <p className="text-sm sm:text-xs font-medium text-gray-500 mb-0.5">Agendamento</p>
                                            <p className="text-gray-900 truncate text-base sm:text-sm">
                                              {new Date(lead.appointmentDate).toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                                            </p>
                                          </div>
                                        )}
                                        {(lead as any).potentialValue && (
                                          <div>
                                            <p className="text-sm sm:text-xs font-medium text-gray-500 mb-0.5">Valor</p>
                                            <p className="text-gray-900 truncate font-medium text-base sm:text-sm">
                                              {new Intl.NumberFormat('pt-BR', { 
                                                style: 'currency', 
                                                currency: 'BRL',
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0
                                              }).format((lead as any).potentialValue)}
                                            </p>
                                          </div>
                                        )}
                                        {lead.createdAt && (
                                          <div>
                                            <p className="text-sm sm:text-xs font-medium text-gray-500 mb-0.5">Criado em</p>
                                            <p className="text-gray-900 truncate text-base sm:text-sm">
                                              {new Date(lead.createdAt).toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: '2-digit'
                                              })}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DraggableLib>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </DroppableLib>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal de Edição */}
        <Dialog open={isEditModalOpen} onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) setIsEditMode(false); // Reset edit mode when closing
        }}>
          <DialogPortal>
            <DialogOverlay className="bg-black/50 backdrop-blur-sm" />
            <DialogContent className="sm:max-w-[500px] md:max-w-[700px] lg:max-w-[800px] p-0 overflow-hidden bg-white/90 backdrop-blur-sm border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-3xl">
              <DialogHeader className="p-4 sm:p-3 border-b border-gray-100 bg-white/80 backdrop-blur-sm flex flex-row justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 sm:w-2 sm:h-2 rounded-full ${
                    editingLead?.status === 'Agendado' ? 'bg-yellow-500' :
                    editingLead?.status === 'Compareceu' ? 'bg-green-500' :
                    editingLead?.status === 'Fechado' ? 'bg-gray-700' :
                    editingLead?.status === 'Não veio' ? 'bg-red-500' :
                    'bg-gray-400'
                  }`}></div>
                  <div>
                    <DialogTitle className="text-lg sm:text-base font-bold text-gray-900 tracking-[-0.03em] font-inter">{editingLead?.name}</DialogTitle>
                    <DialogDescription className="text-sm sm:text-xs text-gray-600 tracking-[-0.03em] font-inter">Status: {editingLead?.status || 'Novo'}</DialogDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-400 hover:text-red-600 hover:bg-transparent p-1 h-8 w-8 sm:h-7 sm:w-7"
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir este lead?')) {
                        console.log('Excluindo lead:', editingLead?.id);
                        setIsEditModalOpen(false);
                      }
                    }}
                    title="Excluir lead"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="sm:w-14 sm:h-14" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                      <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                    </svg>
                    <span className="sr-only">Excluir lead</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditMode(!isEditMode)}
                    className="bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg-gray-800/10 text-sm sm:text-xs h-8 sm:h-7"
                  >
                    {isEditMode ? 'Visualizar' : 'Editar'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setIsEditModalOpen(false)}
                    className="text-gray-500 hover:text-gray-800 h-8 w-8 sm:h-7 sm:w-7 p-0"
                  >
                    <X className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                    <span className="sr-only">Fechar</span>
                  </Button>
                </div>
              </DialogHeader>

              {editingLead && (
                <div className="max-h-[70vh] overflow-y-auto p-5 sm:p-4">
                  {isEditMode ? (
                    /* Modo de edição */
                    <div className="grid grid-cols-1 gap-5 sm:gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-4">
                        {/* Coluna de informações do paciente */}
                        <div className="bg-white/80 backdrop-blur-sm p-5 sm:p-4 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                          <h3 className="text-base sm:text-sm font-bold text-gray-900 tracking-[-0.03em] font-inter mb-4 sm:mb-3 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-3.5 sm:w-3.5 mr-2 sm:mr-1.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Informações do paciente
                          </h3>
                          
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            if (!editingLead) return;
                            handleEditLead(editingLead);
                            setIsEditMode(false);
                          }} className="space-y-4 sm:space-y-3">
                            <div className="space-y-2 sm:space-y-1">
                              <Label htmlFor="name" className="text-gray-700 text-sm sm:text-xs font-medium">Nome</Label>
                              <Input
                                id="name"
                                value={editingLead.name}
                                onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                                className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-10 sm:h-8 text-sm sm:text-xs"
                              />
                            </div>
                            
                            <div className="space-y-2 sm:space-y-1">
                              <Label htmlFor="phone" className="text-gray-700 text-sm sm:text-xs font-medium">Telefone</Label>
                              <Input
                                id="phone"
                                value={editingLead.phone}
                                onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                                className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-10 sm:h-8 text-sm sm:text-xs"
                              />
                            </div>

                            <div className="space-y-2 sm:space-y-1">
                              <Label htmlFor="status" className="text-gray-700 text-sm sm:text-xs font-medium">Status</Label>
                              <Select 
                                value={editingLead.status || 'Novo'}
                                onValueChange={(value) => setEditingLead({ ...editingLead, status: value })}
                              >
                                <SelectTrigger id="status" className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 rounded-xl h-10 sm:h-8 text-sm sm:text-xs">
                                  <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Novo">Novo</SelectItem>
                                  <SelectItem value="Agendado">Agendado</SelectItem>
                                  <SelectItem value="Compareceu">Compareceu</SelectItem>
                                  <SelectItem value="Fechado">Fechado</SelectItem>
                                  <SelectItem value="Não veio">Não veio</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2 sm:space-y-1">
                              <Label htmlFor="interest" className="text-gray-700 text-sm sm:text-xs font-medium">Interesse</Label>
                              <Input
                                id="interest"
                                value={editingLead.interest || ''}
                                onChange={(e) => setEditingLead({ ...editingLead, interest: e.target.value })}
                                className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-10 sm:h-8 text-sm sm:text-xs"
                              />
                            </div>
                            
                            <div className="space-y-2 sm:space-y-1">
                              <Label htmlFor="source" className="text-gray-700 text-sm sm:text-xs font-medium">Origem</Label>
                              <Input
                                id="source"
                                value={editingLead.source || ''}
                                onChange={(e) => setEditingLead({ ...editingLead, source: e.target.value })}
                                className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-10 sm:h-8 text-sm sm:text-xs"
                              />
                            </div>
                            
                            <div className="space-y-2 sm:space-y-1">
                              <Label htmlFor="potentialValue" className="text-gray-700 text-sm sm:text-xs font-medium">Valor potencial (R$)</Label>
                              <Input
                                id="potentialValue"
                                type="number"
                                value={(editingLead as any).potentialValue || ''}
                                onChange={(e) => setEditingLead({ ...editingLead, potentialValue: parseFloat(e.target.value) || 0 } as any)}
                                className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-10 sm:h-8 text-sm sm:text-xs"
                              />
                            </div>
                          </form>
                        </div>
                        
                        {/* Coluna de agendamento */}
                        <div className="bg-white/80 backdrop-blur-sm p-5 sm:p-4 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                          <h3 className="text-base sm:text-sm font-bold text-gray-900 tracking-[-0.03em] font-inter mb-4 sm:mb-3 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-3.5 sm:w-3.5 mr-2 sm:mr-1.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Agendamento e observações
                          </h3>
                          
                          <div className="space-y-4 sm:space-y-3">
                            <div className="space-y-2 sm:space-y-1">
                              <Label htmlFor="appointmentDate" className="text-gray-700 text-sm sm:text-xs font-medium">Data e hora do agendamento</Label>
                              <Input
                                id="appointmentDate"
                                type="datetime-local"
                                value={editingLead.appointmentDate || ''}
                                onChange={(e) => setEditingLead({ ...editingLead, appointmentDate: e.target.value })}
                                className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-10 sm:h-8 text-sm sm:text-xs"
                              />
                            </div>
                            
                            <div className="space-y-2 sm:space-y-1">
                              <Label htmlFor="medicalNotes" className="text-gray-700 text-sm sm:text-xs font-medium">Observações médicas</Label>
                              <textarea
                                id="medicalNotes"
                                value={(editingLead as any).medicalNotes || ''}
                                onChange={(e) => setEditingLead({ ...editingLead, medicalNotes: e.target.value } as any)}
                                className="w-full rounded-xl min-h-[150px] sm:min-h-[120px] p-3 sm:p-2 border border-gray-200 focus:border-gray-300 bg-white/50 text-gray-900 placeholder:text-gray-400 text-sm sm:text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-3 sm:pt-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsEditMode(false)}
                          className="bg-white/50 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl h-10 sm:h-8 font-medium text-sm sm:text-xs"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={(e) => {
                            e.preventDefault();
                            if (!editingLead) return;
                            handleEditLead(editingLead);
                            setIsEditMode(false);
                          }}
                          className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-10 sm:h-8 font-medium text-sm sm:text-xs"
                        >
                          Salvar alterações
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Modo de visualização */
                    <div className="space-y-5 sm:space-y-4">
                      {/* Informações principais */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3 bg-white/80 backdrop-blur-sm p-5 sm:p-4 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                        <div>
                          <h4 className="text-sm sm:text-xs font-medium text-gray-500 mb-1">Telefone</h4>
                          <p className="flex items-center truncate text-gray-800 text-base sm:text-sm">
                            <PhoneIcon className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1.5 flex-shrink-0 text-gray-500" />
                            <a href={`tel:${editingLead.phone}`} className="hover:text-gray-700 truncate">{editingLead.phone}</a>
                          </p>
                        </div>
                        
                        {editingLead.interest && (
                          <div>
                            <h4 className="text-sm sm:text-xs font-medium text-gray-500 mb-1">Interesse</h4>
                            <p className="truncate text-gray-800 text-base sm:text-sm">{editingLead.interest}</p>
                          </div>
                        )}

                        {(editingLead as any).potentialValue && (
                          <div>
                            <h4 className="text-sm sm:text-xs font-medium text-gray-500 mb-1">Valor potencial</h4>
                            <p className="font-medium truncate text-gray-800 text-base sm:text-sm">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((editingLead as any).potentialValue)}
                            </p>
                          </div>
                        )}
                        
                        <div>
                          <h4 className="text-sm sm:text-xs font-medium text-gray-500 mb-1">Data de criação</h4>
                          <p className="truncate text-gray-800 text-base sm:text-sm">
                            {editingLead.createdAt 
                              ? new Date(editingLead.createdAt).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })
                              : 'Não disponível'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Agendamento */}
                      {editingLead.appointmentDate && (
                        <div className="bg-gray-800/5 backdrop-blur-sm p-4 sm:p-3 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                          <div className="flex items-start">
                            <CalendarIcon className="h-4 w-4 sm:h-3.5 sm:w-3.5 mr-3 sm:mr-2 flex-shrink-0 text-gray-600 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm sm:text-xs font-medium text-gray-700 mb-1">Próximo agendamento</h4>
                              <p className="text-gray-700 break-words text-sm sm:text-xs">
                                {new Date(editingLead.appointmentDate).toLocaleDateString('pt-BR', {
                                  weekday: 'long',
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                                {' às '}
                                {new Date(editingLead.appointmentDate).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Observações médicas */}
                      {((editingLead as any).medicalNotes) && (
                        <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-3 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                          <h4 className="text-sm sm:text-xs font-medium text-gray-500 mb-2 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-3.5 sm:w-3.5 mr-2 sm:mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Observações médicas
                          </h4>
                          <div className="bg-gray-800/5 p-4 sm:p-3 rounded-xl border-0 overflow-hidden">
                            <p className="whitespace-pre-line break-words text-gray-700 text-sm sm:text-xs">{(editingLead as any).medicalNotes}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Informações adicionais */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3 bg-white/80 backdrop-blur-sm p-4 sm:p-3 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                        <div>
                          <h4 className="text-sm sm:text-xs font-medium text-gray-500 mb-1">Origem</h4>
                          <p className="truncate text-gray-800 text-base sm:text-sm">
                            {editingLead.source || 'Não especificada'}
                          </p>
                        </div>
                        
                        {editingLead.indication?.name && (
                          <div>
                            <h4 className="text-sm sm:text-xs font-medium text-gray-500 mb-1">Indicação</h4>
                            <p className="truncate text-gray-800 text-base sm:text-sm">{editingLead.indication.name}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Botões de ação */}
                      <div className="flex justify-end space-x-3 pt-4 sm:pt-3 mt-2 sm:mt-1 border-t border-gray-200">
                        <Button 
                          variant="outline"
                          className="bg-white/50 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl h-10 sm:h-8 text-sm sm:text-xs font-medium"
                          onClick={() => window.open(`https://wa.me/${editingLead.phone.replace(/\D/g, '')}`, '_blank')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="w-4 h-4 sm:w-3.5 sm:h-3.5 mr-2 sm:mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                          </svg>
                          WhatsApp
                        </Button>
                        
                        <Button 
                          className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-10 sm:h-8 text-sm sm:text-xs font-medium"
                          onClick={() => setIsEditMode(true)}
                        >
                          <PencilIcon className="h-4 w-4 sm:h-3.5 sm:w-3.5 mr-2 sm:mr-1.5 flex-shrink-0" />
                          Editar lead
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </DialogPortal>
        </Dialog>
      </div>
    </DragDropContextLib>
  );
} 