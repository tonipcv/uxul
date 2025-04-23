'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  useReactFlow,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Dialog, DialogContent } from '@/components/ui/dialog';

import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

import { 
  Save, 
  Play, 
  Plus, 
  ArrowLeft, 
  MessageSquare, 
  MessageCircleQuestion, 
  ChevronRight, 
  Trash,
  ZoomIn,
  ZoomOut,
  Maximize,
  LayoutGrid,
  MousePointer,
  Move,
  Minimize,
  X,
  TextCursorInput, 
  Mail,            
  Phone,           
  Hash,            
  CalendarDays,    
  List,            
  ListChecks,      
  Star,
  Menu,
  MoreHorizontal,
  PlusCircle,
  ChevronsRight,
  Settings,
  XCircle,
  FormInput,
  MoveUp,
  MoveDown,
  ArrowUpDown,
  Pencil,
  Sparkles,
  Stethoscope,
  ArrowRight
} from 'lucide-react';

// Tipos personalizados de nós
import TextMessageNode from '@/components/chatbot/TextMessageNode';
import InputNode, { InputNodeData } from '@/components/chatbot/InputNode';
import ConditionNode from '@/components/chatbot/ConditionNode';
import AIAssistantPanel from '@/components/chatbot/AIAssistantPanel';

// Registrar tipos de nós
const nodeTypes = {
  message: TextMessageNode,
  input: InputNode,
  condition: ConditionNode
};

// Mapa de ícones para InputType
// Duplicated from InputNode component for easy access
const inputTypeIcons = {
  text: TextCursorInput,
  longText: TextCursorInput,
  email: Mail,
  tel: Phone,
  number: Hash,
  date: CalendarDays,
  select: List,
  multiSelect: ListChecks,
  rating: Star,
};

