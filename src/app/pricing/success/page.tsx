'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Após 5 segundos, redirecionar para o dashboard
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-20">
      <div className="container mx-auto px-4">
        <Card className="max-w-lg mx-auto p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Pagamento Confirmado!
          </h1>
          
          <p className="text-gray-600 mb-8">
            Seu pagamento foi processado com sucesso. Você será redirecionado para o dashboard em alguns segundos.
          </p>

          <Button 
            onClick={() => router.push('/dashboard')}
            className="bg-green-500 hover:bg-green-600"
          >
            Ir para o Dashboard
          </Button>
        </Card>
      </div>
    </div>
  );
} 