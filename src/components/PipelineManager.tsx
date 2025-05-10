'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { PlusIcon } from "@heroicons/react/24/outline";

interface Pipeline {
  id: string;
  name: string;
  description?: string;
  columns?: {
    id: string;
    title: string;
  }[];
}

interface PipelineManagerProps {
  pipelines: Pipeline[];
  currentPipelineId: string;
  onPipelineChange: (pipelineId: string) => void;
  onPipelineCreate: (pipeline: Pick<Pipeline, 'name' | 'description'>) => Promise<void>;
}

export function PipelineManager({ pipelines, currentPipelineId, onPipelineChange, onPipelineCreate }: PipelineManagerProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPipeline, setNewPipeline] = useState({
    name: '',
    description: ''
  });

  const handleCreatePipeline = async () => {
    try {
      await onPipelineCreate(newPipeline);
      setIsCreateModalOpen(false);
      setNewPipeline({
        name: '',
        description: ''
      });
      toast({
        title: "Pipeline criado",
        description: "O novo pipeline foi criado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao criar pipeline:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o pipeline",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="flex items-center gap-2">
        {pipelines.map((pipeline) => (
          <Button
            key={pipeline.id}
            variant={pipeline.id === currentPipelineId ? "default" : "outline"}
            onClick={() => onPipelineChange(pipeline.id)}
            className="h-9 px-4 rounded-xl"
          >
            {pipeline.name}
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={() => setIsCreateModalOpen(true)}
        className="h-9 bg-gray-800/5 border-0 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl text-gray-700 hover:bg-gray-800/10"
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        Novo Pipeline
      </Button>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-6">
          <DialogHeader>
            <DialogTitle>Criar Novo Pipeline</DialogTitle>
            <DialogDescription>
              Configure um novo pipeline para gerenciar seus leads
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Pipeline</Label>
              <Input
                id="name"
                value={newPipeline.name}
                onChange={(e) => setNewPipeline({ ...newPipeline, name: e.target.value })}
                placeholder="Ex: Pipeline de Vendas"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={newPipeline.description}
                onChange={(e) => setNewPipeline({ ...newPipeline, description: e.target.value })}
                placeholder="Descreva o objetivo deste pipeline"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreatePipeline}
                disabled={!newPipeline.name}
              >
                Criar Pipeline
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 