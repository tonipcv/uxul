import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { generateValidVariableName } from '@/lib/helpers/quiz-validation';
import { useSession } from 'next-auth/react';

// Interfaces
interface QuizQuestion {
  id: string;
  type: string;
  text: string;
  required: boolean;
  options?: any[];
  variableName: string;
}

interface OpeningScreen {
  title: string;
  subtitle?: string;
  description?: string;
  startButtonText: string;
  showTimeEstimate: boolean;
  showQuestionCount: boolean;
}

interface CompletionScreen {
  title: string;
  message: string;
  redirectUrl?: string;
  redirectButtonText?: string;
}

interface Quiz {
  id: string;
  name: string;
  description?: string;
  isPublished: boolean;
  questions: QuizQuestion[];
  indications?: {
    id: string;
    name: string;
    slug: string;
    fullLink?: string;
  }[];
  openingScreen: OpeningScreen;
  completionScreen: CompletionScreen;
}

interface UseQuizEditorOptions {
  quizId: string;
  userId?: string;
}

interface UseQuizEditorReturn {
  quiz: Quiz;
  loading: boolean;
  saving: boolean;
  quizLink: string;
  linkCopied: boolean;
  hasChanges: boolean;
  updateQuiz: (data: Partial<Quiz>) => void;
  addQuestion: () => void;
  updateQuestion: (id: string, data: Partial<QuizQuestion>) => void;
  removeQuestion: (id: string) => void;
  moveQuestionUp: (index: number) => void;
  moveQuestionDown: (index: number) => void;
  saveQuiz: () => Promise<void>;
  copyLinkToClipboard: () => void;
}

