'use client';

import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background font-['Helvetica'] font-light px-4">
        <div className="w-full max-w-[350px] mx-auto">
          <Card className="border-none shadow-none">
            <CardHeader className="space-y-1 pb-4">
              <Logo className="flex justify-center h-8 w-8 mx-auto" />
            </CardHeader>
            <CardContent className="text-center text-white/70">
              Link de recuperação de senha inválido.
            </CardContent>
            <CardFooter>
              <Link 
                href="/auth/signin" 
                className="text-sm text-white/70 hover:text-white transition-colors w-full text-center"
              >
                Voltar para login
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Algo deu errado');
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/auth/signin');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background font-['Helvetica'] font-light px-4">
        <div className="w-full max-w-[350px] mx-auto">
          <Card className="border-none shadow-none">
            <CardHeader className="space-y-1 pb-4">
              <Logo className="flex justify-center h-8 w-8 mx-auto" />
            </CardHeader>
            <CardContent className="text-center text-white/70">
              Senha alterada com sucesso! Redirecionando para o login...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background font-['Helvetica'] font-light px-4">
      <div className="w-full max-w-[350px] mx-auto">
        <Card className="border-none shadow-none">
          <CardHeader className="space-y-1 pb-4">
            <Logo className="flex justify-center h-8 w-8 mx-auto" />
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirme a nova senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div className="text-sm text-red-500 text-center">
                  {error}
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full border-white border bg-transparent hover:bg-white/10 text-white hover:text-white" 
                disabled={isLoading}
              >
                {isLoading ? "Alterando senha..." : "Alterar senha"}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <Link 
              href="/auth/signin" 
              className="text-sm text-white/70 hover:text-white transition-colors w-full text-center"
            >
              Voltar para login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
} 