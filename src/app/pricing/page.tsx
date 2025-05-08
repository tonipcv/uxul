'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckIcon } from 'lucide-react';
import { toast } from 'sonner';

const plans = [
  {
    id: 'personal',
    name: 'Pessoal',
    price: 197,
    period: '/mês',
    description: 'Ideal para profissionais independentes',
    features: [
      'Até 100 pacientes por mês',
      'Questionários ilimitados',
      'Página de perfil personalizada',
      'Integração com WhatsApp',
      'Suporte por email'
    ],
    highlighted: false
  },
  {
    id: 'scale',
    name: 'Escala',
    price: 497,
    period: '/mês',
    description: 'Para clínicas em crescimento',
    features: [
      'Até 500 pacientes por mês',
      'Questionários ilimitados',
      'Página de perfil personalizada',
      'Integração com WhatsApp',
      'Suporte prioritário',
      'Dashboard avançado',
      'Múltiplos profissionais',
      'Relatórios personalizados'
    ],
    highlighted: true
  },
  {
    id: 'business',
    name: 'Business',
    price: 997,
    period: '/mês',
    description: 'Para clínicas estabelecidas',
    features: [
      'Pacientes ilimitados',
      'Questionários ilimitados',
      'Página de perfil personalizada',
      'Integração com WhatsApp',
      'Suporte VIP',
      'Dashboard avançado',
      'Múltiplos profissionais',
      'Relatórios personalizados',
      'API personalizada',
      'Onboarding dedicado'
    ],
    highlighted: false
  }
];

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    window.location.href = 'mailto:contato@med1.app?subject=Interesse no plano ' + planId;
  };

  return (
    <div className="min-h-screen bg-white py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 font-display">
            Planos Med1
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
            Escolha o plano ideal para sua clínica e comece a usar hoje mesmo.
            <br />
            <span className="text-primary font-medium">Entre em contato para mais informações.</span>
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative transform transition-all duration-300 hover:scale-105 ${
                plan.highlighted 
                  ? 'border-2 border-primary shadow-lg' 
                  : 'border border-gray-100 hover:border-primary/30'
              } rounded-2xl`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                  <span className="bg-primary text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg inline-block">
                    Mais Popular
                  </span>
                </div>
              )}

              <CardHeader className="pb-0">
                <CardTitle className="text-2xl font-bold text-gray-900">{plan.name}</CardTitle>
                <CardDescription className="text-gray-500">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="pt-6">
                <div className="mb-8">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">R$ {plan.price}</span>
                    <span className="text-gray-500 ml-2">{plan.period}</span>
                  </div>
                  <div className="text-gray-500 text-sm mt-2">
                    ou 12x de R$ {(plan.price).toFixed(2)}
                  </div>
                </div>

                <ul className="space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckIcon className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-6">
                <Button 
                  className={`w-full h-12 text-base font-medium transition-all duration-300 ${
                    plan.highlighted
                      ? 'bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20'
                      : 'bg-white text-primary border-2 border-primary hover:bg-primary hover:text-white'
                  }`}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  Entrar em Contato
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Métodos de Pagamento */}
        <div className="mt-16 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Formas de Pagamento</h3>
          <div className="flex justify-center items-center gap-8">
            <div className="text-center">
              <div className="text-4xl mb-2">💳</div>
              <p className="text-gray-600">Cartão de Crédito<br/>em até 12x</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">📱</div>
              <p className="text-gray-600">PIX<br/>à vista</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center">
          <p className="text-gray-500">
            Tem dúvidas? Entre em contato com nosso time{' '}
            <a href="mailto:contato@med1.app" className="text-primary hover:underline">
              contato@med1.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 