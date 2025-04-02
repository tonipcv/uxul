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

const toastState = {
  toasts: [] as ToastProps[],
  listeners: [] as Function[],
};

export function toast(props: ToastProps) {
  const id = Math.random().toString(36).substring(2, 9);
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
  
  if (!toasts.length) return null;
  
  return (
    <div className="fixed bottom-0 right-0 p-4 z-50 flex flex-col gap-2">
      {toasts.map((toast, index) => (
        <div 
          key={index} 
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