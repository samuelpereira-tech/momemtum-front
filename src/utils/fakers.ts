import { faker } from '@faker-js/faker'
import type { 
  CreatePersonDto, 
  PersonResponseDto,
  UpdatePersonDto 
} from '../services/basic/personService'
import type {
  CreateScheduledAbsenceDto,
  ScheduledAbsenceResponseDto,
  UpdateScheduledAbsenceDto,
  PersonInfoDto,
  AbsenceTypeInfoDto
} from '../services/basic/scheduledAbsenceService'
import type {
  CreateAbsenceTypeDto,
  AbsenceTypeResponseDto,
  UpdateAbsenceTypeDto
} from '../services/basic/absenceTypeService'

// Configurar locale para português
// Note: faker.locale was deprecated in v6+, locale is now set via import
// Using pt_BR locale via import faker from '@faker-js/faker/locale/pt_BR' if needed
// For now, keeping default locale

/**
 * Helper para gerar cores hexadecimais válidas
 */
// @ts-expect-error - função mantida para uso futuro
function _generateHexColor(): string {
  const colors = ['#79D9C7', '#F2B33D', '#AD82D9', '#F29C94', '#A9D979', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8']
  return faker.helpers.arrayElement(colors)
}

/**
 * Factory para gerar dados fake de Person
 */
export const personFaker = {
  /**
   * Gera um CreatePersonDto fake
   */
  createPersonDto(): CreatePersonDto {
    return {
      fullName: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.string.numeric(11), // 11 dígitos
      cpf: faker.string.numeric(11), // 11 dígitos
      birthDate: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }).toISOString().split('T')[0],
      emergencyContact: faker.string.numeric(11),
      address: `${faker.location.streetAddress()}, ${faker.location.city()} - ${faker.location.state({ abbreviated: true })}, ${faker.location.zipCode('#####-###')}`,
    }
  },

  /**
   * Gera um UpdatePersonDto fake
   */
  updatePersonDto(): UpdatePersonDto {
    return {
      fullName: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.string.numeric(11),
      address: `${faker.location.streetAddress()}, ${faker.location.city()} - ${faker.location.state({ abbreviated: true })}, ${faker.location.zipCode('#####-###')}`,
    }
  },

  /**
   * Gera um PersonResponseDto fake
   */
  personResponseDto(overrides?: Partial<PersonResponseDto>): PersonResponseDto {
    return {
      id: faker.string.uuid(),
      fullName: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.string.numeric(11),
      cpf: faker.string.numeric(11),
      birthDate: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }).toISOString().split('T')[0],
      emergencyContact: faker.string.numeric(11),
      address: `${faker.location.streetAddress()}, ${faker.location.city()} - ${faker.location.state({ abbreviated: true })}, ${faker.location.zipCode('#####-###')}`,
      photoUrl: faker.datatype.boolean() ? faker.image.avatar() : null,
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      ...overrides,
    }
  },

  /**
   * Gera um array de PersonResponseDto
   */
  personResponseDtoArray(count: number = 10): PersonResponseDto[] {
    return Array.from({ length: count }, () => this.personResponseDto())
  },

  /**
   * Gera um PersonInfoDto fake (usado em ScheduledAbsence)
   */
  personInfoDto(overrides?: Partial<PersonInfoDto>): PersonInfoDto {
    return {
      id: faker.string.uuid(),
      fullName: faker.person.fullName(),
      email: faker.internet.email(),
      ...overrides,
    }
  },
}

/**
 * Factory para gerar dados fake de AbsenceType
 */
export const absenceTypeFaker = {
  /**
   * Gera um CreateAbsenceTypeDto fake
   */
  createAbsenceTypeDto(overrides?: Partial<CreateAbsenceTypeDto>): CreateAbsenceTypeDto {
    const types = ['Férias', 'Feriado', 'Licença', 'Ausência Médica', 'Atestado', 'Folga']
    const colors = ['#79D9C7', '#F2B33D', '#AD82D9', '#F29C94', '#A9D979']
    return {
      name: faker.helpers.arrayElement(types),
      description: faker.lorem.sentence(),
      color: faker.helpers.arrayElement(colors),
      active: faker.datatype.boolean({ probability: 0.8 }), // 80% de chance de ser ativo
      ...overrides,
    }
  },

  /**
   * Gera um UpdateAbsenceTypeDto fake
   */
  updateAbsenceTypeDto(overrides?: Partial<UpdateAbsenceTypeDto>): UpdateAbsenceTypeDto {
    const colors = ['#79D9C7', '#F2B33D', '#AD82D9', '#F29C94', '#A9D979']
    return {
      name: faker.helpers.arrayElement(['Férias', 'Feriado', 'Licença', 'Ausência Médica']),
      description: faker.lorem.sentence(),
      color: faker.helpers.arrayElement(colors),
      active: faker.datatype.boolean(),
      ...overrides,
    }
  },

  /**
   * Gera um AbsenceTypeResponseDto fake
   */
  absenceTypeResponseDto(overrides?: Partial<AbsenceTypeResponseDto>): AbsenceTypeResponseDto {
    const colors = ['#79D9C7', '#F2B33D', '#AD82D9', '#F29C94', '#A9D979']
    return {
      id: faker.string.uuid(),
      name: faker.helpers.arrayElement(['Férias', 'Feriado', 'Licença', 'Ausência Médica', 'Atestado']),
      description: faker.lorem.sentence(),
      color: faker.helpers.arrayElement(colors),
      active: faker.datatype.boolean({ probability: 0.8 }),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      ...overrides,
    }
  },

  /**
   * Gera um array de AbsenceTypeResponseDto
   */
  absenceTypeResponseDtoArray(count: number = 10): AbsenceTypeResponseDto[] {
    return Array.from({ length: count }, () => this.absenceTypeResponseDto())
  },

  /**
   * Gera um AbsenceTypeInfoDto fake (usado em ScheduledAbsence)
   */
  absenceTypeInfoDto(overrides?: Partial<AbsenceTypeInfoDto>): AbsenceTypeInfoDto {
    const colors = ['#79D9C7', '#F2B33D', '#AD82D9', '#F29C94', '#A9D979']
    return {
      id: faker.string.uuid(),
      name: faker.helpers.arrayElement(['Férias', 'Feriado', 'Licença']),
      color: faker.helpers.arrayElement(colors),
      ...overrides,
    }
  },
}

