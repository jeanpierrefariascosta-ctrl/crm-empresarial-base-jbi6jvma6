import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
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
import { Search, Plus, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

const formSchema = z.object({
  cnpj_cpf: z.string().optional(),
  razao_social: z.string().min(1, 'Razão Social é obrigatória'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function Clientes() {
  const { user, selectedEmpresaId } = useAuth() as any
  const [clientes, setClientes] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [buscandoCnpj, setBuscandoCnpj] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cnpj_cpf: '',
      razao_social: '',
      email: '',
      telefone: '',
    },
  })

  const fetchClientes = async () => {
    if (!selectedEmpresaId) return
    try {
      const data = await pb.collection('clientes').getFullList({
        filter: `empresa_id = "${selectedEmpresaId}"`,
        sort: '-created',
      })
      setClientes(data)
    } catch (e) {
      console.error('Erro ao carregar clientes:', e)
    }
  }

  useEffect(() => {
    fetchClientes()
  }, [selectedEmpresaId])

  useRealtime('clientes', () => {
    fetchClientes()
  })

  const filteredClientes = clientes.filter((c) =>
    c.razao_social?.toLowerCase().includes(search.toLowerCase()),
  )

  const buscarCnpj = async () => {
    const cnpj = form.getValues('cnpj_cpf')?.replace(/\D/g, '')
    if (!cnpj || cnpj.length !== 14) {
      toast.error('Digite um CNPJ válido com 14 dígitos para buscar.')
      return
    }
    setBuscandoCnpj(true)
    try {
      const data = await pb.send(`/backend/v1/import/cnpj`, {
        method: 'POST',
        body: JSON.stringify({ cnpj }),
        headers: { 'Content-Type': 'application/json' },
      })

      if (data?.razao_social) {
        form.setValue('razao_social', data.razao_social, {
          shouldValidate: true,
          shouldDirty: true,
        })
        if (data.email)
          form.setValue('email', data.email, { shouldValidate: true, shouldDirty: true })
        if (data.telefone)
          form.setValue('telefone', data.telefone, { shouldValidate: true, shouldDirty: true })

        toast.success('Dados do CNPJ importados com sucesso!')
      } else {
        toast.error('Nenhum dado retornado para este CNPJ.')
      }
    } catch (e: any) {
      const errorMessage =
        e?.response?.message ||
        'Erro ao consultar CNPJ. Verifique o número ou tente novamente mais tarde.'
      toast.error(errorMessage)
    } finally {
      setBuscandoCnpj(false)
    }
  }

  const onSubmit = async (values: FormValues) => {
    const userId = user?.id || pb.authStore.record?.id
    if (!selectedEmpresaId || !userId) {
      toast.error('Sessão inválida. Por favor, recarregue a página.')
      return
    }

    setLoading(true)
    try {
      await pb.collection('clientes').create({
        ...values,
        empresa_id: selectedEmpresaId,
        criado_por: userId,
      })
      toast.success('Cliente cadastrado com sucesso!')
      setOpen(false)
      form.reset()
    } catch (e: any) {
      const fieldErrors = extractFieldErrors(e)
      if (Object.keys(fieldErrors).length > 0) {
        Object.entries(fieldErrors).forEach(([field, msg]) => {
          form.setError(field as any, { type: 'manual', message: msg })
        })
      } else {
        toast.error('Erro ao cadastrar cliente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      form.reset()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
          <p className="text-muted-foreground">Lista de clientes e contas.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
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
              <TableHead className="text-right">Ações</TableHead>
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
                  <TableCell className="text-right">
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

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
            <DialogDescription>
              Cadastre um novo cliente. Utilize a busca por CNPJ para autopreencher.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="cnpj_cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ / CPF</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="00.000.000/0000-00" {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={buscarCnpj}
                        disabled={buscandoCnpj}
                        className="w-[100px]"
                      >
                        {buscandoCnpj ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Search className="mr-2 h-4 w-4" /> Buscar
                          </>
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="razao_social"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da Empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="contato@empresa.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Cliente
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
