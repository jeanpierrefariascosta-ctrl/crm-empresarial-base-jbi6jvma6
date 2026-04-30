import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Lock } from 'lucide-react'

export default function ProjectDetails() {
  const { id } = useParams()
  const [projeto, setProjeto] = useState<any>(null)
  const [tarefas, setTarefas] = useState<any[]>([])
  const [arquivos, setArquivos] = useState<any[]>([])

  const fetchData = async () => {
    if (!id) return
    try {
      const p = await pb.collection('projetos').getOne(id, { expand: 'cliente_id' })
      setProjeto(p)
      const t = await pb.collection('tarefas').getFullList({ filter: `projeto_id="${id}"` })
      setTarefas(t)
      const a = await pb
        .collection('arquivos_projeto')
        .getFullList({ filter: `projeto_id="${id}"` })
      setArquivos(a)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const gerarResumoIA = async (arquivoId: string) => {
    try {
      await pb.send(`/backend/v1/projetos/arquivos/${arquivoId}/resumo`, { method: 'POST' })
      toast.success('Resumo gerado com sucesso!')
      fetchData()
    } catch (err: any) {
      toast.error('Erro ao gerar resumo.')
    }
  }

  if (!projeto) return <div>Carregando...</div>

  const progresso =
    tarefas.length > 0
      ? Math.round(
          (tarefas.filter((t) => t.status === 'concluida' || t.status === 'encerrada').length /
            tarefas.length) *
            100,
        )
      : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{projeto.nome}</h2>
          <p className="text-muted-foreground">{projeto.expand?.cliente_id?.razao_social}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm font-medium text-muted-foreground">Progresso</div>
            <div className="text-2xl font-bold">{progresso}%</div>
          </div>
          <Badge className="text-lg py-1">{projeto.status}</Badge>
        </div>
      </div>

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="docs">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Valor</CardTitle>
              </CardHeader>
              <CardContent className="text-xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  projeto.valor || 0,
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Data Início</CardTitle>
              </CardHeader>
              <CardContent className="text-xl font-bold">
                {projeto.data_inicio ? new Date(projeto.data_inicio).toLocaleDateString() : '-'}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Fim Planejado</CardTitle>
              </CardHeader>
              <CardContent className="text-xl font-bold">
                {projeto.data_fim_planejada
                  ? new Date(projeto.data_fim_planejada).toLocaleDateString()
                  : '-'}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">SLA Status</CardTitle>
              </CardHeader>
              <CardContent className="text-xl font-bold">
                {projeto.data_fim_planejada && new Date(projeto.data_fim_planejada) < new Date() ? (
                  <span className="text-red-500">Atrasado</span>
                ) : (
                  <span className="text-emerald-500">No Prazo</span>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tarefas do Projeto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tarefas.map((t) => {
                  const hasBlocks = t.bloqueada_por && t.bloqueada_por.length > 0
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div className="flex items-center space-x-3">
                        {hasBlocks && <Lock className="w-4 h-4 text-orange-500" />}
                        <div>
                          <div className="font-medium">{t.titulo}</div>
                          <div className="text-xs text-muted-foreground">
                            Planejado:{' '}
                            {t.data_vencimento_planejada
                              ? new Date(t.data_vencimento_planejada).toLocaleDateString()
                              : '-'}
                          </div>
                        </div>
                      </div>
                      <Badge variant={t.status === 'concluida' ? 'default' : 'secondary'}>
                        {t.status}
                      </Badge>
                    </div>
                  )
                })}
                {tarefas.length === 0 && (
                  <div className="text-sm text-muted-foreground">Nenhuma tarefa encontrada.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {arquivos.map((a) => (
                  <div key={a.id} className="p-4 border rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">{a.nome}</div>
                      <Button size="sm" variant="outline" onClick={() => gerarResumoIA(a.id)}>
                        Resumo por IA
                      </Button>
                    </div>
                    {a.resumo_ia && (
                      <div className="bg-muted p-3 rounded-md text-sm mt-2">
                        <strong>Resumo IA:</strong> {a.resumo_ia}
                      </div>
                    )}
                  </div>
                ))}
                {arquivos.length === 0 && (
                  <div className="text-sm text-muted-foreground">Nenhum documento anexado.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
