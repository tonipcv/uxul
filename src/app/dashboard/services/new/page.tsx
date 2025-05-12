'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ServiceForm from '@/components/services/ServiceForm';
import { CreateServiceInput, UpdateServiceInput } from '@/types/service';
import Navigation from '@/components/Navigation';

export default function NewServicePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: CreateServiceInput | UpdateServiceInput) => {
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar serviço');
      }

      router.push('/dashboard/services');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar serviço');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Navigation />
      
      <main className="flex-1 p-8">
        <div className="container mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Novo Serviço</h1>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
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
          )}

          <div className="rounded-lg bg-white p-6 shadow">
            <ServiceForm
              onSubmit={handleSubmit}
              onCancel={() => router.push('/dashboard/services')}
            />
          </div>
        </div>
      </main>
    </div>
  );
} 