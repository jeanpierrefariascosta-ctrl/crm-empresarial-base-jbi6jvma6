import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { FileText, Eye, CheckCircle2, XCircle, Send } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

export function PropostasTab({ leadId, empresaId, valorPrevisto }: any) {
  const [propostas, setPropostas] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState('template')
  const [valor, setValor] = useState(valorPrevisto || 0)
  const { toast } = useToast()

  const load = () =>
    pb
      .collection('propostas')
      .getFullList({ filter: `lead_id="${leadId}"`, sort: '-created' })
      .then(setPropostas)
  useEffect(load, [leadId])

  const gerar = async () => {
    try {
      await pb.collection('propostas').create({
        empresa_id: empresaId,
        lead_id: leadId,
        status: 'enviada',
        valor: Number(valor),
        visualizacoes: 0,
      })
      toast({ title: 'Proposta gerada e enviada!' })
      setOpen(false)
      load()
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro' })
    }
  }

  const getStatusIcon = (s: string) => {
    if (s === 'assinada') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    if (s === 'rejeitada') return <XCircle className="w-4 h-4 text-red-500" />
    if (s === 'visualizada') return <Eye className="w-4 h-4 text-blue-500" />
    return <Send className="w-4 h-4 text-muted-foreground" />
  }

  return (
    <div className="py-2 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" variant="outline">
            <FileText className="mr-2 w-4 h-4" /> Criar Nova Proposta
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerador de Propostas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Método de Criação</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="template">Usar Template Padrão</SelectItem>
                  <SelectItem value="ia">Gerar com IA (Baseado no Histórico)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor da Proposta (R$)</Label>
              <Input type="number" value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>
            <Button onClick={gerar} className="w-full">
              Gerar e Registrar Envio
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-3 pt-4">
        {propostas.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Nenhuma proposta enviada.
          </p>
        ) : (
          propostas.map((p) => (
            <div
              key={p.id}
              className="p-4 bg-card border rounded-lg text-sm flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-md">{getStatusIcon(p.status)}</div>
                <div>
                  <div className="font-semibold text-base mb-1">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      p.valor || 0,
                    )}
                  </div>
                  <Badge variant="secondary" className="uppercase text-[10px]">
                    {p.status}
                  </Badge>
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>
                  Visualizações:{' '}
                  <span className="font-medium text-foreground">{p.visualizacoes || 0}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
