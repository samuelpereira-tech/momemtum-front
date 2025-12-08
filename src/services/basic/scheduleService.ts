import { apiClient } from '../../utils/apiClient'

// DTOs baseados na documentação da API
export interface CreateScheduleDto {
  scheduledAreaId: string
  startDatetime: string
  endDatetime: string
  scheduleType: 'group' | 'team' | 'individual'
  groupIds?: string[]
  teamId?: string
  assignments?: Array<{
    personId: string
    teamRoleId: string
  }>
  memberIds?: string[]
}

export interface UpdateScheduleDto {
  startDatetime?: string
  endDatetime?: string
  status?: 'pending' | 'confirmed' | 'cancelled'
}

export interface GroupInfoDto {
  id: string
  name: string
}

export interface TeamInfoDto {
  id: string
  name: string
}

export interface PersonInfoDto {
  id: string
  fullName: string
  email: string
  photoUrl: string | null
}

export interface ResponsibilityInfoDto {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
}

export interface TeamRoleInfoDto {
  id: string
  responsibilityId: string
  responsibilityName: string
  priority: number
  quantity: number
  isFree: boolean
}

export interface ScheduleAssignmentResponseDto {
  id: string
  personId: string
  person: PersonInfoDto | null
  teamRoleId: string
  teamRole: TeamRoleInfoDto | null
  createdAt: string
}

export interface ScheduleMemberResponseDto {
  id: string
  personId: string
  person: PersonInfoDto | null
  responsibilityId: string
  responsibility: ResponsibilityInfoDto | null
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

export interface ScheduleCommentResponseDto {
  id: string
  content: string
  authorId: string
  authorName: string
  createdAt: string
  updatedAt: string
}

export interface ScheduleResponseDto {
  id: string
  scheduleGenerationId: string | null
  scheduledAreaId: string
  startDatetime: string
  endDatetime: string
  scheduleType: 'group' | 'team' | 'individual'
  status: 'pending' | 'confirmed' | 'cancelled'
  participantsCount: number
  createdAt: string
  updatedAt: string
}

export interface ScheduleDetailsResponseDto extends ScheduleResponseDto {
  groups: GroupInfoDto[]
  team: TeamInfoDto | null
  assignments: ScheduleAssignmentResponseDto[]
  members: ScheduleMemberResponseDto[]
  comments: ScheduleCommentResponseDto[]
}

export interface PaginatedScheduleResponseDto {
  data: ScheduleResponseDto[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ScheduleFilters {
  page?: number
  limit?: number
  scheduleGenerationId?: string
  startDate?: string
  endDate?: string
  personId?: string
  groupId?: string
  teamId?: string
  status?: 'pending' | 'confirmed' | 'cancelled'
}

/**
 * Serviço para gerenciar escalas
 */
export class ScheduleService {
  private readonly baseEndpoint = '/api/scheduled-areas'

  /**
   * Lista escalas de uma área com filtros
   */
  async getSchedules(
    scheduledAreaId: string,
    filters: ScheduleFilters = {}
  ): Promise<PaginatedScheduleResponseDto> {
    const params = new URLSearchParams()
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.scheduleGenerationId) params.append('scheduleGenerationId', filters.scheduleGenerationId)
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    if (filters.personId) params.append('personId', filters.personId)
    if (filters.groupId) params.append('groupId', filters.groupId)
    if (filters.teamId) params.append('teamId', filters.teamId)
    if (filters.status) params.append('status', filters.status)

    const queryString = params.toString()
    const url = `${this.baseEndpoint}/${scheduledAreaId}/schedules${queryString ? `?${queryString}` : ''}`

    return apiClient<PaginatedScheduleResponseDto>(url, {
      method: 'GET',
    })
  }

  /**
   * Cria uma escala manual
   */
  async createSchedule(
    scheduledAreaId: string,
    data: CreateScheduleDto
  ): Promise<ScheduleResponseDto> {
    return apiClient<ScheduleResponseDto>(
      `${this.baseEndpoint}/${scheduledAreaId}/schedules`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )
  }

  /**
   * Busca uma escala específica por ID com todos os detalhes
   */
  async getScheduleById(
    scheduledAreaId: string,
    scheduleId: string
  ): Promise<ScheduleDetailsResponseDto> {
    return apiClient<ScheduleDetailsResponseDto>(
      `${this.baseEndpoint}/${scheduledAreaId}/schedules/${scheduleId}`,
      {
        method: 'GET',
      }
    )
  }

  /**
   * Atualiza uma escala
   */
  async updateSchedule(
    scheduledAreaId: string,
    scheduleId: string,
    data: UpdateScheduleDto
  ): Promise<ScheduleDetailsResponseDto> {
    return apiClient<ScheduleDetailsResponseDto>(
      `${this.baseEndpoint}/${scheduledAreaId}/schedules/${scheduleId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    )
  }

  /**
   * Deleta uma escala (apenas escalas manuais)
   */
  async deleteSchedule(
    scheduledAreaId: string,
    scheduleId: string
  ): Promise<void> {
    return apiClient<void>(
      `${this.baseEndpoint}/${scheduledAreaId}/schedules/${scheduleId}`,
      {
        method: 'DELETE',
      }
    )
  }
}

export const scheduleService = new ScheduleService()



