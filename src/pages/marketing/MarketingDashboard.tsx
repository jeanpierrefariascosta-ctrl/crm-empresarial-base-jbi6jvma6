import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'

export default function MarketingDashboard() {
  const { selectedEmpresaId } = useAuth()
  const [campanhas, setCampanhas] = useState<any[]>([])

  useEffect(() => {
    if (!selectedEmpresaId) return
    pb.collection('campanhas_ads')
      .getFullList({ filter: `empresa_id="${selectedEmpresaId}"` })
      .then(setCampanhas)
      .catch(console.error)
  }, [selectedEmpresaId])

  const chartData = campanhas.map((c) => ({
    nome: c.nome_campanha,
    orcamento: c.orcamento || 0,
  }))

  const totalOrcamento = campanhas.reduce((acc, c) => acc + (c.orcamento || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard de Marketing</h2>
        <p className="text-muted-foreground">Acompanhe o ROI e desempenho de campanhas.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campanhas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Orçamento Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                totalOrcamento,
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Orçamento por Campanha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="nome" />
                <Tooltip />
                <Bar dataKey="orcamento" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
