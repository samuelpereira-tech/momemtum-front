import { apiClient } from '../../utils/apiClient'

// DTOs baseados na documentação da API
export interface CreatePersonDto {
  fullName: string
  email: string
  phone: string // 10-11 dígitos, sem formatação
  cpf: string // 11 dígitos, sem formatação
  birthDate: string // ISO 8601 format (YYYY-MM-DD)
  emergencyContact: string // 10-11 dígitos, sem formatação
  address: string
}

export interface UpdatePersonDto {
  fullName?: string
  email?: string
  phone?: string
  cpf?: string
  birthDate?: string
  emergencyContact?: string
  address?: string
}

export interface PersonResponseDto {
  id: string
  fullName: string
  email: string
  phone: string
  cpf: string
  birthDate: string
  emergencyContact: string
  address: string
  photoUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface PaginatedPersonResponseDto {
  data: PersonResponseDto[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PhotoUploadResponseDto {
  message: string
  photoUrl: string
  personId: string
}

/**
 * Serviço para gerenciar pessoas
 */
export class PersonService {
  private readonly baseEndpoint = '/persons'

  /**
   * Cria uma nova pessoa
   */
  async createPerson(data: CreatePersonDto): Promise<PersonResponseDto> {
    return apiClient<PersonResponseDto>(this.baseEndpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Lista todas as pessoas com paginação
   */
  async getAllPersons(page: number = 1, limit: number = 10): Promise<PaginatedPersonResponseDto> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    return apiClient<PaginatedPersonResponseDto>(`${this.baseEndpoint}?${queryParams}`)
  }

  /**
   * Obtém uma pessoa pelo ID
   */
  async getPersonById(id: string): Promise<PersonResponseDto> {
    return apiClient<PersonResponseDto>(`${this.baseEndpoint}/${id}`)
  }

  /**
   * Atualiza uma pessoa
   */
  async updatePerson(id: string, data: UpdatePersonDto): Promise<PersonResponseDto> {
    return apiClient<PersonResponseDto>(`${this.baseEndpoint}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  /**
   * Deleta uma pessoa
   */
  async deletePerson(id: string): Promise<void> {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${this.baseEndpoint}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Não autorizado')
      }
      if (response.status === 404) {
        throw new Error('Pessoa não encontrada')
      }
      if (response.status === 409) {
        // Tentar extrair a mensagem de erro do response
        try {
          const errorData = await response.json()
          const errorMessage = errorData.message || errorData.error || 'Esta pessoa não pode ser removida porque está sendo usada como pessoa responsável em uma ou mais áreas agendadas. Por favor, altere a pessoa responsável dessas áreas antes de remover esta pessoa.'
          throw new Error(errorMessage)
        } catch (parseError) {
          // Se não conseguir parsear o JSON, usar mensagem padrão
          throw new Error('Esta pessoa não pode ser removida porque está sendo usada como pessoa responsável em uma ou mais áreas agendadas. Por favor, altere a pessoa responsável dessas áreas antes de remover esta pessoa.')
        }
      }
      throw new Error(`Erro ao deletar pessoa: ${response.status}`)
    }

    // DELETE retorna 204 (No Content), então não há JSON para retornar
    if (response.status !== 204) {
      return response.json()
    }
  }

  /**
   * Faz upload da foto de uma pessoa
   */
  async uploadPhoto(id: string, photoFile: File): Promise<PhotoUploadResponseDto> {
    const formData = new FormData()
    formData.append('photo', photoFile)

    const accessToken = localStorage.getItem('accessToken')
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${this.baseEndpoint}/${id}/photo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    })

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error('Formato de arquivo inválido ou tamanho excede 5MB')
      }
      if (response.status === 401) {
        throw new Error('Não autorizado')
      }
      if (response.status === 404) {
        throw new Error('Pessoa não encontrada')
      }
      if (response.status === 413) {
        throw new Error('Arquivo muito grande. Tamanho máximo: 5MB')
      }
      throw new Error(`Erro ao fazer upload da foto: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Remove a foto de uma pessoa
   */
  async deletePhoto(id: string): Promise<void> {
    const accessToken = localStorage.getItem('accessToken')
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${this.baseEndpoint}/${id}/photo`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Não autorizado')
      }
      if (response.status === 404) {
        throw new Error('Pessoa não encontrada ou foto não existe')
      }
      throw new Error(`Erro ao deletar foto: ${response.status}`)
    }

    // DELETE retorna 204 (No Content)
    if (response.status !== 204) {
      return response.json()
    }
  }
}

// Instância singleton do serviço
export const personService = new PersonService()
