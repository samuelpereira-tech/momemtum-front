import { apiClient } from '../../utils/apiClient'

// DTOs baseados na documentação da API
export interface CreateTeamRoleDto {
  responsibilityId: string
  quantity: number
  priority: number
  isFree?: boolean
  fixedPersonIds?: string[]
}

export interface UpdateTeamRoleDto {
  id?: string
  responsibilityId?: string
  quantity?: number
  priority?: number
  isFree?: boolean
  fixedPersonIds?: string[]
}

export interface TeamRoleDto {
  id: string
  responsibilityId: string
  responsibilityName: string
  quantity: number
  priority: number
  isFree: boolean
  fixedPersonIds: string[]
}

export interface CreateTeamDto {
  name: string
  description?: string
  scheduledAreaId: string
  roles?: CreateTeamRoleDto[]
}

export interface UpdateTeamDto {
  name?: string
  description?: string
  roles?: UpdateTeamRoleDto[]
}

export interface ScheduledAreaDto {
  id: string
  name: string
}

export interface TeamResponseDto {
  id: string
  name: string
  description: string | null
  scheduledAreaId: string
  scheduledArea: ScheduledAreaDto | null
  roles: TeamRoleDto[]
  createdAt: string
  updatedAt: string
}

export interface PaginatedTeamResponseDto {
  data: TeamResponseDto[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface TeamFilters {
  page?: number
  limit?: number
  name?: string
}

/**
 * Serviço para gerenciar equipes dentro de áreas de escala
 */
export class TeamService {
  private readonly baseEndpoint = '/api/scheduled-areas'

  /**
   * Cria uma nova equipe em uma área de escala
   */
  async createTeam(
    scheduledAreaId: string,
    data: CreateTeamDto
  ): Promise<TeamResponseDto> {
    return apiClient<TeamResponseDto>(
      `${this.baseEndpoint}/${scheduledAreaId}/teams`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )
  }

  /**
   * Lista todas as equipes em uma área de escala com paginação e filtros
   */
  async getTeamsInArea(
    scheduledAreaId: string,
    filters: TeamFilters = {}
  ): Promise<PaginatedTeamResponseDto> {
    const queryParams = new URLSearchParams()

    if (filters.page) queryParams.append('page', filters.page.toString())
    if (filters.limit) queryParams.append('limit', filters.limit.toString())
    if (filters.name) queryParams.append('name', filters.name)

    const queryString = queryParams.toString()
    const url = queryString
      ? `${this.baseEndpoint}/${scheduledAreaId}/teams?${queryString}`
      : `${this.baseEndpoint}/${scheduledAreaId}/teams`

    return apiClient<PaginatedTeamResponseDto>(url)
  }

  /**
   * Obtém uma equipe pelo ID
   */
  async getTeamById(
    scheduledAreaId: string,
    teamId: string
  ): Promise<TeamResponseDto> {
    return apiClient<TeamResponseDto>(
      `${this.baseEndpoint}/${scheduledAreaId}/teams/${teamId}`
    )
  }

  /**
   * Atualiza uma equipe
   */
  async updateTeam(
    scheduledAreaId: string,
    teamId: string,
    data: UpdateTeamDto
  ): Promise<TeamResponseDto> {
    return apiClient<TeamResponseDto>(
      `${this.baseEndpoint}/${scheduledAreaId}/teams/${teamId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    )
  }

  /**
   * Remove uma equipe
   */
  async deleteTeam(
    scheduledAreaId: string,
    teamId: string
  ): Promise<void> {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${this.baseEndpoint}/${scheduledAreaId}/teams/${teamId}`,
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
        throw new Error('Equipe não encontrada')
      }
      throw new Error(`Erro ao remover equipe: ${response.status}`)
    }

    // DELETE retorna 204 (No Content)
    if (response.status !== 204) {
      return response.json()
    }
  }
}

// Instância singleton do serviço
export const teamService = new TeamService()
