import { apiClient } from '../../utils/apiClient'

// DTOs baseados na documentação da API
export interface CreateScheduledAbsenceDto {
  personId: string
  absenceTypeId: string
  startDate: string // ISO 8601 format (YYYY-MM-DD)
  endDate: string // ISO 8601 format (YYYY-MM-DD)
  description?: string
}

export interface UpdateScheduledAbsenceDto {
  personId?: string
  absenceTypeId?: string
  startDate?: string
  endDate?: string
  description?: string
}

export interface PersonInfoDto {
  id: string
  fullName: string
  email: string
}

export interface AbsenceTypeInfoDto {
  id: string
  name: string
  color: string
}

export interface ScheduledAbsenceResponseDto {
  id: string
  personId: string
  person?: PersonInfoDto
  absenceTypeId: string
  absenceType?: AbsenceTypeInfoDto
  startDate: string
  endDate: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface PaginatedScheduledAbsenceResponseDto {
  data: ScheduledAbsenceResponseDto[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ScheduledAbsenceFilters {
  page?: number
  limit?: number
  personId?: string
  personName?: string
  absenceTypeId?: string
  startDate?: string
  endDate?: string
  dateRange?: string // Format: YYYY-MM-DD,YYYY-MM-DD
}

/**
 * Serviço para gerenciar ausências programadas
 */
export class ScheduledAbsenceService {
  private readonly baseEndpoint = '/api/scheduled-absences'

  /**
   * Cria uma nova ausência programada
   */
  async createScheduledAbsence(data: CreateScheduledAbsenceDto): Promise<ScheduledAbsenceResponseDto> {
    return apiClient<ScheduledAbsenceResponseDto>(this.baseEndpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Lista todas as ausências programadas com paginação e filtros
   */
  async getAllScheduledAbsences(filters: ScheduledAbsenceFilters = {}): Promise<PaginatedScheduledAbsenceResponseDto> {
    const queryParams = new URLSearchParams()
    
    if (filters.page) queryParams.append('page', filters.page.toString())
    if (filters.limit) queryParams.append('limit', filters.limit.toString())
    if (filters.personId) queryParams.append('personId', filters.personId)
    if (filters.personName) queryParams.append('personName', filters.personName)
    if (filters.absenceTypeId) queryParams.append('absenceTypeId', filters.absenceTypeId)
    if (filters.startDate) queryParams.append('startDate', filters.startDate)
    if (filters.endDate) queryParams.append('endDate', filters.endDate)
    if (filters.dateRange) queryParams.append('dateRange', filters.dateRange)

    const queryString = queryParams.toString()
    const url = queryString ? `${this.baseEndpoint}?${queryString}` : this.baseEndpoint
    
    return apiClient<PaginatedScheduledAbsenceResponseDto>(url)
  }

  /**
   * Obtém uma ausência programada pelo ID
   */
  async getScheduledAbsenceById(id: string): Promise<ScheduledAbsenceResponseDto> {
    return apiClient<ScheduledAbsenceResponseDto>(`${this.baseEndpoint}/${id}`)
  }

  /**
   * Atualiza uma ausência programada
   */
  async updateScheduledAbsence(id: string, data: UpdateScheduledAbsenceDto): Promise<ScheduledAbsenceResponseDto> {
    return apiClient<ScheduledAbsenceResponseDto>(`${this.baseEndpoint}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  /**
   * Deleta uma ausência programada
   */
  async deleteScheduledAbsence(id: string): Promise<void> {
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
        throw new Error('Ausência programada não encontrada')
      }
      throw new Error(`Erro ao deletar ausência programada: ${response.status}`)
    }

    // DELETE retorna 200 com mensagem
    if (response.status !== 200) {
      return response.json()
    }
  }
}

// Instância singleton do serviço
export const scheduledAbsenceService = new ScheduledAbsenceService()


















