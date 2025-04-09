'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/patient/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao solicitar recuperação de senha');
      }

      toast.success('Email de recuperação enviado com sucesso!');
      router.push('/patient/login');

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao solicitar recuperação de senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-montserrat text-white mb-2">MED1</h1>
          <p className="text-blue-100">Recupere sua senha</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 shadow-lg">
          <div className="mb-6">
            <Link 
              href="/patient/login" 
              className="inline-flex items-center text-blue-200 hover:text-white text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar para o login
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20"
              />
            </div>

            <p className="text-sm text-blue-200">
              Enviaremos um link para redefinir sua senha no email informado.
            </p>

            <Button 
              type="submit" 
              className="w-full bg-white text-blue-900 hover:bg-white/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar link de recuperação'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
} 