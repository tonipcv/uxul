'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  PlusIcon, 
  PencilIcon, 
  ClipboardIcon, 
  Share2Icon,
  MessageCircleIcon,
  Trash2Icon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Chatbot {
  id: string;
  name: string;
  isPublished: boolean;
  createdAt: string;
  indicationId: string;
  indicationSlug: string;
}

export default function ChatbotsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chatbotToDelete, setChatbotToDelete] = useState<Chatbot | null>(null);
  const [chatbotName, setChatbotName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userSlug, setUserSlug] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [currentTab, setCurrentTab] = useState("grid");
  
  // Obter chatbots do usuário
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const fetchChatbots = async () => {
      try {
        const response = await fetch('/api/chatbot-flows');
        if (!response.ok) throw new Error('Falha ao buscar chatbots');
        
        const data = await response.json();
        setChatbots(data);
      } catch (error) {
        console.error('Erro ao buscar chatbots:', error);
        toast.error('Não foi possível carregar os chatbots');
      }
    };
    
    const fetchUserSlug = async () => {
      try {
        setIsLoadingUser(true);
        const response = await fetch('/api/users/profile');
        if (!response.ok) throw new Error('Falha ao buscar informações do usuário');
        
        const data = await response.json();
        setUserSlug(data.slug);
      } catch (error) {
        console.error('Erro ao buscar slug do usuário:', error);
        toast.error('Erro ao carregar informações do usuário');
      } finally {
        setIsLoadingUser(false);
      }
    };
    
    fetchChatbots();
    fetchUserSlug();
  }, [session]);
  
  // Copiar link para o clipboard
  const copyToClipboard = (link: string) => {
    navigator.clipboard.writeText(link).then(() => {
      toast.success('Link copiado para a área de transferência');
    }).catch(() => {
      toast.error('Não foi possível copiar o link');
    });
  };
  
  // Compartilhar via WhatsApp
  const shareOnWhatsApp = (link: string) => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(link)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  // Criar novo chatbot
  const handleCreateChatbot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatbotName.trim()) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chatbot-flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: chatbotName })
      });
      
      if (!response.ok) throw new Error('Falha ao criar chatbot');
      
      const newChatbot = await response.json();
      
      // Criar a indicação associada ao chatbot
      const indicationResponse = await fetch('/api/indications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: chatbotName,
          type: 'chatbot',
          chatbotFlowId: newChatbot.id
        })
      });
      
      if (!indicationResponse.ok) throw new Error('Falha ao criar indicação para o chatbot');
      
      const indicationData = await indicationResponse.json();
      
      // Atualizar a lista de chatbots
      setChatbots(prev => [...prev, {
        ...newChatbot,
        indicationId: indicationData.id,
        indicationSlug: indicationData.slug
      }]);
      
      // Limpar o formulário e fechar o modal
      setChatbotName('');
      setShowCreateModal(false);
      toast.success('Chatbot criado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao criar chatbot:', error);
      toast.error('Não foi possível criar o chatbot');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para deletar um chatbot
  const handleDeleteChatbot = async () => {
    if (!chatbotToDelete) return;
    
    setIsDeleting(true);
    
    try {
      // Deletar o chatbot
      const response = await fetch(`/api/chatbot-flows/${chatbotToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Falha ao excluir chatbot');
      
      // Atualizar a lista de chatbots (remover o deletado)
      setChatbots(prev => prev.filter(chatbot => chatbot.id !== chatbotToDelete.id));
      
      // Fechar o modal de confirmação
      setShowDeleteModal(false);
      setChatbotToDelete(null);
      toast.success('Chatbot excluído com sucesso!');
      
    } catch (error) {
      console.error('Erro ao excluir chatbot:', error);
      toast.error('Não foi possível excluir o chatbot');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Abrir modal de confirmação de exclusão
  const confirmDelete = (chatbot: Chatbot) => {
    setChatbotToDelete(chatbot);
    setShowDeleteModal(true);
  };
  
  // Base URL para links
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin // Isso retorna por exemplo "http://localhost:3000" sem barra no final
    : '';
  
  // Renderizar link do chatbot
  const renderChatbotLink = (chatbot: Chatbot) => {
    if (isLoadingUser) {
      return (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-400">Carregando link...</span>
        </div>
      );
    }

    if (!userSlug) {
      return (
        <div className="text-red-500 text-xs">
          Erro ao carregar link
        </div>
      );
    }

    return (
      <div className="text-xs text-gray-500 break-all">
        {baseUrl}/{userSlug}/{chatbot.indicationSlug}
      </div>
    );
  };
  
  return (
    <div className="min-h-[100dvh] bg-gray-100 pt-20 pb-24 md:pt-12 md:pb-16 px-2 sm:px-4">
      <div className="container mx-auto px-0 sm:pl-4 md:pl-8 lg:pl-16 max-w-full sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-[-0.03em] font-inter">Chatbots</h1>
            <p className="text-xs md:text-sm text-gray-600 tracking-[-0.03em] font-inter">Gerencie seus assistentes virtuais</p>
          </div>
          <div className="w-full md:w-auto mt-2 md:mt-0">
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="w-full md:w-auto bg-blue-600 border-0 shadow-[0_4px_12px_rgba(59,130,246,0.3)] hover:shadow-[0_8px_24px_rgba(59,130,246,0.4)] transition-all duration-300 rounded-2xl text-white hover:bg-blue-700 text-xs"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Novo Chatbot
            </Button>
          </div>
        </div>
        
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <div className="flex justify-start mb-4">
            <TabsList className="bg-gray-200/60 p-1">
              <TabsTrigger value="grid" className="text-xs">
                Cards
              </TabsTrigger>
              <TabsTrigger value="table" className="text-xs">
                Tabela
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="grid" className="mt-0">
            {chatbots.length === 0 ? (
              <Card className="bg-white border-0 shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <MessageCircleIcon className="h-12 w-12 text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhum chatbot encontrado</h3>
                  <p className="text-gray-500 mb-4">Crie seu primeiro chatbot para iniciar conversas automatizadas com seus pacientes.</p>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Criar Chatbot
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {chatbots.map((chatbot) => (
                  <div key={chatbot.id} className="bg-white p-3 rounded-xl shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-gray-800">{chatbot.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Criado em {new Date(chatbot.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant={chatbot.isPublished ? "default" : "secondary"} className={`text-xs ${chatbot.isPublished ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}`}>
                        {chatbot.isPublished ? "Publicado" : "Rascunho"}
                      </Badge>
                    </div>
                    
                    {renderChatbotLink(chatbot)}
                    
                    <div className="flex justify-between gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white border-sky-500 text-sky-700 hover:bg-sky-100 hover:border-sky-600 hover:text-sky-800 transition-colors text-xs h-7 px-2 flex-1 font-medium"
                        onClick={() => copyToClipboard(`${baseUrl}/${userSlug}/${chatbot.indicationSlug}`)}
                        disabled={isLoadingUser || !userSlug}
                      >
                        {isLoadingUser ? (
                          <div className="h-3 w-3 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mr-1"></div>
                        ) : (
                          <ClipboardIcon className="h-3 w-3 mr-1" />
                        )}
                        Copiar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white border-sky-500 text-sky-700 hover:bg-sky-100 hover:border-sky-600 hover:text-sky-800 transition-colors text-xs h-7 px-2 flex-1 font-medium"
                        onClick={() => shareOnWhatsApp(`${baseUrl}/${userSlug}/${chatbot.indicationSlug}`)}
                        disabled={isLoadingUser || !userSlug}
                      >
                        {isLoadingUser ? (
                          <div className="h-3 w-3 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mr-1"></div>
                        ) : (
                          <Share2Icon className="h-3 w-3 mr-1" />
                        )}
                        Compartilhar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white border-yellow-500 text-yellow-800 hover:bg-yellow-100 hover:border-yellow-600 hover:text-yellow-900 transition-colors text-xs h-7 px-2 font-medium"
                        onClick={() => router.push(`/dashboard/chatbot-editor/${chatbot.id}`)}
                      >
                        <PencilIcon className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white border-red-500 text-red-700 hover:bg-red-100 hover:border-red-600 hover:text-red-800 transition-colors text-xs h-7 px-2 font-medium"
                        onClick={() => confirmDelete(chatbot)}
                      >
                        <Trash2Icon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="table" className="mt-0">
            <Card className="bg-white border-0 shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                {chatbots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <MessageCircleIcon className="h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhum chatbot encontrado</h3>
                    <p className="text-gray-500 mb-4">Crie seu primeiro chatbot para iniciar conversas automatizadas com seus pacientes.</p>
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Criar Chatbot
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left py-3 px-3 text-xs font-medium text-gray-600">Nome</th>
                          <th className="text-left py-3 px-3 text-xs font-medium text-gray-600">Status</th>
                          <th className="text-left py-3 px-3 text-xs font-medium text-gray-600">Link</th>
                          <th className="text-left py-3 px-3 text-xs font-medium text-gray-600">Criado em</th>
                          <th className="text-right py-3 px-3 text-xs font-medium text-gray-600">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {chatbots.map((chatbot) => (
                          <tr key={chatbot.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-2 px-3 text-sm text-gray-900">{chatbot.name}</td>
                            <td className="py-2 px-3">
                              <Badge variant={chatbot.isPublished ? "default" : "secondary"} className={`text-xs ${chatbot.isPublished ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}`}>
                                {chatbot.isPublished ? "Publicado" : "Rascunho"}
                              </Badge>
                            </td>
                            <td className="py-2 px-3 text-xs text-gray-500 break-all">
                              {renderChatbotLink(chatbot)}
                            </td>
                            <td className="py-2 px-3 text-xs text-gray-500">
                              {new Date(chatbot.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-white border-sky-500 text-sky-700 hover:bg-sky-100 hover:border-sky-600 hover:text-sky-800 transition-colors text-xs h-7 px-2 font-medium"
                                  onClick={() => copyToClipboard(`${baseUrl}/${userSlug}/${chatbot.indicationSlug}`)}
                                  disabled={isLoadingUser || !userSlug}
                                >
                                  {isLoadingUser ? (
                                    <div className="h-3 w-3 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mr-1"></div>
                                  ) : (
                                    <ClipboardIcon className="h-3 w-3 mr-1" />
                                  )}
                                  Copiar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-white border-sky-500 text-sky-700 hover:bg-sky-100 hover:border-sky-600 hover:text-sky-800 transition-colors text-xs h-7 px-2 font-medium"
                                  onClick={() => shareOnWhatsApp(`${baseUrl}/${userSlug}/${chatbot.indicationSlug}`)}
                                  disabled={isLoadingUser || !userSlug}
                                >
                                  {isLoadingUser ? (
                                    <div className="h-3 w-3 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mr-1"></div>
                                  ) : (
                                    <Share2Icon className="h-3 w-3 mr-1" />
                                  )}
                                  Compartilhar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-white border-yellow-500 text-yellow-800 hover:bg-yellow-100 hover:border-yellow-600 hover:text-yellow-900 transition-colors text-xs h-7 px-2 font-medium"
                                  onClick={() => router.push(`/dashboard/chatbot-editor/${chatbot.id}`)}
                                >
                                  <PencilIcon className="h-3 w-3 mr-1" />
                                  Editar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-white border-red-500 text-red-700 hover:bg-red-100 hover:border-red-600 hover:text-red-800 transition-colors text-xs h-7 px-2 font-medium"
                                  onClick={() => confirmDelete(chatbot)}
                                >
                                  <Trash2Icon className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Modal para criar novo chatbot */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Criar Novo Chatbot</DialogTitle>
              <DialogDescription>
                Crie um assistente virtual para interagir com seus pacientes.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateChatbot}>
              <div className="space-y-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="chatbotName">Nome do Chatbot</Label>
                  <Input
                    id="chatbotName"
                    type="text"
                    value={chatbotName}
                    onChange={(e) => setChatbotName(e.target.value)}
                    placeholder="Ex: Assistente Virtual Dr. Silva"
                    required
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={isLoading || !chatbotName.trim()}
                >
                  {isLoading ? "Criando..." : "Criar Chatbot"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Modal de confirmação de exclusão */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Excluir Chatbot</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o chatbot <span className="font-medium">{chatbotToDelete?.name}</span>? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button 
                type="button"
                variant="destructive"
                onClick={handleDeleteChatbot}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Excluindo...
                  </>
                ) : "Excluir"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 