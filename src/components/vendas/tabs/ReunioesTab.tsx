import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Video, CalendarDays } from 'lucide-react'

export function ReunioesTab({ leadId }: any) {
  const [reunioes, setReunioes] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [dataHora, setDataHora] = useState('')
  const { toast } = useToast()

  const load = () =>
    pb
      .collection('reunioes')
      .getFullList({ filter: `lead_id="${leadId}"`, sort: '-data_hora' })
      .then(setReunioes)
  useEffect(load, [leadId])

  const agendar = async () => {
    if (!titulo || !dataHora)
      return toast({ variant: 'destructive', title: 'Preencha os campos obrigatórios.' })
    try {
      await pb.send('/backend/v1/sales/meetings', {
        method: 'POST',
        body: JSON.stringify({
          lead_id: leadId,
          titulo,
          data_hora: new Date(dataHora).toISOString(),
        }),
      })
      toast({ title: 'Reunião agendada via Google Meet!' })
      setOpen(false)
      setTitulo('')
      setDataHora('')
      load()
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro', description: e.message })
    }
  }

  return (
    <div className="py-2 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" variant="outline">
            <CalendarDays className="mr-2 w-4 h-4" /> Agendar Nova Reunião
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendamento (Google Meet Integrado)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Assunto da reunião"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
            <Input
              type="datetime-local"
              value={dataHora}
              onChange={(e) => setDataHora(e.target.value)}
            />
            <Button onClick={agendar} className="w-full">
              Confirmar & Gerar Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-3 pt-4">
        {reunioes.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Nenhuma reunião encontrada.
          </p>
        ) : (
          reunioes.map((r) => (
            <div
              key={r.id}
              className="p-4 bg-muted/20 border rounded-lg text-sm flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center"
            >
              <div>
                <div className="font-semibold text-base mb-1">{r.titulo}</div>
                <div className="text-xs text-muted-foreground flex items-center">
                  <CalendarDays className="w-3 h-3 mr-1" />{' '}
                  {format(new Date(r.data_hora), "dd 'de' MMM, yyyy 'às' HH:mm")}
                </div>
              </div>
              {r.meet_link && (
                <Button
                  asChild
                  size="sm"
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <a href={r.meet_link} target="_blank" rel="noreferrer">
                    <Video className="w-4 h-4 mr-2" /> Entrar no Meet
                  </a>
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
