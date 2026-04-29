import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { format } from 'date-fns'
import { FileText, Phone, Calendar, MessageSquare, Bot } from 'lucide-react'

export function InteracoesTab({ leadId, empresaId }: any) {
  const { user } = useAuth()
  const [interacoes, setInteracoes] = useState<any[]>([])
  const [nova, setNova] = useState('')

  const load = () => {
    pb.collection('interacoes')
      .getFullList({ filter: `lead_id="${leadId}"`, sort: '-created', expand: 'autor_id' })
      .then(setInteracoes)
  }
  useEffect(load, [leadId])

  const add = async () => {
    if (!nova.trim()) return
    await pb.collection('interacoes').create({
      empresa_id: empresaId,
      lead_id: leadId,
      tipo: 'nota',
      conteudo: nova,
      autor_id: user?.id,
    })
    setNova('')
    load()
  }

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'ligacao':
        return <Phone className="w-4 h-4 text-blue-500" />
      case 'reuniao':
        return <Calendar className="w-4 h-4 text-emerald-500" />
      case 'email':
        return <MessageSquare className="w-4 h-4 text-orange-500" />
      case 'sistema':
        return <Bot className="w-4 h-4 text-primary" />
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />
    }
  }

  return (
    <div className="py-2 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex gap-2">
        <Textarea
          value={nova}
          onChange={(e) => setNova(e.target.value)}
          placeholder="Registre uma nova anotação ou resumo..."
          className="resize-none min-h-[80px]"
        />
        <Button onClick={add} className="h-auto">
          Salvar Nota
        </Button>
      </div>
      <div className="space-y-4">
        {interacoes.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Nenhuma interação registrada.
          </p>
        ) : (
          interacoes.map((i) => (
            <div
              key={i.id}
              className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-[-20px] before:w-px before:bg-border last:before:hidden"
            >
              <div className="absolute left-0 top-1 bg-background border p-1 rounded-full">
                {getIcon(i.tipo)}
              </div>
              <div className="p-3 bg-card/50 rounded-md border text-sm">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span className="font-medium">
                    {i.expand?.autor_id?.nome_completo || 'Sistema'}
                  </span>
                  <span>{format(new Date(i.created), 'dd/MM/yyyy HH:mm')}</span>
                </div>
                <p className="text-foreground/90 whitespace-pre-wrap">{i.conteudo}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
