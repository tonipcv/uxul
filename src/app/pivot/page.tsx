import { PivotTable } from "@/components/pivot/PivotTable";
import Navigation from "@/components/Navigation";

export default function PivotPage() {
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

          <PivotTable
            initialConfig={{
              rows: ['pnlLine', 'customer'],
              columns: ['version'],
              metrics: ['SUM(value)'],
              filters: {
                scenario: 'Base Case',
                version: ['Actual', 'Forecast']
              }
            }}
          />
        </div>
      </div>
    </>
  );
} 