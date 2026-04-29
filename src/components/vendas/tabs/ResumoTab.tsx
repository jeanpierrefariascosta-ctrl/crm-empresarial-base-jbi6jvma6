import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

export function ResumoTab({ lead, onUpdate }: any) {
  const [formData, setFormData] = useState({
    valor_previsto: lead.valor_previsto || '',
    probabilidade_fechamento: lead.probabilidade_fechamento || '',
    proximo_passo: lead.proximo_passo || '',
    objecoes: lead.objecoes || '',
    estrategia: lead.estrategia || '',
    data_fechamento_previsto: lead.data_fechamento_previsto
      ? format(new Date(lead.data_fechamento_previsto), 'yyyy-MM-dd')
      : '',
  })
  const { toast } = useToast()

  const save = async () => {
    try {
      const payload = {
        ...formData,
        data_fechamento_previsto: formData.data_fechamento_previsto
          ? new Date(formData.data_fechamento_previsto).toISOString()
          : null,
      }
      await pb.collection('leads').update(lead.id, payload)
      toast({ title: 'Detalhes salvos com sucesso' })
      onUpdate()
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro', description: e.message })
    }
  }

  const fechar = async () => {
    try {
      await pb
        .collection('leads')
        .update(lead.id, { valor_confirmado: formData.valor_previsto, etapa_kanban: 'fechado' })
      toast({ title: 'Parabéns!', description: 'Lead convertido em Cliente fechado com sucesso.' })
      onUpdate()
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro' })
    }
  }

  return (
    <div className="space-y-5 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valor Previsto (R$)</Label>
          <Input
            type="number"
            value={formData.valor_previsto}
            onChange={(e) => setFormData({ ...formData, valor_previsto: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Probabilidade (%)</Label>
          <Input
            type="number"
            max="100"
            value={formData.probabilidade_fechamento}
            onChange={(e) => setFormData({ ...formData, probabilidade_fechamento: e.target.value })}
          />
        </div>
        <div className="col-span-2 space-y-2">
          <Label>Data de Fechamento Prevista</Label>
          <Input
            type="date"
            value={formData.data_fechamento_previsto}
            onChange={(e) => setFormData({ ...formData, data_fechamento_previsto: e.target.value })}
          />
        </div>
        <div className="col-span-2 space-y-2 mt-2 pt-2 border-t">
          <Label className="text-primary font-semibold">Plano de Ação</Label>
        </div>
        <div className="col-span-2 space-y-2">
          <Label>Próximo Passo</Label>
          <Input
            placeholder="Qual a próxima ação a ser tomada?"
            value={formData.proximo_passo}
            onChange={(e) => setFormData({ ...formData, proximo_passo: e.target.value })}
          />
        </div>
        <div className="col-span-2 space-y-2">
          <Label>Principais Objeções</Label>
          <Textarea
            placeholder="Quais os obstáculos apontados pelo cliente?"
            value={formData.objecoes}
            onChange={(e) => setFormData({ ...formData, objecoes: e.target.value })}
            className="resize-none"
          />
        </div>
        <div className="col-span-2 space-y-2">
          <Label>Estratégia de Fechamento</Label>
          <Textarea
            placeholder="Como vamos converter este lead?"
            value={formData.estrategia}
            onChange={(e) => setFormData({ ...formData, estrategia: e.target.value })}
            className="resize-none"
          />
        </div>
      </div>
      <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
        <Button variant="outline" onClick={save}>
          Salvar Alterações
        </Button>
        {lead.etapa_kanban === 'fechamento' && (
          <Button
            onClick={fechar}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            Confirmar Fechamento
          </Button>
        )}
      </div>
    </div>
  )
}