export default function ChatbotEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [flowName, setFlowName] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [interactionMode, setInteractionMode] = useState<'select' | 'pan'>('select');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<any>(null);
  const [showFlow, setShowFlow] = useState(false);
  const [showAddBlockMenu, setShowAddBlockMenu] = useState(false);
  const [addBlockPosition, setAddBlockPosition] = useState({ x: 0, y: 0 });
  const [addBlockAnchorIndex, setAddBlockAnchorIndex] = useState<number | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  // Carregar dados do fluxo
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const fetchFlow = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/chatbot-flows/${id}`);
        
        if (!response.ok) {
          throw new Error('Fluxo não encontrado');
        }
        
        const flowData = await response.json();
        setFlowName(flowData.name);
        setIsPublished(flowData.isPublished);
        
        // Mapear nós do banco para nós do ReactFlow
        const mappedNodes = flowData.nodes.map((node: any) => ({
          id: node.id,
          type: node.type,
          data: {
            ...node.content,
            label: node.type === 'message' ? node.content.message : 
                   node.type === 'input' ? node.content.question : 
                   'Condição'
          },
          position: node.position
        }));
        
        // Mapear arestas
        const mappedEdges = flowData.edges.map((edge: any) => ({
          id: edge.id,
          source: edge.sourceNodeId,
          target: edge.targetNodeId,
          label: edge.condition ? 'Condicional' : '',
          data: edge.condition || {}
        }));
        
        setNodes(mappedNodes);
        setEdges(mappedEdges);

        // Se não há nós, criar um fluxo padrão de captura de dados para um chatbot de agendamento
        if (mappedNodes.length === 0 && !flowData.name) {
          // Definir um nome padrão para o fluxo
          setFlowName('Chatbot de Agendamento');
          
          // Criar fluxo padrão para captura de nome, WhatsApp, problema e data
          createDefaultCaptureFlow();
        }
      } catch (error) {
        console.error('Erro ao carregar fluxo:', error);
        toast.error('Erro ao carregar o fluxo do chatbot');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFlow();
  }, [id, session]);

  // Função para criar um fluxo padrão de captura de dados
  const createDefaultCaptureFlow = () => {
    const timestamp = Date.now();
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    // 1. Mensagem de boas-vindas
    const welcomeNodeId = `node-${timestamp}-1`;
    newNodes.push({
      id: welcomeNodeId,
      type: 'message',
      data: { 
        message: 'Olá! Sou o assistente virtual da clínica. Estou aqui para ajudar com seu agendamento. Vamos começar com algumas informações básicas.',
        label: 'Mensagem de boas-vindas'
      },
      position: { x: 250, y: 100 }
    });
    
    // 2. Pergunta - Nome
    const nameNodeId = `node-${timestamp}-2`;
    newNodes.push({
      id: nameNodeId,
      type: 'input',
      data: { 
        question: 'Por favor, digite seu nome completo:',
        variableName: 'nome_completo',
        placeholder: 'Ex: Maria Silva',
        inputType: 'text',
        label: 'Pergunta: Nome'
      },
      position: { x: 250, y: 280 }
    });
    
    // 3. Mensagem de confirmação do nome
    const nameConfirmNodeId = `node-${timestamp}-3`;
    newNodes.push({
      id: nameConfirmNodeId,
      type: 'message',
      data: { 
        message: 'Obrigado, {{nome_completo}}! Agora preciso do seu número de WhatsApp para confirmarmos o agendamento.',
        label: 'Confirmação do nome'
      },
      position: { x: 250, y: 460 }
    });
    
    // 4. Pergunta - WhatsApp
    const whatsappNodeId = `node-${timestamp}-4`;
    newNodes.push({
      id: whatsappNodeId,
      type: 'input',
      data: { 
        question: 'Qual o seu número de WhatsApp com DDD?',
        variableName: 'whatsapp',
        placeholder: 'Ex: (11) 98765-4321',
        inputType: 'tel',
        label: 'Pergunta: WhatsApp'
      },
      position: { x: 250, y: 640 }
    });
    
    // 5. Mensagem de confirmação do WhatsApp
    const whatsappConfirmNodeId = `node-${timestamp}-5`;
    newNodes.push({
      id: whatsappConfirmNodeId,
      type: 'message',
      data: { 
        message: 'Perfeito! Agora me conte qual é o problema ou sintoma principal que está sentindo.',
        label: 'Confirmação do WhatsApp'
      },
      position: { x: 250, y: 820 }
    });
    
    // 6. Pergunta - Problema/Sintoma
    const problemNodeId = `node-${timestamp}-6`;
    newNodes.push({
      id: problemNodeId,
      type: 'input',
      data: { 
        question: 'Descreva brevemente seu problema ou sintoma:',
        variableName: 'problema',
        placeholder: 'Ex: Dor nas costas, consulta de rotina, etc.',
        inputType: 'longText',
        label: 'Pergunta: Problema'
      },
      position: { x: 250, y: 1000 }
    });
    
    // 7. Mensagem antes da data
    const preDateNodeId = `node-${timestamp}-7`;
    newNodes.push({
      id: preDateNodeId,
      type: 'message',
      data: { 
        message: 'Entendi sobre o seu problema. Agora vamos agendar uma data para sua consulta.',
        label: 'Preparação para data'
      },
      position: { x: 250, y: 1180 }
    });
    
    // 8. Pergunta - Data desejada
    const dateNodeId = `node-${timestamp}-8`;
    newNodes.push({
      id: dateNodeId,
      type: 'input',
      data: { 
        question: 'Qual seria sua data preferida para a consulta?',
        variableName: 'data_consulta',
        placeholder: 'Ex: 15/10/2023',
        inputType: 'date',
        label: 'Pergunta: Data'
      },
      position: { x: 250, y: 1360 }
    });
    
    // 9. Mensagem final de agradecimento
    const thankYouNodeId = `node-${timestamp}-9`;
    newNodes.push({
      id: thankYouNodeId,
      type: 'message',
      data: { 
        message: 'Muito obrigado pelas informações, {{nome_completo}}! Recebemos seu pedido de agendamento para {{data_consulta}} em relação ao problema: "{{problema}}". Entraremos em contato através do WhatsApp {{whatsapp}} para confirmar sua consulta. Tenha um ótimo dia!',
        label: 'Agradecimento final'
      },
      position: { x: 250, y: 1540 }
    });
    
    // Criar conexões entre os nós
    for (let i = 0; i < newNodes.length - 1; i++) {
      newEdges.push({
        id: `edge-${timestamp}-${i}`,
        source: newNodes[i].id,
        target: newNodes[i + 1].id
      });
    }
    
    // Atualizar o estado com os novos nós e arestas
    setNodes(newNodes);
    setEdges(newEdges);
    
    // Salvar o fluxo automaticamente após criar
    setTimeout(() => {
      saveFlow();
    }, 1000);
  };

  // Manipuladores de eventos para o ReactFlow
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
    
    // Atualizar nós selecionados
    const selectChanges = changes.filter(change => change.type === 'select');
    if (selectChanges.length > 0) {
      const newSelectedNodes = nodes
        .filter(node => node.selected)
        .map(node => node.id);
      setSelectedNodes(newSelectedNodes);
      
      // Abrir painel de configuração se um nó for selecionado
      // Fechar se nenhum estiver selecionado
      if (newSelectedNodes.length === 1) {
        setShowConfigPanel(true);
      } else if (newSelectedNodes.length === 0) {
        setShowConfigPanel(false);
      }
    }
  }, [nodes]);
  
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);
  
  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({ ...connection, id: `e-${Date.now()}` }, eds));
  }, []);

  // Adicionar um novo nó
  const addNode = (type: string, initialData?: Partial<InputNodeData>, index?: number, message?: string) => {
    const newNodeId = `node-${Date.now()}`;
    let newNode: Node;
    
    // Posição inicial - será ajustada depois
    const initialPosition = { x: 250, y: 0 };
    
    switch (type) {
      case 'message':
        newNode = {
          id: newNodeId,
          type: 'message',
          data: { 
            message: message || 'Nova mensagem do chatbot',
            label: message || 'Nova mensagem do chatbot'
          },
          position: initialPosition
        };
        break;
        
      case 'input':
        const inputType = initialData?.inputType || 'text';
        const defaultLabel = `Pergunta (${inputType})`;
        const defaultQuestion = `Qual é ${inputType === 'email' ? 'o seu email' : inputType === 'tel' ? 'o seu telefone' : 'a sua resposta'}?`;
        
        newNode = {
          id: newNodeId,
          type: 'input',
          data: { 
            question: defaultQuestion,
            variableName: `var_${inputType}_${Date.now()}`,
            placeholder: 'Digite aqui...',
            inputType: inputType,
            label: defaultLabel,
            ...initialData
          },
          position: initialPosition
        };
        break;
        
      case 'condition':
        newNode = {
          id: newNodeId,
          type: 'condition',
          data: { 
            label: 'Nova Condição',
            variable: '',
            operator: 'equals',
            value: ''
          },
          position: initialPosition
        };
        break;
        
      default:
        console.warn("Tipo de nó desconhecido:", type);
        return;
    }
    
    // Adiciona o novo nó à posição especificada pelo índice ou ao final
    let updatedNodes;
    if (index !== undefined && index >= 0 && index < nodes.length) {
      // Inserir o nó na posição especificada
      updatedNodes = [
        ...nodes.slice(0, index + 1),
        newNode,
        ...nodes.slice(index + 1)
      ];
    } else {
      // Adicionar o nó ao final
      updatedNodes = [...nodes, newNode];
    }
    
    // Atualiza a posição vertical de todos os nós
    updateNodesVerticalPositions(updatedNodes);
    
    // Atualiza o estado
    setNodes(updatedNodes);
    
    // Centralizar o canvas após adicionar um elemento
    setTimeout(() => {
      if (reactFlowInstance.current) {
        reactFlowInstance.current.fitView({ padding: 0.2 });
      }
    }, 50);
  };

  // Salvar fluxo
  const saveFlow = async () => {
    if (!session?.user?.id) {
      console.error('Erro ao salvar: usuário não autenticado');
      toast.error('Você precisa estar autenticado para salvar o fluxo');
      return;
    }
    
    try {
      setSaving(true);
      console.log('Iniciando salvamento do fluxo...');
      
      // Mapear nós e arestas para o formato esperado pela API
      const formattedNodes = nodes.map(node => ({
        id: node.id,
        type: node.type,
        content: {
          ...node.data,
          label: undefined // Remover campo label que é específico do ReactFlow
        },
        position: node.position
      }));
      
      const formattedEdges = edges.map(edge => ({
        id: edge.id,
        sourceNodeId: edge.source,
        targetNodeId: edge.target,
        condition: edge.data || {}
      }));
      
      // Determinar o nó inicial (geralmente o primeiro na lista)
      const startNodeId = nodes.length > 0 ? nodes[0].id : null;
      
      const requestBody = {
        name: flowName,
        isPublished,
        startNodeId,
        nodes: formattedNodes,
        edges: formattedEdges
      };
      
      console.log('Dados a serem enviados para a API:', requestBody);
      console.log('URL da requisição:', `/api/chatbot-flows/${id}`);
      
      try {
        const response = await fetch(`/api/chatbot-flows/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        
        console.log('Status da resposta:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Resposta de erro da API:', errorText);
          throw new Error(`Erro ao salvar fluxo: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const responseData = await response.json();
        console.log('Resposta da API:', responseData);
        
        toast.success('Fluxo de chatbot salvo com sucesso');
      } catch (fetchError: any) {
        console.error('Erro durante a requisição fetch:', fetchError);
        toast.error(`Falha na comunicação com o servidor: ${fetchError.message}`);
        throw fetchError;
      }
    } catch (error) {
      console.error('Erro geral ao salvar fluxo:', error);
      toast.error('Erro ao salvar o fluxo do chatbot');
    } finally {
      setSaving(false);
    }
  };

  // Excluir nó
  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    // Também remove arestas conectadas ao nó
    setEdges((eds) => eds.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId
    ));
  };

  // Atualizar dados de um nó
  const updateNodeData = (nodeId: string, newData: any) => {
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...newData,
              label: node.type === 'message' ? newData.message || node.data.message : 
                     node.type === 'input' ? newData.question || node.data.question : 
                     'Condição'
            }
          };
        }
        return node;
      })
    );
  };

  // Aplicar layout automático aos nós
  const applyAutoLayout = () => {
    if (!nodes.length) return;
    
    // Organizar nós verticalmente usando a função compartilhada
    const updatedNodes = [...nodes];
    updateNodesVerticalPositions(updatedNodes);
    
    setNodes(updatedNodes);
    
    // Se tivermos a instância do ReactFlow, fazemos o fit view após organizar
    setTimeout(() => {
      if (reactFlowInstance.current) {
        reactFlowInstance.current.fitView({ padding: 0.2 });
      }
    }, 50);
  };

  // Centralizar o fluxo
  const centerFlow = () => {
    if (reactFlowInstance.current) {
      reactFlowInstance.current.fitView({ padding: 0.2 });
    }
  };

  // Alternar entre modo seleção e modo pan
  const toggleInteractionMode = () => {
    setInteractionMode(prev => prev === 'select' ? 'pan' : 'select');
  };

  // Duplicar nó selecionado
  const duplicateSelectedNode = () => {
    if (selectedNodes.length !== 1) return;
    
    const selectedNode = nodes.find(node => node.id === selectedNodes[0]);
    if (!selectedNode) return;
    
    const newNodeId = `node-${Date.now()}`;
    const newNode = {
      ...selectedNode,
      id: newNodeId,
      position: {
        x: selectedNode.position.x + 50,
        y: selectedNode.position.y + 50
      },
      data: { ...selectedNode.data }
    };
    
    setNodes(nds => [...nds, newNode]);
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  // Function to open Add Block Menu
  const openAddBlockMenu = (index?: number, event?: React.MouseEvent) => {
    if (event) {
      // If we have an event, position the menu near the click
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setAddBlockPosition({ 
        x: rect.left + window.scrollX, 
        y: rect.bottom + window.scrollY 
      });
    } else {
      // Default position in center of view
      setAddBlockPosition({ 
        x: window.innerWidth / 2, 
        y: window.innerHeight / 3 
      });
    }
    
    setAddBlockAnchorIndex(index !== undefined ? index : null);
    setShowAddBlockMenu(true);
  };

  // Function to close Add Block Menu
  const closeAddBlockMenu = () => {
    setShowAddBlockMenu(false);
  };

  // Function to add block from the menu
  const addBlockFromMenu = (type: string, initialData?: Partial<InputNodeData>) => {
    addNode(type, initialData, addBlockAnchorIndex !== null ? addBlockAnchorIndex : undefined);
    closeAddBlockMenu();
  };

  // Get currently selected node
  const getSelectedNode = useCallback(() => {
    if (selectedNodes.length !== 1) return null;
    return nodes.find(node => node.id === selectedNodes[0]) || null;
  }, [nodes, selectedNodes]);

  // Função para mover um nó para cima na lista
  const moveNodeUp = (index: number) => {
    if (index <= 0 || index >= nodes.length) return;
    
    const newNodes = [...nodes];
    // Troca o nó atual com o nó acima dele
    [newNodes[index], newNodes[index - 1]] = [newNodes[index - 1], newNodes[index]];
    
    // Atualiza as posições verticais de todos os nós para manter a ordem visual
    updateNodesVerticalPositions(newNodes);
    
    setNodes(newNodes);
    
    // Atualiza também as arestas
    updateEdgesAfterReordering(newNodes);
  };
  
  // Função para mover um nó para baixo na lista
  const moveNodeDown = (index: number) => {
    if (index < 0 || index >= nodes.length - 1) return;
    
    const newNodes = [...nodes];
    // Troca o nó atual com o nó abaixo dele
    [newNodes[index], newNodes[index + 1]] = [newNodes[index + 1], newNodes[index]];
    
    // Atualiza as posições verticais de todos os nós para manter a ordem visual
    updateNodesVerticalPositions(newNodes);
    
    setNodes(newNodes);
    
    // Atualiza também as arestas
    updateEdgesAfterReordering(newNodes);
  };
  
  // Função auxiliar para atualizar as posições verticais de todos os nós
  const updateNodesVerticalPositions = (nodeList: Node[]) => {
    // Define o espaçamento vertical entre os nós
    const verticalSpacing = 180;
    const startY = 100;
    const defaultX = 250; // Posição X padrão, para manter todos alinhados
    
    // Atualiza a posição vertical de cada nó com base em seu índice
    nodeList.forEach((node, index) => {
      if (!node.position) {
        node.position = { x: defaultX, y: 0 };
      }
      
      // Mantém a posição X padrão, atualiza apenas a posição Y
      node.position.x = defaultX;
      node.position.y = startY + (index * verticalSpacing);
    });
  };
  
  // Função para atualizar as arestas após a reordenação dos nós
  const updateEdgesAfterReordering = (nodeList: Node[]) => {
    // Se não houver arestas, não precisa fazer nada
    if (edges.length === 0) return;
    
    // As arestas referências os nós por ID, então não precisamos mudar as arestas
    // a menos que queiramos mudar automaticamente as conexões
    
    // Se quisermos criar conexões automáticas entre nós consecutivos:
    if (nodeList.length > 1) {
      // Esta é uma abordagem opcional que conectaria automaticamente nós em sequência
      // Comentado por enquanto, pois pode não ser o comportamento desejado
      
      /*
      const newEdges: Edge[] = [];
      
      // Cria arestas conectando cada nó ao próximo
      for (let i = 0; i < nodeList.length - 1; i++) {
        // Verifica se já existe uma aresta entre esses nós
        const existingEdge = edges.find(
          edge => edge.source === nodeList[i].id && edge.target === nodeList[i + 1].id
        );
        
        if (existingEdge) {
          newEdges.push(existingEdge);
        } else {
          // Cria uma nova aresta
          newEdges.push({
            id: `e-${nodeList[i].id}-${nodeList[i + 1].id}`,
            source: nodeList[i].id,
            target: nodeList[i + 1].id
          });
        }
      }
      
      setEdges(newEdges);
      */
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-100 pt-20 pb-24 md:pt-12 md:pb-16 px-2 sm:px-4">
      <div className="container mx-auto px-0 sm:pl-4 md:pl-8 lg:pl-16 max-w-full sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-[-0.03em] font-inter">Editor de Chatbot</h1>
            <p className="text-xs md:text-sm text-gray-600 tracking-[-0.03em] font-inter">Configure as interações do seu chatbot</p>
          </div>
          <div className="w-full md:w-auto mt-2 md:mt-0 flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline"
              onClick={() => router.back()}
              className="w-full md:w-auto bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg-gray-800/10 text-xs h-9"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button 
              onClick={() => setShowFlow(true)}
              className="w-full md:w-auto bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg-gray-800/10 text-xs h-9"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Ver Fluxo
            </Button>
            <Button 
              onClick={saveFlow}
              disabled={saving}
              className="w-full md:w-auto bg-blue-600 border-0 shadow-[0_4px_12px_rgba(59,130,246,0.3)] hover:shadow-[0_8px_24px_rgba(59,130,246,0.4)] transition-all duration-300 rounded-2xl text-white hover:bg-blue-700 text-xs h-9"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
          {/* Editor Panel - Left Side */}
          <Card className={`bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl ${showConfigPanel ? 'md:col-span-1' : 'md:col-span-1'}`}>
            <CardHeader className="pb-1 pt-3 px-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-sm md:text-base font-bold text-gray-900 tracking-[-0.03em] font-inter">Blocos do Chatbot</CardTitle>
                  <CardDescription className="text-xs text-gray-500 tracking-[-0.03em] font-inter">
                    Adicione e configure os blocos de interação
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {/* Botão para ordenar automaticamente */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={applyAutoLayout}
                    className="h-8 px-2 py-1 bg-white border-gray-200 shadow-sm hover:bg-gray-50 text-gray-800"
                    title="Organizar fluxo"
                  >
                    <ArrowUpDown className="h-4 w-4 mr-1" />
                    <span className="text-xs">Organizar</span>
                  </Button>
                  
                  {/* Add a button to add blocks when list is not empty */}
                  {nodes.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => openAddBlockMenu(undefined, e)}
                      className="h-8 px-2 py-1 bg-white border-gray-200 shadow-sm hover:bg-gray-50 text-gray-800"
                    >
                      <PlusCircle className="h-4 w-4 mr-1" />
                      <span className="text-xs">Adicionar Bloco</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-1 mb-4">
                <Label className="text-xs font-medium text-gray-700">Nome do Fluxo</Label>
                <Input
                  value={flowName}
                  onChange={(e) => setFlowName(e.target.value)}
                  className="h-8 text-sm bg-white/50 border-gray-200"
                  placeholder="Nome do fluxo"
                />
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Switch
                  checked={isPublished}
                  onCheckedChange={(value) => {
                    setIsPublished(value);
                    // Salvar automaticamente ao alterar o status
                    saveFlow();
                  }}
                />
                <Label className="text-xs font-medium text-gray-700">Publicado</Label>
              </div>

              <div className="space-y-4 max-h-[calc(100vh-20rem)] overflow-y-auto pr-2">
                {nodes.map((node, index) => (
                  <div key={node.id}>
                    {/* Add Block Button - Replace with new handler */}
                    <div className="flex justify-center -mb-3 z-10">
                      <Button
                        variant="ghost"
                        className="rounded-full h-6 w-6 p-0 hover:bg-blue-50 bg-white shadow-sm border border-gray-200"
                        onClick={(e) => openAddBlockMenu(index, e)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Block Card - Remove inline editing fields */}
                    <Card className="shadow-sm border border-gray-200">
                      <CardHeader className="flex flex-row items-center gap-3 py-3">
                        <div className="flex-1">
                          {/* Simplified titles and descriptions */}
                          {node.type === 'message' && (
                            <>
                              <CardTitle className="text-sm">Mensagem</CardTitle>
                              <CardDescription 
                                className="text-xs truncate cursor-pointer hover:text-blue-500"
                                onClick={() => {
                                  setSelectedNodes([node.id]);
                                  setShowConfigPanel(true);
                                }}
                              >{node.data.message || '(vazio)'}</CardDescription>
                            </>
                          )}
                          {node.type === 'input' && (
                            <>
                              <CardTitle className="text-sm capitalize">{node.data.inputType || 'Pergunta'}</CardTitle>
                              <CardDescription 
                                className="text-xs truncate cursor-pointer hover:text-blue-500"
                                onClick={() => {
                                  setSelectedNodes([node.id]);
                                  setShowConfigPanel(true);
                                }}
                              >{node.data.question || ' (vazio)'}</CardDescription>
                            </>
                          )}
                          {node.type === 'condition' && (
                            <>
                              <CardTitle className="text-sm">Condição</CardTitle>
                              <CardDescription 
                                className="text-xs truncate cursor-pointer hover:text-blue-500"
                                onClick={() => {
                                  setSelectedNodes([node.id]);
                                  setShowConfigPanel(true);
                                }}
                              >
                                {node.data.variable ? `${node.data.variable} ${node.data.operator} ${node.data.value}` : '(não configurado)'}
                              </CardDescription>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {/* Botões para mover para cima/baixo */}
                          <div className="flex flex-col gap-0.5 mr-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => moveNodeUp(index)}
                              disabled={index === 0}
                              className="h-6 w-6 rounded-full hover:bg-blue-50"
                              title="Mover para cima"
                            >
                              <MoveUp className="h-3 w-3 text-gray-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => moveNodeDown(index)}
                              disabled={index === nodes.length - 1}
                              className="h-6 w-6 rounded-full hover:bg-blue-50"
                              title="Mover para baixo"
                            >
                              <MoveDown className="h-3 w-3 text-gray-500" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteNode(node.id)}
                            className="h-7 w-7 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      {/* Remove CardContent with inline inputs */}
                      {/* <CardContent className="py-3"> ... </CardContent> */}
                    </Card>
                  </div>
                ))}

                {/* Initial Add Block Button - Replace with new handler */}
                {nodes.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-[160px] border-2 border-dashed border-gray-200 rounded-lg bg-white/50">
                    <MessageSquare className="h-8 w-8 text-gray-400 mb-3" />
                    <p className="text-gray-500 text-sm mb-3">Comece adicionando um bloco ao seu chatbot</p>
                    <Button 
                      variant="outline"
                      className="h-9 px-4 bg-white shadow-sm text-gray-800"
                      onClick={(e) => openAddBlockMenu(undefined, e)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      <span>Adicionar Bloco</span>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preview Panel - Right Side */}
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid grid-cols-3 h-9 mb-4">
              <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">Configurações</TabsTrigger>
              <TabsTrigger value="ai" className="text-xs flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-purple-500" />
                IA
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="mt-0">
              <Card className={`bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl ${showConfigPanel ? 'hidden md:block md:col-span-1' : 'md:col-span-1'}`}>
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-sm md:text-base font-bold text-gray-900 tracking-[-0.03em] font-inter">Preview do Chatbot</CardTitle>
                  <CardDescription className="text-xs text-gray-500 tracking-[-0.03em] font-inter">
                    Visualize como seu chatbot vai aparecer para os usuários
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="w-full h-[calc(100vh-20rem)] flex flex-col items-center justify-center">
                    <div className="w-[320px] h-[500px] bg-white rounded-lg border shadow-lg flex flex-col">
                      {/* Chat Header */}
                      <div className="p-3 border-b bg-blue-50">
                        <h3 className="font-medium text-sm flex items-center">
                          <Stethoscope className="h-4 w-4 text-blue-500 mr-2" />
                          Chat com Dr. {session?.user?.name || 'Assistente'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Assistente de agendamento médico</p>
                      </div>
                      
                      {/* Chat Messages */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50/50">
                        {nodes.length === 0 ? (
                          <>
                            {/* Exemplo de mensagens quando não há nós definidos */}
                            <div className="flex justify-start">
                              <div className="max-w-[80%] rounded-lg p-2.5 bg-white border border-gray-200 shadow-sm">
                                <div className="text-sm text-gray-800">Olá! Sou o assistente virtual da clínica. Como posso ajudar com seu agendamento hoje?</div>
                              </div>
                            </div>
                            
                            <div className="flex justify-end">
                              <div className="max-w-[80%] rounded-lg p-2.5 bg-blue-500 text-white shadow-sm">
                                <div className="text-sm">Quero agendar uma consulta</div>
                              </div>
                            </div>
                            
                            <div className="flex justify-start">
                              <div className="max-w-[80%] rounded-lg p-2.5 bg-white border border-gray-200 shadow-sm">
                                <div className="text-sm text-gray-800">Ótimo! Por favor, informe seu nome completo:</div>
                              </div>
                            </div>
                          </>
                        ) : (
                          nodes.map((node, index) => (
                            <div key={node.id} className={`flex ${node.type === 'input' ? 'justify-end' : 'justify-start'}`}>
                              <div 
                                className={`max-w-[80%] rounded-lg p-2.5 ${
                                  node.type === 'input' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                                } cursor-pointer hover:shadow-md transition-shadow`}
                                onClick={() => {
                                  setSelectedNodes([node.id]);
                                  setShowConfigPanel(true);
                                }}
                              >
                                <div className={`text-sm ${node.type === 'input' ? 'text-white' : 'text-gray-800'}`}>
                                  {node.type === 'message' && (
                                    <div className="relative group">
                                      <div>{node.data.message}</div>
                                      <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100">
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400">
                                          <Pencil className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  {node.type === 'input' && (
                                    <div className="relative group">
                                      <p className="mb-2 text-white">
                                        {node.data.inputType === 'text' && 'João Silva'}
                                        {node.data.inputType === 'tel' && '(11) 98765-4321'}
                                        {node.data.inputType === 'longText' && 'Estou com dor nas costas há 3 dias'}
                                        {node.data.inputType === 'date' && '15/10/2023'}
                                        {!['text', 'tel', 'longText', 'date'].includes(node.data.inputType || '') && 
                                          'Resposta de exemplo'}
                                      </p>
                                      <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100">
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400">
                                          <Pencil className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      {/* Chat Input */}
                      <div className="p-3 border-t bg-white">
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Digite sua mensagem..."
                            disabled
                            className="h-8 text-sm text-gray-800 placeholder:text-gray-400"
                          />
                          <Button variant="default" size="icon" disabled className="h-8 w-8 bg-blue-500 text-white">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-center text-xs text-gray-500 flex items-center justify-center">
                      <Pencil className="h-3 w-3 mr-1" /> Clique nas mensagens para editá-las
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings" className="mt-0">
              <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-sm md:text-base font-bold text-gray-900 tracking-[-0.03em] font-inter">Configurações</CardTitle>
                  <CardDescription className="text-xs text-gray-500 tracking-[-0.03em] font-inter">
                    Configurações gerais do chatbot
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-700">Nome do Chatbot</Label>
                      <Input
                        value={flowName}
                        onChange={(e) => setFlowName(e.target.value)}
                        className="h-9 text-sm"
                        placeholder="Digite o nome do chatbot"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={isPublished}
                        onCheckedChange={(value) => {
                          setIsPublished(value);
                          // Salvar automaticamente ao alterar o status
                          saveFlow();
                        }}
                        id="published"
                        className="data-[state=checked]:bg-green-500"
                      />
                      <Label htmlFor="published" className="text-xs font-medium text-gray-700">
                        {isPublished ? 'Publicado' : 'Rascunho'}
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="ai" className="mt-0">
              <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-sm md:text-base font-bold text-gray-900 tracking-[-0.03em] font-inter">Assistente IA</CardTitle>
                  <CardDescription className="text-xs text-gray-500 tracking-[-0.03em] font-inter">
                    Use inteligência artificial para aprimorar seu chatbot
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <AIAssistantPanel 
                    onGenerateMessage={(message) => {
                      if (selectedNodes.length === 1) {
                        // Se um nó TextMessage estiver selecionado, atualiza seu conteúdo
                        const selectedNode = nodes.find(node => node.id === selectedNodes[0]);
                        if (selectedNode && selectedNode.type === 'message') {
                          updateNodeData(selectedNode.id, { message });
                          toast.success("Mensagem atualizada com IA!");
                        } else {
                          // Caso contrário, cria um novo nó
                          const initialData = {}; // Não passar propriedades de mensagem como InputNodeData
                          addNode('message', initialData, undefined, message);
                          toast.success("Nova mensagem criada com IA!");
                        }
                      } else {
                        // Se nenhum nó estiver selecionado, cria um novo
                        const initialData = {}; // Não passar propriedades de mensagem como InputNodeData
                        addNode('message', initialData, undefined, message);
                        toast.success("Nova mensagem criada com IA!");
                      }
                    }}
                    onGenerateQuestion={(question, variableName, inputType, placeholder) => {
                      // Converter o inputType para o tipo correto
                      const typedInputType = inputType as 'text' | 'longText' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'multiSelect' | 'rating';
                      
                      if (selectedNodes.length === 1) {
                        // Se um nó InputNode estiver selecionado, atualiza seu conteúdo
                        const selectedNode = nodes.find(node => node.id === selectedNodes[0]);
                        if (selectedNode && selectedNode.type === 'input') {
                          updateNodeData(selectedNode.id, { 
                            question, 
                            variableName, 
                            inputType: typedInputType, 
                            placeholder 
                          });
                          toast.success("Pergunta atualizada com IA!");
                        } else {
                          // Caso contrário, cria um novo nó
                          addNode('input', { 
                            question, 
                            variableName, 
                            inputType: typedInputType, 
                            placeholder 
                          });
                          toast.success("Nova pergunta criada com IA!");
                        }
                      } else {
                        // Se nenhum nó estiver selecionado, cria um novo
                        addNode('input', { 
                          question, 
                          variableName, 
                          inputType: typedInputType, 
                          placeholder 
                        });
                        toast.success("Nova pergunta criada com IA!");
                      }
                    }}
                    onGenerateFlow={(flowData) => {
                      // Para cada nó no fluxo gerado
                      const timestamp = Date.now(); // Usar um timestamp único para todos os nós deste lote
                      const newNodeIds: string[] = [];
                      
                      flowData.forEach((nodeData, index) => {
                        // Criar IDs consistentes para facilitar a criação de arestas depois
                        const newNodeId = `node-${timestamp}-${index}`;
                        newNodeIds.push(newNodeId);
                        
                        // Posição em coluna vertical
                        const position = { x: 250, y: 100 + (index * 150) };
                        
                        // Criar o nó com base no tipo
                        if (nodeData.type === 'message') {
                          const newNode = {
                            id: newNodeId,
                            type: 'message',
                            data: { 
                              message: nodeData.content.message,
                              label: nodeData.content.message
                            },
                            position
                          };
                          
                          setNodes(prev => [...prev, newNode]);
                        } 
                        else if (nodeData.type === 'input') {
                          // Converter para o tipo correto
                          const inputType = nodeData.content.inputType as 'text' | 'longText' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'multiSelect' | 'rating';
                          
                          const newNode = {
                            id: newNodeId,
                            type: 'input',
                            data: { 
                              question: nodeData.content.question,
                              variableName: nodeData.content.variableName || `var_${inputType || 'text'}_${timestamp}`,
                              placeholder: nodeData.content.placeholder || 'Digite aqui...',
                              inputType: inputType || 'text',
                              label: `Pergunta: ${nodeData.content.question}`
                            },
                            position
                          };
                          
                          setNodes(prev => [...prev, newNode]);
                        }
                        else if (nodeData.type === 'condition') {
                          const newNode = {
                            id: newNodeId,
                            type: 'condition',
                            data: { 
                              variable: nodeData.content.variable,
                              operator: nodeData.content.operator || 'equals',
                              value: nodeData.content.value,
                              label: 'Condição'
                            },
                            position
                          };
                          
                          setNodes(prev => [...prev, newNode]);
                        }
                      });
                      
                      // Criar conexões entre os nós
                      setTimeout(() => {
                        // Conectar os nós em sequência
                        for (let i = 0; i < newNodeIds.length - 1; i++) {
                          setEdges(prev => [
                            ...prev, 
                            {
                              id: `edge-${timestamp}-${i}`,
                              source: newNodeIds[i],
                              target: newNodeIds[i + 1]
                            }
                          ]);
                        }
                        
                        // Aplicar layout automático após pequeno delay
                        setTimeout(applyAutoLayout, 200);
                        toast.success(`Fluxo com ${flowData.length} nós criado com IA!`);
                      }, 100);
                    }}
                    existingNodes={nodes.map(node => ({
                      id: node.id,
                      type: node.type,
                      content: node.data
                    }))}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Configuration Panel - Slide in from right when a node is selected */}
          {showConfigPanel && (
            <div className="fixed md:absolute right-0 top-0 h-full md:h-auto w-full md:w-[350px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-l-2xl border-0 z-40 md:z-10 transform transition-transform duration-300 ease-in-out" style={{
              top: '0',
              bottom: '0',
              right: '0'
            }}>
              {/* Config Panel Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 tracking-[-0.03em] font-inter">Configuração do Bloco</h3>
                  <p className="text-xs text-gray-500 tracking-[-0.03em] font-inter">Edite as propriedades deste bloco</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full hover:bg-gray-100"
                  onClick={() => setShowConfigPanel(false)}
                >
                  <XCircle className="h-5 w-5 text-gray-400" />
                </Button>
              </div>

              {/* Config Panel Content */}
              <div className="p-5 overflow-y-auto max-h-[calc(100vh-4rem)] md:max-h-[calc(100vh-12rem)]">
                {(() => {
                  const selectedNode = getSelectedNode();
                  if (!selectedNode) return <p className="text-sm text-gray-500">Nenhum bloco selecionado</p>;

                  return (
                    <div className="space-y-6">
                      {/* Common fields for all node types */}
                      <div>
                        <div className="flex items-center gap-2 mb-4 bg-gray-50 p-3 rounded-xl">
                          {selectedNode.type === 'message' && <MessageSquare className="h-5 w-5 text-blue-500" />}
                          {selectedNode.type === 'input' && 
                            (() => {
                              const inputType = selectedNode.data.inputType || 'text';
                              const Icon = inputTypeIcons[inputType] || FormInput;
                              return <Icon className="h-5 w-5 text-violet-500" />;
                            })()
                          }
                          {selectedNode.type === 'condition' && <ChevronRight className="h-5 w-5 text-orange-500" />}
                          
                          <h4 className="text-sm font-medium text-gray-900 capitalize">
                            {selectedNode.type === 'message' ? 'Mensagem' : 
                              selectedNode.type === 'input' ? (selectedNode.data.inputType || 'Entrada') : 
                              'Condição'}
                          </h4>
                        </div>

                        {/* Message node fields */}
                        {selectedNode.type === 'message' && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="message" className="text-xs font-medium text-gray-700">Mensagem</Label>
                              <Textarea
                                id="message"
                                value={selectedNode.data.message || ''}
                                onChange={(e) => updateNodeData(selectedNode.id, {
                                  ...selectedNode.data,
                                  message: e.target.value
                                })}
                                placeholder="Digite a mensagem que o chatbot enviará"
                                className="min-h-[120px] text-sm rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                        )}

                        {/* Input node fields */}
                        {selectedNode.type === 'input' && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="question" className="text-xs font-medium text-gray-700">Pergunta</Label>
                              <Textarea
                                id="question"
                                value={selectedNode.data.question || ''}
                                onChange={(e) => updateNodeData(selectedNode.id, {
                                  ...selectedNode.data,
                                  question: e.target.value
                                })}
                                placeholder="Digite a pergunta para o usuário"
                                className="min-h-[80px] text-sm rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="variableName" className="text-xs font-medium text-gray-700">Nome da Variável</Label>
                              <Input
                                id="variableName"
                                value={selectedNode.data.variableName || ''}
                                onChange={(e) => updateNodeData(selectedNode.id, {
                                  ...selectedNode.data,
                                  variableName: e.target.value
                                })}
                                placeholder="ex: nome_cliente, email, telefone"
                                className="h-9 text-sm rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <p className="text-xs text-gray-500">Identificador único para acessar esta resposta</p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="placeholder" className="text-xs font-medium text-gray-700">Placeholder</Label>
                              <Input
                                id="placeholder"
                                value={selectedNode.data.placeholder || ''}
                                onChange={(e) => updateNodeData(selectedNode.id, {
                                  ...selectedNode.data,
                                  placeholder: e.target.value
                                })}
                                placeholder="ex: Digite seu nome"
                                className="h-9 text-sm rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="inputType" className="text-xs font-medium text-gray-700">Tipo de Entrada</Label>
                              <Select
                                value={selectedNode.data.inputType || 'text'}
                                onValueChange={(value) => updateNodeData(selectedNode.id, {
                                  ...selectedNode.data,
                                  inputType: value
                                })}
                              >
                                <SelectTrigger id="inputType" className="h-9 text-sm">
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Texto Curto</SelectItem>
                                  <SelectItem value="longText">Texto Longo</SelectItem>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="tel">Telefone</SelectItem>
                                  <SelectItem value="number">Número</SelectItem>
                                  <SelectItem value="date">Data</SelectItem>
                                  <SelectItem value="select">Seleção Única</SelectItem>
                                  <SelectItem value="multiSelect">Seleção Múltipla</SelectItem>
                                  <SelectItem value="rating">Avaliação</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Campos específicos para tipos de entrada especiais */}
                            {(selectedNode.data.inputType === 'select' || selectedNode.data.inputType === 'multiSelect') && (
                              <div className="space-y-3 border border-gray-100 rounded-xl p-4 bg-gray-50 shadow-inner">
                                <Label className="text-xs font-medium text-gray-700">Opções</Label>
                                
                                {/* Mostrar opções existentes */}
                                <div className="space-y-2">
                                  {(selectedNode.data.options || []).map((option, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <Input
                                        value={option.label}
                                        onChange={(e) => {
                                          const newOptions = [...(selectedNode.data.options || [])];
                                          newOptions[index] = { 
                                            ...newOptions[index], 
                                            label: e.target.value,
                                            value: e.target.value.toLowerCase().replace(/\s+/g, '_')
                                          };
                                          updateNodeData(selectedNode.id, {
                                            ...selectedNode.data,
                                            options: newOptions
                                          });
                                        }}
                                        placeholder="Opção"
                                        className="h-8 text-sm rounded-xl border-gray-200 shadow-sm flex-1"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-full"
                                        onClick={() => {
                                          const newOptions = [...(selectedNode.data.options || [])];
                                          newOptions.splice(index, 1);
                                          updateNodeData(selectedNode.id, {
                                            ...selectedNode.data,
                                            options: newOptions
                                          });
                                        }}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                                
                                {/* Botão para adicionar nova opção */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full h-8 text-xs mt-2 rounded-xl shadow-sm border-gray-200"
                                  onClick={() => {
                                    const newOptions = [...(selectedNode.data.options || []), { label: '', value: '' }];
                                    updateNodeData(selectedNode.id, {
                                      ...selectedNode.data,
                                      options: newOptions
                                    });
                                  }}
                                >
                                  <Plus className="h-3 w-3 mr-1" /> Adicionar Opção
                                </Button>
                              </div>
                            )}

                            {selectedNode.data.inputType === 'rating' && (
                              <div className="space-y-2">
                                <Label htmlFor="scale" className="text-xs font-medium text-gray-700">Escala (1-10)</Label>
                                <Input
                                  id="scale"
                                  type="number"
                                  min={1}
                                  max={10}
                                  value={selectedNode.data.scale || 5}
                                  onChange={(e) => updateNodeData(selectedNode.id, {
                                    ...selectedNode.data,
                                    scale: parseInt(e.target.value) || 5
                                  })}
                                  className="h-9 text-sm rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Condition node fields */}
                        {selectedNode.type === 'condition' && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="variable" className="text-xs font-medium text-gray-700">Variável</Label>
                              <Input
                                id="variable"
                                value={selectedNode.data.variable || ''}
                                onChange={(e) => updateNodeData(selectedNode.id, {
                                  ...selectedNode.data,
                                  variable: e.target.value
                                })}
                                placeholder="Nome da variável a ser verificada"
                                className="h-9 text-sm rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="operator" className="text-xs font-medium text-gray-700">Operador</Label>
                              <Select
                                value={selectedNode.data.operator || 'equals'}
                                onValueChange={(value) => updateNodeData(selectedNode.id, {
                                  ...selectedNode.data,
                                  operator: value
                                })}
                              >
                                <SelectTrigger id="operator" className="h-9 text-sm rounded-xl border-gray-200 shadow-sm">
                                  <SelectValue placeholder="Selecione o operador" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                  <SelectItem value="equals">Igual a (=)</SelectItem>
                                  <SelectItem value="notEquals">Diferente de (≠)</SelectItem>
                                  <SelectItem value="contains">Contém</SelectItem>
                                  <SelectItem value="greaterThan">Maior que (&gt;)</SelectItem>
                                  <SelectItem value="lessThan">Menor que (&lt;)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="value" className="text-xs font-medium text-gray-700">Valor</Label>
                              <Input
                                id="value"
                                value={selectedNode.data.value || ''}
                                onChange={(e) => updateNodeData(selectedNode.id, {
                                  ...selectedNode.data,
                                  value: e.target.value
                                })}
                                placeholder="Valor para comparação"
                                className="h-9 text-sm rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Advanced Settings */}
                      <div className="border-t border-gray-100 pt-4 mt-4 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => deleteNode(selectedNode.id)}
                          title="Excluir bloco"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Flow View Modal */}
        {showFlow && (
          <Dialog open={showFlow} onOpenChange={setShowFlow}>
            <DialogContent className="bg-white border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-none rounded-3xl p-4 w-[95vw] max-w-[90vw] h-[90vh] mx-auto">
              <CardHeader className="p-0 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm md:text-base font-bold text-gray-900 tracking-[-0.03em] font-inter">Fluxo do Chatbot</CardTitle>
                    <CardDescription className="text-xs text-gray-600 tracking-[-0.03em] font-inter">
                      Visualize e organize o fluxo de conversação
                    </CardDescription>
                  </div>
                  <Button variant="ghost" onClick={() => setShowFlow(false)} className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <div className="flex-1 h-[calc(90vh-8rem)]" ref={reactFlowWrapper}>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  nodeTypes={nodeTypes}
                  fitView
                >
                  <Background />
                  <Controls />
                </ReactFlow>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Add Block Menu */}
        {showAddBlockMenu && (
          <div 
            className="fixed inset-0 bg-transparent z-50"
            onClick={closeAddBlockMenu}
          >
            <div 
              className="absolute bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-[320px]"
              style={{ 
                left: `${addBlockPosition.x}px`, 
                top: `${addBlockPosition.y}px`,
                transform: 'translate(-50%, 10px)'
              }}
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-1">Adicionar Bloco</h3>
                <p className="text-xs text-gray-500">Selecione o tipo de bloco para adicionar</p>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center justify-center h-auto py-3 bg-white hover:bg-gray-50 text-gray-800"
                  onClick={() => addBlockFromMenu('message')}
                >
                  <MessageSquare className="h-6 w-6 mb-2 text-blue-500" />
                  <span className="text-xs font-medium">Mensagem</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center justify-center h-auto py-3 bg-white hover:bg-gray-50 text-gray-800"
                  onClick={() => addBlockFromMenu('condition')}
                >
                  <ChevronRight className="h-6 w-6 mb-2 text-orange-500" />
                  <span className="text-xs font-medium">Condição</span>
                </Button>
              </div>

              <h4 className="text-xs font-medium text-gray-700 mb-2 mt-4">Perguntas e Entradas</h4>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center justify-center h-auto py-3 bg-white hover:bg-gray-50 text-gray-800"
                  onClick={() => addBlockFromMenu('input', { inputType: 'text' })}
                >
                  <TextCursorInput className="h-5 w-5 mb-2 text-violet-500" />
                  <span className="text-xs font-medium">Texto</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center justify-center h-auto py-3 bg-white hover:bg-gray-50 text-gray-800"
                  onClick={() => addBlockFromMenu('input', { inputType: 'email' })}
                >
                  <Mail className="h-5 w-5 mb-2 text-violet-500" />
                  <span className="text-xs font-medium">Email</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center justify-center h-auto py-3 bg-white hover:bg-gray-50 text-gray-800"
                  onClick={() => addBlockFromMenu('input', { inputType: 'tel' })}
                >
                  <Phone className="h-5 w-5 mb-2 text-violet-500" />
                  <span className="text-xs font-medium">Telefone</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center justify-center h-auto py-3 bg-white hover:bg-gray-50 text-gray-800"
                  onClick={() => addBlockFromMenu('input', { inputType: 'number' })}
                >
                  <Hash className="h-5 w-5 mb-2 text-violet-500" />
                  <span className="text-xs font-medium">Número</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center justify-center h-auto py-3 bg-white hover:bg-gray-50 text-gray-800"
                  onClick={() => addBlockFromMenu('input', { inputType: 'date' })}
                >
                  <CalendarDays className="h-5 w-5 mb-2 text-violet-500" />
                  <span className="text-xs font-medium">Data</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center justify-center h-auto py-3 bg-white hover:bg-gray-50 text-gray-800"
                  onClick={() => addBlockFromMenu('input', { inputType: 'select' })}
                >
                  <List className="h-5 w-5 mb-2 text-violet-500" />
                  <span className="text-xs font-medium">Seleção</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 