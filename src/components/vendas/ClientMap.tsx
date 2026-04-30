import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { MapPin } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const STATE_COORDS: Record<string, { x: number; y: number }> = {
  AC: { x: 15, y: 30 },
  AL: { x: 25, y: 40 },
  AM: { x: 35, y: 25 },
  AP: { x: 35, y: 15 },
  BA: { x: 80, y: 40 },
  CE: { x: 75, y: 45 },
  DF: { x: 60, y: 50 },
  ES: { x: 85, y: 50 },
  GO: { x: 60, y: 55 },
  MA: { x: 65, y: 25 },
  MT: { x: 55, y: 55 },
  MS: { x: 45, y: 60 },
  MG: { x: 75, y: 65 },
  PA: { x: 60, y: 30 },
  PB: { x: 75, y: 35 },
  PR: { x: 70, y: 70 },
  PE: { x: 85, y: 35 },
  PI: { x: 82, y: 35 },
  RJ: { x: 80, y: 70 },
  RN: { x: 85, y: 38 },
  RS: { x: 60, y: 85 },
  RO: { x: 85, y: 32 },
  RR: { x: 35, y: 45 },
  SC: { x: 65, y: 80 },
  SP: { x: 70, y: 75 },
  SE: { x: 85, y: 30 },
  TO: { x: 45, y: 40 },
}

export function ClientMap({ clientes, onClientClick }: any) {
  const [hoveredClient, setHoveredClient] = useState<any>(null)

  const clientsWithLocation = useMemo(() => {
    return clientes
      .filter((c: any) => c.uf)
      .map((c: any) => {
        const baseCoord = STATE_COORDS[c.uf.toUpperCase()] || { x: 50, y: 50 }
        const offset = (Math.random() - 0.5) * 5
        return {
          ...c,
          coord: {
            x: Math.min(Math.max(baseCoord.x + offset, 5), 95),
            y: Math.min(Math.max(baseCoord.y + offset, 5), 95),
          },
        }
      })
  }, [clientes])

  return (
    <Card className="w-full h-[500px] relative overflow-hidden bg-blue-50/50 dark:bg-blue-950/10 border">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at center, #888 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur px-3 py-1.5 rounded-md border text-sm font-medium">
        Mapa de Clientes (Aproximado)
      </div>

      <TooltipProvider>
        {clientsWithLocation.map((client: any) => (
          <Tooltip key={client.id}>
            <TooltipTrigger asChild>
              <div
                className="absolute w-6 h-6 -ml-3 -mt-6 cursor-pointer transform hover:scale-125 transition-transform z-20 group"
                style={{ left: client.coord.x + '%', top: client.coord.y + '%' }}
                onClick={() => onClientClick(client)}
                onMouseEnter={() => setHoveredClient(client)}
                onMouseLeave={() => setHoveredClient(null)}
              >
                <MapPin
                  className={
                    'w-6 h-6 ' +
                    (client.status === 'inativo' ? 'text-gray-400' : 'text-red-500 drop-shadow-md')
                  }
                  fill="currentColor"
                />
                <div className="absolute top-0 w-6 h-6 animate-ping rounded-full bg-red-500 opacity-20" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="z-50">
              <div className="text-sm font-semibold">{client.razao_social}</div>
              <div className="text-xs text-muted-foreground">
                {client.cidade} - {client.uf}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </Card>
  )
}
