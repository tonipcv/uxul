'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, ChevronRight, CheckCircle, XCircle, Wrench, ExternalLink } from 'lucide-react';

interface QuizData {
  id: string;
  name: string;
  description?: string;
  isPublished: boolean;
  questionCount: number;
  indicationCount: number;
  indicationSlugs: string[];
}

interface IndicationData {
  id: string;
  name: string;
  slug: string;
  quizId: string | null;
  hasQuiz: boolean;
  quizName?: string;
  fullLink?: string;
  type: string;
  leadCount: number;
  eventCount: number;
  createdAt: string;
}

interface DiagnosticsData {
  quizzesWithoutIndications: number;
  indicationsWithMissingQuiz: number;
  totalIndications: number;
  totalQuizzes: number;
}

export default function QuizUtilsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null);
  const [quizzes, setQuizzes] = useState<QuizData[]>([]);
  const [indications, setIndications] = useState<IndicationData[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<string>('');
  const [selectedIndication, setSelectedIndication] = useState<string>('');
  const [isFixing, setIsFixing] = useState(false);
  const [fixMessage, setFixMessage] = useState<string>('');
  
  // Carregar dados de diagnóstico
  useEffect(() => {
    const fetchDiagnostics = async () => {
      if (!session?.user?.id) return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/quiz/diagnostics');
        
        if (!response.ok) {
          throw new Error('Erro ao buscar diagnóstico');
        }
        
        const data = await response.json();
        
        setDiagnostics(data.diagnostics);
        setQuizzes(data.quizzes);
        setIndications(data.indications);
        
        if (data.diagnostics.quizzesWithoutIndications > 0 || data.diagnostics.indicationsWithMissingQuiz > 0) {
          toast.warning('Detectamos problemas com seus quizzes que precisam de atenção');
        }
      } catch (error) {
        console.error('Erro ao buscar diagnóstico:', error);
        toast.error('Erro ao verificar quizzes');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDiagnostics();
  }, [session]);
  
  // Corrigir problemas
  const fixQuizLink = async (quizId: string) => {
    if (!session?.user?.id) return;
    
    try {
      setIsFixing(true);
      setFixMessage('');
      
      const response = await fetch('/api/quiz/repair', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'fix-quiz-link',
          quizId,
          createMissing: true
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro desconhecido');
      }
      
      const result = await response.json();
      
      setFixMessage(`Link corrigido: ${result.link}`);
      toast.success('Link corrigido com sucesso!');
      
      // Recarregar dados após 2s
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao corrigir link:', error);
      toast.error('Erro ao corrigir link');
      setFixMessage(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsFixing(false);
    }
  };
  
  // Associar indicação manualmente
  const associateIndicationToQuiz = async () => {
    if (!selectedQuiz || !selectedIndication) {
      toast.error('Selecione um quiz e uma indicação');
      return;
    }
    
    try {
      setIsFixing(true);
      setFixMessage('');
      
      const response = await fetch('/api/quiz/repair', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'associate-by-slug',
          quizId: selectedQuiz,
          indicationSlug: selectedIndication
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro desconhecido');
      }
      
      const result = await response.json();
      
      setFixMessage('Associação realizada com sucesso!');
      toast.success('Quiz e indicação associados com sucesso!');
      
      // Recarregar dados após 2s
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao associar quiz e indicação:', error);
      toast.error('Erro ao fazer associação');
      setFixMessage(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsFixing(false);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50 text-gray-800 pt-20 pb-24 md:pt-12 md:pb-16 px-2 sm:px-4">
      <div className="container mx-auto px-0 sm:pl-4 md:pl-8 lg:pl-16 max-w-full sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-800 tracking-[-0.03em] font-inter">Utilitários de Quiz</h1>
            <p className="text-xs md:text-sm text-gray-600 tracking-[-0.03em] font-inter">Diagnóstico e reparo de questionários</p>
          </div>
          <div className="w-full md:w-auto mt-2 md:mt-0 flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline"
              onClick={() => {
                try {
                  router.push('/dashboard/quizzes');
                } catch (routerError) {
                  console.warn("Erro ao usar router.push:", routerError);
                  window.location.href = '/dashboard/quizzes';
                }
              }}
              className="w-full md:w-auto bg-white border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg-gray-50 text-xs h-9"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
        
        {/* Estatísticas de Diagnóstico */}
        {diagnostics && (
          <div className="mb-8">
            <Card className="bg-white border border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Diagnóstico do Sistema</CardTitle>
                <CardDescription>Visão geral dos questionários e indicações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-2xl font-bold text-blue-600">{diagnostics.totalQuizzes}</p>
                    <p className="text-sm text-blue-800">Total de Quizzes</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-2xl font-bold text-green-600">{diagnostics.totalIndications}</p>
                    <p className="text-sm text-green-800">Total de Indicações</p>
                  </div>
                  <div className={`p-4 ${diagnostics.quizzesWithoutIndications > 0 ? 'bg-amber-50' : 'bg-gray-50'} rounded-xl`}>
                    <p className={`text-2xl font-bold ${diagnostics.quizzesWithoutIndications > 0 ? 'text-amber-600' : 'text-gray-500'}`}>
                      {diagnostics.quizzesWithoutIndications}
                    </p>
                    <p className={`text-sm ${diagnostics.quizzesWithoutIndications > 0 ? 'text-amber-800' : 'text-gray-500'}`}>
                      Quizzes sem Indicação
                    </p>
                  </div>
                  <div className={`p-4 ${diagnostics.indicationsWithMissingQuiz > 0 ? 'bg-red-50' : 'bg-gray-50'} rounded-xl`}>
                    <p className={`text-2xl font-bold ${diagnostics.indicationsWithMissingQuiz > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {diagnostics.indicationsWithMissingQuiz}
                    </p>
                    <p className={`text-sm ${diagnostics.indicationsWithMissingQuiz > 0 ? 'text-red-800' : 'text-gray-500'}`}>
                      Indicações com Problemas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Lista de Quizzes sem indicação */}
        {quizzes.filter(q => q.indicationCount === 0).length > 0 && (
          <div className="mb-8">
            <Card className="bg-white border border-amber-200 shadow-md">
              <CardHeader className="bg-amber-50 border-b border-amber-100">
                <CardTitle className="text-lg font-semibold text-amber-800">Quizzes sem Indicação</CardTitle>
                <CardDescription className="text-amber-700">Estes quizzes precisam de uma indicação para serem acessíveis</CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-amber-100">
                {quizzes.filter(q => q.indicationCount === 0).map(quiz => (
                  <div key={quiz.id} className="py-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">{quiz.name}</h3>
                      <p className="text-sm text-gray-500">
                        {quiz.questionCount} {quiz.questionCount === 1 ? 'pergunta' : 'perguntas'} • 
                        {quiz.isPublished ? (
                          <span className="text-green-600 ml-1">Publicado</span>
                        ) : (
                          <span className="text-amber-600 ml-1">Rascunho</span>
                        )}
                      </p>
                    </div>
                    <Button 
                      onClick={() => fixQuizLink(quiz.id)} 
                      disabled={isFixing}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                    >
                      <Wrench className="h-3.5 w-3.5 mr-1.5" />
                      Corrigir
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Associar Quiz e Indicação */}
        <div className="mb-8">
          <Card className="bg-white border border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Associar Manualmente</CardTitle>
              <CardDescription>Conecte manualmente um quiz a uma indicação existente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="select-quiz" className="block mb-2 text-sm font-medium text-gray-700">
                    Selecione um Quiz
                  </Label>
                  <select 
                    id="select-quiz" 
                    value={selectedQuiz}
                    onChange={(e) => setSelectedQuiz(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione um quiz...</option>
                    {quizzes.map(quiz => (
                      <option key={quiz.id} value={quiz.id}>
                        {quiz.name} ({quiz.indicationCount > 0 ? `${quiz.indicationCount} indicações` : 'Sem indicação'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="select-indication" className="block mb-2 text-sm font-medium text-gray-700">
                    Selecione uma Indicação
                  </Label>
                  <select 
                    id="select-indication" 
                    value={selectedIndication}
                    onChange={(e) => setSelectedIndication(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione uma indicação...</option>
                    {indications.map(ind => (
                      <option key={ind.id} value={ind.slug}>
                        {ind.name} (slug: {ind.slug}) {ind.hasQuiz ? '- Com quiz' : '- Sem quiz'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <Button 
                onClick={associateIndicationToQuiz} 
                disabled={isFixing || !selectedQuiz || !selectedIndication}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Wrench className="h-4 w-4 mr-2" />
                Associar Quiz e Indicação
              </Button>
              
              {fixMessage && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md text-blue-700 text-sm">
                  {fixMessage}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Lista de todas as indicações com seus quizzes */}
        <div className="mb-8">
          <Card className="bg-white border border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Indicações e seus Quizzes</CardTitle>
              <CardDescription>Lista de todas as indicações e status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-gray-100">
                {indications.map(ind => (
                  <div key={ind.id} className="py-4 flex flex-col md:flex-row justify-between md:items-center">
                    <div className="mb-3 md:mb-0">
                      <h3 className="font-medium text-gray-900 flex items-center">
                        {ind.name}
                        {ind.hasQuiz ? (
                          <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 ml-2 text-red-500" />
                        )}
                      </h3>
                      <p className="text-sm text-gray-500 mb-1">
                        <span className="font-mono">/{ind.slug}</span> • 
                        {ind.hasQuiz ? (
                          <span className="text-green-600 ml-1">{ind.quizName}</span>
                        ) : (
                          <span className="text-red-600 ml-1">Sem quiz</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">
                        {ind.leadCount} {ind.leadCount === 1 ? 'lead' : 'leads'} • 
                        {ind.eventCount} {ind.eventCount === 1 ? 'visualização' : 'visualizações'}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {ind.hasQuiz && ind.fullLink && (
                        <Button 
                          variant="outline" 
                          onClick={() => window.open(`/quiz/${session?.user?.userSlug}/${ind.slug}`, '_blank')}
                          className="bg-white text-blue-600 border-blue-200 text-xs h-8"
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                          Abrir Quiz
                        </Button>
                      )}
                      
                      {!ind.hasQuiz && quizzes.length > 0 && (
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSelectedIndication(ind.slug);
                            setSelectedQuiz(quizzes[0].id);
                            // Scroll para a seção de associação
                            document.getElementById('select-quiz')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="bg-white text-amber-600 border-amber-200 text-xs h-8"
                        >
                          <Wrench className="h-3.5 w-3.5 mr-1.5" />
                          Associar Quiz
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {indications.length === 0 && (
                  <div className="py-8 text-center text-gray-500">
                    <p>Nenhuma indicação encontrada</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 