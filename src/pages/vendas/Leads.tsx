import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { KanbanBoard } from '@/components/vendas/KanbanBoard'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function Leads() {
  const { selectedEmpresaId } = useAuth()
  const [leads, setLeads] = useState<any[]>([])

  const fetchLeads = async () => {
    if (!selectedEmpresaId) return
    try {
      const data = await pb.collection('leads').getFullList({
        filter: `empresa_id = "${selectedEmpresaId}"`,
        expand: 'cliente_id',
      })
      setLeads(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [selectedEmpresaId])

  useRealtime('leads', () => {
    fetchLeads()
  })

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Leads</h2>
          <p className="text-muted-foreground">Gerencie o pipeline de vendas da sua empresa.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Novo Lead
        </Button>
      </div>

      <div className="flex-1">
        <KanbanBoard leads={leads} onUpdate={fetchLeads} />
      </div>
    </div>
  )
}
