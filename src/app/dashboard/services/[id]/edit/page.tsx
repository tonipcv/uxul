'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ServiceForm from '@/components/services/ServiceForm';
import { Service, UpdateServiceInput } from '@/types/service';
import Navigation from '@/components/Navigation';

interface EditServicePageProps {
  params: {
    id: string;
  };
}

export default function EditServicePage({ params }: EditServicePageProps) {
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const response = await fetch(`/api/services/${params.id}`);
        if (!response.ok) {
          throw new Error('Serviço não encontrado');
        }
        const data = await response.json();
        setService(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar serviço');
      } finally {
        setIsLoading(false);
      }
    };

    fetchService();
  }, [params.id]);

  const handleSubmit = async (data: UpdateServiceInput) => {
    try {
      const response = await fetch(`/api/services/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar serviço');
      }

      router.push('/dashboard/services');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar serviço');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Navigation />
      
      <main className="flex-1 p-8">
        <div className="container mx-auto">
          {isLoading ? (
            <div className="text-center">Carregando...</div>
          ) : error ? (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          ) : !service ? (
            <div className="text-center">Serviço não encontrado</div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold">Editar Serviço</h1>
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <ServiceForm
                  service={service}
                  onSubmit={handleSubmit}
                  onCancel={() => router.push('/dashboard/services')}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
} 