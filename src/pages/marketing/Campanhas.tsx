import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Megaphone, ExternalLink, Plus } from 'lucide-react'

export default function Campanhas() {
  const { selectedEmpresaId } = useAuth()
  const [campanhas, setCampanhas] = useState<any[]>([])

  useEffect(() => {
    const fetchCampanhas = async () => {
      if (!selectedEmpresaId) return
      try {
        const data = await pb.collection('campanhas_ads').getFullList({
          filter: `empresa_id = "${selectedEmpresaId}"`,
        })
        setCampanhas(data)
      } catch (e) {
        console.error(e)
      }
    }
    fetchCampanhas()
  }, [selectedEmpresaId])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Campanhas (Marketing)</h2>
          <p className="text-muted-foreground">
            Gerencie suas campanhas ativas e integração com ads.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nova Campanha
        </Button>
      </div>

      {campanhas.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg text-muted-foreground">
          <Megaphone className="h-10 w-10 mb-4 opacity-50" />
          <p>Nenhuma campanha configurada no momento.</p>
        </div>
      ) : (
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
                </div>
                <Button variant="outline" className="w-full">
                  Ver Estatísticas <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
