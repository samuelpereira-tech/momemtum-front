import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react'
import { signInWithEmailPassword, refreshToken, signOut, getCurrentUser, type User, type AuthResult } from '../../services/authService'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshAccessToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const USER_KEY = 'user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  const saveAuthData = (authResult: AuthResult) => {
    const token = authResult.accessToken || authResult.session?.accessToken
    const refresh = authResult.refreshToken || authResult.session?.refreshToken

    if (token && refresh && authResult.user) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token)
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
      localStorage.setItem(USER_KEY, JSON.stringify(authResult.user))
      setUser(authResult.user)
      setIsAuthenticated(true)
    }
  }

  const clearAuthData = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
    setIsAuthenticated(false)
  }

  const checkAndRefreshToken = async (accessToken: string | null, refreshTokenValue: string | null) => {
    if (!accessToken || !refreshTokenValue) {
      clearAuthData()
      return
    }

    try {
      // Tentar obter dados do usuário para verificar se o token ainda é válido
      await getCurrentUser(accessToken)
    } catch (error) {
      // Token expirado, tentar renovar
      try {
        const result = await refreshToken(refreshTokenValue)
        if (result.accessToken && result.refreshToken) {
          saveAuthData(result)
        } else {
          clearAuthData()
        }
      } catch (refreshError) {
        console.error('Erro ao renovar token:', refreshError)
        clearAuthData()
      }
    }
  }

  // Verificar se há tokens salvos no localStorage ao inicializar
  useEffect(() => {
    const initializeAuth = async () => {
      const savedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
      const savedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
      const savedUser = localStorage.getItem(USER_KEY)

      if (savedAccessToken && savedUser) {
        try {
          const userData = JSON.parse(savedUser)
          setUser(userData)
          setIsAuthenticated(true)
          
          // Verificar se o token está expirado e tentar renovar
          await checkAndRefreshToken(savedAccessToken, savedRefreshToken)
        } catch (error) {
          console.error('Erro ao restaurar sessão:', error)
          clearAuthData()
        }
      }
      
      setIsLoading(false)
    }

    initializeAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await signInWithEmailPassword(email, password)
      saveAuthData(result)
      return true
    } catch (error) {
      console.error('Erro no login:', error)
      return false
    }
  }

  const logout = async (): Promise<void> => {
    try {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (accessToken) {
        await signOut(accessToken)
      }
    } catch (error) {
      console.error('Erro no logout:', error)
    } finally {
      clearAuthData()
    }
  }

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    const refreshTokenValue = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!refreshTokenValue) {
      clearAuthData()
      return false
    }

    try {
      const result = await refreshToken(refreshTokenValue)
      saveAuthData(result)
      return true
    } catch (error) {
      console.error('Erro ao renovar token:', error)
      clearAuthData()
      return false
    }
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

