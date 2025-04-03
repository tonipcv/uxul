'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided, DropResult } from "@hello-pangea/dnd";
import { PhoneIcon, BriefcaseIcon, CalendarIcon, PencilIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

interface Lead {
  id: string;
  name: string;
  phone: string;
  interest?: string;
  status?: string;
  appointmentDate?: string;
  createdAt?: string;
  source?: string;
}

const columns = [
  { id: 'novos', title: 'Novos', color: 'bg-blue-50/80 border-blue-100' },
  { id: 'agendados', title: 'Agendados', color: 'bg-blue-50 border-blue-200' },
  { id: 'compareceram', title: 'Compareceram', color: 'bg-blue-100/80 border-blue-200' },
  { id: 'fechados', title: 'Fechados', color: 'bg-blue-100 border-blue-200' },
  { id: 'naoVieram', title: 'Não vieram', color: 'bg-red-50/80 border-red-100' }
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
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin h-6 w-6 border-2 border-blue-700 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="h-[100dvh] bg-slate-50 flex flex-col">
        {/* Header */}
        <div className="bg-slate-50 px-6 pt-6 pb-4">
          <h1 className="text-xl font-semibold text-gray-800">Pipeline</h1>
        </div>

        {/* Pipeline Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Column Selector */}
          <div className="md:hidden px-6 py-3 bg-white border-y border-blue-100">
            <div className="flex overflow-x-auto gap-3 -mx-6 px-6">
              {columns.map(column => (
                <div 
                  key={column.id} 
                  className={`flex-none px-4 py-2 rounded-full ${column.color} border shadow-sm`}
                >
                  <span className="text-sm font-medium text-gray-800">{column.title}</span>
                  <span className="ml-2 text-xs text-gray-500">{getColumnLeads(column.id).length}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Columns Layout */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-6 px-6 py-4 h-full min-w-full md:min-w-0">
              {columns.map(column => (
                <div 
                  key={column.id} 
                  className="flex-none md:flex-1 w-[85vw] md:w-auto md:min-w-[320px]"
                >
                  <div className={`rounded-xl ${column.color} border shadow-sm h-full flex flex-col`}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-inherit bg-white/50">
                      <h3 className="font-medium text-gray-800">{column.title}</h3>
                      <span className="text-sm text-gray-500">{getColumnLeads(column.id).length}</span>
                    </div>
                    
                    <Droppable droppableId={column.id}>
                      {(provided: DroppableProvided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="flex-1 overflow-y-auto p-4 space-y-3"
                        >
                          {getColumnLeads(column.id).map((lead, index) => (
                            <Draggable key={lead.id} draggableId={lead.id} index={index}>
                              {(provided: DraggableProvided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="group bg-white rounded-lg shadow-sm border border-blue-100/50 p-4 touch-manipulation hover:border-blue-200 transition-all relative"
                                >
                                  {/* Botões flutuantes que aparecem no hover */}
                                  <div className="absolute right-2 top-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {/* TODO: Implement quick schedule */}}
                                      className="h-8 w-8 p-0 hover:bg-blue-50"
                                    >
                                      <CalendarIcon className="h-4 w-4 text-blue-600" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setEditingLead(lead);
                                        setIsEditModalOpen(true);
                                      }}
                                      className="h-8 w-8 p-0 hover:bg-gray-50"
                                    >
                                      <PencilIcon className="h-4 w-4 text-gray-600" />
                                    </Button>
                                  </div>

                                  {/* Informações do Lead */}
                                  <div className="space-y-3">
                                    <div>
                                      <h4 className="font-medium text-gray-800 mb-1 truncate" title={lead.name}>{lead.name}</h4>
                                      <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <PhoneIcon className="flex-shrink-0 h-3.5 w-3.5" />
                                        <span className="truncate">{lead.phone}</span>
                                      </div>
                                    </div>

                                    <div className="pt-2 border-t border-gray-100">
                                      <div className="grid grid-cols-2 gap-3 text-sm">
                                        {lead.interest && (
                                          <div>
                                            <p className="text-xs font-medium text-gray-500 mb-0.5">Interesse</p>
                                            <p className="text-gray-700 truncate" title={lead.interest}>{lead.interest}</p>
                                          </div>
                                        )}
                                        {lead.source && (
                                          <div>
                                            <p className="text-xs font-medium text-gray-500 mb-0.5">Origem</p>
                                            <p className="text-gray-700 truncate" title={lead.source}>
                                              {lead.source.includes('/') 
                                                ? lead.source.split('/').filter(Boolean)[1] 
                                                : lead.source}
                                            </p>
                                          </div>
                                        )}
                                        {lead.appointmentDate && (
                                          <div>
                                            <p className="text-xs font-medium text-gray-500 mb-0.5">Agendamento</p>
                                            <p className="text-gray-700 truncate">
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
                                            <p className="text-xs font-medium text-gray-500 mb-0.5">Criado em</p>
                                            <p className="text-gray-700 truncate">
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Lead</DialogTitle>
            </DialogHeader>
            {editingLead && (
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!editingLead) return;
                handleEditLead(editingLead);
              }} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={editingLead.name}
                    onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={editingLead.phone}
                    onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interest">Interesse</Label>
                  <Input
                    id="interest"
                    value={editingLead.interest || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, interest: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={editingLead.status || 'Novo'}
                    onValueChange={(value) => setEditingLead({ ...editingLead, status: value })}
                  >
                    <SelectTrigger className="w-full">
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

                <div className="space-y-2">
                  <Label htmlFor="appointmentDate">Data do Agendamento</Label>
                  <Input
                    id="appointmentDate"
                    type="datetime-local"
                    value={editingLead.appointmentDate || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, appointmentDate: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source">Origem</Label>
                  <Input
                    id="source"
                    value={editingLead.source || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, source: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
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