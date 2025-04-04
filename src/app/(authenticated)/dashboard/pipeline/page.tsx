'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided, DropResult } from "@hello-pangea/dnd";
import { PhoneIcon, BriefcaseIcon, CalendarIcon, PencilIcon, XMarkIcon, LinkIcon } from "@heroicons/react/24/outline";
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
  { id: 'novos', title: 'Novos', color: 'bg-blue-500/20 border-blue-300/30' },
  { id: 'agendados', title: 'Agendados', color: 'bg-blue-600/20 border-blue-400/30' },
  { id: 'compareceram', title: 'Compareceram', color: 'bg-blue-700/20 border-blue-500/30' },
  { id: 'fechados', title: 'Fechados', color: 'bg-blue-800/20 border-blue-600/30' },
  { id: 'naoVieram', title: 'Não vieram', color: 'bg-red-500/20 border-red-300/30' }
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

  useEffect(() => {
    if (session?.user?.id) {
      fetchLeads();
    }
  }, [session]);

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

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const newStatus = statusMap[destination.droppableId];
    const oldStatus = statusMap[source.droppableId];
    
    // Encontra o lead que está sendo movido
    const lead = leads.find(l => l.id === draggableId);
    if (!lead) return;

    // Cria uma cópia do estado atual para reverter se necessário
    const previousLeads = [...leads];
    
    try {
      // Atualiza o estado local otimisticamente
      setLeads(leads.map(l => 
        l.id === draggableId ? { ...l, status: newStatus } : l
      ));

      const response = await fetch(`/api/leads?leadId=${draggableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        // Se a API falhar, reverte para o estado anterior
        setLeads(previousLeads);
        throw new Error('Erro ao atualizar status');
      }

      toast({
        title: "Lead atualizado",
        description: `Status alterado de ${oldStatus} para ${newStatus}`,
      });
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      // Reverte para o estado anterior em caso de erro
      setLeads(previousLeads);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive"
      });
    }
  };

  const getColumnLeads = (columnId: string) => {
    return leads.filter(lead => {
      if (columnId === 'novos') {
        return lead.status === 'Novo' || !lead.status;
      }
      return lead.status === statusMap[columnId];
    });
  };

  const handleEditLead = async (updatedLead: Lead) => {
    try {
      const response = await fetch(`/api/leads?leadId=${updatedLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLead)
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar lead');
      }

      setLeads(leads.map(lead => 
        lead.id === updatedLead.id ? updatedLead : lead
      ));

      toast({
        title: "Lead atualizado",
        description: "As informações foram atualizadas com sucesso",
      });

      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o lead",
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
      <div className="flex flex-col">
        {/* Header */}
        <div className="px-6 pt-2 pb-4">
          <h1 className="text-xl font-medium text-white">Pipeline</h1>
        </div>

        {/* Pipeline Content */}
        <div className="flex flex-col overflow-x-hidden overflow-y-hidden">
          {/* Mobile Column Selector */}
          <div className="md:hidden px-6 py-3 bg-white/10 backdrop-blur-sm border-y border-blue-500/30">
            <div className="flex overflow-x-auto gap-3 -mx-6 px-6 pb-1">
              {columns.map(column => (
                <div 
                  key={column.id} 
                  className={`flex-none px-4 py-2 rounded-full ${column.color} backdrop-blur-sm border shadow-sm`}
                >
                  <span className="text-sm font-medium text-white">{column.title}</span>
                  <span className="ml-2 text-xs text-blue-100/80">{getColumnLeads(column.id).length}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Columns Layout */}
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-6 px-6 py-4 min-w-full md:min-w-0 min-h-[70vh]">
              {columns.map(column => (
                <div 
                  key={column.id} 
                  className="flex-none md:flex-1 w-[85vw] md:w-auto md:min-w-[280px]"
                >
                  <div className={`rounded-xl ${column.color} backdrop-blur-sm border shadow-sm flex flex-col h-full`}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-inherit bg-white/5">
                      <h3 className="font-medium text-white">{column.title}</h3>
                      <span className="text-sm text-blue-100/80">{getColumnLeads(column.id).length}</span>
                    </div>
                    
                    <Droppable droppableId={column.id}>
                      {(provided: DroppableProvided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]"
                        >
                          {getColumnLeads(column.id).map((lead, index) => (
                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                              {(provided: DraggableProvided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="group bg-white/10 backdrop-blur-sm rounded-lg shadow-sm border border-white/20 p-4 touch-manipulation hover:border-blue-300/40 transition-all relative"
                                >
                                  {/* Botões flutuantes que aparecem no hover */}
                                  <div className="absolute right-2 top-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {/* TODO: Implement quick schedule */}}
                                      className="h-8 w-8 p-0 hover:bg-blue-600/30 text-blue-200"
                                    >
                                      <CalendarIcon className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setEditingLead(lead);
                                        setIsEditModalOpen(true);
                                      }}
                                      className="h-8 w-8 p-0 hover:bg-blue-600/30 text-blue-200"
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  {/* Informações do Lead */}
                                  <div className="space-y-3">
                                    <div>
                                      <h4 className="font-medium text-white mb-1 truncate" title={lead.name}>{lead.name}</h4>
                                      <div className="flex items-center gap-2 text-sm text-blue-100/80">
                                        <PhoneIcon className="flex-shrink-0 h-3.5 w-3.5" />
                                        <span className="truncate">{lead.phone}</span>
                                      </div>
                                    </div>

                                    {/* Adicionar um indicador de origem/indicação na parte superior do card */}
                                    {(lead.indication?.name || lead.source) && (
                                      <div className="flex items-center gap-1.5 bg-blue-600/30 px-2 py-1 rounded-md">
                                        <LinkIcon className="h-3.5 w-3.5 text-blue-200" />
                                        <span className="text-xs font-medium text-blue-100 truncate">
                                          {lead.indication?.name || (lead.source?.includes('/') 
                                            ? lead.source.split('/').filter(Boolean)[1] 
                                            : lead.source)}
                                        </span>
                                      </div>
                                    )}

                                    <div className="pt-2 border-t border-blue-500/20">
                                      <div className="grid grid-cols-2 gap-3 text-sm">
                                        {lead.interest && (
                                          <div>
                                            <p className="text-xs font-medium text-blue-100/60 mb-0.5">Interesse</p>
                                            <p className="text-blue-100 truncate" title={lead.interest}>{lead.interest}</p>
                                          </div>
                                        )}
                                        {lead.appointmentDate && (
                                          <div>
                                            <p className="text-xs font-medium text-blue-100/60 mb-0.5">Agendamento</p>
                                            <p className="text-blue-100 truncate">
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
                                            <p className="text-xs font-medium text-blue-100/60 mb-0.5">Criado em</p>
                                            <p className="text-blue-100 truncate">
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
          <DialogContent className="sm:max-w-[425px] bg-blue-800/90 backdrop-blur-sm p-0 rounded-lg border border-white/30">
            <DialogHeader className="p-4 border-b border-blue-500/30">
              <DialogTitle className="text-lg font-medium text-white">Editar Lead</DialogTitle>
            </DialogHeader>
            {editingLead && (
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!editingLead) return;
                handleEditLead(editingLead);
              }} className="space-y-4 p-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm text-blue-100">Nome</Label>
                  <Input
                    id="name"
                    value={editingLead.name}
                    onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                    className="w-full h-9 bg-white/10 backdrop-blur-sm border-white/30 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm text-blue-100">Telefone</Label>
                  <Input
                    id="phone"
                    value={editingLead.phone}
                    onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                    className="w-full h-9 bg-white/10 backdrop-blur-sm border-white/30 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interest" className="text-sm text-blue-100">Interesse</Label>
                  <Input
                    id="interest"
                    value={editingLead.interest || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, interest: e.target.value })}
                    className="w-full h-9 bg-white/10 backdrop-blur-sm border-white/30 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm text-blue-100">Status</Label>
                  <Select 
                    value={editingLead.status || 'Novo'}
                    onValueChange={(value) => setEditingLead({ ...editingLead, status: value })}
                  >
                    <SelectTrigger className="w-full h-9 bg-white/10 backdrop-blur-sm border-white/30 text-white">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent className="bg-blue-800/80 backdrop-blur-sm border border-blue-500/30 text-white">
                      <SelectItem value="Novo" className="text-blue-100 focus:bg-blue-700/50">Novo</SelectItem>
                      <SelectItem value="Agendado" className="text-blue-100 focus:bg-blue-700/50">Agendado</SelectItem>
                      <SelectItem value="Compareceu" className="text-blue-100 focus:bg-blue-700/50">Compareceu</SelectItem>
                      <SelectItem value="Fechado" className="text-blue-100 focus:bg-blue-700/50">Fechado</SelectItem>
                      <SelectItem value="Não veio" className="text-blue-100 focus:bg-blue-700/50">Não veio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointmentDate" className="text-sm text-blue-100">Data do Agendamento</Label>
                  <Input
                    id="appointmentDate"
                    type="datetime-local"
                    value={editingLead.appointmentDate || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, appointmentDate: e.target.value })}
                    className="w-full h-9 bg-white/10 backdrop-blur-sm border-white/30 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source" className="text-sm text-blue-100">Origem</Label>
                  <Input
                    id="source"
                    value={editingLead.source || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, source: e.target.value })}
                    className="w-full h-9 bg-white/10 backdrop-blur-sm border-white/30 text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                    className="h-9 px-4 bg-blue-700/30 border-blue-500/30 text-blue-100 hover:bg-blue-600/40"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    className="h-9 px-4 bg-white text-blue-700 hover:bg-white/90 border-none"
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