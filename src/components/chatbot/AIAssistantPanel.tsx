import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, MessageSquare, FormInput, Workflow, Lightbulb, Languages, ArrowRight, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';

// Adicionar templates de prompts para uso médico
const PROMPT_TEMPLATES = {
  welcome: "Uma mensagem de boas-vindas amigável para um chatbot de clínica médica que ajudará a agendar consultas. O tom deve ser profissional, mas acolhedor.",
  symptom: "Uma pergunta cuidadosa para que o paciente descreva seus sintomas ou razão da consulta. Mencione que isto ajudará a direcionar para o especialista correto.",
  date_selection: "Uma mensagem pedindo ao paciente para indicar sua data preferida para consulta, incluindo uma breve explicação sobre a disponibilidade.",
  thanks: "Uma mensagem de agradecimento após o agendamento, reforçando que a clínica entrará em contato para confirmar. Inclua lembretes sobre documentos necessários para a consulta."
};

interface AIAssistantPanelProps {
  onGenerateMessage: (message: string) => void;
  onGenerateQuestion: (question: string, variableName: string, inputType: string, placeholder: string) => void;
  onGenerateFlow: (flowData: any[]) => void;
  existingNodes?: any[];
}

export default function AIAssistantPanel({
  onGenerateMessage,
  onGenerateQuestion,
  onGenerateFlow,
  existingNodes = []
}: AIAssistantPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('message');
  const [selectedNodeType, setSelectedNodeType] = useState('text');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Função para aplicar template
  const applyTemplate = (templateKey: string) => {
    setPrompt(PROMPT_TEMPLATES[templateKey as keyof typeof PROMPT_TEMPLATES]);
    setSelectedTemplate(templateKey);
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || generating) return;
    
    setGenerating(true);
    
    try {
      // Definir o tipo de solicitação com base na aba ativa
      let requestType = '';
      
      switch (activeTab) {
        case 'message':
          requestType = 'generate_message';
          break;
        case 'question':
          requestType = 'generate_question';
          break;
        case 'flow':
          requestType = 'generate_flow';
          break;
        case 'improve':
          requestType = 'improve_message';
          break;
        case 'translate':
          requestType = 'translate_message';
          break;
        default:
          requestType = 'generate_message';
      }
      
      // Fazer a chamada para a API
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: requestType,
          prompt: prompt,
          nodeType: selectedNodeType,
          existingNodes: activeTab === 'flow' ? existingNodes : undefined
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar conteúdo com IA');
      }
      
      // Processar a resposta com base na aba ativa
      if (activeTab === 'message' || activeTab === 'improve' || activeTab === 'translate') {
        onGenerateMessage(data.response);
        toast.success('Mensagem gerada com sucesso!');
      } 
      else if (activeTab === 'question') {
        // Extrair informações da pergunta gerada
        // Este é um processamento simples; uma implementação real pode precisar de ajustes
        const question = data.response;
        const variableName = `var_${selectedNodeType}_${Date.now()}`;
        const placeholder = 'Digite aqui...';
        
        onGenerateQuestion(question, variableName, selectedNodeType, placeholder);
        toast.success('Pergunta gerada com sucesso!');
      } 
      else if (activeTab === 'flow') {
        // A resposta já deve ser um array de objetos de nó
        if (Array.isArray(data.response)) {
          onGenerateFlow(data.response);
          toast.success(`Fluxo com ${data.response.length} nós gerado com sucesso!`);
        } else {
          toast.error('Erro ao gerar fluxo: formato incorreto');
        }
      }
      
      // Limpar o prompt após sucesso
      setPrompt('');
      setSelectedTemplate('');
      
    } catch (error) {
      console.error('Erro ao gerar com IA:', error);
      toast.error('Erro ao gerar conteúdo com IA');
    } finally {
      setGenerating(false);
    }
  };
  
  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0 py-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          Assistente IA
        </CardTitle>
        <CardDescription className="text-xs">
          Use IA para ajudar a criar seu chatbot
        </CardDescription>
      </CardHeader>
      
      <CardContent className="px-0 py-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 h-auto p-1">
            <TabsTrigger value="message" className="text-[10px] py-1 h-auto">
              <MessageSquare className="h-3 w-3 mb-1" />
              <span className="block">Mensagem</span>
            </TabsTrigger>
            <TabsTrigger value="question" className="text-[10px] py-1 h-auto">
              <FormInput className="h-3 w-3 mb-1" />
              <span className="block">Pergunta</span>
            </TabsTrigger>
            <TabsTrigger value="flow" className="text-[10px] py-1 h-auto">
              <Workflow className="h-3 w-3 mb-1" />
              <span className="block">Fluxo</span>
            </TabsTrigger>
            <TabsTrigger value="improve" className="text-[10px] py-1 h-auto">
              <Lightbulb className="h-3 w-3 mb-1" />
              <span className="block">Melhorar</span>
            </TabsTrigger>
            <TabsTrigger value="translate" className="text-[10px] py-1 h-auto">
              <Languages className="h-3 w-3 mb-1" />
              <span className="block">Traduzir</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="message" className="mt-2">
            <p className="text-xs text-muted-foreground mb-2">
              Descreva a mensagem que você quer que o chatbot envie:
            </p>
            
            {/* Template buttons for medical context */}
            <div className="grid grid-cols-2 gap-1 mb-2">
              <Button 
                variant="outline" 
                size="sm"
                className={`text-[10px] h-8 ${selectedTemplate === 'welcome' ? 'bg-blue-50 border-blue-200' : ''}`}
                onClick={() => applyTemplate('welcome')}
              >
                <Stethoscope className="h-3 w-3 mr-1" /> Boas-vindas
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className={`text-[10px] h-8 ${selectedTemplate === 'symptom' ? 'bg-blue-50 border-blue-200' : ''}`}
                onClick={() => applyTemplate('symptom')}
              >
                <Stethoscope className="h-3 w-3 mr-1" /> Sintomas
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className={`text-[10px] h-8 ${selectedTemplate === 'date_selection' ? 'bg-blue-50 border-blue-200' : ''}`}
                onClick={() => applyTemplate('date_selection')}
              >
                <Stethoscope className="h-3 w-3 mr-1" /> Agendamento
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className={`text-[10px] h-8 ${selectedTemplate === 'thanks' ? 'bg-blue-50 border-blue-200' : ''}`}
                onClick={() => applyTemplate('thanks')}
              >
                <Stethoscope className="h-3 w-3 mr-1" /> Agradecimento
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="question" className="mt-2">
            <p className="text-xs text-muted-foreground mb-2">
              Descreva a pergunta que você quer fazer ao usuário:
            </p>
            <Select 
              value={selectedNodeType} 
              onValueChange={setSelectedNodeType}
              disabled={generating}
            >
              <SelectTrigger className="text-xs h-8 mb-2">
                <SelectValue placeholder="Tipo de entrada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Texto</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="tel">Telefone</SelectItem>
                <SelectItem value="number">Número</SelectItem>
                <SelectItem value="date">Data</SelectItem>
                <SelectItem value="select">Seleção</SelectItem>
              </SelectContent>
            </Select>
          </TabsContent>
          
          <TabsContent value="flow" className="mt-2">
            <p className="text-xs text-muted-foreground mb-2">
              Descreva o fluxo de conversa que você quer criar:
            </p>
            
            {/* Default medical flow suggestion */}
            <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 mb-2">
              <p className="text-xs text-gray-700 font-medium">Sugestão:</p>
              <p className="text-xs text-gray-600">
                "Crie um fluxo de chatbot para agendamento médico que coleta nome do paciente, 
                WhatsApp, descrição do problema ou sintomas, e data preferida para consulta."
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-[10px] mt-1 h-6 text-blue-500"
                onClick={() => setPrompt("Crie um fluxo de chatbot para agendamento médico que coleta nome do paciente, WhatsApp, descrição do problema ou sintomas, e data preferida para consulta.")}
              >
                Usar esta sugestão
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="improve" className="mt-2">
            <p className="text-xs text-muted-foreground mb-2">
              Cole a mensagem existente para que a IA possa melhorá-la:
            </p>
          </TabsContent>
          
          <TabsContent value="translate" className="mt-2">
            <p className="text-xs text-muted-foreground mb-2">
              Cole o texto em outro idioma para traduzir para o português:
            </p>
          </TabsContent>
          
          <Textarea 
            value={prompt} 
            onChange={(e) => setPrompt(e.target.value)} 
            placeholder={
              activeTab === 'message' ? 'Ex: Uma mensagem de boas-vindas calorosa explicando os serviços da clínica' :
              activeTab === 'question' ? 'Ex: Perguntar o nome completo do paciente' :
              activeTab === 'flow' ? 'Ex: Um fluxo para agendar uma consulta de primeira vez, coletando nome, telefone e sintomas' :
              activeTab === 'improve' ? 'Cole aqui a mensagem que deseja melhorar' :
              'Cole aqui o texto que deseja traduzir'
            }
            className="min-h-[80px] text-xs mt-1"
            disabled={generating}
          />
        </Tabs>
      </CardContent>
      
      <CardFooter className="px-0 pt-2 pb-0 flex justify-end">
        <Button 
          size="sm" 
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8"
          disabled={!prompt.trim() || generating}
          onClick={handleSubmit}
        >
          {generating ? (
            <>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Gerando...
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3 mr-1" />
              Gerar com IA
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 