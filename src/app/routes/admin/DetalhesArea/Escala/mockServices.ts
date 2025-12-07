// Serviços mockados para grupos de escalas e escalas

export interface ScheduleGroupDto {
  id: string
  name: string
  description?: string
  scheduledAreaId: string
  schedulesCount: number
  createdAt: string
  updatedAt: string
}

export interface ScheduleMemberDto {
  id: string
  personId: string
  personName: string
  personPhotoUrl?: string
  responsibilityId: string
  responsibilityName: string
  responsibilityImageUrl?: string
  status: 'pending' | 'accepted' | 'rejected'
}

export interface ScheduleCommentDto {
  id: string
  content: string
  authorName: string
  createdAt: string
  updatedAt: string
}

export interface ScheduleDto {
  id: string
  scheduleGroupId?: string
  scheduledAreaId: string
  startDatetime: string
  endDatetime: string
  status: 'pending' | 'confirmed' | 'cancelled'
  participantsCount: number
  members?: ScheduleMemberDto[]
  comments?: ScheduleCommentDto[]
  createdAt: string
  updatedAt: string
}

export interface ScheduleDetailsDto extends ScheduleDto {
  members: ScheduleMemberDto[]
  comments: ScheduleCommentDto[]
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Função para gerar dados mockados dinamicamente baseado no scheduledAreaId
const generateMockScheduleGroups = (scheduledAreaId: string): ScheduleGroupDto[] => {
  return Array.from({ length: 25 }, (_, i) => ({
    id: `group-${scheduledAreaId}-${i + 1}`,
    name: `Grupo de Escala ${i + 1}`,
    description: i % 3 === 0 ? `Descrição do grupo de escala ${i + 1}` : undefined,
    scheduledAreaId: scheduledAreaId,
    schedulesCount: Math.floor(Math.random() * 20) + 5,
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  }))
}

// Nomes e funções mockadas para membros
const mockPersonNames = [
  'João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Souza',
  'Juliana Lima', 'Roberto Alves', 'Fernanda Rocha', 'Lucas Pereira', 'Camila Ferreira',
  'Rafael Martins', 'Beatriz Gomes', 'Thiago Ribeiro', 'Larissa Dias', 'Gabriel Nunes'
]

export const mockResponsibilities = [
  { id: 'resp-1', name: 'Enfermeiro', imageUrl: null },
  { id: 'resp-2', name: 'Médico', imageUrl: null },
  { id: 'resp-3', name: 'Técnico', imageUrl: null },
  { id: 'resp-4', name: 'Auxiliar', imageUrl: null },
  { id: 'resp-5', name: 'Supervisor', imageUrl: null },
]

const generateMockMembers = (scheduleId: string, count: number): ScheduleMemberDto[] => {
  return Array.from({ length: count }, (_, i) => {
    const personIndex = i % mockPersonNames.length
    const respIndex = i % mockResponsibilities.length
    const responsibility = mockResponsibilities[respIndex]

    return {
      id: `member-${scheduleId}-${i + 1}`,
      personId: `person-${personIndex + 1}`,
      personName: mockPersonNames[personIndex],
      personPhotoUrl: i % 3 === 0 ? `https://i.pravatar.cc/150?img=${personIndex + 1}` : undefined,
      responsibilityId: responsibility.id,
      responsibilityName: responsibility.name,
      responsibilityImageUrl: responsibility.imageUrl,
      status: ['pending', 'accepted', 'rejected'][Math.floor(Math.random() * 3)] as 'pending' | 'accepted' | 'rejected',
    }
  })
}

const generateMockComments = (scheduleId: string): ScheduleCommentDto[] => {
  const commentCount = Math.floor(Math.random() * 3) // 0 a 2 comentários
  return Array.from({ length: commentCount }, (_, i) => ({
    id: `comment-${scheduleId}-${i + 1}`,
    content: `Comentário ${i + 1} sobre esta escala. Informações importantes sobre o planejamento.`,
    authorName: mockPersonNames[i % mockPersonNames.length],
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString(),
  }))
}

const generateMockSchedules = (scheduledAreaId: string): ScheduleDto[] => {
  return Array.from({ length: 150 }, (_, i) => {
    const groupIndex = Math.floor(i / 10)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + i)
    const endDate = new Date(startDate)
    endDate.setHours(endDate.getHours() + 8)

    const scheduleId = `schedule-${scheduledAreaId}-${i + 1}`
    const participantsCount = Math.floor(Math.random() * 15) + 3

    return {
      id: scheduleId,
      scheduleGroupId: groupIndex < 15 ? `group-${scheduledAreaId}-${groupIndex + 1}` : undefined,
      scheduledAreaId: scheduledAreaId,
      startDatetime: startDate.toISOString(),
      endDatetime: endDate.toISOString(),
      status: ['pending', 'confirmed', 'cancelled'][Math.floor(Math.random() * 3)] as 'pending' | 'confirmed' | 'cancelled',
      participantsCount: participantsCount,
      createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
  })
}

// Armazenar dados detalhados em memória (simulando banco de dados)
const scheduleDetailsCache = new Map<string, ScheduleDetailsDto>()

const getOrCreateScheduleDetails = (scheduleId: string, schedule: ScheduleDto): ScheduleDetailsDto => {
  if (!scheduleDetailsCache.has(scheduleId)) {
    const members = generateMockMembers(scheduleId, schedule.participantsCount)
    const comments = generateMockComments(scheduleId)
    scheduleDetailsCache.set(scheduleId, {
      ...schedule,
      members,
      comments,
    })
  }
  return scheduleDetailsCache.get(scheduleId)!
}

// Função para simular delay de API
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Buscar grupos de escalas paginados
export async function getScheduleGroups(
  scheduledAreaId: string,
  options: { page: number; limit: number } = { page: 1, limit: 10 }
): Promise<PaginatedResponse<ScheduleGroupDto>> {
  await delay(300) // Simular delay de API

  const mockScheduleGroups = generateMockScheduleGroups(scheduledAreaId)
  const filtered = mockScheduleGroups.filter(g => g.scheduledAreaId === scheduledAreaId)
  const start = (options.page - 1) * options.limit
  const end = start + options.limit
  const paginated = filtered.slice(start, end)
  const totalPages = Math.ceil(filtered.length / options.limit)

  return {
    data: paginated,
    meta: {
      page: options.page,
      limit: options.limit,
      total: filtered.length,
      totalPages,
    },
  }
}

// Buscar escalas paginadas (com ou sem filtro de grupo)
export async function getSchedules(
  scheduledAreaId: string,
  options: {
    page: number
    limit: number
    scheduleGroupId?: string
  } = { page: 1, limit: 10 }
): Promise<PaginatedResponse<ScheduleDto>> {
  await delay(300) // Simular delay de API

  const mockSchedules = generateMockSchedules(scheduledAreaId)
  let filtered = mockSchedules.filter(s => s.scheduledAreaId === scheduledAreaId)

  // Se há filtro de grupo, aplicar
  if (options.scheduleGroupId) {
    filtered = filtered.filter(s => s.scheduleGroupId === options.scheduleGroupId)
  }

  // Ordenar por data de início (mais recentes primeiro)
  filtered.sort((a, b) => new Date(b.startDatetime).getTime() - new Date(a.startDatetime).getTime())

  const start = (options.page - 1) * options.limit
  const end = start + options.limit
  const paginated = filtered.slice(start, end)
  const totalPages = Math.ceil(filtered.length / options.limit)

  return {
    data: paginated,
    meta: {
      page: options.page,
      limit: options.limit,
      total: filtered.length,
      totalPages,
    },
  }
}

// Buscar detalhes completos de uma escala
export async function getScheduleDetails(scheduleId: string): Promise<ScheduleDetailsDto> {
  await delay(300)

  // Buscar a escala base - simular busca em todas as áreas
  const allSchedules: ScheduleDto[] = []
  for (let i = 0; i < 10; i++) {
    allSchedules.push(...generateMockSchedules(`area-${i}`))
  }

  const schedule = allSchedules.find(s => s.id === scheduleId)
  if (!schedule) {
    // Se não encontrou, criar uma escala mockada
    const mockSchedule: ScheduleDto = {
      id: scheduleId,
      scheduledAreaId: scheduleId.split('-')[1] || 'area-1',
      startDatetime: new Date().toISOString(),
      endDatetime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      participantsCount: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return getOrCreateScheduleDetails(scheduleId, mockSchedule)
  }

  return getOrCreateScheduleDetails(scheduleId, schedule)
}

// Adicionar comentário à escala
export async function addScheduleComment(
  scheduleId: string,
  content: string,
  authorName: string = 'Usuário Atual'
): Promise<ScheduleCommentDto> {
  await delay(300)

  let details = scheduleDetailsCache.get(scheduleId)
  if (!details) {
    details = await getScheduleDetails(scheduleId)
  }

  const newComment: ScheduleCommentDto = {
    id: `comment-${scheduleId}-${Date.now()}`,
    content,
    authorName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  details.comments.push(newComment)
  scheduleDetailsCache.set(scheduleId, details)

  return newComment
}

// Atualizar comentário
export async function updateScheduleComment(
  scheduleId: string,
  commentId: string,
  content: string
): Promise<ScheduleCommentDto> {
  await delay(300)

  const details = scheduleDetailsCache.get(scheduleId)
  if (!details) {
    throw new Error('Escala não encontrada')
  }

  const comment = details.comments.find(c => c.id === commentId)
  if (!comment) {
    throw new Error('Comentário não encontrado')
  }

  comment.content = content
  comment.updatedAt = new Date().toISOString()
  scheduleDetailsCache.set(scheduleId, details)

  return comment
}

// Remover comentário
export async function deleteScheduleComment(
  scheduleId: string,
  commentId: string
): Promise<void> {
  await delay(300)

  const details = scheduleDetailsCache.get(scheduleId)
  if (!details) {
    throw new Error('Escala não encontrada')
  }

  details.comments = details.comments.filter(c => c.id !== commentId)
  scheduleDetailsCache.set(scheduleId, details)
}

// Remover membro da escala
export async function removeScheduleMember(
  scheduleId: string,
  memberId: string
): Promise<void> {
  await delay(300)

  let details = scheduleDetailsCache.get(scheduleId)
  if (!details) {
    details = await getScheduleDetails(scheduleId)
  }

  details.members = details.members.filter(m => m.id !== memberId)
  details.participantsCount = details.members.length
  scheduleDetailsCache.set(scheduleId, details)
}

// Atualizar membro da escala (trocar função)
export async function updateScheduleMember(
  scheduleId: string,
  memberId: string,
  responsibilityId: string,
  responsibilityName: string
): Promise<ScheduleMemberDto> {
  await delay(300)

  let details = scheduleDetailsCache.get(scheduleId)
  if (!details) {
    details = await getScheduleDetails(scheduleId)
  }

  const member = details.members.find(m => m.id === memberId)
  if (!member) {
    throw new Error('Membro não encontrado')
  }

  const responsibility = mockResponsibilities.find(r => r.id === responsibilityId)
  member.responsibilityId = responsibilityId
  member.responsibilityName = responsibilityName
  member.responsibilityImageUrl = responsibility?.imageUrl

  scheduleDetailsCache.set(scheduleId, details)

  return member
}

// Atualizar status do membro
export async function updateScheduleMemberStatus(
  scheduleId: string,
  memberId: string,
  status: 'pending' | 'accepted' | 'rejected'
): Promise<ScheduleMemberDto> {
  await delay(300)

  let details = scheduleDetailsCache.get(scheduleId)
  if (!details) {
    details = await getScheduleDetails(scheduleId)
  }

  const member = details.members.find(m => m.id === memberId)
  if (!member) {
    throw new Error('Membro não encontrado')
  }

  member.status = status

  scheduleDetailsCache.set(scheduleId, details)

  return member
}

// Adicionar membro à escala
export async function addScheduleMember(
  scheduleId: string,
  personId: string,
  personName: string,
  personPhotoUrl: string | undefined,
  responsibilityId: string,
  responsibilityName: string
): Promise<ScheduleMemberDto> {
  await delay(300)

  let details = scheduleDetailsCache.get(scheduleId)
  if (!details) {
    details = await getScheduleDetails(scheduleId)
  }

  const responsibility = mockResponsibilities.find(r => r.id === responsibilityId)
  const newMember: ScheduleMemberDto = {
    id: `member-${scheduleId}-${Date.now()}`,
    personId,
    personName,
    personPhotoUrl,
    responsibilityId,
    responsibilityName,
    responsibilityImageUrl: responsibility?.imageUrl,
  }

  details.members.push(newMember)
  details.participantsCount = details.members.length
  scheduleDetailsCache.set(scheduleId, details)

  return newMember
}
