'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PhoneIcon, DocumentTextIcon, PencilIcon } from "@heroicons/react/24/outline";
import { toast } from "@/components/ui/use-toast";

interface Lead {
  id: string;
  name: string;
  phone: string;
  interest?: string;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  status?: string;
  potentialValue?: number;
  appointmentDate?: string;
  medicalNotes?: string;
  createdAt: string;
  indication?: {
    name?: string;
    slug: string;
  };
}

// Definição dos status e suas cores
const statuses = [
  { key: 'Novo', label: '○ Novo', color: 'bg-blue-500/10 border-blue-500/20', textColor: 'text-blue-400', description: 'Lead recém-captado' },
  { key: 'Em contato', label: '◔ Em contato', color: 'bg-blue-500/20 border-blue-500/30', textColor: 'text-blue-400', description: 'Secretária já falou ou está em conversa' },
  { key: 'Agendado', label: '◑ Agendado', color: 'bg-blue-500/30 border-blue-500/40', textColor: 'text-blue-400', description: 'Consulta marcada' },
  { key: 'Compareceu', label: '◕ Compareceu', color: 'bg-blue-500/40 border-blue-500/50', textColor: 'text-blue-400', description: 'Já foi atendido' },
  { key: 'Fechado', label: '● Fechou', color: 'bg-blue-500/50 border-blue-500/60', textColor: 'text-blue-400', description: 'Virou paciente/cliente' },
  { key: 'Não veio', label: '× Perdido', color: 'bg-blue-950/40 border-blue-900/30', textColor: 'text-blue-400', description: 'Sumiu, recusou ou não compareceu' },
];

export default function PipelinePage() {
  const { data: session } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingLead, setDraggingLead] = useState<Lead | null>(null);

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

  // Função para organizar leads por status
  const getLeadsByStatus = (status: string) => {
    return leads.filter(lead => (lead.status || 'Novo') === status);
  };

  // Função para lidar com o início do arrastar
  const handleDragStart = (lead: Lead) => {
    setDraggingLead(lead);
  };

  // Função para lidar com o soltar
  const handleDrop = async (targetStatus: string) => {
    if (!draggingLead || draggingLead.status === targetStatus) {
      setDraggingLead(null);
      return;
    }

    try {
      // Atualizar localmente para feedback imediato
      setLeads(leads.map(lead => 
        lead.id === draggingLead.id 
          ? { ...lead, status: targetStatus } 
          : lead
      ));

      // Enviar para a API
      const response = await fetch(`/api/leads?leadId=${draggingLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draggingLead.name,
          phone: draggingLead.phone,
          status: targetStatus
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar o status do lead');
      }

      toast({
        title: "Status atualizado",
        description: `Lead movido para ${targetStatus}`,
      });

      // Recarregar leads para garantir sincronização
      fetchLeads();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do lead",
        variant: "destructive"
      });
      // Reverter a mudança visual se a API falhar
      fetchLeads();
    } finally {
      setDraggingLead(null);
    }
  };

  // Função para chamar o WhatsApp
  const openWhatsApp = (phone: string) => {
    const formattedPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${formattedPhone}`, '_blank');
  };

  // Renderizar o cartão de lead
  const renderLeadCard = (lead: Lead) => {
    const sourceDisplay = lead.utmSource || (lead.source || 'Direto');
    const indicatorName = lead.indication?.name || lead.indication?.slug || 'Link principal';
    
    return (
      <div
        key={lead.id}
        draggable
        onDragStart={() => handleDragStart(lead)}
        className="bg-black/20 p-3 rounded-lg border border-white/10 mb-2 cursor-move hover:bg-black/30 transition-colors"
      >
        <div className="font-medium text-white">{lead.name}</div>
        
        <div className="mt-2 flex items-center text-sm text-zinc-400">
          <button 
            onClick={() => openWhatsApp(lead.phone)} 
            className="flex items-center text-zinc-400 hover:text-blue-400 mr-4 transition-colors"
          >
            <PhoneIcon className="h-4 w-4 mr-1" />
            {lead.phone}
          </button>
        </div>
        
        <div className="mt-2 flex justify-between text-xs">
          <div className="text-zinc-500">
            <span>👤 {indicatorName}</span>
          </div>
          <div className="text-zinc-500">
            <span>📱 {sourceDisplay}</span>
          </div>
        </div>
        
        {lead.potentialValue && (
          <div className="mt-2 text-sm font-medium text-blue-400">
            R$ {lead.potentialValue.toFixed(0)}
          </div>
        )}
        
        <div className="mt-2 flex justify-between border-t pt-2 border-white/5">
          <div className="flex space-x-2">
            <button 
              onClick={() => openWhatsApp(lead.phone)}
              className="p-1 text-zinc-400 hover:bg-white/5 hover:text-turquoise rounded transition-colors"
              title="Abrir WhatsApp"
            >
              <PhoneIcon className="h-4 w-4" />
            </button>
            
            <button 
              className="p-1 text-zinc-400 hover:bg-white/5 hover:text-white rounded transition-colors"
              title="Ver prontuário"
            >
              <DocumentTextIcon className="h-4 w-4" />
            </button>
          </div>
          
          <button 
            className="p-1 text-zinc-400 hover:bg-white/5 hover:text-white rounded transition-colors"
            title="Editar lead"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  // Renderizar coluna de status
  const renderStatusColumn = (status: typeof statuses[0]) => {
    const statusLeads = getLeadsByStatus(status.key);
    
    return (
      <div 
        key={status.key}
        className="w-80 flex-shrink-0"
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => handleDrop(status.key)}
      >
        <div className={`rounded-t-lg ${status.color} border px-3 py-2`}>
          <h3 className={`font-medium ${status.textColor} flex items-center`}>
            <span>{status.label}</span>
            <span className="ml-2 bg-black/20 text-xs rounded-full px-2 py-0.5">
              {statusLeads.length}
            </span>
          </h3>
          <p className="text-xs text-zinc-400">{status.description}</p>
        </div>
        
        <div className="bg-black/10 rounded-b-lg p-2 border border-t-0 border-white/10 min-h-[70vh]">
          {loading ? (
            <div className="text-center p-4 text-zinc-400 text-sm">Carregando...</div>
          ) : statusLeads.length > 0 ? (
            <div className="space-y-2">
              {statusLeads.map(lead => renderLeadCard(lead))}
            </div>
          ) : (
            <div className="text-center p-4 text-zinc-500 text-sm italic border border-dashed border-white/10 rounded-lg">
              Nenhum lead neste status
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card className="bg-black/20 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle>Pipeline de Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-zinc-400 mb-4">
            Arraste os cartões entre as colunas para atualizar o status dos leads.
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4">
            {statuses.map(status => renderStatusColumn(status))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 