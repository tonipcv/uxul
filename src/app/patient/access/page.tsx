'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Mail, ArrowRight } from 'lucide-react';

export default function PatientAccessPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/patient/access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          const errorMsg = 'E-mail não encontrado no sistema. Por favor, verifique o e-mail informado.';
          setError(errorMsg);
          throw new Error(errorMsg);
        } else {
          throw new Error(data.error || 'Erro ao solicitar acesso');
        }
      }

      toast.success('Link de acesso enviado para seu email!');
      setEmail('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao solicitar acesso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-montserrat font-light text-white mb-2">MED1</h1>
            <p className="text-zinc-400">Área do Paciente</p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 sm:p-8">
            <h2 className="text-xl font-medium text-white mb-6">Solicitar Acesso</h2>
            <p className="text-zinc-400 mb-6">
              Digite seu email para receber um link de acesso ao seu prontuário.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="seu@email.com"
                    required
                    className={`pl-10 bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500 ${
                      error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                </div>
                {error && (
                  <p className="mt-2 text-sm text-red-500">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  </div>
                ) : (
                  <>
                    Solicitar Acesso
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-zinc-400">
              Não tem uma conta?{' '}
              <button
                onClick={() => router.push('/register')}
                className="text-blue-500 hover:text-blue-400 font-medium"
              >
                Cadastre-se
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 