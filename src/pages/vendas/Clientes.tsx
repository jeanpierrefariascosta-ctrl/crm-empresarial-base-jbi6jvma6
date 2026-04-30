import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { maskCnpj } from '@/lib/utils'
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
import { Search, Plus, Loader2, Edit2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNavigate } from 'react-router-dom'

const formSchema = z.object({
  cnpj_cpf: z.string().optional(),
  razao_social: z.string().min(1, 'Razão Social é obrigatória'),
  nome_fantasia: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  status: z.enum(['ativo', 'inativo']).default('ativo'),
  socios: z.any().optional(),
  cnae: z.string().optional(),
  data_abertura: z.string().optional(),
  situacao: z.string().optional(),
  faturamento: z.number().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function Clientes() {
  const { user, selectedEmpresaId } = useAuth() as any
  const navigate = useNavigate()
  const [clientes, setClientes] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filterCidade, setFilterCidade] = useState('todas')
  const [filterUf, setFilterUf] = useState('todas')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [buscandoCnpj, setBuscandoCnpj] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cnpj_cpf: '',
      razao_social: '',
      nome_fantasia: '',
      email: '',
      telefone: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
      status: 'ativo',
      socios: [],
      cnae: '',
      data_abertura: '',
      situacao: '',
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

  const uniqueUfs = Array.from(new Set(clientes.map((c) => c.uf).filter(Boolean))).sort()
  const uniqueCidades = Array.from(
    new Set(
      clientes
        .filter((c) => filterUf === 'todas' || c.uf === filterUf)
        .map((c) => c.cidade)
        .filter(Boolean),
    ),
  ).sort()

  const filteredClientes = clientes.filter((c) => {
    const matchSearch =
      c.razao_social?.toLowerCase().includes(search.toLowerCase()) ||
      c.cnpj_cpf?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
    const matchUf = filterUf === 'todas' || c.uf === filterUf
    const matchCidade = filterCidade === 'todas' || c.cidade === filterCidade
    return matchSearch && matchUf && matchCidade
  })

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
        if (data.email) form.setValue('email', data.email, { shouldValidate: true })
        if (data.telefone) form.setValue('telefone', data.telefone, { shouldValidate: true })
        if (data.fantasia) form.setValue('nome_fantasia', data.fantasia)
        if (data.cep) form.setValue('cep', data.cep)
        if (data.logradouro) form.setValue('logradouro', data.logradouro)
        if (data.numero) form.setValue('numero', data.numero)
        if (data.complemento) form.setValue('complemento', data.complemento)
        if (data.bairro) form.setValue('bairro', data.bairro)
        if (data.cidade) form.setValue('cidade', data.cidade)
        if (data.uf) form.setValue('uf', data.uf)
        if (data.qsa) form.setValue('socios', data.qsa)
        if (data.cnae) form.setValue('cnae', data.cnae)
        if (data.data_abertura) form.setValue('data_abertura', data.data_abertura)
        if (data.situacao) form.setValue('situacao', data.situacao)

        toast.success('Dados do CNPJ importados com sucesso! Revise e adicione ao CRM.')
      } else {
        toast.error('Nenhum dado retornado para este CNPJ.')
      }
    } catch (e: any) {
      toast.error(e?.response?.message || 'Erro ao consultar CNPJ.')
    } finally {
      setBuscandoCnpj(false)
    }
  }

  const handleVerDetalhes = (cliente: any) => {
    setSelectedCliente(cliente)
    setIsEditMode(false)
    setDetailsOpen(true)
  }

  const handleEdit = () => {
    if (selectedCliente) {
      form.reset(selectedCliente)
      setIsEditMode(true)
      setDetailsOpen(false)
      setOpen(true)
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
      let record
      if (isEditMode && selectedCliente) {
        record = await pb.collection('clientes').update(selectedCliente.id, values)
        toast.success('Cliente atualizado com sucesso!')
      } else {
        record = await pb.collection('clientes').create({
          ...values,
          empresa_id: selectedEmpresaId,
          criado_por: userId,
        })

        const lead = await pb.collection('leads').create({
          empresa_id: selectedEmpresaId,
          cliente_id: record.id,
          etapa_kanban: 'prospecção',
          fonte_lead: 'Receita Federal',
          responsavel_id: userId,
        })

        if (values.socios && values.socios.length > 0) {
          await Promise.all(
            values.socios.map((socio: any) =>
              pb.collection('contatos').create({
                empresa_id: selectedEmpresaId,
                cliente_id: record.id,
                lead_id: lead.id,
                nome: socio.nome_socio || socio.nome,
                cargo: socio.qual_rep_legal || socio.qualificacao_socio || 'Sócio',
              }),
            ),
          )
        }

        toast.success('Lead e contatos criados com sucesso!', {
          action: {
            label: 'Ver no Pipeline',
            onClick: () => navigate('/vendas/leads'),
          },
          duration: 5000,
        })
      }

      setOpen(false)
      form.reset()
      if (isEditMode) {
        setSelectedCliente(record)
        setDetailsOpen(true)
      } else {
        handleVerDetalhes(record)
      }
    } catch (e: any) {
      const fieldErrors = extractFieldErrors(e)
      if (Object.keys(fieldErrors).length > 0) {
        Object.entries(fieldErrors).forEach(([field, msg]) => {
          form.setError(field as any, { type: 'manual', message: msg })
        })
      } else {
        toast.error('Erro ao salvar cliente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      form.reset()
      setIsEditMode(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
          <p className="text-muted-foreground">Lista de clientes e contas.</p>
        </div>
        <Button
          onClick={() => {
            setIsEditMode(false)
            setOpen(true)
            form.reset()
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Novo Cliente / CNPJ
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={filterUf}
          onValueChange={(val) => {
            setFilterUf(val)
            setFilterCidade('todas')
          }}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="UF" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas UFs</SelectItem>
            {uniqueUfs.map((uf) => (
              <SelectItem key={uf} value={uf}>
                {uf}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCidade} onValueChange={setFilterCidade}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Cidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas Cidades</SelectItem>
            {uniqueCidades.map((cidade) => (
              <SelectItem key={cidade} value={cidade}>
                {cidade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Razão Social</TableHead>
              <TableHead>CNPJ/CPF</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
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
                    <Badge
                      variant={cliente.status === 'inativo' ? 'secondary' : 'default'}
                      className={
                        cliente.status !== 'inativo'
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : ''
                      }
                    >
                      {cliente.status === 'inativo' ? 'Inativo' : 'Ativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleVerDetalhes(cliente)}>
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
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>{isEditMode ? 'Editar Cliente' : 'Novo Cliente & Lead'}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Atualize os dados do cliente.'
                : 'Busque o CNPJ para preencher os dados automaticamente. Isso criará o cliente e um Lead em Prospecção.'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[75vh]">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-6 pt-0">
                <div className="space-y-4">
                  {!isEditMode && (
                    <div className="p-4 bg-muted/30 border rounded-lg flex flex-col sm:flex-row items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <label className="text-sm font-medium">
                          Buscar CNPJ na Receita Federal
                        </label>
                        <div className="flex gap-2">
                          <FormField
                            control={form.control}
                            name="cnpj_cpf"
                            render={({ field }) => (
                              <FormControl>
                                <Input
                                  placeholder="00.000.000/0000-00"
                                  {...field}
                                  onChange={(e) => field.onChange(maskCnpj(e.target.value))}
                                  className="w-full"
                                />
                              </FormControl>
                            )}
                          />
                          <Button
                            type="button"
                            onClick={buscarCnpj}
                            disabled={buscandoCnpj}
                            className="w-[120px]"
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
                      </div>
                    </div>
                  )}

                  {isEditMode && (
                    <FormField
                      control={form.control}
                      name="cnpj_cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNPJ/CPF</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="00.000.000/0000-00"
                              {...field}
                              onChange={(e) => field.onChange(maskCnpj(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="razao_social"
                      render={({ field }) => (
                        <FormItem className="col-span-2 sm:col-span-1">
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
                      name="nome_fantasia"
                      render={({ field }) => (
                        <FormItem className="col-span-2 sm:col-span-1">
                          <FormLabel>Nome Fantasia</FormLabel>
                          <FormControl>
                            <Input placeholder="Fantasia" {...field} />
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
                    <FormField
                      control={form.control}
                      name="cnae"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Atividade Econômica (CNAE)</FormLabel>
                          <FormControl>
                            <Input placeholder="Descrição da Atividade" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-6 mb-2">
                    <h3 className="text-sm font-medium border-b pb-1">Endereço</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cep"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <Input placeholder="00000-000" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="uf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UF</FormLabel>
                          <FormControl>
                            <Input placeholder="SP" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cidade"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input placeholder="São Paulo" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bairro"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Bairro</FormLabel>
                          <FormControl>
                            <Input placeholder="Centro" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="logradouro"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Logradouro</FormLabel>
                          <FormControl>
                            <Input placeholder="Rua Exemplo" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="numero"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número</FormLabel>
                          <FormControl>
                            <Input placeholder="123" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="complemento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complemento</FormLabel>
                          <FormControl>
                            <Input placeholder="Sala 4" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <DialogFooter className="pt-6">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditMode ? 'Salvar Alterações' : 'Adicionar ao CRM'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <SheetTitle>Detalhes do Cliente</SheetTitle>
              <SheetDescription>Informações completas do cliente.</SheetDescription>
            </div>
            <Button variant="outline" size="icon" onClick={handleEdit}>
              <Edit2 className="h-4 w-4" />
            </Button>
          </SheetHeader>
          {selectedCliente && (
            <div className="space-y-4 mt-2 pb-8">
              <div className="flex items-center justify-between">
                <Badge
                  variant={selectedCliente.status === 'inativo' ? 'secondary' : 'default'}
                  className={selectedCliente.status !== 'inativo' ? 'bg-green-500' : ''}
                >
                  {selectedCliente.status === 'inativo' ? 'Inativo' : 'Ativo'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Razão Social / Fantasia
                  </h4>
                  <p className="text-base">{selectedCliente.razao_social}</p>
                  <p className="text-sm text-muted-foreground">{selectedCliente.nome_fantasia}</p>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground">CNPJ / CPF</h4>
                  <p className="text-base">{selectedCliente.cnpj_cpf || '-'}</p>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground">CNAE</h4>
                  <p className="text-sm">{selectedCliente.cnae || '-'}</p>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground">E-mail</h4>
                  <p className="text-base">{selectedCliente.email || '-'}</p>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Telefone</h4>
                  <p className="text-base">{selectedCliente.telefone || '-'}</p>
                </div>
              </div>

              <Separator className="my-4" />
              <h3 className="font-medium text-lg">Endereço Completo</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="col-span-2">
                  <span className="text-sm text-muted-foreground">Logradouro: </span>
                  <span className="text-sm">{selectedCliente.logradouro || '-'}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Número: </span>
                  <span className="text-sm">{selectedCliente.numero || '-'}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Comp.: </span>
                  <span className="text-sm">{selectedCliente.complemento || '-'}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Bairro: </span>
                  <span className="text-sm">{selectedCliente.bairro || '-'}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">CEP: </span>
                  <span className="text-sm">{selectedCliente.cep || '-'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-muted-foreground">Cidade/UF: </span>
                  <span className="text-sm">
                    {selectedCliente.cidade || '-'}
                    {selectedCliente.uf ? ` / ${selectedCliente.uf}` : ''}
                  </span>
                </div>
              </div>

              {Array.isArray(selectedCliente.socios) && selectedCliente.socios.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <h3 className="font-medium text-lg mb-2">Quadro Societário (QSA)</h3>
                  <div className="space-y-3">
                    {selectedCliente.socios.map((socio: any, idx: number) => (
                      <div key={idx} className="bg-muted p-3 rounded-md flex flex-col">
                        <span className="font-medium text-sm">
                          {socio.nome_socio || socio.nome}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {socio.qual_rep_legal || socio.qualificacao_socio || 'Sócio'}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
