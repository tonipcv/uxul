'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  ChevronUpIcon, 
  PhoneIcon, 
  LinkIcon,
  ArrowTrendingUpIcon
} from "@heroicons/react/24/outline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Função para verificar se uma data é válida
const isValidDate = (date: Date): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

// Cores para os gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A05195'];

interface Lead {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  utmSource?: string;
  utmMedium?: string;
  indication?: {
    name?: string;
    slug: string;
  };
}

interface Indication {
  id: string;
  slug: string;
  name?: string;
  _count: {
    leads: number;
    events: number;
  };
}

interface UtmSource {
  source: string;
  count: number;
}

interface DashboardData {
  totalLeads: number;
  totalIndications: number;
  totalClicks: number;
  conversionRate: number;
  recentLeads: Lead[];
  topIndications: Indication[];
  topSources: UtmSource[];
}

// Componente para formatar o Tooltip do gráfico
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 rounded-md border border-gray-200 shadow-md text-xs">
        <p className="text-gray-800 font-medium">{`${label}`}</p>
        <p className="text-blue-700">{`Leads: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (session?.user?.id) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard');
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        console.error('Erro ao buscar dados do dashboard:', 
          `Status: ${response.status} - ${response.statusText}`);
        // Definir valores padrão para não quebrar a interface
        setDashboardData({
          totalLeads: 0,
          totalIndications: 0,
          totalClicks: 0,
          conversionRate: 0,
          recentLeads: [],
          topIndications: [],
          topSources: []
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', 
        error instanceof Error ? error.message : String(error));
      // Definir valores padrão para não quebrar a interface
      setDashboardData({
        totalLeads: 0,
        totalIndications: 0,
        totalClicks: 0,
        conversionRate: 0,
        recentLeads: [],
        topIndications: [],
        topSources: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Preparar dados para gráficos
  const sourceChartData = dashboardData?.topSources?.map(source => ({
    name: source.source || "Direto",
    value: source.count
  })) || [];

  const indicationChartData = dashboardData?.topIndications?.map(indication => ({
    name: indication.name || indication.slug,
    leads: indication._count.leads
  })) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-light text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Bem-vindo, {session?.user?.name}</p>
        </div>
        <Button 
          onClick={fetchDashboardData} 
          variant="outline" 
          size="sm" 
          className="mt-2 md:mt-0 bg-white border-blue-700 text-blue-700 hover:bg-blue-50 transition-colors"
        >
          Atualizar dados
        </Button>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-8 bg-white border border-gray-200 p-1 rounded-md">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700 text-gray-500 hover:text-gray-800 transition-colors rounded-md"
          >
            Visão Geral
          </TabsTrigger>
          <TabsTrigger 
            value="details" 
            className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700 text-gray-500 hover:text-gray-800 transition-colors rounded-md"
          >
            Detalhamento
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-0">
          {/* Cards principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white border-l-4 border-blue-700 border-t border-r border-b border-gray-200 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center text-gray-800">
                  <PhoneIcon className="h-5 w-5 mr-2 text-blue-700" />
                  Total de Leads
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Conversões totais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <p className="text-4xl font-semibold text-blue-700">
                    {loading ? '...' : dashboardData?.totalLeads || 0}
                  </p>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <ChevronUpIcon className="h-3 w-3 mr-1" />
                    Ativo
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-l-4 border-gray-400 border-t border-r border-b border-gray-200 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center text-gray-800">
                  <LinkIcon className="h-5 w-5 mr-2 text-gray-500" />
                  Links Ativos
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Indicações ativas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <p className="text-4xl font-semibold text-gray-600">
                    {loading ? '...' : dashboardData?.totalIndications || 0}
                  </p>
                  <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
                    100%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-l-4 border-blue-400 border-t border-r border-b border-gray-200 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center text-gray-800">
                  <ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-blue-500" />
                  Taxa de Conversão
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Leads / Cliques
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <p className="text-4xl font-semibold text-blue-500">
                    {loading ? '...' : `${dashboardData?.conversionRate || 0}%`}
                  </p>
                  <p className="text-xs text-gray-600">
                    {loading 
                      ? '...' 
                      : `${dashboardData?.totalLeads || 0} / ${dashboardData?.totalClicks || 0}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-800">Leads por Origem</CardTitle>
                <CardDescription className="text-gray-500">
                  Distribuição de conversões por canal
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {loading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <p className="text-gray-500">Carregando...</p>
                  </div>
                ) : sourceChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourceChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {sourceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <p className="text-gray-500">Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-800">Leads por Indicação</CardTitle>
                <CardDescription className="text-gray-500">
                  Performance dos links de indicação
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {loading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <p className="text-gray-500">Carregando...</p>
                  </div>
                ) : indicationChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={indicationChartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={60} 
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="leads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <p className="text-gray-500">Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Leads Recentes */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-800">Leads Recentes</CardTitle>
              <CardDescription className="text-gray-500">
                Últimas conversões registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500">Carregando...</p>
              ) : dashboardData?.recentLeads && dashboardData.recentLeads.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentLeads.map((lead) => (
                    <div key={lead.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <div className="flex items-center">
                        <div className="bg-blue-100 text-blue-600 h-10 w-10 rounded-full flex items-center justify-center mr-3">
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-gray-800 font-medium">{lead.name}</p>
                          <p className="text-xs text-gray-500 flex items-center">
                            <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                            {lead.indication?.name || lead.indication?.slug || "Link principal"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-700 text-sm font-medium">{lead.phone}</p>
                        <p className="text-xs text-gray-500">
                          {lead.createdAt && isValidDate(new Date(lead.createdAt)) 
                            ? format(new Date(lead.createdAt), "dd/MM/yyyy", { locale: ptBR })
                            : "Data não disponível"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-500">Nenhum lead registrado ainda.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white border border-gray-200 shadow-sm md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-800">Todos os Indicadores</CardTitle>
                <CardDescription className="text-gray-500">
                  Detalhamento completo dos links de indicação
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-gray-500">Carregando...</p>
                ) : dashboardData?.topIndications && dashboardData.topIndications.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-12 text-xs text-gray-500 pb-2 border-b border-gray-200">
                      <div className="col-span-5">INDICADOR</div>
                      <div className="col-span-4">LINK</div>
                      <div className="col-span-2 text-right">LEADS</div>
                      <div className="col-span-1 text-right">CLIQUES</div>
                    </div>
                    {dashboardData.topIndications.map((indication) => (
                      <div key={indication.id} className="grid grid-cols-12 items-center py-3">
                        <div className="col-span-5 text-gray-800 font-medium">{indication.name || indication.slug}</div>
                        <div className="col-span-4 text-xs text-gray-500 truncate">
                          med1.app/{session?.user?.name || '...'}/{indication.slug}
                        </div>
                        <div className="col-span-2 text-right">
                          <Badge className="bg-blue-50 text-blue-600 border-blue-100">
                            {indication._count.leads}
                          </Badge>
                        </div>
                        <div className="col-span-1 text-right">
                          <Badge variant="outline" className="border-gray-200 text-gray-500">
                            {indication._count.events}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <p className="text-gray-500">Nenhum indicador registrado ainda.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-800">Origem do Tráfego</CardTitle>
                <CardDescription className="text-gray-500">
                  Detalhamento das fontes de tráfego
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-gray-500">Carregando...</p>
                ) : dashboardData?.topSources && dashboardData.topSources.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-12 text-xs text-gray-500 pb-2 border-b border-gray-200">
                      <div className="col-span-7">FONTE</div>
                      <div className="col-span-3 text-right">LEADS</div>
                      <div className="col-span-2 text-right">%</div>
                    </div>
                    {dashboardData.topSources.map((source, index) => (
                      <div key={index} className="grid grid-cols-12 items-center py-3">
                        <div className="col-span-7 flex items-center">
                          <div 
                            className="h-3 w-3 rounded-full mr-2" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          ></div>
                          <span className="text-gray-800">{source.source || "Direto"}</span>
                        </div>
                        <div className="col-span-3 text-right">
                          <Badge className="bg-gray-100 text-gray-700 border-0">
                            {source.count}
                          </Badge>
                        </div>
                        <div className="col-span-2 text-right text-gray-500">
                          {Math.round((source.count / dashboardData.totalLeads) * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <p className="text-gray-500">Nenhuma origem registrada ainda.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-800">Estatísticas</CardTitle>
                <CardDescription className="text-gray-500">
                  Métricas e indicadores de desempenho
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Taxa de Conversão</p>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-100 h-2 rounded-full mr-3">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full" 
                          style={{ width: `${dashboardData?.conversionRate || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{dashboardData?.conversionRate || 0}%</span>
                    </div>
                  </div>
                  
                  <Separator className="bg-gray-200" />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total de Cliques</p>
                      <p className="text-xl font-medium text-gray-800">{dashboardData?.totalClicks || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Eficiência</p>
                      <p className="text-xl font-medium text-gray-800">
                        {dashboardData?.totalClicks 
                          ? (dashboardData.totalLeads / dashboardData.totalClicks).toFixed(2) 
                          : "0.00"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Leads por Link</p>
                      <p className="text-xl font-medium text-gray-800">
                        {dashboardData?.totalIndications 
                          ? (dashboardData.totalLeads / dashboardData.totalIndications).toFixed(1) 
                          : "0.0"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Cliques por Link</p>
                      <p className="text-xl font-medium text-gray-800">
                        {dashboardData?.totalIndications 
                          ? (dashboardData.totalClicks / dashboardData.totalIndications).toFixed(1) 
                          : "0.0"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 