import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import pb from '@/lib/pocketbase/client'

interface Lead {
  id: string
  etapa_kanban: string
  valor_previsto: number
  probabilidade_fechamento: number
  expand?: { cliente_id?: { razao_social: string } }
}

const STAGES = ['prospecção', 'qualificação', 'proposta', 'negociação', 'fechamento']

export function KanbanBoard({ leads, onUpdate }: { leads: Lead[]; onUpdate: () => void }) {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)

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

  return (
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
