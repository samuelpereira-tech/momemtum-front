import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { scheduleService, type ScheduleOptimizedResponseDto } from '../../../../../services/basic/scheduleService'
import { addCacheBusting } from '../../../../../utils/fileUtils'
import './EscalaTabPanel.css'

export default function EscalaTabela() {
  const { id: scheduledAreaId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const grupoId = searchParams.get('grupo')

  // Estados para escalas otimizadas (modo tabela)
  const [optimizedSchedules, setOptimizedSchedules] = useState<ScheduleOptimizedResponseDto[]>([])
  const [optimizedSchedulesPage, setOptimizedSchedulesPage] = useState(1)
  const [optimizedSchedulesTotalPages, setOptimizedSchedulesTotalPages] = useState(1)
  const [optimizedSchedulesLoading, setOptimizedSchedulesLoading] = useState(false)
  const schedulesLimit = 10
  
  // Estados para filtros de data (modo tabela)
  const [filterStartDate, setFilterStartDate] = useState<string>('')
  const [filterEndDate, setFilterEndDate] = useState<string>('')

  // Estados para agrupamento por data
  const [groupByDate, setGroupByDate] = useState(false)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())

  // Ref para evitar execuções duplicadas
  const isLoadingRef = useRef(false)
  const lastLoadParamsRef = useRef<string>('')

  // Função auxiliar para carregar escalas otimizadas (mantida para uso futuro)
  // @ts-expect-error - função mantida para uso futuro
  const _loadOptimizedSchedulesData = useCallback(async (page: number, groupId?: string) => {
    if (!scheduledAreaId) return

    setOptimizedSchedulesLoading(true)
    try {
      const filters: any = {
        page,
        limit: schedulesLimit,
      }
      
      if (groupId) {
        filters.scheduleGenerationId = groupId
      }
      
      if (filterStartDate) {
        // Enviar apenas a data no formato YYYY-MM-DD para "Todas as Escalas"
        filters.startDate = filterStartDate
      }
      
      if (filterEndDate) {
        // Enviar apenas a data no formato YYYY-MM-DD para "Todas as Escalas"
        filters.endDate = filterEndDate
      }
      
      const response = await scheduleService.getSchedulesOptimized(scheduledAreaId, filters)
      setOptimizedSchedules(response.data)
      setOptimizedSchedulesTotalPages(response.meta.totalPages)
    } catch (error) {
      console.error('Erro ao carregar escalas otimizadas:', error)
    } finally {
      setOptimizedSchedulesLoading(false)
    }
  }, [scheduledAreaId, schedulesLimit, filterStartDate, filterEndDate])

  // Carregar escalas quando mudar modo, grupo, displayMode ou filtros
  useEffect(() => {
    if (!scheduledAreaId) {
      return
    }

    // Criar uma chave única para os parâmetros de carregamento
    const loadKey = `${scheduledAreaId}-${grupoId || 'all'}-${filterStartDate}-${filterEndDate}-${optimizedSchedulesPage}`

    // Evitar execuções duplicadas
    if (isLoadingRef.current || lastLoadParamsRef.current === loadKey) {
      return
    }

    isLoadingRef.current = true
    lastLoadParamsRef.current = loadKey

    // Carregar escalas otimizadas
    const loadData = async () => {
      setOptimizedSchedulesLoading(true)
      try {
        const filters: any = {
          page: optimizedSchedulesPage,
          limit: schedulesLimit,
        }
        
        if (grupoId) {
          filters.scheduleGenerationId = grupoId
        }
        
        if (filterStartDate) {
          // Enviar apenas a data no formato YYYY-MM-DD para "Todas as Escalas"
          filters.startDate = filterStartDate
        }
        
        if (filterEndDate) {
          // Enviar apenas a data no formato YYYY-MM-DD para "Todas as Escalas"
          filters.endDate = filterEndDate
        }
        
        const response = await scheduleService.getSchedulesOptimized(scheduledAreaId, filters)
        setOptimizedSchedules(response.data)
        setOptimizedSchedulesTotalPages(response.meta.totalPages)
      } catch (error) {
        console.error('Erro ao carregar escalas otimizadas:', error)
      } finally {
        setOptimizedSchedulesLoading(false)
        isLoadingRef.current = false
      }
    }
    loadData()
  }, [scheduledAreaId, grupoId, filterStartDate, filterEndDate, optimizedSchedulesPage, schedulesLimit])

  // Handler para clicar na linha da tabela
  const handleTableRowClick = useCallback((schedule: ScheduleOptimizedResponseDto, e?: React.MouseEvent) => {
    // Prevenir propagação se clicou em um elemento interativo dentro da célula
    if (e) {
      const target = e.target as HTMLElement
      // Se clicou em um avatar ou tooltip, não fazer nada
      if (target.closest('.table-participant-avatar') || target.closest('.table-participant-tooltip')) {
        return
      }
    }
    
    // A API otimizada retorna o ID diretamente
    if (schedule.id) {
      navigate(`/Dashboard/escala/areas/${scheduledAreaId}/escala/schedule/${schedule.id}`)
    } else {
      console.warn('ID da escala não encontrado na resposta otimizada:', schedule)
    }
  }, [navigate, scheduledAreaId])

  // Funções auxiliares
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = formatDate(startDate)
    const end = formatDate(endDate)
    return `${start} - ${end}`
  }

  // Função para obter apenas a data (sem hora) de uma string de data
  const getDateOnly = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }

  // Função para agrupar escalas por data
  const groupSchedulesByDate = (schedules: ScheduleOptimizedResponseDto[]) => {
    const grouped = new Map<string, ScheduleOptimizedResponseDto[]>()
    
    schedules.forEach(schedule => {
      const dateKey = getDateOnly(schedule.startDatetime)
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, [])
      }
      grouped.get(dateKey)!.push(schedule)
    })
    
    return Array.from(grouped.entries()).map(([date, schedules]) => ({
      date,
      schedules,
      dateFormatted: formatDate(schedules[0].startDatetime)
    }))
  }

  // Toggle para expandir/colapsar grupo de data
  const toggleDateGroup = (dateKey: string) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev)
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey)
      } else {
        newSet.add(dateKey)
      }
      return newSet
    })
  }

  // Expandir/colapsar todos os grupos (mantida para uso futuro)
  // @ts-expect-error - função mantida para uso futuro
  const _toggleAllGroups = () => {
    if (expandedDates.size === 0) {
      // Expandir todos
      const allDates = new Set(groupSchedulesByDate(optimizedSchedules).map(g => g.date))
      setExpandedDates(allDates)
    } else {
      // Colapsar todos
      setExpandedDates(new Set())
    }
  }

  return (
    <div className="escala-tab-panel">
      <div className="tab-content">
        {/* Header com navegação */}
        <div className="schedules-header">
          <div className="header-left">
            <h3>Todas as Escalas</h3>
            {grupoId && (
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => {
                  navigate(`/Dashboard/escala/areas/${scheduledAreaId}/escala/tabela`)
                }}
              >
                <i className="fa-solid fa-arrow-left"></i> Ver Todas
              </button>
            )}
          </div>
          <div className="header-right">
            <Link
              to={`/Dashboard/escala/areas/${scheduledAreaId}/escala/grupos`}
              className="btn-secondary btn-sm"
            >
              <i className="fa-solid fa-users"></i> Grupos
            </Link>
            <Link
              to={`/Dashboard/escala/areas/${scheduledAreaId}/escala/cards${grupoId ? `?grupo=${grupoId}` : ''}`}
              className="btn-secondary btn-sm"
            >
              <i className="fa-solid fa-th-large"></i> Cards
            </Link>
          </div>
        </div>

        <div className="schedules-container">
          {/* Filtros de Data */}
          <div className="table-filters">
            <div className="filter-group">
              <label htmlFor="filter-start-date" className="filter-label">
                <i className="fa-solid fa-calendar-alt"></i> Data Início
              </label>
              <input
                type="date"
                id="filter-start-date"
                className="filter-input"
                value={filterStartDate}
                onChange={(e) => {
                  setFilterStartDate(e.target.value)
                  setOptimizedSchedulesPage(1)
                }}
              />
            </div>
            <div className="filter-group">
              <label htmlFor="filter-end-date" className="filter-label">
                <i className="fa-solid fa-calendar-check"></i> Data Fim
              </label>
              <input
                type="date"
                id="filter-end-date"
                className="filter-input"
                value={filterEndDate}
                onChange={(e) => {
                  setFilterEndDate(e.target.value)
                  setOptimizedSchedulesPage(1)
                }}
              />
            </div>
            {(filterStartDate || filterEndDate) && (
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => {
                  setFilterStartDate('')
                  setFilterEndDate('')
                  setOptimizedSchedulesPage(1)
                }}
                title="Limpar filtros"
              >
                <i className="fa-solid fa-times"></i> Limpar Filtros
              </button>
            )}
          </div>

          {/* Botão de Agrupamento */}
          {!optimizedSchedulesLoading && optimizedSchedules.length > 0 && (
            <div className="table-group-controls">
              <button
                type="button"
                className={`btn-secondary btn-sm ${groupByDate ? 'active' : ''}`}
                onClick={() => {
                  setGroupByDate(!groupByDate)
                  if (!groupByDate) {
                    // Ao ativar agrupamento, expandir todos os grupos
                    const grouped = groupSchedulesByDate(optimizedSchedules)
                    setExpandedDates(new Set(grouped.map(g => g.date)))
                  } else {
                    // Ao desativar, limpar estados expandidos
                    setExpandedDates(new Set())
                  }
                }}
                title={groupByDate ? 'Desagrupar por data' : 'Agrupar por data'}
              >
                <i className={`fa-solid ${groupByDate ? 'fa-ungroup' : 'fa-layer-group'}`}></i>
                {groupByDate ? 'Desagrupar por Data' : 'Agrupar por Data'}
              </button>
            </div>
          )}

          {optimizedSchedulesLoading ? (
            <div className="loading-container">
              <i className="fa-solid fa-spinner fa-spin"></i>
              <p>Carregando escalas...</p>
            </div>
          ) : optimizedSchedules.length === 0 ? (
            <div className="empty-container">
              <i className="fa-solid fa-inbox"></i>
              <p>Nenhuma escala encontrada</p>
            </div>
          ) : (
            <>
              {groupByDate ? (
                // Visualização agrupada por data
                <div className="schedules-table-container">
                  {groupSchedulesByDate(optimizedSchedules).map((dateGroup) => {
                    const isExpanded = expandedDates.has(dateGroup.date)
                    const schedulesCount = dateGroup.schedules.length
                    
                    return (
                      <div key={dateGroup.date} className="date-group-container">
                        <div 
                          className="date-group-header"
                          onClick={() => toggleDateGroup(dateGroup.date)}
                        >
                          <div className="date-group-title">
                            <i className={`fa-solid fa-chevron-${isExpanded ? 'down' : 'right'}`}></i>
                            <span className="date-group-date">{dateGroup.dateFormatted}</span>
                            <span className="date-group-count">
                              {schedulesCount} {schedulesCount === 1 ? 'escala' : 'escalas'}
                            </span>
                          </div>
                        </div>
                        {isExpanded && (
                          <table className="schedules-table">
                            <thead>
                              <tr>
                                <th>Horário</th>
                                <th>Grupos</th>
                                <th>Participantes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dateGroup.schedules.map((schedule) => {
                                const startTime = new Date(schedule.startDatetime).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                                const endTime = new Date(schedule.endDatetime).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                                
                                return (
                                  <tr
                                    key={schedule.id}
                                    className="schedule-table-row"
                                    onClick={(e) => handleTableRowClick(schedule, e)}
                                  >
                                    <td 
                                      className="schedule-table-date"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleTableRowClick(schedule, e)
                                      }}
                                    >
                                      {startTime} - {endTime}
                                    </td>
                                    <td className="schedule-table-groups">
                                      {schedule.groups && schedule.groups.length > 0 ? (
                                        <div className="table-groups-list">
                                          {schedule.groups.map((group, index) => {
                                            const groupName = typeof group === 'string' ? group : group.name
                                            const groupId = typeof group === 'string' ? index.toString() : group.id
                                            return (
                                              <span key={groupId} className="table-group-badge">
                                                {groupName}
                                              </span>
                                            )
                                          })}
                                        </div>
                                      ) : (
                                        <span className="table-group-empty">-</span>
                                      )}
                                    </td>
                                    <td className="schedule-table-participants">
                                      <div className="table-participants-avatars">
                                        {schedule.people.map((person, index) => {
                                          const isRejected = person.status === 'rejected'
                                          
                                          return (
                                            <div
                                              key={index}
                                              className="table-participant-avatar-wrapper"
                                              style={{ zIndex: schedule.people.length - index }}
                                            >
                                              <div
                                                className="table-participant-avatar"
                                                title={`${person.name}${person.role ? ` - ${person.role}` : ''}`}
                                              >
                                                <div className="table-participant-avatar-content">
                                                  {person.url ? (
                                                    <img
                                                      src={addCacheBusting(person.url)}
                                                      alt={person.name}
                                                      className="table-participant-avatar-image"
                                                      loading="lazy"
                                                      decoding="async"
                                                    />
                                                  ) : (
                                                    <div className="table-participant-avatar-placeholder">
                                                      {person.name && person.name.length > 0
                                                        ? person.name.charAt(0).toUpperCase()
                                                        : '?'}
                                                    </div>
                                                  )}
                                                </div>
                                                {isRejected && (
                                                  <div className="table-participant-alert" title="Participante rejeitado">
                                                    <i className="fa-solid fa-exclamation-triangle"></i>
                                                  </div>
                                                )}
                                                <div className="table-participant-tooltip">
                                                  <div className="tooltip-name">{person.name}</div>
                                                  {person.role && (
                                                    <div className="tooltip-role">{person.role}</div>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                // Visualização normal (não agrupada)
                <div className="schedules-table-container">
                  <table className="schedules-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Grupos</th>
                        <th>Participantes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {optimizedSchedules.map((schedule) => (
                        <tr
                          key={schedule.id}
                          className="schedule-table-row"
                          onClick={(e) => handleTableRowClick(schedule, e)}
                        >
                          <td 
                            className="schedule-table-date"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleTableRowClick(schedule, e)
                            }}
                          >
                            {formatDateRange(schedule.startDatetime, schedule.endDatetime)}
                          </td>
                          <td className="schedule-table-groups">
                            {schedule.groups && schedule.groups.length > 0 ? (
                              <div className="table-groups-list">
                                {schedule.groups.map((group, index) => {
                                  const groupName = typeof group === 'string' ? group : group.name
                                  const groupId = typeof group === 'string' ? index.toString() : group.id
                                  return (
                                    <span key={groupId} className="table-group-badge">
                                      {groupName}
                                    </span>
                                  )
                                })}
                              </div>
                            ) : (
                              <span className="table-group-empty">-</span>
                            )}
                          </td>
                          <td className="schedule-table-participants">
                            <div className="table-participants-avatars">
                              {schedule.people.map((person, index) => {
                                const isRejected = person.status === 'rejected'
                                
                                return (
                                  <div
                                    key={index}
                                    className="table-participant-avatar-wrapper"
                                    style={{ zIndex: schedule.people.length - index }}
                                  >
                                    <div
                                      className="table-participant-avatar"
                                      title={`${person.name}${person.role ? ` - ${person.role}` : ''}`}
                                    >
                                      <div className="table-participant-avatar-content">
                                        {person.url ? (
                                          <img
                                            src={addCacheBusting(person.url)}
                                            alt={person.name}
                                            className="table-participant-avatar-image"
                                            loading="lazy"
                                            decoding="async"
                                          />
                                        ) : (
                                          <div className="table-participant-avatar-placeholder">
                                            {person.name && person.name.length > 0
                                              ? person.name.charAt(0).toUpperCase()
                                              : '?'}
                                          </div>
                                        )}
                                      </div>
                                      {isRejected && (
                                        <div className="table-participant-alert" title="Participante rejeitado">
                                          <i className="fa-solid fa-exclamation-triangle"></i>
                                        </div>
                                      )}
                                      <div className="table-participant-tooltip">
                                        <div className="tooltip-name">{person.name}</div>
                                        {person.role && (
                                          <div className="tooltip-role">{person.role}</div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {optimizedSchedulesTotalPages > 1 && (
                <div className="pagination">
                  <button
                    type="button"
                    className="btn-pagination"
                    onClick={() => {
                      const newPage = optimizedSchedulesPage - 1
                      if (newPage >= 1) {
                        setOptimizedSchedulesPage(newPage)
                      }
                    }}
                    disabled={optimizedSchedulesPage === 1 || optimizedSchedulesLoading}
                  >
                    <i className="fa-solid fa-chevron-left"></i> Anterior
                  </button>
                  <span className="pagination-info">
                    Página {optimizedSchedulesPage} de {optimizedSchedulesTotalPages}
                  </span>
                  <button
                    type="button"
                    className="btn-pagination"
                    onClick={() => {
                      const newPage = optimizedSchedulesPage + 1
                      if (newPage <= optimizedSchedulesTotalPages) {
                        setOptimizedSchedulesPage(newPage)
                      }
                    }}
                    disabled={optimizedSchedulesPage === optimizedSchedulesTotalPages || optimizedSchedulesLoading}
                  >
                    Próxima <i className="fa-solid fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

