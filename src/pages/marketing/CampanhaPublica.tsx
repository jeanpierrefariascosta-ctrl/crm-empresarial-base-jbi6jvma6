import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { Megaphone, CheckCircle2, Search, Loader2 } from 'lucide-react'
import { isValidCNPJ, maskCnpj } from '@/lib/utils'

export default function CampanhaPublica() {
  const { id } = useParams()
  const [campanha, setCampanha] = useState<any>(null)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    razao_social: '',
    cnpj: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingCnpj, setIsCheckingCnpj] = useState(false)
  const [cnpjNotFound, setCnpjNotFound] = useState(false)
  const [manualEntry, setManualEntry] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (id) {
      pb.collection('campanhas_ads')
        .getOne(id)
        .then(setCampanha)
        .catch(() => {
          toast({ variant: 'destructive', title: 'Campanha não encontrada.' })
        })
    }
  }, [id, toast])

  const checkCnpjApi = async () => {
    const cleanCnpj = formData.cnpj.replace(/\D/g, '')
    if (cleanCnpj.length < 14) return

    if (!isValidCNPJ(cleanCnpj)) {
      toast({ variant: 'destructive', title: 'CNPJ inválido' })
      return
    }

    setIsCheckingCnpj(true)
    setCnpjNotFound(false)
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`)
      if (res.ok) {
        const data = await res.json()
        setFormData((prev) => ({ ...prev, razao_social: data.razao_social }))
        setManualEntry(true) // auto-show field as we have the data
        toast({ title: 'CNPJ encontrado', description: 'Dados da empresa preenchidos.' })
      } else if (res.status === 404) {
        setCnpjNotFound(true)
        toast({
          variant: 'destructive',
          title: 'CNPJ não encontrado',
          description: 'CNPJ não encontrado na base da Receita Federal',
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro na busca',
          description: 'Tente novamente mais tarde.',
        })
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro de conexão',
        description: 'Não foi possível buscar o CNPJ.',
      })
    } finally {
      setIsCheckingCnpj(false)
    }
  }

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCnpj(e.target.value)
    setFormData((prev) => ({ ...prev, cnpj: masked }))
    if (cnpjNotFound) setCnpjNotFound(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await pb.send(`/backend/v1/campaigns/${id}/capture`, {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      setIsSuccess(true)
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro ao enviar dados.', description: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  if (!campanha)
    return <div className="min-h-screen flex items-center justify-center p-4">Carregando...</div>

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md text-center py-8">
          <CardContent className="space-y-4 flex flex-col items-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            <h2 className="text-2xl font-bold">Obrigado pelo interesse!</h2>
            <p className="text-muted-foreground">
              Seus dados foram recebidos com sucesso. Entraremos em contato em breve.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <Megaphone className="w-6 h-6" />
            </div>
          </div>
          <CardTitle className="text-2xl">{campanha.nome_campanha}</CardTitle>
          <CardDescription>
            {campanha.descricao || 'Preencha o formulário abaixo para saber mais.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail Corporativo</Label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone / WhatsApp</Label>
              <Input
                required
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>CNPJ da Empresa</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.cnpj}
                  onChange={handleCnpjChange}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  disabled={isCheckingCnpj}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={checkCnpjApi}
                  disabled={isCheckingCnpj || formData.cnpj.length < 18}
                  className="min-w-[100px]"
                >
                  {isCheckingCnpj ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" /> Buscar
                    </>
                  )}
                </Button>
              </div>
            </div>

            {cnpjNotFound && !manualEntry && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm space-y-3 animate-fade-in">
                <p className="font-medium">CNPJ não encontrado na base da Receita Federal.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setManualEntry(true)}
                  className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  Criar cliente manualmente
                </Button>
              </div>
            )}

            {(manualEntry || !cnpjNotFound) && (
              <div className="space-y-2 animate-fade-in-up">
                <Label>Nome da Empresa</Label>
                <Input
                  required
                  value={formData.razao_social}
                  onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                  placeholder="Razão Social ou Nome Fantasia"
                />
              </div>
            )}
            <Button className="w-full mt-4" type="submit" disabled={isLoading}>
              {isLoading ? 'Enviando...' : 'Quero saber mais'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
