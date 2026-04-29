import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { Video } from 'lucide-react'

export default function Reunioes() {
  const { selectedEmpresaId } = useAuth()
  const [reunioes, setReunioes] = useState<any[]>([])

  useEffect(() => {
    if (!selectedEmpresaId) return
    pb.collection('reunioes')
      .getFullList({
        filter: `empresa_id="${selectedEmpresaId}"`,
        expand: 'lead_id.cliente_id',
        sort: '-data_hora',
      })
      .then(setReunioes)
      .catch(console.error)
  }, [selectedEmpresaId])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reuniões Agendadas</h2>
        <p className="text-muted-foreground">
          Gerencie sua agenda de demonstrações e alinhamentos.
        </p>
      </div>
      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data e Hora</TableHead>
              <TableHead>Assunto</TableHead>
              <TableHead>Empresa (Lead)</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reunioes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                  Nenhuma reunião agendada.
                </TableCell>
              </TableRow>
            ) : (
              reunioes.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {format(new Date(r.data_hora), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell>{r.titulo}</TableCell>
                  <TableCell>{r.expand?.lead_id?.expand?.cliente_id?.razao_social}</TableCell>
                  <TableCell className="text-right">
                    {r.meet_link && (
                      <a
                        href={r.meet_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3 text-blue-600 border-blue-200 hover:border-blue-300"
                      >
                        <Video className="w-3.5 h-3.5 mr-2" /> Acessar Sala
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
