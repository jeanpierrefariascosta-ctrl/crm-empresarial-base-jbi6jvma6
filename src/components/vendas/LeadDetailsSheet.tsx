import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

export function LeadDetailsSheet({ leadId, onClose, onUpdate }: any) {
  const [lead, setLead] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchLead = async () => {
    setLoading(true)
    try {
      const data = await pb.collection('leads').getOne(leadId, { expand: 'cliente_id' })
      setLead(data)
    } catch (e) {
      toast.error('Erro ao carregar lead')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (leadId) fetchLead()
  }, [leadId])

  const handleSave = async () => {
    setSaving(true)
    try {
      await pb.collection('leads').update(leadId, {
        valor_previsto: lead.valor_previsto,
        probabilidade_fechamento: lead.probabilidade_fechamento,
        etapa_kanban: lead.etapa_kanban,
      })
      toast.success('Lead atualizado!')
      onUpdate()
      onClose()
    } catch (e) {
      toast.error('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (!lead) return null

  return (
    <Sheet open={!!leadId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Detalhes do Lead</SheetTitle>
          <SheetDescription>{lead.expand?.cliente_id?.razao_social}</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Etapa</label>
              <Select
                value={lead.etapa_kanban}
                onValueChange={(v) => setLead({ ...lead, etapa_kanban: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospecção">Prospecção</SelectItem>
                  <SelectItem value="qualificação">Qualificação</SelectItem>
                  <SelectItem value="proposta">Proposta</SelectItem>
                  <SelectItem value="negociação">Negociação</SelectItem>
                  <SelectItem value="fechamento">Fechamento</SelectItem>
                  <SelectItem value="fechado">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor Previsto</label>
              <Input
                type="number"
                value={lead.valor_previsto || ''}
                onChange={(e) => setLead({ ...lead, valor_previsto: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Probabilidade (%)</label>
              <Input
                type="number"
                value={lead.probabilidade_fechamento || ''}
                onChange={(e) =>
                  setLead({ ...lead, probabilidade_fechamento: Number(e.target.value) })
                }
              />
            </div>

            <div className="pt-4">
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
