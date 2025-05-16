'use client';

import { FactEntry } from "@/types/fact-entry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from "@heroicons/react/24/outline";
import React from "react";
import { Progress } from "@/components/ui/progress";

interface DREAnalyticsProps {
  data: FactEntry[];
  summaryData: {
    totalRevenue: number;
    totalCosts: number;
    totalExpenses: number;
  };
}

// Helper functions
const calculateMetrics = (data: FactEntry[]) => {
  // Pegar o período mais recente
  const periods = [...new Set(data.map(item => item.period))].sort();
  const currentPeriod = periods[periods.length - 1];
  const previousPeriod = periods[periods.length - 2];

  // Calcular métricas do período atual
  const currentData = data.filter(item => item.period === currentPeriod);
  const previousData = data.filter(item => item.period === previousPeriod);

  // Receita
  const revenue = currentData
    .filter(item => item.pnlLine === 'Net Revenue')
    .reduce((sum, item) => sum + item.value, 0);

  const previousRevenue = previousData
    .filter(item => item.pnlLine === 'Net Revenue')
    .reduce((sum, item) => sum + item.value, 0);

  // Custos
  const costs = currentData
    .filter(item => item.pnlLine === 'Cost of Goods Sold')
    .reduce((sum, item) => sum + item.value, 0);

  // Despesas
  const expenses = currentData
    .filter(item => ['Marketing Expenses', 'SG&A Expenses'].includes(item.pnlLine))
    .reduce((sum, item) => sum + item.value, 0);

  // Cálculos derivados
  const grossProfit = revenue - costs;
  const operatingProfit = grossProfit - expenses;
  const grossMargin = (grossProfit / revenue) * 100;
  const operatingMargin = (operatingProfit / revenue) * 100;
  const expenseRatio = (expenses / revenue) * 100;
  const revenueGrowth = ((revenue - previousRevenue) / Math.abs(previousRevenue)) * 100;

  // ROI e Liquidez (exemplo - ajuste conforme sua lógica de negócio)
  const totalAssets = currentData
    .filter(item => item.pnlLine === 'Total Assets')
    .reduce((sum, item) => sum + item.value, 0);

  const currentAssets = currentData
    .filter(item => item.pnlLine === 'Current Assets')
    .reduce((sum, item) => sum + item.value, 0);

  const currentLiabilities = currentData
    .filter(item => item.pnlLine === 'Current Liabilities')
    .reduce((sum, item) => sum + item.value, 0);

  const roi = (operatingProfit / totalAssets) * 100;
  const liquidityRatio = currentAssets / currentLiabilities;

  return {
    revenue,
    revenueGrowth,
    grossProfit,
    operatingProfit,
    grossMargin,
    operatingMargin,
    expenseRatio,
    roi,
    liquidityRatio
  };
};

const calculatePeriodMetrics = (data: FactEntry[]) => {
  const periods = [...new Set(data.map(item => item.period))].sort().reverse();
  const latestPeriod = periods[0];
  const previousPeriod = periods[1];

  const currentPeriodRevenue = data
    .filter(item => item.period === latestPeriod && item.pnlLine === 'Net Revenue')
    .reduce((sum, item) => sum + item.value, 0);

  const previousPeriodRevenue = data
    .filter(item => item.period === previousPeriod && item.pnlLine === 'Net Revenue')
    .reduce((sum, item) => sum + item.value, 0);

  const revenueGrowth = ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100;

  return {
    currentPeriodRevenue,
    previousPeriodRevenue,
    revenueGrowth
  };
};

