// Tipos para compatibilidade com a tela
export interface ScheduleGroupConfiguration {
  // Período
  periodStartDate: string
  periodEndDate: string
  periodType: 'fixed' | 'daily' | 'weekly' | 'monthly'
  
  // Dias da semana (0-6, domingo-sábado)
  weekdays?: number[]
  
  // Horários (para tipo daily)
  startTime?: string // HH:mm
  endTime?: string // HH:mm
  
  // Grupos selecionados
  selectedGroupIds?: string[]
  selectedGroupNames?: string[]
  selectedGroups?: Array<{
    id: string
    name: string
    imageUrl?: string | null
  }>
  
  // Equipe selecionada
  selectedTeamId?: string
  selectedTeamName?: string
  
  // Regras
  considerAbsences: boolean
  requireResponsibilities?: boolean
  distributionOrder?: 'sequential' | 'random' | 'balanced'
  groupsPerSchedule?: number
  participantSelection?: 'all' | 'all_with_exclusions' | 'by_group' | 'individual'
  
  // Datas excluídas/incluídas
  excludedDates?: string[]
  includedDates?: string[]
}

export interface ScheduleGroupDto {
  id: string
  name: string
  description?: string
  scheduledAreaId: string
  schedulesCount: number
  configuration: ScheduleGroupConfiguration
  createdAt: string
  updatedAt: string
}

export type ScheduleDto = import('../../../../../services/basic/scheduleService').ScheduleResponseDto

