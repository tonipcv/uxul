'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, ArrowRight, LogIn } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

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
    <div className="min-h-[100dvh] bg-white flex flex-col items-center justify-center px-4 pb-8">
      <div className="w-full max-w-[400px] mx-auto relative z-10">
        <div className="flex justify-center mb-8">
          <Logo className="scale-150" variant="dark" />
        </div>
        
        <div className="space-y-2 text-center mb-8">
          <h2 className="text-2xl font-medium text-black">Área do Paciente</h2>
          <p className="text-gray-600">Solicite um link de acesso ao seu prontuário</p>
        </div>

        <div className="bg-white rounded-xl p-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                  className={`pl-10 bg-white text-black ${
                    error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                />
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white hover:bg-gray-900 transition-colors border-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                </div>
              ) : (
                <>
                  Solicitar Link de Acesso
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-4">
              Prefere fazer login com email e senha?
            </p>
            <Button
              variant="outline"
              className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
              onClick={() => router.push('/patient/login')}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Acessar com Email e Senha
            </Button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Não tem uma conta?{' '}
            <Link href="/patient/register" className="text-black hover:text-gray-900 font-medium">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 