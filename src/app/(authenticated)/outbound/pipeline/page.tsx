'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import dynamic from 'next/dynamic';
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  PhoneIcon, 
  PencilIcon, 
  LinkIcon, 
  ArrowPathIcon,
  PlusIcon,
  MegaphoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// DnD components with dynamic import to avoid SSR issues
const DragDropContextLib = dynamic(
  () => import('@hello-pangea/dnd').then(mod => mod.DragDropContext),
  { ssr: false }
);

const DroppableLib = dynamic(
  () => import('@hello-pangea/dnd').then(mod => mod.Droppable),
  { ssr: false }
);

const DraggableLib = dynamic(
  () => import('@hello-pangea/dnd').then(mod => mod.Draggable),
  { ssr: false }
);

// Types for dynamic imports
type DroppableProvided = any;
type DraggableProvided = any;
type DropResult = any;

interface Outbound {
  id: string;
  nome: string;
  whatsapp?: string | null;
  instagram?: string | null;
  email?: string | null;
  especialidade?: string | null;
  status?: string | null;
  observacoes?: string | null;
  endereco?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ContactNote {
  id: string;
  date: string;
  content: string;
  type: 'whatsapp' | 'email' | 'instagram' | 'call' | 'other';
  createdAt?: string;
  updatedAt?: string;
}

// Define columns based on status options
const columns = [
  { id: 'prospectado', title: 'Prospectado' },
  { id: 'abordado', title: 'Abordado' },
  { id: 'respondeu', title: 'Respondeu' },
  { id: 'interessado', title: 'Interessado' },
  { id: 'publicou link', title: 'Publicou Link' },
  { id: 'upgrade lead', title: 'Upgrade Lead' }
];

export default function OutboundPipelinePage() {
  const { data: session, status } = useSession();
  const [outbounds, setOutbounds] = useState<Outbound[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOutbound, setSelectedOutbound] = useState<Outbound | null>(null);
  const [contactNotes, setContactNotes] = useState<ContactNote[]>([]);
  const [newNote, setNewNote] = useState({ content: '', type: 'whatsapp' });
  const [activeTab, setActiveTab] = useState('details');
  
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchOutbounds();
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [session, status]);
  
  const fetchOutbounds = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/outbound');
      
