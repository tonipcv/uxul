'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function PatientLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/patient/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login');
      }

      router.push(`/patient/${data.data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
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
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
              <Input
                  id="email"
                  type="email"
                placeholder="Seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white text-black"
                />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">Senha</Label>
              <Input
                  id="password"
                  type="password"
                placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white text-black"
                />
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <Button 
                type="submit"
              className="w-full bg-[#0070df] text-white hover:bg-[#0070df]/90 transition-colors border-none rounded-full"
              disabled={isLoading}
              >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Ou</span>
              </div>
            </div>

              <Link
              href="/patient/setup-password"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
              Definir senha pela primeira vez
              </Link>
          </form>
        </div>
      </div>
    </div>
  );
} 