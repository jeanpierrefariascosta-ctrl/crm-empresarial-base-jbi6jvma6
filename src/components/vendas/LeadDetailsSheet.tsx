import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import pb from '@/lib/pocketbase/client'
import { ResumoTab } from './tabs/ResumoTab'
import { InteracoesTab } from './tabs/InteracoesTab'
import { ReunioesTab } from './tabs/ReunioesTab'

export function LeadDetailsSheet({ leadId, onClose, onUpdate }: any) {
  const [lead, setLead] = useState<any>(null)

  const loadLead = () => {
    if (!leadId) return
    pb.collection('leads')
      .getOne(leadId, { expand: 'cliente_id,responsavel_id' })
      .then(setLead)
      .catch(console.error)
  }

  useEffect(loadLead, [leadId])

  if (!lead) return null

  return (
    <Sheet open={true} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto bg-background/95 backdrop-blur-xl border-l-border/50">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold">
            {lead.expand?.cliente_id?.razao_social}
          </SheetTitle>
        </SheetHeader>
        <Tabs defaultValue="resumo" className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto bg-muted/50 p-1 mb-4">
            <TabsTrigger value="resumo" className="flex-1 text-xs">
              Resumo & Negociação
            </TabsTrigger>
            <TabsTrigger value="interacoes" className="flex-1 text-xs">
              Interações & IA
            </TabsTrigger>
            <TabsTrigger value="reunioes" className="flex-1 text-xs">
              Reuniões
            </TabsTrigger>
            <TabsTrigger value="propostas" className="flex-1 text-xs">
              Propostas
            </TabsTrigger>
          </TabsList>
          <TabsContent value="resumo" className="mt-0">
            <ResumoTab
              lead={lead}
              onUpdate={() => {
                onUpdate()
                loadLead()
              }}
            />
          </TabsContent>
          <TabsContent value="interacoes" className="mt-0">
            <InteracoesTab leadId={lead.id} empresaId={lead.empresa_id} />
          </TabsContent>
          <TabsContent value="reunioes" className="mt-0">
            <ReunioesTab leadId={lead.id} />
          </TabsContent>
          <TabsContent value="propostas" className="mt-0">
            <div className="p-8 text-center text-muted-foreground border rounded-md bg-muted/10 mt-4">
              Módulo de geração de propostas será liberado na próxima versão.
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
