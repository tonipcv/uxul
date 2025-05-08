'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

function ValidateTokenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const patientId = searchParams.get('id');
        const token = searchParams.get('token');

        if (!patientId || !token) {
          setError('Link inválido');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/patient/validate-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ patientId, token }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Erro ao validar token');
          setLoading(false);
          return;
        }

        // Token válido, redirecionar para a página do paciente
        router.push(`/patient/${patientId}`);
      } catch (err) {
        setError('Erro ao validar token');
        setLoading(false);
      }
    };

    validateToken();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4 pt-20">
      <div className="w-full max-w-md">
        <Link href="/" className="flex justify-center mb-6">
          <Image
            src="/logo.png"
            alt="Logo"
            width={150}
            height={50}
            className="h-10 w-auto"
          />
        </Link>

        <Card className="p-6 shadow-lg">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Validando acesso
            </h1>
            <p className="text-gray-600">
              Por favor, aguarde enquanto validamos seu acesso.
            </p>
          </div>

          {loading && (
            <div className="flex justify-center mb-6">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}

          {error && (
            <div className="space-y-4">
              <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
                {error}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/patient/access')}
              >
                Solicitar novo acesso
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function ValidateTokenPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#2b2a2c] flex flex-col items-center justify-center p-4 pt-20">
        <div className="w-full max-w-md text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto" />
          <p className="mt-4 text-white">Carregando...</p>
        </div>
      </div>
    }>
      <ValidateTokenContent />
    </Suspense>
  );
} 