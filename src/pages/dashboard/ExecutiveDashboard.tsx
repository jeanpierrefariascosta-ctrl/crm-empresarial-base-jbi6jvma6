import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer, Tooltip } from 'recharts'

export default function ExecutiveDashboard() {
  const { selectedEmpresaId } = useAuth()
  const [stats, setStats] = useState<any>({
    leads: 0,
    clientes: 0,
    projetos: 0,
    receita: 0,
  })

  useEffect(() => {
    if (!selectedEmpresaId) return
    const fetchData = async () => {
      try {
        const leads = await pb
          .collection('leads')
          .getList(1, 1, { filter: `empresa_id="${selectedEmpresaId}"` })
        const clientes = await pb
          .collection('clientes')
          .getList(1, 1, { filter: `empresa_id="${selectedEmpresaId}"` })
        const projetos = await pb
          .collection('projetos')
          .getFullList({ filter: `empresa_id="${selectedEmpresaId}"` })

        const receita = projetos.reduce((acc, p) => acc + (p.valor || 0), 0)

        setStats({
          leads: leads.totalItems,
          clientes: clientes.totalItems,
          projetos: projetos.length,
          receita,
        })
      } catch {
        /* intentionally ignored */
      }
    }
    fetchData()
  }, [selectedEmpresaId])

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

  const funnelData = [
    { name: 'Leads', value: stats.leads },
    { name: 'Clientes', value: stats.clientes },
    { name: 'Projetos', value: stats.projetos },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Painel Executivo</h2>
        <p className="text-muted-foreground">Visão consolidada do negócio.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clientes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Projetos em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projetos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Receita Total Projetos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{formatBRL(stats.receita)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              Funil de Conversão (Leads {' > '} Clientes {' > '} Projetos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ left: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  <Tooltip />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
