/**
 * Re-exporta todos os fakers para uso nos testes
 */
export * from '../src/utils/fakers'

/**
 * Factories específicas para testes
 */
import { 
  personFaker, 
  absenceTypeFaker, 
  scheduledAbsenceFaker,
  paginationFaker 
} from '../src/utils/fakers'
import type { PaginatedPersonResponseDto } from '../src/services/basic/personService'
import type { PaginatedScheduledAbsenceResponseDto } from '../src/services/basic/scheduledAbsenceService'
import type { PaginatedAbsenceTypeResponseDto } from '../src/services/basic/absenceTypeService'

/**
 * Factory para criar respostas paginadas de Person
 */
export function createPaginatedPersonResponse(
  count: number = 10,
  page: number = 1,
  limit: number = 10
): PaginatedPersonResponseDto {
  const total = count
  const totalPages = Math.ceil(total / limit)
  
  return {
    data: personFaker.personResponseDtoArray(count),
    page,
    limit,
    total,
    totalPages,
  }
}

/**
 * Factory para criar respostas paginadas de ScheduledAbsence
 */
export function createPaginatedScheduledAbsenceResponse(
  count: number = 10,
  page: number = 1,
  limit: number = 10
): PaginatedScheduledAbsenceResponseDto {
  const total = count
  const totalPages = Math.ceil(total / limit)
  
  return {
    data: scheduledAbsenceFaker.scheduledAbsenceResponseDtoArray(count),
    page,
    limit,
    total,
    totalPages,
  }
}

/**
 * Factory para criar respostas paginadas de AbsenceType
 */
export function createPaginatedAbsenceTypeResponse(
  count: number = 10,
  page: number = 1,
  limit: number = 10
): PaginatedAbsenceTypeResponseDto {
  const total = count
  const totalPages = Math.ceil(total / limit)
  
  return {
    data: absenceTypeFaker.absenceTypeResponseDtoArray(count),
    page,
    limit,
    total,
    totalPages,
  }
}











