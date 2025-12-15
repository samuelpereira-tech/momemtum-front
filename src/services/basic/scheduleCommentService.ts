import { apiClient } from '../../utils/apiClient'

export interface CreateScheduleCommentDto {
  content: string
}

export interface UpdateScheduleCommentDto {
  content: string
}

export interface ScheduleCommentResponseDto {
  id: string
  content: string
  authorId: string
  authorName: string
  createdAt: string
  updatedAt: string
}

/**
 * Serviço para gerenciar comentários de escalas
 */
export class ScheduleCommentService {
  private readonly baseEndpoint = '/api/scheduled-areas'

  /**
   * Adiciona um comentário a uma escala
   */
  async addComment(
    scheduledAreaId: string,
    scheduleId: string,
    data: CreateScheduleCommentDto
  ): Promise<ScheduleCommentResponseDto> {
    return apiClient<ScheduleCommentResponseDto>(
      `${this.baseEndpoint}/${scheduledAreaId}/schedules/${scheduleId}/comments`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )
  }

  /**
   * Atualiza um comentário de uma escala
   */
  async updateComment(
    scheduledAreaId: string,
    scheduleId: string,
    commentId: string,
    data: UpdateScheduleCommentDto
  ): Promise<ScheduleCommentResponseDto> {
    return apiClient<ScheduleCommentResponseDto>(
      `${this.baseEndpoint}/${scheduledAreaId}/schedules/${scheduleId}/comments/${commentId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    )
  }

  /**
   * Remove um comentário de uma escala
   */
  async deleteComment(
    scheduledAreaId: string,
    scheduleId: string,
    commentId: string
  ): Promise<void> {
    return apiClient<void>(
      `${this.baseEndpoint}/${scheduledAreaId}/schedules/${scheduleId}/comments/${commentId}`,
      {
        method: 'DELETE',
      }
    )
  }
}

export const scheduleCommentService = new ScheduleCommentService()









