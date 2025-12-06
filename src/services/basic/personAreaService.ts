import { apiClient } from '../../utils/apiClient'

// DTOs baseados na documentação da API
export interface CreatePersonAreaDto {
  personId: string
  responsibilityIds: string[]
}

export interface UpdatePersonAreaDto {
  responsibilityIds: string[]
}

export interface PersonInfoDto {
  id: string
  fullName: string
  email: string
  photoUrl: string | null
}

export interface ScheduledAreaDto {
  id: string
  name: string
}

export interface ResponsibilityInfoDto {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
}

export interface PersonAreaResponseDto {
  id: string
  personId: string
  person: PersonInfoDto | null
  scheduledAreaId: string
  scheduledArea: ScheduledAreaDto | null
  responsibilities: ResponsibilityInfoDto[]
  createdAt: string
  updatedAt: string
}

export interface PaginatedPersonAreaResponseDto {
  data: PersonAreaResponseDto[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface PersonAreaFilters {
  page?: number
  limit?: number
  personName?: string
  personEmail?: string
  responsibilityId?: string
}

/**
 * Serviço para gerenciar associações entre pessoas e áreas de escala
 */
export class PersonAreaService {
  private readonly baseEndpoint = '/api/scheduled-areas'

  /**
   * Adiciona uma pessoa a uma área de escala com responsabilidades
   */
  async addPersonToArea(
    scheduledAreaId: string,
    data: CreatePersonAreaDto
  ): Promise<PersonAreaResponseDto> {
    return apiClient<PersonAreaResponseDto>(
      `${this.baseEndpoint}/${scheduledAreaId}/persons`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )
  }

  /**
   * Lista todas as pessoas em uma área de escala com paginação e filtros
   */
  async getPersonsInArea(
    scheduledAreaId: string,
    filters: PersonAreaFilters = {}
  ): Promise<PaginatedPersonAreaResponseDto> {
    const queryParams = new URLSearchParams()

    if (filters.page) queryParams.append('page', filters.page.toString())
    if (filters.limit) queryParams.append('limit', filters.limit.toString())
    if (filters.personName) queryParams.append('personName', filters.personName)
    if (filters.personEmail) queryParams.append('personEmail', filters.personEmail)
    if (filters.responsibilityId) queryParams.append('responsibilityId', filters.responsibilityId)

    const queryString = queryParams.toString()
    const url = queryString
      ? `${this.baseEndpoint}/${scheduledAreaId}/persons?${queryString}`
      : `${this.baseEndpoint}/${scheduledAreaId}/persons`

    return apiClient<PaginatedPersonAreaResponseDto>(url)
  }

  /**
   * Obtém uma associação pessoa-área pelo ID da associação
   */
  async getPersonAreaById(
    scheduledAreaId: string,
    personAreaId: string
  ): Promise<PersonAreaResponseDto> {
    return apiClient<PersonAreaResponseDto>(
      `${this.baseEndpoint}/${scheduledAreaId}/persons/${personAreaId}`
    )
  }

  /**
   * Atualiza as responsabilidades de uma pessoa em uma área
   */
  async updatePersonArea(
    scheduledAreaId: string,
    personAreaId: string,
    data: UpdatePersonAreaDto
  ): Promise<PersonAreaResponseDto> {
    return apiClient<PersonAreaResponseDto>(
      `${this.baseEndpoint}/${scheduledAreaId}/persons/${personAreaId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    )
  }

  /**
   * Remove uma pessoa de uma área de escala
   */
  async removePersonFromArea(
    scheduledAreaId: string,
    personAreaId: string
  ): Promise<void> {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${this.baseEndpoint}/${scheduledAreaId}/persons/${personAreaId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      }
    )

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Não autorizado')
      }
      if (response.status === 404) {
        throw new Error('Associação pessoa-área não encontrada')
      }
      throw new Error(`Erro ao remover pessoa da área: ${response.status}`)
    }

    // DELETE retorna 204 (No Content)
    if (response.status !== 204) {
      return response.json()
    }
  }

  /**
   * Obtém uma associação pessoa-área pelo ID da pessoa
   */
  async getPersonAreaByPersonId(
    scheduledAreaId: string,
    personId: string
  ): Promise<PersonAreaResponseDto> {
    return apiClient<PersonAreaResponseDto>(
      `${this.baseEndpoint}/${scheduledAreaId}/persons/by-person/${personId}`
    )
  }
}

// Instância singleton do serviço
export const personAreaService = new PersonAreaService()

