import { apiClient } from '../../utils/apiClient'
import type { PersonInfoDto, GroupInfoDto, ResponsibilityInfoDto } from './groupService'

// DTOs baseados na documentação da API
export interface CreateGroupMemberDto {
  personId: string
  responsibilityIds: string[]
}

export interface UpdateGroupMemberDto {
  responsibilityIds: string[]
}

export interface GroupMemberResponseDto {
  id: string
  personId: string
  person: PersonInfoDto | null
  groupId: string
  group: GroupInfoDto | null
  responsibilities: ResponsibilityInfoDto[]
  createdAt: string
  updatedAt: string
}

export interface PaginatedGroupMemberResponseDto {
  data: GroupMemberResponseDto[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface GroupMemberFilters {
  page?: number
  limit?: number
  personName?: string
  personEmail?: string
  responsibilityId?: string
}

/**
 * Serviço para gerenciar membros de grupos
 */
export class GroupMemberService {
  private readonly baseEndpoint = '/api/scheduled-areas'

  /**
   * Adiciona uma pessoa a um grupo com responsabilidades
   */
  async addMemberToGroup(
    scheduledAreaId: string,
    groupId: string,
    data: CreateGroupMemberDto
  ): Promise<GroupMemberResponseDto> {
    return apiClient<GroupMemberResponseDto>(
      `${this.baseEndpoint}/${scheduledAreaId}/groups/${groupId}/members`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )
  }

  /**
   * Lista todos os membros de um grupo com paginação e filtros
   */
  async getMembersInGroup(
    scheduledAreaId: string,
    groupId: string,
    filters: GroupMemberFilters = {}
  ): Promise<PaginatedGroupMemberResponseDto> {
    const queryParams = new URLSearchParams()

    if (filters.page) queryParams.append('page', filters.page.toString())
    if (filters.limit) queryParams.append('limit', filters.limit.toString())
    if (filters.personName) queryParams.append('personName', filters.personName)
    if (filters.personEmail) queryParams.append('personEmail', filters.personEmail)
    if (filters.responsibilityId) queryParams.append('responsibilityId', filters.responsibilityId)

    const queryString = queryParams.toString()
    const url = queryString
      ? `${this.baseEndpoint}/${scheduledAreaId}/groups/${groupId}/members?${queryString}`
      : `${this.baseEndpoint}/${scheduledAreaId}/groups/${groupId}/members`

    return apiClient<PaginatedGroupMemberResponseDto>(url)
  }

  /**
   * Obtém um membro de grupo pelo ID do membro
   */
  async getGroupMemberById(
    scheduledAreaId: string,
    groupId: string,
    memberId: string
  ): Promise<GroupMemberResponseDto> {
    return apiClient<GroupMemberResponseDto>(
      `${this.baseEndpoint}/${scheduledAreaId}/groups/${groupId}/members/${memberId}`
    )
  }

  /**
   * Obtém um membro de grupo pelo ID da pessoa
   */
  async getGroupMemberByPersonId(
    scheduledAreaId: string,
    groupId: string,
    personId: string
  ): Promise<GroupMemberResponseDto> {
    return apiClient<GroupMemberResponseDto>(
      `${this.baseEndpoint}/${scheduledAreaId}/groups/${groupId}/members/by-person/${personId}`
    )
  }

  /**
   * Atualiza as responsabilidades de um membro no grupo
   */
  async updateGroupMember(
    scheduledAreaId: string,
    groupId: string,
    memberId: string,
    data: UpdateGroupMemberDto
  ): Promise<GroupMemberResponseDto> {
    return apiClient<GroupMemberResponseDto>(
      `${this.baseEndpoint}/${scheduledAreaId}/groups/${groupId}/members/${memberId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    )
  }

  /**
   * Remove um membro de um grupo
   */
  async removeMemberFromGroup(
    scheduledAreaId: string,
    groupId: string,
    memberId: string
  ): Promise<void> {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${this.baseEndpoint}/${scheduledAreaId}/groups/${groupId}/members/${memberId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      }
    )

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Não autorizado')
      }
      if (response.status === 404) {
        throw new Error('Membro do grupo não encontrado')
      }
      throw new Error(`Erro ao remover membro do grupo: ${response.status}`)
    }

    // DELETE retorna 204 (No Content)
    if (response.status !== 204) {
      return response.json()
    }
  }

  /**
   * Obtém todos os grupos que uma pessoa pertence em uma área
   */
  async getGroupsByPersonId(
    scheduledAreaId: string,
    personId: string
  ): Promise<GroupMemberResponseDto[]> {
    // Primeiro, obter todos os grupos da área
    const { groupService } = await import('./groupService')
    let allGroups: Array<{ id: string }> = []
    let page = 1
    let hasMore = true
    const limit = 100

    while (hasMore) {
      const response = await groupService.getGroupsInArea(scheduledAreaId, {
        page,
        limit,
      })
      allGroups = [...allGroups, ...response.data]

      if (page >= response.meta.totalPages || response.data.length === 0) {
        hasMore = false
      } else {
        page++
      }
    }

    // Para cada grupo, verificar se a pessoa é membro
    const personGroups: GroupMemberResponseDto[] = []
    for (const group of allGroups) {
      try {
        const member = await this.getGroupMemberByPersonId(
          scheduledAreaId,
          group.id,
          personId
        )
        personGroups.push(member)
      } catch (error) {
        // Pessoa não é membro deste grupo, continuar
      }
    }

    return personGroups
  }
}

// Instância singleton do serviço
export const groupMemberService = new GroupMemberService()

