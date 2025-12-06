/**
 * Utilitários para formatação de dados
 */

/**
 * Remove todos os caracteres não numéricos de uma string
 */
export const removeMask = (value: string): string => {
  return value.replace(/\D/g, '')
}

/**
 * Formata CPF enquanto o usuário digita (máscara de input)
 * @param value - Valor a ser formatado
 * @returns CPF formatado (000.000.000-00)
 */
export const formatCPF = (value: string): string => {
  const numbers = removeMask(value)
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return value
}

/**
 * Formata telefone enquanto o usuário digita (máscara de input)
 * @param value - Valor a ser formatado
 * @returns Telefone formatado ((00) 00000-0000)
 */
export const formatPhone = (value: string): string => {
  const numbers = removeMask(value)
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }
  return value
}

/**
 * Formata CPF para exibição (já formatado ou sem formatação)
 * @param cpf - CPF a ser formatado (pode ser null/undefined)
 * @returns CPF formatado (000.000.000-00) ou '-' se vazio
 */
export const formatarCPF = (cpf: string | null | undefined): string => {
  if (!cpf) return '-'
  const numbers = removeMask(cpf)
  if (numbers.length === 11) {
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  return cpf
}

/**
 * Formata telefone para exibição (já formatado ou sem formatação)
 * @param telefone - Telefone a ser formatado (pode ser null/undefined)
 * @returns Telefone formatado ((00) 00000-0000 ou (00) 0000-0000) ou '-' se vazio
 */
export const formatarTelefone = (telefone: string | null | undefined): string => {
  if (!telefone) return '-'
  const numbers = removeMask(telefone)
  if (numbers.length === 11) {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  } else if (numbers.length === 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return telefone
}

/**
 * Formata data para exibição
 * @param data - Data em formato ISO string ou Date (pode ser null/undefined)
 * @returns Data formatada (dd/mm/aaaa) ou '-' se inválida/vazia
 */
export const formatarData = (data: string | null | undefined): string => {
  if (!data) return '-'
  try {
    const date = new Date(data)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('pt-BR')
  } catch {
    return '-'
  }
}

/**
 * Formata CPF de um valor já formatado (para uso em loadPersonData)
 * @param cpf - CPF sem formatação ou já formatado
 * @returns CPF formatado (000.000.000-00)
 */
export const formatCPFFromRaw = (cpf: string): string => {
  const numbers = removeMask(cpf)
  if (numbers.length === 11) {
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  return cpf
}

/**
 * Formata telefone de um valor já formatado (para uso em loadPersonData)
 * @param phone - Telefone sem formatação ou já formatado
 * @returns Telefone formatado ((00) 00000-0000 ou (00) 0000-0000)
 */
export const formatPhoneFromRaw = (phone: string): string => {
  const numbers = removeMask(phone)
  if (numbers.length === 11) {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  } else if (numbers.length === 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return phone
}

