// Serviços mockados para geração automática de escalas

import type { GenerationConfiguration, GenerationPreview, SchedulePreview } from './types'
import type { GroupResponseDto } from '../../../../../services/basic/groupService'
import type { TeamResponseDto } from '../../../../../services/basic/teamService'
import type { PersonAreaResponseDto } from '../../../../../services/basic/personAreaService'
import type { ScheduledAbsenceResponseDto } from '../../../../../services/basic/scheduledAbsenceService'

// Função para gerar preview mockado
// Aceita dados reais como parâmetros opcionais para melhor simulação
export async function generatePreviewMock(
  config: GenerationConfiguration,
  realGroups?: GroupResponseDto[],
  realTeams?: TeamResponseDto[],
  realPersons?: PersonAreaResponseDto[],
  realAbsences?: ScheduledAbsenceResponseDto[]
): Promise<GenerationPreview> {
  // Simular delay de API
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const schedules: SchedulePreview[] = []
  const startDate = new Date(config.periodStartDate)
  const endDate = new Date(config.periodEndDate)
  
  // Usar dados reais se disponíveis, senão usar mocks
  const groups = realGroups || []
  const teams = realTeams || []
  const persons = realPersons || []
  const absences = realAbsences || []
  
  // Gerar escalas baseado no tipo de período
  if (config.periodType === 'fixed') {
    schedules.push({
      id: 's1',
      startDatetime: config.periodConfig?.baseDateTime || config.periodStartDate,
      endDatetime: config.periodEndDate,
      groups: config.generationType === 'group' && config.groupConfig
        ? groups.filter(g => config.groupConfig!.groupIds.includes(g.id)).map(g => ({ id: g.id, name: g.name }))
        : undefined,
      team: config.generationType !== 'group' && config.teamConfig
        ? teams.find(t => t.id === config.teamConfig!.teamId) ? { id: teams.find(t => t.id === config.teamConfig!.teamId)!.id, name: teams.find(t => t.id === config.teamConfig!.teamId)!.name } : undefined
        : undefined,
      assignments: config.generationType !== 'group' && config.teamConfig
        ? generateMockAssignments(config, teams, persons, 1)
        : undefined,
      warnings: ['Repetição consecutiva detectada'],
    })
  } else if (config.periodType === 'weekly') {
    let currentDate = new Date(startDate)
    let scheduleIndex = 1
    
    while (currentDate <= endDate) {
      const scheduleStart = new Date(currentDate)
      const scheduleEnd = new Date(currentDate)
      scheduleEnd.setDate(scheduleEnd.getDate() + (config.periodConfig?.duration || 7) - 1)
      
      const selectedGroups = groups.filter(g => config.groupConfig?.groupIds.includes(g.id))
      const selectedTeam = teams.find(t => t.id === config.teamConfig?.teamId)
      
      schedules.push({
        id: `s${scheduleIndex}`,
        startDatetime: scheduleStart.toISOString(),
        endDatetime: scheduleEnd.toISOString(),
        groups: config.generationType === 'group' && config.groupConfig && selectedGroups.length > 0
          ? [selectedGroups[(scheduleIndex - 1) % selectedGroups.length]].map(g => ({ id: g.id, name: g.name }))
          : undefined,
        team: config.generationType !== 'group' && config.teamConfig && selectedTeam
          ? { id: selectedTeam.id, name: selectedTeam.name }
          : undefined,
        assignments: config.generationType !== 'group' && config.teamConfig
          ? generateMockAssignments(config, teams, persons, scheduleIndex)
          : undefined,
        warnings: scheduleIndex % 3 === 0 ? ['Repetição consecutiva'] : undefined,
      })
      
      currentDate.setDate(currentDate.getDate() + (config.periodConfig?.interval || 7))
      scheduleIndex++
    }
  } else if (config.periodType === 'monthly') {
    let currentDate = new Date(startDate)
    let scheduleIndex = 1
    
    while (currentDate <= endDate) {
      const selectedGroups = groups.filter(g => config.groupConfig?.groupIds.includes(g.id))
      const selectedTeam = teams.find(t => t.id === config.teamConfig?.teamId)
      
      schedules.push({
        id: `s${scheduleIndex}`,
        startDatetime: currentDate.toISOString(),
        endDatetime: new Date(currentDate.getTime() + (config.periodConfig?.duration || 1) * 24 * 60 * 60 * 1000).toISOString(),
        groups: config.generationType === 'group' && config.groupConfig && selectedGroups.length > 0
          ? [selectedGroups[(scheduleIndex - 1) % selectedGroups.length]].map(g => ({ id: g.id, name: g.name }))
          : undefined,
        team: config.generationType !== 'group' && config.teamConfig && selectedTeam
          ? { id: selectedTeam.id, name: selectedTeam.name }
          : undefined,
        assignments: config.generationType !== 'group' && config.teamConfig
          ? generateMockAssignments(config, teams, persons, scheduleIndex)
          : undefined,
      })
      
      currentDate.setMonth(currentDate.getMonth() + 1)
      scheduleIndex++
    }
  } else if (config.periodType === 'daily') {
    let currentDate = new Date(startDate)
    let scheduleIndex = 1
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay()
      
      if (!config.periodConfig?.weekdays || config.periodConfig.weekdays.includes(dayOfWeek)) {
        const scheduleStart = new Date(currentDate)
        if (config.periodConfig?.startTime) {
          const [hours, minutes] = config.periodConfig.startTime.split(':').map(Number)
          scheduleStart.setHours(hours, minutes, 0, 0)
        }
        
        const scheduleEnd = new Date(scheduleStart)
        if (config.periodConfig?.endTime) {
          const [hours, minutes] = config.periodConfig.endTime.split(':').map(Number)
          scheduleEnd.setHours(hours, minutes, 0, 0)
        } else {
          scheduleEnd.setHours(scheduleStart.getHours() + 2, 0, 0, 0)
        }
        
        const selectedGroups = groups.filter(g => config.groupConfig?.groupIds.includes(g.id))
        const selectedTeam = teams.find(t => t.id === config.teamConfig?.teamId)
        
        schedules.push({
          id: `s${scheduleIndex}`,
          startDatetime: scheduleStart.toISOString(),
          endDatetime: scheduleEnd.toISOString(),
          groups: config.generationType === 'group' && config.groupConfig && selectedGroups.length > 0
            ? [selectedGroups[(scheduleIndex - 1) % selectedGroups.length]].map(g => ({ id: g.id, name: g.name }))
            : undefined,
          team: config.generationType !== 'group' && config.teamConfig && selectedTeam
            ? { id: selectedTeam.id, name: selectedTeam.name }
            : undefined,
          assignments: config.generationType !== 'group' && config.teamConfig
            ? generateMockAssignments(config, teams, persons, scheduleIndex)
            : undefined,
        })
        
        scheduleIndex++
      }
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
  }
  
  // Calcular resumo
  const warnings = schedules.filter(s => s.warnings && s.warnings.length > 0).length
  const errors = schedules.filter(s => s.errors && s.errors.length > 0).length
  
  return {
    configuration: config,
    schedules,
    summary: {
      totalSchedules: schedules.length,
      totalParticipants: schedules.reduce((acc, s) => {
        if (s.groups) return acc + s.groups.length
        if (s.assignments) return acc + s.assignments.length
        return acc
      }, 0),
      warnings,
      errors,
      distributionBalance: warnings > schedules.length / 2 ? 'unbalanced' : 'balanced',
    },
  }
}

