import { apiClient } from '../../utils/apiClient'

// DTOs baseados na documentação da API
export interface CreateGroupDto {
  name: string
  description?: string
}

export interface UpdateGroupDto {
  name?: string
  description?: string
}

export interface PersonInfoDto {
  id: string
  fullName: string
  email: string
  photoUrl: string | null
}

export interface GroupInfoDto {
  id: string
  name: string
}

export interface ScheduledAreaDto {
  id: string
  name: string
}

export interface ResponsibilityInfoDto {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
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

export interface GroupResponseDto {
  id: string
  name: string
  description: string | null
  scheduledAreaId: string
  scheduledArea: ScheduledAreaDto | null
  membersCount: number
  members: GroupMemberResponseDto[]
  createdAt: string
  updatedAt: string
}

export interface PaginatedGroupResponseDto {
  data: GroupResponseDto[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface GroupFilters {
  page?: number
  limit?: number
  name?: string
}

/**
 * Serviço para gerenciar grupos dentro de áreas de escala
 */
export class GroupService {
  private readonly baseEndpoint = '/api/scheduled-areas'

  /**
   * Cria um novo grupo em uma área de escala
   */
  async createGroup(
    scheduledAreaId: string,
    data: CreateGroupDto
  ): Promise<GroupResponseDto> {
    return apiClient<GroupResponseDto>(
      `${this.baseEndpoint}/${scheduledAreaId}/groups`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )
  }

  /**
   * Lista todos os grupos em uma área de escala com paginação e filtros
   */
  async getGroupsInArea(
    scheduledAreaId: string,
    filters: GroupFilters = {}
  ): Promise<PaginatedGroupResponseDto> {
    const queryParams = new URLSearchParams()

    if (filters.page) queryParams.append('page', filters.page.toString())
    if (filters.limit) queryParams.append('limit', filters.limit.toString())
    if (filters.name) queryParams.append('name', filters.name)

    const queryString = queryParams.toString()
    const url = queryString
      ? `${this.baseEndpoint}/${scheduledAreaId}/groups?${queryString}`
      : `${this.baseEndpoint}/${scheduledAreaId}/groups`

    return apiClient<PaginatedGroupResponseDto>(url)
  }

  /**
   * Obtém um grupo pelo ID
   */
  async getGroupById(
    scheduledAreaId: string,
    groupId: string
  ): Promise<GroupResponseDto> {
    return apiClient<GroupResponseDto>(
      `${this.baseEndpoint}/${scheduledAreaId}/groups/${groupId}`
    )
  }

  /**
   * Atualiza um grupo
   */
  async updateGroup(
    scheduledAreaId: string,
    groupId: string,
    data: UpdateGroupDto
  ): Promise<GroupResponseDto> {
    return apiClient<GroupResponseDto>(
      `${this.baseEndpoint}/${scheduledAreaId}/groups/${groupId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    )
  }

  /**
   * Remove um grupo
   */
  async deleteGroup(
    scheduledAreaId: string,
    groupId: string
  ): Promise<void> {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${this.baseEndpoint}/${scheduledAreaId}/groups/${groupId}`,
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
        throw new Error('Grupo não encontrado')
      }
      throw new Error(`Erro ao remover grupo: ${response.status}`)
    }

    // DELETE retorna 204 (No Content)
    if (response.status !== 204) {
      return response.json()
    }
  }
}

// Instância singleton do serviço
export const groupService = new GroupService()









