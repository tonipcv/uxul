'use client';

import { useState, useEffect } from 'react';
import { useUserPlan } from '@/hooks/use-user-plan';
import { PremiumLock } from '@/components/ui/premium-lock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from 'recharts';

// Dados de exemplo para o gráfico
const chartData = [
  { name: 'Janeiro', leads: 30, conversoes: 15 },
  { name: 'Fevereiro', leads: 45, conversoes: 21 },
  { name: 'Março', leads: 38, conversoes: 18 },
  { name: 'Abril', leads: 56, conversoes: 29 },
  { name: 'Maio', leads: 72, conversoes: 35 },
  { name: 'Junho', leads: 65, conversoes: 32 },
];

export default function ReportsPage() {
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
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="conversions">Conversões</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Leads por Mês</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="leads" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Taxa de Conversão</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="leads" stroke="#3b82f6" />
                    <Line type="monotone" dataKey="conversoes" stroke="#10b981" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Análise de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Relatórios detalhados da performance de suas campanhas e indicações ao longo do tempo.
              </p>
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-blue-700">
                  Você pode exportar relatórios completos em CSV ou PDF para análise detalhada.
                </p>
                <Button className="mt-4" variant="outline">
                  Exportar Relatório
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="conversions">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Análise de Conversões</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Veja estatísticas detalhadas sobre suas conversões, origens de tráfego e eficiência.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-md text-center">
                  <p className="text-xs text-green-600">Taxa de Conversão</p>
                  <p className="text-2xl font-bold text-green-700">48.5%</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-md text-center">
                  <p className="text-xs text-blue-600">Valor Médio</p>
                  <p className="text-2xl font-bold text-blue-700">R$ 2.450</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-md text-center">
                  <p className="text-xs text-purple-600">ROI</p>
                  <p className="text-2xl font-bold text-purple-700">352%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Relatórios e Análises</h1>
      <p className="text-gray-600 mb-8">
        Visualize relatórios detalhados e estatísticas de suas indicações e leads.
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
            title="Relatórios Avançados"
            description="Desbloqueie relatórios detalhados e análises avançadas para suas indicações e leads."
            featureDescription={[
              'Gráficos detalhados de performance',
              'Histórico completo de conversões',
              'Análise de origem de tráfego',
              'Exportação de relatórios em CSV/PDF',
              'Métricas avançadas de ROI'
            ]}
          />
        </div>
      )}
    </div>
  );
} 