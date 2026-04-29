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
import { UserPlus, Mail, Phone, Linkedin, Briefcase } from 'lucide-react'

export function ContatosTab({ leadId, empresaId, clienteId }: any) {
  const [contatos, setContatos] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    cargo: '',
    email: '',
    telefone: '',
    linkedin_url: '',
  })
  const { toast } = useToast()

  const load = () =>
    pb
      .collection('contatos')
      .getFullList({ filter: `lead_id="${leadId}"`, sort: 'nome' })
      .then(setContatos)
  useEffect(load, [leadId])

  const save = async () => {
    if (!formData.nome) return toast({ variant: 'destructive', title: 'Nome é obrigatório' })
    try {
      await pb
        .collection('contatos')
        .create({ ...formData, lead_id: leadId, empresa_id: empresaId, cliente_id: clienteId })
      toast({ title: 'Contato adicionado com sucesso!' })
      setOpen(false)
      setFormData({ nome: '', cargo: '', email: '', telefone: '', linkedin_url: '' })
      load()
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro', description: e.message })
    }
  }

  const deleteContact = async (id: string) => {
    try {
      await pb.collection('contatos').delete(id)
      load()
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro ao excluir' })
    }
  }

  return (
    <div className="py-2 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" variant="outline">
            <UserPlus className="mr-2 w-4 h-4" /> Novo Contato
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Contato Relacionado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Nome Completo"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            />
            <Input
              placeholder="Cargo / Área"
              value={formData.cargo}
              onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
            />
            <Input
              placeholder="E-mail"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              placeholder="Telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            />
            <Input
              placeholder="URL do LinkedIn"
              value={formData.linkedin_url}
              onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
            />
            <Button onClick={save} className="w-full">
              Salvar Contato
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
        {contatos.length === 0 ? (
          <p className="col-span-1 sm:col-span-2 text-center text-sm text-muted-foreground py-8">
            Nenhum contato vinculado.
          </p>
        ) : (
          contatos.map((c) => (
            <div key={c.id} className="p-4 bg-card border rounded-lg text-sm relative group">
              <div className="font-semibold text-base pr-6">{c.nome}</div>
              <div className="text-xs text-muted-foreground flex items-center mt-1">
                <Briefcase className="w-3 h-3 mr-1" /> {c.cargo || 'Cargo não informado'}
              </div>
              <div className="mt-3 space-y-1.5">
                {c.email && (
                  <div className="text-xs flex items-center">
                    <Mail className="w-3 h-3 mr-2 text-muted-foreground" />{' '}
                    <a href={`mailto:${c.email}`} className="hover:underline">
                      {c.email}
                    </a>
                  </div>
                )}
                {c.telefone && (
                  <div className="text-xs flex items-center">
                    <Phone className="w-3 h-3 mr-2 text-muted-foreground" /> {c.telefone}
                  </div>
                )}
                {c.linkedin_url && (
                  <div className="text-xs flex items-center">
                    <Linkedin className="w-3 h-3 mr-2 text-blue-500" />{' '}
                    <a
                      href={c.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Perfil
                    </a>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"
                onClick={() => deleteContact(c.id)}
              >
                ✕
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