/**
 * Factory para gerar dados fake de ScheduledAbsence
 */
export const scheduledAbsenceFaker = {
  /**
   * Gera um CreateScheduledAbsenceDto fake
   */
  createScheduledAbsenceDto(overrides?: Partial<CreateScheduledAbsenceDto>): CreateScheduledAbsenceDto {
    const startDate = faker.date.future()
    const endDate = faker.date.future({ refDate: startDate })
    
    return {
      personId: faker.string.uuid(),
      absenceTypeId: faker.string.uuid(),
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      description: faker.lorem.sentence(),
      ...overrides,
    }
  },

  /**
   * Gera um UpdateScheduledAbsenceDto fake
   */
  updateScheduledAbsenceDto(overrides?: Partial<UpdateScheduledAbsenceDto>): UpdateScheduledAbsenceDto {
    const startDate = faker.date.future()
    const endDate = faker.date.future({ refDate: startDate })
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      description: faker.lorem.sentence(),
      ...overrides,
    }
  },

  /**
   * Gera um ScheduledAbsenceResponseDto fake
   */
  scheduledAbsenceResponseDto(overrides?: Partial<ScheduledAbsenceResponseDto>): ScheduledAbsenceResponseDto {
    const startDate = faker.date.future()
    const endDate = faker.date.future({ refDate: startDate })
    
    return {
      id: faker.string.uuid(),
      personId: faker.string.uuid(),
      person: faker.datatype.boolean() ? personFaker.personInfoDto() : undefined,
      absenceTypeId: faker.string.uuid(),
      absenceType: faker.datatype.boolean() ? absenceTypeFaker.absenceTypeInfoDto() : undefined,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      description: faker.datatype.boolean({ probability: 0.7 }) ? faker.lorem.sentence() : null,
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
      ...overrides,
    }
  },

  /**
   * Gera um array de ScheduledAbsenceResponseDto
   */
  scheduledAbsenceResponseDtoArray(count: number = 10): ScheduledAbsenceResponseDto[] {
    return Array.from({ length: count }, () => this.scheduledAbsenceResponseDto())
  },

  /**
   * Gera uma ausência programada para um período específico
   */
  scheduledAbsenceForDateRange(
    startDate: Date,
    endDate: Date,
    overrides?: Partial<ScheduledAbsenceResponseDto>
  ): ScheduledAbsenceResponseDto {
    return this.scheduledAbsenceResponseDto({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      ...overrides,
    })
  },
}

/**
 * Factory para gerar dados de paginação fake
 */
export const paginationFaker = {
  /**
   * Gera metadados de paginação fake
   */
  paginationMeta(page: number = 1, limit: number = 10, total: number = 100) {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
  },
}

/**
 * Helper para gerar UUIDs consistentes em testes
 */
export const uuidFaker = {
  /**
   * Gera um UUID fake
   */
  uuid(): string {
    return faker.string.uuid()
  },

  /**
   * Gera um array de UUIDs
   */
  uuidArray(count: number = 10): string[] {
    return Array.from({ length: count }, () => faker.string.uuid())
  },
}

/**
 * Helper para gerar datas fake
 */
export const dateFaker = {
  /**
   * Gera uma data no formato YYYY-MM-DD
   */
  dateString(date?: Date): string {
    const d = date || faker.date.future()
    return d.toISOString().split('T')[0]
  },

  /**
   * Gera um intervalo de datas (startDate, endDate)
   */
  dateRange(daysApart: number = 7): { startDate: string; endDate: string } {
    const startDate = faker.date.future()
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + daysApart)
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    }
  },

  /**
   * Gera uma data ISO string
   */
  isoString(date?: Date): string {
    const d = date || faker.date.past()
    return d.toISOString()
  },
}

