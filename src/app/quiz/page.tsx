'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from '@/components/ui/logo';
import { useRouter } from 'next/navigation';

export default function QuizFallbackPage() {
  const [quizId, setQuizId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quizId.trim()) {
      setError('Por favor, informe o ID do questionário');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/quiz/by-id/${quizId}`);
      
      if (!response.ok) {
        setError('Questionário não encontrado');
      } else {
        const data = await response.json();
        if (data.user && data.quiz) {
          // Redirecionar para o questionário
          router.push(`/quiz/${data.user.slug}/${data.quiz.indications[0]?.slug || 'questionario'}`);
        } else {
          setError('Informações do questionário incompletas');
        }
      }
    } catch (error) {
      console.error('Erro ao buscar questionário:', error);
      setError('Erro ao processar a solicitação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <Logo className="mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Acessar Questionário</h2>
          <p className="text-sm text-gray-500">Digite o ID do questionário que você deseja acessar</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quizId" className="text-gray-700">ID do Questionário</Label>
                <Input
                  id="quizId"
                  value={quizId}
                  onChange={(e) => setQuizId(e.target.value)}
                  placeholder="Ex: quiz_abc123"
                  className="w-full"
                />
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? 'Carregando...' : 'Acessar Questionário'}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="text-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} - Todos os direitos reservados</p>
        </CardFooter>
      </Card>
    </div>
  );
} 