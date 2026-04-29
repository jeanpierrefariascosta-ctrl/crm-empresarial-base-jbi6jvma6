import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus } from 'lucide-react'

export default function Clientes() {
  const { selectedEmpresaId } = useAuth()
  const [clientes, setClientes] = useState<any[]>([])
  const [search, setSearch] = useState('')

  const fetchClientes = async () => {
    if (!selectedEmpresaId) return
    try {
      const data = await pb.collection('clientes').getFullList({
        filter: `empresa_id = "${selectedEmpresaId}"`,
      })
      setClientes(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchClientes()
  }, [selectedEmpresaId])

  const filteredClientes = clientes.filter((c) =>
    c.razao_social?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
          <p className="text-muted-foreground">Lista de clientes e contas.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Razão Social</TableHead>
              <TableHead>CNPJ/CPF</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredClientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="font-medium">{cliente.razao_social}</TableCell>
                  <TableCell>{cliente.cnpj_cpf || '-'}</TableCell>
                  <TableCell>{cliente.email || '-'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      Ver Detalhes
                    </Button>
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
