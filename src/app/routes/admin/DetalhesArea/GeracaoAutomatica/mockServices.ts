// Serviços para geração automática de escalas

import type { GenerationConfiguration, GenerationPreview, SchedulePreview, DistributionOrder } from './types'
import type { GroupResponseDto } from '../../../../../services/basic/groupService'
import type { TeamResponseDto } from '../../../../../services/basic/teamService'
import type { PersonAreaResponseDto } from '../../../../../services/basic/personAreaService'
import type { ScheduledAbsenceResponseDto } from '../../../../../services/basic/scheduledAbsenceService'
import type { GroupMemberResponseDto } from '../../../../../services/basic/groupMemberService'

// Função para gerar preview usando dados reais
export async function generatePreview(
  config: GenerationConfiguration,
  groups: GroupResponseDto[],
  teams: TeamResponseDto[],
  persons: PersonAreaResponseDto[],
  absences: ScheduledAbsenceResponseDto[],
  groupMembers: GroupMemberResponseDto[]
): Promise<GenerationPreview> {
  const schedules: SchedulePreview[] = []
  const startDate = new Date(config.periodStartDate)
  const endDate = new Date(config.periodEndDate)
  
  // Validar dados necessários
  if (!groups || !teams || !persons) {
    throw new Error('Dados insuficientes para gerar preview')
  }
  
  // Rastrear atribuições anteriores para balanceamento
  const assignmentHistory = new Map<string, Map<string, number>>() // roleId -> personId -> count
  
  // Função auxiliar para normalizar data para início do dia (evitar problemas de timezone)
  const normalizeDate = (date: Date | string): Date => {
    const d = typeof date === 'string' ? new Date(date) : date
    // Criar nova data com apenas ano, mês e dia (sem hora)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }
  
  // Função auxiliar para verificar se um grupo pode ser usado (sem membros ausentes)
  const canUseGroup = (groupId: string, scheduleStart: Date, scheduleEnd: Date): boolean => {
    if (!config.groupConfig?.considerAbsences || absences.length === 0) {
      return true // Se não considerar ausências ou não há ausências, pode usar
    }
    
    // Buscar membros do grupo
    const groupMembersList = groupMembers.filter(m => m.groupId === groupId)
    
    // Normalizar datas da escala para início do dia
    const normalizedScheduleStart = normalizeDate(scheduleStart)
    const normalizedScheduleEnd = normalizeDate(scheduleEnd)
    
    // Verificar se algum membro tem ausência que sobrepõe o período da escala
    for (const member of groupMembersList) {
      const memberAbsences = absences.filter(a => {
        if (a.personId !== member.personId) return false
        
        // Normalizar datas de ausência para início do dia
        const absenceStart = normalizeDate(a.startDate)
        const absenceEnd = normalizeDate(a.endDate)
        
        // Verificar sobreposição: ausência.start <= escala.end && ausência.end >= escala.start
        // Usar getTime() para comparação numérica precisa
        return absenceStart.getTime() <= normalizedScheduleEnd.getTime() && 
               absenceEnd.getTime() >= normalizedScheduleStart.getTime()
      })
      
      if (memberAbsences.length > 0) {
        return false // Grupo tem membro ausente, não pode usar
      }
    }
    
    return true // Grupo pode ser usado
  }
  
  // Função auxiliar para selecionar grupos válidos (sem membros ausentes)
  const selectValidGroups = (
    availableGroups: GroupResponseDto[],
    scheduleStart: Date,
    scheduleEnd: Date,
    groupsPerSchedule: number,
    scheduleIndex: number,
    distributionOrder: DistributionOrder
  ): string[] => {
    if (availableGroups.length === 0) return []
    
    // Filtrar grupos que podem ser usados (sem membros ausentes)
    const validGroups = availableGroups.filter(g => canUseGroup(g.id, scheduleStart, scheduleEnd))
    
    if (validGroups.length === 0) {
      // Se não há grupos válidos, retornar grupos mesmo com ausências (com aviso)
      return availableGroups.slice(0, groupsPerSchedule).map(g => g.id)
    }
    
    // Selecionar grupos baseado na ordem de distribuição
    let selectedGroups: GroupResponseDto[] = []
    
    if (distributionOrder === 'sequential') {
      const startIndex = (scheduleIndex - 1) % validGroups.length
      for (let i = 0; i < groupsPerSchedule; i++) {
        selectedGroups.push(validGroups[(startIndex + i) % validGroups.length])
      }
    } else if (distributionOrder === 'random') {
      const shuffled = [...validGroups].sort(() => Math.random() - 0.5)
      selectedGroups = shuffled.slice(0, groupsPerSchedule)
    } else { // balanced
      // Distribuição balanceada: usar rotação baseada no índice
      const startIndex = (scheduleIndex - 1) % validGroups.length
      for (let i = 0; i < groupsPerSchedule; i++) {
        selectedGroups.push(validGroups[(startIndex + i) % validGroups.length])
      }
    }
    
    return selectedGroups.map(g => g.id)
  }
  
  // Função auxiliar para enriquecer grupos com membros
  const enrichGroupsWithMembers = (groupIds: string[]): Array<{ 
    id: string
    name: string
    members?: Array<{
      personId: string
      personName: string
      personPhotoUrl: string | null
      responsibilities: Array<{ id: string; name: string; imageUrl: string | null }>
    }>
  }> => {
    const enrichedGroups = []
    
    // Obter lista de pessoas excluídas (se houver)
    const excludedPersonIds = new Set(config.groupConfig?.excludedPersonIds || [])
    
    for (const groupId of groupIds) {
      const group = groups.find(g => g.id === groupId)
      if (!group) continue
      
      // Buscar membros do grupo nos groupMembers
      const groupMembersList = groupMembers.filter(m => m.groupId === groupId)
      
      const members = groupMembersList
        .filter(member => !excludedPersonIds.has(member.personId)) // Filtrar pessoas excluídas
        .map(member => {
          // Tentar encontrar a pessoa no array persons primeiro, depois usar member.person como fallback
          const personArea = persons.find(p => p.personId === member.personId)
          const person = personArea?.person || member.person
          
          return {
            personId: member.personId,
            personName: person?.fullName || member.personId,
            personPhotoUrl: person?.photoUrl || null,
            responsibilities: member.responsibilities?.map(r => ({
              id: r.id,
              name: r.name,
              imageUrl: r.imageUrl,
            })) || [],
          }
        })
      
      enrichedGroups.push({
        id: group.id,
        name: group.name,
        members: members.length > 0 ? members : undefined,
      })
    }
    
    return enrichedGroups
  }
  
  // Função auxiliar para gerar lista de pessoas selecionadas
  const generatePeopleList = (scheduleStart: Date, scheduleEnd: Date): Array<{
    personId: string
    personName: string
    personPhotoUrl: string | null
    responsibilities: Array<{ id: string; name: string; imageUrl: string | null }>
  }> => {
    if (config.generationType !== 'people' || !config.peopleConfig) return []
    
    // Obter pessoas excluídas
    const excludedPersonIds = new Set(config.peopleConfig.excludedPersonIds || [])
    
    // Filtrar pessoas (todas exceto as excluídas)
    let availablePersons = persons.filter(p => !excludedPersonIds.has(p.personId))
    
    // Filtrar pessoas ausentes se necessário
    if (config.peopleConfig.considerAbsences && absences.length > 0) {
      const absentPersonIds = new Set<string>()
      for (const absence of absences) {
        const absenceStart = normalizeDate(absence.startDate)
        const absenceEnd = normalizeDate(absence.endDate)
        const normalizedScheduleStart = normalizeDate(scheduleStart)
        const normalizedScheduleEnd = normalizeDate(scheduleEnd)
        
        if (absenceStart.getTime() <= normalizedScheduleEnd.getTime() && 
            absenceEnd.getTime() >= normalizedScheduleStart.getTime()) {
          absentPersonIds.add(absence.personId)
        }
      }
      availablePersons = availablePersons.filter(p => !absentPersonIds.has(p.personId))
    }
    
    // Retornar lista formatada
    return availablePersons.map(person => ({
      personId: person.personId,
      personName: person.person?.fullName || person.personId,
      personPhotoUrl: person.person?.photoUrl || null,
      responsibilities: person.responsibilities?.map(r => ({
        id: r.id,
        name: r.name,
        imageUrl: r.imageUrl,
      })) || [],
    }))
  }
  
  // Gerar escalas baseado no tipo de período
  if (config.periodType === 'fixed') {
    const scheduleStart = new Date(config.periodConfig?.baseDateTime || config.periodStartDate)
    const scheduleEnd = new Date(config.periodEndDate)
    
    let selectedGroupIds: string[] = []
    if (config.generationType === 'group' && config.groupConfig) {
      const availableGroups = groups.filter(g => config.groupConfig!.groupIds.includes(g.id))
      selectedGroupIds = selectValidGroups(
        availableGroups,
        scheduleStart,
        scheduleEnd,
        config.groupConfig.groupsPerSchedule,
        1,
        config.groupConfig.distributionOrder
      )
    }
    
    // Para geração por pessoas, criar um grupo virtual com todas as pessoas
    let peopleList: Array<{
      personId: string
      personName: string
      personPhotoUrl: string | null
      responsibilities: Array<{ id: string; name: string; imageUrl: string | null }>
    }> = []
    if (config.generationType === 'people') {
      peopleList = generatePeopleList(scheduleStart, scheduleEnd)
    }
    
    schedules.push({
      id: 's1',
      startDatetime: scheduleStart.toISOString(),
      endDatetime: scheduleEnd.toISOString(),
      groups: selectedGroupIds.length > 0
        ? enrichGroupsWithMembers(selectedGroupIds)
        : config.generationType === 'people' && peopleList.length > 0
        ? [{
            id: 'all-people',
            name: 'Todas as Pessoas',
            members: peopleList,
          }]
        : undefined,
      team: config.generationType !== 'group' && config.generationType !== 'people' && config.teamConfig
        ? teams.find(t => t.id === config.teamConfig!.teamId) ? { id: teams.find(t => t.id === config.teamConfig!.teamId)!.id, name: teams.find(t => t.id === config.teamConfig!.teamId)!.name } : undefined
        : undefined,
        assignments: config.generationType !== 'group' && config.generationType !== 'people' && config.teamConfig
        ? generateAssignments(config, teams, persons, 1, groupMembers, absences, scheduleStart, scheduleEnd, assignmentHistory)
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
      
      // Verificar se alguma data do período está excluída
      // @ts-expect-error - variáveis mantidas para uso futuro
      const _scheduleStartString = scheduleStart.toISOString().split('T')[0]
      // @ts-expect-error - variáveis mantidas para uso futuro
      const _scheduleEndString = scheduleEnd.toISOString().split('T')[0]
      const hasExcludedDate = config.periodConfig?.excludedDates?.some(excludedDate => {
        const excluded = new Date(excludedDate)
        return excluded >= scheduleStart && excluded <= scheduleEnd
      })
      const hasIncludedDate = config.periodConfig?.includedDates?.some(includedDate => {
        const included = new Date(includedDate)
        return included >= scheduleStart && included <= scheduleEnd
      })
      
      // Se não há data excluída ou há data incluída, gerar escala
      if (!hasExcludedDate || hasIncludedDate) {
        const selectedTeam = teams.find(t => t.id === config.teamConfig?.teamId)
        
        let selectedGroupIds: string[] = []
        if (config.generationType === 'group' && config.groupConfig) {
          const availableGroups = groups.filter(g => config.groupConfig!.groupIds.includes(g.id))
          selectedGroupIds = selectValidGroups(
            availableGroups,
            scheduleStart,
            scheduleEnd,
            config.groupConfig.groupsPerSchedule,
            scheduleIndex,
            config.groupConfig.distributionOrder
          )
        }
        
        // Para geração por pessoas, criar um grupo virtual com todas as pessoas
        let peopleList: Array<{
          personId: string
          personName: string
          personPhotoUrl: string | null
          responsibilities: Array<{ id: string; name: string; imageUrl: string | null }>
        }> = []
        if (config.generationType === 'people') {
          peopleList = generatePeopleList(scheduleStart, scheduleEnd)
        }
        
        schedules.push({
          id: `s${scheduleIndex}`,
          startDatetime: scheduleStart.toISOString(),
          endDatetime: scheduleEnd.toISOString(),
          groups: selectedGroupIds.length > 0
            ? await enrichGroupsWithMembers(selectedGroupIds)
            : config.generationType === 'people' && peopleList.length > 0
            ? [{
                id: 'all-people',
                name: 'Todas as Pessoas',
                members: peopleList,
              }]
            : undefined,
          team: config.generationType !== 'group' && config.generationType !== 'people' && config.teamConfig && selectedTeam
            ? { id: selectedTeam.id, name: selectedTeam.name }
            : undefined,
          assignments: config.generationType !== 'group' && config.generationType !== 'people' && config.teamConfig
            ? generateAssignments(config, teams, persons, scheduleIndex, groupMembers, absences, scheduleStart, scheduleEnd, assignmentHistory)
            : undefined,
          warnings: scheduleIndex % 3 === 0 ? ['Repetição consecutiva'] : undefined,
        })
        
        scheduleIndex++
      }
      
      currentDate.setDate(currentDate.getDate() + (config.periodConfig?.interval || 7))
    }
  } else if (config.periodType === 'monthly') {
    let currentDate = new Date(startDate)
    let scheduleIndex = 1
    
    while (currentDate <= endDate) {
      const scheduleStart = new Date(currentDate)
      const scheduleEnd = new Date(currentDate.getTime() + (config.periodConfig?.duration || 1) * 24 * 60 * 60 * 1000)
      
      // Verificar se alguma data do período está excluída
      const scheduleStartString = scheduleStart.toISOString().split('T')[0]
      const hasExcludedDate = config.periodConfig?.excludedDates?.includes(scheduleStartString)
      const hasIncludedDate = config.periodConfig?.includedDates?.includes(scheduleStartString)
      
      // Se não há data excluída ou há data incluída, gerar escala
      if (!hasExcludedDate || hasIncludedDate) {
        const selectedTeam = teams.find(t => t.id === config.teamConfig?.teamId)
        
        let selectedGroupIds: string[] = []
        if (config.generationType === 'group' && config.groupConfig) {
          const availableGroups = groups.filter(g => config.groupConfig!.groupIds.includes(g.id))
          selectedGroupIds = selectValidGroups(
            availableGroups,
            scheduleStart,
            scheduleEnd,
            config.groupConfig.groupsPerSchedule,
            scheduleIndex,
            config.groupConfig.distributionOrder
          )
        }
        
        // Para geração por pessoas, criar um grupo virtual com todas as pessoas
        let peopleList: Array<{
          personId: string
          personName: string
          personPhotoUrl: string | null
          responsibilities: Array<{ id: string; name: string; imageUrl: string | null }>
        }> = []
        if (config.generationType === 'people') {
          peopleList = generatePeopleList(scheduleStart, scheduleEnd)
        }
        
        schedules.push({
          id: `s${scheduleIndex}`,
          startDatetime: scheduleStart.toISOString(),
          endDatetime: scheduleEnd.toISOString(),
          groups: selectedGroupIds.length > 0
            ? await enrichGroupsWithMembers(selectedGroupIds)
            : config.generationType === 'people' && peopleList.length > 0
            ? [{
                id: 'all-people',
                name: 'Todas as Pessoas',
                members: peopleList,
              }]
            : undefined,
          team: config.generationType !== 'group' && config.generationType !== 'people' && config.teamConfig && selectedTeam
            ? { id: selectedTeam.id, name: selectedTeam.name }
            : undefined,
          assignments: config.generationType !== 'group' && config.generationType !== 'people' && config.teamConfig
            ? generateAssignments(config, teams, persons, scheduleIndex, groupMembers, absences, scheduleStart, scheduleEnd, assignmentHistory)
            : undefined,
        })
        
        scheduleIndex++
      }
      
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
  } else if (config.periodType === 'daily') {
    let currentDate = new Date(startDate)
    let scheduleIndex = 1
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay()
      const dateString = currentDate.toISOString().split('T')[0]
      
      // Verificar se a data está excluída
      const isExcluded = config.periodConfig?.excludedDates?.includes(dateString)
      // Verificar se a data está incluída (override de exclusão)
      const isIncluded = config.periodConfig?.includedDates?.includes(dateString)
      
      // Verificar se deve gerar escala para este dia
      const shouldGenerate = (isIncluded || (!isExcluded && (!config.periodConfig?.weekdays || config.periodConfig.weekdays.includes(dayOfWeek))))
      
      if (shouldGenerate) {
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
        
        const selectedTeam = teams.find(t => t.id === config.teamConfig?.teamId)
        
        let selectedGroupIds: string[] = []
        if (config.generationType === 'group' && config.groupConfig) {
          const availableGroups = groups.filter(g => config.groupConfig!.groupIds.includes(g.id))
          selectedGroupIds = selectValidGroups(
            availableGroups,
            scheduleStart,
            scheduleEnd,
            config.groupConfig.groupsPerSchedule,
            scheduleIndex,
            config.groupConfig.distributionOrder
          )
        }
        
        // Para geração por pessoas, criar um grupo virtual com todas as pessoas
        let peopleList: Array<{
          personId: string
          personName: string
          personPhotoUrl: string | null
          responsibilities: Array<{ id: string; name: string; imageUrl: string | null }>
        }> = []
        if (config.generationType === 'people') {
          peopleList = generatePeopleList(scheduleStart, scheduleEnd)
        }
        
        schedules.push({
          id: `s${scheduleIndex}`,
          startDatetime: scheduleStart.toISOString(),
          endDatetime: scheduleEnd.toISOString(),
          groups: selectedGroupIds.length > 0
            ? await enrichGroupsWithMembers(selectedGroupIds)
            : config.generationType === 'people' && peopleList.length > 0
            ? [{
                id: 'all-people',
                name: 'Todas as Pessoas',
                members: peopleList,
              }]
            : undefined,
          team: config.generationType !== 'group' && config.generationType !== 'people' && config.teamConfig && selectedTeam
            ? { id: selectedTeam.id, name: selectedTeam.name }
            : undefined,
          assignments: config.generationType !== 'group' && config.generationType !== 'people' && config.teamConfig
            ? generateAssignments(config, teams, persons, scheduleIndex, groupMembers, absences, scheduleStart, scheduleEnd, assignmentHistory)
            : undefined,
        })
        
        scheduleIndex++
      }
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
  }
  
  // Calcular resumo e validar
  const warnings: string[] = []
  const errors: string[] = []
  
  // Criar mapa de responsabilidades para validação
  const personResponsibilitiesMap = new Map<string, Set<string>>()
  
  // Se a seleção for por grupo, usar APENAS as responsabilidades do grupo
  // Caso contrário, usar responsabilidades da área + grupo
  if (config.teamConfig?.participantSelection === 'by_group' && groupMembers.length > 0) {
    // Usar APENAS responsabilidades dos grupos selecionados
    for (const member of groupMembers) {
      if (member.personId && member.responsibilities) {
        const responsibilities = new Set<string>()
        member.responsibilities.forEach(r => responsibilities.add(r.id))
        personResponsibilitiesMap.set(member.personId, responsibilities)
      }
    }
  } else {
    // Usar responsabilidades da área + grupo (comportamento padrão)
    for (const person of persons) {
      const responsibilities = new Set<string>()
      if (person.responsibilities) {
        person.responsibilities.forEach(r => responsibilities.add(r.id))
      }
      personResponsibilitiesMap.set(person.personId, responsibilities)
    }
    
    // Adicionar responsabilidades dos grupos (complementar)
    for (const member of groupMembers) {
      if (member.personId && member.responsibilities) {
        const existing = personResponsibilitiesMap.get(member.personId) || new Set<string>()
        member.responsibilities.forEach(r => existing.add(r.id))
        personResponsibilitiesMap.set(member.personId, existing)
      }
    }
  }
  
  // Validar distribuição e detectar problemas
  for (const schedule of schedules) {
    const scheduleWarnings: string[] = []
    const scheduleErrors: string[] = []
    
    // Verificar se há pessoas ausentes nas atribuições
    if (schedule.assignments && config.teamConfig?.considerAbsences) {
      for (const assignment of schedule.assignments) {
        const personAbsences = absences.filter(a => 
          a.personId === assignment.personId &&
          new Date(a.startDate) <= new Date(schedule.endDatetime) &&
          new Date(a.endDate) >= new Date(schedule.startDatetime)
        )
        if (personAbsences.length > 0) {
          scheduleErrors.push(`${assignment.personName} está ausente no período`)
        }
      }
    }
    
    // Verificar se há pessoas sem responsabilidade necessária (modo restrito)
    if (schedule.assignments && config.generationType === 'team_with_restriction') {
      const team = teams.find(t => t.id === config.teamConfig?.teamId)
      if (team) {
        for (const assignment of schedule.assignments) {
          // Verificar se a atribuição está vazia (não foi possível atribuir ninguém)
          if (!assignment.personId || assignment.personName === '[Não atribuído]') {
            scheduleErrors.push(`Não foi possível atribuir ninguém para o papel "${assignment.roleName}"`)
            continue
          }
          
          const personResponsibilities = personResponsibilitiesMap.get(assignment.personId) || new Set<string>()
          const role = team.roles.find(r => r.id === assignment.roleId)
          
          if (role && !personResponsibilities.has(role.responsibilityId)) {
            scheduleErrors.push(`${assignment.personName} não tem a responsabilidade "${role.responsibilityName}"`)
          }
        }
      }
    }
    
    // Verificar atribuições vazias em qualquer modo
    if (schedule.assignments) {
      for (const assignment of schedule.assignments) {
        if (!assignment.personId || assignment.personName === '[Não atribuído]') {
          scheduleErrors.push(`Não foi possível atribuir ninguém para o papel "${assignment.roleName}"`)
        }
      }
    }
    
    if (scheduleWarnings.length > 0) {
      schedule.warnings = scheduleWarnings
      warnings.push(...scheduleWarnings)
    }
    if (scheduleErrors.length > 0) {
      schedule.errors = scheduleErrors
      errors.push(...scheduleErrors)
    }
  }
  
  // Calcular total de participantes únicos
  const uniqueParticipants = new Set<string>()
  for (const schedule of schedules) {
    if (schedule.groups) {
      // Para grupos, contar membros únicos de todos os grupos
      for (const group of schedule.groups) {
        if (group.members) {
          for (const member of group.members) {
            uniqueParticipants.add(member.personId)
          }
        }
      }
    } else if (schedule.assignments) {
      // Para equipes, contar pessoas atribuídas (excluindo "[Não atribuído]")
      for (const assignment of schedule.assignments) {
        if (assignment.personId && assignment.personName !== '[Não atribuído]') {
          uniqueParticipants.add(assignment.personId)
        }
      }
    }
  }
  
  return {
    configuration: config,
    schedules,
    summary: {
      totalSchedules: schedules.length,
      totalParticipants: uniqueParticipants.size,
      warnings: warnings.length,
      errors: errors.length,
      distributionBalance: warnings.length > schedules.length / 2 ? 'unbalanced' : 'balanced',
    },
  }
}

// Função para confirmar geração (mock - será substituída pela API real)
export async function confirmGenerationMock(
  config: GenerationConfiguration,
  groups: GroupResponseDto[],
  teams: TeamResponseDto[],
  persons: PersonAreaResponseDto[],
  absences: ScheduledAbsenceResponseDto[],
  groupMembers: GroupMemberResponseDto[]
): Promise<{ success: boolean; generationId: string; schedulesCreated: number }> {
  // Simular delay de API
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Gerar preview para contar quantas escalas seriam criadas
  const preview = await generatePreview(config, groups, teams, persons, absences, groupMembers)
  
  return {
    success: true,
    generationId: `gen-${Date.now()}`,
    schedulesCreated: preview.schedules.length,
  }
}

function generateAssignments(
  config: GenerationConfiguration,
  teams: TeamResponseDto[],
  persons: PersonAreaResponseDto[],
  scheduleIndex: number = 1,
  groupMembers: GroupMemberResponseDto[],
  absences: ScheduledAbsenceResponseDto[],
  scheduleStart: Date,
  scheduleEnd: Date,
  assignmentHistory: Map<string, Map<string, number>>
) {
  if (!config.teamConfig) return []
  
  const team = teams.find(t => t.id === config.teamConfig!.teamId)
  if (!team) return []
  
  // Filtrar pessoas baseado na seleção
  let availablePersons = persons
  const fixedPersonIds = new Set<string>() // Coletar todas as pessoas fixas de todos os papéis
  
  // Primeiro, coletar todas as pessoas fixas da equipe (independente do grupo)
  for (const role of team.roles) {
    if (role.fixedPersonIds && role.fixedPersonIds.length > 0) {
      role.fixedPersonIds.forEach(id => fixedPersonIds.add(id))
    }
  }
  
  // Filtrar pessoas baseado na seleção, mas SEMPRE incluir pessoas fixas
  if (config.teamConfig.participantSelection === 'by_group' && config.teamConfig.selectedGroupIds && groupMembers.length > 0) {
    // Filtrar pessoas que pertencem aos grupos selecionados
    const selectedPersonIds = new Set(
      groupMembers
        .filter(m => config.teamConfig!.selectedGroupIds!.includes(m.groupId))
        .map(m => m.personId)
    )
    // Incluir pessoas do grupo + pessoas fixas (mesmo que não estejam no grupo)
    availablePersons = persons.filter(p => 
      selectedPersonIds.has(p.personId) || fixedPersonIds.has(p.personId)
    )
  } else if (config.teamConfig.participantSelection === 'individual' && config.teamConfig.selectedPersonIds) {
    // Incluir pessoas selecionadas + pessoas fixas (mesmo que não estejam selecionadas)
    availablePersons = persons.filter(p => 
      config.teamConfig!.selectedPersonIds!.includes(p.personId) || fixedPersonIds.has(p.personId)
    )
  } else if (config.teamConfig.participantSelection === 'all_with_exclusions') {
    // Modo "Por Pessoas" - todas as pessoas exceto as excluídas + pessoas fixas (mesmo que excluídas)
    const excludedPersonIds = new Set(config.teamConfig.excludedPersonIds || [])
    availablePersons = persons.filter(p => 
      !excludedPersonIds.has(p.personId) || fixedPersonIds.has(p.personId)
    )
  } else {
    // Modo "TODOS" - já inclui todas as pessoas, mas garantir que fixas estejam
    // (já estão incluídas, mas manter para clareza)
  }
  
  if (availablePersons.length === 0) return []
  
  // Filtrar pessoas ausentes se necessário
  if (config.teamConfig.considerAbsences && absences.length > 0) {
    const absentPersonIds = new Set<string>()
    for (const absence of absences) {
      const absenceStart = new Date(absence.startDate)
      const absenceEnd = new Date(absence.endDate)
      
      // Verificar se a ausência sobrepõe o período da escala
      if (absenceStart <= scheduleEnd && absenceEnd >= scheduleStart) {
        absentPersonIds.add(absence.personId)
      }
    }
    
    availablePersons = availablePersons.filter(p => !absentPersonIds.has(p.personId))
  }
  
  if (availablePersons.length === 0) return []
  
  // Criar um mapa de responsabilidades por pessoa
  const personResponsibilitiesMap = new Map<string, Set<string>>()
  
  // Coletar todas as pessoas fixas da equipe
  const allFixedPersonIds = new Set<string>()
  for (const role of team.roles) {
    if (role.fixedPersonIds && role.fixedPersonIds.length > 0) {
      role.fixedPersonIds.forEach(id => allFixedPersonIds.add(id))
    }
  }
  
  // Se a seleção for por grupo, usar APENAS as responsabilidades do grupo
  // Caso contrário, usar responsabilidades da área + grupo
  if (config.teamConfig.participantSelection === 'by_group' && groupMembers.length > 0) {
    // Usar APENAS responsabilidades dos grupos selecionados
    for (const member of groupMembers) {
      if (member.personId && member.responsibilities) {
        const responsibilities = new Set<string>()
        member.responsibilities.forEach(r => responsibilities.add(r.id))
        personResponsibilitiesMap.set(member.personId, responsibilities)
      }
    }
    
    // IMPORTANTE: Adicionar responsabilidades de pessoas fixas que não estão no grupo
    // Buscar responsabilidades da área para pessoas fixas
    for (const fixedPersonId of allFixedPersonIds) {
      if (!personResponsibilitiesMap.has(fixedPersonId)) {
        const fixedPerson = persons.find(p => p.personId === fixedPersonId)
        if (fixedPerson && fixedPerson.responsibilities) {
          const responsibilities = new Set<string>()
          fixedPerson.responsibilities.forEach(r => responsibilities.add(r.id))
          personResponsibilitiesMap.set(fixedPersonId, responsibilities)
        }
      }
    }
  } else {
    // Usar responsabilidades da área + grupo (comportamento padrão)
    // Adicionar responsabilidades da área
    for (const person of availablePersons) {
      const responsibilities = new Set<string>()
      if (person.responsibilities) {
        person.responsibilities.forEach(r => responsibilities.add(r.id))
      }
      personResponsibilitiesMap.set(person.personId, responsibilities)
    }
    
    // Adicionar responsabilidades dos grupos (complementar)
    for (const member of groupMembers) {
      if (member.personId && member.responsibilities) {
        const existing = personResponsibilitiesMap.get(member.personId) || new Set<string>()
        member.responsibilities.forEach(r => existing.add(r.id))
        personResponsibilitiesMap.set(member.personId, existing)
      }
    }
  }
  
  const assignments: Array<{ personId: string; personName: string; roleId: string; roleName: string }> = []
  const usedPersonIds = new Set<string>() // Pessoas já usadas nesta escala
  
  // Ordenar roles por prioridade
  const sortedRoles = [...team.roles].sort((a, b) => a.priority - b.priority)
  
  for (const role of sortedRoles) {
    // PRIMEIRO: Atribuir pessoas fixas (prioridade máxima)
    // Pessoas fixas têm prioridade sobre seleção de grupo - buscar na lista completa
    const fixedPersonsForRole: PersonAreaResponseDto[] = []
    if (role.fixedPersonIds && role.fixedPersonIds.length > 0) {
      for (const fixedPersonId of role.fixedPersonIds) {
        // Buscar na lista completa de pessoas (não apenas availablePersons)
        // pois pessoa fixa pode não estar no grupo selecionado
        const fixedPerson = persons.find(p => p.personId === fixedPersonId)
        if (fixedPerson && !usedPersonIds.has(fixedPerson.personId)) {
          // Verificar se a pessoa fixa tem a responsabilidade necessária (se modo restrito)
          if (config.generationType === 'team_with_restriction') {
            const personResponsibilities = personResponsibilitiesMap.get(fixedPerson.personId) || new Set<string>()
            if (personResponsibilities.has(role.responsibilityId)) {
              fixedPersonsForRole.push(fixedPerson)
            }
          } else {
            fixedPersonsForRole.push(fixedPerson)
          }
        }
      }
    }
    
    // Atribuir pessoas fixas primeiro
    for (const fixedPerson of fixedPersonsForRole) {
      assignments.push({
        personId: fixedPerson.personId,
        personName: fixedPerson.person?.fullName || fixedPerson.personId,
        roleId: role.id,
        roleName: role.responsibilityName,
      })
      usedPersonIds.add(fixedPerson.personId)
    }
    
    // Calcular quantas vagas ainda faltam (quantidade total - pessoas fixas já atribuídas)
    const remainingSlots = role.quantity - fixedPersonsForRole.length
    
    // Se ainda há vagas para preencher, usar algoritmo de balanceamento
    if (remainingSlots > 0) {
      // Filtrar pessoas elegíveis para este papel (excluindo fixas já atribuídas)
      const eligiblePersons = availablePersons.filter(person => {
        // Não pode estar já usada nesta escala
        if (usedPersonIds.has(person.personId)) return false
        
        // Não pode ser pessoa fixa (já foi atribuída acima)
        if (role.fixedPersonIds && role.fixedPersonIds.includes(person.personId)) return false
        
        // Verificar responsabilidade se necessário
        if (config.generationType === 'team_with_restriction') {
          const personResponsibilities = personResponsibilitiesMap.get(person.personId) || new Set<string>()
          return personResponsibilities.has(role.responsibilityId)
        }
        
        return true
      })
      
      // Se não há pessoas elegíveis
      if (eligiblePersons.length === 0) {
        // Se repeatPersonsWhenInsufficient estiver habilitado e houver pessoas disponíveis (mesmo que já usadas), repetir
        if (config.teamConfig?.repeatPersonsWhenInsufficient && availablePersons.length > 0) {
          // Usar todas as pessoas disponíveis, permitindo repetição
          const allAvailablePersons = availablePersons.filter(person => {
            // Não pode ser pessoa fixa (já foi atribuída acima)
            if (role.fixedPersonIds && role.fixedPersonIds.includes(person.personId)) return false
            
            // Verificar responsabilidade se necessário
            if (config.generationType === 'team_with_restriction') {
              const personResponsibilities = personResponsibilitiesMap.get(person.personId) || new Set<string>()
              return personResponsibilities.has(role.responsibilityId)
            }
            
            return true
          })
          
          if (allAvailablePersons.length > 0) {
            // Obter histórico de atribuições para este papel
            const roleHistory = assignmentHistory.get(role.id) || new Map<string, number>()
            
            // Contar quantas atribuições já foram feitas no total (para rotação global)
            const totalAssignmentsSoFar = assignments.length
            
            // Atribuir pessoas repetindo e alternando de forma circular
            // A cada iteração, escolhe a pessoa com menor contagem
            // Se houver empate, usa rotação circular global baseada no total de atribuições
            for (let i = 0; i < remainingSlots; i++) {
              // Criar lista com contagens atualizadas
              const personsWithCount = allAvailablePersons.map((person, originalIndex) => ({
                person,
                count: roleHistory.get(person.personId) || 0,
                originalIndex,
              }))
              
              // Encontrar a menor contagem
              const minCount = Math.min(...personsWithCount.map(p => p.count))
              
              // Filtrar pessoas com menor contagem
              const candidates = personsWithCount.filter(p => p.count === minCount)
              
              // Se há empate (múltiplas pessoas com mesma contagem), usar rotação circular global
              // Baseado no total de atribuições já feitas para garantir alternância entre todos os papéis
              let selected
              if (candidates.length > 1) {
                // Ordenar candidatos pelo índice original para garantir ordem consistente
                candidates.sort((a, b) => a.originalIndex - b.originalIndex)
                // Usar rotação circular global: (totalAssignmentsSoFar + i) % candidates.length
                // Isso garante que a alternância seja consistente entre todos os papéis
                const rotationIndex = (totalAssignmentsSoFar + i) % candidates.length
                selected = candidates[rotationIndex]
              } else {
                selected = candidates[0]
              }
              
              assignments.push({
                personId: selected.person.personId,
                personName: selected.person.person?.fullName || selected.person.personId,
                roleId: role.id,
                roleName: role.responsibilityName,
              })
              
              // Atualizar histórico imediatamente para próxima iteração
              const currentCount = roleHistory.get(selected.person.personId) || 0
              roleHistory.set(selected.person.personId, currentCount + 1)
            }
            assignmentHistory.set(role.id, roleHistory)
            continue
          }
        }
        
        // Se não houver pessoas ou a opção não estiver habilitada, deixar vazio
        for (let i = 0; i < remainingSlots; i++) {
          assignments.push({
            personId: '',
            personName: '[Não atribuído]',
            roleId: role.id,
            roleName: role.responsibilityName,
          })
        }
        continue
      }
      
      // Obter histórico de atribuições para este papel
      const roleHistory = assignmentHistory.get(role.id) || new Map<string, number>()
      
      // Criar lista de pessoas com contagem de atribuições anteriores
      const personsWithCount = eligiblePersons.map((person, index) => ({
        person,
        count: roleHistory.get(person.personId) || 0,
        originalIndex: index,
      }))
      
      // Ordenar por menor contagem (pessoas menos escaladas primeiro)
      // Em caso de empate, usar rotação baseada no scheduleIndex para garantir alternância
      personsWithCount.sort((a, b) => {
        if (a.count !== b.count) return a.count - b.count
        // Em caso de empate, usar rotação baseada no scheduleIndex para distribuir igualmente
        const rotatedIndexA = (a.originalIndex + scheduleIndex) % eligiblePersons.length
        const rotatedIndexB = (b.originalIndex + scheduleIndex) % eligiblePersons.length
        return rotatedIndexA - rotatedIndexB
      })
      
      // Atribuir pessoas para as vagas restantes
      for (let i = 0; i < remainingSlots; i++) {
        if (i < personsWithCount.length) {
          const selected = personsWithCount[i]
          assignments.push({
            personId: selected.person.personId,
            personName: selected.person.person?.fullName || selected.person.personId,
            roleId: role.id,
            roleName: role.responsibilityName,
          })
          usedPersonIds.add(selected.person.personId)
          
          // Atualizar histórico
          const currentCount = roleHistory.get(selected.person.personId) || 0
          roleHistory.set(selected.person.personId, currentCount + 1)
          assignmentHistory.set(role.id, roleHistory)
        } else {
          // Não há pessoas suficientes
          if (config.teamConfig?.repeatPersonsWhenInsufficient && personsWithCount.length > 0) {
            // Recalcular contagens considerando atribuições já feitas nesta iteração
            const updatedPersonsWithCount = personsWithCount.map((p) => ({
              ...p,
              count: roleHistory.get(p.person.personId) || 0,
            }))
            
            // Encontrar a menor contagem
            const minCount = Math.min(...updatedPersonsWithCount.map(p => p.count))
            
            // Filtrar pessoas com a menor contagem
            const candidates = updatedPersonsWithCount.filter(p => p.count === minCount)
            
            // Contar quantas atribuições já foram feitas no total (para rotação global)
            const totalAssignmentsSoFar = assignments.length
            
            // Se há empate, usar rotação circular global baseada no total de atribuições
            let selected
            if (candidates.length > 1) {
              // Ordenar candidatos pelo índice original
              candidates.sort((a, b) => a.originalIndex - b.originalIndex)
              // Usar rotação circular global: (totalAssignmentsSoFar + i) % candidates.length
              // Isso garante que a alternância seja consistente entre todos os papéis
              const rotationIndex = (totalAssignmentsSoFar + i) % candidates.length
              selected = candidates[rotationIndex]
            } else {
              selected = candidates[0]
            }
            
            assignments.push({
              personId: selected.person.personId,
              personName: selected.person.person?.fullName || selected.person.personId,
              roleId: role.id,
              roleName: role.responsibilityName,
            })
            
            // Atualizar histórico imediatamente
            const currentCount = roleHistory.get(selected.person.personId) || 0
            roleHistory.set(selected.person.personId, currentCount + 1)
            assignmentHistory.set(role.id, roleHistory)
          } else {
            // Deixar vazio
            assignments.push({
              personId: '',
              personName: '[Não atribuído]',
              roleId: role.id,
              roleName: role.responsibilityName,
            })
          }
        }
      }
    }
  }
  
  return assignments
}

