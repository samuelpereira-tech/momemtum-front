import { apiClient } from '../../utils/apiClient'

// DTOs baseados na documentação da API
export interface CreateResponsibilityDto {
  name: string
  description?: string
  scheduledAreaId: string
}

export interface UpdateResponsibilityDto {
  name?: string
  description?: string
  scheduledAreaId?: string
  imageUrl?: string
}

export interface ScheduledAreaDto {
  id: string
  name: string
}

export interface ResponsibilityResponseDto {
  id: string
  name: string
  description: string | null
  scheduledAreaId: string
  scheduledArea: ScheduledAreaDto | null
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface PaginatedResponsibilityResponseDto {
  data: ResponsibilityResponseDto[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ResponsibilityFilters {
  page?: number
  limit?: number
  scheduledAreaId?: string
}

export interface ImageUploadResponseDto {
  message: string
  imageUrl: string
  responsibilityId: string
}

/**
 * Serviço para gerenciar responsabilidades (funções)
 */
export class ResponsibilityService {
  private readonly baseEndpoint = '/api/responsibilities'

  /**
   * Cria uma nova responsabilidade
   */
  async createResponsibility(data: CreateResponsibilityDto): Promise<ResponsibilityResponseDto> {
    return apiClient<ResponsibilityResponseDto>(this.baseEndpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Lista todas as responsabilidades com paginação e filtros
   */
  async getAllResponsibilities(filters: ResponsibilityFilters = {}): Promise<PaginatedResponsibilityResponseDto> {
    const queryParams = new URLSearchParams()
    
    if (filters.page) queryParams.append('page', filters.page.toString())
    if (filters.limit) queryParams.append('limit', filters.limit.toString())
    if (filters.scheduledAreaId) queryParams.append('scheduledAreaId', filters.scheduledAreaId)

    const queryString = queryParams.toString()
    const url = queryString ? `${this.baseEndpoint}?${queryString}` : this.baseEndpoint
    
    return apiClient<PaginatedResponsibilityResponseDto>(url)
  }

  /**
   * Obtém uma responsabilidade pelo ID
   */
  async getResponsibilityById(id: string): Promise<ResponsibilityResponseDto> {
    return apiClient<ResponsibilityResponseDto>(`${this.baseEndpoint}/${id}`)
  }

  /**
   * Atualiza uma responsabilidade
   */
  async updateResponsibility(id: string, data: UpdateResponsibilityDto): Promise<ResponsibilityResponseDto> {
    return apiClient<ResponsibilityResponseDto>(`${this.baseEndpoint}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  /**
   * Deleta uma responsabilidade
   */
  async deleteResponsibility(id: string): Promise<void> {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${this.baseEndpoint}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Não autorizado')
      }
      if (response.status === 404) {
        throw new Error('Responsabilidade não encontrada')
      }
      throw new Error(`Erro ao deletar responsabilidade: ${response.status}`)
    }

    // DELETE retorna 204 (No Content)
    if (response.status !== 204) {
      return response.json()
    }
  }

  /**
   * Faz upload da imagem de uma responsabilidade
   */
  async uploadImage(id: string, imageFile: File): Promise<ImageUploadResponseDto> {
    const formData = new FormData()
    formData.append('image', imageFile)

    const accessToken = localStorage.getItem('accessToken')
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${this.baseEndpoint}/${id}/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    })

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error('Formato de arquivo inválido ou tamanho excede 5MB')
      }
      if (response.status === 401) {
        throw new Error('Não autorizado')
      }
      if (response.status === 404) {
        throw new Error('Responsabilidade não encontrada')
      }
      if (response.status === 413) {
        throw new Error('Arquivo muito grande. Tamanho máximo: 5MB')
      }
      throw new Error(`Erro ao fazer upload da imagem: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Remove a imagem de uma responsabilidade
   */
  async deleteImage(id: string): Promise<void> {
    const accessToken = localStorage.getItem('accessToken')
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${this.baseEndpoint}/${id}/image`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Não autorizado')
      }
      if (response.status === 404) {
        throw new Error('Responsabilidade não encontrada ou imagem não existe')
      }
      throw new Error(`Erro ao deletar imagem: ${response.status}`)
    }

    // DELETE retorna 204 (No Content)
  }
}

// Instância singleton do serviço
export const responsibilityService = new ResponsibilityService()

