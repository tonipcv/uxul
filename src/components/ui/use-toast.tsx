'use client';

import { useState, useEffect } from 'react';

type ToastVariant = 'default' | 'destructive' | 'success';

interface ToastProps {
  id?: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

// Contador sequencial para gerar IDs determinísticos
let idCounter = 0;

// Para reiniciar contador periodicamente
if (typeof window !== 'undefined') {
  // Reiniciar contador a cada hora para evitar crescimento infinito
  setInterval(() => {
    idCounter = 0;
  }, 60 * 60 * 1000);
}

const toastState = {
  toasts: [] as ToastProps[],
  listeners: [] as Function[],
};

export function toast(props: ToastProps) {
  // Usar um ID sequencial, que é determinístico
  const id = `toast-${++idCounter}`;
  const toast = {
    id,
    ...props,
    duration: props.duration || 3000,
  };
  
  toastState.toasts.push(toast);
  toastState.listeners.forEach(listener => listener([...toastState.toasts]));
  
  setTimeout(() => {
    toastState.toasts = toastState.toasts.filter(t => t.id !== id);
    toastState.listeners.forEach(listener => listener([...toastState.toasts]));
  }, toast.duration);
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  
  useEffect(() => {
    const listener = (newToasts: ToastProps[]) => {
      setToasts(newToasts);
    };
    
    toastState.listeners.push(listener);
    return () => {
      toastState.listeners = toastState.listeners.filter(l => l !== listener);
    };
  }, []);
  
  return toasts;
}

export default function Toaster() {
  const toasts = useToast();
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Não renderizar no servidor para evitar erros de hidratação
  if (!isClient) return null;
  if (!toasts.length) return null;
  
  return (
    <div className="fixed bottom-0 right-0 p-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className={`px-4 py-3 rounded-md shadow-lg max-w-sm transform transition-all duration-300 ease-in-out translate-x-0 ${
            toast.variant === 'destructive' 
              ? 'bg-red-600 text-white' 
              : toast.variant === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-zinc-800 text-white'
          }`}
        >
          <div className="text-sm font-semibold">{toast.title}</div>
          {toast.description && (
            <div className="text-xs mt-1 opacity-90">{toast.description}</div>
          )}
        </div>
      ))}
    </div>
  );
} 