'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Save, 
  ArrowLeft, 
  FileQuestion, 
  PlusCircle,
  Link,
  Copy,
  ExternalLink,
  Layout,
  MessageSquare,
  CheckSquare,
  Check,
  Eye,
  Trash,
  MoveUp,
  MoveDown,
  ChevronRight,
  ChevronLeft,
  Clock
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

// Importação dos novos componentes
import { QuizPreview } from '@/components/quiz/QuizPreview';
import { QuestionEditor } from '@/components/quiz/QuestionEditor';
import { useQuizEditor } from '@/hooks/useQuizEditor';
import { validateQuestion, generateValidVariableName, normalizeQuestionOptions } from "@/lib/helpers/quiz-validation";
import { QuestionType } from "@/types/quiz";
import { QuestionRenderer } from '@/components/quiz/QuestionRenderer';

// Interface para a questão do questionário (já existe no useQuizEditor, mas precisamos aqui também)
interface QuizQuestion {
  id: string;
  type: string;
  text: string;
  required: boolean;
  options?: any[];
  variableName: string;
}

// Definição dos tipos de perguntas disponíveis
const QUESTION_TYPES = [
  { value: 'text', label: 'Texto Curto' },
  { value: 'textarea', label: 'Texto Longo' },
  { value: 'number', label: 'Número' },
  { value: 'select', label: 'Escolha Única' },
  { value: 'multiselect', label: 'Múltipla Escolha' },
  { value: 'radio', label: 'Opções (Radio)' },
  { value: 'checkbox', label: 'Caixas de Seleção' },
  { value: 'scale', label: 'Escala (1-10)' },
  { value: 'date', label: 'Data' },
  { value: 'boolean', label: 'Sim/Não' },
];

type EditorSection = 'opening' | 'questions' | 'completion';