export function DREAnalytics({ data, summaryData }: DREAnalyticsProps) {
  const metrics = React.useMemo(() => calculateMetrics(data), [data]);
  const periodMetrics = React.useMemo(() => calculatePeriodMetrics(data), [data]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-3">
            <CardTitle className="text-sm font-medium text-gray-600">Faturamento Total</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold text-gray-900">{formatCurrency(summaryData.totalRevenue)}</div>
            <div className="mt-2 flex items-center space-x-2">
              <div className={`flex items-center space-x-1 ${metrics.revenueGrowth >= 0 ? 'text-blue-600' : 'text-blue-600'}`}>
                {metrics.revenueGrowth >= 0 ? (
                  <ArrowTrendingUpIcon className="h-4 w-4" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4" />
                )}
                <span className="text-xs font-medium">
                  {metrics.revenueGrowth >= 0 ? '+' : ''}{metrics.revenueGrowth.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">Meta Atingida</span>
                <span className="font-medium text-gray-900">85,0%</span>
              </div>
              <Progress 
                value={85} 
                className="h-1.5 bg-blue-100 [&>[data-state=completed]]:bg-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-3">
            <CardTitle className="text-sm font-medium text-gray-600">Despesas Totais</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(summaryData.totalExpenses)}
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-blue-600">
                <span className="text-xs font-medium">
                  {((summaryData.totalExpenses / summaryData.totalRevenue) * 100).toFixed(1)}% da receita
                </span>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">Proporção</span>
                <span className="font-medium text-gray-900">
                  {((summaryData.totalExpenses / summaryData.totalRevenue) * 100).toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min(100, (summaryData.totalExpenses / summaryData.totalRevenue) * 100)} 
                className="h-1.5 bg-blue-100 [&>[data-state=completed]]:bg-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-3">
            <CardTitle className="text-sm font-medium text-gray-600">Lucro</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(summaryData.totalRevenue - summaryData.totalExpenses)}
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-blue-600">
                <span className="text-xs font-medium">
                  {((summaryData.totalRevenue - summaryData.totalExpenses) / summaryData.totalRevenue * 100).toFixed(1)}% da receita
                </span>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">Margem de Lucro</span>
                <span className="font-medium text-gray-900">
                  {((summaryData.totalRevenue - summaryData.totalExpenses) / summaryData.totalRevenue * 100).toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.max(0, ((summaryData.totalRevenue - summaryData.totalExpenses) / summaryData.totalRevenue * 100))} 
                className="h-1.5 bg-blue-100 [&>[data-state=completed]]:bg-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-3">
            <CardTitle className="text-sm font-medium text-gray-600">Margem Bruta</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className={`text-xl font-bold ${metrics.grossMargin >= 0 ? 'text-gray-900' : 'text-blue-600'}`}>
              {metrics.grossMargin.toFixed(1)}%
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-gray-600">
                <span className="text-xs">Meta: 40%</span>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">Despesas/Receita</span>
                <span className="font-medium text-blue-600">{metrics.expenseRatio.toFixed(1)}%</span>
              </div>
              <Progress 
                value={Math.min(100, metrics.expenseRatio)} 
                className="h-1.5 bg-blue-100 [&>[data-state=completed]]:bg-blue-500"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-white transition-all duration-300 hover:shadow-lg">
          <CardHeader className="px-4 pt-3 pb-2">
            <CardTitle className="text-gray-800">Análise por Centro de Custo</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-3">
              {Object.entries(data.reduce((acc, item) => {
                const costCenter = item.costCenter?.code || item.costCenterCode;
                if (!acc[costCenter]) {
                  acc[costCenter] = {
                    total: 0,
                    revenue: 0
                  };
                }
                if (item.pnlLine === 'Net Revenue') {
                  acc[costCenter].revenue += item.value;
                }
                acc[costCenter].total += item.value;
                return acc;
              }, {} as Record<string, { total: number, revenue: number }>))
                .sort(([, a], [, b]) => b.total - a.total)
                .slice(0, 5)
                .map(([costCenter, values]) => (
                  <div key={costCenter} className="flex items-center p-2.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">{costCenter}</div>
                      <div className="text-xs text-gray-600">
                        {((values.revenue / summaryData.totalRevenue) * 100).toFixed(1)}% do total
                      </div>
                    </div>
                    <div className="font-medium text-gray-900">{formatCurrency(values.total)}</div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white transition-all duration-300 hover:shadow-lg">
          <CardHeader className="px-4 pt-3 pb-2">
            <CardTitle className="text-gray-800">Principais Produtos</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2">
              {Object.entries(data.reduce((acc, item) => {
                const product = item.product?.description || item.productSku;
                if (!acc[product]) {
                  acc[product] = {
                    total: 0,
                    revenue: 0
                  };
                }
                if (item.pnlLine === 'Net Revenue') {
                  acc[product].revenue += item.value;
                }
                acc[product].total += item.value;
                return acc;
              }, {} as Record<string, { total: number, revenue: number }>))
                .sort(([, a], [, b]) => b.total - a.total)
                .slice(0, 5)
                .map(([product, values]) => (
                  <div key={product} className="flex items-center p-2.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">{product}</div>
                      <div className="text-xs text-gray-600">
                        {((values.revenue / summaryData.totalRevenue) * 100).toFixed(1)}% da receita
                      </div>
                    </div>
                    <div className="font-medium text-gray-900">{formatCurrency(values.total)}</div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 