import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Megaphone, Plus, Users, Target, TrendingUp, BarChart3 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { PieChart, Pie, Cell } from 'recharts'

export default function Campanhas() {
  const { selectedEmpresaId, user } = useAuth()
  const [campanhas, setCampanhas] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    nome_campanha: '',
    plataforma: 'google_ads',
    orcamento: '',
    descricao: '',
  })

  useEffect(() => {
    if (!selectedEmpresaId) return

    const fetchStats = async () => {
      try {
        const [camps, lds] = await Promise.all([
          pb
            .collection('campanhas_ads')
            .getFullList({ filter: `empresa_id = "${selectedEmpresaId}"` }),
          pb
            .collection('leads')
            .getFullList({ filter: `empresa_id = "${selectedEmpresaId}"`, expand: 'campanha_id' }),
        ])
        setCampanhas(camps)
        setLeads(lds)
      } catch (e) {
        console.error(e)
      }
    }
    fetchStats()
  }, [selectedEmpresaId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const camp = await pb.collection('campanhas_ads').create({
        ...formData,
        empresa_id: selectedEmpresaId,
        orcamento: Number(formData.orcamento) || 0,
        responsavel_default_id: user?.id,
      })
      setCampanhas([...campanhas, camp])
      setIsDialogOpen(false)
      toast({ title: 'Campanha criada!' })
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message })
    }
  }

  const totalLeads = leads.length
  const enrichedLeads = leads.filter((l) => l.enriquecido).length

  const leadsPorFonteMap = leads.reduce((acc: any, lead) => {
    const f = lead.fonte_lead || 'Orgânico'
    acc[f] = (acc[f] || 0) + 1
    return acc
  }, {})

  const leadsPorFonte = Object.keys(leadsPorFonteMap).map((key, index) => ({
    name: key,
    value: leadsPorFonteMap[key],
    color: ['hsl(var(--primary))', 'hsl(var(--destructive))', '#ffc658', '#ff8042'][index % 4],
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Marketing & Ads</h2>
          <p className="text-muted-foreground">Analise o desempenho e gerencie campanhas.</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">
            <BarChart3 className="w-4 h-4 mr-2" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="campanhas">
            <Megaphone className="w-4 h-4 mr-2" /> Campanhas Ativas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLeads}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Leads Enriquecidos (IA)</CardTitle>
                <Target className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">{enrichedLeads}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Custo por Lead Médio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ 24,50</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Leads por Fonte</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ChartContainer config={{}} className="h-[300px] w-full">
                  <PieChart>
                    <Pie
                      data={leadsPorFonte}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {leadsPorFonte.map((entry: any, i: number) => (
                        <Cell key={`cell-${i}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campanhas" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Nova Campanha
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Campanha de Ads</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome da Campanha</Label>
                    <Input
                      required
                      value={formData.nome_campanha}
                      onChange={(e) => setFormData({ ...formData, nome_campanha: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Plataforma</Label>
                    <Select
                      value={formData.plataforma}
                      onValueChange={(v) => setFormData({ ...formData, plataforma: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google_ads">Google Ads</SelectItem>
                        <SelectItem value="meta_ads">Meta Ads</SelectItem>
                        <SelectItem value="linkedin_ads">LinkedIn Ads</SelectItem>
                        <SelectItem value="landing_page">Landing Page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Orçamento</Label>
                    <Input
                      type="number"
                      required
                      value={formData.orcamento}
                      onChange={(e) => setFormData({ ...formData, orcamento: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Salvar
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {campanhas.map((c) => (
              <Card key={c.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{c.nome_campanha}</CardTitle>
                  <CardDescription className="uppercase font-semibold text-primary">
                    {c.plataforma.replace('_', ' ')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Orçamento:</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(c.orcamento || 0)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Link de captura:
                      <br />
                      <a
                        href={`/campanha/${c.id}`}
                        target="_blank"
                        className="text-primary hover:underline break-all"
                      >
                        {window.location.origin}/campanha/{c.id}
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
