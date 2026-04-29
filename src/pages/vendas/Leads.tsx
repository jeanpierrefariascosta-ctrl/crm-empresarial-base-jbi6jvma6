import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { KanbanBoard } from '@/components/vendas/KanbanBoard'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, LayoutList, Kanban } from 'lucide-react'
import { LeadDetailsSheet } from '@/components/vendas/LeadDetailsSheet'

export default function Leads() {
  const { selectedEmpresaId, user } = useAuth()
  const [leads, setLeads] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)

  const isSupervisor = ['supervisor', 'head', 'diretor', 'admin'].includes(user?.funcao || '')

  const fetchLeads = async () => {
    if (!selectedEmpresaId) return
    try {
      const data = await pb.collection('leads').getFullList({
        filter: `empresa_id = "${selectedEmpresaId}"`,
        expand: 'cliente_id,responsavel_id',
      })
      setLeads(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [selectedEmpresaId])
  useRealtime('leads', () => fetchLeads())

  const filteredLeads = useMemo(() => {
    let f = isSupervisor ? leads : leads.filter((l) => l.responsavel_id === user?.id)
    if (search) {
      f = f.filter((l) =>
        l.expand?.cliente_id?.razao_social?.toLowerCase().includes(search.toLowerCase()),
      )
    }
    return f
  }, [leads, isSupervisor, user, search])

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pipeline de Vendas</h2>
          <p className="text-muted-foreground">Gerencie suas oportunidades de negócio.</p>
        </div>
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-64 bg-background"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setView((v) => (v === 'kanban' ? 'list' : 'kanban'))}
          >
            {view === 'kanban' ? (
              <>
                <LayoutList className="w-4 h-4 mr-2" /> Ver Lista
              </>
            ) : (
              <>
                <Kanban className="w-4 h-4 mr-2" /> Ver Kanban
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {view === 'kanban' ? (
          <KanbanBoard
            leads={filteredLeads}
            onUpdate={fetchLeads}
            onLeadClick={setSelectedLeadId}
          />
        ) : (
          <div className="p-8 text-center border rounded-md bg-card text-muted-foreground">
            Visualização em lista em desenvolvimento.
          </div>
        )}
      </div>

      {selectedLeadId && (
        <LeadDetailsSheet
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
          onUpdate={fetchLeads}
        />
      )}
    </div>
  )
}
