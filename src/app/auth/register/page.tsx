/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [slug, setSlug] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, slug, specialty })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar conta');
      }

      router.push('/auth/signin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900 flex flex-col items-center justify-center px-4 pb-8">
      <style jsx global>{`
        body {
          background: linear-gradient(to bottom right, var(--tw-gradient-from), var(--tw-gradient-via), var(--tw-gradient-to));
          min-height: 100vh;
        }
      `}</style>
      <div className="w-full max-w-[400px] mx-auto">
        <div className="flex justify-center mb-6">
          <Logo className="scale-150" variant="light" />
        </div>
        
        <div className="space-y-2 text-center mb-6">
          <h2 className="text-2xl font-light text-white">Criar uma conta</h2>
          <p className="text-blue-100/80 font-light">Insira suas informações para começar</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white font-light">Nome</Label>
              <Input
                id="name"
                type="text"
                placeholder="João Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-blue-900 placeholder:text-white/60 focus:ring-2 focus:ring-white/50 focus:border-transparent appearance-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-light">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-blue-900 placeholder:text-white/60 focus:ring-2 focus:ring-white/50 focus:border-transparent appearance-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-white font-light">Nome de usuário</Label>
              <Input
                id="slug"
                type="text"
                placeholder="drjoao"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-blue-900 placeholder:text-white/60 focus:ring-2 focus:ring-white/50 focus:border-transparent appearance-none"
              />
              <p className="text-xs text-white/60">
                Esta será sua URL pessoal: med1.app/<span className="text-white">{slug || 'username'}</span>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty" className="text-white font-light">Área de atuação</Label>
              <Input
                id="specialty"
                type="text"
                placeholder="Digita aqui"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-blue-900 placeholder:text-white/60 focus:ring-2 focus:ring-white/50 focus:border-transparent appearance-none"
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
                className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-blue-900 placeholder:text-white/60 focus:ring-2 focus:ring-white/50 focus:border-transparent appearance-none"
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
              {isLoading ? "Criando conta..." : "Criar conta"}
            </Button>

            <div className="text-center">
              <Link 
                href="/auth/signin" 
                className="text-white/80 hover:text-white transition-colors text-sm"
              >
                Já tem uma conta? Entrar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 