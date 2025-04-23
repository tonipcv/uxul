'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  PlusCircle, 
  Search, 
  ListFilter, 
  FileQuestion, 
  Check, 
  FileText, 
  Calendar,
  CheckCircle2, 
  ChevronRight,
  X 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Interface para dados do quiz
interface Quiz {
  id: string;
  name: string;
  description?: string;
  isPublished: boolean;
  createdAt: string;
  indicationId?: string;
  indicationSlug?: string;
  questionCount?: number;
}

export default function QuizzesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Estado para controlar o modal de criação
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newQuizName, setNewQuizName] = useState('Novo Questionário de Triagem');
  const [newQuizDescription, setNewQuizDescription] = useState('Triagem inicial para pacientes');
  const [isCreating, setIsCreating] = useState(false);

  // Carregar lista de quizzes
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        // Esta rota de API precisa ser implementada
        const response = await fetch('/api/quizzes');
        
        if (!response.ok) {
          throw new Error('Erro ao buscar quizzes');
        }
        
        const data = await response.json();
        setQuizzes(data);
      } catch (error) {
        console.error('Erro ao buscar quizzes:', error);
        toast.error('Erro ao carregar seus quizzes');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizzes();
  }, [session]);

  // Filtrar quizzes pelo status e busca
  const filteredQuizzes = quizzes.filter(quiz => {
    // Filtro de status
    if (statusFilter === 'published' && !quiz.isPublished) return false;
    if (statusFilter === 'draft' && quiz.isPublished) return false;
    
    // Filtro de busca
    if (searchQuery && !quiz.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Abrir modal para criar novo quiz
  const openCreateModal = () => {
    setNewQuizName('Novo Questionário de Triagem');
    setNewQuizDescription('Triagem inicial para pacientes');
    setIsCreateModalOpen(true);
  };

  // Criar novo quiz após confirmação do modal
  const createNewQuiz = async () => {
    if (!newQuizName.trim()) {
      toast.error('O nome do questionário é obrigatório');
      return;
    }

    if (!session?.user?.id) {
      console.error("Sessão do usuário não disponível:", session);
      toast.error('Você precisa estar autenticado para criar um questionário');
      return;
    }

    setIsCreating(true);
    
    // Testar conexão com a API sem enviar dados ainda
    try {
      const testResponse = await fetch('/api/quizzes', {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });
      
      console.log("Teste de conexão com a API:", testResponse.status, testResponse.statusText);
      
      if (!testResponse.ok) {
        console.warn("API não está respondendo corretamente no teste inicial");
      }
    } catch (testError) {
      console.error("Erro ao testar conexão com a API:", testError);
    }
    
    try {
      console.log("Enviando requisição para API com session:", session.user);
      
      // Criar o quiz na API
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Debug-User-ID': session?.user?.id || 'no-id'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: newQuizName,
          description: newQuizDescription
        })
      });
      
      console.log("Resposta recebida:", response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro detalhado da API:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          headers: Object.fromEntries([...response.headers.entries()])
        });
        
        // Mostrar mensagem amigável ao usuário
        toast.error(`Não foi possível criar o questionário (${response.status})`);
        setIsCreating(false);
        return;
      }
      
      let data;
      try {
        data = await response.json();
        console.log("Quiz criado com sucesso, ID:", data.id);
      } catch (jsonError) {
        console.error("Erro ao processar resposta JSON:", jsonError);
        toast.error("Erro ao processar resposta do servidor");
        setIsCreating(false);
        return;
      }
      
      if (!data?.id) {
        console.error("Resposta não contém ID do quiz:", data);
        toast.error("Resposta do servidor inválida");
        setIsCreating(false);
        return;
      }
      
      console.log("Redirecionando para:", `/dashboard/quiz-editor/${data.id}`);
      
      // Fechar o modal
      setIsCreateModalOpen(false);
      
      // Tenta usar o router primeiro
      try {
        router.push(`/dashboard/quiz-editor/${data.id}`);
      } catch (routerError) {
        console.warn("Erro ao usar router.push:", routerError);
        // Fallback para window.location se o router falhar
        window.location.href = `/dashboard/quiz-editor/${data.id}`;
      }
      
      toast.success('Novo questionário criado!');
    } catch (error) {
      console.error('Erro detalhado ao criar quiz:', error);
      toast.error('Erro ao criar novo questionário. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container px-4 py-10 mx-auto max-w-7xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-inter">Questionários de Triagem</h1>
          <p className="text-sm text-gray-600 tracking-tight font-inter mt-1">
            Crie questionários estruturados para qualificar seus pacientes
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
          {/* Link para diagnóstico */}
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/quizzes/diagnostico')}
            className="w-full sm:w-auto"
          >
            Diagnóstico
          </Button>
          {/* Link para respostas */}
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/quizzes/responses')}
            className="w-full sm:w-auto"
          >
            Respostas
          </Button>
          <Button 
            onClick={openCreateModal}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Novo Questionário
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar questionários..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px] bg-white border-gray-200">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="published">Publicados</SelectItem>
            <SelectItem value="draft">Rascunhos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {filteredQuizzes.length === 0 ? (
            <div className="text-center p-10 border border-dashed rounded-lg bg-gray-50">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                <FileQuestion className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum questionário encontrado</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Tente ajustar seus filtros de busca' 
                  : 'Comece criando seu primeiro questionário de triagem para pacientes'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button 
                  onClick={openCreateModal}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Criar Questionário
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredQuizzes.map(quiz => (
                <Card 
                  key={quiz.id} 
                  className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-semibold text-gray-900 font-inter">
                        {quiz.name}
                      </CardTitle>
                      <Badge variant={quiz.isPublished ? "default" : "secondary"} className={quiz.isPublished ? "bg-green-500" : ""}>
                        {quiz.isPublished ? 'Publicado' : 'Rascunho'}
                      </Badge>
                    </div>
                    <CardDescription className="text-gray-500 line-clamp-2">
                      {quiz.description || 'Questionário de triagem para pacientes'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <FileText className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{quiz.questionCount || 0} perguntas</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Criado em {format(new Date(quiz.createdAt), 'dd MMM yyyy', { locale: ptBR })}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 flex justify-between">
                    <Button 
                      variant="outline" 
                      className="text-xs h-8 bg-white"
                      onClick={() => {
                        console.log("Clique em Editar para quiz:", quiz.id);
                        try {
                          router.push(`/dashboard/quiz-editor/${quiz.id}`);
                        } catch (routerError) {
                          console.warn("Erro ao usar router.push para Editar:", routerError);
                          window.location.href = `/dashboard/quiz-editor/${quiz.id}`;
                        }
                      }}
                    >
                      Editar
                    </Button>
                    {quiz.isPublished && quiz.indicationSlug && (
                      <Button 
                        variant="ghost" 
                        className="text-xs h-8 text-blue-600"
                        onClick={() => {
                          const url = `/${session?.user?.email?.split('@')[0]}/${quiz.indicationSlug}`;
                          console.log("Clique em Visualizar para:", url);
                          try {
                            router.push(url);
                          } catch (routerError) {
                            console.warn("Erro ao usar router.push para Visualizar:", routerError);
                            window.location.href = url;
                          }
                        }}
                      >
                        Visualizar
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal de Criação de Questionário */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Criar Novo Questionário</DialogTitle>
            <DialogDescription>
              Informe o nome e descrição do questionário que você deseja criar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="quiz-name" className="font-medium">Nome do Questionário *</Label>
              <Input
                id="quiz-name"
                placeholder="Ex: Triagem Inicial"
                value={newQuizName}
                onChange={(e) => setNewQuizName(e.target.value)}
                className="border-gray-300"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quiz-description" className="font-medium">Descrição (opcional)</Label>
              <Textarea
                id="quiz-description"
                placeholder="Descreva o propósito deste questionário"
                value={newQuizDescription}
                onChange={(e) => setNewQuizDescription(e.target.value)}
                className="border-gray-300 min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              className="mt-2 sm:mt-0"
            >
              Cancelar
            </Button>
            <Button
              onClick={createNewQuiz}
              disabled={isCreating || !newQuizName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCreating ? 'Criando...' : 'Criar Questionário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 