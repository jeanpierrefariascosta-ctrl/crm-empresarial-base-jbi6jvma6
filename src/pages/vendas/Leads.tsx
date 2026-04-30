import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { KanbanBoard } from '@/components/vendas/KanbanBoard'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, LayoutList, Kanban, Sparkles, Building2, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { LeadDetailsSheet } from '@/components/vendas/LeadDetailsSheet'
import { LeadEnrichmentModal } from '@/components/vendas/LeadEnrichmentModal'
import { CnpjSearchModal } from '@/components/vendas/CnpjSearchModal'
import { PromoteLeadModal } from '@/components/vendas/PromoteLeadModal'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function Leads() {
  const { selectedEmpresaId, user } = useAuth() as any
  const [leads, setLeads] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'kanban' | 'list'>('list')
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)

  const [enrichModalOpen, setEnrichModalOpen] = useState(false)
  const [enrichLeadId, setEnrichLeadId] = useState<string>('')

  const [cnpjModalOpen, setCnpjModalOpen] = useState(false)
  const [promoteLead, setPromoteLead] = useState<any>(null)
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null)

  const isSupervisor = ['supervisor', 'head', 'diretor', 'admin'].includes(user?.funcao || '')
  const canPromote = ['admin', 'head', 'supervisor', 'cdr'].includes(user?.funcao || '')

  const fetchLeads = async () => {
    if (!selectedEmpresaId) return
    try {
      const data = await pb.collection('leads').getFullList({
        filter: `empresa_id = "${selectedEmpresaId}"`,
        expand: 'cliente_id,responsavel_id',
        sort: '-created',
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
    let f = isSupervisor
      ? leads
      : leads.filter((l) => l.responsavel_id === user?.id || !l.etapa_kanban)
    if (search) {
      f = f.filter((l) =>
        l.expand?.cliente_id?.razao_social?.toLowerCase().includes(search.toLowerCase()),
      )
    }
    return f
  }, [leads, isSupervisor, user, search])

  const kanbanLeads = useMemo(() => filteredLeads.filter((l) => !!l.etapa_kanban), [filteredLeads])

  const handleOpenEnrich = (leadId: string = '') => {
    setEnrichLeadId(leadId)
    setEnrichModalOpen(true)
  }

  const handleDeleteLead = async () => {
    if (!leadToDelete) return
    try {
      await pb.collection('leads').delete(leadToDelete)
      toast.success('Lead excluído com sucesso.')
      setLeadToDelete(null)
      fetchLeads()
    } catch (e) {
      toast.error('Erro ao excluir lead')
    }
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pipeline de Vendas</h2>
          <p className="text-muted-foreground">Gerencie suas oportunidades de negócio.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setCnpjModalOpen(true)}>
            <Building2 className="w-4 h-4 mr-2" /> Buscar CNPJ
          </Button>
          <Button
            variant="default"
            className="bg-yellow-500 hover:bg-yellow-600 text-white"
            onClick={() => handleOpenEnrich()}
          >
            <Sparkles className="w-4 h-4 mr-2" /> Enriquecer Lead
          </Button>
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
            leads={kanbanLeads}
            onUpdate={fetchLeads}
            onLeadClick={setSelectedLeadId}
            onEnrich={handleOpenEnrich}
          />
        ) : (
          <div className="border rounded-md bg-card overflow-y-auto h-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhum lead encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell
                        className="font-medium cursor-pointer hover:underline"
                        onClick={() => setSelectedLeadId(lead.id)}
                      >
                        {lead.expand?.cliente_id?.razao_social || 'Sem empresa'}
                      </TableCell>
                      <TableCell>
                        {lead.etapa_kanban ? (
                          <Badge variant="default" className="bg-blue-500">
                            No Pipeline: {lead.etapa_kanban}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Apenas Capturado</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.expand?.responsavel_id?.name ||
                          lead.expand?.responsavel_id?.nome_completo ||
                          'Não atribuído'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!lead.etapa_kanban && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPromoteLead(lead)
                              }}
                              disabled={!canPromote}
                              title={
                                !canPromote ? 'Apenas gestores/vendas podem promover leads' : ''
                              }
                            >
                              Enviar para o Kanban
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              setLeadToDelete(lead.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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

      <LeadEnrichmentModal
        open={enrichModalOpen}
        onOpenChange={setEnrichModalOpen}
        initialLeadId={enrichLeadId}
        leads={filteredLeads}
        onUpdate={fetchLeads}
      />

      <CnpjSearchModal
        open={cnpjModalOpen}
        onOpenChange={setCnpjModalOpen}
        onUpdate={fetchLeads}
        onViewKanban={() => setView('kanban')}
      />

      <PromoteLeadModal
        lead={promoteLead}
        open={!!promoteLead}
        onOpenChange={(open: boolean) => !open && setPromoteLead(null)}
        onUpdate={fetchLeads}
        onViewKanban={() => setView('kanban')}
      />

      <AlertDialog open={!!leadToDelete} onOpenChange={(o) => !o && setLeadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteLead()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
