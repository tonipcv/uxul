'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

export default function VerifyAccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    async function verifyToken() {
      try {
        const token = searchParams.get('token');
        
        if (!token) {
          setError('Token não encontrado');
          setIsVerifying(false);
          return;
        }

        const response = await fetch('/api/patient/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao verificar token');
        }

        // Redirecionar para a URL retornada pela API ou fallback para dashboard
        router.push(data.redirectUrl || '/patient/dashboard');

      } catch (error) {
        console.error('Erro na verificação:', error);
        setError(error instanceof Error ? error.message : 'Erro ao verificar acesso');
        setIsVerifying(false);
      }
    }

    verifyToken();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-white relative flex items-center justify-center">
      <div className="w-full max-w-[480px] mx-auto px-4">
        <div className="flex justify-center mb-8 items-center gap-3">
          <Image
            src="/logo.png"
            alt="MED1 Logo"
            width={48}
            height={48}
            priority
            className="h-12 w-12"
          />
          <span className="text-3xl font-semibold text-[#5c5b60]">MED1</span>
        </div>
        
        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
          <div className="text-center space-y-6">
            {isVerifying ? (
              <>
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                <h1 className="text-2xl font-semibold text-gray-800">
                  Verificando acesso...
                </h1>
                <p className="text-gray-600">
                  Aguarde enquanto validamos seu token de acesso.
                </p>
              </>
            ) : error ? (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <svg 
                    className="w-8 h-8 text-red-500" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M6 18L18 6M6 6l12 12" 
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-semibold text-gray-800">
                  Erro na verificação
                </h1>
                <p className="text-gray-600">
                  {error}
                </p>
                <button
                  onClick={() => router.push('/patient/login')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Voltar para o login
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
} 