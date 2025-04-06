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
  totalRevenue: number;
  potentialRevenue: number;
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
          topSources: [],
          totalRevenue: 0,
          potentialRevenue: 0
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
        topSources: [],
        totalRevenue: 0,
        potentialRevenue: 0
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
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900 pt-8 pb-16 px-4">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-light text-white">Dashboard</h1>
            <p className="text-blue-100/80">Bem-vindo, {session?.user?.name}</p>
          </div>
          <Button 
            onClick={fetchDashboardData} 
            variant="outline" 
            size="sm" 
            className="mt-2 md:mt-0 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 transition-colors"
          >
            Atualizar dados
          </Button>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-8 bg-white/10 backdrop-blur-sm border border-white/30 p-1 rounded-md">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-300 text-white/80 hover:text-white transition-colors rounded-md"
            >
              Visão Geral
            </TabsTrigger>
            <TabsTrigger 
              value="details" 
              className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-300 text-white/80 hover:text-white transition-colors rounded-md"
            >
              Detalhamento
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0">
            {/* Cards principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white/10 backdrop-blur-sm border-l-4 border-blue-300 border-t border-r border-b border-white/30 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex items-center text-white">
                    <PhoneIcon className="h-5 w-5 mr-2 text-blue-300" />
                    Total de Leads
                  </CardTitle>
                  <CardDescription className="text-blue-100/80">
                    Conversões totais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <p className="text-4xl font-semibold text-white">
                      {loading ? '...' : dashboardData?.totalLeads || 0}
                    </p>
                    <Badge variant="outline" className="bg-blue-500/20 text-blue-100 border-blue-300/50">
                      <ChevronUpIcon className="h-3 w-3 mr-1" />
                      Ativo
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-l-4 border-white/50 border-t border-r border-b border-white/30 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex items-center text-white">
                    <LinkIcon className="h-5 w-5 mr-2 text-white/70" />
                    Links Ativos
                  </CardTitle>
                  <CardDescription className="text-blue-100/80">
                    Indicações ativas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <p className="text-4xl font-semibold text-white">
                      {loading ? '...' : dashboardData?.totalIndications || 0}
                    </p>
                    <Badge variant="outline" className="bg-white/20 text-white border-white/40">
                      100%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-l-4 border-green-300 border-t border-r border-b border-white/30 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex items-center text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2 text-green-300">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                    Faturamento
                  </CardTitle>
                  <CardDescription className="text-blue-100/80">
                    Clientes fechados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <p className="text-4xl font-semibold text-white">
                      {loading 
                        ? '...' 
                        : new Intl.NumberFormat('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          }).format(dashboardData?.totalRevenue || 0)
                      }
                    </p>
                    <Badge variant="outline" className="bg-green-500/20 text-green-100 border-green-300/50">
                      Fechados
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-l-4 border-yellow-300 border-t border-r border-b border-white/30 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex items-center text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2 text-yellow-300">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
                      <path d="M12 18V6"></path>
                    </svg>
                    Novos Negócios
                  </CardTitle>
                  <CardDescription className="text-blue-100/80">
                    Potencial em aberto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <p className="text-4xl font-semibold text-white">
                      {loading 
                        ? '...' 
                        : new Intl.NumberFormat('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          }).format(dashboardData?.potentialRevenue || 0)
                      }
                    </p>
                    <Badge variant="outline" className="bg-yellow-500/20 text-yellow-100 border-yellow-300/50">
                      Em negociação
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="bg-white/10 backdrop-blur-sm border border-white/30 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-white">Leads por Origem</CardTitle>
                  <CardDescription className="text-blue-100/80">
                    Distribuição de conversões por canal
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {loading ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <p className="text-blue-100/80">Carregando...</p>
                    </div>
                  ) : sourceChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" className="text-white">
                      <PieChart>
                        <Pie
                          data={sourceChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
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
                      <p className="text-blue-100/80">Nenhum dado disponível</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border border-white/30 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-white">Leads por Indicação</CardTitle>
                  <CardDescription className="text-blue-100/80">
                    Performance dos links de indicação
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {loading ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <p className="text-blue-100/80">Carregando...</p>
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
                          stroke="#f0f9ff"
                          fontSize={12}
                        />
                        <YAxis stroke="#f0f9ff" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="leads" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <p className="text-blue-100/80">Nenhum dado disponível</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Leads Recentes */}
            <Card className="bg-white/10 backdrop-blur-sm border border-white/30 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-white">Leads Recentes</CardTitle>
                <CardDescription className="text-blue-100/80">
                  Últimas conversões registradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-blue-100/80">Carregando...</p>
                ) : dashboardData?.recentLeads && dashboardData.recentLeads.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardData.recentLeads.map((lead) => (
                      <div key={lead.id} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/20">
                        <div className="flex items-center">
                          <div className="bg-blue-500/20 text-blue-100 h-10 w-10 rounded-full flex items-center justify-center mr-3">
                            {lead.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium">{lead.name}</p>
                            <p className="text-xs text-blue-100/70 flex items-center">
                              <span className="inline-block h-2 w-2 rounded-full bg-green-400 mr-1"></span>
                              {lead.indication?.name || lead.indication?.slug || "Link principal"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white text-sm font-medium">{lead.phone}</p>
                          <p className="text-xs text-blue-100/70">
                            {lead.createdAt && isValidDate(new Date(lead.createdAt)) 
                              ? format(new Date(lead.createdAt), "dd/MM/yyyy", { locale: ptBR })
                              : "Data não disponível"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-lg p-6 text-center">
                    <p className="text-blue-100/80">Nenhum lead registrado ainda.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur-sm border border-white/30 shadow-sm md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-white">Todos os Indicadores</CardTitle>
                  <CardDescription className="text-blue-100/80">
                    Detalhamento completo dos links de indicação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-blue-100/80">Carregando...</p>
                  ) : dashboardData?.topIndications && dashboardData.topIndications.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-12 text-xs text-blue-100/70 pb-2 border-b border-white/20">
                        <div className="col-span-5">INDICADOR</div>
                        <div className="col-span-4">LINK</div>
                        <div className="col-span-2 text-right">LEADS</div>
                        <div className="col-span-1 text-right">CLIQUES</div>
                      </div>
                      {dashboardData.topIndications.map((indication) => (
                        <div key={indication.id} className="grid grid-cols-12 items-center py-3">
                          <div className="col-span-5 text-white font-medium">{indication.name || indication.slug}</div>
                          <div className="col-span-4 text-xs text-blue-100/70 truncate">
                            med1.app/{session?.user?.name || '...'}/{indication.slug}
                          </div>
                          <div className="col-span-2 text-right">
                            <Badge className="bg-blue-500/20 text-blue-100 border-blue-300/50">
                              {indication._count.leads}
                            </Badge>
                          </div>
                          <div className="col-span-1 text-right">
                            <Badge variant="outline" className="border-white/30 text-white/80">
                              {indication._count.events}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-lg p-6 text-center">
                      <p className="text-blue-100/80">Nenhum indicador registrado ainda.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border border-white/30 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-white">Origem do Tráfego</CardTitle>
                  <CardDescription className="text-blue-100/80">
                    Detalhamento das fontes de tráfego
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-blue-100/80">Carregando...</p>
                  ) : dashboardData?.topSources && dashboardData.topSources.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-12 text-xs text-blue-100/70 pb-2 border-b border-white/20">
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
                            <span className="text-white">{source.source || "Direto"}</span>
                          </div>
                          <div className="col-span-3 text-right">
                            <Badge className="bg-white/10 text-white border-0">
                              {source.count}
                            </Badge>
                          </div>
                          <div className="col-span-2 text-right text-white">
                            {Math.round((source.count / dashboardData.totalLeads) * 100)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-lg p-6 text-center">
                      <p className="text-blue-100/80">Nenhuma origem registrada ainda.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border border-white/30 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-white">Estatísticas</CardTitle>
                  <CardDescription className="text-blue-100/80">
                    Métricas e indicadores de desempenho
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-blue-100/80 mb-1">Taxa de Conversão</p>
                      <div className="flex items-center">
                        <div className="w-full bg-white/10 h-2 rounded-full mr-3">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-emerald-300 h-2 rounded-full" 
                            style={{ width: `${dashboardData?.conversionRate || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-white font-medium">{dashboardData?.conversionRate || 0}%</span>
                      </div>
                    </div>
                    
                    <Separator className="bg-white/20" />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-blue-100/80 mb-1">Total de Cliques</p>
                        <p className="text-xl font-medium text-white">{dashboardData?.totalClicks || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-100/80 mb-1">Eficiência</p>
                        <p className="text-xl font-medium text-white">
                          {dashboardData?.totalClicks 
                            ? (dashboardData.totalLeads / dashboardData.totalClicks).toFixed(2) 
                            : "0.00"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-100/80 mb-1">Leads por Link</p>
                        <p className="text-xl font-medium text-white">
                          {dashboardData?.totalIndications 
                            ? (dashboardData.totalLeads / dashboardData.totalIndications).toFixed(1) 
                            : "0.0"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-100/80 mb-1">Cliques por Link</p>
                        <p className="text-xl font-medium text-white">
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
    </div>
  );
} 