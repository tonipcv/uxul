import ServiceForm from './ServiceForm';
import { Service, CreateServiceInput, UpdateServiceInput } from '@/types/service';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateServiceInput | UpdateServiceInput) => Promise<void>;
  service?: Service;
}

export default function ServiceModal({ isOpen, onClose, onSubmit, service }: ServiceModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white rounded-2xl border-0 shadow-[0_25px_50px_rgba(0,0,0,0.25)] max-w-md p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base font-bold text-gray-900">
            {service ? 'Editar Serviço' : 'Novo Serviço'}
          </DialogTitle>
        </DialogHeader>
        <div className="absolute right-4 top-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-md hover:bg-gray-100"
            onClick={onClose}
          >
            <span className="sr-only">Fechar</span>
            <XMarkIcon className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
        <div className="mt-2">
          <ServiceForm
            service={service}
            onSubmit={onSubmit}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 