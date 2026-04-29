import { useLocation, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname)
  }, [location.pathname])

  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center">
      <h1 className="text-6xl font-bold mb-4 text-primary">404</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Ops! A página que você tentou acessar não foi encontrada.
      </p>
      <Button asChild>
        <Link to="/">Voltar ao Início</Link>
      </Button>
    </div>
  )
}

export default NotFound
