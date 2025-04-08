'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid, AreaChart, Area
} from 'recharts';
import { 
  ChevronUpIcon, 
  PhoneIcon, 
  LinkIcon,
  ArrowTrendingUpIcon,
  UserIcon,
  CurrencyDollarIcon,
  UsersIcon,
  RocketLaunchIcon,
  UserPlusIcon
} from "@heroicons/react/24/outline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Skeleton } from "@/components/ui/skeleton";

// Função para verificar se uma data é válida
const isValidDate = (date: Date): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

// Cores para os gráficos - Atualizando para usar as cores pastel especificadas
const COLORS = ['#d8fffa', '#ffe6e7', '#def6ff', '#f2f1ff', '#a5b4fc'];

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
  clickToLeadRate: number;
  totalPatients: number;
  revenue: number;
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
  const [selectedPeriod, setSelectedPeriod] = useState("7d");

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
          potentialRevenue: 0,
          clickToLeadRate: 0,
          totalPatients: 0,
          revenue: 0
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
        potentialRevenue: 0,
        clickToLeadRate: 0,
        totalPatients: 0,
        revenue: 0
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
    <div className="min-h-[100dvh] bg-gray-100 pt-20 pb-24 md:pt-12 md:pb-16 px-4">
      <div className="container mx-auto pl-1 sm:pl-4 md:pl-8 lg:pl-16 max-w-[98%] sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-lg md:text-xl font-bold text-gray-900 tracking-[-0.03em] font-inter">Dashboard</h1>
            <p className="text-sm sm:text-xs md:text-sm text-gray-600 tracking-[-0.03em] font-inter">Visualize o desempenho da sua clínica</p>
          </div>

          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Select 
              value={selectedPeriod} 
              onValueChange={setSelectedPeriod}
            >
              <SelectTrigger className="w-full sm:w-[180px] h-10 sm:h-8 bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg-gray-800/10 text-sm sm:text-xs">
                <SelectValue placeholder="Escolha o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={fetchDashboardData}
              className="h-10 sm:h-8 bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] transition-all duration-300 rounded-2xl text-gray-700 hover:bg-gray-800/10 text-sm sm:text-xs"
            >
              <ArrowPathIcon className="h-4 w-4 sm:h-3.5 sm:w-3.5 mr-2 sm:mr-1.5" />
              Atualizar
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-6 bg-gray-800/5 border-0 shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-1 rounded-2xl max-w-[240px]">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-gray-800/10 data-[state=active]:text-gray-900 data-[state=active]:border-b-0 text-gray-600 hover:text-gray-900 transition-colors rounded-xl text-xs"
            >
              Visão Geral
            </TabsTrigger>
            <TabsTrigger 
              value="details" 
              className="data-[state=active]:bg-gray-800/10 data-[state=active]:text-gray-900 data-[state=active]:border-b-0 text-gray-600 hover:text-gray-900 transition-colors rounded-xl text-xs"
            >
              Detalhamento
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0">
            {/* Cards principais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
                <CardHeader className="pb-2 sm:pb-1 pt-4 sm:pt-3 px-6 sm:px-4">
                  <CardTitle className="text-base sm:text-sm md:text-base font-bold flex items-center text-gray-900 tracking-[-0.03em] font-inter">
                    <CurrencyDollarIcon className="h-5 w-5 sm:h-4 sm:w-4 mr-2 text-emerald-500" />
                    Faturamento
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-xs text-gray-500 tracking-[-0.03em] font-inter">
                    Receita no período selecionado
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-4 sm:pb-3 px-6 sm:px-4">
                  <div className="flex items-end justify-between">
                    <p className="text-2xl sm:text-xl md:text-2xl font-semibold text-gray-900">
                      {loading ? (
                        <Skeleton className="h-9 w-24 bg-gray-200" />
                      ) : (
                        `R$ ${dashboardData?.revenue?.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'}`
                      )}
                    </p>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-sm sm:text-xs">
                      <ArrowTrendingUpIcon className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />
                      {loading ? <Skeleton className="h-4 w-12" /> : '15%'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
                <CardHeader className="pb-2 sm:pb-1 pt-4 sm:pt-3 px-6 sm:px-4">
                  <CardTitle className="text-base sm:text-sm md:text-base font-bold flex items-center text-gray-900 tracking-[-0.03em] font-inter">
                    <UsersIcon className="h-5 w-5 sm:h-4 sm:w-4 mr-2 text-sky-500" />
                    Pacientes
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-xs text-gray-500 tracking-[-0.03em] font-inter">
                    Total de pacientes ativos
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-4 sm:pb-3 px-6 sm:px-4">
                  <div className="flex items-end justify-between">
                    <p className="text-2xl sm:text-xl md:text-2xl font-semibold text-gray-900">
                      {loading ? (
                        <Skeleton className="h-9 w-16 bg-gray-200" />
                      ) : (
                        dashboardData?.totalPatients?.toLocaleString('pt-BR') || '0'
                      )}
                    </p>
                    <Badge variant="outline" className="bg-sky-50 text-sky-600 border-sky-200 text-sm sm:text-xs">
                      Ativos
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
                <CardHeader className="pb-2 sm:pb-1 pt-4 sm:pt-3 px-6 sm:px-4">
                  <CardTitle className="text-base sm:text-sm md:text-base font-bold flex items-center text-gray-900 tracking-[-0.03em] font-inter">
                    <RocketLaunchIcon className="h-5 w-5 sm:h-4 sm:w-4 mr-2 text-purple-500" />
                    Potencial
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-xs text-gray-500 tracking-[-0.03em] font-inter">
                    Receita potencial prevista
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-4 sm:pb-3 px-6 sm:px-4">
                  <div className="flex items-end justify-between">
                    <p className="text-2xl sm:text-xl md:text-2xl font-semibold text-gray-900">
                      {loading ? (
                        <Skeleton className="h-9 w-24 bg-gray-200" />
                      ) : (
                        `R$ ${dashboardData?.potentialRevenue?.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'}`
                      )}
                    </p>
                    <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200 text-sm sm:text-xs">
                      Previsto
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
                <CardHeader className="pb-2 sm:pb-1 pt-4 sm:pt-3 px-6 sm:px-4">
                  <CardTitle className="text-base sm:text-sm md:text-base font-bold flex items-center text-gray-900 tracking-[-0.03em] font-inter">
                    <UserPlusIcon className="h-5 w-5 sm:h-4 sm:w-4 mr-2 text-amber-500" />
                    Indicações
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-xs text-gray-500 tracking-[-0.03em] font-inter">
                    Total de indicações
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-4 sm:pb-3 px-6 sm:px-4">
                  <div className="flex items-end justify-between">
                    <p className="text-2xl sm:text-xl md:text-2xl font-semibold text-gray-900">
                      {loading ? (
                        <Skeleton className="h-9 w-16 bg-gray-200" />
                      ) : (
                        dashboardData?.totalIndications?.toLocaleString('pt-BR') || '0'
                      )}
                    </p>
                    <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-sm sm:text-xs">
                      <ArrowTrendingUpIcon className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1" />
                      {loading ? <Skeleton className="h-4 w-12" /> : '8%'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-sm md:text-base font-bold text-gray-900 tracking-[-0.03em] font-inter">
                    Fontes de Tráfego
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500 tracking-[-0.03em] font-inter">
                    Principais origens dos leads
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sourceChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({
                            cx,
                            cy,
                            midAngle,
                            innerRadius,
                            outerRadius,
                            percent,
                            index,
                            name
                          }) => {
                            const RADIAN = Math.PI / 180;
                            // Position the label outside the pie
                            const radius = outerRadius * 1.2;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            
                            return (
                              <text
                                x={x}
                                y={y}
                                fill="#333333"
                                textAnchor={x > cx ? 'start' : 'end'}
                                dominantBaseline="central"
                                fontWeight="500"
                                fontSize="12"
                              >
                                {`${name} ${(percent * 100).toFixed(0)}%`}
                              </text>
                            );
                          }}
                        >
                          {sourceChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            border: '1px solid #333',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                          itemStyle={{ color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-sm md:text-base font-bold text-gray-900 tracking-[-0.03em] font-inter">
                    Top Indicações
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500 tracking-[-0.03em] font-inter">
                    Indicações com mais leads
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3 px-4">
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={indicationChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#d8fffa" stopOpacity={0.2}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#666"
                          tick={{ fill: '#666' }}
                        />
                        <YAxis 
                          stroke="#666"
                          tick={{ fill: '#666' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            border: '1px solid #333',
                            borderRadius: '8px',
                            color: '#fff'
                          }}
                          itemStyle={{ color: '#4d61fc' }}
                        />
                        <Bar 
                          dataKey="leads" 
                          fill="url(#colorBar)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Card de crescimento */}
            <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl mb-6">
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-sm md:text-base font-bold text-gray-900 tracking-[-0.03em] font-inter">
                  Crescimento de Receita
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 tracking-[-0.03em] font-inter">
                  Evolução do faturamento ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3 px-4">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={[
                        { name: 'Jan', value: 4000 },
                        { name: 'Fev', value: 3000 },
                        { name: 'Mar', value: 2000 },
                        { name: 'Abr', value: 2780 },
                        { name: 'Mai', value: 1890 },
                        { name: 'Jun', value: 2390 },
                        { name: 'Jul', value: 3490 },
                        { name: 'Ago', value: 4000 },
                        { name: 'Set', value: 5000 },
                        { name: 'Out', value: 6000 },
                        { name: 'Nov', value: 7000 },
                        { name: 'Dez', value: 8000 }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#d8fffa" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis 
                        dataKey="name"
                        stroke="#666"
                        tick={{ fill: '#666' }}
                      />
                      <YAxis 
                        stroke="#666"
                        tick={{ fill: '#666' }}
                        tickFormatter={(value) => `R$${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`}
                      />
                      <Tooltip 
                        formatter={(value) => [
                          `R$ ${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`,
                          'Receita'
                        ]}
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          border: '1px solid #333',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        itemStyle={{ color: '#4d61fc' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#4d61fc" 
                        fill="url(#colorRevenue)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl mt-8">
              <CardHeader>
                <CardTitle className="text-base md:text-lg font-bold text-gray-900 tracking-[-0.03em] font-inter">Estatísticas</CardTitle>
                <CardDescription className="text-xs md:text-sm text-gray-500 tracking-[-0.03em] font-inter">
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
                          className="bg-gradient-to-r from-[#def6ff] to-[#f2f1ff] h-2 rounded-full" 
                          style={{ width: `${Math.min(dashboardData?.conversionRate || 0, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900 font-medium">
                        {Math.min(dashboardData?.conversionRate || 0, 100)}%
                      </span>
                    </div>
                  </div>
                  
                  <Separator className="bg-gray-200" />
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Eficiência de Captura</p>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-100 h-2 rounded-full mr-3">
                        <div 
                          className="bg-gradient-to-r from-[#def6ff] to-[#ffe6e7] h-2 rounded-full" 
                          style={{ width: `${Math.min(dashboardData?.clickToLeadRate || 0, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900 font-medium">
                        {Math.min(dashboardData?.clickToLeadRate || 0, 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg font-bold text-gray-900 tracking-[-0.03em] font-inter">Todos os Indicadores</CardTitle>
                  <CardDescription className="text-xs md:text-sm text-gray-500 tracking-[-0.03em] font-inter">
                    Detalhamento completo dos links de indicação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-gray-500">Carregando...</p>
                  ) : dashboardData?.topIndications && dashboardData.topIndications.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-12 text-sm text-gray-500 pb-2 border-b border-gray-200">
                        <div className="col-span-5">INDICADOR</div>
                        <div className="col-span-4">LINK</div>
                        <div className="col-span-2 text-right">LEADS</div>
                        <div className="col-span-1 text-right">CLIQUES</div>
                      </div>
                      {dashboardData.topIndications.map((indication) => (
                        <div key={indication.id} className="grid grid-cols-12 items-center py-3 hover:bg-gray-50 rounded-md transition-colors">
                          <div className="col-span-5 text-gray-900 font-medium">{indication.name || indication.slug}</div>
                          <div className="col-span-4 text-sm text-gray-500 truncate">
                            med1.app/{session?.user?.name || '...'}/{indication.slug}
                          </div>
                          <div className="col-span-2 text-right">
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                              {indication._count.leads}
                            </Badge>
                          </div>
                          <div className="col-span-1 text-right">
                            <Badge variant="outline" className="border-gray-200 text-gray-600">
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

              <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg font-bold text-gray-900 tracking-[-0.03em] font-inter">Origem do Tráfego</CardTitle>
                  <CardDescription className="text-xs md:text-sm text-gray-500 tracking-[-0.03em] font-inter">
                    Detalhamento das fontes de tráfego
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-gray-500">Carregando...</p>
                  ) : dashboardData?.topSources && dashboardData.topSources.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-12 text-sm text-gray-500 pb-2 border-b border-gray-200">
                        <div className="col-span-7">FONTE</div>
                        <div className="col-span-3 text-right">LEADS</div>
                        <div className="col-span-2 text-right">%</div>
                      </div>
                      {dashboardData.topSources.map((source, index) => (
                        <div key={index} className="grid grid-cols-12 items-center py-3 hover:bg-gray-50 rounded-md transition-colors">
                          <div className="col-span-7 flex items-center">
                            <div 
                              className="h-3 w-3 rounded-full mr-2" 
                              style={{ backgroundColor: index % 2 === 0 ? '#3b82f6' : '#10b981' }}
                            ></div>
                            <span className="text-gray-900">{source.source || "Direto"}</span>
                          </div>
                          <div className="col-span-3 text-right">
                            <Badge className="bg-gray-50 text-gray-700 border-gray-200">
                              {source.count}
                            </Badge>
                          </div>
                          <div className="col-span-2 text-right text-gray-900 font-medium">
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

              <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg font-bold text-gray-900 tracking-[-0.03em] font-inter">Estatísticas</CardTitle>
                  <CardDescription className="text-xs md:text-sm text-gray-500 tracking-[-0.03em] font-inter">
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
                            className="bg-gradient-to-r from-[#def6ff] to-[#f2f1ff] h-2 rounded-full" 
                            style={{ width: `${Math.min(dashboardData?.conversionRate || 0, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900 font-medium">
                          {Math.min(dashboardData?.conversionRate || 0, 100)}%
                        </span>
                      </div>
                    </div>
                    
                    <Separator className="bg-gray-200" />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Total de Cliques</p>
                        <p className="text-xl font-medium text-gray-900">{dashboardData?.totalClicks || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Eficiência</p>
                        <p className="text-xl font-medium text-gray-900">
                          {dashboardData?.totalClicks 
                            ? (dashboardData.totalLeads / dashboardData.totalClicks).toFixed(2) 
                            : "0.00"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Leads por Link</p>
                        <p className="text-xl font-medium text-gray-900">
                          {dashboardData?.totalIndications 
                            ? (dashboardData.totalLeads / dashboardData.totalIndications).toFixed(1) 
                            : "0.0"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Cliques por Link</p>
                        <p className="text-xl font-medium text-gray-900">
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
