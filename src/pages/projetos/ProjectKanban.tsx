import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'

const COLUMNS = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'to_do', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Done' },
]

export default function ProjectKanban() {
  const { selectedEmpresaId } = useAuth()
  const [projetos, setProjetos] = useState<any[]>([])

  const fetchProjetos = async () => {
    if (!selectedEmpresaId) return
    try {
      const data = await pb.collection('projetos').getFullList({
        filter: `empresa_id="${selectedEmpresaId}"`,
        expand: 'cliente_id',
      })
      setProjetos(data)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    fetchProjetos()
  }, [selectedEmpresaId])

  const handleDrop = async (e: React.DragEvent, status: string) => {
    const id = e.dataTransfer.getData('text/plain')
    try {
      await pb.collection('projetos').update(id, { status })
      fetchProjetos()
    } catch {
      /* intentionally ignored */
    }
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Kanban de Projetos</h2>
        <p className="text-muted-foreground">Arraste os projetos para atualizar o status.</p>
      </div>
      <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colProjects = projetos.filter((p) => p.status === col.id)
          const totalValue = colProjects.reduce((acc, p) => acc + (p.valor || 0), 0)

          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-80 bg-muted/30 rounded-lg p-4 flex flex-col"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">{col.label}</h3>
                <Badge variant="secondary">{colProjects.length}</Badge>
              </div>
              <div className="text-xs text-muted-foreground mb-4">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  totalValue,
                )}
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto">
                {colProjects.map((p) => (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', p.id)}
                    className="bg-card border rounded-md p-3 cursor-grab active:cursor-grabbing hover:border-primary transition-colors"
                  >
                    <Link to={`/projetos/${p.id}`} className="block">
                      <div className="font-medium text-sm mb-1">{p.nome}</div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {p.expand?.cliente_id?.razao_social || 'Sem Cliente'}
                      </div>
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="text-[10px]">
                          {new Date(p.created).toLocaleDateString()}
                        </Badge>
                        <span className="text-xs font-medium text-emerald-500">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(p.valor || 0)}
                        </span>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
