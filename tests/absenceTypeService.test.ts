import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest'
import { absenceTypeService, type CreateAbsenceTypeDto, type UpdateAbsenceTypeDto } from '../src/services/basic/absenceTypeService'
import { absenceTypeFaker, paginationFaker } from './factories'

// Mock do apiClient
vi.mock('../src/utils/apiClient', () => ({
  apiClient: vi.fn(),
}))

// Mock do fetch para métodos DELETE
globalThis.fetch = vi.fn() as any

// Mock do localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('AbsenceTypeService', () => {
  let mockApiClient: ReturnType<typeof vi.fn>
  
  beforeAll(async () => {
    const { apiClient } = await import('../src/utils/apiClient')
    mockApiClient = apiClient as ReturnType<typeof vi.fn>
  })

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    localStorageMock.setItem('accessToken', 'test-token')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createAbsenceType', () => {
    it('deve criar um novo tipo de ausência', async () => {
      const mockData = absenceTypeFaker.createAbsenceTypeDto()
      const mockResponse = absenceTypeFaker.absenceTypeResponseDto({
        name: mockData.name,
        description: mockData.description || null,
        color: mockData.color || '#AD82D9',
        active: mockData.active ?? true,
      })

      mockApiClient.mockResolvedValue(mockResponse)

      const result = await absenceTypeService.createAbsenceType(mockData)

      expect(mockApiClient).toHaveBeenCalledWith('/api/absence-types', {
        method: 'POST',
        body: JSON.stringify(mockData),
      })
      expect(result).toEqual(mockResponse)
    })

    it('deve criar tipo de ausência com valores padrão', async () => {
      const mockData = absenceTypeFaker.createAbsenceTypeDto({
        description: undefined,
        color: undefined,
        active: undefined,
      })
      const mockResponse = absenceTypeFaker.absenceTypeResponseDto({
        name: mockData.name,
        description: null,
        color: '#AD82D9',
        active: true,
      })

      mockApiClient.mockResolvedValue(mockResponse)

      const result = await absenceTypeService.createAbsenceType(mockData)

      expect(mockApiClient).toHaveBeenCalledWith('/api/absence-types', {
        method: 'POST',
        body: JSON.stringify(mockData),
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getAllAbsenceTypes', () => {
    it('deve listar todos os tipos de ausência sem filtros', async () => {
      const mockResponse = {
        data: [],
        ...paginationFaker.paginationMeta(1, 10, 0),
      }

      mockApiClient.mockResolvedValue(mockResponse)

      const result = await absenceTypeService.getAllAbsenceTypes()

      expect(mockApiClient).toHaveBeenCalledWith('/api/absence-types')
      expect(result).toEqual(mockResponse)
    })

    it('deve listar tipos com paginação', async () => {
      const mockResponse = {
        data: absenceTypeFaker.absenceTypeResponseDtoArray(20),
        ...paginationFaker.paginationMeta(2, 20, 50),
      }

      mockApiClient.mockResolvedValue(mockResponse)

      const result = await absenceTypeService.getAllAbsenceTypes({
        page: 2,
        limit: 20,
      })

      expect(mockApiClient).toHaveBeenCalledWith('/api/absence-types?page=2&limit=20')
      expect(result).toEqual(mockResponse)
    })

    it('deve listar tipos com filtros', async () => {
      const mockResponse = {
        data: [absenceTypeFaker.absenceTypeResponseDto({ name: 'Férias', active: true })],
        ...paginationFaker.paginationMeta(1, 10, 1),
      }

      mockApiClient.mockResolvedValue(mockResponse)

      const result = await absenceTypeService.getAllAbsenceTypes({
        name: 'Férias',
        active: true,
      })

      expect(mockApiClient).toHaveBeenCalledWith(
        expect.stringContaining('/api/absence-types?')
      )
      expect(mockApiClient).toHaveBeenCalledWith(
        expect.stringContaining('name=F')
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getAbsenceTypeById', () => {
    it('deve obter um tipo de ausência pelo ID', async () => {
      const mockId = absenceTypeFaker.absenceTypeResponseDto().id
      const mockResponse = absenceTypeFaker.absenceTypeResponseDto({
        id: mockId,
      })

      mockApiClient.mockResolvedValue(mockResponse)

      const result = await absenceTypeService.getAbsenceTypeById(mockId)

      expect(mockApiClient).toHaveBeenCalledWith(`/api/absence-types/${mockId}`)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateAbsenceType', () => {
    it('deve atualizar um tipo de ausência', async () => {
      const mockId = absenceTypeFaker.absenceTypeResponseDto().id
      const updateData = absenceTypeFaker.updateAbsenceTypeDto()
      const mockResponse = absenceTypeFaker.absenceTypeResponseDto({
        id: mockId,
        name: updateData.name!,
        description: updateData.description || null,
        color: updateData.color!,
        active: updateData.active!,
      })

      mockApiClient.mockResolvedValue(mockResponse)

      const result = await absenceTypeService.updateAbsenceType(mockId, updateData)

      expect(mockApiClient).toHaveBeenCalledWith(`/api/absence-types/${mockId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('deleteAbsenceType', () => {
    it('deve deletar um tipo de ausência', async () => {
      const mockId = absenceTypeFaker.absenceTypeResponseDto().id
      const mockFetch = globalThis.fetch as ReturnType<typeof vi.fn>

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Absence type deleted successfully' }),
      })

      await absenceTypeService.deleteAbsenceType(mockId)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/absence-types/${mockId}`),
        {
          method: 'DELETE',
          headers: {
            Authorization: 'Bearer test-token',
          },
        }
      )
    })

    it('deve lançar erro quando tipo não for encontrado', async () => {
      const mockId = absenceTypeFaker.absenceTypeResponseDto().id
      const mockFetch = globalThis.fetch as ReturnType<typeof vi.fn>

      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      })

      await expect(absenceTypeService.deleteAbsenceType(mockId)).rejects.toThrow(
        'Tipo de ausência não encontrado'
      )
    })

    it('deve lançar erro quando tipo está em uso', async () => {
      const mockId = absenceTypeFaker.absenceTypeResponseDto().id
      const mockFetch = globalThis.fetch as ReturnType<typeof vi.fn>

      mockFetch.mockResolvedValue({
        ok: false,
        status: 409,
      })

      await expect(absenceTypeService.deleteAbsenceType(mockId)).rejects.toThrow(
        'Não é possível excluir tipo de ausência que está sendo usado por ausências programadas'
      )
    })

    it('deve lançar erro quando não autorizado', async () => {
      const mockId = absenceTypeFaker.absenceTypeResponseDto().id
      const mockFetch = globalThis.fetch as ReturnType<typeof vi.fn>

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
      })

      await expect(absenceTypeService.deleteAbsenceType(mockId)).rejects.toThrow(
        'Não autorizado'
      )
    })
  })

  describe('toggleAbsenceType', () => {
    it('deve alternar o status de um tipo de ausência', async () => {
      const mockId = absenceTypeFaker.absenceTypeResponseDto().id
      const mockResponse = absenceTypeFaker.absenceTypeResponseDto({
        id: mockId,
        active: false, // Toggle de true para false
      })

      mockApiClient.mockResolvedValue(mockResponse)

      const result = await absenceTypeService.toggleAbsenceType(mockId)

      expect(mockApiClient).toHaveBeenCalledWith(`/api/absence-types/${mockId}/toggle`, {
        method: 'PATCH',
      })
      expect(result).toEqual(mockResponse)
      expect(result.active).toBe(false)
    })
  })
})

