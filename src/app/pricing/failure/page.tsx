'use client';

import { useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from 'lucide-react';

export default function PaymentFailurePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-20">
      <div className="container mx-auto px-4">
        <Card className="max-w-lg mx-auto p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 p-3 rounded-full">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Pagamento não Concluído
          </h1>
          
          <p className="text-gray-600 mb-8">
            Houve um problema ao processar seu pagamento. Por favor, tente novamente ou entre em contato com nosso suporte.
          </p>

          <div className="space-y-4">
            <Button 
              onClick={() => router.push('/pricing')}
              className="w-full bg-gray-900 hover:bg-gray-800"
            >
              Tentar Novamente
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