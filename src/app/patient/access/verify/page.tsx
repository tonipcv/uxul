'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando seu acesso...');

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const token = searchParams.get('token');
        
        if (!token) {
          setStatus('error');
          setMessage('Token de verificação inválido ou ausente.');
          return;
        }
        
        const response = await fetch(`/api/patient/verify?token=${token}`);
        const data = await response.json();
        
        if (response.ok) {
          setStatus('success');
          setMessage('Acesso verificado com sucesso! Você será redirecionado...');
          
          // Redirecionar após um curto delay
          setTimeout(() => {
            router.push('/patient/dashboard');
          }, 2000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Erro ao verificar acesso.');
        }
      } catch (error) {
        console.error('Erro ao verificar acesso:', error);
        setStatus('error');
        setMessage('Ocorreu um erro ao verificar seu acesso.');
      }
    };
    
    verifyAccess();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-xl font-medium text-gray-900 mb-2">Verificação de Acesso</h1>
          
          {status === 'loading' && (
            <div className="flex flex-col items-center mt-6">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-600">{message}</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="mt-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-600 mb-4">{message}</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="mt-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-gray-600 mb-4">{message}</p>
              <Button 
                onClick={() => router.push('/patient/login')}
                className="w-full"
              >
                Voltar para o Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
          <div className="text-center">
            <h1 className="text-xl font-medium text-gray-900 mb-2">Verificação de Acesso</h1>
            <div className="flex flex-col items-center mt-6">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-600">Carregando...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
} 