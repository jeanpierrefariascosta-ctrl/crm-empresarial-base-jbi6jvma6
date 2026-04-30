import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { Sparkles, Eye, Users } from 'lucide-react'

const STAGES = ['prospecção', 'qualificação', 'proposta', 'negociação', 'fechamento', 'fechado']

export function KanbanBoard({ leads, onUpdate, onLeadClick, onEnrich }: any) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [contactsCount, setContactsCount] = useState<Record<string, number>>({})
  const { toast } = useToast()

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await pb.collection('contatos').getList(1, 500, {
          fields: 'lead_id',
        })
        const counts: Record<string, number> = {}
        res.items.forEach((c) => {
          if (c.lead_id) counts[c.lead_id] = (counts[c.lead_id] || 0) + 1
        })
        setContactsCount(counts)
      } catch (e) {
        // ignore
      }
    }
    fetchContacts()
  }, [leads])

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('leadId') || draggedId
    setDraggedId(null)
    if (!id) return

    try {
      await pb.collection('leads').update(id, { etapa_kanban: newStage })
      onUpdate()
      if (newStage === 'fechamento') {
        toast({
          title: 'Atenção',
          description: 'Confirme o fechamento nos detalhes da oportunidade.',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Permissão negada ou erro na rede.',
      })
    }
  }

  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-4">
      {STAGES.map((stage) => {
        const stageLeads = leads.filter((l: any) => l.etapa_kanban === stage)
        const total = stageLeads.reduce((sum: number, l: any) => sum + (l.valor_previsto || 0), 0)

        return (
          <div
            key={stage}
            className="flex w-[320px] flex-shrink-0 flex-col rounded-lg bg-muted/40 border border-border/50"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, stage)}
          >
            <div className="p-3 border-b flex justify-between items-center bg-background/50 rounded-t-lg">
              <h3 className="font-semibold uppercase text-xs tracking-wider text-foreground">
                {stage}
              </h3>
              <Badge variant="secondary" className="px-2">
                {stageLeads.length}
              </Badge>
            </div>
            <div className="px-3 py-2 text-xs text-muted-foreground flex justify-between bg-muted/20 border-b">
              <span>Valor Total:</span>
              <span className="font-medium text-foreground">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  total,
                )}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-3">
              {stageLeads.map((lead: any) => (
                <Card
                  key={lead.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggedId(lead.id)
                    e.dataTransfer.setData('leadId', lead.id)
                  }}
                  className="cursor-pointer hover:border-primary transition-colors border-border/60 bg-card/80 backdrop-blur-sm shadow-sm group"
                >
                  <CardHeader className="p-3 pb-1 flex flex-row items-start justify-between space-y-0">
                    <CardTitle
                      className="text-[13px] leading-tight line-clamp-1 flex-1 pr-2"
                      onClick={() => onLeadClick(lead.id)}
                    >
                      {lead.expand?.cliente_id?.razao_social}
                    </CardTitle>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {stage === 'prospecção' && !lead.enriquecido && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-yellow-500"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEnrich(lead.id)
                          }}
                        >
                          <Sparkles className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => {
                          e.stopPropagation()
                          onLeadClick(lead.id)
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0" onClick={() => onLeadClick(lead.id)}>
                    <div className="flex justify-between items-center text-xs mt-1">
                      <span className="font-medium text-emerald-500">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          maximumFractionDigits: 0,
                        }).format(lead.valor_previsto || 0)}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 rounded-sm bg-background flex items-center gap-1"
                        >
                          <Users className="w-3 h-3" />
                          {contactsCount[lead.id] || 0}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-muted-foreground truncate max-w-[120px] uppercase font-medium">
                          {lead.fonte_lead || 'Manual'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {lead.created ? format(new Date(lead.created), 'dd/MM/yyyy') : ''}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 font-normal bg-primary/10 text-primary"
                        >
                          {lead.probabilidade_fechamento}% Chance
                        </Badge>
                        <Avatar className="w-5 h-5 ring-1 ring-border">
                          <AvatarImage
                            src={
                              lead.expand?.responsavel_id?.avatar
                                ? pb.files.getUrl(
                                    lead.expand.responsavel_id,
                                    lead.expand.responsavel_id.avatar,
                                  )
                                : ''
                            }
                          />
                          <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                            {lead.expand?.responsavel_id?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
