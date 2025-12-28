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
  present: boolean | null
  createdAt: string
}

// Tipo para a resposta da API de logs
export interface ScheduleLogApiResponse {
  id: string
  scheduleId: string
  scheduleMemberId: string | null
  personId: string | null
  changeType: string
  oldValue: Record<string, any> | null
  newValue: Record<string, any> | null
  changedBy: string | null
  changedByPerson: string | null
  message?: string | null
  createdAt: string
}

export interface PaginatedScheduleLogResponse {
  data: ScheduleLogApiResponse[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ScheduleMemberLogDto {
  id: string
  scheduleId: string
  scheduleMemberId: string | null
  action: 'schedule_created' | 'schedule_updated' | 'schedule_status_changed' | 'schedule_datetime_changed' | 'schedule_start_date_changed' | 'schedule_end_date_changed' | 'member_added' | 'member_removed' | 'member_status_changed' | 'member_present_changed' | 'member_responsibility_changed' | 'team_changed' | 'team_member_status_changed'
  field?: string
  oldValue?: string | null
  newValue?: string | null
  description: string
  userId: string
  userName: string
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

export interface ParticipantInfoDto {
  id: string
  name: string
  imageUrl: string | null
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
  // A API pode retornar participantes como array de objetos (com id, name, imageUrl) ou array de strings (IDs)
  participants?: (ParticipantInfoDto | string)[]
  logs?: ScheduleMemberLogDto[]
  createdAt: string
  updatedAt: string
}

export interface ScheduleDetailsResponseDto extends ScheduleResponseDto {
  groups: GroupInfoDto[]
  team: TeamInfoDto | null
  assignments: ScheduleAssignmentResponseDto[]
  members: ScheduleMemberResponseDto[]
  comments: ScheduleCommentResponseDto[]
  logs?: ScheduleMemberLogDto[]
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

// Interface para pessoa na escala otimizada (estrutura da API)
export interface PersonInScheduleDto {
  name: string
  url: string | null
  role: string
  present: boolean | null
  status: 'pending' | 'accepted' | 'rejected'
}

// Interface para grupo na escala otimizada
export interface GroupInScheduleDto {
  id: string
  name: string
}

// Interface para escala otimizada
export interface ScheduleOptimizedResponseDto {
  id: string
  startDatetime: string
  endDatetime: string
  description?: string
  people: PersonInScheduleDto[]
  participants?: PersonInScheduleDto[] // Fallback para people
  groups: GroupInScheduleDto[] | string[]
}

// Interface para resposta paginada de escalas otimizadas
export interface PaginatedScheduleOptimizedResponseDto {
  data: ScheduleOptimizedResponseDto[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Interfaces raw para mapeamento (baseado no retorno JSON da API)
interface RawPersonDto {
  id: string
  full_name: string
  photo_url: string | null
}

interface RawResponsibilityDto {
  id: string
  name: string
  image_url: string | null
}

interface RawScheduleMemberDto {
  id: string
  person: RawPersonDto
  status: 'pending' | 'accepted' | 'rejected'
  present: boolean | null
  responsibility: RawResponsibilityDto
}

interface RawScheduleDto {
  id: string
  schedule_generation_id: string
  scheduled_area_id: string
  start_datetime: string
  end_datetime: string
  schedule_type: string
  status: string
  created_at: string
  updated_at: string
  schedule_members: RawScheduleMemberDto[]
}

interface PaginatedRawScheduleResponse {
  data: RawScheduleDto[]
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
   * Lista escalas otimizadas de uma área com participantes incluindo status e responsabilidade
   */
  async getSchedulesOptimized(
    scheduledAreaId: string,
    filters: ScheduleFilters = {}
  ): Promise<PaginatedScheduleOptimizedResponseDto> {
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
    const url = `${this.baseEndpoint}/${scheduledAreaId}/schedules/optimized${queryString ? `?${queryString}` : ''}`

    // Usar a resposta raw para garantir que mapeamos corretamente os campos
    const response = await apiClient<PaginatedRawScheduleResponse | PaginatedScheduleOptimizedResponseDto>(url, {
      method: 'GET',
    })

    // Função de verificação de tipo para saber se é Snake Case (Raw)
    const isRawResponse = (data: any): data is PaginatedRawScheduleResponse => {
      return data.data && data.data.length > 0 && 'start_datetime' in data.data[0]
    }

    if (isRawResponse(response)) {
      // Mapear de Snake Case para Camel Case
      const mappedData: ScheduleOptimizedResponseDto[] = response.data.map((rawSchedule) => {
        const people: PersonInScheduleDto[] = rawSchedule.schedule_members.map((member) => ({
          name: member.person.full_name,
          url: member.person.photo_url,
          role: member.responsibility?.name || '',
          present: member.present,
          status: member.status,
        }))

        return {
          id: rawSchedule.id,
          startDatetime: rawSchedule.start_datetime,
          endDatetime: rawSchedule.end_datetime,
          description: '', // Descrição não presente no raw response atual
          people: people,
          participants: people, // Fallback
          groups: [], // Groups não presente no raw response atual, pode precisar de ajuste se a API enviar
        }
      })

      return {
        data: mappedData,
        meta: response.meta
      }
    }

    // Se já vier no formato esperado (Camel Case), retornar direto
    return response as PaginatedScheduleOptimizedResponseDto
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

  /**
   * Busca os logs de uma escala
   */
  async getScheduleLogs(
    scheduledAreaId: string,
    scheduleId: string
  ): Promise<ScheduleMemberLogDto[]> {
    const response = await apiClient<PaginatedScheduleLogResponse>(
      `${this.baseEndpoint}/${scheduledAreaId}/schedules/${scheduleId}/logs`,
      {
        method: 'GET',
      }
    )

    // Função auxiliar para formatar datas
    const formatDateTime = (dateStr: string) => {
      const date = new Date(dateStr)
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    // Mapear os logs da API para o formato esperado pela UI
    return response.data.map((log) => {
      // Mapear changeType para action
      let action: ScheduleMemberLogDto['action'] = 'schedule_updated'
      if (log.changeType === 'schedule_status_changed') {
        action = 'schedule_status_changed'
      } else if (log.changeType === 'schedule_start_date_changed') {
        action = 'schedule_start_date_changed'
      } else if (log.changeType === 'schedule_end_date_changed') {
        action = 'schedule_end_date_changed'
      } else if (log.changeType === 'schedule_datetime_changed') {
        action = 'schedule_datetime_changed'
      } else if (log.changeType === 'member_added') {
        action = 'member_added'
      } else if (log.changeType === 'member_removed') {
        action = 'member_removed'
      } else if (log.changeType === 'member_status_changed') {
        action = 'member_status_changed'
      } else if (log.changeType === 'member_present_changed') {
        action = 'member_present_changed'
      } else if (log.changeType === 'member_responsibility_changed') {
        action = 'member_responsibility_changed'
      } else if (log.changeType === 'team_changed') {
        action = 'team_changed'
      } else if (log.changeType === 'team_member_status_changed') {
        action = 'team_member_status_changed'
      }

      // Usar message da API se disponível, caso contrário gerar descrição baseada no tipo de mudança
      const userName = log.changedByPerson || 'Sistema'
      let description = log.message || ''

      // Se não houver message da API, gerar descrição baseada no tipo de mudança (fallback)
      if (!description) {
        if (log.changeType === 'schedule_status_changed') {
          const oldStatus = log.oldValue?.status || 'desconhecido'
          const newStatus = log.newValue?.status || 'desconhecido'
          description = `Status da escala alterado de "${this.getStatusLabel(oldStatus)}" para "${this.getStatusLabel(newStatus)}"`
        } else if (log.changeType === 'schedule_start_date_changed') {
          const oldDate = log.oldValue?.startDatetime ? formatDateTime(log.oldValue.startDatetime) : 'desconhecido'
          const newDate = log.newValue?.startDatetime ? formatDateTime(log.newValue.startDatetime) : 'desconhecido'
          description = `Data de início alterada de "${oldDate}" para "${newDate}"`
        } else if (log.changeType === 'schedule_end_date_changed') {
          const oldDate = log.oldValue?.endDatetime ? formatDateTime(log.oldValue.endDatetime) : 'desconhecido'
          const newDate = log.newValue?.endDatetime ? formatDateTime(log.newValue.endDatetime) : 'desconhecido'
          description = `Data de fim alterada de "${oldDate}" para "${newDate}"`
        } else if (log.changeType === 'schedule_datetime_changed') {
          description = 'Data e hora da escala foram alteradas'
        } else if (log.changeType === 'member_added') {
          description = 'Membro adicionado à escala'
        } else if (log.changeType === 'member_removed') {
          description = 'Membro removido da escala'
        } else if (log.changeType === 'member_status_changed') {
          const oldStatus = log.oldValue?.status || 'desconhecido'
          const newStatus = log.newValue?.status || 'desconhecido'
          description = `Status do membro alterado de "${this.getMemberStatusLabel(oldStatus)}" para "${this.getMemberStatusLabel(newStatus)}"`
        } else if (log.changeType === 'member_present_changed') {
          const oldPresent = log.oldValue?.present !== undefined ? (log.oldValue.present ? 'Presente' : 'Ausente') : 'Não definido'
          const newPresent = log.newValue?.present !== undefined ? (log.newValue.present ? 'Presente' : 'Ausente') : 'Não definido'
          description = `Presença do membro alterada de "${oldPresent}" para "${newPresent}"`
        } else if (log.changeType === 'member_responsibility_changed') {
          description = 'Função do membro foi alterada'
        } else if (log.changeType === 'team_changed') {
          description = 'Equipe da escala foi alterada'
        } else if (log.changeType === 'team_member_status_changed') {
          description = 'Status de membro da equipe foi alterado'
        } else {
          description = `Alteração: ${log.changeType}`
        }
      }

      return {
        id: log.id,
        scheduleId: log.scheduleId,
        scheduleMemberId: log.scheduleMemberId,
        action,
        oldValue: log.oldValue ? JSON.stringify(log.oldValue) : null,
        newValue: log.newValue ? JSON.stringify(log.newValue) : null,
        description,
        userId: log.changedBy || log.personId || '',
        userName,
        createdAt: log.createdAt,
      }
    })
  }

  private getStatusLabel(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'Confirmado'
      case 'cancelled':
        return 'Cancelado'
      case 'pending':
        return 'Pendente'
      default:
        return status
    }
  }

  private getMemberStatusLabel(status: string): string {
    switch (status) {
      case 'accepted':
        return 'Aceito'
      case 'rejected':
        return 'Rejeitado'
      case 'pending':
        return 'Pendente'
      default:
        return status
    }
  }
}

export const scheduleService = new ScheduleService()




