import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer } from 'recharts'
import { Tooltip as RechartsTooltip } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'

export default function SalesDashboard() {
  const { selectedEmpresaId } = useAuth()
  const [metrics, setMetrics] = useState<any>(null)
  const [funnelData, setFunnelData] = useState<any[]>([])

  useEffect(() => {
    if (!selectedEmpresaId) return
    pb.send('/backend/v1/sales/metrics', { method: 'GET' }).then(setMetrics).catch(console.error)

    pb.collection('leads')
      .getFullList({ filter: `empresa_id="${selectedEmpresaId}"` })
      .then((leads) => {
        const stages = [
          'prospecção',
          'qualificação',
          'proposta',
          'negociação',
          'fechamento',
          'fechado',
        ]
        const data = stages.map((s) => ({
          stage: s.charAt(0).toUpperCase() + s.slice(1),
          count: leads.filter((l: any) => l.etapa_kanban === s).length,
        }))
        setFunnelData(data)
      })
      .catch(console.error)
  }, [selectedEmpresaId])

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  if (!metrics)
    return <div className="p-8 text-center text-muted-foreground">Carregando dashboard...</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard de Vendas</h2>
        <p className="text-muted-foreground">Acompanhe seus principais indicadores e pipeline.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oportunidades Abertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalOpportunities}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor em Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBRL(metrics.pipelineValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Prevista (Ponderada)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBRL(metrics.predictedRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Funil de Vendas</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer
              config={{ count: { label: 'Leads', color: 'hsl(var(--primary))' } }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="stage"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <RechartsTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Performance de Fechamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-emerald-500 mb-4 tracking-tight">
              {formatBRL(metrics.confirmedRevenue)}
            </div>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">
              Receita Confirmada
            </p>
            <div className="mt-8 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ciclo Médio de Vendas</span>
                <span className="font-semibold">{metrics.averageCycleTime} dias</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa de Sucesso (Win Rate)</span>
                <span className="font-semibold">{metrics.winRate.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
