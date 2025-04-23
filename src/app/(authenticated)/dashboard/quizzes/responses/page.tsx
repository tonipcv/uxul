'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeft, 
  Search, 
  Calendar, 
  User, 
  Phone, 
  FileText,
  ChevronRight
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';

// Interface para respostas de questionário
interface QuizResponse {
  id: string; // ID do lead
  name: string; // Nome da pessoa que respondeu
  quizName: string; // Nome do questionário
  indicationName: string; // Nome da indicação
  phone: string;
  email?: string;
  createdAt: string;
  metadata?: string;
  source: string;
  quizId: string;
}

export default function QuizResponsesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [quizFilter, setQuizFilter] = useState('all');
  const [quizOptions, setQuizOptions] = useState<{id: string, name: string}[]>([]);

  // Carregar lista de respostas
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const fetchResponses = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/quizzes/responses');
        
        if (!response.ok) {
          throw new Error('Erro ao buscar respostas de questionários');
        }
        
        const data = await response.json();
        setResponses(data.responses);
        
        // Extrair opções de questionários únicos para o filtro
        const uniqueQuizzes = Array.from(
          new Set(data.responses.map((r: QuizResponse) => r.quizId))
        ).map((quizId: unknown) => {
          const resp = data.responses.find((r: QuizResponse) => r.quizId === quizId);
          return {
            id: String(quizId),
            name: resp?.quizName || 'Questionário sem nome'
          };
        });
        
        setQuizOptions(uniqueQuizzes);
      } catch (error) {
        console.error('Erro ao buscar respostas:', error);
        toast.error('Erro ao carregar as respostas dos questionários');
      } finally {
        setLoading(false);
      }
    };
    
    fetchResponses();
  }, [session]);

  // Filtrar respostas
  const filteredResponses = responses.filter(resp => {
    // Filtro de questionário
    if (quizFilter !== 'all' && resp.quizId !== quizFilter) return false;
    
    // Filtro de busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        resp.name.toLowerCase().includes(query) ||
        resp.quizName.toLowerCase().includes(query) ||
        resp.indicationName.toLowerCase().includes(query) ||
        resp.phone.includes(query)
      );
    }
    
    return true;
  });

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
    } catch (e) {
      return 'Data inválida';
    }
  };

  const viewResponseDetails = (responseId: string) => {
    router.push(`/dashboard/quizzes/responses/${responseId}`);
  };

  return (
    <div className="container px-4 py-10 mx-auto max-w-7xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-inter">Respostas dos Questionários</h1>
          <p className="text-sm text-gray-600 tracking-tight font-inter mt-1">
            Visualize as respostas dos seus questionários de triagem
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
          <Button 
            variant="outline"
            onClick={() => router.push('/dashboard/quizzes')}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Questionários
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar respostas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200"
          />
        </div>
        <Select value={quizFilter} onValueChange={setQuizFilter}>
          <SelectTrigger className="w-full md:w-[250px] bg-white border-gray-200">
            <SelectValue placeholder="Filtrar por questionário" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os questionários</SelectItem>
            {quizOptions.map(quiz => (
              <SelectItem key={quiz.id} value={quiz.id}>
                {quiz.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {filteredResponses.length === 0 ? (
            <div className="text-center p-10 border border-dashed rounded-lg bg-gray-50">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma resposta encontrada</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
                {searchQuery || quizFilter !== 'all' 
                  ? 'Tente ajustar seus filtros de busca' 
                  : 'Ainda não há respostas para seus questionários'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResponses.map(response => (
                <Card 
                  key={response.id} 
                  className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-semibold text-gray-900 font-inter">
                        {response.name}
                      </CardTitle>
                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                        {response.source}
                      </Badge>
                    </div>
                    <CardDescription className="text-gray-500">
                      {response.quizName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{response.phone}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      {response.email && (
                        <>
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{response.email}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{formatDate(response.createdAt)}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button 
                      variant="outline" 
                      className="w-full text-xs h-8 bg-white text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => viewResponseDetails(response.id)}
                    >
                      Ver Respostas
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
} 