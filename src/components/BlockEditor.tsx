'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, GripVertical, Trash2, Link2, FormInput, Loader2, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Block {
  id: string;
  type: 'BUTTON' | 'FORM';
  content: any;
  order: number;
}

interface BlockEditorProps {
  blocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
  disabled?: boolean;
}

export function BlockEditor({ blocks, onBlocksChange, disabled = false }: BlockEditorProps) {
  const [draggedBlock, setDraggedBlock] = useState<Block | null>(null);
  const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null);
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set());
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);
  const [pipelines, setPipelines] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        const response = await fetch('/api/pipelines');
        if (!response.ok) {
          throw new Error('Erro ao buscar pipelines');
        }
        const data = await response.json();
        setPipelines(data);
      } catch (error) {
        console.error('Erro ao buscar pipelines:', error);
        toast.error('Não foi possível carregar os pipelines');
      }
    };

    fetchPipelines();
  }, []);

  const handleAddBlock = async (type: 'BUTTON' | 'FORM') => {
    setIsAddingBlock(true);
    try {
      const newBlock: Block = {
        id: crypto.randomUUID(),
        type,
        content: type === 'BUTTON' 
          ? { label: 'New Button', url: '' } 
          : { 
              title: 'New Form', 
              isModal: false, 
              modalTitle: '',
              pipelineId: '',
              successPage: ''
            },
        order: blocks.length,
      };
      await onBlocksChange([...blocks, newBlock]);
      toast.success('Block added');
    } finally {
      setIsAddingBlock(false);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    setDeletingBlockId(blockId);
    try {
      const blockToDelete = blocks.find(block => block.id === blockId);
      if (!blockToDelete) return;

      const newBlocks = blocks
        .filter(block => block.id !== blockId)
        .map((block, index) => ({
          ...block,
          order: index
        }));

      await onBlocksChange(newBlocks);
      
      toast.success('Bloco removido!', {
        description: `O ${blockToDelete.type === 'BUTTON' ? 'botão' : 'formulário'} foi excluído com sucesso.`,
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#fff',
          color: '#333',
          border: '1px solid #e2e8f0'
        }
      });
    } finally {
      setDeletingBlockId(null);
    }
  };

  const toggleBlockSelection = (blockId: string) => {
    const newSelection = new Set(selectedBlocks);
    if (newSelection.has(blockId)) {
      newSelection.delete(blockId);
    } else {
      newSelection.add(blockId);
    }
    setSelectedBlocks(newSelection);
  };

  const handleDeleteSelected = async () => {
    if (selectedBlocks.size === 0) return;

    setIsDeletingMultiple(true);
    try {
      const newBlocks = blocks
        .filter(block => !selectedBlocks.has(block.id))
        .map((block, index) => ({
          ...block,
          order: index
        }));

      await onBlocksChange(newBlocks);
      
      toast.success('Blocos removidos!', {
        description: `${selectedBlocks.size} ${selectedBlocks.size === 1 ? 'bloco foi removido' : 'blocos foram removidos'} com sucesso.`,
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#fff',
          color: '#333',
          border: '1px solid #e2e8f0'
        }
      });
      
      setSelectedBlocks(new Set());
    } finally {
      setIsDeletingMultiple(false);
    }
  };

  const handleBlockContentChange = (blockId: string, content: any) => {
    const newBlocks = blocks.map((block) =>
      block.id === blockId ? { ...block, content } : block
    );
    onBlocksChange(newBlocks);
  };

  const handleDragStart = (block: Block) => {
    if (disabled) return;
    setDraggedBlock(block);
  };

  const handleDragOver = (e: React.DragEvent, targetBlock: Block) => {
    if (disabled) return;
    e.preventDefault();
    if (!draggedBlock || draggedBlock.id === targetBlock.id) return;

    const newBlocks = [...blocks];
    const draggedIndex = blocks.findIndex((b) => b.id === draggedBlock.id);
    const targetIndex = blocks.findIndex((b) => b.id === targetBlock.id);

    newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(targetIndex, 0, draggedBlock);

    const reorderedBlocks = newBlocks.map((block, index) => ({
      ...block,
      order: index,
    }));
    onBlocksChange(reorderedBlocks);
  };

  const handleDragEnd = () => {
    if (disabled) return;
    setDraggedBlock(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button 
            onClick={() => handleAddBlock('BUTTON')} 
            variant="outline"
            disabled={disabled || isAddingBlock}
          >
            {isAddingBlock ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <PlusCircle className="h-4 w-4 mr-2" />
            )}
            Add Button
          </Button>
          <Button 
            onClick={() => handleAddBlock('FORM')} 
            variant="outline"
            disabled={disabled || isAddingBlock}
          >
            {isAddingBlock ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <PlusCircle className="h-4 w-4 mr-2" />
            )}
            Add Form
          </Button>
        </div>

        {selectedBlocks.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {selectedBlocks.size} {selectedBlocks.size === 1 ? 'bloco selecionado' : 'blocos selecionados'}
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={isDeletingMultiple}
            >
              {isDeletingMultiple ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Excluir Selecionados
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {blocks.map((block) => (
          <Card
            key={block.id}
            draggable={!disabled}
            onDragStart={() => handleDragStart(block)}
            onDragOver={(e) => handleDragOver(e, block)}
            onDragEnd={handleDragEnd}
            className={cn(
              "relative group transition-all duration-200",
              selectedBlocks.has(block.id) && "border-blue-500 bg-blue-50/50"
            )}
          >
            <CardContent className="pt-4">
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  onClick={() => toggleBlockSelection(block.id)}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                >
                  {selectedBlocks.has(block.id) ? (
                    <CheckSquare className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                </button>

                <div
                  className="cursor-move p-2 hover:bg-gray-100 rounded"
                  draggable
                  onDragStart={() => handleDragStart(block)}
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>

                <div className="flex-1">
                  {block.type === 'BUTTON' ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">Button Block</span>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`button-label-${block.id}`}>Label</Label>
                        <Input
                          id={`button-label-${block.id}`}
                          value={block.content.label}
                          onChange={(e) =>
                            handleBlockContentChange(block.id, {
                              ...block.content,
                              label: e.target.value,
                            })
                          }
                          disabled={disabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`button-url-${block.id}`}>URL</Label>
                        <Input
                          id={`button-url-${block.id}`}
                          value={block.content.url}
                          onChange={(e) =>
                            handleBlockContentChange(block.id, {
                              ...block.content,
                              url: e.target.value,
                            })
                          }
                          disabled={disabled}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <FormInput className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">Form Block</span>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`form-title-${block.id}`}>Form Title</Label>
                        <Input
                          id={`form-title-${block.id}`}
                          value={block.content.title}
                          onChange={(e) =>
                            handleBlockContentChange(block.id, {
                              ...block.content,
                              title: e.target.value,
                            })
                          }
                          disabled={disabled}
                        />
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <input
                          type="checkbox"
                          id={`form-modal-${block.id}`}
                          checked={block.content.isModal}
                          onChange={(e) =>
                            handleBlockContentChange(block.id, {
                              ...block.content,
                              isModal: e.target.checked,
                            })
                          }
                          disabled={disabled}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor={`form-modal-${block.id}`}>Exibir em modal</Label>
                      </div>

                      {block.content.isModal && (
                        <div className="space-y-2 mt-4">
                          <Label htmlFor={`modal-title-${block.id}`}>Título do Modal</Label>
                          <Input
                            id={`modal-title-${block.id}`}
                            value={block.content.modalTitle}
                            onChange={(e) =>
                              handleBlockContentChange(block.id, {
                                ...block.content,
                                modalTitle: e.target.value,
                              })
                            }
                            placeholder="Ex: Preencha seus dados"
                            disabled={disabled}
                          />
                          <p className="text-xs text-gray-500">
                            Este título será exibido no topo do modal. Se não preenchido, será usado o título do formulário.
                          </p>
                        </div>
                      )}

                      <div className="space-y-2 mt-4">
                        <Label htmlFor={`pipeline-${block.id}`}>Pipeline</Label>
                        <Select
                          value={block.content.pipelineId || ''}
                          onValueChange={(value) =>
                            handleBlockContentChange(block.id, {
                              ...block.content,
                              pipelineId: value,
                            })
                          }
                          disabled={disabled}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma pipeline" />
                          </SelectTrigger>
                          <SelectContent>
                            {pipelines.map((pipeline) => (
                              <SelectItem key={pipeline.id} value={pipeline.id}>
                                {pipeline.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">
                          Selecione para qual pipeline os dados do formulário serão enviados.
                        </p>
                      </div>

                      <div className="space-y-2 mt-4">
                        <Label htmlFor={`success-page-${block.id}`}>Página de Sucesso</Label>
                        <Input
                          id={`success-page-${block.id}`}
                          value={block.content.successPage || ''}
                          onChange={(e) =>
                            handleBlockContentChange(block.id, {
                              ...block.content,
                              successPage: e.target.value,
                            })
                          }
                          placeholder="Ex: https://exemplo.com/obrigado"
                          disabled={disabled}
                        />
                        <p className="text-xs text-gray-500">
                          URL para onde o usuário será redirecionado após enviar o formulário.
                        </p>
                      </div>

                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteBlock(block.id)}
                  disabled={disabled || deletingBlockId === block.id}
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {deletingBlockId === block.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 