'use client';

import { useState, useEffect } from 'react';
import { CalendarIcon, ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  colorId?: string;
}

export default function AgendaPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    startTime: '',
    endTime: '',
    colorId: '1' // Default blue
  });

  useEffect(() => {
    // Verificar se o usuário já está conectado com o Google Calendar
    checkGoogleConnection();
    // Carregar eventos
    fetchEvents();
  }, []);

  // Atualizar o estado newEvent.date quando selectedDate mudar
  useEffect(() => {
    if (selectedDate) {
      setNewEvent({
        ...newEvent,
        date: format(selectedDate, 'yyyy-MM-dd')
      });
    }
  }, [selectedDate]);

  const checkGoogleConnection = async () => {
    try {
      const response = await fetch('/api/google/auth-status');
      const data = await response.json();
      setIsConnected(data.isConnected);
    } catch (error) {
      console.error('Erro ao verificar conexão com Google:', error);
      setIsConnected(false);
    }
  };

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/google/calendar/events');
      if (response.ok) {
        const data = await response.json();
        // Converter strings de data para objetos Date
        const formattedEvents = data.events.map((event: any) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end)
        }));
        setEvents(formattedEvents);
      } else {
        // Se não estiver autenticado ou houver outro erro
        setEvents([]);
      }
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os eventos da agenda",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const connectGoogle = async () => {
    try {
      const response = await fetch('/api/google/auth-url');
      const data = await response.json();
      
      if (data.url) {
        // Redirecionar para a URL de autenticação do Google
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Erro ao iniciar autenticação Google:', error);
      toast({
        title: "Erro",
        description: "Não foi possível conectar ao Google Calendar",
        variant: "destructive"
      });
    }
  };

  const handleCreateEvent = async () => {
    // Validar campos obrigatórios
    if (!newEvent.title || !newEvent.date || !newEvent.startTime || !newEvent.endTime) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      // Formatar datas para ISO string
      const startDateTime = new Date(`${newEvent.date}T${newEvent.startTime}`);
      const endDateTime = new Date(`${newEvent.date}T${newEvent.endTime}`);

      const eventData = {
        title: newEvent.title,
        description: newEvent.description,
        location: newEvent.location,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        colorId: newEvent.colorId
      };

      const response = await fetch('/api/google/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Evento criado com sucesso",
        });
        
        // Limpar formulário e fechar modal
        setNewEvent({
          title: '',
          description: '',
          location: '',
          date: '',
          startTime: '',
          endTime: '',
          colorId: '1'
        });
        setShowNewEventModal(false);
        
        // Recarregar eventos
        fetchEvents();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar evento');
      }
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar evento",
        variant: "destructive"
      });
    }
  };

  // Função para formatar a data no formato brasileiro
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Função para obter a cor do evento baseado no colorId
  const getEventColor = (colorId?: string) => {
    const colors: {[key: string]: string} = {
      '1': 'bg-blue-100 text-blue-800 border-blue-300',
      '2': 'bg-green-100 text-green-800 border-green-300',
      '3': 'bg-purple-100 text-purple-800 border-purple-300',
      '4': 'bg-red-100 text-red-800 border-red-300',
      '5': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      '6': 'bg-indigo-100 text-indigo-800 border-indigo-300',
      '7': 'bg-pink-100 text-pink-800 border-pink-300',
      '8': 'bg-gray-100 text-gray-800 border-gray-300',
      '9': 'bg-orange-100 text-orange-800 border-orange-300',
      '10': 'bg-teal-100 text-teal-800 border-teal-300',
    };
    
    return colors[colorId || '1'] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="min-h-[100dvh] bg-gray-100 pt-20 pb-24 md:pt-12 md:pb-16 px-2 sm:px-4">
      <div className="container mx-auto px-0 sm:pl-4 md:pl-8 lg:pl-16 max-w-full sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-sm md:text-base font-bold text-gray-900 tracking-[-0.03em] font-inter">Agenda</h1>
            <p className="text-xs text-gray-600 tracking-[-0.03em] font-inter">Gerencie sua agenda e compromissos</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-2 md:mt-0 w-full sm:w-auto">
            {isConnected ? (
              <>
                <Button 
                  onClick={() => setShowNewEventModal(true)}
                  className="w-full sm:w-auto bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg-gray-800/10 text-xs h-8"
                >
                  <PlusIcon className="h-3.5 w-3.5 mr-1.5" />
                  Novo Evento
                </Button>
                <Button 
                  onClick={fetchEvents}
                  variant="outline"
                  className="w-full sm:w-auto mt-2 sm:mt-0 bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg-gray-800/10 text-xs h-8"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowPathIcon className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Atualizar
                </Button>
              </>
            ) : (
              <Button 
                onClick={connectGoogle}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_8px_24px_rgba(37,99,235,0.3)] transition-all duration-300 rounded-2xl text-xs h-8"
              >
                <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                Conectar Google Calendar
              </Button>
            )}
          </div>
        </div>

        <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
          <CardHeader className="pb-1 pt-2 px-3">
            <CardTitle className="text-xs md:text-sm font-bold text-gray-900 tracking-[-0.03em] font-inter">Seus Eventos</CardTitle>
            <CardDescription className="text-xs text-gray-500 tracking-[-0.03em] font-inter">
              {isConnected ? 'Eventos sincronizados com o Google Calendar' : 'Conecte-se ao Google Calendar para ver seus eventos'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-3 px-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <ArrowPathIcon className="h-6 w-6 text-gray-400 animate-spin" />
              </div>
            ) : !isConnected ? (
              <div className="bg-blue-50 p-3 rounded-xl text-center">
                <CalendarIcon className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <h3 className="text-blue-700 font-medium text-sm mb-1">Conecte sua agenda Google</h3>
                <p className="text-blue-600 text-xs mb-3">Sincronize seus eventos do Google Calendar para visualizá-los aqui.</p>
                <Button 
                  onClick={connectGoogle}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3"
                >
                  Conectar Agenda
                </Button>
              </div>
            ) : events.length === 0 ? (
              <div className="bg-gray-50 p-3 rounded-xl text-center">
                <CalendarIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <h3 className="text-gray-700 font-medium text-sm mb-1">Nenhum evento encontrado</h3>
                <p className="text-gray-600 text-xs mb-3">Você ainda não tem eventos agendados ou sincronizados.</p>
                <Button 
                  onClick={() => setShowNewEventModal(true)}
                  className="bg-gray-800 hover:bg-gray-900 text-white text-xs h-8 px-3"
                >
                  Criar Novo Evento
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map(event => (
                  <div 
                    key={event.id} 
                    className={`p-3 rounded-xl border ${getEventColor(event.colorId)}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-sm">{event.title}</h3>
                        <p className="text-xs opacity-80 mb-1">
                          {formatDate(event.start)}
                        </p>
                        {event.description && (
                          <p className="text-xs mt-1">{event.description}</p>
                        )}
                        {event.location && (
                          <div className="text-xs bg-white/80 rounded px-2 py-0.5 inline-block mt-1">
                            {event.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal para criar novo evento */}
      <Dialog open={showNewEventModal} onOpenChange={setShowNewEventModal}>
        <DialogContent className="bg-white border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-3xl p-3 w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-gray-900 tracking-[-0.03em] font-inter">Novo Evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-1 max-h-[65vh] overflow-y-auto pr-1">
            <div>
              <Label htmlFor="title" className="text-xs font-medium text-gray-700">Título *</Label>
              <Input 
                id="title" 
                value={newEvent.title}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                placeholder="Nome do evento"
                className="bg-white border-gray-200 focus:border-gray-300 rounded-xl h-8 text-xs text-gray-800"
              />
            </div>
            
            <div>
              <Label htmlFor="date" className="text-xs font-medium text-gray-700">Data *</Label>
              <div className="relative">
                <DatePicker
                  selected={selectedDate}
                  onChange={(date: Date | null) => date && setSelectedDate(date)}
                  dateFormat="dd/MM/yyyy"
                  locale={ptBR}
                  placeholderText="Selecione uma data"
                  wrapperClassName="w-full"
                  className="w-full bg-white border border-gray-200 focus:border-gray-300 rounded-xl h-8 text-xs text-gray-800 px-3 cursor-pointer"
                />
                <CalendarIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="startTime" className="text-xs font-medium text-gray-700">Início *</Label>
                <Input 
                  id="startTime" 
                  type="time"
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})}
                  className="bg-white border-gray-200 focus:border-gray-300 rounded-xl h-8 text-xs text-gray-800"
                />
              </div>
              <div>
                <Label htmlFor="endTime" className="text-xs font-medium text-gray-700">Fim *</Label>
                <Input 
                  id="endTime" 
                  type="time"
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                  className="bg-white border-gray-200 focus:border-gray-300 rounded-xl h-8 text-xs text-gray-800"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description" className="text-xs font-medium text-gray-700">Descrição</Label>
              <Textarea 
                id="description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                placeholder="Detalhes do evento"
                className="bg-white border-gray-200 focus:border-gray-300 rounded-xl text-xs min-h-[60px] text-gray-800"
              />
            </div>
            
            <div>
              <Label htmlFor="location" className="text-xs font-medium text-gray-700">Local</Label>
              <Input 
                id="location" 
                value={newEvent.location}
                onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                placeholder="Endereço ou local do evento"
                className="bg-white border-gray-200 focus:border-gray-300 rounded-xl h-8 text-xs text-gray-800"
              />
            </div>
            
            <div>
              <Label htmlFor="color" className="text-xs font-medium text-gray-700">Cor</Label>
              <Select 
                value={newEvent.colorId} 
                onValueChange={(value) => setNewEvent({...newEvent, colorId: value})}
              >
                <SelectTrigger className="bg-white border-gray-200 rounded-xl h-8 text-xs text-gray-800">
                  <SelectValue placeholder="Selecione uma cor" />
                </SelectTrigger>
                <SelectContent className="bg-white text-gray-800">
                  <SelectItem value="1">Azul</SelectItem>
                  <SelectItem value="2">Verde</SelectItem>
                  <SelectItem value="3">Roxo</SelectItem>
                  <SelectItem value="4">Vermelho</SelectItem>
                  <SelectItem value="5">Amarelo</SelectItem>
                  <SelectItem value="6">Índigo</SelectItem>
                  <SelectItem value="7">Rosa</SelectItem>
                  <SelectItem value="8">Cinza</SelectItem>
                  <SelectItem value="9">Laranja</SelectItem>
                  <SelectItem value="10">Turquesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-3">
            <Button
              variant="outline"
              onClick={() => setShowNewEventModal(false)}
              className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateEvent}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-8 text-xs ml-2"
            >
              Salvar Evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 