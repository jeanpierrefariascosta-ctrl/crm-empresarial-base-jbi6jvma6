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
import { Badge } from '@/components/ui/badge'
import { FileText, Eye } from 'lucide-react'

export default function Propostas() {
  const { selectedEmpresaId } = useAuth()
  const [propostas, setPropostas] = useState<any[]>([])

  useEffect(() => {
    if (!selectedEmpresaId) return
    pb.collection('propostas')
      .getFullList({
        filter: `empresa_id="${selectedEmpresaId}"`,
        expand: 'lead_id.cliente_id',
        sort: '-created',
      })
      .then(setPropostas)
      .catch(console.error)
  }, [selectedEmpresaId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'visualizada':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
      case 'assinada':
        return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
      case 'rejeitada':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Propostas Comerciais</h2>
        <p className="text-muted-foreground">Acompanhe as propostas enviadas aos seus leads.</p>
      </div>
      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Visualizações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {propostas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                  Nenhuma proposta enviada.
                </TableCell>
              </TableRow>
            ) : (
              propostas.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                    {p.expand?.lead_id?.expand?.cliente_id?.razao_social}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      p.valor || 0,
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`uppercase text-[10px] tracking-widest ${getStatusColor(p.status)}`}
                    >
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center text-muted-foreground">
                      <Eye className="w-3 h-3 mr-1" /> {p.visualizacoes || 0}
                    </span>
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
