import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Briefcase, Building } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [regData, setRegData] = useState({
    nome_completo: '',
    cnpj: '',
    razao_social: '',
    funcao: 'admin',
  })

  const [isLoading, setIsLoading] = useState(false)
  const { signIn, registerWorkspace } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const { error } = await signIn(email, password)
    setIsLoading(false)

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao fazer login',
        description: 'Verifique suas credenciais e tente novamente.',
      })
    } else {
      navigate('/')
    }
  }

  const checkCnpj = async () => {
    if (regData.cnpj.length >= 14) {
      try {
        const res = await fetch(
          `https://brasilapi.com.br/api/cnpj/v1/${regData.cnpj.replace(/\D/g, '')}`,
        )
        if (res.ok) {
          const data = await res.json()
          setRegData((prev) => ({ ...prev, razao_social: data.razao_social }))
          toast({ title: 'Empresa encontrada', description: data.razao_social })
        }
      } catch {
        /* intentionally ignored */
      }
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regData.razao_social) {
      toast({ variant: 'destructive', title: 'Razão social é obrigatória' })
      return
    }
    setIsLoading(true)
    const { error } = await registerWorkspace({
      email,
      password,
      ...regData,
    })
    setIsLoading(false)

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar conta',
        description: error.message || 'Verifique os dados informados.',
      })
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
      <Card className="w-full max-w-md z-10 shadow-2xl border-border/50">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Briefcase className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">CRM Empresarial</CardTitle>
          <CardDescription>Gerencie suas vendas e campanhas</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Cadastro</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input
                    required
                    placeholder="Apenas números"
                    value={regData.cnpj}
                    onChange={(e) => setRegData({ ...regData, cnpj: e.target.value })}
                    onBlur={checkCnpj}
                  />
                </div>
                {regData.razao_social && (
                  <div className="p-2 bg-muted rounded-md flex items-center text-sm">
                    <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                    {regData.razao_social}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input
                    required
                    value={regData.nome_completo}
                    onChange={(e) => setRegData({ ...regData, nome_completo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !regData.razao_social}
                >
                  {isLoading ? 'Criando...' : 'Criar Conta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
