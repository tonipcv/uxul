'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PuzzlePieceIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function IntegrationsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  // Mostrar um spinner enquanto carrega
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#2b2a2c]">
        <div className="w-12 h-12 rounded-full border-4 border-white border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-100 pt-16 pb-24 md:pt-8 md:pb-16 px-4">
      <div className="container mx-auto pb-24 md:pb-20 lg:pb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-[-0.03em] font-inter">Configurações</h1>
            <p className="text-sm md:text-base text-gray-600 tracking-[-0.03em] font-inter">Gerencie as configurações do sistema</p>
          </div>
          <div className="flex gap-2 mt-2 md:mt-0">
            <Link href="/profile">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg-gray-800/10"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Voltar ao Perfil
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Settings navigation tabs */}
        <div className="mb-6">
          <Tabs defaultValue="integrations" className="w-full">
            <TabsList className="w-full bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] rounded-2xl p-1 h-auto">
              <Link href="/settings/interest-options" className="w-full">
                <TabsTrigger 
                  value="interest-options" 
                  className={`text-sm py-2.5 rounded-xl transition-all data-[state=active]:shadow-md data-[state=active]:bg-white data-[state=active]:text-gray-900 ${pathname?.includes('/interest-options') ? 'shadow-md bg-white text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Opções de Interesse
                </TabsTrigger>
              </Link>
              <Link href="/settings/integrations" className="w-full">
                <TabsTrigger 
                  value="integrations" 
                  className={`text-sm py-2.5 rounded-xl transition-all data-[state=active]:shadow-md data-[state=active]:bg-white data-[state=active]:text-gray-900 ${pathname?.includes('/integrations') ? 'shadow-md bg-white text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Integrações
                </TabsTrigger>
              </Link>
            </TabsList>
          </Tabs>
        </div>
        
        <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <CardTitle className="text-base md:text-lg font-bold text-gray-900 tracking-[-0.03em] font-inter flex items-center gap-2">
                  <PuzzlePieceIcon className="h-5 w-5 text-[#6366f1]" />
                  Integrações
                </CardTitle>
                <CardDescription className="text-xs md:text-sm text-gray-500 tracking-[-0.03em] font-inter mt-1">
                  Conecte seus serviços externos e plataformas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10 bg-white/80 backdrop-blur-sm border border-dashed border-gray-300 rounded-xl">
              <PuzzlePieceIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">
                Integrações em desenvolvimento
              </p>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Em breve você poderá conectar suas ferramentas favoritas como CRMs, agendadores, 
                sistemas de gestão médica, e muito mais.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 