function generateMockAssignments(
  config: GenerationConfiguration,
  teams: TeamResponseDto[],
  persons: PersonAreaResponseDto[],
  scheduleIndex: number = 1
) {
  if (!config.teamConfig) return []
  
  const team = teams.find(t => t.id === config.teamConfig!.teamId)
  if (!team) return []
  
  // Filtrar pessoas baseado na seleção
  let availablePersons = persons
  if (config.teamConfig.participantSelection === 'by_group' && config.teamConfig.selectedGroupIds) {
    // Filtrar pessoas que pertencem aos grupos selecionados
    // Nota: Isso requer uma chamada adicional à API, então por enquanto usamos todas as pessoas
    // Em produção, isso seria feito no backend
  } else if (config.teamConfig.participantSelection === 'individual' && config.teamConfig.selectedPersonIds) {
    availablePersons = persons.filter(p => config.teamConfig!.selectedPersonIds!.includes(p.personId))
  }
  
  if (availablePersons.length === 0) return []
  
  const assignments: Array<{ personId: string; personName: string; roleId: string; roleName: string }> = []
  let personIndex = scheduleIndex % availablePersons.length
  
  for (const role of team.roles) {
    for (let i = 0; i < role.quantity; i++) {
      const person = availablePersons[personIndex % availablePersons.length]
      assignments.push({
        personId: person.personId,
        personName: person.person?.fullName || person.personId,
        roleId: role.id,
        roleName: role.responsibilityName,
      })
      personIndex++
    }
  }
  
  return assignments
}

// Função para confirmar geração (mock)
export async function confirmGenerationMock(config: GenerationConfiguration): Promise<{ success: boolean; generationId: string; schedulesCreated: number }> {
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const preview = await generatePreviewMock(config)
  
  return {
    success: true,
    generationId: `gen-${Date.now()}`,
    schedulesCreated: preview.schedules.length,
  }
}

