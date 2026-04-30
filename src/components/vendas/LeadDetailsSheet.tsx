import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Bot, Mail, Phone, Calendar, StickyNote, Activity, RefreshCcw } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'

export function LeadDetailsSheet({ leadId, onClose, onUpdate }: any) {
  const { user, selectedEmpresaId } = useAuth() as any
  const [lead, setLead] = useState<any>(null)
  const [interacoes, setInteracoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')
  const [motivoPerda, setMotivoPerda] = useState('')
  const [isChangingStage, setIsChangingStage] = useState(false)
  const [newStage, setNewStage] = useState('')

  const fetchLead = async () => {
    try {
      const data = await pb.collection('leads').getOne(leadId, {
        expand: 'cliente_id,responsavel_id',
      })
      setLead(data)
    } catch (e) {
      toast.error('Erro ao carregar lead')
    } finally {
      setLoading(false)
    }
  }

  const fetchInteracoes = async () => {
    try {
      const data = await pb.collection('interacoes').getFullList({
        filter: `lead_id = "${leadId}"`,
        sort: '-created',
        expand: 'autor_id',
      })
      setInteracoes(data)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    if (leadId) {
      fetchLead()
      fetchInteracoes()
    }
  }, [leadId])

  useRealtime('interacoes', () => fetchInteracoes())
  useRealtime('leads', (e) => {
    if (e.record.id === leadId) fetchLead()
  })

  const handleSaveNote = async () => {
    if (!note.trim()) return
    try {
      await pb.collection('interacoes').create({
        empresa_id: selectedEmpresaId,
        lead_id: leadId,
        tipo: 'nota',
        conteudo: note,
        autor_id: user?.id,
      })
      setNote('')
      toast.success('Nota salva')
    } catch (e) {
      toast.error('Erro ao salvar nota')
    }
  }

  const handleStageChange = async () => {
    if (newStage === 'perdido' && !motivoPerda.trim()) {
      toast.error('Informe o motivo da perda')
      return
    }

    try {
      await pb.collection('leads').update(leadId, {
        etapa_kanban: newStage,
        motivo_perda: newStage === 'perdido' ? motivoPerda : '',
      })
      toast.success('Fase atualizada')
      setIsChangingStage(false)
      if (onUpdate) onUpdate()
    } catch (e) {
      toast.error('Erro ao atualizar fase')
    }
  }

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'email':
        return <Mail className="w-4 h-4 text-blue-500" />
      case 'ligacao':
        return <Phone className="w-4 h-4 text-green-500" />
      case 'reuniao':
        return <Calendar className="w-4 h-4 text-purple-500" />
      case 'sistema':
        return <RefreshCcw className="w-4 h-4 text-gray-500" />
      default:
        return <StickyNote className="w-4 h-4 text-orange-500" />
    }
  }

  if (loading || !lead) return null

  return (
    <Sheet open={!!leadId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-xl w-full overflow-hidden flex flex-col p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="text-xl flex items-center justify-between">
            {lead.expand?.cliente_id?.razao_social}
            <Badge
              variant={
                lead.etapa_kanban === 'perdido'
                  ? 'destructive'
                  : lead.etapa_kanban === 'fechado'
                    ? 'default'
                    : 'secondary'
              }
              className={lead.etapa_kanban === 'fechado' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {lead.etapa_kanban || 'Capturado'}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            Responsável: {lead.expand?.responsavel_id?.name || 'Nenhum'} | Valor Previsto: R${' '}
            {lead.valor_previsto || 0}
          </SheetDescription>

          {!isChangingStage ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsChangingStage(true)}
              className="w-fit mt-2"
            >
              Mudar Fase
            </Button>
          ) : (
            <div className="mt-4 p-4 border rounded-md bg-muted/50 space-y-3">
              <h4 className="text-sm font-medium">Alterar Fase do Kanban</h4>
              <Select value={newStage} onValueChange={setNewStage}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a fase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospecção">Prospecção</SelectItem>
                  <SelectItem value="qualificação">Qualificação</SelectItem>
                  <SelectItem value="proposta">Proposta</SelectItem>
                  <SelectItem value="negociação">Negociação</SelectItem>
                  <SelectItem value="fechamento">Fechamento</SelectItem>
                  <SelectItem value="fechado">Fechado (Ganho)</SelectItem>
                  <SelectItem value="perdido">Perdido</SelectItem>
                </SelectContent>
              </Select>

              {newStage === 'perdido' && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-sm font-medium">Motivo da Perda</label>
                  <Textarea
                    placeholder="Por que perdemos este lead?"
                    value={motivoPerda}
                    onChange={(e) => setMotivoPerda(e.target.value)}
                  />
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setIsChangingStage(false)}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleStageChange}>
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          {lead.estrategia && (
            <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2 text-blue-700 dark:text-blue-400 font-semibold">
                <Bot className="w-5 h-5" />
                Estratégia Recomendada (IA)
              </div>
              <p className="text-sm leading-relaxed mb-3">{lead.estrategia}</p>

              <div className="font-medium text-sm text-blue-800 dark:text-blue-300">
                Próximo Passo:
              </div>
              <p className="text-sm">{lead.proximo_passo}</p>
            </div>
          )}

          {lead.motivo_perda && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="font-medium text-red-800 dark:text-red-400 mb-1">Motivo da Perda</div>
              <p className="text-sm">{lead.motivo_perda}</p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4" /> Timeline de Interações
            </h3>

            <div className="flex gap-2">
              <Textarea
                placeholder="Adicionar nota..."
                className="min-h-[80px]"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSaveNote} disabled={!note.trim()}>
                Salvar Nota
              </Button>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent mt-8">
              {interacoes.length === 0 ? (
                <div className="text-sm text-muted-foreground pl-4">
                  Nenhuma interação registrada.
                </div>
              ) : (
                interacoes.map((int) => (
                  <div key={int.id} className="relative pl-4 sm:pl-6">
                    <div className="absolute left-[-26px] top-1 flex items-center justify-center w-6 h-6 bg-background border rounded-full">
                      {getIcon(int.tipo)}
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 border">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-medium">
                          {int.expand?.autor_id?.name ||
                            int.expand?.autor_id?.nome_completo ||
                            'Sistema'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(int.created).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                        {int.conteudo}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
