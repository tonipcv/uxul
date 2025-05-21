'use client';

import { useState } from 'react';
import { PivotTable } from "@/components/pivot/PivotTable";
import { PivotConfig } from "@/components/pivot/PivotConfig";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { PivotRequest } from "@/types/pivot";

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

  return (
    <>
      <Navigation />
      <div className="min-h-[100dvh] bg-gray-50 pb-24 lg:pb-16 lg:ml-16">
        <div className="container mx-auto px-2 max-w-full pt-20 lg:pt-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Análise Dinâmica</h1>
            <p className="text-muted-foreground">
              Arraste e solte as dimensões e métricas para criar sua análise.
            </p>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <PivotConfig config={config} onChange={setConfig} />
            </CardContent>
          </Card>

          <PivotTable initialConfig={config} />
        </div>
      </div>
    </>
  );
} 