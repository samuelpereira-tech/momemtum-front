// Serviços para geração automática de escalas

import type { GenerationConfiguration, GenerationPreview, SchedulePreview } from './types'
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
    
    for (const groupId of groupIds) {
      const group = groups.find(g => g.id === groupId)
      if (!group) continue
      
      // Buscar membros do grupo nos groupMembers
      const groupMembersList = groupMembers.filter(m => m.groupId === groupId)
      
      const members = groupMembersList.map(member => {
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
  
  // Gerar escalas baseado no tipo de período
  if (config.periodType === 'fixed') {
    const scheduleStart = new Date(config.periodConfig?.baseDateTime || config.periodStartDate)
    const scheduleEnd = new Date(config.periodEndDate)
    
    const selectedGroupIds = config.generationType === 'group' && config.groupConfig
      ? config.groupConfig.groupIds
      : []
    
    schedules.push({
      id: 's1',
      startDatetime: scheduleStart.toISOString(),
      endDatetime: scheduleEnd.toISOString(),
      groups: selectedGroupIds.length > 0
        ? enrichGroupsWithMembers(selectedGroupIds)
        : undefined,
      team: config.generationType !== 'group' && config.teamConfig
        ? teams.find(t => t.id === config.teamConfig!.teamId) ? { id: teams.find(t => t.id === config.teamConfig!.teamId)!.id, name: teams.find(t => t.id === config.teamConfig!.teamId)!.name } : undefined
        : undefined,
        assignments: config.generationType !== 'group' && config.teamConfig
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
      
      const selectedGroups = groups.filter(g => config.groupConfig?.groupIds.includes(g.id))
      const selectedTeam = teams.find(t => t.id === config.teamConfig?.teamId)
      
      const selectedGroupIds = config.generationType === 'group' && config.groupConfig && selectedGroups.length > 0
        ? [selectedGroups[(scheduleIndex - 1) % selectedGroups.length].id]
        : []
      
      schedules.push({
        id: `s${scheduleIndex}`,
        startDatetime: scheduleStart.toISOString(),
        endDatetime: scheduleEnd.toISOString(),
        groups: selectedGroupIds.length > 0
          ? await enrichGroupsWithMembers(selectedGroupIds)
          : undefined,
        team: config.generationType !== 'group' && config.teamConfig && selectedTeam
          ? { id: selectedTeam.id, name: selectedTeam.name }
          : undefined,
        assignments: config.generationType !== 'group' && config.teamConfig
          ? generateAssignments(config, teams, persons, scheduleIndex, groupMembers, absences, scheduleStart, scheduleEnd, assignmentHistory)
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
      const scheduleStart = new Date(currentDate)
      const scheduleEnd = new Date(currentDate.getTime() + (config.periodConfig?.duration || 1) * 24 * 60 * 60 * 1000)
      
      const selectedGroups = groups.filter(g => config.groupConfig?.groupIds.includes(g.id))
      const selectedTeam = teams.find(t => t.id === config.teamConfig?.teamId)
      
      const selectedGroupIds = config.generationType === 'group' && config.groupConfig && selectedGroups.length > 0
        ? [selectedGroups[(scheduleIndex - 1) % selectedGroups.length].id]
        : []
      
      schedules.push({
        id: `s${scheduleIndex}`,
        startDatetime: scheduleStart.toISOString(),
        endDatetime: scheduleEnd.toISOString(),
        groups: selectedGroupIds.length > 0
          ? await enrichGroupsWithMembers(selectedGroupIds)
          : undefined,
        team: config.generationType !== 'group' && config.teamConfig && selectedTeam
          ? { id: selectedTeam.id, name: selectedTeam.name }
          : undefined,
        assignments: config.generationType !== 'group' && config.teamConfig
          ? generateAssignments(config, teams, persons, scheduleIndex, groupMembers, absences, scheduleStart, scheduleEnd, assignmentHistory)
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
        
        const selectedGroupIds = config.generationType === 'group' && config.groupConfig && selectedGroups.length > 0
          ? [selectedGroups[(scheduleIndex - 1) % selectedGroups.length].id]
          : []
        
        schedules.push({
          id: `s${scheduleIndex}`,
          startDatetime: scheduleStart.toISOString(),
          endDatetime: scheduleEnd.toISOString(),
          groups: selectedGroupIds.length > 0
            ? await enrichGroupsWithMembers(selectedGroupIds)
            : undefined,
          team: config.generationType !== 'group' && config.teamConfig && selectedTeam
            ? { id: selectedTeam.id, name: selectedTeam.name }
            : undefined,
          assignments: config.generationType !== 'group' && config.teamConfig
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
      
      // Se não há pessoas elegíveis, deixar vazio
      if (eligiblePersons.length === 0) {
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
          // Não há pessoas suficientes, deixar vazio
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
  
  return assignments
}

