'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from '@/components/ui/logo';
import { ShieldCheckIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Doctor {
  name: string;
  specialty: string;
  image: string | null;
}

interface Message {
  id: string;
  content: string;
  type: string;
  sender: string;
  isTyping?: boolean;
  inputType?: string;
  variableName?: string;
  placeholder?: string;
}

interface InputData {
  type: string;
  variableName?: string;
  placeholder?: string;
}

// New interfaces for quiz
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
}

export default function IndicationPage() {
  const params = useParams<{ userSlug: string, indicationSlug: string }>();
  const searchParams = useSearchParams();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Campos adicionais para chatbot
  const [isChatbot, setIsChatbot] = useState(() => {
    // Inicializar com base na URL ou localStorage
    if (typeof window === 'undefined') {
      // Se estamos no servidor, verificamos apenas pelo URL
      return params.indicationSlug?.includes('chatbot') || false;
    }
    // No cliente, podemos verificar o localStorage também
    return params.indicationSlug?.includes('chatbot') || localStorage.getItem('last_was_chatbot') === 'true' || false;
  });
  
  const [indicationId, setIndicationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatStarted, setChatStarted] = useState(true); // Começar com chat iniciado por padrão
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Novos campos para chatbot baseado em fluxo
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [currentInputData, setCurrentInputData] = useState<InputData>({ type: 'text' });

  // New quiz-related state
  const [isQuiz, setIsQuiz] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const quizRef = useRef<HTMLDivElement>(null);

  // Função para rolar para o final da conversa
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  // Mover addBotMessage para cá, antes de ser usada no useEffect
  const addBotMessage = useCallback((content: string) => {
    const messageId = `bot-${Date.now()}`;
    const botMessage: Message = {
      id: messageId,
      content,
      sender: 'bot',
      type: 'text',
      isTyping: true
    };
    setMessages(prev => [...prev, botMessage]);
    return messageId;
  }, []);

  // Efeito para scrollar quando chegam novas mensagens
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Se não é chatbot, remove verificação do localStorage
  useEffect(() => {
    if (!isChatbot && typeof window !== 'undefined') {
      localStorage.removeItem('last_was_chatbot');
    }
  }, [isChatbot]);

  // Função para iniciar/reiniciar a sessão de chatbot
  const startChatbotSession = async (indicationId: string) => {
    if (!indicationId) return false;
    
    // Verificar se já está carregando uma sessão
    if (initialLoading) return false;
    
    try {
      // Marcar como carregando para evitar múltiplas chamadas
      setInitialLoading(true);
      
      // Limpar mensagens antigas antes de iniciar nova sessão
      setMessages([]);
      setWaitingForInput(false);
      
      const startSessionResponse = await fetch('/api/chatbot-flows/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          indicationId: indicationId,
          variables: [] // Variáveis iniciais vazias
        }),
      });
      
      if (startSessionResponse.ok) {
        const sessionData = await startSessionResponse.json();
        console.log('Sessão de chatbot iniciada:', sessionData);
        
        // Guardar ID da sessão
        if (sessionData.sessionId) {
          setChatSessionId(sessionData.sessionId);
        }
        
        // Processar respostas iniciais - mostrar apenas a primeira mensagem
        if (sessionData.responses && Array.isArray(sessionData.responses) && sessionData.responses.length > 0) {
          const response = sessionData.responses[0];
          const botMessage: Message = {
            id: response.id || `bot-${Date.now()}-${Math.random()}`,
            content: response.content,
            type: response.type || 'text',
            sender: 'bot',
            isTyping: false, // No typing animation
            inputType: response.inputType,
            variableName: response.variableName,
            placeholder: response.placeholder
          };
          
          // Atualizar as mensagens com apenas uma mensagem
          setMessages([botMessage]);
          
          // Se for um input, configurar estado para esperar entrada
          if (response.type === 'input') {
            setWaitingForInput(true);
            setCurrentInputData({
              type: response.inputType || 'text',
              variableName: response.variableName,
              placeholder: response.placeholder
            });
          }
        }
        return true;
      } else {
        console.error('Erro ao iniciar sessão do chatbot:', await startSessionResponse.json());
        return false;
      }
    } catch (error) {
      console.error('Erro ao iniciar sessão de chatbot:', error);
      return false;
    } finally {
      // Sempre marcar como não carregando no final da operação
      setInitialLoading(false);
    }
  };

  // Buscar informações do médico e verificar se é chatbot
  useEffect(() => {
    // Verificar se estamos no navegador
    if (typeof window === 'undefined') return;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('checking_chatbot', 'true'); // Marcador para evitar flickering
    }
    
    const fetchDoctorInfo = async () => {
      try {
        setInitialLoading(true);
        const userSlugToFetch = params.userSlug || '';
        const indicationSlug = params.indicationSlug || '';
        
        if (!userSlugToFetch || !indicationSlug) return;
        
        // Verificar imediatamente o tipo de indicação e buscar dados iniciais
        const indicationResponse = await fetch(`/api/indications/${userSlugToFetch}/${indicationSlug}`);
        
        if (indicationResponse.ok) {
          const indicationData = await indicationResponse.json();
          
          // Verificar se é um quiz
          if (indicationData.isQuiz && indicationData.quiz) {
            console.log('Detectado quiz:', indicationData.quiz);
            setIsQuiz(true);
            setIsChatbot(false);
            setIndicationId(indicationData.id);
            setQuiz(indicationData.quiz);
            
            // Buscar dados do médico em paralelo
            fetch(`/api/users/${userSlugToFetch}`)
              .then(res => {
                if (res.ok) return res.json();
                throw new Error('Falha ao buscar dados do médico');
              })
              .then(data => {
                setDoctor(data);
              })
              .catch(err => console.error('Erro ao buscar médico:', err));
          }
          // Se for chatbot de fluxo, configurar com dados iniciais
          else if (indicationData.chatbotFlowId && indicationData.initialNodes) {
            console.log('Detectado chatbot de fluxo:', indicationData);
            setIsChatbot(true);
            setIsQuiz(false);
            setIndicationId(indicationData.id);
            setChatStarted(true);
            
            if (typeof window !== 'undefined') {
              localStorage.setItem('last_was_chatbot', 'true');
            }

            // Iniciar uma nova sessão com o chatbot usando a função centralizada
            if (!chatStarted) {
              await startChatbotSession(indicationData.id);
            }

            // Buscar dados do médico em paralelo
            fetch(`/api/users/${userSlugToFetch}`)
              .then(res => {
                if (res.ok) return res.json();
                throw new Error('Falha ao buscar dados do médico');
              })
              .then(data => {
                setDoctor(data);
                if (typeof window !== 'undefined') {
                  localStorage.setItem(`doctor_${userSlugToFetch}`, JSON.stringify(data));
                }
              })
              .catch(err => console.error('Erro ao buscar médico:', err));

          } else if (indicationData.chatbotConfig) { // Chatbot Legado (sem fluxo)
             console.log('Detectado chatbot legado:', indicationData);
             setIsChatbot(true);
             setIsQuiz(false);
             setIndicationId(indicationData.id);
             setChatStarted(true);
             
             if (typeof window !== 'undefined') {
               localStorage.setItem('last_was_chatbot', 'true');
             }
             
             // Adicionar mensagem de boas-vindas para modo antigo
             const greeting = indicationData.chatbotConfig?.greeting || 'Olá! Sou o assistente virtual. Como posso ajudar?';
             addBotMessage(greeting); // Usar a função addBotMessage para consistência
             
             // Buscar dados do médico em paralelo
             fetch(`/api/users/${userSlugToFetch}`)
               .then(res => {
                 if (res.ok) return res.json();
                 throw new Error('Falha ao buscar dados do médico');
               })
               .then(data => {
                 setDoctor(data);
                 if (typeof window !== 'undefined') {
                   localStorage.setItem(`doctor_${userSlugToFetch}`, JSON.stringify(data));
                 }
                 
                 // Atualizar a mensagem de boas-vindas se necessário
                 if (messages.length === 1 && messages[0].id.startsWith('bot-')) {
                   const updatedGreeting = indicationData.chatbotConfig?.greeting || 
                     `Olá! Sou o assistente virtual${data?.name ? ` do Dr. ${data.name}` : ''}.`;
                   
                   // Substituir a mensagem existente pelo ID conhecido
                   setMessages(prev => prev.map(m => m.id === messages[0].id ? { ...m, content: updatedGreeting, isTyping: true } : m));
                 }
               })
               .catch(err => console.error('Erro ao buscar médico:', err));

          } else {
            // Não é chatbot, carregar formulário padrão
            if (typeof window !== 'undefined') {
              localStorage.removeItem('last_was_chatbot');
            }
            setIsChatbot(false);
            
            // Buscar dados do médico
            const isClient = typeof window !== 'undefined';
            const cachedDoctor = isClient ? localStorage.getItem(`doctor_${userSlugToFetch}`) : null;
        if (cachedDoctor) {
          setDoctor(JSON.parse(cachedDoctor));
        }
        
        const response = await fetch(`/api/users/${userSlugToFetch}`);
        if (response.ok) {
          const data = await response.json();
          setDoctor(data);
              if (isClient) {
          localStorage.setItem(`doctor_${userSlugToFetch}`, JSON.stringify(data));
              }
            }
          }
        }
      } catch (error) {
        console.error('Erro ao buscar informações:', error);
      } finally {
        setInitialLoading(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('checking_chatbot');
        }
      }
    };

    fetchDoctorInfo();
  }, [params.userSlug, params.indicationSlug, addBotMessage]);

  const processBotResponses = useCallback(async (data: any) => {
    try {
      console.log('Processing bot responses:', data);
      if (data.messages && Array.isArray(data.messages)) {
        // Process only the first message, and set isTyping to false
        if (data.messages.length > 0) {
          const msg = data.messages[0];
          const messageType = msg.type || 'text';
          
          const botMessage: Message = {
            id: `bot-${Date.now()}-${Math.random()}`,
            content: msg.content,
            sender: 'bot',
            type: messageType,
            isTyping: false, // No typing animation
            inputType: msg.inputType,
            variableName: msg.variableName,
            placeholder: msg.placeholder
          };
          setMessages(prev => [...prev, botMessage]);
          
          // If this is an input message, set waiting for input
          if (messageType === 'input') {
            setWaitingForInput(true);
            setCurrentInputData({
              type: msg.inputType || 'text',
              variableName: msg.variableName,
              placeholder: msg.placeholder
            });
          }
        }
      }
    } catch (error) {
      console.error('Error processing bot responses:', error);
    }
  }, []);

  const handleSendMessage = useCallback(async (content: string, type: string = 'text') => {
    if (!content.trim()) return;
    
    try {
      setIsSendingMessage(true);
      
      // Add user message to chat
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        content: content.trim(),
        type,
        sender: 'user',
        isTyping: false
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Clear input
      setNewMessage('');
      setWaitingForInput(false);
      
      // Determinar a variável sendo preenchida (se houver)
      const variableToSend = waitingForInput ? currentInputData.variableName : undefined;

      // Send message to API (corrigindo a URL)
      const response = await fetch(`/api/chatbot-flows/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          indicationId: indicationId,
          sessionId: chatSessionId,
          message: content.trim(),
          variableName: variableToSend
        }),
      });

      if (!response.ok) {
          const errorData = await response.json();
          console.error('Erro ao enviar mensagem:', errorData);
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Atualizar o ID da sessão se necessário
      if (data.sessionId && !chatSessionId) {
        setChatSessionId(data.sessionId);
      }
      
      // Verificar se está esperando input
      if (data.waitingForInput !== undefined) {
        setWaitingForInput(data.waitingForInput);
      }
      
      // Processar apenas a primeira resposta do bot
      if (data.responses && Array.isArray(data.responses) && data.responses.length > 0) {
        const response = data.responses[0];
        const botMessage: Message = {
          id: response.id || `bot-${Date.now()}-${Math.random()}`,
          content: response.content,
          type: response.type || 'text',
          sender: 'bot',
          isTyping: false, // No typing animation
          inputType: response.inputType,
          variableName: response.variableName,
          placeholder: response.placeholder
        };
        setMessages(prev => [...prev, botMessage]);
        
        // Se for um input, configurar estado para esperar entrada
        if (response.type === 'input') {
          setCurrentInputData({
            type: response.inputType || 'text',
            variableName: response.variableName,
            placeholder: response.placeholder
          });
        }
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSendingMessage(false);
    }
  }, [indicationId, chatSessionId, currentInputData.variableName, waitingForInput]);

  // Add this function to handle quiz answers
  const handleQuizAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Add function to check if current question is answered
  const isCurrentQuestionAnswered = () => {
    if (!quiz || !quiz.questions[activeQuestionIndex]) return false;
    const currentQuestion = quiz.questions[activeQuestionIndex];
    return currentQuestion.required ? 
      !!answers[currentQuestion.id] : 
      true;
  };

  // Function to move to next question
  const nextQuestion = () => {
    if (quiz && activeQuestionIndex < quiz.questions.length - 1) {
      setActiveQuestionIndex(prev => prev + 1);
      // Scroll to top of quiz container
      if (quizRef.current) {
        quizRef.current.scrollTop = 0;
      }
    }
  };

  // Function to move to previous question
  const prevQuestion = () => {
    if (activeQuestionIndex > 0) {
      setActiveQuestionIndex(prev => prev - 1);
      // Scroll to top of quiz container
      if (quizRef.current) {
        quizRef.current.scrollTop = 0;
      }
    }
  };

  // Function to submit quiz
  const submitQuiz = async () => {
    if (!quiz || !indicationId) return;
    
    try {
      setIsSubmittingQuiz(true);
      
      const response = await fetch('/api/quiz-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: quiz.id,
          indicationId,
          name,
          phone,
          answers
        }),
      });
      
      if (response.ok) {
        setSuccess(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao enviar respostas');
      }
    } catch (error) {
      console.error('Erro ao enviar quiz:', error);
      setError('Erro ao enviar respostas. Tente novamente.');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  // Agora para a lógica de renderização, vamos priorizar chatbot
  if (initialLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white p-4 md:p-8">
        <div className="w-full max-w-3xl mx-auto text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Sempre mostrar interface de chat se for detectado como chatbot
  if (isChatbot) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white p-4 md:p-8">
        <div className="w-full max-w-3xl mx-auto">
          <div className="grid grid-cols-1 gap-6">
            <Card className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="pb-0 pt-6 px-6 flex items-center">
                <div className="flex items-center gap-3">
                  {doctor?.image ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <Image 
                        src={doctor.image} 
                        alt={doctor.name || 'Médico'} 
                        width={40} 
                        height={40}
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-xl font-light text-blue-600">
                      {doctor?.name?.charAt(0) || ''}
                    </div>
                  )}
                  <div>
                    <h2 className="text-sm font-medium text-gray-900">{doctor?.name || 'Assistente'}</h2>
                    <p className="text-xs text-gray-500">{doctor?.specialty || 'Assistente Virtual'}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {/* Interface do chat */}
                <>
                  <div className="h-[400px] overflow-y-auto p-4 space-y-4" id="chat-container">
                    {messages.length === 0 && !initialLoading ? (
                      <div className="text-center py-4">
                        <p className="text-gray-500 text-sm mb-3">Carregando conversa...</p>
                        <Button 
                          onClick={() => startChatbotSession(indicationId || '')}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs py-1 px-3"
                        >
                          Tentar novamente
                        </Button>
                      </div>
                    ) : (
                      messages.map((msg, index) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-lg p-3 ${
                            msg.sender === 'user' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            <div className="text-sm">
                              {/* Display message content directly without typing effect */}
                              {msg.content}
                              
                              {/* Exibir campo de input para nós do tipo input */}
                              {waitingForInput && index === messages.length - 1 && msg.type === 'input' && (
                                <div className="mt-2">
                                  <input
                                    type={msg.inputType || 'text'}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={msg.placeholder || "Digite sua resposta..."}
                                    className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white"
                                    disabled={isSendingMessage}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey && !isSendingMessage) {
                                        e.preventDefault();
                                        handleSendMessage(newMessage, msg.type);
                                      }
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Área de input */}
                  <div className="border-t border-gray-200 p-4">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        disabled={isSendingMessage}
                        className="text-gray-800 bg-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && !isSendingMessage) {
                            e.preventDefault();
                            handleSendMessage(newMessage, 'text');
                          }
                        }}
                      />
                      <Button 
                        onClick={() => handleSendMessage(newMessage, 'text')}
                        disabled={isSendingMessage || !newMessage.trim()}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        {isSendingMessage ? (
                          <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            <span>Enviando...</span>
                          </div>
                        ) : "Enviar"}
                      </Button>
                    </div>
                  </div>
                </>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6 text-center text-xs text-gray-400">
            Powered by <span className="text-blue-600 font-medium">med1.app</span>
          </div>
        </div>
      </div>
    );
  }

  // Add this to the return section, after the chatbot rendering but before the standard form
  if (isQuiz && quiz) {
    return (
      <div className="flex min-h-screen bg-gray-50 flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-100 p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-10">
          <div className="flex items-center">
            <Logo />
            <span className="ml-2 text-sm font-medium text-gray-600">Med1</span>
          </div>
          
          {doctor && (
            <div className="flex items-center">
              {doctor.image ? (
                <Image 
                  src={doctor.image} 
                  alt={doctor.name} 
                  width={32} 
                  height={32} 
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                  {doctor.name.substring(0, 1).toUpperCase()}
                </div>
              )}
              <div className="ml-2 text-right">
                <p className="text-sm font-medium">{doctor.name}</p>
                <p className="text-xs text-gray-500">{doctor.specialty}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Quiz Content */}
        <div className="flex-1 flex flex-col pt-20 pb-4 px-4 max-w-3xl mx-auto w-full">
          {/* Initial form for name and phone */}
          {!name || !phone ? (
            <Card className="w-full bg-white shadow-lg border-0 rounded-lg overflow-hidden">
              <CardHeader className="bg-blue-50 border-b border-blue-100 p-6">
                <h2 className="text-xl font-semibold text-gray-800">{quiz.name}</h2>
                {quiz.description && (
                  <p className="text-gray-600 mt-1 text-sm">{quiz.description}</p>
                )}
              </CardHeader>
              
              <CardContent className="p-6 space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-700">Seu nome completo *</Label>
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="Digite seu nome completo"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone" className="text-gray-700">Telefone/WhatsApp *</Label>
                    <Input 
                      id="phone" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="(DDD) 00000-0000"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="p-6 pt-2 flex justify-end">
                <Button 
                  onClick={() => {}} 
                  disabled={!name.trim() || !phone.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Continuar
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="w-full bg-white shadow-lg border-0 rounded-lg overflow-hidden flex-1">
              <CardHeader className="bg-blue-50 border-b border-blue-100 p-5">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">{quiz.name}</h2>
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    Pergunta {activeQuestionIndex + 1} de {quiz.questions.length}
                  </div>
                </div>
                <div className="flex space-x-1 mt-3">
                  {quiz.questions.map((_, i) => (
                    <div 
                      key={i}
                      className={`h-1.5 w-8 rounded-full ${i === activeQuestionIndex ? 'bg-blue-500' : (i < activeQuestionIndex ? 'bg-blue-300' : 'bg-gray-200')}`}
                    />
                  ))}
                </div>
              </CardHeader>
              
              <div 
                ref={quizRef}
                className="max-h-[calc(100vh-250px)] overflow-y-auto"
                style={{ scrollBehavior: 'smooth' }}
              >
                <CardContent className="p-6">
                  {quiz.questions.map((question, index) => (
                    <div 
                      key={question.id} 
                      className={`transition-all duration-300 ${index === activeQuestionIndex ? 'opacity-100' : 'hidden opacity-0'}`}
                    >
                      <div className="mb-6">
                        <Label className="text-gray-800 font-medium text-xl leading-relaxed">
                          {question.text}
                          {question.required && <span className="text-red-600 ml-1">*</span>}
                        </Label>
                      </div>
                      
                      <div className="mt-6">
                        {question.type === 'text' && (
                          <Input 
                            value={answers[question.id] || ''}
                            onChange={(e) => handleQuizAnswer(question.id, e.target.value)}
                            placeholder="Texto curto" 
                            className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400 p-4 text-lg"
                          />
                        )}
                        
                        {question.type === 'textarea' && (
                          <Textarea 
                            value={answers[question.id] || ''}
                            onChange={(e) => handleQuizAnswer(question.id, e.target.value)}
                            placeholder="Resposta detalhada" 
                            className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400 min-h-[150px] p-4 text-lg" 
                          />
                        )}
                        
                        {question.type === 'number' && (
                          <Input 
                            type="number" 
                            value={answers[question.id] || ''}
                            onChange={(e) => handleQuizAnswer(question.id, e.target.value)}
                            placeholder="0" 
                            className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400 p-4 text-lg" 
                          />
                        )}
                        
                        {question.type === 'select' && (
                          <Select onValueChange={(value) => handleQuizAnswer(question.id, value)}>
                            <SelectTrigger className="bg-white border-gray-300 text-gray-800 text-lg p-4 h-auto">
                              <SelectValue placeholder="Selecione uma opção" />
                            </SelectTrigger>
                            <SelectContent className="text-gray-800">
                              {(question.options || []).map((option, i) => (
                                <SelectItem key={i} value={option} className="text-gray-800 text-lg">
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        
                        {question.type === 'radio' && (
                          <RadioGroup 
                            className="space-y-3"
                            value={answers[question.id] || ''}
                            onValueChange={(value) => handleQuizAnswer(question.id, value)}
                          >
                            {(question.options || []).map((option, i) => (
                              <div 
                                key={i} 
                                className="flex items-center border border-gray-200 rounded-xl p-4 hover:bg-blue-50 hover:border-blue-200 transition-all duration-150 cursor-pointer"
                                onClick={() => handleQuizAnswer(question.id, option)}
                              >
                                <RadioGroupItem value={option} id={`${question.id}-option-${i}`} className="h-5 w-5 text-blue-600" />
                                <Label 
                                  htmlFor={`${question.id}-option-${i}`} 
                                  className="text-gray-800 font-normal cursor-pointer text-lg flex-1 ml-3"
                                >
                                  {option}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        )}
                        
                        {question.type === 'checkbox' && (
                          <div className="space-y-3">
                            {(question.options || []).map((option, i) => {
                              const checkedValues = answers[question.id] || [];
                              const isChecked = Array.isArray(checkedValues) && checkedValues.includes(option);
                              
                              return (
                                <div 
                                  key={i} 
                                  className="flex items-center border border-gray-200 rounded-xl p-4 hover:bg-blue-50 hover:border-blue-200 transition-all duration-150 cursor-pointer"
                                  onClick={() => {
                                    const currentValues = Array.isArray(answers[question.id]) 
                                      ? [...answers[question.id]] 
                                      : [];
                                    
                                    const newValues = isChecked
                                      ? currentValues.filter(v => v !== option)
                                      : [...currentValues, option];
                                    
                                    handleQuizAnswer(question.id, newValues);
                                  }}
                                >
                                  <Checkbox 
                                    id={`${question.id}-checkbox-${i}`} 
                                    checked={isChecked}
                                    className="h-5 w-5 text-blue-600" 
                                    onCheckedChange={() => {
                                      const currentValues = Array.isArray(answers[question.id]) 
                                        ? [...answers[question.id]] 
                                        : [];
                                      
                                      const newValues = isChecked
                                        ? currentValues.filter(v => v !== option)
                                        : [...currentValues, option];
                                      
                                      handleQuizAnswer(question.id, newValues);
                                    }}
                                  />
                                  <Label 
                                    htmlFor={`${question.id}-checkbox-${i}`} 
                                    className="text-gray-800 font-normal cursor-pointer text-lg flex-1 ml-3"
                                  >
                                    {option}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {question.type === 'date' && (
                          <Input 
                            type="date" 
                            value={answers[question.id] || ''}
                            onChange={(e) => handleQuizAnswer(question.id, e.target.value)}
                            className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400 p-4 text-lg" 
                          />
                        )}
                        
                        {question.type === 'boolean' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div 
                              className={`flex items-center border border-gray-200 rounded-xl p-4 hover:bg-blue-50 hover:border-blue-200 transition-all duration-150 cursor-pointer ${answers[question.id] === 'sim' ? 'bg-blue-50 border-blue-300' : ''}`}
                              onClick={() => handleQuizAnswer(question.id, 'sim')}
                            >
                              <RadioGroupItem value="sim" id={`${question.id}-sim`} checked={answers[question.id] === 'sim'} className="h-5 w-5 text-blue-600" />
                              <Label 
                                htmlFor={`${question.id}-sim`} 
                                className="text-gray-800 font-normal cursor-pointer text-lg flex-1 ml-3"
                              >
                                Sim
                              </Label>
                            </div>
                            <div 
                              className={`flex items-center border border-gray-200 rounded-xl p-4 hover:bg-blue-50 hover:border-blue-200 transition-all duration-150 cursor-pointer ${answers[question.id] === 'nao' ? 'bg-blue-50 border-blue-300' : ''}`}
                              onClick={() => handleQuizAnswer(question.id, 'nao')}
                            >
                              <RadioGroupItem value="nao" id={`${question.id}-nao`} checked={answers[question.id] === 'nao'} className="h-5 w-5 text-blue-600" />
                              <Label 
                                htmlFor={`${question.id}-nao`} 
                                className="text-gray-800 font-normal cursor-pointer text-lg flex-1 ml-3"
                              >
                                Não
                              </Label>
                            </div>
                          </div>
                        )}
                        
                        {question.type === 'scale' && (
                          <div className="flex flex-wrap gap-3 justify-center mt-4">
                            {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                              <Button
                                key={num}
                                type="button"
                                variant="outline" 
                                onClick={() => handleQuizAnswer(question.id, num)}
                                className={`h-14 w-14 rounded-full ${answers[question.id] === num 
                                  ? 'bg-blue-50 border-blue-400 text-blue-600' 
                                  : 'bg-white border-gray-200 text-gray-800'} 
                                  hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 text-lg font-medium transition-all`}
                              >
                                {num}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </div>
              
              <CardFooter className="flex justify-between p-5 border-t border-gray-100 bg-white sticky bottom-0">
                <Button
                  variant="outline"
                  onClick={prevQuestion}
                  disabled={activeQuestionIndex === 0}
                  className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Anterior
                </Button>
                
                {activeQuestionIndex < quiz.questions.length - 1 ? (
                  <Button
                    onClick={nextQuestion}
                    disabled={!isCurrentQuestionAnswered()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Próxima
                  </Button>
                ) : (
                  <Button
                    onClick={submitQuiz}
                    disabled={!isCurrentQuestionAnswered() || isSubmittingQuiz}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isSubmittingQuiz ? 'Enviando...' : 'Enviar Respostas'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Formulário padrão de indicação
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!name || !phone) {
      setError('Por favor, preencha todos os campos obrigatórios');
      setIsLoading(false);
      return;
    }

    try {
      // Verificar se estamos no navegador
      const isClient = typeof window !== 'undefined';
      
      // Capturar parâmetros UTM da URL
      const utmSource = searchParams.get('utm_source') || (isClient && localStorage.getItem('utm_source')) || 'direct';
      const utmMedium = searchParams.get('utm_medium') || (isClient && localStorage.getItem('utm_medium')) || '';
      const utmCampaign = searchParams.get('utm_campaign') || (isClient && localStorage.getItem('utm_campaign')) || '';
      const utmTerm = searchParams.get('utm_term') || (isClient && localStorage.getItem('utm_term')) || '';
      const utmContent = searchParams.get('utm_content') || (isClient && localStorage.getItem('utm_content')) || '';
      
      // Salvar os parâmetros UTM no localStorage para persistência
      if (isClient) {
        if (searchParams.get('utm_source')) localStorage.setItem('utm_source', utmSource);
        if (searchParams.get('utm_medium')) localStorage.setItem('utm_medium', utmMedium);
        if (searchParams.get('utm_campaign')) localStorage.setItem('utm_campaign', utmCampaign);
        if (searchParams.get('utm_term')) localStorage.setItem('utm_term', utmTerm);
        if (searchParams.get('utm_content')) localStorage.setItem('utm_content', utmContent);
      }
      
      // Manter o campo source para compatibilidade
      let source = utmSource;
      if (utmMedium) source += `_${utmMedium}`;
      if (utmCampaign) source += `_${utmCampaign}`;

      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          userSlug: params.userSlug,
          indicationSlug: params.indicationSlug,
          source,
          utmSource,
          utmMedium,
          utmCampaign,
          utmTerm,
          utmContent
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao enviar seus dados');
      }

      setSuccess(true);
      
      // Limpar os parâmetros UTM após conversão bem-sucedida
      if (isClient) {
        localStorage.removeItem('utm_source');
        localStorage.removeItem('utm_medium');
        localStorage.removeItem('utm_campaign');
        localStorage.removeItem('utm_term');
        localStorage.removeItem('utm_content');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao enviar seus dados');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4 md:p-8">
        <div className="w-full max-w-3xl mx-auto">
          <div className="grid grid-cols-1 gap-6">
            <Card className="bg-white border-0 shadow-sm rounded-xl overflow-hidden">
              <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <h2 className="text-xl font-medium tracking-wide text-gray-800">Obrigado!</h2>
                <p className="text-gray-600">
                  {doctor?.name ? `${doctor.name} receberá seus dados` : 'Seus dados foram enviados'} e entrará em contato em breve.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6 text-center text-xs text-gray-400">
            Powered by <span className="text-turquoise font-medium">med1.app</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white p-4 md:p-8">
      <div className="w-full max-w-4xl mx-auto">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Doctor Profile Card - Span 1 column on mobile, 1 column on desktop */}
          <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden md:col-span-1">
            <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
              {doctor?.image ? (
                <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-100 shadow-sm">
                  <Image 
                    src={doctor.image} 
                    alt={doctor.name || 'Médico'} 
                    width={96} 
                    height={96}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center text-3xl font-light text-blue-700">
                  {doctor?.name?.charAt(0) || ''}
                </div>
              )}
              
              <div className="text-center">
                <h2 className="text-xl font-medium text-gray-800 flex items-center justify-center gap-1">
                  {doctor?.name || 'Carregando...'}
                  <CheckCircleSolid className="h-5 w-5 text-blue-500" />
                </h2>
                <p className="text-sm font-medium text-gray-600">
                  {doctor?.specialty || ''}
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Welcome Message Card - Span 1 column on mobile, 2 columns on desktop */}
          <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden md:col-span-2">
            <CardContent className="p-6">
              <div className="bg-blue-50 p-5 rounded-xl">
                <h3 className="text-xl font-medium text-gray-800 mb-2">Bem-vindo!</h3>
                <p className="text-gray-600">
                  {doctor?.name 
                    ? `${doctor.name} te convidou para agendar sua avaliação gratuita` 
                    : 'Você foi convidado para agendar sua avaliação gratuita'}
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Form Card - Span full width */}
          <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden md:col-span-3">
            <CardHeader className="pb-0 pt-6 px-6">
              <h3 className="text-lg font-medium text-gray-800">Agende sua avaliação</h3>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-gray-600">Nome</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="border-gray-200 focus:border-blue-700 focus:ring-blue-50 text-gray-800 placeholder:text-gray-500"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-gray-600">Telefone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="border-gray-200 focus:border-blue-700 focus:ring-blue-50 text-gray-800 placeholder:text-gray-500"
                    />
                  </div>
                </div>
                
                {error && (
                  <div className="text-red-500 text-sm bg-red-50 py-2 px-3 rounded">{error}</div>
                )}
                
                {/* Mensagem LGPD */}
                <div className="flex items-start space-x-2 text-xs text-gray-500 bg-gray-50 p-3 rounded">
                  <ShieldCheckIcon className="h-4 w-4 flex-shrink-0 text-blue-700" />
                  <span>Seus dados estão protegidos de acordo com a LGPD (Lei Geral de Proteção de Dados) e serão utilizados apenas para contato.</span>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-medium h-11 transition-colors"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </span>
                  ) : 'Agendar Avaliação'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-400">
          Powered by <span className="text-blue-700 font-medium">med1.app</span>
        </div>
      </div>
    </div>
  );
} 