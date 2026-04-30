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
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [bulkReassignOpen, setBulkReassignOpen] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [newResponsavelId, setNewResponsavelId] = useState('')

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
    const fetchUsers = async () => {
      try {
        const u = await pb
          .collection('users')
          .getFullList({ filter: `empresa_id = "${selectedEmpresaId}"` })
        setUsers(u)
      } catch {
        /* intentionally ignored */
      }
    }
    if (selectedEmpresaId) fetchUsers()
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
      setSelectedLeads((prev) => {
        const next = new Set(prev)
        next.delete(leadToDelete)
        return next
      })
      fetchLeads()
    } catch (e) {
      toast.error('Erro ao excluir lead')
    }
  }

  const toggleLeadSelection = (id: string) => {
    setSelectedLeads((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllLeads = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set())
    } else {
      setSelectedLeads(new Set(filteredLeads.map((l) => l.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedLeads.size === 0) return
    if (!confirm(`Tem certeza que deseja excluir ${selectedLeads.size} leads?`)) return
    try {
      await Promise.all(Array.from(selectedLeads).map((id) => pb.collection('leads').delete(id)))
      toast.success(`${selectedLeads.size} leads excluídos com sucesso.`)
      setSelectedLeads(new Set())
      fetchLeads()
    } catch (e) {
      toast.error('Erro ao excluir leads')
    }
  }

  const handleBulkReassign = async () => {
    if (!newResponsavelId || selectedLeads.size === 0) return
    try {
      await Promise.all(
        Array.from(selectedLeads).map((id) =>
          pb.collection('leads').update(id, { responsavel_id: newResponsavelId }),
        ),
      )
      toast.success(`${selectedLeads.size} leads transferidos com sucesso.`)
      setBulkReassignOpen(false)
      setSelectedLeads(new Set())
      fetchLeads()
    } catch (e) {
      toast.error('Erro ao transferir leads')
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
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={
                        selectedLeads.size > 0 && selectedLeads.size === filteredLeads.length
                      }
                      ref={(input) => {
                        if (input)
                          input.indeterminate =
                            selectedLeads.size > 0 && selectedLeads.size < filteredLeads.length
                      }}
                      onChange={toggleAllLeads}
                    />
                  </TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum lead encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className={selectedLeads.has(lead.id) ? 'bg-muted/50' : ''}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={selectedLeads.has(lead.id)}
                          onChange={() => toggleLeadSelection(lead.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
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

      {selectedLeads.size > 0 && view === 'list' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-popover border shadow-lg rounded-full px-6 py-3 flex items-center gap-4 animate-slide-up z-50">
          <span className="text-sm font-medium">{selectedLeads.size} leads selecionados</span>
          <div className="flex items-center gap-2 border-l pl-4">
            <Button variant="outline" size="sm" onClick={() => setBulkReassignOpen(true)}>
              Transferir
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              Excluir
            </Button>
          </div>
        </div>
      )}

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

      <Dialog open={bulkReassignOpen} onOpenChange={setBulkReassignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir Leads</DialogTitle>
            <DialogDescription>
              Selecione o novo responsável para os {selectedLeads.size} leads selecionados.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <select
              className="w-full flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={newResponsavelId}
              onChange={(e) => setNewResponsavelId(e.target.value)}
            >
              <option value="">Selecione um usuário...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.nome_completo}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkReassignOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBulkReassign} disabled={!newResponsavelId}>
              Transferir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
