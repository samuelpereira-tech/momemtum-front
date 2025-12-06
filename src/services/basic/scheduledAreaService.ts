import { apiClient } from '../../utils/apiClient'

// DTOs baseados na documentação da API
export interface CreateScheduledAreaDto {
  name: string
  description?: string
  responsiblePersonId: string
  favorite?: boolean
}

export interface UpdateScheduledAreaDto {
  name?: string
  description?: string
  responsiblePersonId?: string
  favorite?: boolean
}

export interface ResponsiblePersonDto {
  id: string
  fullName: string
  email: string
  photoUrl?: string | null
}

export interface ScheduledAreaResponseDto {
  id: string
  name: string
  description: string | null
  responsiblePersonId: string
  responsiblePerson: ResponsiblePersonDto | null
  imageUrl: string | null
  favorite: boolean
  createdAt: string
  updatedAt: string
}

export interface PaginatedScheduledAreaResponseDto {
  data: ScheduledAreaResponseDto[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ImageUploadResponseDto {
  message: string
  imageUrl: string
  scheduledAreaId: string
}

export interface ScheduledAreaFilters {
  page?: number
  limit?: number
  favorite?: boolean
}

/**
 * Serviço para gerenciar áreas de escala
 */
export class ScheduledAreaService {
  private readonly baseEndpoint = '/api/scheduled-areas'

  /**
   * Cria uma nova área de escala
   */
  async createScheduledArea(data: CreateScheduledAreaDto): Promise<ScheduledAreaResponseDto> {
    return apiClient<ScheduledAreaResponseDto>(this.baseEndpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Lista todas as áreas de escala com paginação e filtros
   */
  async getAllScheduledAreas(filters: ScheduledAreaFilters = {}): Promise<PaginatedScheduledAreaResponseDto> {
    const queryParams = new URLSearchParams()
    
    if (filters.page) queryParams.append('page', filters.page.toString())
    if (filters.limit) queryParams.append('limit', filters.limit.toString())
    if (filters.favorite !== undefined) queryParams.append('favorite', filters.favorite.toString())

    const queryString = queryParams.toString()
    const url = queryString ? `${this.baseEndpoint}?${queryString}` : this.baseEndpoint
    
    return apiClient<PaginatedScheduledAreaResponseDto>(url)
  }

  /**
   * Obtém uma área de escala pelo ID
   */
  async getScheduledAreaById(id: string): Promise<ScheduledAreaResponseDto> {
    return apiClient<ScheduledAreaResponseDto>(`${this.baseEndpoint}/${id}`)
  }

  /**
   * Atualiza uma área de escala
   */
  async updateScheduledArea(id: string, data: UpdateScheduledAreaDto): Promise<ScheduledAreaResponseDto> {
    return apiClient<ScheduledAreaResponseDto>(`${this.baseEndpoint}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  /**
   * Deleta uma área de escala
   */
  async deleteScheduledArea(id: string): Promise<void> {
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
        throw new Error('Área não encontrada')
      }
      throw new Error(`Erro ao deletar área: ${response.status}`)
    }

    // DELETE retorna 204 (No Content)
    if (response.status !== 204) {
      return response.json()
    }
  }

  /**
   * Faz upload da imagem de uma área de escala
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
        throw new Error('Área não encontrada')
      }
      if (response.status === 413) {
        throw new Error('Arquivo muito grande. Tamanho máximo: 5MB')
      }
      throw new Error(`Erro ao fazer upload da imagem: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Remove a imagem de uma área de escala
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
        throw new Error('Área não encontrada ou imagem não existe')
      }
      throw new Error(`Erro ao deletar imagem: ${response.status}`)
    }

    // DELETE retorna 204 (No Content)
    if (response.status !== 204) {
      return response.json()
    }
  }

  /**
   * Alterna o status de favorito de uma área de escala
   */
  async toggleFavorite(id: string, favorite: boolean): Promise<ScheduledAreaResponseDto> {
    return apiClient<ScheduledAreaResponseDto>(`${this.baseEndpoint}/${id}/favorite`, {
      method: 'PATCH',
      body: JSON.stringify({ favorite }),
    })
  }
}

// Instância singleton do serviço
export const scheduledAreaService = new ScheduledAreaService()

