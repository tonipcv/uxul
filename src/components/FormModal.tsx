'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  primaryColor: string;
  pipelineId?: string;
  successPage?: string;
}

export function FormModal({ isOpen, onClose, title, primaryColor, pipelineId, successPage }: FormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pipelineId) {
      toast.error('Pipeline não configurado');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/public/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          pipelineId
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar formulário');
      }

      // Limpa o formulário e fecha o modal
      setFormData({ name: '', email: '', phone: '' });
      onClose();

      // Mostra mensagem de sucesso
      toast.success('Formulário enviado com sucesso!');

      // Redireciona para a página de sucesso se especificada
      if (successPage) {
        window.location.href = successPage;
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar formulário');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-semibold" style={{ color: primaryColor }}>
            {title}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="modal-name" className="text-sm text-gray-600">Nome</Label>
            <Input 
              id="modal-name" 
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Seu nome completo"
              className="mt-1"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="modal-email" className="text-sm text-gray-600">Email</Label>
            <Input 
              id="modal-email" 
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="seu@email.com"
              className="mt-1"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="modal-phone" className="text-sm text-gray-600">WhatsApp</Label>
            <Input 
              id="modal-phone" 
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="(00) 00000-0000"
              className="mt-1"
              required
              disabled={isSubmitting}
            />
          </div>
          <Button 
            type="submit"
            className="w-full"
            style={{
              backgroundColor: primaryColor,
              color: 'white',
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 