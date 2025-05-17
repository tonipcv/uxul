import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Formula {
  name: string
  formula: string
  observation: string
  value: number | null
}

interface DimensionalAnalysis {
  dimension: string
  value: string
  netRevenue: number
  skuCount?: number
  averageTicket?: number
}

// Função para buscar e calcular os dados do P&L
async function calculatePLData() {
  const facts = await prisma.factEntry.findMany({
    orderBy: {
      period: "desc",
    },
  });

  // Calcula Net Revenue
  const netRevenue = facts.reduce((acc, fact) => 
    fact.pnlLine === 'Net Revenue' ? acc + fact.value : acc, 0);

  // Calcula COGS
  const cogs = facts.reduce((acc, fact) => 
    fact.pnlLine === 'Cost of Goods Sold' ? acc + fact.value : acc, 0);

  // Calcula Gross Profit
  const grossProfit = netRevenue - cogs;

  // Calcula Marketing Expenses
  const marketingExpenses = facts.reduce((acc, fact) => 
    fact.pnlLine === 'Marketing Expenses' ? acc + fact.value : acc, 0);

  // Calcula SG&A Expenses
  const sgaExpenses = facts.reduce((acc, fact) => 
    fact.pnlLine === 'SG&A Expenses' ? acc + fact.value : acc, 0);

  // Calcula EBITDA
  const ebitda = grossProfit - marketingExpenses - sgaExpenses;

  // Calcula as margens
  const grossMargin = (grossProfit / netRevenue) * 100;
  const ebitdaMargin = (ebitda / netRevenue) * 100;

  return {
    netRevenue,
    cogs,
    grossProfit,
    marketingExpenses,
    sgaExpenses,
    ebitda,
    grossMargin,
    ebitdaMargin
  };
}

// Função para calcular análises por dimensão
async function calculateDimensionalAnalysis() {
  const facts = await prisma.factEntry.findMany({
    where: {
      pnlLine: 'Net Revenue'
    },
    include: {
      product: true
    }
  });

  // Análise por Produto
  const byProduct = facts.reduce((acc, fact) => {
    const key = fact.productSku;
    if (!acc[key]) {
      acc[key] = {
        dimension: 'Produto',
        value: fact.product?.description || fact.productSku,
        netRevenue: 0,
        skuCount: 1
      };
    }
    acc[key].netRevenue += fact.value;
    return acc;
  }, {} as Record<string, DimensionalAnalysis>);

  // Análise por Cliente
  const byCustomer = facts.reduce((acc, fact) => {
    const key = fact.customer;
    if (!acc[key]) {
      acc[key] = {
        dimension: 'Cliente',
        value: fact.customer,
        netRevenue: 0,
        skuCount: new Set()
      };
    }
    acc[key].netRevenue += fact.value;
    (acc[key].skuCount as Set<string>).add(fact.productSku);
    return acc;
  }, {} as Record<string, any>);

  // Converter Set de SKUs para contagem
  Object.values(byCustomer).forEach(customer => {
    customer.skuCount = (customer.skuCount as Set<string>).size;
    customer.averageTicket = customer.netRevenue / customer.skuCount;
  });

  // Análise por Canal
  const byChannel = facts.reduce((acc, fact) => {
    const key = fact.channel;
    if (!acc[key]) {
      acc[key] = {
        dimension: 'Canal',
        value: fact.channel,
        netRevenue: 0,
        skuCount: new Set()
      };
    }
    acc[key].netRevenue += fact.value;
    (acc[key].skuCount as Set<string>).add(fact.productSku);
    return acc;
  }, {} as Record<string, any>);

  // Converter Set de SKUs para contagem
  Object.values(byChannel).forEach(channel => {
    channel.skuCount = (channel.skuCount as Set<string>).size;
  });

  // Análise por Região
  const byRegion = facts.reduce((acc, fact) => {
    const key = fact.region;
    if (!acc[key]) {
      acc[key] = {
        dimension: 'Região',
        value: fact.region,
        netRevenue: 0
      };
    }
    acc[key].netRevenue += fact.value;
    return acc;
  }, {} as Record<string, DimensionalAnalysis>);

  // Análise por BU
  const byBU = facts.reduce((acc, fact) => {
    const key = fact.bu;
    if (!acc[key]) {
      acc[key] = {
        dimension: 'BU',
        value: fact.bu,
        netRevenue: 0
      };
    }
    acc[key].netRevenue += fact.value;
    return acc;
  }, {} as Record<string, DimensionalAnalysis>);

  return {
    byProduct: Object.values(byProduct).sort((a, b) => b.netRevenue - a.netRevenue),
    byCustomer: Object.values(byCustomer).sort((a, b) => b.netRevenue - a.netRevenue),
    byChannel: Object.values(byChannel).sort((a, b) => b.netRevenue - a.netRevenue),
    byRegion: Object.values(byRegion).sort((a, b) => b.netRevenue - a.netRevenue),
    byBU: Object.values(byBU).sort((a, b) => b.netRevenue - a.netRevenue)
  };
}

