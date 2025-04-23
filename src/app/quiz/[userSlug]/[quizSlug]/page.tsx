'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from '@/components/ui/logo';
import { ShieldCheckIcon, CheckCircleIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { XCircle, CheckCircle, ExternalLink, ClipboardList, Clock } from 'lucide-react';
import { QuestionRenderer, QuizQuestion as RendererQuizQuestion } from '@/components/quiz/QuestionRenderer';
import { normalizeAnswerValue, QuizAnswers } from '@/lib/quiz/answer-processing';
import { toast } from 'react-hot-toast';

interface Doctor {
  name: string;
  specialty: string;
  image: string | null;
}

interface QuizQuestion {
  id: string;
  type: string;
  text: string;
  required: boolean;
  options?: string[];
  variableName?: string;
}

interface Quiz {
  id: string;
  name: string;
  description?: string;
  isPublished: boolean;
  questions: QuizQuestion[];
  openingScreen?: {
    title: string;
    subtitle: string;
    description: string;
    startButtonText: string;
    showTimeEstimate: boolean;
    showQuestionCount: boolean;
  };
  completionScreen?: {
    title: string;
    message: string;
    redirectUrl: string;
    redirectButtonText: string;
  };
}

export default function QuizPage() {
  const params = useParams<{ userSlug: string, quizSlug: string }>();
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [indicationId, setIndicationId] = useState<string | null>(null);

  // Monitor success state changes
  useEffect(() => {
    if (success) {
      console.log('Estado success alterado para true, deveria mostrar tela de conclusão');
    }
  }, [success]);

  // Quiz-related state
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(-1); // Start at -1 for opening screen
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const quizRef = useRef<HTMLDivElement>(null);

  // Fetch the quiz information and doctor details
  useEffect(() => {
    const fetchData = async () => {
      if (!params.userSlug || !params.quizSlug) return;
      
      try {
        setInitialLoading(true);
        console.log(`Tentando buscar quiz: /api/quiz/${params.userSlug}/${params.quizSlug}`);
        
        // Fetch the quiz data
        const response = await fetch(`/api/quiz/${params.userSlug}/${params.quizSlug}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Erro na API: ${response.status} - ${errorText}`);
          throw new Error(`Não foi possível carregar o questionário. Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Dados recebidos:', data);
        
        setIndicationId(data.id);
        
        // Set quiz data if it exists
        if (data.quiz) {
          console.log('Opening screen data:', data.quiz.openingScreen); // Debug log
          setQuiz(data.quiz);
          // Start at opening screen if it exists
          setActiveQuestionIndex(data.quiz.openingScreen ? -1 : 0);
        }
        
        // Set doctor information
        if (data.user) {
          setDoctor({
            name: data.user.name || 'Profissional',
            specialty: data.user.specialty || 'Saúde',
            image: data.user.image
          });
        }
        
      } catch (error) {
        console.error('Erro ao carregar questionário:', error);
        setError('Não foi possível carregar o questionário.');
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchData();
  }, [params.userSlug, params.quizSlug]);

  // Navigate to next question with proper state management
  const nextQuestion = () => {
    if (!quiz || activeQuestionIndex >= quiz.questions.length - 1) return;
    
    // First set the transition state
    const container = quizRef.current;
    if (container) {
      container.style.height = `${container.offsetHeight}px`;
    }
    
    // Then update the active question
    setActiveQuestionIndex(prev => prev + 1);
    
    // Scroll handling
    if (quizRef.current) {
      quizRef.current.scrollTop = 0;
    }
  };

  // Navigate to previous question with proper state management
  const prevQuestion = () => {
    if (activeQuestionIndex <= 0) return;
    
    // First set the transition state
    const container = quizRef.current;
    if (container) {
      container.style.height = `${container.offsetHeight}px`;
    }
    
    // Then update the active question
    setActiveQuestionIndex(prev => prev - 1);
    
    // Scroll handling
    if (quizRef.current) {
      quizRef.current.scrollTop = 0;
    }
  };

  // Handle quiz answer updates with validation
  const handleQuizAnswer = (questionId: string, value: any) => {
    if (!quiz) return;
    
    // Encontrar a questão pelo ID
    const question = quiz.questions.find(q => q.id === questionId);
    if (!question) return;
    
    // Normalizar o valor com base no tipo da questão
    const normalizedValue = normalizeAnswerValue(value, question.type);
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: normalizedValue
    }));
  };

  // Check if current question is answered with proper validation
  const isCurrentQuestionAnswered = () => {
    if (!quiz) return false;
    const currentQuestion = quiz.questions[activeQuestionIndex];
    
    if (!currentQuestion.required) return true;
    
    const answer = answers[currentQuestion.id];
    
    // Type-specific validation
    switch (currentQuestion.type) {
      case 'text':
      case 'textarea':
        return typeof answer === 'string' && answer.trim().length > 0;
      case 'number':
        return typeof answer === 'number' || (typeof answer === 'string' && answer.trim().length > 0);
      case 'multiselect':
      case 'checkbox':
        return Array.isArray(answer) && answer.length > 0;
      case 'boolean':
        return typeof answer === 'boolean';
      default:
        return answer !== undefined && answer !== '';
    }
  };

  // Submit the quiz
  const submitQuiz = async () => {
    if (!quiz || !indicationId) {
      console.error('Quiz ou indicationId não encontrados:', { quiz, indicationId });
      setError('Dados do questionário incompletos.');
      return;
    }

    // Validar nome e telefone
    if (!name.trim() || !phone.trim()) {
      toast.error('Por favor, preencha seu nome e telefone.');
      return;
    }
    
    try {
      setIsSubmittingQuiz(true);
      console.log('Iniciando envio do questionário...', { indicationId, name, phone, answersCount: Object.keys(answers).length });
      
      // Prepare form data - include name, phone and quiz answers
      const formData = {
        indicationId,
        name: name.trim(),
        phone: phone.trim(),
        answers: Object.entries(answers).map(([questionId, value]) => {
          const question = quiz.questions.find(q => q.id === questionId);
          return {
            questionId,
            variableName: question?.variableName || '',
            value,
            questionType: question?.type || 'text',
            questionText: question?.text || ''
          };
        })
      };
      
      console.log('Enviando dados:', formData);
      
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      console.log('Resposta recebida:', { status: response.status });
      
      if (response.ok) {
        console.log('Questionário enviado com sucesso!');
        setSuccess(true);
      } else {
        const errorData = await response.json();
        console.error('Erro ao enviar questionário:', errorData);
        setError(errorData.error || 'Erro ao enviar questionário.');
        toast.error(errorData.error || 'Erro ao enviar questionário.');
      }
    } catch (error) {
      console.error('Erro ao enviar questionário:', error);
      setError('Ocorreu um erro ao enviar suas respostas. Por favor, tente novamente.');
      toast.error('Ocorreu um erro ao enviar suas respostas. Por favor, tente novamente.');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  // Loading state
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Error state
  if (error && !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Logo className="mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-600">Erro</h2>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 text-center">{error}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button 
              onClick={() => {
                setError('');
                window.location.reload();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Tentar novamente
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Success state after submission
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-slate-900 to-blue-900 py-6 px-4">
        <div className="container max-w-lg mx-auto">
          <Card className="shadow-2xl border-0 rounded-xl overflow-hidden bg-black/10 backdrop-blur-sm">
            <CardContent className="pt-10 pb-10 px-6 text-center">
              <div className="mx-auto mb-6 bg-green-500/10 p-3 rounded-full inline-flex">
                <CheckIcon className="h-12 w-12 text-green-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">
                {quiz?.completionScreen?.title || 'Questionário Enviado!'}
              </h2>
              
              <p className="text-blue-100/80 mb-8">
                {quiz?.completionScreen?.message || 'Suas respostas foram recebidas com sucesso. Obrigado por preencher o questionário.'}
              </p>
              
              {doctor && (
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-8">
                  <h3 className="text-sm font-medium text-blue-100/80 mb-2">Enviado para:</h3>
                  <div className="flex items-center justify-center">
                    {doctor.image ? (
                      <Image 
                        src={doctor.image} 
                        alt={doctor.name}
                        width={40}
                        height={40}
                        className="rounded-full mr-3"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-blue-500/10 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-300 font-semibold text-sm">
                          {doctor.name.substring(0, 1).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white">{doctor.name}</p>
                      <p className="text-sm text-blue-200/60">{doctor.specialty}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-center">
                {quiz?.completionScreen?.redirectUrl ? (
                  <Button 
                    className="bg-blue-500 hover:bg-blue-400 text-white transition-all rounded-lg px-6 shadow-md hover:shadow-blue-500/20"
                    onClick={() => window.location.href = quiz.completionScreen!.redirectUrl}
                  >
                    {quiz.completionScreen.redirectButtonText || 'Continuar'}
                  </Button>
                ) : (
                  <Button 
                    className="bg-blue-500 hover:bg-blue-400 text-white transition-all rounded-lg px-6 shadow-md hover:shadow-blue-500/20"
                    onClick={() => window.location.reload()}
                  >
                    Concluir
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Attribution footer */}
          <div className="text-center mt-4 text-xs text-blue-200/40 font-light">
            Made by <a href="https://med1.app" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-200/60 transition-colors">med1.app</a>
          </div>
        </div>
      </div>
    );
  }

  // Main quiz rendering
  return (
    <div className="min-h-screen bg-gradient-to-r from-slate-900 to-blue-900 py-6 px-4">
      <div className="container max-w-3xl mx-auto">
        {quiz ? (
          <Card className="shadow-2xl border-0 rounded-xl overflow-hidden bg-black/10 backdrop-blur-sm">
            <CardContent className="p-0">
              {activeQuestionIndex === -1 ? (
                // Opening Screen
                <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 md:p-10">
                  <div className="max-w-3xl w-full text-center space-y-8">
                    {/* Informações do profissional */}
                    {doctor && (
                      <div className="flex items-center justify-center gap-3 mb-8">
                        {doctor.image ? (
                          <Image 
                            src={doctor.image} 
                            alt={doctor.name}
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                            <span className="text-blue-300 font-semibold text-lg">
                              {doctor.name.substring(0, 1).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="text-left">
                          <p className="font-medium text-white text-lg">{doctor.name}</p>
                          <p className="text-blue-200/60">{doctor.specialty}</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                        {quiz.openingScreen?.title || quiz.name}
                      </h1>
                      {quiz.openingScreen?.subtitle && (
                        <p className="text-lg md:text-xl text-blue-100 font-light">
                          {quiz.openingScreen.subtitle}
                        </p>
                      )}
                    </div>
                    
                    {quiz.openingScreen?.description && (
                      <div className="prose prose-invert max-w-2xl mx-auto text-blue-100/80 text-base">
                        {quiz.openingScreen.description}
                      </div>
                    )}

                    {/* Campos de identificação na tela inicial */}
                    <div className="max-w-md mx-auto space-y-4 bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10">
                      <div>
                        <Label htmlFor="name" className="text-sm text-blue-100 mb-1.5 block">
                          Nome completo <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Digite seu nome"
                          className="bg-white/5 border-white/10 text-white placeholder:text-blue-200/30"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-sm text-blue-100 mb-1.5 block">
                          WhatsApp <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="(00) 00000-0000"
                          className="bg-white/5 border-white/10 text-white placeholder:text-blue-200/30"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-5 pt-6">
                      <Button
                        onClick={() => {
                          if (!name.trim() || !phone.trim()) {
                            toast.error('Por favor, preencha seu nome e WhatsApp para continuar');
                            return;
                          }
                          setActiveQuestionIndex(0);
                        }}
                        className="bg-blue-500 hover:bg-blue-400 text-white text-lg px-10 py-5 rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all duration-200 transform hover:translate-y-[-2px]"
                      >
                        {quiz.openingScreen?.startButtonText || 'Começar Questionário'}
                      </Button>

                      {(quiz.openingScreen?.showQuestionCount || quiz.openingScreen?.showTimeEstimate) && (
                        <div className="flex items-center gap-6 text-sm text-blue-200/70">
                          {quiz.openingScreen?.showQuestionCount && (
                            <div className="flex items-center gap-2">
                              <ClipboardList className="w-4 h-4" />
                              <span>{quiz.questions.length} perguntas</span>
                            </div>
                          )}
                          {quiz.openingScreen?.showTimeEstimate && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>~{Math.ceil(quiz.questions.length * 0.5)} minutos</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Questions
                <div className="p-5 md:p-6">
                  <Card className="w-full max-w-2xl mx-auto border-0 shadow-none bg-white/5 backdrop-blur-md rounded-xl overflow-hidden">
                    <div 
                      ref={quizRef}
                      className="max-h-[85vh] overflow-y-auto scrollbar-hide"
                      style={{ scrollBehavior: 'smooth' }}
                    >
                      <CardHeader className="pb-4 text-left space-y-2 border-b border-white/10">
                        <div className="flex items-center justify-between">
                          <h2 className="text-xl font-medium text-white tracking-tight">
                            {quiz?.name || 'Questionário'}
                          </h2>
                          <div className="text-sm text-blue-200/60">
                            {name}
                          </div>
                        </div>
                        
                        {quiz && quiz.questions.length > 0 && (
                          <div className="flex items-center gap-3 pt-2">
                            <div className="flex-1 h-1 bg-blue-900/30 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-400 transition-all duration-500 ease-out rounded-full"
                                style={{ 
                                  width: `${((activeQuestionIndex + 1) / quiz.questions.length) * 100}%`
                                }}
                              />
                            </div>
                            <div className="text-xs font-medium text-blue-200/60 tabular-nums">
                              {activeQuestionIndex + 1}/{quiz.questions.length}
                            </div>
                          </div>
                        )}
                      </CardHeader>
                      
                      <CardContent 
                        className="py-8 px-4 md:px-8"
                        style={{ 
                          minHeight: '350px',
                          perspective: '1000px'
                        }}
                      >
                        {quiz && quiz.questions.length > 0 ? (
                          <div className="flex-1 flex flex-col justify-center w-full relative">
                            {/* Questions container */}
                            <div 
                              className="relative w-full transition-all duration-500 ease-in-out"
                              style={{ 
                                minHeight: '250px',
                                transformStyle: 'preserve-3d'
                              }}
                            >
                              {/* Question rendering with 3D transitions */}
                              {quiz.questions.map((question, index) => {
                                // Adaptar a questão para o formato esperado pelo componente
                                const adaptedQuestion: RendererQuizQuestion = {
                                  id: question.id,
                                  text: question.text,
                                  type: question.type,
                                  required: question.required || false,
                                  variableName: question.variableName || `question_${question.id}`,
                                  options: Array.isArray(question.options) ? question.options as string[] : []
                                };
                                
                                return (
                                  <div 
                                    key={question.id} 
                                    className={`w-full absolute top-0 left-0 transition-all duration-500 ease-in-out ${
                                      index === activeQuestionIndex 
                                        ? 'opacity-100 translate-x-0 pointer-events-auto' 
                                        : index < activeQuestionIndex
                                          ? 'opacity-0 -translate-x-full pointer-events-none'
                                          : 'opacity-0 translate-x-full pointer-events-none'
                                    }`}
                                    style={{
                                      transform: `translate3d(${index === activeQuestionIndex ? 0 : index < activeQuestionIndex ? '-100%' : '100%'}, 0, 0)`,
                                      backfaceVisibility: 'hidden',
                                      WebkitBackfaceVisibility: 'hidden'
                                    }}
                                  >
                                    <div className="mb-8">
                                      <Label className="text-xl md:text-2xl text-white font-normal leading-relaxed block">
                                        {question.text}
                                        {question.required && <span className="text-red-400 ml-1 text-sm align-top">*</span>}
                                      </Label>
                                    </div>
                                    
                                    <div className="w-full transform-gpu">
                                      <div key={question.id} className={`${index !== activeQuestionIndex ? 'hidden' : ''}`}>
                                        <div className="mt-4">
                                          <QuestionRenderer
                                            question={adaptedQuestion}
                                            value={answers[question.id]}
                                            onChange={handleQuizAnswer}
                                            viewMode="answer"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-blue-200/50">Nenhuma pergunta disponível.</p>
                          </div>
                        )}
                      </CardContent>
                      
                      {quiz && quiz.questions.length > 0 && (
                        <CardFooter className="flex justify-between items-center py-4 px-8 border-t border-white/10">
                          <Button
                            variant="ghost"
                            className="text-blue-200/70 hover:text-white hover:bg-white/5 transition-all rounded-lg px-6"
                            disabled={activeQuestionIndex === 0}
                            onClick={prevQuestion}
                          >
                            ← Anterior
                          </Button>
                          
                          {activeQuestionIndex < quiz.questions.length - 1 ? (
                            <Button
                              className="bg-blue-500 hover:bg-blue-400 text-white transition-all rounded-lg px-6 shadow-md hover:shadow-blue-500/20"
                              onClick={nextQuestion}
                              disabled={!isCurrentQuestionAnswered()}
                            >
                              Próxima →
                            </Button>
                          ) : (
                            <Button
                              className="bg-green-500 hover:bg-green-400 text-white transition-all rounded-lg px-8 py-5 shadow-md hover:shadow-green-500/20 text-lg"
                              onClick={submitQuiz}
                              disabled={isSubmittingQuiz || !isCurrentQuestionAnswered()}
                            >
                              {isSubmittingQuiz ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  <span>Enviando...</span>
                                </div>
                              ) : (
                                'Enviar Respostas'
                              )}
                            </Button>
                          )}
                        </CardFooter>
                      )}
                    </div>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
        
        {/* Attribution footer */}
        <div className="text-center mt-4 text-xs text-blue-200/40 font-light">
          Made by <a href="https://med1.app" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-200/60 transition-colors">med1.app</a>
        </div>
      </div>
    </div>
  );
} 