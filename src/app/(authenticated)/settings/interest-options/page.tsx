'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PlusIcon, TrashIcon, PencilIcon, ArrowPathIcon, LinkIcon, BookmarkIcon, ArrowLeftIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface InterestOption {
  id: string;
  label: string;
  value: string;
  redirectUrl?: string | null;
  isDefault: boolean;
}

export default function InterestOptionsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [options, setOptions] = useState<InterestOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<InterestOption>>({
    label: '',
    value: '',
    redirectUrl: '',
    isDefault: false
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carregar as opções existentes
  const fetchOptions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/interest-options');
      
      if (response.ok) {
        const data = await response.json();
        setOptions(data);
      } else {
        console.error('Erro ao buscar opções:', await response.json());
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as opções de interesse.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao buscar opções:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as opções de interesse.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchOptions();
    }
  }, [session]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isDefault: checked }));
  };

  const handleAddOption = () => {
    setFormData({
      label: '',
      value: '',
      redirectUrl: '',
      isDefault: false
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEditOption = (option: InterestOption) => {
    setFormData(option);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.label || !formData.value) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Preencha o nome e o valor da opção.',
          variant: 'destructive'
        });
        return;
      }

      let response;
      
      if (isEditing && formData.id) {
        // Atualizar opção existente com PATCH
        response = await fetch(`/api/interest-options/${formData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        // Criar nova opção com POST
        response = await fetch('/api/interest-options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }

      if (response.ok) {
        const result = await response.json();
        toast({
          title: isEditing ? 'Opção atualizada' : 'Opção adicionada',
          description: `A opção "${formData.label}" foi ${isEditing ? 'atualizada' : 'adicionada'} com sucesso.`
        });
        
        setIsModalOpen(false);
        fetchOptions();
      } else {
        const error = await response.json();
        toast({
          title: 'Erro',
          description: error.error || 'Erro ao processar a solicitação.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao salvar opção:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao processar a solicitação.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOption = async (id: string, label: string) => {
    if (!confirm(`Tem certeza que deseja excluir a opção "${label}"?`)) {
      return;
    }

    try {
      // Utilizar a API RESTful padrão para excluir pelo ID
      const response = await fetch(`/api/interest-options/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Opção excluída',
          description: `A opção "${label}" foi excluída com sucesso.`
        });
        fetchOptions();
      } else {
        const error = await response.json();
        toast({
          title: 'Erro',
          description: error.error || 'Erro ao excluir a opção.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao excluir opção:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir a opção.',
        variant: 'destructive'
      });
    }
  };

  // Mostrar um spinner enquanto carrega
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-100 pt-20 pb-16 md:pt-12 md:pb-12 px-4">
      <div className="container mx-auto pl-1 sm:pl-4 md:pl-8 lg:pl-16 max-w-[98%] sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 sm:mb-3">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-[-0.03em] font-inter">Configurações</h1>
            <p className="text-xs md:text-sm text-gray-600 tracking-[-0.03em] font-inter">Gerencie as configurações do sistema</p>
          </div>
          <div className="flex gap-2 mt-2 md:mt-0">
            <Link href="/profile">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg-gray-800/10 h-8 text-xs"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5 mr-1.5" />
                Voltar ao Perfil
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Settings navigation tabs */}
        <div className="mb-4 sm:mb-3">
          <Tabs defaultValue="interest-options" className="w-full">
            <TabsList className="w-full bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] rounded-2xl p-1 h-auto">
              <Link href="/settings/interest-options" className="w-full">
                <TabsTrigger 
                  value="interest-options" 
                  className={`text-xs py-2 rounded-xl transition-all data-[state=active]:shadow-md data-[state=active]:bg-white data-[state=active]:text-gray-900 ${pathname?.includes('/interest-options') ? 'shadow-md bg-white text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Opções de Interesse
                </TabsTrigger>
              </Link>
              <Link href="/settings/integrations" className="w-full">
                <TabsTrigger 
                  value="integrations" 
                  className={`text-xs py-2 rounded-xl transition-all data-[state=active]:shadow-md data-[state=active]:bg-white data-[state=active]:text-gray-900 ${pathname?.includes('/integrations') ? 'shadow-md bg-white text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Integrações
                </TabsTrigger>
              </Link>
            </TabsList>
          </Tabs>
        </div>
        
        <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl mb-6">
          <CardHeader className="px-4 py-3 sm:p-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <CardTitle className="text-sm md:text-base font-bold text-gray-900 tracking-[-0.03em] font-inter flex items-center gap-1.5">
                  <BookmarkIcon className="h-4 w-4 text-[#6366f1]" />
                  Opções de Interesse
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 tracking-[-0.03em] font-inter mt-0.5">
                  Configure as opções que aparecem nos seus formulários de captura
                </CardDescription>
              </div>
              <Button 
                onClick={handleAddOption}
                className="mt-3 md:mt-0 bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-md shadow-blue-500/20 rounded-xl transition-all duration-300 h-8 text-xs"
              >
                <PlusIcon className="h-3.5 w-3.5 mr-1.5" /> Nova Opção
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 py-3 sm:p-3">
            {loading ? (
              <div className="flex justify-center items-center py-6">
                <div className="w-8 h-8 rounded-full border-3 border-blue-500 border-t-transparent animate-spin"></div>
              </div>
            ) : options.length === 0 ? (
              <div className="text-center py-6 bg-white/80 backdrop-blur-sm border border-dashed border-gray-300 rounded-xl">
                <BookmarkIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-3">
                  Você ainda não tem opções de interesse configuradas
                </p>
                <Button 
                  onClick={handleAddOption} 
                  className="bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-md shadow-blue-500/20 rounded-xl transition-all duration-300 h-8 text-xs"
                >
                  <PlusIcon className="h-3.5 w-3.5 mr-1.5" /> Adicionar Primeira Opção
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {options.map(option => (
                  <div 
                    key={option.id} 
                    className="p-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-3"
                  >
                    <div>
                      <div className="flex items-center">
                        <h3 className="font-medium text-gray-900 text-sm">{option.label}</h3>
                        {option.isDefault && (
                          <Badge className="ml-2 bg-green-100 text-green-800 border-green-200 text-xs px-1.5 py-0">
                            Padrão
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-600 space-y-0.5">
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-2">Valor:</span> 
                          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800 text-xs">{option.value}</code>
                        </div>
                        {option.redirectUrl && (
                          <div className="flex items-center">
                            <LinkIcon className="h-3 w-3 text-gray-500 mr-1" />
                            <span className="text-gray-500 mr-2">Redirecionamento:</span>
                            <span className="text-gray-800 text-xs truncate max-w-[240px]">{option.redirectUrl}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-auto">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg-gray-800/10 h-7 text-xs"
                        onClick={() => handleEditOption(option)}
                      >
                        <PencilIcon className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-red-50 text-red-600 border-0 shadow-sm hover:bg-red-100 transition-all duration-300 rounded-2xl h-7 text-xs"
                        onClick={() => handleDeleteOption(option.id, option.label)}
                      >
                        <TrashIcon className="h-3 w-3 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de adição/edição */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-white rounded-2xl border-0 shadow-[0_25px_50px_rgba(0,0,0,0.25)] max-w-md p-4">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-base font-bold text-gray-900">{isEditing ? 'Editar Opção' : 'Nova Opção'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-3 py-2">
                <div className="space-y-1">
                  <Label htmlFor="label" className="text-xs text-gray-700">Nome da Opção*</Label>
                  <Input
                    id="label"
                    name="label"
                    value={formData.label}
                    onChange={handleInputChange}
                    placeholder="Ex: Consulta, Exame, Avaliação..."
                    className="bg-white shadow-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-8 text-xs"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="value" className="text-xs text-gray-700">Valor da Opção*</Label>
                  <Input
                    id="value"
                    name="value"
                    value={formData.value}
                    onChange={handleInputChange}
                    placeholder="Ex: consulta, exame, avaliacao..."
                    className="bg-white shadow-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-8 text-xs"
                  />
                  <p className="text-xs text-gray-500">Este valor será usado na URL do link</p>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="redirectUrl" className="text-xs text-gray-700">URL de Redirecionamento (opcional)</Label>
                  <Input
                    id="redirectUrl"
                    name="redirectUrl"
                    value={formData.redirectUrl || ''}
                    onChange={handleInputChange}
                    placeholder="https://exemplo.com/pagina"
                    className="bg-white shadow-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-8 text-xs"
                  />
                  <p className="text-xs text-gray-500">Deixe em branco para usar a página padrão</p>
                </div>
                
                <div className="flex items-center space-x-2 pt-1">
                  <Switch
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={handleSwitchChange}
                    className="data-[state=checked]:bg-[#6366f1]"
                  />
                  <Label htmlFor="isDefault" className="text-xs text-gray-700">Definir como opção padrão</Label>
                </div>
              </div>
              
              <DialogFooter className="pt-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  className="border border-gray-300 bg-white text-gray-700 rounded-xl shadow-sm h-8 text-xs"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-md shadow-blue-500/20 rounded-xl ml-2 h-8 text-xs"
                >
                  {isSubmitting ? (
                    <>
                      <ArrowPathIcon className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Processando...
                    </>
                  ) : isEditing ? 'Salvar Alterações' : 'Adicionar Opção'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 