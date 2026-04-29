import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Briefcase, Building, ChevronRight, ChevronLeft, User, Lock, Mail } from 'lucide-react'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

function isValidCNPJ(cnpj: string) {
  cnpj = cnpj.replace(/[^\d]+/g, '')
  if (cnpj === '') return false
  if (cnpj.length !== 14) return false
  if (/^(\d)\1+$/.test(cnpj)) return false

  let size = cnpj.length - 2
  let numbers = cnpj.substring(0, size)
  const digits = cnpj.substring(size)
  let sum = 0
  let pos = size - 7
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(0))) return false

  size = size + 1
  numbers = cnpj.substring(0, size)
  sum = 0
  pos = size - 7
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(1))) return false

  return true
}

const maskCnpj = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18)
}

export default function Signup() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [regData, setRegData] = useState({
    cnpj: '',
    razao_social: '',
    nome_completo: '',
    email: '',
    password: '',
    confirm_password: '',
  })

  const { registerWorkspace } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const checkCnpjApi = async (cnpjStr: string) => {
    const cleanCnpj = cnpjStr.replace(/\D/g, '')
    if (cleanCnpj.length >= 14) {
      if (!isValidCNPJ(cleanCnpj)) {
        setErrors((prev) => ({ ...prev, cnpj: 'CNPJ inválido' }))
        return
      }
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`)
        if (res.ok) {
          const data = await res.json()
          setRegData((prev) => ({ ...prev, razao_social: data.razao_social }))
          setErrors((prev) => ({ ...prev, cnpj: '' }))
        } else if (res.status === 404) {
          const errorData = await res.json().catch(() => null)
          toast({
            variant: 'destructive',
            title: 'CNPJ não encontrado',
            description: errorData?.message || 'CNPJ não encontrado na Receita Federal.',
          })
          setRegData((prev) => ({ ...prev, razao_social: '' }))
        }
      } catch {
        // Ignore network errors gracefully
      }
    }
  }

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCnpj(e.target.value)
    setRegData((prev) => ({ ...prev, cnpj: masked }))
    if (errors.cnpj) {
      setErrors((prev) => ({ ...prev, cnpj: '' }))
    }
  }

  const handleNext = () => {
    const newErrors: Record<string, string> = {}
    if (!regData.cnpj) {
      newErrors.cnpj = 'Obrigatório'
    } else if (!isValidCNPJ(regData.cnpj)) {
      newErrors.cnpj = 'CNPJ inválido'
    }
    if (!regData.razao_social) newErrors.razao_social = 'Obrigatório'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setStep(2)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}
    if (!regData.nome_completo) newErrors.nome_completo = 'Obrigatório'
    if (!regData.email) newErrors.email = 'Obrigatório'
    if (!regData.password) newErrors.password = 'Obrigatório'
    if (regData.password !== regData.confirm_password)
      newErrors.confirm_password = 'As senhas não coincidem'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    const { error } = await registerWorkspace(regData)
    setIsLoading(false)

    if (error) {
      const fieldErrors = extractFieldErrors(error)
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
        if (fieldErrors.cnpj) {
          setStep(1)
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao criar conta',
          description: error.message || 'Verifique os dados informados.',
        })
      }
    } else {
      toast({
        title: 'Conta criada com sucesso!',
        description: 'Bem-vindo ao CRM.',
      })
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
          <CardTitle className="text-2xl font-bold tracking-tight">Criar Conta</CardTitle>
          <CardDescription>
            {step === 1 ? 'Etapa 1: Dados da Empresa' : 'Etapa 2: Dados do Usuário Diretor'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex gap-2 justify-center">
            <div className={`h-2 w-12 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div
              className={`h-2 w-12 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}
            />
          </div>

          <form
            onSubmit={
              step === 2
                ? handleRegister
                : (e) => {
                    e.preventDefault()
                    handleNext()
                  }
            }
            className="space-y-4"
          >
            {step === 1 && (
              <div className="space-y-4 animate-fade-in-up">
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      required
                      placeholder="00.000.000/0000-00"
                      className={`pl-9 ${errors.cnpj ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      value={regData.cnpj}
                      onChange={handleCnpjChange}
                      onBlur={() => checkCnpjApi(regData.cnpj)}
                      maxLength={18}
                    />
                  </div>
                  {errors.cnpj && <p className="text-sm text-red-500 font-medium">{errors.cnpj}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Razão Social</Label>
                  <Input
                    required
                    className={
                      errors.razao_social ? 'border-red-500 focus-visible:ring-red-500' : ''
                    }
                    placeholder="Nome da empresa"
                    value={regData.razao_social}
                    onChange={(e) => {
                      setRegData({ ...regData, razao_social: e.target.value })
                      if (errors.razao_social) setErrors((prev) => ({ ...prev, razao_social: '' }))
                    }}
                  />
                  {errors.razao_social && (
                    <p className="text-sm text-red-500 font-medium">{errors.razao_social}</p>
                  )}
                </div>
                <Button type="button" onClick={handleNext} className="w-full mt-6">
                  Próxima Etapa <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fade-in-up">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      required
                      className={`pl-9 ${errors.nome_completo ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      placeholder="Seu nome"
                      value={regData.nome_completo}
                      onChange={(e) => setRegData({ ...regData, nome_completo: e.target.value })}
                    />
                  </div>
                  {errors.nome_completo && (
                    <p className="text-sm text-red-500 font-medium">{errors.nome_completo}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      required
                      className={`pl-9 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      placeholder="seu@email.com"
                      value={regData.email}
                      onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500 font-medium">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      required
                      className={`pl-9 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      placeholder="Mínimo 8 caracteres"
                      value={regData.password}
                      onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                      minLength={8}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-500 font-medium">{errors.password}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      required
                      className={`pl-9 ${errors.confirm_password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      placeholder="Confirme a senha"
                      value={regData.confirm_password}
                      onChange={(e) => setRegData({ ...regData, confirm_password: e.target.value })}
                      minLength={8}
                    />
                  </div>
                  {errors.confirm_password && (
                    <p className="text-sm text-red-500 font-medium">{errors.confirm_password}</p>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? 'Criando...' : 'Finalizar Cadastro'}
                  </Button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-6 text-center text-sm">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Fazer Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
