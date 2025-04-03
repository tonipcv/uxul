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

interface Indication {
  id: string;
  slug: string;
  name?: string;
  createdAt: string;
  _count: IndicationCount;
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

  useEffect(() => {
    setBaseUrl(window.location.origin);
    
    if (session?.user?.id) {
      fetchIndications();
      fetchUserProfile();
    }
  }, [session]);

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
      const response = await fetch(`/api/indications?userId=${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        setIndications(data);
        
        // Calcular totais
        let leads = 0;
        let clicks = 0;
        data.forEach((ind: Indication) => {
          leads += ind._count.leads;
          clicks += ind._count.events;
        });
        setTotalLeads(leads);
        setTotalClicks(clicks);
      }
    } catch (error) {
      console.error('Erro ao buscar indicações:', error);
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
    navigator.clipboard.writeText(text);
    toast({
      title: "Link copiado",
      description: "Link copiado para a área de transferência",
    });
  };

  const shareOnWhatsApp = (link: string) => {
    // Adicionar UTMs ao compartilhar via WhatsApp para rastreamento
    const linkWithUtm = `${link}?utm_source=whatsapp&utm_medium=share&utm_campaign=indication`;
    window.open(`https://wa.me/?text=Olha esse link: ${encodeURIComponent(linkWithUtm)}`, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-light text-gray-800">Indicações</h1>
          <p className="text-gray-500">Gerencie seus links personalizados</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3 items-end mt-2 md:mt-0">
          {/* Link direto do médico */}
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-md border border-blue-200">
            <span className="text-sm text-gray-600">Seu link:</span>
            <code className="text-blue-700 font-medium text-sm">{`${baseUrl}/${userSlug}`}</code>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-blue-100"
              onClick={() => copyToClipboard(`${baseUrl}/${userSlug}`)}
            >
              <ClipboardIcon className="h-4 w-4 text-blue-600" />
            </Button>
          </div>
          <Button 
            onClick={() => fetchIndications()} 
            variant="ghost"
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-blue-100"
            title="Atualizar dados"
          >
            <ArrowPathIcon className="h-4 w-4 text-blue-600" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white border-l-4 border-blue-700 border-t border-r border-b border-gray-200 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-gray-800">
              <LinkIcon className="h-5 w-5 mr-2 text-blue-700" />
              Links Ativos
            </CardTitle>
            <CardDescription className="text-gray-600">
              Total de links criados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-4xl font-semibold text-blue-700">
                {indications.length}
              </p>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Ativos
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-gray-400 border-t border-r border-b border-gray-200 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-gray-800">
              <UserIcon className="h-5 w-5 mr-2 text-gray-500" />
              Leads Totais
            </CardTitle>
            <CardDescription className="text-gray-600">
              Total de conversões
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-4xl font-semibold text-gray-600">
                {totalLeads}
              </p>
              <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
                Total
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-blue-400 border-t border-r border-b border-gray-200 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center text-gray-800">
              <ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-blue-500" />
              Cliques
            </CardTitle>
            <CardDescription className="text-gray-600">
              Total de acessos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <p className="text-4xl font-semibold text-blue-500">
                {totalClicks}
              </p>
              <p className="text-xs text-gray-600">
                {totalLeads > 0 ? `${Math.round((totalLeads / totalClicks) * 100)}% conv.` : '0% conv.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Criar novo link */}
      <Card className="bg-white border border-gray-200 shadow-sm mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-800">Criar novo link</CardTitle>
          <CardDescription className="text-gray-500">
            Gere um novo link de indicação personalizado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateIndication} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-gray-600">Nome da indicação</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  value={newIndication}
                  onChange={(e) => setNewIndication(e.target.value)}
                  placeholder="Ex: Instagram, WhatsApp, Facebook..."
                  className="flex-1 border-gray-200 focus:border-blue-700 focus:ring-blue-50 placeholder:text-gray-500"
                />
                <Button
                  type="button"
                  onClick={handleGenerateSlug}
                  disabled={!newIndication.trim() || isGenerating}
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 hover:bg-blue-100"
                  title="Gerar Link"
                >
                  <LinkIcon className="h-4 w-4 text-blue-600" />
                </Button>
              </div>
            </div>

            {generatedSlug && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-gray-600 mb-2">Link gerado:</p>
                <div className="flex items-center gap-2 text-sm">
                  <code className="flex-1 bg-white px-2 py-1 rounded border border-blue-200 text-blue-700">
                    {`${baseUrl}/${userSlug}/${generatedSlug}`}
                  </code>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(`${baseUrl}/${userSlug}/${generatedSlug}`)}
                    className="h-8 w-8 p-0 hover:bg-blue-100"
                  >
                    <ClipboardIcon className="h-4 w-4 text-blue-600" />
                  </Button>
                </div>
              </div>
            )}

            <div className="pt-4">
              <Button
                type="submit"
                disabled={!newIndication.trim() || isLoading}
                className="w-full h-10 bg-blue-700 hover:bg-blue-800 text-white transition-colors disabled:opacity-50"
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
          <Card key={indication.id} className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-800 mb-1 truncate">
                    {indication.name || indication.slug}
                  </h3>
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                    <code className="text-gray-600 text-sm truncate">
                      {`${baseUrl}/${userSlug}/${indication.slug}`}
                    </code>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <UserIcon className="h-4 w-4" />
                    <span>{indication._count.leads} leads</span>
                    <ArrowTrendingUpIcon className="h-4 w-4 ml-2" />
                    <span>{indication._count.events} cliques</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 hover:bg-blue-50"
                      onClick={() => copyToClipboard(`${baseUrl}/${userSlug}/${indication.slug}`)}
                    >
                      <ClipboardIcon className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 hover:bg-green-50"
                      onClick={() => shareOnWhatsApp(`${baseUrl}/${userSlug}/${indication.slug}`)}
                    >
                      <ShareIcon className="h-4 w-4 text-green-600" />
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