'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PlusIcon, TrashIcon, PencilIcon, ArrowPathIcon, LinkIcon, BookmarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface InterestOption {
  id: string;
  label: string;
  value: string;
  redirectUrl?: string | null;
  isDefault: boolean;
}

export default function InterestOptionsPage() {
  const router = useRouter();
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

      const method = isEditing ? 'PUT' : 'POST';
      const response = await fetch('/api/interest-options', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

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
      const response = await fetch(`/api/interest-options?id=${id}`, {
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
      <div className="flex items-center justify-center min-h-screen bg-blue-800">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pt-4 bg-blue-800 min-h-screen p-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="text-blue-200 hover:text-white mr-2"
          onClick={() => router.push('/profile')}
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Voltar ao Perfil
        </Button>
        <h1 className="text-2xl font-semibold text-white">Configurar Opções de Interesse</h1>
      </div>
      
      <Card className="bg-blue-900/80 backdrop-blur-sm border border-blue-700/50 shadow-md mb-6">
        <CardHeader className="flex flex-row items-center justify-between border-b border-blue-700/30 pb-4">
          <div>
            <CardTitle className="text-xl font-medium text-white flex items-center gap-2">
              <BookmarkIcon className="h-5 w-5" />
              Opções de Interesse
            </CardTitle>
            <CardDescription className="text-blue-100/70 mt-1">
              Configure as opções de interesse que aparecem nos seus formulários de captura
            </CardDescription>
          </div>
          <Button 
            onClick={handleAddOption}
            className="bg-blue-600/40 text-white hover:bg-blue-600/70 transition-colors border border-blue-500/30"
          >
            <PlusIcon className="h-4 w-4 mr-1.5" /> Nova Opção
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
            </div>
          ) : options.length === 0 ? (
            <div className="text-center py-10 bg-blue-950 border border-dashed border-blue-600/50 rounded-lg">
              <BookmarkIcon className="h-10 w-10 text-blue-300/50 mx-auto mb-3" />
              <p className="text-blue-100/80 mb-4">
                Você ainda não tem opções de interesse configuradas
              </p>
              <Button 
                onClick={handleAddOption} 
                className="bg-blue-600/40 text-white hover:bg-blue-600/70 transition-colors border border-blue-500/30"
              >
                <PlusIcon className="h-4 w-4 mr-1.5" /> Adicionar Primeira Opção
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {options.map(option => (
                <div 
                  key={option.id} 
                  className="p-4 bg-blue-950 border border-blue-600/50 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white">{option.label}</h3>
                      {option.isDefault && (
                        <Badge className="bg-blue-600/50 text-white border-blue-500/50 text-xs">Padrão</Badge>
                      )}
                    </div>
                    <div className="text-sm text-blue-100/80 mt-1">
                      Valor: <code className="bg-blue-800/80 px-1.5 py-0.5 rounded text-blue-200">{option.value}</code>
                    </div>
                    {option.redirectUrl && (
                      <div className="text-xs text-blue-100/70 mt-1 flex items-center">
                        <LinkIcon className="h-3 w-3 mr-1" /> 
                        <span className="truncate">{option.redirectUrl}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleEditOption(option)}
                      className="h-8 w-8 p-0 text-blue-100/70 hover:text-white hover:bg-blue-600/30 border border-transparent hover:border-blue-500/30"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleDeleteOption(option.id, option.label)}
                      className="h-8 w-8 p-0 text-blue-100/70 hover:text-red-400 hover:bg-red-900/20 border border-transparent hover:border-red-500/30"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção de Ajuda */}
      <Card className="bg-blue-900/80 backdrop-blur-sm border border-blue-700/50 shadow-md">
        <CardHeader className="border-b border-blue-700/30">
          <CardTitle className="text-lg font-medium text-white">Como Usar</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4 text-blue-100/80">
          <p>
            As opções de interesse são exibidas no formulário de captura de leads e permitem direcionar os pacientes para diferentes páginas após o envio do formulário.
          </p>
          
          <div className="space-y-2">
            <h3 className="text-white font-medium">Benefícios:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Segmente seus leads por diferentes interesses</li>
              <li>Redirecione para páginas específicas dependendo da escolha</li>
              <li>Personalize a experiência de cada tipo de paciente</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-white font-medium">Exemplo de uso:</h3>
            <div className="bg-blue-800/90 p-4 rounded-lg border border-blue-600/50">
              <p><strong className="text-white">Consulta em Goiás</strong> - Redireciona para uma página com informações sobre o consultório em Goiás</p>
              <p><strong className="text-white">Treinamento Online</strong> - Redireciona para a página de cursos</p>
              <p><strong className="text-white">Consulta Padrão</strong> - Usa a página de agradecimento padrão</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal para adicionar/editar opção */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-blue-900 backdrop-blur-sm border border-blue-700/50 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isEditing ? 'Editar Opção de Interesse' : 'Nova Opção de Interesse'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="label" className="text-blue-100">Nome (exibido no formulário)</Label>
                <Input
                  id="label"
                  name="label"
                  value={formData.label}
                  onChange={handleInputChange}
                  placeholder="Ex: Consulta em Goiás"
                  className="bg-blue-800/50 border-blue-600/50 text-white focus:border-blue-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="value" className="text-blue-100">Valor (identificador)</Label>
                <Input
                  id="value"
                  name="value"
                  value={formData.value}
                  onChange={handleInputChange}
                  placeholder="Ex: consulta_goias"
                  className="bg-blue-800/50 border-blue-600/50 text-white focus:border-blue-400"
                />
                <p className="text-xs text-blue-200/60">
                  Identificador único usado internamente e para rastreamento
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="redirectUrl" className="text-blue-100">URL de Redirecionamento (opcional)</Label>
                <Input
                  id="redirectUrl"
                  name="redirectUrl"
                  value={formData.redirectUrl || ''}
                  onChange={handleInputChange}
                  placeholder="https://exemplo.com.br/pagina-de-obrigado"
                  className="bg-blue-800/50 border-blue-600/50 text-white focus:border-blue-400"
                />
                <p className="text-xs text-blue-200/60">
                  URL para onde o usuário será redirecionado após enviar o formulário
                </p>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="isDefault"
                  checked={formData.isDefault || false}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="isDefault" className="text-blue-100">Definir como opção padrão</Label>
              </div>
            </div>
            
            <DialogFooter className="pt-4 border-t border-blue-700/30">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border border-blue-600/50 hover:bg-blue-700/50 text-blue-100"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-500/50"
              >
                {isSubmitting ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : isEditing ? (
                  'Atualizar'
                ) : (
                  'Adicionar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 