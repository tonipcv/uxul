"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, SheetClose, SheetTrigger } from "@/components/ui/sheet"

/**
 * SafeSheet - Um wrapper para o componente Sheet que recarrega a página quando fechado
 * para evitar problemas de travamento da UI
 */

interface SafeSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  reloadDelay?: number  // Delay em ms antes de recarregar a página
  skipReload?: boolean  // Opção para pular o reload em casos específicos
}

export function SafeSheet({ 
  open, 
  onOpenChange, 
  children,
  reloadDelay = 100,  // Valor padrão de 100ms
  skipReload = false, // Por padrão, sempre recarrega
}: SafeSheetProps) {
  // Handler personalizado que recarrega a página quando o Sheet é fechado
  const handleOpenChange = (newOpen: boolean) => {
    // Chama o handler original
    onOpenChange(newOpen);
    
    // Se estiver fechando o Sheet e não devemos pular o reload
    if (!newOpen && !skipReload) {
      // Espera pelo tempo de delay configurado para permitir que o estado seja atualizado e
      // as animações comecem antes de recarregar a página
      setTimeout(() => {
        window.location.reload();
      }, reloadDelay);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {children}
    </Sheet>
  );
}

// Re-exportando os componentes do Sheet para manter a API consistente
export { 
  SheetContent, 
  SheetHeader, 
  SheetFooter, 
  SheetTitle, 
  SheetDescription, 
  SheetClose, 
  SheetTrigger 
} 