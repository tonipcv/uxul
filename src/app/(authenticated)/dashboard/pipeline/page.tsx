'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided, DropResult } from "@hello-pangea/dnd";
import { PhoneIcon, CalendarIcon, PencilIcon, LinkIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

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
  const { data: session } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<{ 
    totalLeads: number;
    totalIndications: number;
  } | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      console.log("Pipeline: Buscando dados para o usuário:", session.user.id);
      fetchLeads();
      fetchDashboardData();
    } else if (session === null) {
      // Session foi carregada mas não há usuário (não autenticado)
      console.log("Pipeline: Usuário não autenticado");
      setLoading(false);
      setLeads([]);
    }
    // Não fazer nada se session === undefined (ainda carregando)
  }, [session]);

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
      console.log("Pipeline: Chamando API de leads");
      
      const response = await fetch(`/api/leads`);
      
      console.log("Pipeline: Status da resposta:", response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log("Pipeline: Dados recebidos:", result);
        
        if (result.data && Array.isArray(result.data)) {
          setLeads(result.data);
        } else if (Array.isArray(result)) {
          setLeads(result);
        } else {
          console.warn("Pipeline: Dados recebidos não são um array");
          setLeads([]);
        }
      } else {
        console.error("Pipeline: Erro na resposta da API:", await response.text());
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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-6 w-6 border-2 border-blue-300 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col bg-blue-50">
        {/* Header */}
        <div className="px-6 pt-4 pb-4 flex items-center justify-between bg-white border-b border-gray-200">
          <div>
            <h1 className="text-xl font-medium text-gray-800">Pipeline</h1>
            <p className="text-sm text-gray-500">Total de leads: {dashboardData?.totalLeads || 0}</p>
          </div>
          <Button
            onClick={() => {
              fetchLeads();
              fetchDashboardData();
            }}
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 h-9 px-4 bg-white border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            <ArrowPathIcon className="h-4 w-4" />
            <span>Atualizar</span>
          </Button>
        </div>

        {/* Pipeline Content */}
        <div className="flex flex-col overflow-x-hidden overflow-y-hidden">
          {/* Mobile Column Selector */}
          <div className="md:hidden px-3 py-1.5 bg-white shadow-sm border-b border-gray-200">
            <div className="flex overflow-x-auto gap-1.5 -mx-3 px-3 pb-0">
              {columns.map(column => (
                <div 
                  key={column.id} 
                  className="flex-none px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200"
                >
                  <span className="text-xs font-medium text-gray-700">{column.title}</span>
                  <span className="ml-1 text-[10px] bg-white rounded-full px-1 text-gray-600">{getColumnLeads(column.id).length}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Columns Layout */}
          <div className="overflow-x-auto pb-1 bg-blue-50 p-1.5">
            <div className="flex gap-3 px-1.5 py-2 min-w-full md:min-w-0 min-h-[75vh]">
              {columns.map(column => (
                <div 
                  key={column.id} 
                  className="flex-none md:flex-1 w-[80vw] md:w-auto md:min-w-[280px]"
                >
                  <div className="rounded-lg bg-white border border-gray-200 shadow-sm flex flex-col h-full">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                      <h3 className="font-medium text-gray-800 text-sm">{column.title}</h3>
                      <span className="text-xs bg-blue-100 rounded-full px-1.5 py-0.5 text-blue-800 font-medium">{getColumnLeads(column.id).length}</span>
                    </div>
                    
                    <Droppable droppableId={column.id}>
                      {(provided: DroppableProvided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px] bg-blue-50/50"
                        >
                          {getColumnLeads(column.id).map((lead, index) => (
                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                              {(provided: DraggableProvided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`group bg-white rounded-md shadow-sm border border-gray-200 p-3 touch-manipulation ${snapshot.isDragging ? 'border-blue-300 shadow-md' : ''}`}
                                  style={{
                                    ...provided.draggableProps.style
                                  }}
                                  onDoubleClick={() => {
                                    setEditingLead(lead);
                                    setIsEditModalOpen(true);
                                  }}
                                >
                                  {/* Botões flutuantes que aparecem no hover */}
                                  <div className="absolute right-1.5 top-1.5 flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                      className="h-6 w-6 p-0 hover:bg-blue-50 text-blue-600"
                                    >
                                      <CalendarIcon className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setEditingLead(lead);
                                        setIsEditModalOpen(true);
                                      }}
                                      className="h-6 w-6 p-0 hover:bg-blue-50 text-blue-600"
                                    >
                                      <PencilIcon className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>

                                  {/* Informações do Lead */}
                                  <div className="space-y-2">
                                    <div>
                                      <h4 className="font-medium text-gray-800 text-sm mb-0.5 truncate" title={lead.name}>{lead.name}</h4>
                                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                        <PhoneIcon className="flex-shrink-0 h-3 w-3" />
                                        <span className="truncate">{lead.phone}</span>
                                      </div>
                                    </div>

                                    {/* Adicionar um indicador de origem/indicação na parte superior do card */}
                                    {(lead.indication?.name || lead.source) && (
                                      <div className="flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                        <LinkIcon className="h-3 w-3 text-blue-500" />
                                        <span className="text-[10px] font-medium text-blue-700 truncate">
                                          {lead.indication?.name || (lead.source?.includes('/') 
                                            ? lead.source.split('/').filter(Boolean)[1] 
                                            : lead.source)}
                                        </span>
                                      </div>
                                    )}

                                    <div className="pt-1.5 border-t border-gray-200">
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        {lead.interest && (
                                          <div>
                                            <p className="text-[10px] font-medium text-gray-500 mb-0">Interesse</p>
                                            <p className="text-gray-900 truncate" title={lead.interest}>{lead.interest}</p>
                                          </div>
                                        )}
                                        {lead.appointmentDate && (
                                          <div>
                                            <p className="text-[10px] font-medium text-gray-500 mb-0">Agendamento</p>
                                            <p className="text-gray-900 truncate">
                                              {new Date(lead.appointmentDate).toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                                            </p>
                                          </div>
                                        )}
                                        {lead.createdAt && (
                                          <div>
                                            <p className="text-[10px] font-medium text-gray-500 mb-0">Criado em</p>
                                            <p className="text-gray-900 truncate">
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
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal de Edição */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[425px] bg-white p-0 rounded-lg border border-gray-200 shadow-lg">
            <DialogHeader className="p-4 border-b border-gray-200 bg-gray-50">
              <DialogTitle className="text-lg font-medium text-gray-800">Editar Lead</DialogTitle>
            </DialogHeader>
            {editingLead && (
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!editingLead) return;
                handleEditLead(editingLead);
              }} className="space-y-4 p-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm text-gray-700">Nome</Label>
                  <Input
                    id="name"
                    value={editingLead.name}
                    onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                    className="w-full h-9 bg-white border-gray-300 text-gray-900"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm text-gray-700">Telefone</Label>
                  <Input
                    id="phone"
                    value={editingLead.phone}
                    onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                    className="w-full h-9 bg-white border-gray-300 text-gray-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interest" className="text-sm text-gray-700">Interesse</Label>
                  <Input
                    id="interest"
                    value={editingLead.interest || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, interest: e.target.value })}
                    className="w-full h-9 bg-white border-gray-300 text-gray-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm text-gray-700">Status</Label>
                  <Select 
                    value={editingLead.status || 'Novo'}
                    onValueChange={(value) => setEditingLead({ ...editingLead, status: value })}
                  >
                    <SelectTrigger className="w-full h-9 bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 text-gray-900">
                      <SelectItem value="Novo" className="text-gray-700 focus:bg-blue-50">Novo</SelectItem>
                      <SelectItem value="Agendado" className="text-gray-700 focus:bg-blue-50">Agendado</SelectItem>
                      <SelectItem value="Compareceu" className="text-gray-700 focus:bg-blue-50">Compareceu</SelectItem>
                      <SelectItem value="Fechado" className="text-gray-700 focus:bg-blue-50">Fechado</SelectItem>
                      <SelectItem value="Não veio" className="text-gray-700 focus:bg-blue-50">Não veio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointmentDate" className="text-sm text-gray-700">Data do Agendamento</Label>
                  <Input
                    id="appointmentDate"
                    type="datetime-local"
                    value={editingLead.appointmentDate || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, appointmentDate: e.target.value })}
                    className="w-full h-9 bg-white border-gray-300 text-gray-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source" className="text-sm text-gray-700">Origem</Label>
                  <Input
                    id="source"
                    value={editingLead.source || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, source: e.target.value })}
                    className="w-full h-9 bg-white border-gray-300 text-gray-900"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                    className="h-9 px-4 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    className="h-9 px-4 bg-blue-600 text-white hover:bg-blue-700 border-none"
                  >
                    Salvar alterações
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DragDropContext>
  );
} 