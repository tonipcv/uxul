import { prisma } from "@/lib/prisma";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import Navigation from "@/components/Navigation";
import { CreateModal } from "./create-modal";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DREAnalytics } from "./analytics";
import { DRECharts } from "./charts";
import { ChartBarIcon, TableCellsIcon, ChartPieIcon } from "@heroicons/react/24/outline";
import { FactEntry } from "@/types/fact-entry";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

async function getData() {
  const facts = await prisma.factEntry.findMany({
    include: {
      product: true,
      costCenter: true,
    },
    orderBy: {
      period: "desc",
    },
  });

  // Transform Prisma data to match FactEntry type
  const transformedFacts: FactEntry[] = facts.map(fact => ({
    id: fact.id,
    version: fact.version,
    value: fact.value,
    period: fact.period,
    scenario: fact.scenario,
    bu: fact.bu,
    region: fact.region,
    channel: fact.channel,
    productSku: fact.productSku,
    customer: fact.customer,
    costCenterCode: fact.costCenterCode,
    glAccount: fact.glAccount,
    pnlLine: fact.pnlLine,
    createdAt: fact.createdAt,
    updatedAt: fact.updatedAt,
    importedAt: fact.importedAt,
    costCenter: fact.costCenter ? {
      code: fact.costCenter.code,
      description: fact.costCenter.description
    } : undefined,
    product: fact.product ? {
      sku: fact.product.sku,
      description: fact.product.description
    } : undefined
  }));

  // Calculate totals and summaries
  const summaryData = {
    totalRevenue: transformedFacts.reduce((acc, fact) => 
      fact.pnlLine === 'Net Revenue' ? acc + fact.value : acc, 0),
    totalCosts: transformedFacts.reduce((acc, fact) => 
      fact.pnlLine === 'Cost of Goods Sold' ? acc + fact.value : acc, 0),
    totalExpenses: transformedFacts.reduce((acc, fact) => 
      ['Marketing Expenses', 'SG&A Expenses'].includes(fact.pnlLine) ? acc + fact.value : acc, 0),
  };

  return {
    facts: transformedFacts,
    summaryData
  };
}

export default async function DREPage() {
  const { facts, summaryData } = await getData();

  return (
    <>
      <Navigation />
      <div className="min-h-[100dvh] bg-gray-50 pb-24 lg:pb-16 lg:ml-16">
        <div className="container mx-auto px-2 max-w-full pt-20 lg:pt-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-4 mb-8">
            <Suspense>
              <CreateModal />
            </Suspense>
          </div>

          <Tabs defaultValue="analytics" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-gray-200">
              <TabsList className="bg-white/50 p-1">
                <TabsTrigger 
                  value="analytics" 
                  className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-white"
                >
                  <ChartPieIcon className="h-4 w-4" />
                  <span>Análise</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="charts" 
                  className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-white"
                >
                  <ChartBarIcon className="h-4 w-4" />
                  <span>Gráficos</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="table" 
                  className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-white"
                >
                  <TableCellsIcon className="h-4 w-4" />
                  <span>Dados</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="analytics" className="mt-0">
              <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-6">
                  <DREAnalytics data={facts} summaryData={summaryData} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="charts" className="mt-0">
              <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-6">
                  <DRECharts data={facts} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="table" className="mt-0">
              <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-6">
                  <DataTable columns={columns} data={facts} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
} 