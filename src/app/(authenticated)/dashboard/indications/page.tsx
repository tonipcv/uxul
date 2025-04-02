'use client';

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  PlusIcon, 
  ClipboardIcon, 
  QrCodeIcon,
  ShareIcon,
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
      <div className="mb-8">
        <h1 className="text-2xl font-light">Indicações</h1>
        <p className="text-zinc-400">Gerencie seus links de indicação</p>
      </div>

      {/* Link base do médico */}
      <div className="mb-8">
        <Card className="bg-black/20 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg font-light">Seu Link Principal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="bg-white/5 rounded-md px-4 py-2 text-zinc-200 flex-grow">
                med1.app/{userSlug || '...'}
              </div>
              <div className="flex gap-2">
                <Button
                  className="bg-white/5 hover:bg-white/10 border border-white/10"
                  size="sm"
                  onClick={() => copyToClipboard(`https://med1.app/${userSlug}?utm_source=clipboard&utm_medium=dashboard&utm_campaign=indication`)}
                >
                  <ClipboardIcon className="h-4 w-4 mr-1" />
                  Copiar
                </Button>
                <Button
                  className="bg-white/5 hover:bg-white/10 border border-white/10"
                  size="sm"
                  onClick={() => shareOnWhatsApp(`https://med1.app/${userSlug}`)}
                >
                  <ShareIcon className="h-4 w-4 mr-1" />
                  WhatsApp
                </Button>
                <Button
                  className="bg-white/5 hover:bg-white/10 border border-white/10"
                  size="sm"
                >
                  <QrCodeIcon className="h-4 w-4 mr-1" />
                  QR Code
                </Button>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Este é seu link principal. Use-o na sua bio do Instagram ou redes sociais.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de indicações */}
        <div className="lg:col-span-2">
          <Card className="bg-black/20 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg font-light">Links de Indicação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {indications.length === 0 ? (
                  <p className="text-zinc-400">Nenhum link criado ainda.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-zinc-500 text-sm border-b border-white/10">
                          <th className="pb-2">Indicador</th>
                          <th className="pb-2">Link</th>
                          <th className="pb-2 text-center">Cliques</th>
                          <th className="pb-2 text-center">Leads</th>
                          <th className="pb-2 text-center">Conversão</th>
                          <th className="pb-2 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {indications.map((indication) => (
                          <tr key={indication.id} className="border-b border-white/5">
                            <td className="py-3 text-zinc-300">{indication.name || indication.slug}</td>
                            <td className="py-3 text-zinc-400 text-sm">
                              med1.app/{userSlug}/{indication.slug}
                            </td>
                            <td className="py-3 text-center">{indication._count.events}</td>
                            <td className="py-3 text-center">{indication._count.leads}</td>
                            <td className="py-3 text-center">
                              {indication._count.events > 0 
                                ? `${Math.round((indication._count.leads / indication._count.events) * 100)}%` 
                                : '0%'}
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 bg-white/5 hover:bg-white/10 border border-white/10"
                                  onClick={() => copyToClipboard(`https://med1.app/${userSlug}/${indication.slug}?utm_source=clipboard&utm_medium=dashboard&utm_campaign=indication`)}
                                >
                                  <ClipboardIcon className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 bg-white/5 hover:bg-white/10 border border-white/10"
                                  onClick={() => shareOnWhatsApp(`https://med1.app/${userSlug}/${indication.slug}`)}
                                >
                                  <ShareIcon className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Criar nova indicação */}
        <div>
          <Card className="bg-black/20 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg font-light">Novo Link</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateIndication} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="indication">Nome do Paciente</Label>
                  <Input
                    id="indication"
                    placeholder="Ex: Maria Silva"
                    value={newIndication}
                    onChange={(e) => setNewIndication(e.target.value)}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                
                {generatedSlug && (
                  <div className="p-3 bg-white/5 rounded-md border border-white/10">
                    <p className="text-xs text-zinc-500 mb-1">Link gerado:</p>
                    <p className="text-zinc-300 break-all">
                      med1.app/{userSlug}/{generatedSlug}
                    </p>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    type="button"
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 text-white"
                    onClick={handleGenerateSlug}
                    disabled={isGenerating || !newIndication.trim()}
                  >
                    {isGenerating ? "Gerando..." : "Gerar Slug"}
                  </Button>
                  
                  <Button 
                    type="submit"
                    className="flex-1 relative group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 text-white"
                    disabled={isLoading || !newIndication.trim()}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    {isLoading ? "Criando..." : "Criar Link"}
                  </Button>
                </div>
                
                {generatedSlug && (
                  <div className="flex gap-2">
                    <Button 
                      type="button"
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10"
                      onClick={() => copyToClipboard(`https://med1.app/${userSlug}/${generatedSlug}?utm_source=clipboard&utm_medium=dashboard&utm_campaign=indication`)}
                    >
                      <ClipboardIcon className="h-4 w-4 mr-2" />
                      Copiar
                    </Button>
                    
                    <Button 
                      type="button"
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10"
                      onClick={() => shareOnWhatsApp(`https://med1.app/${userSlug}/${generatedSlug}`)}
                    >
                      <ShareIcon className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 