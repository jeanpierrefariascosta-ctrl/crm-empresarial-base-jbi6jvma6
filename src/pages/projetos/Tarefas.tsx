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
import { Plus, CheckCircle2, Clock, AlertCircle, Lock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function Tarefas() {
  const { selectedEmpresaId } = useAuth()
  const [tarefas, setTarefas] = useState<any[]>([])
  const [closureModalOpen, setClosureModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [motivo, setMotivo] = useState('')
  const [observacao, setObservacao] = useState('')

  const fetchTarefas = async () => {
    if (!selectedEmpresaId) return
    try {
      const data = await pb.collection('tarefas').getFullList({
        filter: `empresa_id = "${selectedEmpresaId}"`,
        sort: '-created',
        expand: 'projeto_id,bloqueada_por',
      })
      setTarefas(data)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    fetchTarefas()
  }, [selectedEmpresaId])
  useRealtime('tarefas', () => {
    fetchTarefas()
  })

  const handleConcluir = (task: any) => {
    const blocks = task.expand?.bloqueada_por || []
    const hasPendingBlocks = blocks.some(
      (b: any) => b.status !== 'concluida' && b.status !== 'encerrada',
    )

    if (hasPendingBlocks) {
      toast.error('Tarefa bloqueada por outras dependências pendentes.')
      return
    }

    setSelectedTask(task)
    setMotivo('')
    setObservacao('')
    setClosureModalOpen(true)
  }

  const confirmClosure = async () => {
    if (!motivo) return toast.error('Selecione um motivo')
    try {
      await pb.collection('tarefas').update(selectedTask.id, {
        status: 'concluida',
        motivo_encerramento: motivo,
        observacao_encerramento: observacao,
        data_conclusao_realizada: new Date().toISOString(),
      })
      setClosureModalOpen(false)
      toast.success('Tarefa concluída!')
      fetchTarefas()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao concluir')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'em_progresso':
        return (
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-500">
            <Clock className="w-3 h-3 mr-1" /> Em Progresso
          </Badge>
        )
      case 'concluida':
        return (
          <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-500">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Concluída
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="w-3 h-3 mr-1" /> {status}
          </Badge>
        )
    }
  }

  const getDelayIndicator = (task: any) => {
    if (task.status === 'concluida' || task.status === 'encerrada') return null
    if (!task.data_vencimento_planejada) return null

    const diffDays = Math.ceil(
      (new Date(task.data_vencimento_planejada).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    )

    if (diffDays < 0) return <Badge variant="destructive">Atrasada {-diffDays}d</Badge>
    if (diffDays <= 3)
      return (
        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Vence em {diffDays}d</Badge>
      )
    return <Badge className="bg-emerald-500 hover:bg-emerald-600">No prazo</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tarefas</h2>
          <p className="text-muted-foreground">Gerenciamento de atividades e dependências.</p>
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
              <TableHead>Projeto</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>SLA</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tarefas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  Nenhuma tarefa.
                </TableCell>
              </TableRow>
            ) : (
              tarefas.map((t) => {
                const isBlocked = t.expand?.bloqueada_por?.some(
                  (b: any) => b.status !== 'concluida' && b.status !== 'encerrada',
                )
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        {isBlocked && (
                          <Lock className="w-4 h-4 text-orange-500" title="Bloqueada" />
                        )}
                        <span>{t.titulo}</span>
                      </div>
                    </TableCell>
                    <TableCell>{t.expand?.projeto_id?.nome || '-'}</TableCell>
                    <TableCell>{getStatusBadge(t.status)}</TableCell>
                    <TableCell>{getDelayIndicator(t)}</TableCell>
                    <TableCell>
                      {t.status !== 'concluida' && t.status !== 'encerrada' && (
                        <Button variant="outline" size="sm" onClick={() => handleConcluir(t)}>
                          Concluir
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={closureModalOpen} onOpenChange={setClosureModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encerramento de Tarefa</DialogTitle>
            <DialogDescription>Informe o motivo do encerramento.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger>
                <SelectValue placeholder="Motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concluida">Concluída com Sucesso</SelectItem>
                <SelectItem value="falta_recurso">Falta de Recursos</SelectItem>
                <SelectItem value="decisao_lider">Decisão da Liderança</SelectItem>
                <SelectItem value="bloqueio_externo">Bloqueio Externo</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Observações..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClosureModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmClosure}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
