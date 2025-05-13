import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Service } from '@/types/service';

interface ServiceFormProps {
  service?: Service;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function ServiceForm({ service, onSubmit, onCancel }: ServiceFormProps) {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    price: service?.price || '',
    category: service?.category || '',
    isActive: service?.isActive ?? true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">Informações Básicas</h3>
        <div className="grid gap-4 bg-gray-50/50 p-4 rounded-lg">
      <div className="space-y-2">
            <Label htmlFor="name" className="text-sm text-gray-700">Nome do Serviço</Label>
        <Input
          id="name"
              name="name"
          value={formData.name}
              onChange={handleInputChange}
              placeholder="Ex: Consulta Inicial"
              className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900"
        />
      </div>

      <div className="space-y-2">
            <Label htmlFor="description" className="text-sm text-gray-700">Descrição</Label>
        <Textarea
          id="description"
              name="description"
          value={formData.description}
              onChange={handleInputChange}
              placeholder="Descreva o serviço..."
              className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900 min-h-[100px]"
        />
          </div>
        </div>
      </div>

      {/* Informações Comerciais */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">Informações Comerciais</h3>
        <div className="grid gap-4 bg-gray-50/50 p-4 rounded-lg">
      <div className="space-y-2">
            <Label htmlFor="price" className="text-sm text-gray-700">Preço</Label>
        <Input
              id="price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="0,00"
              className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900"
        />
      </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm text-gray-700">Categoria</Label>
            <Input
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              placeholder="Ex: Consultas"
              className="bg-white/50 border-gray-200 focus:border-gray-300 text-gray-900"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="bg-white"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !formData.name || !formData.price}
          className="bg-[#0070df] hover:bg-[#0070df]/90"
        >
          {isSubmitting ? 'Salvando...' : service ? 'Salvar Alterações' : 'Criar Serviço'}
        </Button>
      </div>
    </form>
  );
} 