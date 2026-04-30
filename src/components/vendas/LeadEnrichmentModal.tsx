import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Sparkles, UserPlus } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function LeadEnrichmentModal({
  open,
  onOpenChange,
  initialLeadId,
  leads = [],
  onUpdate,
}: any) {
  const { selectedEmpresaId, user } = useAuth() as any
  const [loading, setLoading] = useState(false)
  const [contacts, setContacts] = useState<any[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [selectedLeadId, setSelectedLeadId] = useState<string>(initialLeadId || '')

  useEffect(() => {
    if (initialLeadId) setSelectedLeadId(initialLeadId)
  }, [initialLeadId, open])

  useEffect(() => {
    if (!open) {
      setContacts([])
      setSelected(new Set())
      if (!initialLeadId) setSelectedLeadId('')
    }
  }, [open, initialLeadId])

  const handleEnrich = async () => {
    if (!selectedLeadId) {
      toast.error('Selecione um lead primeiro')
      return
    }
    setLoading(true)
    try {
      const res = await pb.send(`/backend/v1/enrich/lead/${selectedLeadId}`, { method: 'POST' })
      setContacts(res.contacts || [])
      setSelected(new Set((res.contacts || []).map((_: any, i: number) => i)))
      toast.success('Contatos encontrados!')
    } catch (e: any) {
      toast.error(e.response?.message || e.message || 'Erro ao enriquecer lead')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    const toAdd = contacts.filter((_, i) => selected.has(i))
    if (toAdd.length === 0) return

    const lead = leads.find((l: any) => l.id === selectedLeadId)
    if (!lead) return

    setLoading(true)
    try {
      for (const contact of toAdd) {
        await pb.collection('contatos').create({
          empresa_id: selectedEmpresaId,
          cliente_id: lead.cliente_id,
          lead_id: lead.id,
          nome: contact.nome,
          cargo: contact.cargo,
          linkedin_url: contact.linkedin_url,
          bio: contact.bio,
          foto_perfil: contact.foto_perfil,
          rede_social: contact.rede_social,
          origem_enriquecimento: true,
        })

        await pb.collection('tarefas').create({
          empresa_id: selectedEmpresaId,
          cliente_id: lead.cliente_id,
          titulo: `Fazer contato inicial com ${contact.nome}`,
          descricao: `Contato enriquecido via IA.\nCargo: ${contact.cargo}\nBio: ${contact.bio}\nPerfil: ${contact.linkedin_url || contact.instagram_url}`,
          status: 'aberta',
          prioridade: 'media',
          responsavel_id: lead.responsavel_id || user?.id,
        })
      }

      await pb.collection('leads').update(lead.id, { enriquecido: true })
      toast.success(`${toAdd.length} contatos adicionados! Vendedor notificado.`)
      if (onUpdate) onUpdate()
      onOpenChange(false)
    } catch (e: any) {
      toast.error('Erro ao salvar contatos')
    } finally {
      setLoading(false)
    }
  }

  const prospectLeads = leads.filter((l: any) => l.etapa_kanban === 'prospecção')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Enriquecer Lead com IA
          </DialogTitle>
          <DialogDescription>
            Busque contatos chave usando inteligência artificial no LinkedIn e Instagram.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {!initialLeadId && prospectLeads.length > 0 && contacts.length === 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Selecione o Lead em Prospecção</label>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um lead..." />
                </SelectTrigger>
                <SelectContent>
                  {prospectLeads.map((l: any) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.expand?.cliente_id?.razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/30">
              <Button onClick={handleEnrich} disabled={loading || !selectedLeadId} size="lg">
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {loading ? 'Buscando contatos...' : 'Iniciar Enriquecimento'}
              </Button>
              <p className="mt-4 text-sm text-muted-foreground max-w-sm">
                Nossa IA irá analisar o nome da empresa e buscar os principais executivos e
                tomadores de decisão nas redes sociais.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={selected.size === contacts.length && contacts.length > 0}
                          onCheckedChange={(c) => {
                            if (c) setSelected(new Set(contacts.map((_, i) => i)))
                            else setSelected(new Set())
                          }}
                        />
                      </TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Cargo / Bio</TableHead>
                      <TableHead className="text-right">Rede Social</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((contact, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Checkbox
                            checked={selected.has(i)}
                            onCheckedChange={(c) => {
                              const next = new Set(selected)
                              if (c) next.add(i)
                              else next.delete(i)
                              setSelected(next)
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={contact.foto_perfil} />
                              <AvatarFallback>{contact.nome.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{contact.nome}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{contact.cargo}</span>
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {contact.bio}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="link" size="sm" asChild>
                            <a
                              href={contact.linkedin_url || contact.instagram_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Ver Perfil
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setContacts([])}>
                  Cancelar
                </Button>
                <Button onClick={handleAdd} disabled={loading || selected.size === 0}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                  )}
                  Adicionar {selected.size} ao CRM
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
