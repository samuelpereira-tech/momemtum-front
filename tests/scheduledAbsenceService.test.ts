import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest'
import { scheduledAbsenceService } from '../src/services/basic/scheduledAbsenceService'
import { scheduledAbsenceFaker, personFaker, absenceTypeFaker, paginationFaker } from './factories'

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

describe('ScheduledAbsenceService', () => {
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

  describe('createScheduledAbsence', () => {
    it('deve criar uma nova ausência programada', async () => {
      const mockData = scheduledAbsenceFaker.createScheduledAbsenceDto()
      const mockResponse = scheduledAbsenceFaker.scheduledAbsenceResponseDto({
        personId: mockData.personId,
        absenceTypeId: mockData.absenceTypeId,
        startDate: mockData.startDate,
        endDate: mockData.endDate,
        description: mockData.description || null,
      })

      mockApiClient.mockResolvedValue(mockResponse)

      const result = await scheduledAbsenceService.createScheduledAbsence(mockData)

      expect(mockApiClient).toHaveBeenCalledWith('/api/scheduled-absences', {
        method: 'POST',
        body: JSON.stringify(mockData),
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getAllScheduledAbsences', () => {
    it('deve listar todas as ausências programadas sem filtros', async () => {
      const mockResponse = {
        data: [],
        ...paginationFaker.paginationMeta(1, 10, 0),
      }

      mockApiClient.mockResolvedValue(mockResponse)

      const result = await scheduledAbsenceService.getAllScheduledAbsences()

      expect(mockApiClient).toHaveBeenCalledWith('/api/scheduled-absences')
      expect(result).toEqual(mockResponse)
    })

    it('deve listar ausências com paginação', async () => {
      const mockResponse = {
        data: scheduledAbsenceFaker.scheduledAbsenceResponseDtoArray(20),
        ...paginationFaker.paginationMeta(2, 20, 50),
      }

      mockApiClient.mockResolvedValue(mockResponse)

      const result = await scheduledAbsenceService.getAllScheduledAbsences({
        page: 2,
        limit: 20,
      })

      expect(mockApiClient).toHaveBeenCalledWith('/api/scheduled-absences?page=2&limit=20')
      expect(result).toEqual(mockResponse)
    })

    it('deve listar ausências com filtros', async () => {
      const personId = personFaker.personInfoDto().id
      const absenceTypeId = absenceTypeFaker.absenceTypeInfoDto().id
      const personName = 'João'
      const startDate = '2024-12-01'
      const endDate = '2025-01-31'
      const dateRange = '2024-12-01,2024-12-31'

      const mockResponse = {
        data: [scheduledAbsenceFaker.scheduledAbsenceResponseDto({
          personId,
          absenceTypeId,
        })],
        ...paginationFaker.paginationMeta(1, 10, 1),
      }

      mockApiClient.mockResolvedValue(mockResponse)

      const result = await scheduledAbsenceService.getAllScheduledAbsences({
        personId,
        personName,
        absenceTypeId,
        startDate,
        endDate,
        dateRange,
      })

      expect(mockApiClient).toHaveBeenCalledWith(
        expect.stringContaining('/api/scheduled-absences?')
      )
      expect(mockApiClient).toHaveBeenCalledWith(
        expect.stringContaining(`personId=${personId}`)
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getScheduledAbsenceById', () => {
    it('deve obter uma ausência programada pelo ID', async () => {
      const mockId = scheduledAbsenceFaker.scheduledAbsenceResponseDto().id
      const mockResponse = scheduledAbsenceFaker.scheduledAbsenceResponseDto({
        id: mockId,
      })

      mockApiClient.mockResolvedValue(mockResponse)

      const result = await scheduledAbsenceService.getScheduledAbsenceById(mockId)

      expect(mockApiClient).toHaveBeenCalledWith(`/api/scheduled-absences/${mockId}`)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateScheduledAbsence', () => {
    it('deve atualizar uma ausência programada', async () => {
      const mockId = scheduledAbsenceFaker.scheduledAbsenceResponseDto().id
      const updateData = scheduledAbsenceFaker.updateScheduledAbsenceDto()
      const mockResponse = scheduledAbsenceFaker.scheduledAbsenceResponseDto({
        id: mockId,
        startDate: updateData.startDate!,
        endDate: updateData.endDate!,
        description: updateData.description || null,
      })

      mockApiClient.mockResolvedValue(mockResponse)

      const result = await scheduledAbsenceService.updateScheduledAbsence(mockId, updateData)

      expect(mockApiClient).toHaveBeenCalledWith(`/api/scheduled-absences/${mockId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('deleteScheduledAbsence', () => {
    it('deve deletar uma ausência programada', async () => {
      const mockId = scheduledAbsenceFaker.scheduledAbsenceResponseDto().id
      const mockFetch = globalThis.fetch as ReturnType<typeof vi.fn>

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Scheduled absence deleted successfully' }),
      })

      await scheduledAbsenceService.deleteScheduledAbsence(mockId)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/scheduled-absences/${mockId}`),
        {
          method: 'DELETE',
          headers: {
            Authorization: 'Bearer test-token',
          },
        }
      )
    })

    it('deve lançar erro quando ausência não for encontrada', async () => {
      const mockId = scheduledAbsenceFaker.scheduledAbsenceResponseDto().id
      const mockFetch = globalThis.fetch as ReturnType<typeof vi.fn>

      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      })

      await expect(scheduledAbsenceService.deleteScheduledAbsence(mockId)).rejects.toThrow(
        'Ausência programada não encontrada'
      )
    })

    it('deve lançar erro quando não autorizado', async () => {
      const mockId = scheduledAbsenceFaker.scheduledAbsenceResponseDto().id
      const mockFetch = globalThis.fetch as ReturnType<typeof vi.fn>

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
      })

      await expect(scheduledAbsenceService.deleteScheduledAbsence(mockId)).rejects.toThrow(
        'Não autorizado'
      )
    })
  })
})