// Função para renderizar a tela de abertura
function renderOpeningScreen(quiz: any) {
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
        <Button className="bg-blue-600">
          {quiz.openingScreen?.startButtonText || 'Começar'}
        </Button>
      </div>
      
      {(quiz.openingScreen?.showQuestionCount || quiz.openingScreen?.showTimeEstimate) && (
        <div className="mt-4 flex justify-center gap-3 text-xs text-gray-500">
          {quiz.openingScreen?.showQuestionCount && (
            <div className="flex items-center">
              <MessageSquare className="h-3 w-3 mr-1" />
              {quiz.questions.length} perguntas
            </div>
          )}
          
          {quiz.openingScreen?.showTimeEstimate && (
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {Math.max(1, Math.ceil(quiz.questions.length / 2))} min
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function QuizEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  
  // Usando o hook personalizado
  const { 
    quiz, 
    loading, 
    saving, 
    quizLink,
    linkCopied,
    hasChanges,
    updateQuiz,
    addQuestion,
    updateQuestion, 
    removeQuestion,
    moveQuestionUp,
    moveQuestionDown,
    saveQuiz,
    copyLinkToClipboard
  } = useQuizEditor({ 
    quizId: id as string, 
    userId: session?.user?.id 
  });
  
  const [activeSection, setActiveSection] = useState<EditorSection>('questions');
  const [showPreview, setShowPreview] = useState(true);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // Funções para navegar entre as perguntas na visualização
  const nextQuestion = () => {
    if (activeQuestionIndex < quiz.questions.length - 1) {
      setActiveQuestionIndex(activeQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (activeQuestionIndex > 0) {
      setActiveQuestionIndex(activeQuestionIndex - 1);
    }
  };

  // Confirmar antes de sair se houver mudanças não salvas
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasChanges]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50 text-gray-800 pt-16 pb-8">
      <div className="container mx-auto px-4 max-w-[1500px]">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,350px] gap-4 h-[calc(100vh-7rem)]">
          {/* Editor Section */}
          <div className="overflow-y-auto">
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
              <div>
                <h1 className="text-base font-semibold text-gray-800">Editor de Questionário</h1>
              </div>
              <div className="w-full md:w-auto mt-2 md:mt-0 flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline"
                  onClick={() => router.push('/dashboard/quizzes')}
                  className="h-8 px-3 text-xs bg-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                  Voltar
                </Button>
                <Button 
                  onClick={saveQuiz}
                  disabled={saving}
                  className="h-8 px-3 text-xs bg-blue-600"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
            
            {/* Quiz Name Edit Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <Label htmlFor="quiz-name" className="text-sm font-medium text-gray-700 mb-1 block">
                    Nome do Questionário
                  </Label>
                  <Input 
                    id="quiz-name"
                    value={quiz.name || ''}
                    onChange={(e) => updateQuiz({ name: e.target.value })}
                    placeholder="Digite o nome do questionário"
                    className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    O nome será usado para identificar o questionário e gerar o link para compartilhamento
                  </p>
                </div>

                <div className="flex-1">
                  <Label htmlFor="quiz-description" className="text-sm font-medium text-gray-700 mb-1 block">
                    Descrição
                  </Label>
                  <Input 
                    id="quiz-description"
                    value={quiz.description || ''}
                    onChange={(e) => updateQuiz({ description: e.target.value })}
                    placeholder="Ex: Triagem inicial para pacientes"
                    className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Uma breve descrição que aparecerá abaixo do título do questionário
                  </p>
                </div>

                <div className="w-full md:w-auto">
                  <Label htmlFor="quiz-status" className="text-sm font-medium text-gray-700 mb-1 block">
                    Status
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="quiz-status"
                      checked={quiz.isPublished}
                      onCheckedChange={(checked) => updateQuiz({ isPublished: checked })}
                    />
                    <span className={`text-sm ${quiz.isPublished ? 'text-green-600' : 'text-gray-500'}`}>
                      {quiz.isPublished ? 'Publicado' : 'Rascunho'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quiz Link Section */}
            {quizLink && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-sm">
                <div className="flex items-center flex-wrap">
                  <Link className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-800">Link do Questionário:</span>
                  <span className="ml-2 font-mono text-xs md:text-sm text-blue-700 border border-blue-200 bg-white px-3 py-1 rounded-md max-w-sm truncate">
                    {quizLink}
                  </span>
                  {!quiz.isPublished && (
                    <span className="ml-2 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                      Publicar questionário para ativar o link
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyLinkToClipboard}
                    className="h-8 bg-white border-blue-200 text-blue-700 hover:bg-blue-100"
                  >
                    {linkCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1.5" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        Copiar Link
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!quiz.isPublished}
                    onClick={() => window.open(quizLink, '_blank')}
                    className={`h-8 bg-white border-blue-200 ${quiz.isPublished ? 'text-blue-700 hover:bg-blue-100' : 'text-gray-400 cursor-not-allowed'}`}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Abrir
                  </Button>
                </div>
                <div className="w-full md:w-auto text-xs text-gray-500 italic">
                  Formato: /quiz/[seu-username]/{quiz?.indications && quiz.indications.length > 0 ? quiz.indications[0].slug : 'quiz-slug'}
                </div>
              </div>
            )}

            {/* Navigation Menu */}
            <div className="mb-4">
              <nav className="bg-white rounded-lg border border-gray-200 p-1 flex space-x-1">
                <Button
                  variant={activeSection === 'opening' ? 'default' : 'ghost'}
                  className="flex-1 justify-center h-8 text-xs rounded-md"
                  onClick={() => setActiveSection('opening')}
                >
                  <Layout className="h-3.5 w-3.5 mr-1.5" />
                  Tela de Abertura
                </Button>
                <Button
                  variant={activeSection === 'questions' ? 'default' : 'ghost'}
                  className="flex-1 justify-center h-8 text-xs rounded-md"
                  onClick={() => setActiveSection('questions')}
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                  Perguntas
                </Button>
                <Button
                  variant={activeSection === 'completion' ? 'default' : 'ghost'}
                  className="flex-1 justify-center h-8 text-xs rounded-md"
                  onClick={() => setActiveSection('completion')}
                >
                  <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                  Tela de Conclusão
                </Button>
              </nav>
            </div>

            {/* Main Content Area */}
            <div className="space-y-4">
              {activeSection === 'opening' && (
                <Card className="bg-white shadow-sm border border-gray-200">
                  <CardHeader className="pb-3 space-y-1">
                    <CardTitle className="text-sm font-medium">Tela de Abertura</CardTitle>
                    <CardDescription className="text-xs">Configure a primeira tela que seus usuários verão</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-2">
                      <Label htmlFor="opening-title" className="text-gray-700">Título de Boas-vindas</Label>
                      <Input 
                        id="opening-title"
                        value={quiz.openingScreen?.title || ''}
                        onChange={(e) => updateQuiz({ 
                          openingScreen: { 
                            ...quiz.openingScreen || {},
                            title: e.target.value 
                          } 
                        })}
                        placeholder="Ex: Bem-vindo ao Questionário de Felicidade"
                        className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="opening-subtitle" className="text-gray-700">Subtítulo</Label>
                      <Input 
                        id="opening-subtitle"
                        value={quiz.openingScreen?.subtitle || ''}
                        onChange={(e) => updateQuiz({ 
                          openingScreen: { 
                            ...quiz.openingScreen || {},
                            subtitle: e.target.value 
                          } 
                        })}
                        placeholder="Ex: Vamos começar sua jornada para o bem-estar"
                        className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="opening-description" className="text-gray-700">Descrição Detalhada</Label>
                      <Textarea 
                        id="opening-description"
                        value={quiz.openingScreen?.description || ''}
                        onChange={(e) => updateQuiz({ 
                          openingScreen: { 
                            ...quiz.openingScreen || {},
                            description: e.target.value 
                          } 
                        })}
                        placeholder="Explique o propósito do questionário e o que o participante pode esperar"
                        className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400 min-h-[100px]"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="start-button-text" className="text-gray-700">Texto do Botão Iniciar</Label>
                      <Input 
                        id="start-button-text"
                        value={quiz.openingScreen?.startButtonText || ''}
                        onChange={(e) => updateQuiz({ 
                          openingScreen: { 
                            ...quiz.openingScreen || {},
                            startButtonText: e.target.value 
                          } 
                        })}
                        placeholder="Ex: Começar Questionário"
                        className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-gray-700">Elementos Adicionais</Label>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="show-time-estimate"
                            checked={quiz.openingScreen?.showTimeEstimate || false}
                            onCheckedChange={(checked) => updateQuiz({ 
                              openingScreen: { 
                                ...quiz.openingScreen,
                                showTimeEstimate: Boolean(checked)
                              } 
                            })}
                          />
                          <Label htmlFor="show-time-estimate" className="text-sm text-gray-600">
                            Mostrar tempo estimado de conclusão
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="show-question-count"
                            checked={quiz.openingScreen?.showQuestionCount || false}
                            onCheckedChange={(checked) => updateQuiz({ 
                              openingScreen: { 
                                ...quiz.openingScreen,
                                showQuestionCount: Boolean(checked)
                              } 
                            })}
                          />
                          <Label htmlFor="show-question-count" className="text-sm text-gray-600">
                            Mostrar número total de perguntas
                          </Label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeSection === 'questions' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h2 className="text-sm font-medium text-gray-800">Perguntas</h2>
                    <Button
                      onClick={addQuestion}
                      className="h-8 px-3 text-xs bg-green-600"
                    >
                      <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                      Adicionar Pergunta
                    </Button>
                  </div>
                  
                  {quiz.questions.length === 0 ? (
                    <div className="text-center p-8 border border-dashed border-gray-300 rounded-lg bg-white">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                        <FileQuestion className="h-8 w-8 text-gray-500" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-700 mb-1">Nenhuma pergunta adicionada</h3>
                      <p className="text-sm text-gray-500 mb-4">Comece adicionando perguntas ao seu questionário</p>
                      <Button
                        onClick={addQuestion}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Adicionar Primeira Pergunta
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {quiz.questions.map((question, index) => (
                        <Card key={question.id} className="bg-white shadow-sm border border-gray-200">
                          <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                            <div>
                              <CardTitle className="text-sm font-medium">Pergunta {index + 1}</CardTitle>
                              <CardDescription className="text-xs">
                                {QUESTION_TYPES.find(t => t.value === question.type)?.label || 'Texto'}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveQuestionUp(index)}
                                disabled={index === 0}
                                className="h-8 w-8 rounded-full hover:bg-gray-100 text-gray-600"
                              >
                                <MoveUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => moveQuestionDown(index)}
                                disabled={index === quiz.questions.length - 1}
                                className="h-8 w-8 rounded-full hover:bg-gray-100 text-gray-600"
                              >
                                <MoveDown className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeQuestion(question.id)}
                                className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-700"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4 pt-0">
                            <div className="space-y-2">
                              <Label htmlFor={`question-${question.id}-text`} className="text-gray-700">Texto da Pergunta</Label>
                              <Textarea
                                id={`question-${question.id}-text`}
                                value={question.text}
                                onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                                placeholder="Digite sua pergunta aqui"
                                className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400"
                              />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`question-${question.id}-type`} className="text-gray-700">Tipo de Resposta</Label>
                                <Select
                                  value={question.type}
                                  onValueChange={(value) => updateQuestion(question.id, { type: value })}
                                >
                                  <SelectTrigger className="bg-white border-gray-300 text-gray-800">
                                    <SelectValue placeholder="Selecione o tipo" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white border-gray-200 text-gray-800">
                                    {QUESTION_TYPES.map((type) => (
                                      <SelectItem key={type.value} value={type.value} className="focus:bg-gray-100 focus:text-gray-800">
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor={`question-${question.id}-var`} className="text-gray-700">Nome da Variável</Label>
                                <Input
                                  id={`question-${question.id}-var`}
                                  value={question.variableName || ''}
                                  onChange={(e) => updateQuestion(question.id, { variableName: e.target.value })}
                                  placeholder="Ex: nome_paciente, idade, sintoma"
                                  className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400"
                                />
                              </div>
                            </div>
                            
                            {/* Campo de opções para perguntas de múltipla escolha */}
                            {['select', 'multiselect', 'radio', 'checkbox'].includes(question.type) && (
                              <div className="space-y-3">
                                <Label htmlFor={`question-${question.id}-options`} className="text-gray-700">
                                  Opções
                                  <span className="block text-xs text-gray-500 mt-1">
                                    Adicione as opções do seu questionário abaixo
                                  </span>
                                </Label>
                                
                                <div className="flex items-center">
                                  <Input
                                    id={`question-${question.id}-options-input`}
                                    placeholder="Digite uma nova opção"
                                    className="mr-2 border-gray-300 text-gray-800 placeholder:text-gray-400"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        
                                        const input = e.currentTarget;
                                        const newOption = input.value.trim();
                                        
                                        if (newOption) {
                                          const currentOptions = [...(question.options || [])];
                                          currentOptions.push(newOption);
                                          
                                          updateQuestion(question.id, { 
                                            options: currentOptions
                                          });
                                          
                                          input.value = '';
                                        }
                                      }
                                    }}
                                  />
                                  <Button 
                                    type="button"
                                    onClick={(e) => {
                                      const input = document.getElementById(`question-${question.id}-options-input`) as HTMLInputElement;
                                      const newOption = input.value.trim();
                                      
                                      if (newOption) {
                                        const currentOptions = [...(question.options || [])];
                                        currentOptions.push(newOption);
                                        
                                        updateQuestion(question.id, { 
                                          options: currentOptions
                                        });
                                        
                                        input.value = '';
                                        input.focus();
                                      }
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    Adicionar Opção
                                  </Button>
                                </div>
                                
                                {question.options && question.options.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-500 mb-1">Opções adicionadas:</p>
                                    <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                                      <ul className="text-sm space-y-1">
                                        {question.options.map((option, i) => (
                                          <li key={i} className="flex items-center justify-between text-gray-700 px-2 py-1 rounded hover:bg-gray-100">
                                            <span>{option}</span>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                const updatedOptions = [...question.options!];
                                                updatedOptions.splice(i, 1);
                                                updateQuestion(question.id, { options: updatedOptions });
                                              }}
                                              className="h-6 w-6 p-0 rounded-full hover:bg-red-100 hover:text-red-600"
                                            >
                                              <Trash className="h-3.5 w-3.5" />
                                            </Button>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={question.required}
                                onCheckedChange={(value) => updateQuestion(question.id, { required: value })}
                                id={`question-${question.id}-required`}
                              />
                              <Label htmlFor={`question-${question.id}-required`} className="text-sm text-gray-700">
                                Resposta obrigatória
                              </Label>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'completion' && (
                <Card className="bg-white shadow-sm border border-gray-200">
                  <CardHeader className="pb-3 space-y-1">
                    <CardTitle className="text-sm font-medium">Tela de Conclusão</CardTitle>
                    <CardDescription className="text-xs">Configure a mensagem final após o preenchimento</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-2">
                      <Label htmlFor="completion-title" className="text-gray-700">Título de Conclusão</Label>
                      <Input 
                        id="completion-title"
                        value={quiz.completionScreen?.title || ''}
                        onChange={(e) => {
                          const newCompletionScreen = {
                            ...quiz.completionScreen,
                            title: e.target.value
                          };
                          updateQuiz({ completionScreen: newCompletionScreen });
                        }}
                        placeholder="Ex: Obrigado por Participar!"
                        className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="completion-message" className="text-gray-700">Mensagem de Conclusão</Label>
                      <Textarea 
                        id="completion-message"
                        value={quiz.completionScreen?.message || ''}
                        onChange={(e) => {
                          const newCompletionScreen = {
                            ...quiz.completionScreen,
                            message: e.target.value
                          };
                          updateQuiz({ completionScreen: newCompletionScreen });
                        }}
                        placeholder="Ex: Suas respostas foram registradas com sucesso. Entraremos em contato em breve."
                        className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400 min-h-[100px]"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="redirect-url" className="text-gray-700">URL de Redirecionamento (opcional)</Label>
                      <Input 
                        id="redirect-url"
                        value={quiz.completionScreen?.redirectUrl || ''}
                        onChange={(e) => {
                          const newCompletionScreen = {
                            ...quiz.completionScreen,
                            redirectUrl: e.target.value
                          };
                          updateQuiz({ completionScreen: newCompletionScreen });
                        }}
                        placeholder="Ex: https://seu-site.com/agradecimento"
                        className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="redirect-button-text" className="text-gray-700">Texto do Botão de Redirecionamento</Label>
                      <Input 
                        id="redirect-button-text"
                        value={quiz.completionScreen?.redirectButtonText || ''}
                        onChange={(e) => {
                          const newCompletionScreen = {
                            ...quiz.completionScreen,
                            redirectButtonText: e.target.value
                          };
                          updateQuiz({ completionScreen: newCompletionScreen });
                        }}
                        placeholder="Ex: Voltar para o Site"
                        className="bg-white border-gray-300 text-gray-800 placeholder:text-gray-400"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Preview Section */}
          <div className="hidden lg:block border-l border-gray-200 bg-white overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="p-3 border-b border-gray-200 bg-white flex items-center justify-between">
                <h2 className="text-xs font-medium text-gray-700">Pré-visualização</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="h-7 w-7 p-0"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <div className="p-3">
                  <Card className="bg-white shadow-sm border border-gray-100">
                    {activeSection === 'opening' ? (
                      renderOpeningScreen(quiz)
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
                                    {renderQuestionPreview(quiz.questions[activeQuestionIndex])}
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to render question preview
function renderQuestionPreview(question: QuizQuestion) {
  return (
    <QuestionRenderer 
      question={question}
      disabled={true}
      viewMode="preview"
    />
  );
}
