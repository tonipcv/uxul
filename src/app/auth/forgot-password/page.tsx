/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background font-['Helvetica'] font-light px-4">
        <div className="w-full max-w-[350px] mx-auto">
          <Card className="border-none shadow-none">
            <CardHeader className="space-y-1 pb-4">
              <Logo className="flex justify-center h-8 w-8 mx-auto" />
            </CardHeader>
            <CardContent className="text-center text-white/70">
              Enviamos um link de recuperação de senha para seu email.
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

  return (
    <div className="min-h-[100dvh] bg-gradient-primary flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-[400px] mx-auto">
        <div className="flex justify-center mb-8">
          <Logo className="scale-150" variant="light" />
        </div>
        
        <div className="space-y-2 text-center mb-8">
          <h2 className="text-2xl font-light text-white">Recuperar senha</h2>
          <p className="text-blue-100/80 font-light">Digite seu email para receber o link de recuperação</p>
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
            {error && (
              <div className="text-red-300 text-sm font-light">{error}</div>
            )}
            <Button 
              type="submit" 
              className="w-full bg-white text-blue-700 hover:bg-white/90 transition-all border-none shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? "Enviando link..." : "Recuperar senha"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/auth/signin" 
              className="text-white/80 hover:text-white transition-colors text-sm"
            >
              Voltar para login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 