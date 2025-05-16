'use client';

import { FactEntry } from "@/types/fact-entry";
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
  TabPanels
} from "@tremor/react";
import { formatCurrency } from "@/lib/format";
import React, { useState } from "react";

interface DREChartsProps {
  data: FactEntry[];
}

const valueFormatter = (value: number) => formatCurrency(value);
const percentageFormatter = (value: number) => `${value.toFixed(1)}%`;

// Updated professional color palette with better contrast and accessibility
const chartColors = {
  revenue: "#0891B2", // cyan-600
  profit: "#059669", // emerald-600
  costs: "#DC2626", // red-600
  expenses: "#D97706", // amber-600
  neutral: "#475569" // slate-600
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

export function DRECharts({ data }: DREChartsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const financialData = useMemoizedFinancialData(data);

  const periodsData = Object.values(financialData)
    .sort((a, b) => a.period.localeCompare(b.period));

  // Filter data based on selected period
  const filteredData = selectedPeriod === "all" 
    ? periodsData 
    : periodsData.slice(-parseInt(selectedPeriod));

  const currentPeriod = periodsData[periodsData.length - 1];
  const previousPeriod = periodsData[periodsData.length - 2];

  // Calculate key financial ratios
  const grossMargin = (currentPeriod.grossProfit / currentPeriod.revenue) * 100;
  const operatingMargin = (currentPeriod.profit / currentPeriod.revenue) * 100;
  const expenseRatio = (currentPeriod.expenses / currentPeriod.revenue) * 100;

  // Calculate YoY growth
  const calculateGrowth = (current: number, previous: number) => 
    previous ? ((current - previous) / Math.abs(previous)) * 100 : 0;

  const revenueGrowth = calculateGrowth(currentPeriod.revenue, previousPeriod.revenue);
  const profitGrowth = calculateGrowth(currentPeriod.profit, previousPeriod.profit);

  // Cost center analysis
  const costCenterData = Object.values(
    data.reduce((acc, item) => {
      const costCenter = item.costCenter?.code || item.costCenterCode;
      if (!acc[costCenter]) {
        acc[costCenter] = {
          name: costCenter,
          revenue: 0,
          costs: 0,
          profit: 0,
          contribution: 0
        };
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
      contribution: (cc.profit / currentPeriod.profit) * 100
    }))
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 8); // Limit to top 8 for better visualization

  return (
    <div className="space-y-8">
      {/* Financial Performance Overview */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <Title className="text-xl font-semibold text-gray-800">Performance Financeira</Title>
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

        <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-6">
          <TremorCard className="ring-1 ring-gray-200 transition-all duration-300 hover:shadow-lg">
            <div className="p-6">
              <Flex>
                <div>
                  <Text className="text-sm font-medium text-gray-600">Receita</Text>
                  <Metric className="text-2xl font-semibold text-gray-800">
                    {valueFormatter(currentPeriod.revenue)}
                  </Metric>
                </div>
                <BadgeDelta 
                  deltaType={revenueGrowth >= 0 ? "increase" : "decrease"}
                  className="text-sm"
                >
                  {percentageFormatter(revenueGrowth)}
                </BadgeDelta>
              </Flex>
              <Flex className="mt-4 space-x-2">
                <Text className="text-sm text-gray-600">Meta Atingida</Text>
                <Text className="text-sm font-medium text-gray-800">{percentageFormatter(85)}</Text>
              </Flex>
              <ProgressBar 
                value={85} 
                color="cyan" 
                className="mt-2"
                tooltip={`Meta: ${valueFormatter(currentPeriod.revenue * 1.15)}`}
              />
            </div>
          </TremorCard>

          <TremorCard className="ring-1 ring-gray-200 transition-all duration-300 hover:shadow-lg">
            <div className="p-6">
              <Flex>
                <div>
                  <Text className="text-sm font-medium text-gray-600">Lucro Operacional</Text>
                  <Metric className="text-2xl font-semibold text-gray-800">
                    {valueFormatter(currentPeriod.profit)}
                  </Metric>
                </div>
                <BadgeDelta 
                  deltaType={profitGrowth >= 0 ? "increase" : "decrease"}
                  className="text-sm"
                >
                  {percentageFormatter(profitGrowth)}
                </BadgeDelta>
              </Flex>
              <Flex className="mt-4 space-x-2">
                <Text className="text-sm text-gray-600">Margem</Text>
                <Text className="text-sm font-medium text-gray-800">
                  {percentageFormatter(operatingMargin)}
                </Text>
              </Flex>
              <ProgressBar 
                value={operatingMargin} 
                color="emerald" 
                className="mt-2"
                tooltip="Margem Operacional"
              />
            </div>
          </TremorCard>

          <TremorCard className="ring-1 ring-gray-200 transition-all duration-300 hover:shadow-lg">
            <div className="p-6">
              <Text className="text-sm font-medium text-gray-600">Margem Bruta</Text>
              <Metric className="text-2xl font-semibold text-gray-800">
                {percentageFormatter(grossMargin)}
              </Metric>
              <Flex className="mt-4 space-x-2">
                <Text className="text-sm text-gray-600">Despesas/Receita</Text>
                <Text className="text-sm font-medium text-gray-800">
                  {percentageFormatter(expenseRatio)}
                </Text>
              </Flex>
              <ProgressBar 
                value={expenseRatio} 
                color="red" 
                className="mt-2"
                tooltip="Relação Despesas/Receita"
              />
            </div>
          </TremorCard>
        </Grid>
      </div>

      {/* Charts Section */}
      <TabGroup>
        <TabList className="mb-8">
          <Tab className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-500">
            Tendências
          </Tab>
          <Tab className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-500">
            Centros de Custo
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Grid numItems={1} numItemsLg={2} className="gap-6">
              <TremorCard>
                <div className="p-4">
                  <Title>Evolução da Receita e Lucro</Title>
                </div>
                <div className="p-4">
                  <AreaChart
                    className="h-72 mt-4"
                    data={filteredData}
                    index="period"
                    categories={["revenue", "profit"]}
                    colors={["cyan", "emerald"]}
                    valueFormatter={valueFormatter}
                    showLegend
                    showGridLines={false}
                    showAnimation
                  />
                </div>
              </TremorCard>

              <TremorCard>
                <div className="p-4">
                  <Title>Composição de Custos e Despesas</Title>
                </div>
                <div className="p-4">
                  <BarChart
                    className="h-72 mt-4"
                    data={filteredData}
                    index="period"
                    categories={["cogs", "expenses"]}
                    colors={["red", "amber"]}
                    valueFormatter={valueFormatter}
                    showLegend
                    showGridLines={false}
                    showAnimation
                  />
                </div>
              </TremorCard>
            </Grid>
          </TabPanel>

          <TabPanel>
            <TremorCard>
              <div className="p-4">
                <Title>Análise por Centro de Custo</Title>
              </div>
              <div className="p-4">
                <BarChart
                  className="h-96 mt-4"
                  data={costCenterData}
                  index="name"
                  categories={["revenue", "costs", "profit"]}
                  colors={["cyan", "red", "emerald"]}
                  valueFormatter={valueFormatter}
                  layout="vertical"
                  showLegend
                  showGridLines={false}
                  showAnimation
                />
              </div>
            </TremorCard>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
} 