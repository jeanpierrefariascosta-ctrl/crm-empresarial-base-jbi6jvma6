import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Users, Target, Activity } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'

export default function Index() {
  const { selectedEmpresaId } = useAuth()
  const [stats, setStats] = useState({
    totalLeads: 0,
    receitaPrevista: 0,
    leadsPorEtapa: [] as any[],
  })

  const loadDashboardData = async () => {
    if (!selectedEmpresaId) return
    try {
      const leads = await pb.collection('leads').getFullList({
        filter: `empresa_id = "${selectedEmpresaId}"`,
      })

      const totalLeads = leads.length
      const receitaPrevista = leads.reduce((acc, lead) => acc + (lead.valor_previsto || 0), 0)

      const etapasMap = leads.reduce((acc: any, lead) => {
        acc[lead.etapa_kanban] = (acc[lead.etapa_kanban] || 0) + 1
        return acc
      }, {})

      const leadsPorEtapa = Object.keys(etapasMap).map((k) => ({
        name: k.charAt(0).toUpperCase() + k.slice(1),
        valor: etapasMap[k],
      }))

      setStats({ totalLeads, receitaPrevista, leadsPorEtapa })
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [selectedEmpresaId])

  useRealtime('leads', () => {
    loadDashboardData()
  })

  const chartConfig = {
    valor: {
      label: 'Leads',
      color: 'hsl(var(--primary))',
    },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Painel de Controle</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
            <p className="text-xs text-muted-foreground">+2 novos hoje</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Prevista (Pipeline)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                stats.receitaPrevista,
              )}
            </div>
            <p className="text-xs text-muted-foreground">Oportunidades em aberto</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão Média</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.5%</div>
            <p className="text-xs text-muted-foreground">+1.2% que o mês passado</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">3 atrasadas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Funil de Vendas (Leads por Etapa)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
              <BarChart data={stats.leadsPorEtapa}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="valor" fill="var(--color-valor)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Reunião com Cliente {i}</p>
                    <p className="text-sm text-muted-foreground">Há {i} hora(s)</p>
                  </div>
                  <div className="ml-auto font-medium text-sm text-primary">Concluído</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
