'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PatientAccessPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/patient/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('E-mail não encontrado. Verifique se este é o email cadastrado pelo seu médico.');
        } else {
          throw new Error(data.error || 'Não foi possível enviar o link de acesso');
        }
      }

      setSuccess(true);
      toast.success('Link de acesso enviado!', {
        description: 'Verifique sua caixa de entrada e spam.',
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao solicitar acesso');
      toast.error('Erro ao solicitar acesso', {
        description: error instanceof Error ? error.message : 'Tente novamente mais tarde',
      });
    } finally {
      setLoading(false);
    }
  };

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
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              Área do Paciente
            </h1>
            <p className="text-gray-600 mt-2">
              Digite seu email para receber um link de acesso seguro
            </p>
        </div>

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
                    if (success) setSuccess(false);
                  }}
                  placeholder="Digite seu email"
                  required
                  className={`pl-10 h-12 bg-white text-black ${
                    error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 
                    success ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : ''
                  }`}
                  disabled={loading || success}
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  {error}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || success || !email}
              className="w-full h-12 bg-[#0070df] text-white hover:bg-[#0070df]/90 transition-colors border-none rounded-full disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Enviando link...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Link enviado!
                </>
              ) : (
                <>
                  Receber link de acesso
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/patient/login" 
              className="text-gray-600 hover:text-black text-sm block mb-2"
            >
              Prefere fazer login com email e senha?
            </Link>
            <Link 
              href="/patient/register" 
              className="text-gray-600 hover:text-black text-sm"
            >
              Não tem uma conta? Cadastre-se
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 