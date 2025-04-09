'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

export default function FirstAccessPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 8 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/patient/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        toast({
          title: "Senha alterada",
          description: "Sua senha foi alterada com sucesso",
        });
        router.push('/patient/dashboard');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao alterar senha');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar sua senha. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background font-['Helvetica'] font-light px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-white mb-2">Primeiro Acesso</h1>
          <p className="text-gray-300">Por favor, defina sua nova senha</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-white">Nova senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 h-10 bg-white"
                placeholder="Digite sua nova senha"
                required
              />
            </div>

            <div>
              <Label htmlFor="confirm-password" className="text-white">Confirme a nova senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 h-10 bg-white"
                placeholder="Digite novamente sua senha"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10"
            disabled={loading}
          >
            {loading ? 'Alterando senha...' : 'Alterar senha'}
          </Button>
        </form>
      </div>
    </div>
  );
} 