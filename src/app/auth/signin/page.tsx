'use client';

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou senha inválidos");
      } else {
        router.refresh();
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      setError("Ocorreu um erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-primary flex flex-col items-center justify-center px-4 pb-8">
      <style jsx global>{`
        body {
          background: var(--gradient-primary);
          min-height: 100vh;
        }
      `}</style>
      <div className="w-full max-w-[400px] mx-auto">
        <div className="flex justify-center mb-8">
          <Logo className="scale-150" variant="light" />
        </div>
        
        <div className="space-y-2 text-center mb-8">
          <h2 className="text-2xl font-light text-white">Bem-vindo de volta</h2>
          <p className="text-blue-100/80 font-light">Entre para continuar na sua conta</p>
        </div>

        <div className="bg-glass rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-light">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white text-black placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white font-light">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white text-black"
              />
            </div>
            {error && (
              <div className="text-red-300 text-sm font-light">{error}</div>
            )}
            <Button 
              type="submit" 
              className="w-full bg-white text-blue-700 hover:bg-white/90 transition-all border-none shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/auth/forgot-password" 
              className="text-white/80 hover:text-white transition-colors text-sm block mb-2"
            >
              Esqueceu sua senha?
            </Link>
            <Link 
              href="/auth/register" 
              className="text-white/80 hover:text-white transition-colors text-sm"
            >
              Não tem uma conta? Registre-se
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 