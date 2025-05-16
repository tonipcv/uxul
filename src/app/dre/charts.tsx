'use client';

import { FactEntry } from "@/types/fact-entry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import {
  AreaChart,
  BarChart,
  Card as TremorCard,
  Title,
  Text,
  Flex,
  Grid,
  Metric,
  BadgeDelta,
  Color,
  ProgressBar,
  Select,
  SelectItem,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  LineChart
} from "@tremor/react";
import { useState } from "react";
import React from "react";

interface DREChartsProps {
  data: FactEntry[];
}

interface CostCenterData {
  name: string;
  costCenter: string;
  description: string | undefined;
  revenue: number;
  costs: number;
  profit: number;
  contribution: number;
}

const valueFormatter = (value: number) => {
  // Para valores monetários (em milhares)
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(1)}K`;
  }
  return `R$ ${value.toFixed(2)}`;
};

const percentageFormatter = (value: number) => {
  // Garante que porcentagens sejam formatadas corretamente
  return `${value.toFixed(1)}%`;
};

// Updated professional color palette with better contrast and accessibility
const chartColors = {
  revenue: "#0EA5E9",    // sky-500
  profit: "#10B981",    // emerald-500
  costs: "#EF4444",    // red-500
  expenses: "#F59E0B",    // amber-500
  neutral: "#64748B",    // slate-500
};

const colors: Color[] = ["cyan", "emerald", "red", "amber", "slate"];

// Add memoized data processing
const useMemoizedFinancialData = (data: FactEntry[]) => {
  return React.useMemo(() => {
    return data.reduce((acc, item) => {
      const period = item.period;
      if (!acc[period]) {
        acc[period] = {
          period,
          revenue: 0,
          cogs: 0,
          expenses: 0,
          profit: 0,
          grossProfit: 0
        };
      }

      switch (item.pnlLine) {
        case 'Net Revenue':
          acc[period].revenue += item.value;
          acc[period].profit += item.value;
          acc[period].grossProfit += item.value;
          break;
        case 'Cost of Goods Sold':
          acc[period].cogs += item.value;
          acc[period].profit -= item.value;
          acc[period].grossProfit -= item.value;
          break;
        case 'Marketing Expenses':
        case 'SG&A Expenses':
          acc[period].expenses += item.value;
          acc[period].profit -= item.value;
          break;
      }

      return acc;
    }, {} as Record<string, any>);
  }, [data]);
};

// Adicione esta função auxiliar após as funções de formatação existentes
const formatCostCenterLabel = (costCenter: string, description: string | undefined) => {
  // Se tiver descrição, mostra código + descrição resumida
  if (description) {
    // Limita a descrição a 20 caracteres
    const shortDesc = description.length > 20 
      ? description.substring(0, 20) + '...'
      : description;
    return `${costCenter} - ${shortDesc}`;
  }
  // Se não tiver descrição, mostra só o código formatado
  return costCenter;
};

export function DRECharts({ data }: DREChartsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const financialData = useMemoizedFinancialData(data);

  const periodsData = Object.values(financialData)
    .sort((a, b) => a.period.localeCompare(b.period));

  const filteredData = selectedPeriod === "all" 
    ? periodsData 
    : periodsData.slice(-parseInt(selectedPeriod));

  // Cost center analysis
  const costCenterData = Object.values(
    data.reduce((acc, item) => {
      const costCenter = item.costCenter?.code || item.costCenterCode;
      const description = item.costCenter?.description || undefined;
      
      if (!acc[costCenter]) {
        acc[costCenter] = {
          name: formatCostCenterLabel(costCenter, description),
          costCenter: costCenter,
          description: description,
          revenue: 0,
          costs: 0,
          profit: 0,
          contribution: 0
        } as CostCenterData;
      }

      switch (item.pnlLine) {
        case 'Net Revenue':
          acc[costCenter].revenue += item.value;
          acc[costCenter].profit += item.value;
          break;
        case 'Cost of Goods Sold':
          acc[costCenter].costs += item.value;
          acc[costCenter].profit -= item.value;
          break;
      }

      return acc;
    }, {} as Record<string, any>)
  )
    .map(cc => ({
      ...cc,
      contribution: (cc.profit / periodsData[periodsData.length - 1].profit) * 100
    }))
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 8); // Limit to top 8 for better visualization

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Select
          value={selectedPeriod}
          onValueChange={setSelectedPeriod}
          className="max-w-xs"
        >
          <SelectItem value="all">Todos os períodos</SelectItem>
          <SelectItem value="12">Últimos 12 meses</SelectItem>
          <SelectItem value="6">Últimos 6 meses</SelectItem>
          <SelectItem value="3">Últimos 3 meses</SelectItem>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TremorCard className="ring-1 ring-gray-200 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-6">
            <Title className="text-sm font-semibold text-gray-800 mb-6">
              Evolução da Receita (em R$)
            </Title>
            <div className="h-[280px]">
              <AreaChart
                data={filteredData}
                index="period"
                categories={["revenue"]}
                colors={[chartColors.revenue]}
                valueFormatter={formatCurrency}
                showLegend={false}
                showGridLines={false}
                className="mt-2"
                yAxisWidth={100}
                minValue={0}
              />
            </div>
          </CardContent>
        </TremorCard>

        <TremorCard className="ring-1 ring-gray-200 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-6">
            <Title className="text-sm font-semibold text-gray-800 mb-6">
              Composição do Resultado (em R$)
            </Title>
            <div className="h-[280px]">
              <BarChart
                data={filteredData}
                index="period"
                categories={["revenue", "cogs", "expenses"]}
                colors={[
                  chartColors.revenue,
                  chartColors.costs,
                  chartColors.expenses
                ]}
                valueFormatter={formatCurrency}
                stack
                showLegend
                showGridLines={false}
                className="mt-2"
                yAxisWidth={100}
                minValue={0}
              />
            </div>
          </CardContent>
        </TremorCard>
      </div>

      <TremorCard className="ring-1 ring-gray-200 transition-all duration-300 hover:shadow-lg">
        <CardContent className="p-6">
          <Title className="text-sm font-semibold text-gray-800 mb-6">
            Contribuição por Centro de Custo (%)
          </Title>
          <div className="h-[360px]">
            <BarChart
              data={costCenterData}
              index="name"
              categories={["contribution"]}
              colors={[chartColors.neutral]}
              valueFormatter={percentageFormatter}
              showLegend={false}
              showGridLines={false}
              layout="vertical"
              className="mt-2"
              yAxisWidth={160}
              minValue={0}
              showAnimation={true}
              customTooltip={(props) => {
                const { payload, active } = props;
                if (!active || !payload) return null;
                
                const data = payload[0]?.payload;
                if (!data) return null;

                return (
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
                    <div className="font-medium">{data.costCenter}</div>
                    {data.description && (
                      <div className="text-sm text-gray-600">{data.description}</div>
                    )}
                    <div className="mt-2 font-medium text-gray-900">
                      Contribuição: {percentageFormatter(data.contribution)}
                    </div>
                  </div>
                );
              }}
            />
          </div>
        </CardContent>
      </TremorCard>
    </div>
  );
} 