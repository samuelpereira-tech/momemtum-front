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
    // Tentar extrair mensagem de erro do response
    let errorMessage = `Erro HTTP ${response.status}`
    try {
      const errorData = await response.clone().json()
      if (errorData.message) {
        errorMessage = errorData.message
      } else if (errorData.error) {
        errorMessage = errorData.error
      }
    } catch {
      // Se não conseguir parsear JSON, usar mensagem padrão baseada no status
      const statusMessages: Record<number, string> = {
        400: 'Dados inválidos fornecidos',
        401: 'Não autorizado. Por favor, faça login novamente.',
        403: 'Acesso negado',
        404: 'Recurso não encontrado',
        409: 'Conflito: Esta operação não pode ser realizada porque o registro está sendo usado em outras partes do sistema.',
        422: 'Dados de validação inválidos',
        500: 'Erro interno do servidor',
      }
      errorMessage = statusMessages[response.status] || `Erro HTTP ${response.status}`
    }

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
              // Tentar extrair mensagem de erro do retry
              try {
                const retryErrorData = await retryResponse.clone().json()
                if (retryErrorData.message) {
                  throw new Error(retryErrorData.message)
                }
              } catch {
                // Ignorar erro de parsing
              }
              throw new Error(`HTTP error! status: ${retryResponse.status}`)
            }
            // Se for 204 No Content, retornar void
            if (retryResponse.status === 204) {
              return undefined as any
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
    
    throw new Error(errorMessage)
  }

  // Se for 204 No Content, retornar void
  if (response.status === 204) {
    return undefined as any
  }

  return response.json()
}

