import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { KanbanBoard } from '@/components/vendas/KanbanBoard'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

export default function Leads() {
  const { selectedEmpresaId, user } = useAuth()
  const [leads, setLeads] = useState<any[]>([])
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [cnpj, setCnpj] = useState('')
  const [importing, setImporting] = useState(false)
  const { toast } = useToast()

  const [distributeOpen, setDistributeOpen] = useState(false)
  const [usersList, setUsersList] = useState<any[]>([])

  const isSupervisor = ['supervisor', 'head', 'diretor', 'admin'].includes(user?.funcao || '')

  const fetchLeads = async () => {
    if (!selectedEmpresaId) return
    try {
      const data = await pb.collection('leads').getFullList({
        filter: `empresa_id = "${selectedEmpresaId}"`,
        expand: 'cliente_id,responsavel_id,campanha_id',
      })
      setLeads(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [selectedEmpresaId])

  useEffect(() => {
    if (isSupervisor) {
      pb.collection('users')
        .getFullList({ filter: `empresa_id="${selectedEmpresaId}"` })
        .then(setUsersList)
        .catch(console.error)
    }
  }, [isSupervisor, selectedEmpresaId])

  useRealtime('leads', () => fetchLeads())

  const handleImportCnpj = async (e: React.FormEvent) => {
    e.preventDefault()
    setImporting(true)
    try {
      await pb.send('/backend/v1/import/cnpj', {
        method: 'POST',
        body: JSON.stringify({ cnpj }),
      })
      toast({ title: 'Lead importado com sucesso!', description: 'Contatos foram criados.' })
      setIsImportOpen(false)
      fetchLeads()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: err.message || 'CNPJ não encontrado',
      })
    } finally {
      setImporting(false)
    }
  }

  const unassignedLeads = leads.filter((l) => !l.responsavel_id)

  const filteredLeads = useMemo(() => {
    if (isSupervisor) return leads
    return leads.filter((l) => l.responsavel_id === user?.id)
  }, [leads, isSupervisor, user])

  const handleAssign = async (leadId: string, userId: string) => {
    try {
      await pb.collection('leads').update(leadId, { responsavel_id: userId })
      toast({ title: 'Lead atribuído' })
      fetchLeads()
    } catch {
      /* intentionally ignored */
    }
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Leads</h2>
          <p className="text-muted-foreground">Gerencie o pipeline de vendas da sua empresa.</p>
        </div>
        <div className="flex space-x-2">
          {isSupervisor && unassignedLeads.length > 0 && (
            <Dialog open={distributeOpen} onOpenChange={setDistributeOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary">Distribuir {unassignedLeads.length} Leads</Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Distribuir Leads sem Responsável</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {unassignedLeads.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div>
                        <div className="font-semibold text-sm">
                          {l.expand?.cliente_id?.razao_social}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Fonte: {l.fonte_lead || 'Manual'}
                        </div>
                      </div>
                      <select
                        className="text-sm border rounded-md p-1 bg-background"
                        onChange={(e) => handleAssign(l.id, e.target.value)}
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Atribuir a...
                        </option>
                        {usersList.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.nome_completo}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button>
                <Search className="mr-2 h-4 w-4" /> Receita Federal (CNPJ)
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importar Empresa via CNPJ</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleImportCnpj} className="space-y-4">
                <div className="space-y-2">
                  <Label>Digite o CNPJ</Label>
                  <Input
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={importing}>
                  {importing ? 'Buscando...' : 'Adicionar ao CRM'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1">
        <KanbanBoard leads={filteredLeads} onUpdate={fetchLeads} />
      </div>
    </div>
  )
}
