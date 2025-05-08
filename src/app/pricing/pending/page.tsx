'use client';

import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock } from 'lucide-react';

export default function PaymentPendingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-20">
      <div className="container mx-auto px-4">
        <Card className="max-w-lg mx-auto p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="h-12 w-12 text-yellow-500" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Pagamento em Processamento
          </h1>
          
          <p className="text-gray-600 mb-8">
            Seu pagamento está sendo processado. Assim que confirmado, você receberá um e-mail com mais informações.
          </p>

          <div className="space-y-4">
            <Button 
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gray-900 hover:bg-gray-800"
            >
              Ir para o Dashboard
            </Button>

            <Button 
              variant="outline"
              onClick={() => window.location.href = 'mailto:suporte@med1.app'}
              className="w-full"
            >
              Contatar Suporte
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
} 