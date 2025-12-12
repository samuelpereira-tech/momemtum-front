/**
 * Formata uma data do input type="date" (YYYY-MM-DD) para formato ISO com timezone local
 * Garante que a data selecionada seja enviada corretamente sem perder um dia devido a conversão de timezone
 * 
 * @param dateString - Data no formato YYYY-MM-DD do input type="date"
 * @param isEndDate - Se true, usa 23:59:59 para incluir todo o dia. Se false, usa 00:00:00 (padrão)
 * @returns Data formatada como ISO string com timezone local (ex: "2025-12-18T00:00:00-03:00" ou "2025-12-18T23:59:59-03:00")
 */
export function formatDateForAPI(dateString: string, isEndDate: boolean = false): string {
  if (!dateString) return ''
  
  // O input type="date" retorna YYYY-MM-DD
  // Criamos uma data no timezone local para evitar conversão UTC
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  
  // Formatar como ISO com timezone local
  const offset = -date.getTimezoneOffset()
  const offsetHours = Math.floor(Math.abs(offset) / 60)
  const offsetMinutes = Math.abs(offset) % 60
  const offsetSign = offset >= 0 ? '+' : '-'
  const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`
  
  const yearStr = String(date.getFullYear())
  const monthStr = String(date.getMonth() + 1).padStart(2, '0')
  const dayStr = String(date.getDate()).padStart(2, '0')
  
  // Se for data fim, usar 23:59:59 para incluir todo o dia
  const time = isEndDate ? '23:59:59' : '00:00:00'
  
  return `${yearStr}-${monthStr}-${dayStr}T${time}${offsetString}`
}

