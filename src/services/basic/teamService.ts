// Serviço mockado para equipes - apenas para validação de layout

export interface TeamRoleDto {
  id: string
  responsibilityId: string
  responsibilityName: string
  quantity: number
  priority: number
  isFree: boolean // true = livre para qualquer pessoa, false = pessoas fixas
  fixedPersonIds: string[]
}

export interface CreateTeamDto {
  name: string
  description?: string
  scheduledAreaId: string
  roles: Omit<TeamRoleDto, 'id' | 'responsibilityName'> & { responsibilityName?: string }[]
}

export interface UpdateTeamDto {
  name?: string
  description?: string
  roles?: (Omit<TeamRoleDto, 'id' | 'responsibilityName'> & { id?: string; responsibilityName?: string })[]
}

export interface TeamResponseDto {
  id: string
  name: string
  description: string | null
  scheduledAreaId: string
  roles: TeamRoleDto[]
  createdAt: string
  updatedAt: string
}

export interface PaginatedTeamResponseDto {
  data: TeamResponseDto[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * Serviço mockado para gerenciar equipes
 * TODO: Implementar chamadas reais à API quando disponível
 */
export class TeamService {
  private teams: TeamResponseDto[] = []
  private nextId = 1

  /**
   * Cria uma nova equipe
   */
  async createTeam(scheduledAreaId: string, data: CreateTeamDto): Promise<TeamResponseDto> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 300))

    const newTeam: TeamResponseDto = {
      id: `team-${this.nextId++}`,
      name: data.name,
      description: data.description || null,
      scheduledAreaId,
      roles: data.roles.map(role => ({
        ...role,
        id: `role-${Date.now()}-${Math.random()}`,
        responsibilityName: role.responsibilityName || `Função ${role.responsibilityId}` // Usar nome fornecido ou mock
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.teams.push(newTeam)
    return newTeam
  }

  /**
   * Lista todas as equipes de uma área
   */
  async getTeamsInArea(scheduledAreaId: string, options: { page?: number; limit?: number } = {}): Promise<PaginatedTeamResponseDto> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 200))

    const filteredTeams = this.teams.filter(t => t.scheduledAreaId === scheduledAreaId)
    const page = options.page || 1
    const limit = options.limit || 100
    const start = (page - 1) * limit
    const end = start + limit

    return {
      data: filteredTeams.slice(start, end),
      meta: {
        page,
        limit,
        total: filteredTeams.length,
        totalPages: Math.ceil(filteredTeams.length / limit)
      }
    }
  }

  /**
   * Obtém uma equipe pelo ID
   */
  async getTeamById(scheduledAreaId: string, teamId: string): Promise<TeamResponseDto> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 200))

    const team = this.teams.find(t => t.id === teamId && t.scheduledAreaId === scheduledAreaId)
    if (!team) {
      throw new Error('Equipe não encontrada')
    }
    return team
  }

  /**
   * Atualiza uma equipe
   */
  async updateTeam(scheduledAreaId: string, teamId: string, data: UpdateTeamDto): Promise<TeamResponseDto> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 300))

    const index = this.teams.findIndex(t => t.id === teamId && t.scheduledAreaId === scheduledAreaId)
    if (index === -1) {
      throw new Error('Equipe não encontrada')
    }

    const updatedTeam: TeamResponseDto = {
      ...this.teams[index],
      ...data,
      roles: data.roles 
        ? data.roles.map(role => ({
            ...role,
            id: role.id || `role-${Date.now()}-${Math.random()}`,
            responsibilityName: role.responsibilityName || `Função ${role.responsibilityId}` // Usar nome fornecido ou mock
          }))
        : this.teams[index].roles,
      updatedAt: new Date().toISOString()
    }

    this.teams[index] = updatedTeam
    return updatedTeam
  }

  /**
   * Deleta uma equipe
   */
  async deleteTeam(scheduledAreaId: string, teamId: string): Promise<void> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 200))

    const index = this.teams.findIndex(t => t.id === teamId && t.scheduledAreaId === scheduledAreaId)
    if (index === -1) {
      throw new Error('Equipe não encontrada')
    }

    this.teams.splice(index, 1)
  }
}

// Instância singleton do serviço
export const teamService = new TeamService()

