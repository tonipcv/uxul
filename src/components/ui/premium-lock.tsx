'use client';

import { LockClosedIcon, SparklesIcon, HomeIcon } from '@heroicons/react/24/outline';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PremiumLockProps {
  title?: string;
  description?: string;
  featureDescription?: string[];
}

export function PremiumLock({
  title = 'Recurso Premium',
  description = 'Este recurso está disponível apenas para usuários premium',
  featureDescription = [
    'Indicações ilimitadas',
    'Histórico completo de leads',
    'Relatórios avançados',
    'Dashboard personalizado'
  ]
}: PremiumLockProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpgrade = () => {
    setLoading(true);
    router.push('/pricing');
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <Card className="w-full max-w-md mx-auto border border-blue-100 shadow-md overflow-hidden">
      <div className="absolute top-0 right-0 bg-gradient-to-bl from-blue-500 to-blue-600 text-white text-xs px-3 py-1 rounded-bl-md">
        Premium
      </div>
      <CardHeader className="pb-4 pt-8 text-center">
        <CardTitle className="text-xl flex items-center justify-center gap-2 text-blue-700">
          <LockClosedIcon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
            <SparklesIcon className="h-4 w-4 mr-1" />
            Desbloqueie estes recursos:
          </h4>
          <ul className="space-y-2">
            {featureDescription.map((feature, index) => (
              <li key={index} className="text-sm flex items-center text-blue-600">
                <span className="h-1.5 w-1.5 bg-blue-500 rounded-full mr-2" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700" 
          onClick={handleUpgrade}
          disabled={loading}
        >
          {loading ? 'Carregando...' : 'Fazer Upgrade Agora'}
        </Button>
        <Button 
          variant="outline"
          className="w-full border-gray-200 text-gray-600 hover:bg-gray-50"
          onClick={handleBackToDashboard}
        >
          <HomeIcon className="h-4 w-4 mr-2" />
          Voltar ao Dashboard
        </Button>
      </CardFooter>
    </Card>
  );
} 