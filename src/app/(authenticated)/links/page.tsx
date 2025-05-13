'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PlusCircle, Link as LinkIcon, ExternalLink, Instagram, Youtube, Facebook, Linkedin, Twitter, Trash2 } from 'lucide-react';

// Get the base URL from environment variable, fallback to localhost if not available
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface PageBlock {
  id: string;
  type: 'BUTTON' | 'FORM';
  content: any;
  order: number;
}

interface SocialLink {
  id: string;
  platform: 'INSTAGRAM' | 'WHATSAPP' | 'YOUTUBE' | 'FACEBOOK' | 'LINKEDIN' | 'TIKTOK' | 'TWITTER';
  username: string;
  url: string;
}

interface Page {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  avatarUrl?: string;
  primaryColor: string;
  layout: string;
  blocks: PageBlock[];
  socialLinks: SocialLink[];
}

interface User {
  id: string;
  name: string;
  slug: string;
}

export default function LinksPage() {
  const { data: session } = useSession();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [pageToDelete, setPageToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newPage, setNewPage] = useState({
    title: '',
    subtitle: '',
    slug: '',
    layout: 'classic',
    primaryColor: '#0070df',
    avatarUrl: '',
    isModal: false,
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchPages();
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/users/profile?userId=${session?.user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchPages = async () => {
    try {
      const response = await fetch('/api/pages');
      if (!response.ok) {
        throw new Error('Failed to fetch pages');
      }
      const data = await response.json();
      
      // Ensure data is an array
      const pagesArray = Array.isArray(data) ? data : [];
      setPages(pagesArray);
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast.error('Erro ao carregar as páginas');
      setPages([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = async () => {
    if (!newPage.title.trim()) {
      toast.error('Por favor, insira um título para a página');
      return;
    }

    setIsCreating(true);
    try {
      console.log('Creating page with data:', newPage);
      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPage),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.error || 'Erro ao criar página');
      }

      const createdPage = await response.json();
      console.log('Page created successfully:', createdPage);
      setPages([...pages, createdPage]);
      toast.success('Página criada com sucesso');
      setIsCreateModalOpen(false);
      setNewPage({
        title: '',
        subtitle: '',
        slug: '',
        layout: 'classic',
        primaryColor: '#0070df',
        avatarUrl: '',
        isModal: false,
      });
    } catch (error) {
      console.error('Error creating page:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar página');
    } finally {
      setIsCreating(false);
    }
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  };

  const handleDeletePage = async () => {
    if (!pageToDelete) return;
    
    setIsDeleting(true);
    try {
      console.log('Iniciando deleção da página:', pageToDelete.id);
      
      const response = await fetch(`/api/pages/${pageToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Status da resposta:', response.status);
      
      const data = await response.json();
      console.log('Resposta da API:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao excluir a página');
      }

      setPages(pages.filter(page => page.id !== pageToDelete.id));
      toast.success('Página excluída com sucesso');
    } catch (error) {
      console.error('Erro detalhado ao excluir página:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir a página');
    } finally {
      setIsDeleting(false);
      setPageToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-gray-100 pt-20 pb-24 md:pt-12 md:pb-16 px-4">
        <div className="container mx-auto pl-1 sm:pl-4 md:pl-8 lg:pl-16 max-w-[98%] sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse mt-4 md:mt-0" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader>
                  <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-100 pt-20 pb-24 md:pt-12 md:pb-16 px-2 sm:px-4">
      <div className="container mx-auto px-0 sm:pl-4 md:pl-8 lg:pl-16 max-w-full sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-[-0.03em] font-inter">Minhas Páginas</h2>
            <p className="text-xs md:text-sm text-gray-600 tracking-[-0.03em] font-inter">
              Crie e gerencie suas páginas de links personalizadas
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="h-9 bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg-gray-800/10 text-xs"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Nova Página
          </Button>
        </div>

        {pages.length === 0 ? (
          <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Nenhuma página criada</CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Comece criando sua primeira página de links personalizada
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="h-9 bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg-gray-800/10 text-xs"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Criar Página
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pages.map((page) => (
              <Card key={page.id} className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
                <CardHeader className="pb-2 sm:pb-1 pt-4 sm:pt-3 px-6 sm:px-4">
                  <CardTitle className="text-base sm:text-sm md:text-base font-bold text-gray-900 tracking-[-0.03em] font-inter">{page.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1 text-sm sm:text-xs text-gray-500 tracking-[-0.03em] font-inter">
                    <LinkIcon className="h-4 w-4" />
                    {`${baseUrl}/${user?.slug || ''}/${page.slug}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-4 sm:pb-3 px-6 sm:px-4">
                  <div className="flex flex-col gap-2">
                    <div className="text-sm sm:text-xs text-gray-500 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400/60" />
                      {page.blocks.length} {page.blocks.length === 1 ? 'bloco' : 'blocos'}
                    </div>
                    <div className="text-sm sm:text-xs text-gray-500 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400/60" />
                      {page.socialLinks.length} {page.socialLinks.length === 1 ? 'rede social' : 'redes sociais'}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    >
                      <a
                        href={`${baseUrl}/${user?.slug || ''}/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setPageToDelete({ id: page.id, title: page.title })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      asChild
                      size="sm"
                      className="h-8 bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-xl text-gray-700 hover:bg-gray-800/10 text-xs"
                    >
                      <a href={`/links/${page.id}/edit`}>Editar</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Sheet open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <SheetContent className="w-full sm:max-w-[500px] overflow-y-auto">
            <div className="space-y-4">
              <SheetHeader>
                <SheetTitle>Nova Página</SheetTitle>
                <SheetDescription>
                  Crie uma nova página de links personalizada. Apenas o título é obrigatório, os demais campos são opcionais.
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Título da Página <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={newPage.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setNewPage({
                        ...newPage,
                        title,
                        // Atualiza o slug automaticamente apenas se estiver vazio
                        slug: newPage.slug ? newPage.slug : generateSlug(title)
                      });
                    }}
                    placeholder="Ex: Meus Links"
                  />
                  <p className="text-xs text-gray-500">
                    Este será o título principal da sua página
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Caminho da Página</Label>
                  <div className="flex gap-2">
                    <Input
                      id="slug"
                      value={newPage.slug}
                      onChange={(e) => setNewPage({ ...newPage, slug: generateSlug(e.target.value) })}
                      placeholder="meus-links"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => setNewPage({ ...newPage, slug: generateSlug(newPage.title) })}
                      type="button"
                    >
                      Gerar
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Este será o caminho da sua página: localhost:3000/{user?.slug || 'seu-usuario'}/<strong>{newPage.slug || 'caminho-da-pagina'}</strong>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtítulo</Label>
                  <Input
                    id="subtitle"
                    value={newPage.subtitle}
                    onChange={(e) => setNewPage({ ...newPage, subtitle: e.target.value })}
                    placeholder="Ex: Links e contatos profissionais"
                  />
                  <p className="text-xs text-gray-500">
                    Uma breve descrição que aparecerá abaixo do título
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatarUrl">URL do Avatar</Label>
                  <Input
                    id="avatarUrl"
                    value={newPage.avatarUrl}
                    onChange={(e) => setNewPage({ ...newPage, avatarUrl: e.target.value })}
                    placeholder="https://exemplo.com/sua-foto.jpg"
                  />
                  <p className="text-xs text-gray-500">
                    Link para a imagem que será exibida no topo da página
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Cor Principal</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      value={newPage.primaryColor}
                      onChange={(e) => setNewPage({ ...newPage, primaryColor: e.target.value })}
                      placeholder="#0070df"
                    />
                    <input
                      type="color"
                      value={newPage.primaryColor}
                      onChange={(e) => setNewPage({ ...newPage, primaryColor: e.target.value })}
                      className="h-10 w-10"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Cor que será usada nos botões e elementos principais
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="layout">Layout</Label>
                  <select
                    id="layout"
                    value={newPage.layout}
                    onChange={(e) => setNewPage({ ...newPage, layout: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="classic">Clássico</option>
                    <option value="modern">Moderno</option>
                    <option value="minimal">Minimalista</option>
                    <option value="collor">Collor</option>
                  </select>
                  <p className="text-xs text-gray-500">
                    Escolha o estilo visual da sua página
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isModal"
                    checked={newPage.isModal}
                    onChange={(e) => setNewPage({ ...newPage, isModal: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isModal">Ativar modo modal</Label>
                  <p className="text-xs text-gray-500 ml-2">
                    Quando ativado, a página será exibida em um modal ao invés de uma página completa
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewPage({
                      title: '',
                      subtitle: '',
                      slug: '',
                      layout: 'classic',
                      primaryColor: '#0070df',
                      avatarUrl: '',
                      isModal: false,
                    });
                  }}
                  disabled={isCreating}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreatePage}
                  disabled={isCreating || !newPage.title.trim()}
                  className="bg-[#0070df] hover:bg-[#0070df]/90"
                >
                  {isCreating ? 'Criando...' : 'Criar Página'}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Single confirmation dialog */}
        <AlertDialog open={!!pageToDelete} onOpenChange={(open) => !open && setPageToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir página?</AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a excluir a página "{pageToDelete?.title}".
                Esta ação não pode ser desfeita e todos os links e dados associados serão perdidos permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPageToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDeletePage}
                disabled={isDeleting}
              >
                {isDeleting ? 'Excluindo...' : 'Sim, excluir página'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
} 