import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

export default function Tarefas() {
  const { selectedEmpresaId } = useAuth()
  const [tarefas, setTarefas] = useState<any[]>([])

  const fetchTarefas = async () => {
    if (!selectedEmpresaId) return
    try {
      const data = await pb.collection('tarefas').getFullList({
        filter: `empresa_id = "${selectedEmpresaId}"`,
        sort: '-created',
      })
      setTarefas(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchTarefas()
  }, [selectedEmpresaId])

  useRealtime('tarefas', () => {
    fetchTarefas()
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'em_progresso':
        return (
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-500 hover:bg-blue-500/30">
            <Clock className="w-3 h-3 mr-1" /> Em Progresso
          </Badge>
        )
      case 'concluida':
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" /> Concluída
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="w-3 h-3 mr-1" /> Aberta
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projetos e Tarefas</h2>
          <p className="text-muted-foreground">Acompanhe as entregas e operações.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tarefas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  Nenhuma tarefa encontrada.
                </TableCell>
              </TableRow>
            ) : (
              tarefas.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.titulo}</TableCell>
                  <TableCell className="uppercase text-xs font-semibold">
                    {t.prioridade || 'BAIXA'}
                  </TableCell>
                  <TableCell>{getStatusBadge(t.status)}</TableCell>
                  <TableCell>{new Date(t.created).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
