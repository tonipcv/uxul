'use client';

import { FactEntry } from "@/types/fact-entry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from "@heroicons/react/24/outline";
import React from "react";

interface DREAnalyticsProps {
  data: FactEntry[];
  summaryData: {
    totalRevenue: number;
    totalCosts: number;
    totalExpenses: number;
  };
}

// Memoized helper functions
const calculateMetrics = React.useMemo(() => (summaryData: DREAnalyticsProps['summaryData']) => {
  const grossProfit = summaryData.totalRevenue - summaryData.totalCosts;
  const operatingProfit = grossProfit - summaryData.totalExpenses;
  const grossMargin = (grossProfit / summaryData.totalRevenue) * 100;
  const operatingMargin = (operatingProfit / summaryData.totalRevenue) * 100;
  
  return {
    grossProfit,
    operatingProfit,
    grossMargin,
    operatingMargin
  };
}, []);

const calculatePeriodMetrics = React.useMemo(() => (data: FactEntry[]) => {
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
}, []);

export function DREAnalytics({ data, summaryData }: DREAnalyticsProps) {
  const metrics = React.useMemo(() => calculateMetrics(summaryData), [summaryData]);
  const periodMetrics = React.useMemo(() => calculatePeriodMetrics(data), [data]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(summaryData.totalRevenue)}</div>
            <div className="mt-2 flex items-center space-x-2">
              {periodMetrics.revenueGrowth >= 0 ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
              )}
              <p className={`text-sm ${periodMetrics.revenueGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {periodMetrics.revenueGrowth >= 0 ? "+" : ""}{periodMetrics.revenueGrowth.toFixed(1)}% vs período anterior
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Lucro Bruto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.grossProfit)}</div>
            <div className="mt-2 flex items-center space-x-2">
              <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                metrics.grossMargin >= 20 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                Margem Bruta: {metrics.grossMargin.toFixed(1)}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Lucro Operacional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.operatingProfit)}</div>
            <div className="mt-2 flex items-center space-x-2">
              <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                metrics.operatingMargin >= 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                Margem Operacional: {metrics.operatingMargin.toFixed(1)}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Despesas Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(summaryData.totalExpenses)}</div>
            <div className="mt-2 flex items-center space-x-2">
              <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                (summaryData.totalExpenses / summaryData.totalRevenue) * 100 <= 70 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-red-100 text-red-700'
              }`}>
                {((summaryData.totalExpenses / summaryData.totalRevenue) * 100).toFixed(1)}% da Receita
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2 bg-white transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-800">Análise por Centro de Custo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(data.reduce((acc, item) => {
                const costCenter = item.costCenter?.code || item.costCenterCode;
                if (!acc[costCenter]) {
                  acc[costCenter] = 0;
                }
                acc[costCenter] += item.value;
                return acc;
              }, {} as Record<string, number>))
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([costCenter, value]) => (
                  <div key={costCenter} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">{costCenter}</div>
                      <div className="text-xs text-gray-600">
                        {((value / summaryData.totalRevenue) * 100).toFixed(1)}% do total
                      </div>
                    </div>
                    <div className="font-medium text-gray-900">{formatCurrency(value)}</div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-800">Principais Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(data.reduce((acc, item) => {
                const product = item.product?.description || item.productSku;
                if (!acc[product]) {
                  acc[product] = 0;
                }
                acc[product] += item.value;
                return acc;
              }, {} as Record<string, number>))
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([product, value]) => (
                  <div key={product} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">{product}</div>
                      <div className="text-xs text-gray-600">
                        {((value / summaryData.totalRevenue) * 100).toFixed(1)}% da receita
                      </div>
                    </div>
                    <div className="font-medium text-gray-900">{formatCurrency(value)}</div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 