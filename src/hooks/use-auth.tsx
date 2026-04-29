import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'

interface AuthContextType {
  user: any
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  registerWorkspace: (data: any) => Promise<{ error: any }>
  signOut: () => void
  loading: boolean
  selectedEmpresaId: string | null
  setSelectedEmpresaId: (id: string | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(pb.authStore.record)
  const [loading, setLoading] = useState(true)
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string | null>(null)

  useEffect(() => {
    if (pb.authStore.record?.empresa_id && !selectedEmpresaId) {
      setSelectedEmpresaId(pb.authStore.record.empresa_id)
    }
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(record)
      if (record?.empresa_id) {
        setSelectedEmpresaId(record.empresa_id)
      }
    })
    setLoading(false)
    return () => {
      unsubscribe()
    }
  }, [selectedEmpresaId])

  const signUp = async (email: string, password: string) => {
    try {
      await pb.collection('users').create({ email, password, passwordConfirm: password })
      await pb.collection('users').authWithPassword(email, password)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      await pb.collection('users').authWithPassword(email, password)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const registerWorkspace = async (data: any) => {
    try {
      await pb.send('/backend/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return await signIn(data.email, data.password)
    } catch (error) {
      return { error }
    }
  }

  const signOut = () => {
    pb.authStore.clear()
    setSelectedEmpresaId(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        signUp,
        signIn,
        registerWorkspace,
        signOut,
        loading,
        selectedEmpresaId,
        setSelectedEmpresaId,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
