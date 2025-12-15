import { apiClient } from '../../utils/apiClient'

// DTOs baseados na documentação da API
export interface CreateAbsenceTypeDto {
  name: string
  description?: string
  color?: string // Hex color code (format: #RRGGBB)
  active?: boolean
}

export interface UpdateAbsenceTypeDto {
  name?: string
  description?: string
  color?: string
  active?: boolean
}

export interface AbsenceTypeResponseDto {
  id: string
  name: string
  description: string | null
  color: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface PaginatedAbsenceTypeResponseDto {
  data: AbsenceTypeResponseDto[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface AbsenceTypeFilters {
  page?: number
  limit?: number
  name?: string
  active?: boolean
}

/**
 * Serviço para gerenciar tipos de ausência
 */
export class AbsenceTypeService {
  private readonly baseEndpoint = '/api/absence-types'

  /**
   * Cria um novo tipo de ausência
   */
  async createAbsenceType(data: CreateAbsenceTypeDto): Promise<AbsenceTypeResponseDto> {
    return apiClient<AbsenceTypeResponseDto>(this.baseEndpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Lista todos os tipos de ausência com paginação e filtros
   */
  async getAllAbsenceTypes(filters: AbsenceTypeFilters = {}): Promise<PaginatedAbsenceTypeResponseDto> {
    const queryParams = new URLSearchParams()
    
    if (filters.page) queryParams.append('page', filters.page.toString())
    if (filters.limit) queryParams.append('limit', filters.limit.toString())
    if (filters.name) queryParams.append('name', filters.name)
    if (filters.active !== undefined) queryParams.append('active', filters.active.toString())

    const queryString = queryParams.toString()
    const url = queryString ? `${this.baseEndpoint}?${queryString}` : this.baseEndpoint
    
    return apiClient<PaginatedAbsenceTypeResponseDto>(url)
  }

  /**
   * Obtém um tipo de ausência pelo ID
   */
  async getAbsenceTypeById(id: string): Promise<AbsenceTypeResponseDto> {
    return apiClient<AbsenceTypeResponseDto>(`${this.baseEndpoint}/${id}`)
  }

  /**
   * Atualiza um tipo de ausência
   */
  async updateAbsenceType(id: string, data: UpdateAbsenceTypeDto): Promise<AbsenceTypeResponseDto> {
    return apiClient<AbsenceTypeResponseDto>(`${this.baseEndpoint}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  /**
   * Deleta um tipo de ausência
   */
  async deleteAbsenceType(id: string): Promise<void> {
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
        throw new Error('Tipo de ausência não encontrado')
      }
      if (response.status === 409) {
        throw new Error('Não é possível excluir tipo de ausência que está sendo usado por ausências programadas')
      }
      throw new Error(`Erro ao deletar tipo de ausência: ${response.status}`)
    }

    // DELETE retorna 200 com mensagem
    if (response.status !== 200) {
      return response.json()
    }
  }

  /**
   * Alterna o status ativo/inativo de um tipo de ausência
   */
  async toggleAbsenceType(id: string): Promise<AbsenceTypeResponseDto> {
    return apiClient<AbsenceTypeResponseDto>(`${this.baseEndpoint}/${id}/toggle`, {
      method: 'PATCH',
    })
  }
}

// Instância singleton do serviço
export const absenceTypeService = new AbsenceTypeService()






















