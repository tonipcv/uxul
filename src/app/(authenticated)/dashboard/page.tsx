'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

export default function DashboardPage() {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

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
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-light">Dashboard</h1>
        <p className="text-zinc-400">Bem-vindo, {session?.user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-black/20 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg font-light">Total de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-light">
              {loading ? '...' : dashboardData?.totalLeads || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg font-light">Links Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-light">
              {loading ? '...' : dashboardData?.totalIndications || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg font-light">Conversão Média</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-light">
              {loading ? '...' : `${dashboardData?.conversionRate || 0}%`}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {loading 
                ? '...' 
                : `${dashboardData?.totalLeads || 0} leads de ${dashboardData?.totalClicks || 0} cliques`}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-black/20 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg font-light">Leads Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-zinc-400">Carregando...</p>
            ) : dashboardData?.recentLeads && dashboardData.recentLeads.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentLeads.map((lead) => (
                  <div key={lead.id} className="flex justify-between border-b border-white/5 pb-2">
                    <div>
                      <p className="text-zinc-300">{lead.name}</p>
                      <p className="text-xs text-zinc-500">
                        {lead.indication?.name || lead.indication?.slug || "Link principal"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-zinc-400 text-sm">{lead.phone}</p>
                      <p className="text-xs text-zinc-500">
                        {format(new Date(lead.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-400">Nenhum lead registrado ainda.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg font-light">Top Indicadores</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-zinc-400">Carregando...</p>
            ) : dashboardData?.topIndications && dashboardData.topIndications.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.topIndications.map((indication) => (
                  <div key={indication.id} className="flex justify-between border-b border-white/5 pb-2">
                    <div>
                      <p className="text-zinc-300">{indication.name || indication.slug}</p>
                      <p className="text-xs text-zinc-500">
                        med1.app/{session?.user?.name || '...'}/{indication.slug}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-zinc-400 text-sm">{indication._count.leads} leads</p>
                      <p className="text-xs text-zinc-500">
                        {indication._count.events} cliques
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-400">Nenhum indicador registrado ainda.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg font-light">Origens de Tráfego</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-zinc-400">Carregando...</p>
            ) : dashboardData?.topSources && dashboardData.topSources.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.topSources.map((source, index) => (
                  <div key={index} className="flex justify-between border-b border-white/5 pb-2">
                    <div>
                      <p className="text-zinc-300">{source.source || "Direto"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-zinc-400 text-sm">{source.count} leads</p>
                      <p className="text-xs text-zinc-500">
                        {Math.round((source.count / dashboardData.totalLeads) * 100)}% do total
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-400">Nenhuma origem registrada ainda.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 