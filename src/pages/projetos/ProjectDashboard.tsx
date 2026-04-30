import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

export default function ProjectDashboard() {
  const { selectedEmpresaId } = useAuth()
  const [projetos, setProjetos] = useState<any[]>([])
  const [tarefas, setTarefas] = useState<any[]>([])

  useEffect(() => {
    if (!selectedEmpresaId) return
    pb.collection('projetos')
      .getFullList({ filter: `empresa_id="${selectedEmpresaId}"` })
      .then(setProjetos)
      .catch(console.error)
    pb.collection('tarefas')
      .getFullList({ filter: `empresa_id="${selectedEmpresaId}"` })
      .then(setTarefas)
      .catch(console.error)
  }, [selectedEmpresaId])

  const statusData = [
    { name: 'To Do', value: projetos.filter((p) => p.status === 'to_do').length, color: '#94a3b8' },
    {
      name: 'In Progress',
      value: projetos.filter((p) => p.status === 'in_progress').length,
      color: '#3b82f6',
    },
    { name: 'Done', value: projetos.filter((p) => p.status === 'done').length, color: '#10b981' },
  ].filter((d) => d.value > 0)

  const tarefasAtrasadas = tarefas.filter((t) => {
    if (t.status === 'concluida' || t.status === 'encerrada') return false
    if (!t.data_vencimento_planejada) return false
    return new Date(t.data_vencimento_planejada) < new Date()
  }).length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard de Projetos</h2>
        <p className="text-muted-foreground">Visão geral de SLA, Entregas e Produtividade.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projetos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Atrasadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{tarefasAtrasadas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Projetos Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projetos.filter((p) => p.status === 'done').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status dos Projetos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
