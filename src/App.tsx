import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/hooks/use-auth'

import Layout from './components/Layout'
import Login from './pages/Login'
import Index from './pages/Index'
import Leads from './pages/vendas/Leads'
import Clientes from './pages/vendas/Clientes'
import Tarefas from './pages/projetos/Tarefas'
import Campanhas from './pages/marketing/Campanhas'
import NotFound from './pages/NotFound'

const App = () => (
  <ThemeProvider defaultTheme="dark" attribute="class">
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/vendas/leads" element={<Leads />} />
              <Route path="/vendas/clientes" element={<Clientes />} />
              <Route path="/projetos/tarefas" element={<Tarefas />} />
              <Route path="/marketing/campanhas" element={<Campanhas />} />
              {/* Fallback to NotFound inside Layout for generic unmatched protected routes */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
)

export default App
