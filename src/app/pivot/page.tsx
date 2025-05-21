'use client';

import { useState } from 'react';
import { PivotTable } from "@/components/pivot/PivotTable";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AVAILABLE_DIMENSIONS, AVAILABLE_METRICS, PivotRequest } from "@/types/pivot";

const DEFAULT_CONFIG: PivotRequest = {
  rows: ['pnlLine'],
  columns: ['version'],
  metrics: ['SUM(value)'],
  filters: {
    scenario: 'Base Case',
    version: ['Actual', 'Forecast']
  }
};

export default function PivotPage() {
  const [config, setConfig] = useState<PivotRequest>(DEFAULT_CONFIG);

  const handleConfigChange = (type: 'rows' | 'columns' | 'metrics', value: string) => {
    setConfig(prev => ({
      ...prev,
      [type]: [value]
    }));
  };

  return (
    <>
      <Navigation />
      <div className="min-h-[100dvh] bg-gray-50 pb-24 lg:pb-16 lg:ml-16">
        <div className="container mx-auto px-2 max-w-full pt-20 lg:pt-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Análise Dinâmica</h1>
            <p className="text-muted-foreground">
              Analise seus dados financeiros de forma dinâmica e flexível.
            </p>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Linhas
                  </label>
                  <Select
                    value={config.rows[0]}
                    onValueChange={(value) => handleConfigChange('rows', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a dimensão" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_DIMENSIONS.map((dim) => (
                        <SelectItem key={dim.key} value={dim.key}>
                          {dim.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Colunas
                  </label>
                  <Select
                    value={config.columns[0]}
                    onValueChange={(value) => handleConfigChange('columns', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a dimensão" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_DIMENSIONS.map((dim) => (
                        <SelectItem key={dim.key} value={dim.key}>
                          {dim.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Métrica
                  </label>
                  <Select
                    value={config.metrics[0]}
                    onValueChange={(value) => handleConfigChange('metrics', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a métrica" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_METRICS.map((metric) => (
                        <SelectItem key={metric.key} value={metric.key}>
                          {metric.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <PivotTable initialConfig={config} />
        </div>
      </div>
    </>
  );
} 