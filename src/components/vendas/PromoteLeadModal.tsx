import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'

export function PromoteLeadModal({ lead, open, onOpenChange, onUpdate, onViewKanban }: any) {
  const [etapa, setEtapa] = useState('prospecção')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth() as any

  const handlePromote = async () => {
    if (!lead) return
    setLoading(true)
    try {
      await pb.collection('leads').update(lead.id, {
        etapa_kanban: etapa,
        responsavel_id: lead.responsavel_id || user?.id,
      })
      toast.success(
        `Lead ${lead.expand?.cliente_id?.razao_social || ''} adicionado à coluna ${etapa} com sucesso!`,
        {
          action: {
            label: 'Ver no Kanban',
            onClick: () => {
              if (onViewKanban) onViewKanban()
            },
          },
        },
      )
      if (onUpdate) onUpdate()
      onOpenChange(false)
    } catch (e) {
      toast.error('Erro ao promover lead')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar para o Kanban</DialogTitle>
          <DialogDescription>
            Selecione a etapa inicial para inserir este lead capturado no pipeline de vendas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Etapa Inicial</label>
            <Select value={etapa} onValueChange={setEtapa}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prospecção">Prospecção</SelectItem>
                <SelectItem value="qualificação">Qualificação</SelectItem>
                <SelectItem value="proposta">Proposta</SelectItem>
                <SelectItem value="negociação">Negociação</SelectItem>
                <SelectItem value="fechamento">Fechamento</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handlePromote} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
