import { apiClient } from '../../utils/apiClient'
import type { ScheduleMemberResponseDto } from './scheduleService'

export interface CreateScheduleMemberDto {
  personId: string
  responsibilityId: string
}

export interface UpdateScheduleMemberDto {
  responsibilityId?: string
  status?: 'pending' | 'accepted' | 'rejected'
}

/**
 * Serviço para gerenciar membros de escalas
 */
export class ScheduleMemberService {
  private readonly baseEndpoint = '/api/scheduled-areas'

  /**
   * Adiciona um membro a uma escala
   */
  async addMember(
    scheduledAreaId: string,
    scheduleId: string,
    data: CreateScheduleMemberDto
  ): Promise<ScheduleMemberResponseDto> {
    return apiClient<ScheduleMemberResponseDto>(
      `${this.baseEndpoint}/${scheduledAreaId}/schedules/${scheduleId}/members`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )
  }

  /**
   * Atualiza um membro de uma escala
   */
  async updateMember(
    scheduledAreaId: string,
    scheduleId: string,
    memberId: string,
    data: UpdateScheduleMemberDto
  ): Promise<ScheduleMemberResponseDto> {
    return apiClient<ScheduleMemberResponseDto>(
      `${this.baseEndpoint}/${scheduledAreaId}/schedules/${scheduleId}/members/${memberId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    )
  }

  /**
   * Remove um membro de uma escala
   */
  async removeMember(
    scheduledAreaId: string,
    scheduleId: string,
    memberId: string
  ): Promise<void> {
    return apiClient<void>(
      `${this.baseEndpoint}/${scheduledAreaId}/schedules/${scheduleId}/members/${memberId}`,
      {
        method: 'DELETE',
      }
    )
  }
}

export const scheduleMemberService = new ScheduleMemberService()



