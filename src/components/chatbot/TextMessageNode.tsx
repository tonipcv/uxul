'use client';

import { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MessageSquare, Trash } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

// Helper function to highlight variables in message text
const formatMessageWithVariables = (message: string) => {
  if (!message) return '';
  
  // Replace {{variable}} patterns with highlighted spans
  const formattedMessage = message.replace(
    /\{\{([^}]+)\}\}/g, 
    '<span class="bg-blue-100 text-blue-800 rounded px-1 text-xs font-mono">{{$1}}</span>'
  );
  
  return formattedMessage;
};

export default function TextMessageNode({ id, data, selected }: NodeProps) {
  const [message, setMessage] = useState(data.message || 'Mensagem do chatbot');
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    data.onChange?.(id, { message });
    setIsEditing(false);
  };

  const handleDelete = () => {
    data.onDelete?.(id);
  };

  return (
    <div className={`bg-white rounded-md border-2 ${selected ? 'border-blue-500' : 'border-gray-200'} p-3 w-[250px] shadow-md`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-500" />
          <span className="text-xs font-medium text-gray-700">Mensagem</span>
        </div>
        {selected && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full hover:bg-red-50 hover:text-red-500"
            onClick={handleDelete}
          >
            <Trash className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[100px] text-sm"
            placeholder="Digite a mensagem do bot..."
          />
          <div className="text-xs text-gray-500 mb-2">
            Use <span className="bg-blue-100 text-blue-800 rounded px-1 font-mono">{"{{nome_variavel}}"}</span> para incluir variáveis de respostas anteriores
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={handleSave}
            >
              Salvar
            </Button>
          </div>
        </div>
      ) : (
        <div 
          className="p-2 bg-white border border-gray-200 rounded text-sm text-gray-700 cursor-pointer min-h-[40px]"
          onClick={() => setIsEditing(true)}
        >
          {message ? (
            <div dangerouslySetInnerHTML={{ __html: formatMessageWithVariables(message) }} />
          ) : (
            <span className="text-gray-400 italic">Clique para editar a mensagem</span>
          )}
        </div>
      )}
      
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-gray-400 border-2 border-white"
      />
    </div>
  );
} 