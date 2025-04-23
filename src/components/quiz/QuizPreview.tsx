import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, MessageSquare, Clock } from 'lucide-react';
import { QuestionRenderer, QuizQuestion } from './QuestionRenderer';

interface OpeningScreen {
  title?: string;
  subtitle?: string;
  description?: string;
  startButtonText?: string;
  showTimeEstimate?: boolean;
  showQuestionCount?: boolean;
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
  openingScreen?: OpeningScreen;
  completionScreen: CompletionScreen;
}

interface QuizPreviewProps {
  quiz: Quiz;
  showOpeningScreen?: boolean;
  onChangeOpeningScreen?: () => void;
}

export function QuizPreview({ quiz, showOpeningScreen = false, onChangeOpeningScreen }: QuizPreviewProps) {
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [showingOpeningScreen, setShowingOpeningScreen] = useState(showOpeningScreen);
  const previewRef = useRef<HTMLDivElement>(null);

  // Reset quando o quiz muda
  useEffect(() => {
    setActiveQuestionIndex(0);
  }, [quiz.id]);

  // Atualizar estado local quando prop externa muda
  useEffect(() => {
    setShowingOpeningScreen(showOpeningScreen);
  }, [showOpeningScreen]);

  const nextQuestion = () => {
    if (activeQuestionIndex < quiz.questions.length - 1) {
      setActiveQuestionIndex(prev => prev + 1);
      // Scroll to top
      if (previewRef.current) {
        previewRef.current.scrollTop = 0;
      }
    }
  };

  const prevQuestion = () => {
    if (activeQuestionIndex > 0) {
      setActiveQuestionIndex(prev => prev - 1);
      // Scroll to top
      if (previewRef.current) {
        previewRef.current.scrollTop = 0;
      }
    }
  };

  const handleStartQuiz = () => {
    setShowingOpeningScreen(false);
    if (onChangeOpeningScreen) {
      onChangeOpeningScreen();
    }
  };

  // Função para renderizar a tela de abertura
  const renderOpeningScreen = () => {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-semibold">{quiz.openingScreen?.title || 'Bem-vindo ao Questionário'}</h2>
        
        {quiz.openingScreen?.subtitle && (
          <p className="mt-2 text-sm text-gray-600">{quiz.openingScreen.subtitle}</p>
        )}
        
        {quiz.openingScreen?.description && (
          <p className="mt-4 text-sm text-gray-700">{quiz.openingScreen.description}</p>
        )}
        
        <div className="mt-6">
          <Button 
            className="bg-blue-600"
            onClick={handleStartQuiz}
          >
            {quiz.openingScreen?.startButtonText || 'Começar'}
          </Button>
        </div>
        
        {quiz.openingScreen && (quiz.openingScreen.showQuestionCount || quiz.openingScreen.showTimeEstimate) && (
          <div className="mt-4 flex justify-center gap-3 text-xs text-gray-500">
            {quiz.openingScreen.showQuestionCount && (
              <div className="flex items-center">
                <MessageSquare className="h-3 w-3 mr-1" />
                {quiz.questions.length} perguntas
              </div>
            )}
            
            {quiz.openingScreen.showTimeEstimate && (
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {Math.max(1, Math.ceil(quiz.questions.length / 2))} min
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={previewRef} className="overflow-auto">
      <Card className="bg-white shadow-sm border border-gray-200">
        {showingOpeningScreen ? (
          renderOpeningScreen()
        ) : (
          <>
            <CardHeader className="pb-3 text-center">
              <CardTitle className="text-base font-medium">
                {quiz.name || 'Questionário de Triagem'}
              </CardTitle>
              {quiz.description && (
                <CardDescription className="text-xs mt-1">
                  {quiz.description}
                </CardDescription>
              )}
              {quiz.questions.length > 0 && (
                <div className="flex justify-between items-center mt-5 px-4">
                  <div className="text-xs font-medium text-gray-500">
                    Pergunta {activeQuestionIndex + 1} de {quiz.questions.length}
                  </div>
                  <div className="flex space-x-1">
                    {quiz.questions.map((_, i) => (
                      <div 
                        key={i}
                        className={`h-1.5 w-4 rounded-full transition-all duration-300 ${
                          i === activeQuestionIndex ? 'bg-blue-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-4">
              {quiz.questions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Adicione perguntas para visualizar o questionário</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {quiz.questions[activeQuestionIndex] && (
                    <>
                      <h3 className="text-xl font-medium text-gray-800">
                        {quiz.questions[activeQuestionIndex].text}
                        {quiz.questions[activeQuestionIndex].required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </h3>
                      
                      <div className="mt-4">
                        <QuestionRenderer 
                          question={quiz.questions[activeQuestionIndex]} 
                          disabled={true}
                          viewMode="preview"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>

            {quiz.questions.length > 0 && (
              <CardFooter className="flex justify-between items-center py-3 px-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeQuestionIndex === 0}
                  onClick={prevQuestion}
                  className="h-7 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Anterior
                </Button>
                
                {activeQuestionIndex < quiz.questions.length - 1 ? (
                  <Button
                    size="sm"
                    onClick={nextQuestion}
                    className="h-7 text-xs bg-blue-600"
                  >
                    Próxima
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-green-600"
                  >
                    Concluir
                  </Button>
                )}
              </CardFooter>
            )}
          </>
        )}
      </Card>
    </div>
  );
} 