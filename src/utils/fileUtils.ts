/**
 * Utilitários para manipulação de arquivos
 */

/**
 * Valida se um arquivo é uma imagem
 * @param file - Arquivo a ser validado
 * @returns true se for uma imagem, false caso contrário
 */
export const isValidImageFile = (file: File): boolean => {
  return file.type.startsWith('image/')
}

/**
 * Valida o tamanho de um arquivo
 * @param file - Arquivo a ser validado
 * @param maxSizeMB - Tamanho máximo em MB (padrão: 5MB)
 * @returns true se o tamanho for válido, false caso contrário
 */
export const isValidFileSize = (file: File, maxSizeMB: number = 5): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * Cria uma URL de preview para uma imagem usando FileReader
 * @param file - Arquivo de imagem
 * @returns Promise que resolve com a URL do preview (data URL)
 */
export const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      resolve(reader.result as string)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Valida um arquivo de imagem (tipo e tamanho)
 * @param file - Arquivo a ser validado
 * @param maxSizeMB - Tamanho máximo em MB (padrão: 5MB)
 * @returns Objeto com isValid e errorMessage (se houver erro)
 */
export const validateImageFile = (
  file: File,
  maxSizeMB: number = 5
): { isValid: boolean; errorMessage?: string } => {
  if (!isValidImageFile(file)) {
    return {
      isValid: false,
      errorMessage: 'Por favor, selecione apenas arquivos de imagem',
    }
  }

  if (!isValidFileSize(file, maxSizeMB)) {
    return {
      isValid: false,
      errorMessage: `A imagem deve ter no máximo ${maxSizeMB}MB`,
    }
  }

  return { isValid: true }
}

/**
 * Adiciona cache-busting a uma URL
 * @param url - URL original
 * @returns URL com timestamp para forçar atualização
 */
export const addCacheBusting = (url: string): string => {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}_t=${Date.now()}`
}

