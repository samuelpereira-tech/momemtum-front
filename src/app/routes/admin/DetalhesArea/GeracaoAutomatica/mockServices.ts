// Serviços mockados para geração automática de escalas

import type { GenerationConfiguration, GenerationPreview, SchedulePreview } from './types'

// Mock de grupos
export const mockGroups = [
  { id: '1', name: 'Grupo A', memberCount: 5 },
  { id: '2', name: 'Grupo B', memberCount: 4 },
  { id: '3', name: 'Grupo C', memberCount: 6 },
  { id: '4', name: 'Grupo D', memberCount: 3 },
]

// Mock de equipes
export const mockTeams = [
  {
    id: '1',
    name: 'Equipe de Louvor Dominical',
    roles: [
      { id: 'r1', name: 'Baterista', quantity: 1, priority: 1, responsibilityId: 'resp1' },
      { id: 'r2', name: 'Tecladista', quantity: 1, priority: 2, responsibilityId: 'resp2' },
      { id: 'r3', name: 'Vocalista', quantity: 2, priority: 3, responsibilityId: 'resp3' },
    ],
  },
  {
    id: '2',
    name: 'Equipe de Som',
    roles: [
      { id: 'r4', name: 'Operador de Som', quantity: 2, priority: 1, responsibilityId: 'resp4' },
      { id: 'r5', name: 'Auxiliar', quantity: 1, priority: 2, responsibilityId: 'resp5' },
    ],
  },
]

// Mock de pessoas
export const mockPersons = [
  { id: 'p1', fullName: 'João Silva', email: 'joao@example.com', photoUrl: null, groupIds: ['1'], responsibilities: ['resp1', 'resp3'] },
  { id: 'p2', fullName: 'Maria Santos', email: 'maria@example.com', photoUrl: null, groupIds: ['1'], responsibilities: ['resp2', 'resp3'] },
  { id: 'p3', fullName: 'Pedro Oliveira', email: 'pedro@example.com', photoUrl: null, groupIds: ['2'], responsibilities: ['resp1', 'resp3'] },
  { id: 'p4', fullName: 'Ana Costa', email: 'ana@example.com', photoUrl: null, groupIds: ['2'], responsibilities: ['resp3'] },
  { id: 'p5', fullName: 'Bruno Lima', email: 'bruno@example.com', photoUrl: null, groupIds: ['3'], responsibilities: ['resp2', 'resp3', 'resp4'] },
  { id: 'p6', fullName: 'Mariana Souza', email: 'mariana@example.com', photoUrl: null, groupIds: ['3'], responsibilities: ['resp3'] },
  { id: 'p7', fullName: 'Carlos Mendes', email: 'carlos@example.com', photoUrl: null, groupIds: ['4'], responsibilities: ['resp4', 'resp5'] },
]

// Mock de ausências
export const mockAbsences = [
  { personId: 'p1', startDate: '2025-01-15', endDate: '2025-01-20', type: 'Férias' },
  { personId: 'p3', startDate: '2025-01-10', endDate: '2025-01-12', type: 'Licença' },
]

// Função para gerar preview mockado
export async function generatePreviewMock(config: GenerationConfiguration): Promise<GenerationPreview> {
  // Simular delay de API
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const schedules: SchedulePreview[] = []
  const startDate = new Date(config.periodStartDate)
  const endDate = new Date(config.periodEndDate)
  
  // Gerar escalas baseado no tipo de período
  if (config.periodType === 'fixed') {
    schedules.push({
      id: 's1',
      startDatetime: config.periodConfig?.baseDateTime || config.periodStartDate,
      endDatetime: config.periodEndDate,
      groups: config.generationType === 'group' && config.groupConfig
        ? mockGroups.filter(g => config.groupConfig!.groupIds.includes(g.id)).map(g => ({ id: g.id, name: g.name }))
        : undefined,
      team: config.generationType !== 'group' && config.teamConfig
        ? mockTeams.find(t => t.id === config.teamConfig!.teamId)
        : undefined,
      assignments: config.generationType !== 'group' && config.teamConfig
        ? generateMockAssignments(config)
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
      
      schedules.push({
        id: `s${scheduleIndex}`,
        startDatetime: scheduleStart.toISOString(),
        endDatetime: scheduleEnd.toISOString(),
        groups: config.generationType === 'group' && config.groupConfig
          ? [mockGroups[(scheduleIndex - 1) % config.groupConfig.groupIds.length]]
          : undefined,
        team: config.generationType !== 'group' && config.teamConfig
          ? mockTeams.find(t => t.id === config.teamConfig!.teamId)
          : undefined,
        assignments: config.generationType !== 'group' && config.teamConfig
          ? generateMockAssignments(config, scheduleIndex)
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
      schedules.push({
        id: `s${scheduleIndex}`,
        startDatetime: currentDate.toISOString(),
        endDatetime: new Date(currentDate.getTime() + (config.periodConfig?.duration || 1) * 24 * 60 * 60 * 1000).toISOString(),
        groups: config.generationType === 'group' && config.groupConfig
          ? [mockGroups[(scheduleIndex - 1) % config.groupConfig.groupIds.length]]
          : undefined,
        team: config.generationType !== 'group' && config.teamConfig
          ? mockTeams.find(t => t.id === config.teamConfig!.teamId)
          : undefined,
        assignments: config.generationType !== 'group' && config.teamConfig
          ? generateMockAssignments(config, scheduleIndex)
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
        
        schedules.push({
          id: `s${scheduleIndex}`,
          startDatetime: scheduleStart.toISOString(),
          endDatetime: scheduleEnd.toISOString(),
          groups: config.generationType === 'group' && config.groupConfig
            ? [mockGroups[(scheduleIndex - 1) % config.groupConfig.groupIds.length]]
            : undefined,
          team: config.generationType !== 'group' && config.teamConfig
            ? mockTeams.find(t => t.id === config.teamConfig!.teamId)
            : undefined,
          assignments: config.generationType !== 'group' && config.teamConfig
            ? generateMockAssignments(config, scheduleIndex)
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

function generateMockAssignments(config: GenerationConfiguration, scheduleIndex: number = 1) {
  if (!config.teamConfig) return []
  
  const team = mockTeams.find(t => t.id === config.teamConfig!.teamId)
  if (!team) return []
  
  const assignments: Array<{ personId: string; personName: string; roleId: string; roleName: string }> = []
  let personIndex = scheduleIndex % mockPersons.length
  
  for (const role of team.roles) {
    for (let i = 0; i < role.quantity; i++) {
      const person = mockPersons[personIndex % mockPersons.length]
      assignments.push({
        personId: person.id,
        personName: person.fullName,
        roleId: role.id,
        roleName: role.name,
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

