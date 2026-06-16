import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface AuthContextValue {
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  getSecurityQuestion: (username: string) => Promise<{ success: boolean; question?: string; error?: string }>
  verifySecurityAnswer: (username: string, answer: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const result = await window.ipcRenderer.invoke('auth:login', { username, password })
    if (result.success) {
      setIsAuthenticated(true)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    setIsAuthenticated(false)
  }, [])

  const getSecurityQuestion = useCallback(async (username: string) => {
    const result = await window.ipcRenderer.invoke('auth:getSecurityQuestion', { username })
    return result as { success: boolean; question?: string; error?: string }
  }, [])

  const verifySecurityAnswer = useCallback(async (username: string, answer: string): Promise<boolean> => {
    const result = await window.ipcRenderer.invoke('auth:verifySecurityAnswer', { username, answer })
    if (result.success) {
      setIsAuthenticated(true)
      return true
    }
    return false
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, getSecurityQuestion, verifySecurityAnswer }}>
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
