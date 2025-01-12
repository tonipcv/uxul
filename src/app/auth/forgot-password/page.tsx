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
    <div className="min-h-screen w-full flex items-center justify-center bg-background font-['Helvetica'] font-light px-4">
      <div className="w-full max-w-[350px] mx-auto">
        <Card className="border-none shadow-none">
          <CardHeader className="space-y-1 pb-4">
            <Logo className="flex justify-center h-8 w-8 mx-auto" />
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                {isLoading ? "Enviando link..." : "Recuperar senha"}
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