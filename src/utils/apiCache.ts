/**
 * Cache simples em memória para evitar chamadas duplicadas de API
 * Funciona bem com React StrictMode
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  promise?: Promise<T>
}

const cache = new Map<string, CacheEntry<any>>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

/**
 * Executa uma função assíncrona com cache, evitando chamadas duplicadas
 */
export async function withCache<T>(
  key: string,
  loader: () => Promise<T>,
  options?: { cacheDuration?: number; skipCache?: boolean }
): Promise<T> {
  const { cacheDuration = CACHE_DURATION, skipCache = false } = options || {}
  const now = Date.now()

  // Verificar cache
  if (!skipCache) {
    const cached = cache.get(key)
    if (cached) {
      // Se tem dados válidos no cache, retornar
      if (cached.data && (now - cached.timestamp) < cacheDuration) {
        return cached.data
      }
      
      // Se tem uma promise em andamento, aguardar ela
      if (cached.promise) {
        return cached.promise
      }
    }
  }

  // Criar nova promise
  const promise = loader()

  // Armazenar promise no cache para evitar requisições duplicadas
  cache.set(key, {
    data: null,
    timestamp: 0,
    promise
  })

  try {
    const result = await promise
    
    // Atualizar cache com resultado
    cache.set(key, {
      data: result,
      timestamp: now,
    })

    return result
  } catch (error) {
    // Remover do cache em caso de erro
    cache.delete(key)
    throw error
  }
}

/**
 * Limpa o cache para uma chave específica
 */
export function clearCache(key: string): void {
  cache.delete(key)
}

/**
 * Limpa todo o cache
 */
export function clearAllCache(): void {
  cache.clear()
}
















