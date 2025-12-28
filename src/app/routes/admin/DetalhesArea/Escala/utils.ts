import type { ScheduleGroupConfiguration } from './types'

// Função para mapear a configuração aninhada da API para a estrutura plana esperada
export function mapConfiguration(
  config: any,
  generationType: string,
  periodType: string,
  periodStartDate: string,
  periodEndDate: string
): ScheduleGroupConfiguration {
  const mapped: ScheduleGroupConfiguration = {
    periodStartDate: periodStartDate || '',
    periodEndDate: periodEndDate || '',
    periodType: periodType as 'fixed' | 'daily' | 'weekly' | 'monthly',
    considerAbsences: false,
  }

  // Mapear configurações do período
  if (config.periodConfig) {
    mapped.weekdays = config.periodConfig.weekdays
    mapped.startTime = config.periodConfig.startTime
    mapped.endTime = config.periodConfig.endTime
    mapped.excludedDates = config.periodConfig.excludedDates
    mapped.includedDates = config.periodConfig.includedDates
  }

  // Mapear configurações baseadas no tipo de geração
  if (generationType === 'group' && config.groupConfig) {
    mapped.considerAbsences = config.groupConfig.considerAbsences || false
    mapped.distributionOrder = config.groupConfig.distributionOrder
    mapped.groupsPerSchedule = config.groupConfig.groupsPerSchedule

    // Verificar se groupIds é um array de objetos (com id, name, imageUrl) ou apenas strings
    // Também verificar se há um campo 'groups' separado com os objetos completos
    if (config.groupConfig.groups && Array.isArray(config.groupConfig.groups)) {
      // Campo 'groups' com objetos completos
      mapped.selectedGroups = config.groupConfig.groups.map((g: any) => ({
        id: g.id || g,
        name: g.name || g.id || g,
        imageUrl: g.imageUrl || g.image || null,
      }))
      mapped.selectedGroupIds = mapped.selectedGroups?.map(g => g.id) || []
      mapped.selectedGroupNames = mapped.selectedGroups?.map(g => g.name) || []
    } else if (config.groupConfig.groupIds && Array.isArray(config.groupConfig.groupIds)) {
      const firstItem = config.groupConfig.groupIds[0]
      if (firstItem && typeof firstItem === 'object' && firstItem.id) {
        // É um array de objetos com id, name, imageUrl
        mapped.selectedGroups = config.groupConfig.groupIds.map((g: any) => ({
          id: g.id,
          name: g.name || g.id,
          imageUrl: g.imageUrl || null,
        }))
        mapped.selectedGroupIds = mapped.selectedGroups?.map(g => g.id) || []
        mapped.selectedGroupNames = mapped.selectedGroups?.map(g => g.name) || []
      } else {
        // É um array de strings (IDs) - tentar buscar grupos completos em outro lugar
        mapped.selectedGroupIds = config.groupConfig.groupIds
      }
    }
  } else if (generationType === 'people' && config.peopleConfig) {
    mapped.considerAbsences = config.peopleConfig.considerAbsences || false
  } else if ((generationType === 'team_without_restriction' || generationType === 'team_with_restriction') && config.teamConfig) {
    mapped.considerAbsences = config.teamConfig.considerAbsences || false
    mapped.requireResponsibilities = config.teamConfig.requireResponsibilities
    mapped.participantSelection = config.teamConfig.participantSelection
    mapped.selectedTeamId = config.teamConfig.teamId

    // Verificar se selectedGroupIds é um array de objetos ou apenas strings
    // Também verificar se há um campo 'selectedGroups' separado com os objetos completos
    if (config.teamConfig.selectedGroups && Array.isArray(config.teamConfig.selectedGroups)) {
      // Campo 'selectedGroups' com objetos completos
      mapped.selectedGroups = config.teamConfig.selectedGroups.map((g: any) => ({
        id: g.id || g,
        name: g.name || g.id || g,
        imageUrl: g.imageUrl || g.image || null,
      }))
      mapped.selectedGroupIds = mapped.selectedGroups?.map(g => g.id) || []
      mapped.selectedGroupNames = mapped.selectedGroups?.map(g => g.name) || []
    } else if (config.teamConfig.selectedGroupIds && Array.isArray(config.teamConfig.selectedGroupIds)) {
      const firstItem = config.teamConfig.selectedGroupIds[0]
      if (firstItem && typeof firstItem === 'object' && firstItem.id) {
        // É um array de objetos com id, name, imageUrl
        mapped.selectedGroups = config.teamConfig.selectedGroupIds.map((g: any) => ({
          id: g.id,
          name: g.name || g.id,
          imageUrl: g.imageUrl || null,
        }))
        mapped.selectedGroupIds = mapped.selectedGroups?.map(g => g.id) || []
        mapped.selectedGroupNames = mapped.selectedGroups?.map(g => g.name) || []
      } else {
        // É um array de strings (IDs)
        mapped.selectedGroupIds = config.teamConfig.selectedGroupIds
      }
    }
  }

  return mapped
}

export const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export const formatDateRange = (startDate: string, endDate: string) => {
  const start = formatDate(startDate)
  const end = formatDate(endDate)
  return `${start} - ${end}`
}

export const getDateOnly = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

export const groupSchedulesByDate = (schedules: any[]) => {
  const grouped = new Map<string, any[]>()

  schedules.forEach(schedule => {
    const dateKey = getDateOnly(schedule.startDatetime)
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, [])
    }
    grouped.get(dateKey)!.push(schedule)
  })

  return Array.from(grouped.entries()).map(([date, schedules]) => ({
    date,
    schedules,
    dateFormatted: formatDate(schedules[0].startDatetime)
  }))
}

