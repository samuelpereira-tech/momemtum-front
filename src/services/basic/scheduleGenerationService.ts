import { apiClient } from '../../utils/apiClient'
import type { GenerationConfiguration, GenerationPreview } from '../../app/routes/admin/DetalhesArea/GeracaoAutomatica/types'

// DTOs baseados na documentação da API
export interface GenerationConfigurationDto {
  scheduledAreaId: string
  generationType: 'group' | 'people' | 'team_without_restriction' | 'team_with_restriction'
  periodType: 'fixed' | 'monthly' | 'weekly' | 'daily'
  periodStartDate: string
  periodEndDate: string
  groupConfig?: {
    groupIds: string[]
    groupsPerSchedule: number
    distributionOrder: 'sequential' | 'random' | 'balanced'
    considerAbsences: boolean
    excludedPersonIds?: string[]
  }
  peopleConfig?: {
    excludedPersonIds?: string[]
    considerAbsences: boolean
  }
  teamConfig?: {
    teamId: string
    participantSelection: 'all' | 'by_group' | 'individual' | 'all_with_exclusions'
    selectedGroupIds?: string[]
    selectedPersonIds?: string[]
    excludedPersonIds?: string[]
    considerAbsences: boolean
    requireResponsibilities: boolean
    repeatPersonsWhenInsufficient?: boolean
  }
  periodConfig?: {
    baseDateTime?: string
    duration?: number
    interval?: number
    weekdays?: number[]
    startTime?: string
    endTime?: string
    excludedDates?: string[]
    includedDates?: string[]
  }
}

export interface ScheduleGenerationResponseDto {
  id: string
  scheduledAreaId: string
  generationType: 'group' | 'people' | 'team_without_restriction' | 'team_with_restriction'
  periodType: 'fixed' | 'monthly' | 'weekly' | 'daily'
  periodStartDate: string
  periodEndDate: string
  configuration: Record<string, any>
  totalSchedulesGenerated: number
  createdAt: string
  createdBy: string | null
}

export interface PaginatedScheduleGenerationResponseDto {
  data: ScheduleGenerationResponseDto[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ScheduleGenerationFilters {
  page?: number
  limit?: number
}

/**
 * Serviço para gerenciar gerações automáticas de escalas
 */
export class ScheduleGenerationService {
  private readonly baseEndpoint = '/api/scheduled-areas'

  /**
   * Converte GenerationConfiguration para GenerationConfigurationDto
   */
  private convertToDto(config: GenerationConfiguration): GenerationConfigurationDto {
    return {
      scheduledAreaId: config.scheduledAreaId,
      generationType: config.generationType,
      periodType: config.periodType,
      periodStartDate: config.periodStartDate,
      periodEndDate: config.periodEndDate,
      groupConfig: config.groupConfig,
      peopleConfig: config.peopleConfig,
      teamConfig: config.teamConfig,
      periodConfig: config.periodConfig,
    }
  }

  /**
   * Gera preview das escalas que serão criadas
   */
  async generatePreview(
    scheduledAreaId: string,
    config: GenerationConfiguration
  ): Promise<GenerationPreview> {
    const dto = this.convertToDto(config)
    return apiClient<GenerationPreview>(
      `${this.baseEndpoint}/${scheduledAreaId}/schedule-generations/preview`,
      {
        method: 'POST',
        body: JSON.stringify(dto),
      }
    )
  }

  /**
   * Confirma e cria a geração de escalas
   */
  async createGeneration(
    scheduledAreaId: string,
    config: GenerationConfiguration
  ): Promise<ScheduleGenerationResponseDto> {
    const dto = this.convertToDto(config)
    return apiClient<ScheduleGenerationResponseDto>(
      `${this.baseEndpoint}/${scheduledAreaId}/schedule-generations`,
      {
        method: 'POST',
        body: JSON.stringify(dto),
      }
    )
  }

  /**
   * Lista todas as gerações de escalas de uma área
   */
  async getGenerations(
    scheduledAreaId: string,
    filters: ScheduleGenerationFilters = {}
  ): Promise<PaginatedScheduleGenerationResponseDto> {
    const params = new URLSearchParams()
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    const queryString = params.toString()
    const url = `${this.baseEndpoint}/${scheduledAreaId}/schedule-generations${queryString ? `?${queryString}` : ''}`

    return apiClient<PaginatedScheduleGenerationResponseDto>(url, {
      method: 'GET',
    })
  }

  /**
   * Busca uma geração específica por ID
   */
  async getGenerationById(
    scheduledAreaId: string,
    generationId: string
  ): Promise<ScheduleGenerationResponseDto> {
    return apiClient<ScheduleGenerationResponseDto>(
      `${this.baseEndpoint}/${scheduledAreaId}/schedule-generations/${generationId}`,
      {
        method: 'GET',
      }
    )
  }

  /**
   * Deleta uma geração e todas as escalas associadas
   */
  async deleteGeneration(
    scheduledAreaId: string,
    generationId: string
  ): Promise<void> {
    return apiClient<void>(
      `${this.baseEndpoint}/${scheduledAreaId}/schedule-generations/${generationId}`,
      {
        method: 'DELETE',
      }
    )
  }
}

export const scheduleGenerationService = new ScheduleGenerationService()



