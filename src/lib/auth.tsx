import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface AuthContextValue {
  isAuthenticated: boolean
  login: (username: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const HARDCODED_USERNAME = 'admin'
const HARDCODED_PASSWORD = '0000'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const login = useCallback((username: string, password: string): boolean => {
    if (username === HARDCODED_USERNAME && password === HARDCODED_PASSWORD) {
      setIsAuthenticated(true)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    setIsAuthenticated(false)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>')
  }
  return ctx
}
