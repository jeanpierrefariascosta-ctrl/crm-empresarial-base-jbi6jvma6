import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'

const STAGES = ['prospecção', 'qualificação', 'proposta', 'negociação', 'fechamento', 'fechado']

export function KanbanBoard({ leads, onUpdate, onLeadClick }: any) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const { toast } = useToast()

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
                  onClick={() => onLeadClick(lead.id)}
                  className="cursor-pointer hover:border-primary transition-colors border-border/60 bg-card/80 backdrop-blur-sm shadow-sm"
                >
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-[13px] leading-tight line-clamp-1">
                      {lead.expand?.cliente_id?.razao_social}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="flex justify-between items-center text-xs mt-1">
                      <span className="font-medium text-emerald-500">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          maximumFractionDigits: 0,
                        }).format(lead.valor_previsto || 0)}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 rounded-sm bg-background"
                      >
                        {lead.probabilidade_fechamento}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-[10px] text-muted-foreground truncate max-w-[120px] uppercase font-medium">
                        {lead.fonte_lead || 'Manual'}
                      </span>
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
