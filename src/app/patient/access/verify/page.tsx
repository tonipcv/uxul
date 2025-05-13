'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = searchParams.get('token');
        const id = searchParams.get('id');

        if (!token || !id) {
          setError('Link de acesso inválido');
          setIsLoading(false);
          return;
        }

        // Decodificar os parâmetros
        const decodedToken = decodeURIComponent(token);
        const decodedId = decodeURIComponent(id);

        console.log('Validando acesso para paciente:', decodedId);

        const response = await fetch('/api/patient/validate-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            token: decodedToken, 
            patientId: decodedId 
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('Erro na validação:', data.error);
          throw new Error(data.error || 'Erro ao validar acesso');
        }

        console.log('Token validado com sucesso, redirecionando...');
        
        // Usar a URL de redirecionamento retornada pela API
        if (data.patient?.redirectUrl) {
          router.push(data.patient.redirectUrl);
        } else {
          throw new Error('URL de redirecionamento não encontrada');
        }
      } catch (error) {
        console.error('Erro na verificação:', error);
        setError(error instanceof Error ? error.message : 'Erro ao validar acesso');
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [router, searchParams]);

  if (error) {
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
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">Erro de Acesso</h2>
              <p className="mt-2 text-sm text-gray-600">{error}</p>
              <button
                onClick={() => router.push('/patient/access')}
                className="mt-4 text-sm text-[#0070df] hover:text-[#0070df]/90"
              >
                Voltar para a página de acesso
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-900 mx-auto" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Verificando seu acesso...
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Por favor, aguarde enquanto validamos suas credenciais.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center rounded-full h-12 w-12 bg-white/10 text-white mb-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <p className="text-zinc-400">Carregando...</p>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
} 