function DimensionalTable({ data, showSkuCount = false, showAvgTicket = false }: { 
  data: DimensionalAnalysis[], 
  showSkuCount?: boolean,
  showAvgTicket?: boolean
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Dimensão</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead className="text-right">Receita</TableHead>
          {showSkuCount && <TableHead className="text-right">SKUs Únicos</TableHead>}
          {showAvgTicket && <TableHead className="text-right">Ticket Médio</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item, index) => (
          <TableRow key={index}>
            <TableCell>{item.dimension}</TableCell>
            <TableCell>{item.value}</TableCell>
            <TableCell className="text-right">{formatCurrency(item.netRevenue)}</TableCell>
            {showSkuCount && (
              <TableCell className="text-right">{item.skuCount}</TableCell>
            )}
            {showAvgTicket && item.averageTicket && (
              <TableCell className="text-right">{formatCurrency(item.averageTicket)}</TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default async function FormulasPage() {
  const plData = await calculatePLData();
  const dimensionalData = await calculateDimensionalAnalysis();

  const formulas: Formula[] = [
    {
      name: "Net Revenue",
      formula: "Soma dos valores com P&L Line = 'Net Revenue'",
      observation: "Receita líquida já vem agrupada por cliente, produto, canal etc",
      value: plData.netRevenue
    },
    {
      name: "COGS (Custo dos Produtos Vendidos)",
      formula: "Soma dos valores com P&L Line = 'COGS'",
      observation: "Contas contábeis associadas ao custo",
      value: plData.cogs
    },
    {
      name: "Gross Profit",
      formula: "Net Revenue - COGS",
      observation: "Lucro bruto por combinação SKU + canal + cliente",
      value: plData.grossProfit
    },
    {
      name: "Gross Margin %",
      formula: "(Gross Profit / Net Revenue) * 100",
      observation: "Mostra eficiência da operação",
      value: plData.grossMargin
    },
    {
      name: "Marketing Expenses",
      formula: "Soma dos valores com P&L Line = 'Marketing Expenses'",
      observation: "Despesas de marketing e vendas",
      value: plData.marketingExpenses
    },
    {
      name: "SG&A Expenses",
      formula: "Soma dos valores com P&L Line = 'SG&A Expenses'",
      observation: "Despesas administrativas e gerais",
      value: plData.sgaExpenses
    },
    {
      name: "EBITDA",
      formula: "Gross Profit - Marketing Expenses - SG&A Expenses",
      observation: "Lucro antes de juros, impostos, depreciação e amortização",
      value: plData.ebitda
    },
    {
      name: "EBITDA Margin %",
      formula: "(EBITDA / Net Revenue) * 100",
      observation: "Margem EBITDA",
      value: plData.ebitdaMargin
    }
  ];

  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue="basic" className="space-y-8">
        <TabsList>
          <TabsTrigger value="basic">Fórmulas Básicas</TabsTrigger>
          <TabsTrigger value="dimensional">Análise por Dimensão</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">📐 Fórmulas Básicas (P&L Tradicional)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Estas são as fórmulas mais comuns na estrutura de uma DRE (Demonstração de Resultado).
                Utilize esta referência para entender os principais cálculos e métricas do seu P&L.
              </p>
              
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Fórmula</TableHead>
                      <TableHead className="w-[300px]">Cálculo</TableHead>
                      <TableHead className="w-[300px]">Valor Atual</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formulas.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                            {item.formula}
                          </code>
                        </TableCell>
                        <TableCell>
                          {item.value !== null ? (
                            item.name.includes('%') ? 
                              `${item.value.toFixed(2)}%` :
                              formatCurrency(item.value)
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell>{item.observation}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dimensional">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">🧮 Análise por Dimensão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Top Produtos por Receita</h3>
                <DimensionalTable data={dimensionalData.byProduct.slice(0, 5)} showSkuCount />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Top Clientes por Receita</h3>
                <DimensionalTable 
                  data={dimensionalData.byCustomer.slice(0, 5)} 
                  showSkuCount 
                  showAvgTicket 
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Análise por Canal</h3>
                <DimensionalTable data={dimensionalData.byChannel} showSkuCount />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Análise por Região</h3>
                <DimensionalTable data={dimensionalData.byRegion} />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Análise por Unidade de Negócio</h3>
                <DimensionalTable data={dimensionalData.byBU} />
              </div>

              <div className="mt-6 text-sm text-muted-foreground">
                <p>
                  Esta análise por dimensão permite identificar:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Produtos mais rentáveis</li>
                  <li>Clientes estratégicos</li>
                  <li>Canais de maior performance</li>
                  <li>Distribuição geográfica da receita</li>
                  <li>Performance por unidade de negócio</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 