      if (response.ok) {
        const data = await response.json();
        setOutbounds(data);
      } else {
        console.error('Erro ao buscar contatos:', response.statusText);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os contatos de outbound",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao buscar contatos:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um problema ao carregar os dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;
    
    const newStatus = destination.droppableId;
    
    // Update local state first for immediate UI response
    setOutbounds(outbounds.map(item => 
      item.id === draggableId ? { ...item, status: newStatus } : item
    ));
    
    // Then update on the server
    try {
      const response = await fetch(`/api/outbound/${draggableId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) throw new Error('Erro ao atualizar status');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do contato",
        variant: "destructive"
      });
      // Ideally would revert the state here
    }
  };
  
  const getColumnOutbounds = (columnId: string) => {
    return outbounds.filter(item => 
      (item.status === columnId) || 
      (!item.status && columnId === 'prospectado') // Default for items without status
    );
  };
  
  const formatPhone = (phone?: string | null) => {
    if (!phone) return '';
    // Clean up the phone number and keep only digits
    return phone.replace(/\D/g, '');
  };
  
  // Function to create Gmail link
  const createGmailLink = (email: string, name: string) => {
    const subject = encodeURIComponent(`Contato - ${name}`);
    const body = encodeURIComponent(`Olá ${name},\n\n`);
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`;
  };
  
  // Function to open modal and load contact details
  const openModal = async (outbound: Outbound) => {
    setSelectedOutbound(outbound);
    setIsModalOpen(true);
    setLoading(true);
    
    try {
      // Carregar interações do contato a partir da API
      const response = await fetch(`/api/outbound/${outbound.id}/interactions`);
      
      if (response.ok) {
        const data = await response.json();
        setContactNotes(data);
      } else {
        console.error('Erro ao buscar interações:', response.statusText);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o histórico de interações",
          variant: "destructive"
        });
        // Definir array vazio para não quebrar a interface
        setContactNotes([]);
      }
    } catch (error) {
      console.error('Erro ao buscar interações:', error);
      setContactNotes([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to add a new contact note
  const addContactNote = async () => {
    if (!newNote.content.trim() || !selectedOutbound) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/outbound/${selectedOutbound.id}/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newNote.content,
          type: newNote.type
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setContactNotes([data, ...contactNotes]);
        setNewNote({ content: '', type: 'whatsapp' });
        
        toast({
          title: "Interação adicionada",
          description: "A interação foi registrada com sucesso"
        });
      } else {
        console.error('Erro ao adicionar interação:', response.statusText);
        toast({
          title: "Erro",
          description: "Não foi possível registrar a interação",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao adicionar interação:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um problema ao salvar a interação",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to delete a contact note
  const deleteContactNote = async (id: string) => {
    if (!selectedOutbound) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/outbound/${selectedOutbound.id}/interactions?interactionId=${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Atualizar estado local removendo a interação
        setContactNotes(contactNotes.filter(note => note.id !== id));
        
        toast({
          title: "Interação removida",
          description: "A interação foi removida com sucesso"
        });
      } else {
        console.error('Erro ao remover interação:', response.statusText);
        toast({
          title: "Erro",
          description: "Não foi possível remover a interação",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao remover interação:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um problema ao remover a interação",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && outbounds.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-gray-100 pb-24 lg:pb-16 lg:ml-52 px-2 sm:px-4 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-[100dvh] bg-gray-100 pb-24 lg:pb-16 lg:ml-52 px-2 sm:px-4">
      <div className="container mx-auto px-0 sm:pl-4 md:pl-8 lg:pl-0 max-w-full sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%] pt-20 lg:pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-[-0.03em] font-inter">Pipeline de Outbound</h2>
            <p className="text-xs md:text-sm text-gray-600 tracking-[-0.03em] font-inter">
              Gerencie o progresso dos seus contatos de outbound
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => router.push('/outbound')}
              variant="outline"
              className="bg-white/80 border-gray-200 text-gray-700 hover:bg-gray-100 shadow-sm"
            >
              Ver Tabela
            </Button>
            
            <Button 
              onClick={fetchOutbounds}
              variant="ghost"
              size="icon"
              className="rounded-full w-8 h-8 text-gray-500"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </Button>
            
            <Button 
              onClick={() => router.push('/outbound?new=true')}
              className="bg-primary hover:bg-primary/90"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto pb-6">
          <DragDropContextLib onDragEnd={handleDragEnd}>
            <div className="flex gap-4 min-w-[1000px]">
              {columns.map(column => (
                <div key={column.id} className="flex-1 min-w-[250px]">
                  <div className="rounded-xl bg-white/80 backdrop-blur-sm shadow-sm border border-gray-200/80 overflow-hidden">
                    <div className="bg-white/50 backdrop-blur-sm p-3 border-b border-gray-100">
                      <h3 className="font-semibold text-sm text-gray-900 flex items-center">
                        <div className={cn(
                          "mr-2 w-2 h-2 rounded-full",
                          column.id === 'prospectado' && "bg-blue-500",
                          column.id === 'abordado' && "bg-yellow-500",
                          column.id === 'respondeu' && "bg-amber-500",
                          column.id === 'interessado' && "bg-orange-500",
                          column.id === 'publicou link' && "bg-green-500",
                          column.id === 'upgrade lead' && "bg-purple-500",
                        )} />
                        {column.title}
                        <div className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                          {getColumnOutbounds(column.id).length}
                        </div>
                      </h3>
                    </div>
                    
                    <DroppableLib droppableId={column.id}>
                      {(provided: DroppableProvided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="p-2 min-h-[75vh] bg-white/30"
                        >
                          {getColumnOutbounds(column.id).map((item, index) => (
                            <DraggableLib
                              key={item.id}
                              draggableId={item.id}
                              index={index}
                            >
                              {(provided: DraggableProvided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="mb-2 p-3 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                                  onClick={() => openModal(item)}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-medium text-gray-900 text-sm">{item.nome}</h4>
                                    <div className="flex items-center gap-1">
                                      {item.email && (
                                        <a 
                                          href={createGmailLink(item.email, item.nome)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-gray-400 hover:text-blue-500 transition-colors"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <EnvelopeIcon className="h-4 w-4" />
                                        </a>
                                      )}
                                      
                                      {item.whatsapp && (
                                        <a 
                                          href={`https://wa.me/${formatPhone(item.whatsapp)}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-gray-400 hover:text-green-500 transition-colors"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <PhoneIcon className="h-4 w-4" />
                                        </a>
                                      )}
                                      
                                      {item.instagram && (
                                        <a 
                                          href={`https://instagram.com/${item.instagram.replace('@', '')}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-gray-400 hover:text-pink-500 transition-colors"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                          </svg>
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="text-xs text-gray-500">
                                    {item.especialidade && (
                                      <span className="inline-block bg-gray-100 text-gray-800 rounded-full px-2 py-0.5 text-xs mr-2 mb-1">
                                        {item.especialidade}
                                      </span>
                                    )}
                                  </div>
                                  
                                  {item.observacoes && (
                                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                                      {item.observacoes}
                                    </p>
                                  )}
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
          </DragDropContextLib>
        </div>
      </div>
      
      {/* Contact Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center">
              {selectedOutbound?.nome}
              {selectedOutbound?.especialidade && (
                <span className="ml-2 text-sm bg-gray-100 text-gray-800 rounded-full px-2 py-0.5">
                  {selectedOutbound.especialidade}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Gerenciar detalhes e cadência de contatos
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="cadence">Cadência de Contatos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact-name" className="text-sm font-medium text-gray-700">
                    Nome
                  </Label>
                  <div className="mt-1 text-gray-900">
                    {selectedOutbound?.nome || "Não informado"}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="contact-specialty" className="text-sm font-medium text-gray-700">
                    Especialidade
                  </Label>
                  <div className="mt-1 text-gray-900">
                    {selectedOutbound?.especialidade || "Não informado"}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="contact-whatsapp" className="text-sm font-medium text-gray-700">
                    WhatsApp
                  </Label>
                  <div className="mt-1 text-gray-900 flex items-center">
                    {selectedOutbound?.whatsapp ? (
                      <>
                        {selectedOutbound.whatsapp}
                        <a 
                          href={`https://wa.me/${formatPhone(selectedOutbound.whatsapp)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          <PhoneIcon className="h-4 w-4" />
                        </a>
                      </>
                    ) : (
                      "Não informado"
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="contact-email" className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <div className="mt-1 text-gray-900 flex items-center">
                    {selectedOutbound?.email ? (
                      <>
                        {selectedOutbound.email}
                        <a 
                          href={selectedOutbound.email ? createGmailLink(selectedOutbound.email, selectedOutbound.nome) : "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <EnvelopeIcon className="h-4 w-4" />
                        </a>
                      </>
                    ) : (
                      "Não informado"
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="contact-instagram" className="text-sm font-medium text-gray-700">
                    Instagram
                  </Label>
                  <div className="mt-1 text-gray-900 flex items-center">
                    {selectedOutbound?.instagram ? (
                      <>
                        {selectedOutbound.instagram}
                        <a 
                          href={`https://instagram.com/${selectedOutbound.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-pink-600 hover:text-pink-800"
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                          </svg>
                        </a>
                      </>
                    ) : (
                      "Não informado"
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="contact-address" className="text-sm font-medium text-gray-700">
                    Endereço
                  </Label>
                  <div className="mt-1 text-gray-900">
                    {selectedOutbound?.endereco || "Não informado"}
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="contact-notes" className="text-sm font-medium text-gray-700">
                  Observações
                </Label>
                <div className="mt-1 text-gray-900 p-2 bg-gray-50 rounded-md min-h-[60px]">
                  {selectedOutbound?.observacoes || "Sem observações"}
                </div>
              </div>
              
              <div className="pt-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/outbound?edit=${selectedOutbound?.id}`)}
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Editar Informações
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="cadence" className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                <h3 className="font-medium text-gray-900 mb-2">Adicionar Nova Interação</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="note-type" className="text-sm font-medium text-gray-700">
                        Tipo
                      </Label>
                      <select 
                        id="note-type"
                        className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm mt-1"
                        value={newNote.type} 
                        onChange={(e) => setNewNote({...newNote, type: e.target.value})}
                      >
                        <option value="whatsapp">WhatsApp</option>
                        <option value="email">E-mail</option>
                        <option value="instagram">Instagram</option>
                        <option value="call">Ligação</option>
                        <option value="other">Outro</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="note-content" className="text-sm font-medium text-gray-700">
                      Descrição
                    </Label>
                    <Textarea
                      id="note-content"
                      placeholder="Descreva a interação..."
                      className="mt-1"
                      value={newNote.content}
                      onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                    />
                  </div>
                  
                  <Button 
                    onClick={addContactNote}
                    disabled={loading || !newNote.content.trim()}
                  >
                    {loading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Adicionando...
                      </>
                    ) : (
                      "Adicionar Interação"
                    )}
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Histórico de Interações</h3>
                
                {loading && contactNotes.length === 0 ? (
                  <div className="flex justify-center items-center p-8 bg-gray-50 rounded-md">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  </div>
                ) : contactNotes.length > 0 ? (
                  <div className="space-y-3">
                    {contactNotes.map((note) => (
                      <div key={note.id} className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-1">
                            {note.type === 'whatsapp' && <PhoneIcon className="h-4 w-4 text-green-500" />}
                            {note.type === 'email' && <EnvelopeIcon className="h-4 w-4 text-blue-500" />}
                            {note.type === 'instagram' && (
                              <svg className="h-4 w-4 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                              </svg>
                            )}
                            {note.type === 'call' && <PhoneIcon className="h-4 w-4 text-amber-500" />}
                            {note.type === 'other' && <CalendarIcon className="h-4 w-4 text-gray-500" />}
                            <span className="font-medium capitalize text-sm">
                              {note.type === 'whatsapp' && 'WhatsApp'}
                              {note.type === 'email' && 'E-mail'}
                              {note.type === 'instagram' && 'Instagram'}
                              {note.type === 'call' && 'Ligação'}
                              {note.type === 'other' && 'Outro'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {note.createdAt ? new Date(note.createdAt).toLocaleDateString('pt-BR') : ''} 
                              {note.createdAt ? ' ' + new Date(note.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : ''}
                            </span>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full hover:bg-red-50 hover:text-red-500"
                              onClick={() => deleteContactNote(note.id)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                <line x1="10" x2="10" y1="11" y2="17"></line>
                                <line x1="14" x2="14" y1="11" y2="17"></line>
                              </svg>
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 mt-2">{note.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 bg-gray-50 rounded-md">
                    <p className="text-gray-500">Nenhuma interação registrada</p>
                  </div>
                )}
              </div>
              
              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('details')}
                  className="w-full"
                >
                  Voltar para Detalhes
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 