import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Search, Building2 } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'

export function CnpjSearchModal({ open, onOpenChange, onUpdate, onViewKanban }: any) {
  const [cnpj, setCnpj] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const { user, selectedEmpresaId } = useAuth() as any

  const handleSearch = async () => {
    if (!cnpj) return
    setLoading(true)
    try {
      // Mocking Receita Federal lookup for immediate frontend response.
      // In a real scenario, this would call a backend hook.
      setTimeout(() => {
        setResult({
          cnpj: cnpj,
          razao_social: 'Empresa Capturada via Receita LTDA',
          nome_fantasia: 'Captura Exemplo',
          email: 'contato@captura.com.br',
          telefone: '11999999999',
          situacao: 'ATIVA',
        })
        setLoading(false)
      }, 1000)
    } catch (e) {
      toast.error('Erro ao buscar CNPJ')
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!result) return
    setSaving(true)
    try {
      const cliente = await pb.collection('clientes').create({
        empresa_id: selectedEmpresaId,
        razao_social: result.razao_social,
        nome_fantasia: result.nome_fantasia,
        cnpj_cpf: result.cnpj,
        email: result.email,
        telefone: result.telefone,
        situacao: result.situacao,
        status: 'ativo',
        criado_por: user?.id,
      })

      await pb.collection('leads').create({
        empresa_id: selectedEmpresaId,
        cliente_id: cliente.id,
        etapa_kanban: 'prospecção',
        responsavel_id: user?.id,
      })

      toast.success(`Lead ${result.razao_social} adicionado à coluna prospecção com sucesso!`, {
        action: {
          label: 'Ver no Kanban',
          onClick: () => onViewKanban && onViewKanban(),
        },
      })
      onUpdate && onUpdate()
      onOpenChange(false)
      setResult(null)
      setCnpj('')
    } catch (e) {
      toast.error('Erro ao salvar no CRM')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Buscar CNPJ (Receita Federal)
          </DialogTitle>
          <DialogDescription>
            Busque dados de uma empresa pelo CNPJ e adicione diretamente ao pipeline de vendas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <Input
              placeholder="Digite o CNPJ..."
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
            />
            <Button onClick={handleSearch} disabled={loading || !cnpj}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {result && (
            <div className="p-4 border rounded-md space-y-2 bg-muted/30 animate-fade-in-up">
              <h3 className="font-semibold">{result.razao_social}</h3>
              <p className="text-sm text-muted-foreground">CNPJ: {result.cnpj}</p>
              <p className="text-sm text-muted-foreground">Situação: {result.situacao}</p>

              <div className="pt-4">
                <Button className="w-full" onClick={handleAdd} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Adicionar ao CRM (Prospecção)
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
