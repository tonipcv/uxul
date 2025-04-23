'use client';

import { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitCompare, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ConditionNode({ id, data, selected }: NodeProps) {
  const [variable, setVariable] = useState(data.variable || '');
  const [operator, setOperator] = useState(data.operator || 'equals');
  const [value, setValue] = useState(data.value || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    data.onChange?.(id, {
      variable,
      operator,
      value
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    data.onDelete?.(id);
  };

  const getOperatorLabel = (op: string) => {
    switch (op) {
      case 'equals': return 'é igual a';
      case 'contains': return 'contém';
      case 'startsWith': return 'começa com';
      case 'endsWith': return 'termina com';
      case 'greaterThan': return 'é maior que';
      case 'lessThan': return 'é menor que';
      default: return op;
    }
  };

  return (
    <div className={`bg-white rounded-md border-2 ${selected ? 'border-blue-500' : 'border-gray-200'} p-3 w-[250px] shadow-md`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <GitCompare className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-medium text-gray-700">Condição</span>
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
          <div>
            <Label className="text-xs">Variável</Label>
            <Input
              value={variable}
              onChange={(e) => setVariable(e.target.value)}
              className="text-sm mt-1"
              placeholder="nome_variavel"
            />
          </div>
          
          <div>
            <Label className="text-xs">Operador</Label>
            <Select value={operator} onValueChange={setOperator}>
              <SelectTrigger className="text-xs mt-1">
                <SelectValue placeholder="Selecione o operador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equals">é igual a</SelectItem>
                <SelectItem value="contains">contém</SelectItem>
                <SelectItem value="startsWith">começa com</SelectItem>
                <SelectItem value="endsWith">termina com</SelectItem>
                <SelectItem value="greaterThan">é maior que</SelectItem>
                <SelectItem value="lessThan">é menor que</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-xs">Valor</Label>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="text-sm mt-1"
              placeholder="Valor para comparação"
            />
          </div>
          
          <div className="flex justify-end">
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white"
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
          {variable ? (
            <p>
              <span className="font-medium">{variable}</span>{' '}
              <span>{getOperatorLabel(operator)}</span>{' '}
              <span className="font-medium">"{value}"</span>
            </p>
          ) : (
            <p className="text-gray-400 italic">Clique para configurar a condição</p>
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
        id="true"
        className="w-3 h-3 bg-green-500 border-2 border-white left-[30%]"
      />
      
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="w-3 h-3 bg-red-500 border-2 border-white left-[70%]"
      />
    </div>
  );
} 