'use client';

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  PlusIcon, 
  ClipboardIcon, 
  QrCodeIcon,
  ShareIcon,
  LinkIcon,
  ChevronRightIcon,
  ArrowTrendingUpIcon,
  UserIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { toast } from "@/components/ui/use-toast";

interface IndicationCount {
  events: number;
  leads: number;
}

interface IndicationStats {
  clicks: number;
  leads: number;
  conversionRate: number;
  period: string;
}

interface Indication {
  id: string;
  slug: string;
  name?: string;
  createdAt: string;
  _count?: IndicationCount;
  stats?: IndicationStats;
}

export default function IndicationsPage() {
  const { data: session } = useSession();
  const [newIndication, setNewIndication] = useState('');
  const [generatedSlug, setGeneratedSlug] = useState('');
  const [indications, setIndications] = useState<Indication[]>([]);
  const [baseUrl, setBaseUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userSlug, setUserSlug] = useState('');
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [dashboardData, setDashboardData] = useState<{ 
    totalLeads: number;
    totalIndications: number;
    totalClicks: number;
  } | null>(null);

  useEffect(() => {
    // Marcador de renderização client-side para evitar problemas de hidratação
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
    
    if (session?.user?.id) {
      fetchIndications();
      fetchUserProfile();
      fetchDashboardData();
    }
  }, [session, isClient]);

  const fetchUserProfile = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/users/profile?userId=${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.slug) {
          setUserSlug(data.slug);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
    }
  };

  const fetchIndications = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/indications?withStats=true`);
      if (response.ok) {
        const data = await response.json();
        setIndications(data);
        
        // Não calcular totais aqui, já que usamos os dados do dashboard
      }
    } catch (error) {
      console.error('Erro ao buscar indicações:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        // Atualizar os totais a partir do dashboard
        setTotalLeads(data.totalLeads || 0);
        setTotalClicks(data.totalClicks || 0);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    }
  };

  const handleGenerateSlug = async () => {
    if (!newIndication.trim() || !session?.user?.id) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/slugify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          name: newIndication
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setGeneratedSlug(data.slug);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível gerar o slug",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao gerar slug:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateIndication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIndication.trim() || !session?.user?.id) return;
    
    setIsLoading(true);
    try {
      // Se não gerou slug ainda, precisamos gerar
      let slug = generatedSlug;
      if (!slug) {
        const response = await fetch('/api/slugify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: session.user.id,
            name: newIndication
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          slug = data.slug;
        } else {
          throw new Error('Não foi possível gerar o slug');
        }
      }
      
      // Criar a indicação
      const response = await fetch('/api/indications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          slug,
          name: newIndication
        })
      });
      
      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Link de indicação criado com sucesso",
        });
        setNewIndication('');
        setGeneratedSlug('');
        fetchIndications();
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível criar a indicação",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao criar indicação:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar a indicação",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (isClient && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast({
        title: "Link copiado",
        description: "Link copiado para a área de transferência",
      });
    }
  };

  const shareOnWhatsApp = (link: string) => {
    // Adicionar UTMs ao compartilhar via WhatsApp para rastreamento
    const linkWithUtm = `${link}?utm_source=whatsapp&utm_medium=share&utm_campaign=indication`;
    // Garantir que só execute no cliente
    if (isClient && typeof window !== 'undefined') {
      window.open(`https://wa.me/?text=Olha esse link: ${encodeURIComponent(linkWithUtm)}`, '_blank');
    }
  };

  // Não renderizar nada no servidor para evitar erros de hidratação
  if (!isClient) {
    return null;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-light text-white">Indicações</h1>
          <p className="text-blue-100/80">Gerencie seus links personalizados</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 items-end mt-2 md:mt-0">
          {/* Link direto do médico */}
          <div className="flex items-center gap-2 bg-blue-600/20 backdrop-blur-sm px-3 py-2 rounded-md border border-blue-500/30">
            <span className="text-sm text-blue-100">Seu link:</span>
            <code className="text-blue-200 font-medium text-sm">{`${baseUrl}/${userSlug}`}</code>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-blue-600/30 text-blue-200"
              onClick={() => copyToClipboard(`${baseUrl}/${userSlug}`)}
            >
              <ClipboardIcon className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            onClick={() => fetchIndications()} 
            variant="ghost"
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-blue-600/30 text-blue-200"
            title="Atualizar dados"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white/10 backdrop-blur-sm border-l-4 border-blue-300 border-t border-r border-b border-white/30 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-white">
              <LinkIcon className="h-5 w-5 mr-2 text-blue-300" />
              Links Ativos
            </CardTitle>
            <CardDescription className="text-blue-100/80">
              Total de links criados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-4xl font-semibold text-white">
                {indications.length}
              </p>
              <Badge variant="outline" className="bg-blue-500/20 text-blue-100 border-blue-300/50">
                Ativos
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-l-4 border-white/50 border-t border-r border-b border-white/30 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-white">
              <UserIcon className="h-5 w-5 mr-2 text-white/70" />
              Leads Totais
            </CardTitle>
            <CardDescription className="text-blue-100/80">
              Total de conversões
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-4xl font-semibold text-white">
                {totalLeads}
              </p>
              <Badge variant="outline" className="bg-white/20 text-white border-white/40">
                Total
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-l-4 border-blue-200 border-t border-r border-b border-white/30 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-white">
              <ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-blue-200" />
              Cliques
            </CardTitle>
            <CardDescription className="text-blue-100/80">
              Total de acessos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-4xl font-semibold text-white">
                {totalClicks}
              </p>
              <p className="text-xs text-blue-100/80">
                {totalLeads > 0 ? `${Math.round((totalLeads / totalClicks) * 100)}% conv.` : '0% conv.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Criar novo link */}
      <Card className="bg-white/10 backdrop-blur-sm border border-white/30 shadow-md mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-white">Criar novo link</CardTitle>
          <CardDescription className="text-blue-100/80">
            Gere um novo link de indicação personalizado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateIndication} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-blue-100">Nome da indicação</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  value={newIndication}
                  onChange={(e) => setNewIndication(e.target.value)}
                  placeholder="Ex: Instagram, WhatsApp, Facebook..."
                  className="flex-1 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white placeholder:text-white/60 focus:ring-2 focus:ring-white/50 focus:border-transparent"
                />
                <Button
                  type="button"
                  onClick={handleGenerateSlug}
                  disabled={!newIndication.trim() || isGenerating}
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 hover:bg-blue-600/30 text-blue-100"
                  title="Gerar Link"
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {generatedSlug && (
              <div className="p-3 bg-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-md">
                <p className="text-sm text-blue-100 mb-2">Link gerado:</p>
                <div className="flex items-center gap-2 text-sm">
                  <code className="flex-1 bg-blue-700/30 px-2 py-1 rounded border border-blue-500/30 text-blue-100">
                    {`${baseUrl}/${userSlug}/${generatedSlug}`}
                  </code>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(`${baseUrl}/${userSlug}/${generatedSlug}`)}
                    className="h-8 w-8 p-0 hover:bg-blue-600/30 text-blue-200"
                  >
                    <ClipboardIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="pt-4">
              <Button
                type="submit"
                disabled={!newIndication.trim() || isLoading}
                className="w-full h-10 bg-white text-blue-700 hover:bg-white/90 transition-all border-none shadow-lg disabled:opacity-50"
              >
                {isLoading ? 'Criando...' : 'Criar Link de Indicação'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Links */}
      <div className="space-y-4 mt-8">
        {indications.map((indication) => (
          <Card key={indication.id} className="bg-white/10 backdrop-blur-sm border border-white/30 shadow-md">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-white mb-1 truncate">
                    {indication.name || indication.slug}
                  </h3>
                  <div className="flex items-center gap-2 bg-blue-600/20 px-3 py-2 rounded border border-blue-500/30">
                    <code className="text-blue-100 text-sm truncate">
                      {`${baseUrl}/${userSlug}/${indication.slug}`}
                    </code>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex items-center gap-2 text-sm text-blue-100/80">
                    <UserIcon className="h-4 w-4" />
                    <span>
                      {indication.stats 
                        ? indication.stats.leads 
                        : (indication._count && indication._count.leads !== undefined 
                          ? indication._count.leads 
                          : 0)} leads
                    </span>
                    <ArrowTrendingUpIcon className="h-4 w-4 ml-2" />
                    <span>
                      {indication.stats 
                        ? indication.stats.clicks 
                        : (indication._count && indication._count.events !== undefined 
                          ? indication._count.events 
                          : 0)} cliques
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 hover:bg-blue-600/30 text-blue-200"
                      onClick={() => copyToClipboard(`${baseUrl}/${userSlug}/${indication.slug}`)}
                    >
                      <ClipboardIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 hover:bg-green-600/30 text-green-200"
                      onClick={() => shareOnWhatsApp(`${baseUrl}/${userSlug}/${indication.slug}`)}
                    >
                      <ShareIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 