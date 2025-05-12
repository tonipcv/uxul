import { useState } from 'react';
import { Service, CreateServiceInput, UpdateServiceInput } from '@/types/service';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ServiceFormProps {
  service?: Service;
  onSubmit: (data: CreateServiceInput | UpdateServiceInput) => Promise<void>;
  onCancel: () => void;
}

export default function ServiceForm({ service, onSubmit, onCancel }: ServiceFormProps) {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    price: service?.price || 0,
    category: service?.category || '',
    isActive: service?.isActive ?? true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-gray-700 tracking-[-0.03em] font-inter">
          Nome do Serviço
        </Label>
        <Input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Consulta Médica, Exame de Sangue..."
          className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-9 text-sm"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium text-gray-700 tracking-[-0.03em] font-inter">
          Descrição
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descreva os detalhes do serviço..."
          className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl text-sm min-h-[100px]"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price" className="text-sm font-medium text-gray-700 tracking-[-0.03em] font-inter">
          Preço
        </Label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-500 text-sm">R$</span>
          </div>
          <Input
            type="number"
            id="price"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            placeholder="0,00"
            className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-9 text-sm pl-10"
            required
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category" className="text-sm font-medium text-gray-700 tracking-[-0.03em] font-inter">
          Categoria
        </Label>
        <Input
          type="text"
          id="category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          placeholder="Ex: Consultas, Exames, Procedimentos..."
          className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl h-9 text-sm"
        />
      </div>

      {service && (
        <div className="flex items-center space-x-2 pt-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor="isActive" className="text-sm text-gray-700">
            Serviço Ativo
          </Label>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-800"
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          {isSubmitting ? 'Salvando...' : service ? 'Atualizar' : 'Criar'}
        </Button>
      </div>
    </form>
  );
} 