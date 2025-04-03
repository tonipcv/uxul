'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { useUserPlan } from '@/hooks/use-user-plan';
import { CheckIcon, SparklesIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Logo } from '@/components/ui/logo';

export default function PricingPage() {
  const { data: session } = useSession();
  const { isPremium } = useUserPlan();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPath = searchParams.get('from');
  const [showAlert, setShowAlert] = useState(!!fromPath);

  useEffect(() => {
    // Definir um timer para esconder o alerta após 5 segundos
    if (showAlert) {
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  const handlePayment = async (planType: string) => {
    setLoading(true);
    try {
      // Aqui você implementaria a integração com um gateway de pagamento
      // como Stripe, PagSeguro, etc.
      
      // Simulação de pagamento bem-sucedido:
      const response = await fetch('/api/users/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planType,
          duration: planType === 'premium_monthly' ? 30 : 365
        }),
      });

      if (response.ok) {
        // Redirecionar para uma página de sucesso ou dashboard
        router.push('/dashboard?upgrade=success');
      } else {
        const data = await response.json();
        alert(`Erro ao processar pagamento: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Ocorreu um erro ao processar o pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Recursos do plano Premium
  const premiumFeatures = [
    'Número ilimitado de indicações',
    'Histórico completo de leads',
    'Estatísticas detalhadas de conversão',
    'Interface personalizada',
    'Relatórios avançados',
    'Suporte prioritário'
  ];

  if (!session) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900">
        <div className="container mx-auto px-4 py-16 max-w-6xl">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <Logo className="scale-150" variant="light" />
            </div>
            <h1 className="text-2xl font-light text-white mb-2">Escolha seu plano</h1>
            <p className="text-blue-100">
              Faça login para continuar com a assinatura premium
            </p>
            <Button 
              className="mt-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all" 
              variant="ghost"
              onClick={() => router.push('/auth/signin')}
            >
              Fazer Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-center mb-8">
          <Logo className="scale-150" variant="light" />
        </div>
        
        {showAlert && (
          <Alert className="mb-8 bg-white/10 backdrop-blur-sm border border-white/20">
            <LockClosedIcon className="h-5 w-5 text-white" />
            <AlertTitle className="text-white font-medium">Recurso Premium</AlertTitle>
            <AlertDescription className="text-blue-100">
              Você foi redirecionado porque o recurso que tentou acessar está disponível apenas para usuários premium.
            </AlertDescription>
          </Alert>
        )}

        <div className="text-center mb-8">
          <h1 className="text-2xl font-light text-white">Escolha seu plano</h1>
          <p className="text-blue-100">
            Selecione o plano que melhor se adapta às suas necessidades
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Plano Mensal */}
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg relative">
            <div className="absolute top-0 right-0 bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-bl-md">
              Popular
            </div>
            <CardHeader className="border-b border-white/10 pb-4">
              <CardTitle className="text-lg font-medium text-white">Premium Mensal</CardTitle>
              <CardDescription className="text-blue-100">Ideal para profissionais</CardDescription>
              <p className="text-2xl font-medium text-white mt-2">R$ 597<span className="text-base font-normal text-blue-200">/mês</span></p>
            </CardHeader>
            <CardContent className="pt-4 pb-6">
              <ul className="space-y-3">
                {premiumFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
                    <span className="text-sm text-blue-100">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-blue-500 text-white hover:bg-blue-600 transition-all border-none shadow-lg"
                variant="ghost"
                onClick={() => handlePayment('premium_monthly')}
                disabled={loading || (isPremium && !loading)}
              >
                {loading ? 'Processando...' : isPremium ? 'Plano atual' : 'Assinar agora'}
              </Button>
            </CardFooter>
          </Card>

          {/* Plano Anual */}
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg">
            <CardHeader className="border-b border-white/10 pb-4">
              <CardTitle className="text-lg font-medium text-white">Premium Anual</CardTitle>
              <CardDescription className="text-blue-100">Melhor custo-benefício</CardDescription>
              <p className="text-2xl font-medium text-white mt-2">R$ 297<span className="text-base font-normal text-blue-200">/mês</span></p>
              <p className="text-xs text-green-400 mt-1">Economize 25% no plano anual</p>
            </CardHeader>
            <CardContent className="pt-4 pb-6">
              <ul className="space-y-3">
                {premiumFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
                    <span className="text-sm text-blue-100">{feature}</span>
                  </li>
                ))}
                <li className="flex items-start">
                  <SparklesIcon className="h-5 w-5 text-amber-400 mr-2 flex-shrink-0" />
                  <span className="text-sm font-medium text-blue-50">Acesso a novidades antecipadas</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-blue-500 text-white hover:bg-blue-600 transition-all border-none shadow-lg"
                variant="ghost"
                onClick={() => handlePayment('premium_annual')}
                disabled={loading}
              >
                {loading ? 'Processando...' : 'Assinar plano anual'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <p className="text-blue-100 text-sm">
            Dúvidas sobre os planos? Entre em contato com nosso suporte em <span className="text-white font-medium">suporte@med1.app</span>
          </p>
        </div>
      </div>
    </div>
  );
} 