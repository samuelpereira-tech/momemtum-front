import { API_BASE_URL } from '../config/api'

const ACCESS_TOKEN_KEY = 'accessToken'

/**
 * Cliente HTTP para fazer requisições autenticadas
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Adicionar token de autorização se disponível
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    if (response.status === 401) {
      // Token expirado, tentar renovar
      const refreshTokenValue = localStorage.getItem('refreshToken')
      if (refreshTokenValue) {
        // Importação dinâmica para evitar dependência circular
        const { refreshToken } = await import('../services/authService')
        try {
          const result = await refreshToken(refreshTokenValue)
          if (result.accessToken) {
            localStorage.setItem(ACCESS_TOKEN_KEY, result.accessToken)
            if (result.refreshToken) {
              localStorage.setItem('refreshToken', result.refreshToken)
            }
            // Tentar novamente a requisição original
            headers['Authorization'] = `Bearer ${result.accessToken}`
            const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
              ...options,
              headers,
            })
            if (!retryResponse.ok) {
              throw new Error(`HTTP error! status: ${retryResponse.status}`)
            }
            return retryResponse.json()
          }
        } catch (refreshError) {
          // Se falhar ao renovar, limpar dados e redirecionar para login
          localStorage.removeItem(ACCESS_TOKEN_KEY)
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
          window.location.href = '/'
          throw new Error('Sessão expirada. Por favor, faça login novamente.')
        }
      }
    }
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