export function useQuizEditor({ quizId, userId }: UseQuizEditorOptions): UseQuizEditorReturn {
  const { data: session } = useSession();
  const [quiz, setQuiz] = useState<Quiz>({
    id: quizId,
    name: 'Novo Questionário',
    description: '',
    isPublished: false,
    questions: [],
    openingScreen: {
      title: '',
      subtitle: '',
      description: '',
      startButtonText: 'Começar',
      showTimeEstimate: false,
      showQuestionCount: false
    },
    completionScreen: {
      title: 'Obrigado por participar!',
      message: 'Suas respostas foram registradas com sucesso.',
      redirectUrl: '',
      redirectButtonText: 'Concluir'
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quizLink, setQuizLink] = useState<string>('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [originalQuiz, setOriginalQuiz] = useState<Quiz | null>(null);
  
  // Verifica se há mudanças não salvas
  const hasChanges = useCallback(() => {
    if (!originalQuiz) return false;
    return JSON.stringify(originalQuiz) !== JSON.stringify(quiz);
  }, [originalQuiz, quiz]);
  
  // Carregar dados do quiz
  useEffect(() => {
    if (!userId) return;
    
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/quizzes/${quizId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            return;
          }
          throw new Error('Erro ao buscar quiz');
        }
        
        const data = await response.json();
        // Ensure openingScreen has all required fields
        const loadedQuiz = {
          ...data,
          openingScreen: {
            title: '',
            subtitle: '',
            description: '',
            startButtonText: 'Começar',
            showTimeEstimate: false,
            showQuestionCount: false,
            ...data.openingScreen
          },
          completionScreen: {
            title: 'Obrigado por participar!',
            message: 'Suas respostas foram registradas com sucesso.',
            redirectUrl: '',
            redirectButtonText: 'Concluir',
            ...data.completionScreen
          }
        };
        
        setQuiz(loadedQuiz);
        setOriginalQuiz(JSON.parse(JSON.stringify(loadedQuiz)));
      } catch (error) {
        console.error('Erro ao buscar quiz:', error);
        toast.error('Erro ao carregar o questionário');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuiz();
  }, [quizId, userId]);

  // Compute the doctor's link
  useEffect(() => {
    if (userId) {
      const userSlug = session?.user?.userSlug || userId;
      const slug = quiz.name ? quiz.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'questionario';
      
      let link = '';
      
      // Check if we have indications from the server
      if (quiz?.indications && quiz.indications.length > 0) {
        const indication = quiz.indications[0];
        // Use new dedicated quiz URL format
        link = indication.fullLink || `${window.location.protocol}//${window.location.host}/quiz/${userSlug}/${indication.slug}`;
      } else {
        // Fallback to a temporarily constructed link with the new format
        link = `${window.location.protocol}//${window.location.host}/quiz/${userSlug}/${slug}`;
      }
      
      setQuizLink(link);
    }
  }, [quiz.indications, quiz.name, userId, session]);

  // Atualizar quiz
  const updateQuiz = useCallback((data: Partial<Quiz>) => {
    setQuiz(prev => ({
      ...prev,
      ...data
    }));
  }, []);

  // Adicionar nova pergunta
  const addQuestion = useCallback(() => {
    const newQuestion: QuizQuestion = {
      id: `question-${Date.now()}`,
      type: 'text',
      text: 'Nova pergunta',
      required: true,
      variableName: `pergunta_${quiz.questions.length + 1}`,
      options: []
    };
    
    setQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  }, [quiz.questions.length]);

  // Atualizar uma pergunta
  const updateQuestion = useCallback((id: string, data: Partial<QuizQuestion>) => {
    // Se o texto mudou e não há variableName definido pelo usuário, gerar um automaticamente
    if (data.text && !data.variableName) {
      data.variableName = generateValidVariableName(data.text);
    }
    
    // Validar variableName
    if (data.variableName) {
      // Garantir formato válido
      data.variableName = data.variableName.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
    }
    
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === id ? { ...q, ...data } : q
      )
    }));
  }, []);

  // Remover uma pergunta
  const removeQuestion = useCallback((id: string) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }));
  }, []);

  // Mover pergunta para cima
  const moveQuestionUp = useCallback((index: number) => {
    if (index === 0) return;
    
    setQuiz(prev => {
      const newQuestions = [...prev.questions];
      [newQuestions[index], newQuestions[index - 1]] = [newQuestions[index - 1], newQuestions[index]];
      
      return {
        ...prev,
        questions: newQuestions
      };
    });
  }, []);

  // Mover pergunta para baixo
  const moveQuestionDown = useCallback((index: number) => {
    setQuiz(prev => {
      if (index === prev.questions.length - 1) return prev;
      
      const newQuestions = [...prev.questions];
      [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
      
      return {
        ...prev,
        questions: newQuestions
      };
    });
  }, []);

  // Salvar quiz
  const saveQuiz = useCallback(async () => {
    try {
      setSaving(true);
      console.log('Saving quiz with opening screen:', quiz.openingScreen);
      
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quiz.name,
          description: quiz.description,
          isPublished: quiz.isPublished,
          questions: quiz.questions,
          createIndicationIfMissing: true,
          openingScreen: {
            title: quiz.openingScreen.title || '',
            subtitle: quiz.openingScreen.subtitle || '',
            description: quiz.openingScreen.description || '',
            startButtonText: quiz.openingScreen.startButtonText || 'Começar',
            showTimeEstimate: quiz.openingScreen.showTimeEstimate || false,
            showQuestionCount: quiz.openingScreen.showQuestionCount || false
          },
          completionScreen: quiz.completionScreen || null
        })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao salvar questionário');
      }
      
      const updatedQuiz = await response.json();
      
      const newQuiz = {
        ...quiz,
        ...updatedQuiz,
        openingScreen: {
          ...quiz.openingScreen,
          ...updatedQuiz.openingScreen
        },
        completionScreen: {
          ...quiz.completionScreen,
          ...updatedQuiz.completionScreen
        }
      };
      
      setQuiz(newQuiz);
      setOriginalQuiz(JSON.parse(JSON.stringify(newQuiz)));
      
      toast.success('Questionário salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar questionário:', error);
      toast.error('Erro ao salvar questionário');
    } finally {
      setSaving(false);
    }
  }, [quiz, quizId]);

  const copyLinkToClipboard = useCallback(() => {
    if (quizLink) {
      navigator.clipboard.writeText(quizLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      toast.success('Link copiado para clipboard!');
    }
  }, [quizLink]);
  
  return {
    quiz,
    loading,
    saving,
    quizLink,
    linkCopied,
    hasChanges: hasChanges(),
    updateQuiz,
    addQuestion,
    updateQuestion,
    removeQuestion,
    moveQuestionUp,
    moveQuestionDown,
    saveQuiz,
    copyLinkToClipboard
  };
} 