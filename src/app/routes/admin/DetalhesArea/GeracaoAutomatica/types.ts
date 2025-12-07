// Tipos para geração automática de escalas

export type GenerationType = 'group' | 'people' | 'team_without_restriction' | 'team_with_restriction'
export type PeriodType = 'fixed' | 'monthly' | 'weekly' | 'daily'
export type DistributionOrder = 'sequential' | 'random' | 'balanced'
export type ParticipantSelection = 'all' | 'by_group' | 'individual' | 'all_with_exclusions'

export interface SchedulePreview {
  id: string
  startDatetime: string
  endDatetime: string
  groups?: Array<{ 
    id: string
    name: string
    members?: Array<{
      personId: string
      personName: string
      personPhotoUrl: string | null
      responsibilities: Array<{
        id: string
        name: string
        imageUrl: string | null
      }>
    }>
  }>
  team?: { id: string; name: string }
  assignments?: Array<{
    personId: string
    personName: string
    roleId: string
    roleName: string
  }>
  warnings?: string[]
  errors?: string[]
}

export interface GenerationConfiguration {
  scheduledAreaId: string
  generationType: GenerationType
  periodType: PeriodType
  periodStartDate: string
  periodEndDate: string
  
  // Configurações por tipo
  groupConfig?: {
    groupIds: string[]
    groupsPerSchedule: number
    distributionOrder: DistributionOrder
    considerAbsences: boolean
    excludedPersonIds?: string[] // IDs de pessoas a excluir (mesmo que estejam nos grupos)
  }
  
  peopleConfig?: {
    excludedPersonIds?: string[] // IDs de pessoas a excluir (todas as outras são incluídas)
    considerAbsences: boolean
  }
  
  teamConfig?: {
    teamId: string
    participantSelection: ParticipantSelection
    selectedGroupIds?: string[]
    selectedPersonIds?: string[]
    excludedPersonIds?: string[] // IDs de pessoas a excluir (usado com 'all_with_exclusions')
    considerAbsences: boolean
    requireResponsibilities: boolean
  }
  
  // Configurações de período
  periodConfig?: {
    baseDateTime: string
    duration: number // em dias ou horas dependendo do tipo
    interval?: number // intervalo entre escalas (para semanal/diário)
    weekdays?: number[] // 0-6 (domingo-sábado) para diário
    startTime?: string // HH:mm para diário
    endTime?: string // HH:mm para diário
    excludedDates?: string[] // datas a excluir
    includedDates?: string[] // datas a incluir
  }
}

export interface GenerationPreview {
  configuration: GenerationConfiguration
  schedules: SchedulePreview[]
  summary: {
    totalSchedules: number
    totalParticipants: number
    warnings: number
    errors: number
    distributionBalance: 'balanced' | 'unbalanced' | 'critical'
  }
}


