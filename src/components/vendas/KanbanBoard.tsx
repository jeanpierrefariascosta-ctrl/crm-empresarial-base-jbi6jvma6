import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bot, UserPlus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'

interface Lead {
  id: string
  etapa_kanban: string
  valor_previsto: number
  probabilidade_fechamento: number
  expand?: { cliente_id?: { razao_social: string; id: string } }
  enriquecido?: boolean
  responsavel_id?: string
}

const STAGES = ['prospecção', 'qualificação', 'proposta', 'negociação', 'fechamento']

export function KanbanBoard({ leads, onUpdate }: { leads: Lead[]; onUpdate: () => void }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)
  const [enrichingLead, setEnrichingLead] = useState<Lead | null>(null)
  const [aiContacts, setAiContacts] = useState<any[]>([])
  const [selectedContacts, setSelectedContacts] = useState<number[]>([])
  const [isLoadingAi, setIsLoadingAi] = useState(false)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLeadId(id)
    e.dataTransfer.setData('leadId', id)
    // Needed for Firefox
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData('leadId') || draggedLeadId
    setDraggedLeadId(null)
    if (!leadId) return

    const lead = leads.find((l) => l.id === leadId)
    if (lead && lead.etapa_kanban !== newStage) {
      try {
        await pb.collection('leads').update(leadId, { etapa_kanban: newStage })
        onUpdate()
      } catch (error) {
        console.error('Failed to update lead stage', error)
      }
    }
  }

  const handleEnrich = async (lead: Lead) => {
    setEnrichingLead(lead)
    setIsLoadingAi(true)
    setAiContacts([])
    setSelectedContacts([])
    try {
      const res = await pb.send(`/backend/v1/enrich/lead/${lead.id}`, { method: 'POST' })
      setAiContacts(res.contacts || [])
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro na IA', description: err.message })
      setEnrichingLead(null)
    } finally {
      setIsLoadingAi(false)
    }
  }

  const handleSaveContacts = async () => {
    if (!enrichingLead) return
    setIsLoadingAi(true)
    try {
      const contactsToSave = selectedContacts.map((i) => aiContacts[i])
      for (const c of contactsToSave) {
        await pb.collection('contatos').create({
          empresa_id: user?.empresa_id,
          cliente_id: enrichingLead.expand?.cliente_id?.id,
          lead_id: enrichingLead.id,
          nome: c.nome,
          cargo: c.cargo,
          linkedin_url: c.linkedin_url,
        })
        await pb.collection('tarefas').create({
          empresa_id: user?.empresa_id,
          titulo: `Contato Inicial com ${c.nome} (${c.cargo})`,
          descricao: `Lead Enriquecido. URL: ${c.linkedin_url || ''}`,
          status: 'aberta',
          responsavel_id: enrichingLead.responsavel_id || user?.id,
          cliente_id: enrichingLead.expand?.cliente_id?.id,
        })
      }
      await pb.collection('leads').update(enrichingLead.id, { enriquecido: true })
      toast({ title: 'Contatos e tarefas criadas com sucesso!' })
      setEnrichingLead(null)
      onUpdate()
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro', description: e.message })
    } finally {
      setIsLoadingAi(false)
    }
  }

  return (
    <>
      <Dialog open={!!enrichingLead} onOpenChange={(o) => !o && setEnrichingLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enriquecimento com IA</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isLoadingAi && aiContacts.length === 0 ? (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Bot className="animate-bounce w-5 h-5" /> <span>Buscando contatos na web...</span>
              </div>
            ) : (
              <>
                <p className="text-sm">
                  Foram encontrados os seguintes contatos potenciais. Selecione os que deseja
                  adicionar ao CRM:
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {aiContacts.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center space-x-3 p-3 border rounded-md bg-muted/30"
                    >
                      <Checkbox
                        checked={selectedContacts.includes(i)}
                        onCheckedChange={(ch) => {
                          if (ch) setSelectedContacts([...selectedContacts, i])
                          else setSelectedContacts(selectedContacts.filter((x) => x !== i))
                        }}
                      />
                      <div>
                        <div className="font-medium text-sm">{c.nome}</div>
                        <div className="text-xs text-muted-foreground">{c.cargo}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full mt-4"
                  disabled={selectedContacts.length === 0 || isLoadingAi}
                  onClick={handleSaveContacts}
                >
                  <UserPlus className="w-4 h-4 mr-2" /> Adicionar Selecionados (
                  {selectedContacts.length})
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex h-[calc(100vh-12rem)] gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const stageLeads = leads.filter((l) => l.etapa_kanban === stage)
          const totalStage = stageLeads.reduce((acc, l) => acc + (l.valor_previsto || 0), 0)

          return (
            <div
              key={stage}
              className="flex w-80 flex-shrink-0 flex-col rounded-lg bg-muted/40 border border-border/50"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
            >
              <div className="flex items-center justify-between p-4 border-b border-border/40 bg-background/50 rounded-t-lg">
                <h3 className="font-semibold uppercase tracking-wider text-sm">{stage}</h3>
                <Badge variant="secondary">{stageLeads.length}</Badge>
              </div>
              <div className="p-3 text-xs text-muted-foreground flex justify-between">
                <span>Valor Total:</span>
                <span className="font-medium text-foreground">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    totalStage,
                  )}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-3">
                {stageLeads.map((lead) => (
                  <Card
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="p-3 pb-1">
                      <CardTitle className="text-sm line-clamp-1">
                        {lead.expand?.cliente_id?.razao_social || 'Desconhecido'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="flex justify-between items-center mt-2 text-xs">
                        <span className="font-medium text-emerald-500">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            maximumFractionDigits: 0,
                          }).format(lead.valor_previsto || 0)}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {lead.probabilidade_fechamento}%
                        </Badge>
                      </div>
                      {stage === 'prospecção' && !lead.enriquecido && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2 h-7 text-xs text-primary"
                          onClick={() => handleEnrich(lead)}
                        >
                          <Bot className="w-3 h-3 mr-1" /> Enriquecer IA
                        </Button>
                      )}
                      {lead.enriquecido && (
                        <div className="mt-2 text-[10px] text-center text-muted-foreground flex items-center justify-center">
                          <Bot className="w-3 h-3 mr-1 text-emerald-500" /> Enriquecido
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
