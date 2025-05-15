'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BlockEditor } from '@/components/BlockEditor';
import { SocialLinksEditor } from '@/components/SocialLinksEditor';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddressManager, Address } from '@/components/ui/address-manager';

interface Page {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  avatarUrl?: string;
  address?: string;
  primaryColor: string;
  layout: string;
  blocks: PageBlock[];
  socialLinks: SocialLink[];
  addresses?: Address[];
  user?: {
    slug: string;
  };
}

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

interface PageEditorProps {
  pageId: string;
}

export function PageEditor({ pageId }: PageEditorProps) {
  const router = useRouter();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPage();
  }, [pageId]);

  const fetchPage = async () => {
    try {
      const response = await fetch(`/api/pages/${pageId}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/links');
          return;
        }
        throw new Error('Failed to fetch page');
      }
      const data = await response.json();
      setPage(data);
    } catch (error) {
      console.error('Error fetching page:', error);
      toast.error('Error loading page');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!page) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(page),
      });

      if (!response.ok) throw new Error('Failed to save page');
      
      toast.success('Alterações salvas com sucesso');
      router.refresh();
    } catch (error) {
      console.error('Error saving page:', error);
      toast.error('Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Page, value: string) => {
    if (!page) return;
    setPage({ ...page, [field]: value });
  };

  const handleBlocksChange = async (newBlocks: PageBlock[]) => {
    if (!page) return;
    
    try {
      const response = await fetch(`/api/pages/${pageId}/blocks`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ blocks: newBlocks }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update blocks');
      }
      
      setPage(prevPage => ({
        ...prevPage!,
        blocks: newBlocks
      }));
    } catch (error) {
      console.error('Error updating blocks:', error);
      toast.error(error instanceof Error ? error.message : 'Error updating blocks');
      
      const pageResponse = await fetch(`/api/pages/${pageId}`);
      if (pageResponse.ok) {
        const updatedPage = await pageResponse.json();
        setPage(updatedPage);
      }
      throw error;
    }
  };

  const handleSocialLinksChange = async (newLinks: SocialLink[]) => {
    if (!page) return;
    
    try {
      setIsLoading(true);
      
      // Optimistically update the UI
      setPage(prevPage => ({
        ...prevPage!,
        socialLinks: newLinks
      }));

      const response = await fetch(`/api/pages/${pageId}/social-links`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ links: newLinks }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update social links');
      }
      
      const updatedPage = await response.json();
      setPage(prevPage => ({
        ...prevPage!,
        socialLinks: updatedPage.socialLinks
      }));
    } catch (error) {
      console.error('Error updating social links:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar redes sociais');
      
      // On error, fetch the entire page to ensure consistency
      try {
        const response = await fetch(`/api/pages/${pageId}`);
        if (response.ok) {
          const updatedPage = await response.json();
          setPage(updatedPage);
        }
      } catch (fetchError) {
        console.error('Error fetching page:', fetchError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressesChange = async (newAddresses: Address[]) => {
    if (!page) return;
    
    try {
      setIsLoading(true);
      
      // Optimistically update the UI
      setPage(prevPage => ({
        ...prevPage!,
        addresses: newAddresses
      }));

      const response = await fetch(`/api/pages/${pageId}/addresses`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addresses: newAddresses }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update addresses');
      }
      
      toast.success('Endereços atualizados com sucesso');
    } catch (error) {
      console.error('Error updating addresses:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar endereços');
      
      // On error, fetch the entire page to ensure consistency
      try {
        const response = await fetch(`/api/pages/${pageId}`);
        if (response.ok) {
          const updatedPage = await response.json();
          setPage(updatedPage);
        }
      } catch (fetchError) {
        console.error('Error fetching page:', fetchError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!page || deleteConfirmation.toLowerCase() !== 'excluir') return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete page');
      }
      
      toast.success('Página excluída com sucesso');
      router.push('/links');
    } catch (error) {
      console.error('Error deleting page:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir a página');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-gray-100 pt-20 pb-24 md:pt-12 md:pb-16 px-4">
        <div className="container mx-auto pl-1 sm:pl-4 md:pl-8 lg:pl-16 max-w-[98%] sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%]">
          <div className="flex flex-col gap-8 animate-pulse">
            <div className="h-8 w-64 bg-gray-200 rounded" />
            <div className="h-10 w-full max-w-md bg-gray-200 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-48 bg-gray-200 rounded" />
              <div className="h-48 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!page) {
    return null;
  }

  return (
    <div className="min-h-[100dvh] bg-gray-100 pt-20 pb-24 md:pt-12 md:pb-16 px-4">
      <div className="container mx-auto pl-1 sm:pl-4 md:pl-8 lg:pl-16 max-w-[98%] sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/links')}
              className="hidden md:flex"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-lg md:text-xl font-bold text-gray-900 tracking-[-0.03em] font-inter">
                {page.title}
              </h1>
              <p className="text-sm sm:text-xs md:text-sm text-gray-600 tracking-[-0.03em] font-inter">
                {`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${page.user?.slug || ''}/${page.slug}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => window.open(`/${page.user?.slug || ''}/${page.slug}`, '_blank')}
            >
              Visualizar
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 hover:text-red-700 hover:border-red-200"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#0070df] hover:bg-[#0070df]/90"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="metadata" className="space-y-6">
          <TabsList className="bg-white border-b border-gray-200 w-full justify-start rounded-none p-0 h-12">
            <TabsTrigger
              value="metadata"
              className="data-[state=active]:border-[#0070df] data-[state=active]:text-[#0070df] rounded-none border-b-2 border-transparent px-4"
            >
              Informações
            </TabsTrigger>
            <TabsTrigger
              value="blocks"
              className="data-[state=active]:border-[#0070df] data-[state=active]:text-[#0070df] rounded-none border-b-2 border-transparent px-4"
            >
              Blocos
            </TabsTrigger>
            <TabsTrigger
              value="social"
              className="data-[state=active]:border-[#0070df] data-[state=active]:text-[#0070df] rounded-none border-b-2 border-transparent px-4"
            >
              Redes Sociais
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="data-[state=active]:border-[#0070df] data-[state=active]:text-[#0070df] rounded-none border-b-2 border-transparent px-4"
            >
              Aparência
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metadata">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes da Página</CardTitle>
                <CardDescription>
                  Informações básicas sobre sua página de links
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={page.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtítulo</Label>
                  <Input
                    id="subtitle"
                    value={page.subtitle || ''}
                    onChange={(e) => handleChange('subtitle', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">URL da página</Label>
                  <div className="flex gap-2 items-center">
                    <span className="text-sm text-gray-500">
                      {`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${page.user?.slug || ''}/`}
                    </span>
                    <Input
                      id="slug"
                      value={page.slug}
                      onChange={(e) => handleChange('slug', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatarUrl">URL do Avatar</Label>
                  <Input
                    id="avatarUrl"
                    value={page.avatarUrl || ''}
                    onChange={(e) => handleChange('avatarUrl', e.target.value)}
                    placeholder="https://exemplo.com/seu-avatar.jpg"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="addresses">Endereços</Label>
                  </div>
                  <AddressManager 
                    addresses={page.addresses || []} 
                    onChange={(newAddresses) => {
                      handleAddressesChange(newAddresses);
                    }}
                    primaryColor={page.primaryColor}
                  />
                  <p className="text-xs text-gray-500">
                    Adicione um ou mais endereços que serão exibidos na sua página com um mapa interativo.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blocks">
            <Card>
              <CardHeader>
                <CardTitle>Blocos de Conteúdo</CardTitle>
                <CardDescription>
                  Adicione e organize os blocos de conteúdo da sua página
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BlockEditor
                  blocks={page.blocks}
                  onBlocksChange={handleBlocksChange}
                  disabled={isLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle>Redes Sociais</CardTitle>
                <CardDescription>
                  Conecte suas redes sociais à sua página
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SocialLinksEditor
                  links={page.socialLinks}
                  onLinksChange={handleSocialLinksChange}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Aparência</CardTitle>
                <CardDescription>
                  Personalize o visual da sua página
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="layout">Layout</Label>
                  <Select
                    value={page.layout}
                    onValueChange={(value) => handleChange('layout', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um layout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classic">Clássico</SelectItem>
                      <SelectItem value="modern">Moderno</SelectItem>
                      <SelectItem value="minimal">Minimalista</SelectItem>
                      <SelectItem value="collor">Collor</SelectItem>
                      <SelectItem value="bentodark">Bento Dark</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Escolha o estilo visual da sua página
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Cor Principal</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      value={page.primaryColor}
                      onChange={(e) => handleChange('primaryColor', e.target.value)}
                      className="flex-1"
                    />
                    <input
                      type="color"
                      value={page.primaryColor}
                      onChange={(e) => handleChange('primaryColor', e.target.value)}
                      className="h-10 w-10 rounded-md border border-input"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Página</DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita. Esta página será permanentemente excluída.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-500 mb-4">
                Para confirmar, digite <span className="font-medium text-gray-900">excluir</span> no campo abaixo:
              </p>
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Digite 'excluir'"
                className={deleteConfirmation.toLowerCase() !== 'excluir' ? 'border-red-200' : 'border-green-200'}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmation('');
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteConfirmation.toLowerCase() !== 'excluir' || isDeleting}
              >
                {isDeleting ? 'Excluindo...' : 'Excluir Página'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
} 