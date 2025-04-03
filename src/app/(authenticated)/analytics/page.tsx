'use client';

import { useState, useEffect } from 'react';
import { useUserPlan } from '@/hooks/use-user-plan';
import { PremiumLock } from '@/components/ui/premium-lock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AnalyticsPage() {
  const { isPremium, isLoading } = useUserPlan();
  const [activeTab, setActiveTab] = useState('overview');

  // Conteúdo específico para usuários premium
  const PremiumContent = () => (
    <div className="space-y-6">
      <Tabs 
        defaultValue="overview" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="sessions">Sessões</TabsTrigger>
          <TabsTrigger value="sources">Fontes de Tráfego</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Análise Avançada</CardTitle>
              </CardHeader>
              <CardContent className="h-60">
                <div className="w-full h-full flex items-center justify-center bg-blue-50 rounded-md">
                  <p className="text-blue-700">Dados de análise avançada</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Insights</CardTitle>
              </CardHeader>
              <CardContent className="h-60">
                <div className="w-full h-full flex items-center justify-center bg-green-50 rounded-md">
                  <p className="text-green-700">Insights sobre seus leads</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados de Sessões</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-40 flex items-center justify-center bg-purple-50 rounded-md">
                <p className="text-purple-700">Análise detalhada de sessões de usuários</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fontes de Tráfego</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-40 flex items-center justify-center bg-amber-50 rounded-md">
                <p className="text-amber-700">Análise de canais de aquisição</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Analytics Avançado</h1>
      <p className="text-gray-600 mb-8">
        Acesse métricas detalhadas e insights sobre suas conversões.
      </p>
      
      {isLoading ? (
        <div className="flex justify-center py-20">
          <p>Carregando...</p>
        </div>
      ) : isPremium ? (
        <PremiumContent />
      ) : (
        <div className="py-8">
          <PremiumLock 
            title="Analytics Avançado"
            description="Desbloqueie análises detalhadas e insights sobre seus leads."
            featureDescription={[
              'Acompanhamento detalhado de sessões',
              'Análise avançada de fontes de tráfego',
              'Métricas de comportamento de usuários',
              'Insights sobre conversão',
              'Exportação de relatórios personalizados'
            ]}
          />
        </div>
      )}
    </div>
  );
} 