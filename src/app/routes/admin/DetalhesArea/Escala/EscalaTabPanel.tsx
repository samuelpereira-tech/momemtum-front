import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import '../shared/TabPanel.css'
import './EscalaTabPanel.css'
import { scheduleGenerationService } from '../../../../../services/basic/scheduleGenerationService'
import { scheduleService, type ScheduleResponseDto, type ScheduleOptimizedResponseDto } from '../../../../../services/basic/scheduleService'
import { addCacheBusting } from '../../../../../utils/fileUtils'
import ScheduleDetailsView from './ScheduleDetailsView'
import ScheduleGroupDetailsView from './ScheduleGroupDetailsView'

// Tipos para compatibilidade com a tela
export interface ScheduleGroupConfiguration {
  // Período
  periodStartDate: string
  periodEndDate: string
  periodType: 'fixed' | 'daily' | 'weekly' | 'monthly'
  
  // Dias da semana (0-6, domingo-sábado)
  weekdays?: number[]
  
  // Horários (para tipo daily)
  startTime?: string // HH:mm
  endTime?: string // HH:mm
  
  // Grupos selecionados
  selectedGroupIds?: string[]
  selectedGroupNames?: string[]
  selectedGroups?: Array<{
    id: string
    name: string
    imageUrl?: string | null
  }>
  
  // Equipe selecionada
  selectedTeamId?: string
  selectedTeamName?: string
  
  // Regras
  considerAbsences: boolean
  requireResponsibilities?: boolean
  distributionOrder?: 'sequential' | 'random' | 'balanced'
  groupsPerSchedule?: number
  participantSelection?: 'all' | 'all_with_exclusions' | 'by_group' | 'individual'
  
  // Datas excluídas/incluídas
  excludedDates?: string[]
  includedDates?: string[]
}

export interface ScheduleGroupDto {
  id: string
  name: string
  description?: string
  scheduledAreaId: string
  schedulesCount: number
  configuration: ScheduleGroupConfiguration
  createdAt: string
  updatedAt: string
}

export type ScheduleDto = ScheduleResponseDto

export default function EscalaTabPanel() {
  const { id: scheduledAreaId } = useParams<{ id: string }>()
  const [viewMode, setViewMode] = useState<'groups' | 'all-schedules' | 'group-schedules' | 'schedule-details' | 'group-details'>('all-schedules')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedGroupName, setSelectedGroupName] = useState<string>('')

  // Estados para grupos
  const [groups, setGroups] = useState<ScheduleGroupDto[]>([])
  const [groupsPage, setGroupsPage] = useState(1)
  const [groupsTotalPages, setGroupsTotalPages] = useState(1)
  const [groupsLoading, setGroupsLoading] = useState(false)
  const groupsLimit = 10

  // Estados para escalas
  const [schedules, setSchedules] = useState<ScheduleDto[]>([])
  const [schedulesPage, setSchedulesPage] = useState(1)
  const [schedulesTotalPages, setSchedulesTotalPages] = useState(1)
  const [schedulesLoading, setSchedulesLoading] = useState(false)
  const schedulesLimit = 10
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null)

  // Estados para visualização (cards ou tabela)
  const [displayMode, setDisplayMode] = useState<'cards' | 'table'>('table')
  
  // Estados para escalas otimizadas (modo tabela)
  const [optimizedSchedules, setOptimizedSchedules] = useState<ScheduleOptimizedResponseDto[]>([])
  const [optimizedSchedulesPage, setOptimizedSchedulesPage] = useState(1)
  const [optimizedSchedulesTotalPages, setOptimizedSchedulesTotalPages] = useState(1)
  const [optimizedSchedulesLoading, setOptimizedSchedulesLoading] = useState(false)
  
  // Estados para filtros de data (modo tabela)
  const [filterStartDate, setFilterStartDate] = useState<string>('')
  const [filterEndDate, setFilterEndDate] = useState<string>('')

  // Função para mapear a configuração aninhada da API para a estrutura plana esperada
  const mapConfiguration = (config: any, generationType: string, periodType: string, periodStartDate: string, periodEndDate: string): ScheduleGroupConfiguration => {
    const mapped: ScheduleGroupConfiguration = {
      periodStartDate: periodStartDate || '',
      periodEndDate: periodEndDate || '',
      periodType: periodType as 'fixed' | 'daily' | 'weekly' | 'monthly',
      considerAbsences: false,
    }

    // Mapear configurações do período
    if (config.periodConfig) {
      mapped.weekdays = config.periodConfig.weekdays
      mapped.startTime = config.periodConfig.startTime
      mapped.endTime = config.periodConfig.endTime
      mapped.excludedDates = config.periodConfig.excludedDates
      mapped.includedDates = config.periodConfig.includedDates
    }

    // Mapear configurações baseadas no tipo de geração
    if (generationType === 'group' && config.groupConfig) {
      mapped.considerAbsences = config.groupConfig.considerAbsences || false
      mapped.distributionOrder = config.groupConfig.distributionOrder
      mapped.groupsPerSchedule = config.groupConfig.groupsPerSchedule
      
      // Verificar se groupIds é um array de objetos (com id, name, imageUrl) ou apenas strings
      if (config.groupConfig.groupIds && Array.isArray(config.groupConfig.groupIds)) {
        const firstItem = config.groupConfig.groupIds[0]
        if (firstItem && typeof firstItem === 'object' && firstItem.id) {
          // É um array de objetos com id, name, imageUrl
          mapped.selectedGroups = config.groupConfig.groupIds.map((g: any) => ({
            id: g.id,
            name: g.name || g.id,
            imageUrl: g.imageUrl || null,
          }))
          mapped.selectedGroupIds = mapped.selectedGroups?.map(g => g.id) || []
          mapped.selectedGroupNames = mapped.selectedGroups?.map(g => g.name) || []
        } else {
          // É um array de strings (IDs)
          mapped.selectedGroupIds = config.groupConfig.groupIds
        }
      }
    } else if (generationType === 'people' && config.peopleConfig) {
      mapped.considerAbsences = config.peopleConfig.considerAbsences || false
    } else if ((generationType === 'team_without_restriction' || generationType === 'team_with_restriction') && config.teamConfig) {
      mapped.considerAbsences = config.teamConfig.considerAbsences || false
      mapped.requireResponsibilities = config.teamConfig.requireResponsibilities
      mapped.participantSelection = config.teamConfig.participantSelection
      mapped.selectedTeamId = config.teamConfig.teamId
      
      // Verificar se selectedGroupIds é um array de objetos ou apenas strings
      if (config.teamConfig.selectedGroupIds && Array.isArray(config.teamConfig.selectedGroupIds)) {
        const firstItem = config.teamConfig.selectedGroupIds[0]
        if (firstItem && typeof firstItem === 'object' && firstItem.id) {
          // É um array de objetos com id, name, imageUrl
          mapped.selectedGroups = config.teamConfig.selectedGroupIds.map((g: any) => ({
            id: g.id,
            name: g.name || g.id,
            imageUrl: g.imageUrl || null,
          }))
          mapped.selectedGroupIds = mapped.selectedGroups?.map(g => g.id) || []
          mapped.selectedGroupNames = mapped.selectedGroups?.map(g => g.name) || []
        } else {
          // É um array de strings (IDs)
          mapped.selectedGroupIds = config.teamConfig.selectedGroupIds
        }
      }
    }

    return mapped
  }

  // Carregar grupos (gerações automáticas)
  const loadGroups = useCallback(async (page: number) => {
    if (!scheduledAreaId) return

    setGroupsLoading(true)
    try {
      const response = await scheduleGenerationService.getGenerations(scheduledAreaId, { page, limit: groupsLimit })
      // Converter ScheduleGenerationResponseDto para ScheduleGroupDto para compatibilidade
      const convertedGroups: ScheduleGroupDto[] = response.data.map(gen => {
        const mappedConfiguration = mapConfiguration(
          gen.configuration,
          gen.generationType,
          gen.periodType,
          gen.periodStartDate,
          gen.periodEndDate
        )
        
        return {
          id: gen.id,
          name: `Geração ${gen.generationType} - ${gen.periodType}`,
          description: `Período: ${gen.periodStartDate} a ${gen.periodEndDate}`,
          scheduledAreaId: gen.scheduledAreaId,
          schedulesCount: gen.totalSchedulesGenerated,
          configuration: mappedConfiguration,
          createdAt: gen.createdAt,
          updatedAt: gen.createdAt,
        }
      })
      setGroups(convertedGroups)
      setGroupsTotalPages(response.meta.totalPages)
    } catch (error) {
      console.error('Erro ao carregar grupos de escalas:', error)
    } finally {
      setGroupsLoading(false)
    }
  }, [scheduledAreaId, groupsLimit])

  // Carregar escalas
  const loadSchedules = useCallback(async (page: number, groupId?: string) => {
    if (!scheduledAreaId) return

    setSchedulesLoading(true)
    try {
      const response = await scheduleService.getSchedules(scheduledAreaId, {
        page,
        limit: schedulesLimit,
        scheduleGenerationId: groupId,
      })
      setSchedules(response.data)
      setSchedulesTotalPages(response.meta.totalPages)
    } catch (error) {
      console.error('Erro ao carregar escalas:', error)
    } finally {
      setSchedulesLoading(false)
    }
  }, [scheduledAreaId, schedulesLimit])

  // Carregar escalas otimizadas (para modo tabela)
  const loadOptimizedSchedules = useCallback(async (page: number, groupId?: string) => {
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
        filters.startDate = filterStartDate
      }
      
      if (filterEndDate) {
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
  
  // Handlers
  const handleScheduleClick = (scheduleId: string) => {
    setSelectedScheduleId(scheduleId)
    setViewMode('schedule-details')
  }
  
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
      setSelectedScheduleId(schedule.id)
      setViewMode('schedule-details')
    } else {
      console.warn('ID da escala não encontrado na resposta otimizada:', schedule)
    }
  }, [])

  // Carregar grupos na montagem
  useEffect(() => {
    if (scheduledAreaId && viewMode === 'groups') {
      loadGroups(1)
      setGroupsPage(1)
    }
  }, [scheduledAreaId, viewMode, loadGroups])

  // Carregar escalas quando mudar modo ou grupo
  useEffect(() => {
    if (scheduledAreaId && (viewMode === 'all-schedules' || viewMode === 'group-schedules')) {
      if (displayMode === 'table') {
        loadOptimizedSchedules(1, viewMode === 'group-schedules' ? selectedGroupId || undefined : undefined)
        setOptimizedSchedulesPage(1)
      } else {
        loadSchedules(1, viewMode === 'group-schedules' ? selectedGroupId || undefined : undefined)
        setSchedulesPage(1)
      }
    }
  }, [scheduledAreaId, viewMode, selectedGroupId, displayMode, loadSchedules, loadOptimizedSchedules])
  
  // Recarregar quando filtros de data mudarem
  useEffect(() => {
    if (scheduledAreaId && displayMode === 'table' && (viewMode === 'all-schedules' || viewMode === 'group-schedules')) {
      loadOptimizedSchedules(1, viewMode === 'group-schedules' ? selectedGroupId || undefined : undefined)
      setOptimizedSchedulesPage(1)
    }
  }, [filterStartDate, filterEndDate, scheduledAreaId, displayMode, viewMode, selectedGroupId, loadOptimizedSchedules])

  // Handlers
  const handleGroupClick = (group: ScheduleGroupDto) => {
    setSelectedGroupId(group.id)
    setSelectedGroupName(group.name)
    setViewMode('group-details')
  }

  const handleViewGroupSchedules = () => {
    if (selectedGroupId) {
      setViewMode('group-schedules')
      setSchedulesPage(1)
    }
  }

  const handleViewAllSchedules = () => {
    setSelectedGroupId(null)
    setSelectedGroupName('')
    setViewMode('all-schedules')
    setSchedulesPage(1)
  }

  const handleBackToGroups = () => {
    setViewMode('groups')
    setSelectedGroupId(null)
    setSelectedGroupName('')
    setGroupsPage(1)
  }

  const handleBackFromDetails = () => {
    // Voltar para a view anterior (all-schedules ou group-schedules)
    if (selectedGroupId) {
      setViewMode('group-schedules')
    } else {
      setViewMode('all-schedules')
    }
    setSelectedScheduleId(null)
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'status-badge status-confirmed'
      case 'cancelled':
        return 'status-badge status-cancelled'
      default:
        return 'status-badge status-pending'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada'
      case 'cancelled':
        return 'Cancelada'
      default:
        return 'Pendente'
    }
  }

  const getWeekdayName = (day: number) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    return days[day]
  }

  const getPeriodTypeLabel = (type: string) => {
    switch (type) {
      case 'fixed':
        return 'Fixo'
      case 'daily':
        return 'Diário'
      case 'weekly':
        return 'Semanal'
      case 'monthly':
        return 'Mensal'
      default:
        return type
    }
  }

  const getTitle = () => {
    switch (viewMode) {
      case 'groups':
        return 'Grupos de Escalas'
      case 'all-schedules':
        return 'Todas as Escalas'
      case 'group-schedules':
        return `Escalas do Grupo: ${selectedGroupName}`
      case 'schedule-details':
        return 'Detalhes da Escala'
      case 'group-details':
        return 'Detalhes do Grupo'
      default:
        return 'Escalas'
    }
  }

  const getTitleIcon = () => {
    switch (viewMode) {
      case 'groups':
        return 'fa-users'
      case 'all-schedules':
      case 'group-schedules':
        return 'fa-calendar-check'
      case 'schedule-details':
        return 'fa-calendar-alt'
      case 'group-details':
        return 'fa-users-gear'
      default:
        return 'fa-calendar'
    }
  }

  return (
    <div className="tab-panel">
      <div className="tab-panel-header">
        <h3 className="tab-panel-title">
          <i className={`fa-solid ${getTitleIcon()}`}></i> {getTitle()}
        </h3>
        <div className="tab-panel-actions">
          {viewMode === 'groups' && (
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={handleViewAllSchedules}
            >
              <i className="fa-solid fa-list"></i> Ver Todas as Escalas
            </button>
          )}
          {(viewMode === 'all-schedules' || viewMode === 'group-schedules') && (
            <>
              <button
                type="button"
                className={`btn-secondary btn-sm ${displayMode === 'cards' ? 'active' : ''}`}
                onClick={() => {
                  setDisplayMode('cards')
                  setSchedulesPage(1)
                }}
                title="Visualização em Cards"
              >
                <i className="fa-solid fa-th-large"></i> Cards
              </button>
              <button
                type="button"
                className={`btn-secondary btn-sm ${displayMode === 'table' ? 'active' : ''}`}
                onClick={() => {
                  setDisplayMode('table')
                  setOptimizedSchedulesPage(1)
                }}
                title="Visualização em Tabela"
              >
                <i className="fa-solid fa-table"></i> Tabela
              </button>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={handleBackToGroups}
              >
                <i className="fa-solid fa-arrow-left"></i> Voltar para Grupos
              </button>
            </>
          )}
          {viewMode === 'schedule-details' && (
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={handleBackFromDetails}
            >
              <i className="fa-solid fa-arrow-left"></i> Voltar
            </button>
          )}
          {viewMode === 'group-details' && (
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => {
                setViewMode('groups')
                setSelectedGroupId(null)
                setSelectedGroupName('')
              }}
            >
              <i className="fa-solid fa-arrow-left"></i> Voltar para Grupos
            </button>
          )}
        </div>
      </div>

      <div className="tab-panel-body">
        {viewMode === 'groups' && (
          <div className="schedule-groups-container">

            {groupsLoading ? (
              <div className="loading-container">
                <i className="fa-solid fa-spinner fa-spin"></i>
                <p>Carregando grupos...</p>
              </div>
            ) : groups.length === 0 ? (
              <div className="empty-container">
                <i className="fa-solid fa-inbox"></i>
                <p>Nenhum grupo de escala encontrado</p>
              </div>
            ) : (
              <>
                <div className="schedule-groups-list">
                  {groups.map((group) => {
                    const config = group.configuration
                    return (
                      <div
                        key={group.id}
                        className="schedule-group-card"
                        onClick={() => handleGroupClick(group)}
                      >
                        {/* Header do Card */}
                        <div className="schedule-group-card-header">
                          <div className="schedule-group-title-section">
                            <h5 className="schedule-group-name">
                              <i className="fa-solid fa-users"></i>
                              {group.name}
                            </h5>
                            {group.description && (
                              <p className="schedule-group-description">{group.description}</p>
                            )}
                          </div>
                          <div className="schedule-group-badge-section">
                            <span className="schedule-count-badge">
                              {group.schedulesCount} {group.schedulesCount === 1 ? 'escala' : 'escalas'}
                            </span>
                          </div>
                        </div>

                        {/* Configurações Principais */}
                        <div className="schedule-group-main-config">
                          <div className="config-item">
                            <span className="config-item-label">
                              <i className="fa-solid fa-calendar-alt"></i> Período
                            </span>
                            <div className="config-item-value">
                              <span className="config-badge highlight">
                                {getPeriodTypeLabel(config.periodType)}
                              </span>
                              <span className="config-badge">
                                {formatDate(config.periodStartDate)} - {formatDate(config.periodEndDate)}
                              </span>
                            </div>
                          </div>

                          {config.weekdays && config.weekdays.length > 0 && (
                            <div className="config-item">
                              <span className="config-item-label">
                                <i className="fa-solid fa-calendar-week"></i> Dias da Semana
                              </span>
                              <div className="config-item-value">
                                <span className="config-badge">
                                  {config.weekdays.map(d => getWeekdayName(d)).join(', ')}
                                </span>
                              </div>
                            </div>
                          )}

                          {(config.startTime || config.endTime) && (
                            <div className="config-item">
                              <span className="config-item-label">
                                <i className="fa-solid fa-clock"></i> Horário
                              </span>
                              <div className="config-item-value">
                                <span className="config-badge">
                                  {config.startTime || '--:--'} - {config.endTime || '--:--'}
                                </span>
                              </div>
                            </div>
                          )}

                          {config.selectedGroupNames && config.selectedGroupNames.length > 0 && (
                            <div className="config-item">
                              <span className="config-item-label">
                                <i className="fa-solid fa-users"></i> Grupos
                              </span>
                              <div className="config-item-value">
                                {config.selectedGroupNames.map((name, idx) => (
                                  <span key={idx} className="config-badge group-badge">
                                    {name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {config.selectedTeamName && (
                            <div className="config-item">
                              <span className="config-item-label">
                                <i className="fa-solid fa-user-group"></i> Equipe
                              </span>
                              <div className="config-item-value">
                                <span className="config-badge team-badge">
                                  {config.selectedTeamName}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Regras e Configurações Avançadas */}
                        <div className="schedule-group-rules">
                          <div className="rules-header">
                            <i className="fa-solid fa-cog"></i> Regras de Geração
                          </div>
                          <div className="rules-list">
                            {config.considerAbsences && (
                              <span className="rule-tag">
                                <i className="fa-solid fa-check-circle"></i> Considerar Ausências
                              </span>
                            )}
                            {config.requireResponsibilities && (
                              <span className="rule-tag">
                                <i className="fa-solid fa-check-circle"></i> Exigir Responsabilidades
                              </span>
                            )}
                            {config.distributionOrder && (
                              <span className="rule-tag">
                                <i className="fa-solid fa-sort"></i> Distribuição: {
                                  config.distributionOrder === 'sequential' ? 'Sequencial' :
                                  config.distributionOrder === 'random' ? 'Aleatória' : 'Balanceada'
                                }
                              </span>
                            )}
                            {config.groupsPerSchedule && (
                              <span className="rule-tag">
                                <i className="fa-solid fa-hashtag"></i> {config.groupsPerSchedule} grupo(s) por escala
                              </span>
                            )}
                            {config.participantSelection && (
                              <span className="rule-tag">
                                <i className="fa-solid fa-user-check"></i> Participantes: {
                                  config.participantSelection === 'all' ? 'Todos' :
                                  config.participantSelection === 'all_with_exclusions' ? 'Todos (com exclusões)' :
                                  config.participantSelection === 'by_group' ? 'Por Grupo' : 'Individual'
                                }
                              </span>
                            )}
                            {config.excludedDates && config.excludedDates.length > 0 && (
                              <span className="rule-tag">
                                <i className="fa-solid fa-calendar-xmark"></i> {config.excludedDates.length} data(s) excluída(s)
                              </span>
                            )}
                            {config.includedDates && config.includedDates.length > 0 && (
                              <span className="rule-tag">
                                <i className="fa-solid fa-calendar-plus"></i> {config.includedDates.length} data(s) incluída(s)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Footer do Card */}
                        <div className="schedule-group-card-footer">
                          <span className="updated-at">
                            <i className="fa-solid fa-clock"></i>
                            Atualizado em {formatDate(group.updatedAt)}
                          </span>
                          <i className="fa-solid fa-chevron-right action-arrow"></i>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {groupsTotalPages > 1 && (
                  <div className="pagination">
                    <button
                      type="button"
                      className="btn-pagination"
                      onClick={() => {
                        const newPage = groupsPage - 1
                        if (newPage >= 1) {
                          setGroupsPage(newPage)
                          loadGroups(newPage)
                        }
                      }}
                      disabled={groupsPage === 1 || groupsLoading}
                    >
                      <i className="fa-solid fa-chevron-left"></i> Anterior
                    </button>
                    <span className="pagination-info">
                      Página {groupsPage} de {groupsTotalPages}
                    </span>
                    <button
                      type="button"
                      className="btn-pagination"
                      onClick={() => {
                        const newPage = groupsPage + 1
                        if (newPage <= groupsTotalPages) {
                          setGroupsPage(newPage)
                          loadGroups(newPage)
                        }
                      }}
                      disabled={groupsPage === groupsTotalPages || groupsLoading}
                    >
                      Próxima <i className="fa-solid fa-chevron-right"></i>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {(viewMode === 'all-schedules' || viewMode === 'group-schedules') && (
          <div className="schedules-container">
            {displayMode === 'table' ? (
              // Visualização em Tabela
              <>
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
                    <div className="schedules-table-container">
                    <table className="schedules-table">
                      <thead>
                        <tr>
                          <th>Data Início</th>
                          <th>Data Fim</th>
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
                              {formatDateTime(schedule.startDatetime)}
                            </td>
                            <td 
                              className="schedule-table-date"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleTableRowClick(schedule, e)
                              }}
                            >
                              {formatDateTime(schedule.endDatetime)}
                            </td>
                            <td className="schedule-table-participants">
                              <div className="table-participants-avatars">
                                {schedule.pessoas.map((pessoa, index) => {
                                  const isRejected = pessoa.status === 'rejected'
                                  
                                  return (
                                    <div
                                      key={index}
                                      className="table-participant-avatar-wrapper"
                                      style={{ zIndex: schedule.pessoas.length - index }}
                                    >
                                      <div
                                        className="table-participant-avatar"
                                        title={`${pessoa.nome}${pessoa.função ? ` - ${pessoa.função}` : ''}`}
                                      >
                                        <div className="table-participant-avatar-content">
                                          {pessoa.url ? (
                                            <img
                                              src={addCacheBusting(pessoa.url)}
                                              alt={pessoa.nome}
                                              className="table-participant-avatar-image"
                                              loading="lazy"
                                              decoding="async"
                                            />
                                          ) : (
                                            <div className="table-participant-avatar-placeholder">
                                              {pessoa.nome && pessoa.nome.length > 0
                                                ? pessoa.nome.charAt(0).toUpperCase()
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
                                          <div className="tooltip-name">{pessoa.nome}</div>
                                          {pessoa.função && (
                                            <div className="tooltip-role">{pessoa.função}</div>
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

                  {optimizedSchedulesTotalPages > 1 && (
                    <div className="pagination">
                      <button
                        type="button"
                        className="btn-pagination"
                        onClick={() => {
                          const newPage = optimizedSchedulesPage - 1
                          if (newPage >= 1) {
                            setOptimizedSchedulesPage(newPage)
                            loadOptimizedSchedules(newPage, viewMode === 'group-schedules' ? selectedGroupId || undefined : undefined)
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
                            loadOptimizedSchedules(newPage, viewMode === 'group-schedules' ? selectedGroupId || undefined : undefined)
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
              </>
            ) : (
              // Visualização em Cards
              schedulesLoading ? (
                <div className="loading-container">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <p>Carregando escalas...</p>
                </div>
              ) : schedules.length === 0 ? (
                <div className="empty-container">
                  <i className="fa-solid fa-inbox"></i>
                  <p>Nenhuma escala encontrada</p>
                </div>
              ) : (
                <>
                  <div className="schedules-list">
                  {schedules.map((schedule) => {
                    const scheduleDate = new Date(schedule.startDatetime)
                    return (
                      <div
                        key={schedule.id}
                        className="schedule-card"
                        onClick={() => handleScheduleClick(schedule.id)}
                      >
                        {/* Header com Data Destacada */}
                        <div className="schedule-card-header">
                          <div className="schedule-date-display">
                            <div className="schedule-date-block">
                              <span className="date-day">
                                {scheduleDate.getDate()}
                              </span>
                              <span className="date-month">
                                {scheduleDate.toLocaleDateString('pt-BR', { month: 'short' })}
                              </span>
                              <span className="date-year">
                                {scheduleDate.getFullYear()}
                              </span>
                            </div>
                            <div className="schedule-date-info">
                              <div className="schedule-weekday">
                                {scheduleDate.toLocaleDateString('pt-BR', { weekday: 'long' })}
                              </div>
                            </div>
                          </div>
                          <span className={getStatusBadgeClass(schedule.status)}>
                            {getStatusLabel(schedule.status)}
                          </span>
                        </div>

                        {/* Informações Principais */}
                        <div className="schedule-card-body">
                          <div className="schedule-time-section">
                            <div className="schedule-time-item">
                              <i className="fa-solid fa-clock"></i>
                              <div className="time-details">
                                <span className="time-label">Início</span>
                                <span className="time-value">{formatDateTime(schedule.startDatetime).split(' ')[1]}</span>
                              </div>
                            </div>
                            <div className="time-separator">
                              <i className="fa-solid fa-arrow-right"></i>
                            </div>
                            <div className="schedule-time-item">
                              <i className="fa-solid fa-clock"></i>
                              <div className="time-details">
                                <span className="time-label">Fim</span>
                                <span className="time-value">{formatDateTime(schedule.endDatetime).split(' ')[1]}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Footer com Meta Informações */}
                        <div className="schedule-card-footer">
                          <div className="schedule-participants-info">
                            {schedule.participants && schedule.participants.length > 0 ? (
                              <>
                                <div className="schedule-participants-avatars">
                                  {schedule.participants.map((participant, index) => {
                                    // Verificar se participant é um objeto (com id, name, imageUrl) ou string (ID)
                                    const participantData: { id: string; name: string; imageUrl: string | null } = 
                                      typeof participant === 'object' && participant !== null && 'id' in participant
                                        ? participant as { id: string; name: string; imageUrl: string | null }
                                        : { 
                                            id: typeof participant === 'string' ? participant : String(index), 
                                            name: typeof participant === 'object' && participant !== null && 'name' in participant 
                                              ? (participant as any).name 
                                              : 'Participante', 
                                            imageUrl: typeof participant === 'object' && participant !== null && 'imageUrl' in participant
                                              ? (participant as any).imageUrl
                                              : null
                                          }
                                    
                                    return (
                                      <div
                                        key={participantData.id || index}
                                        className="participant-avatar"
                                        style={{ zIndex: schedule.participants!.length - index }}
                                      >
                                        <div className="participant-avatar-content">
                                          {participantData.imageUrl ? (
                                            <img
                                              src={addCacheBusting(participantData.imageUrl)}
                                              alt={participantData.name}
                                              className="participant-avatar-image"
                                              loading="lazy"
                                              decoding="async"
                                            />
                                          ) : (
                                            <div className="participant-avatar-placeholder">
                                              {participantData.name && participantData.name.length > 0 
                                                ? participantData.name.charAt(0).toUpperCase() 
                                                : '?'}
                                            </div>
                                          )}
                                        </div>
                                        <span className="participant-avatar-name">{participantData.name}</span>
                                      </div>
                                    )
                                  })}
                                  {schedule.participantsCount > schedule.participants.length && (
                                    <div className="participant-avatar-more" title={`+${schedule.participantsCount - schedule.participants.length} mais`}>
                                      +{schedule.participantsCount - schedule.participants.length}
                                    </div>
                                  )}
                                </div>
                                <span className="participants-count">
                                  {schedule.participantsCount} {schedule.participantsCount === 1 ? 'participante' : 'participantes'}
                                </span>
                              </>
                            ) : (
                              <>
                                <i className="fa-solid fa-users"></i>
                                <span>{schedule.participantsCount} {schedule.participantsCount === 1 ? 'participante' : 'participantes'}</span>
                              </>
                            )}
                          </div>
                          <i className="fa-solid fa-chevron-right schedule-action-arrow"></i>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {schedulesTotalPages > 1 && (
                  <div className="pagination">
                    <button
                      type="button"
                      className="btn-pagination"
                      onClick={() => {
                        const newPage = schedulesPage - 1
                        if (newPage >= 1) {
                          setSchedulesPage(newPage)
                          loadSchedules(newPage, viewMode === 'group-schedules' ? selectedGroupId || undefined : undefined)
                        }
                      }}
                      disabled={schedulesPage === 1 || schedulesLoading}
                    >
                      <i className="fa-solid fa-chevron-left"></i> Anterior
                    </button>
                    <span className="pagination-info">
                      Página {schedulesPage} de {schedulesTotalPages}
                    </span>
                    <button
                      type="button"
                      className="btn-pagination"
                      onClick={() => {
                        const newPage = schedulesPage + 1
                        if (newPage <= schedulesTotalPages) {
                          setSchedulesPage(newPage)
                          loadSchedules(newPage, viewMode === 'group-schedules' ? selectedGroupId || undefined : undefined)
                        }
                      }}
                      disabled={schedulesPage === schedulesTotalPages || schedulesLoading}
                    >
                      Próxima <i className="fa-solid fa-chevron-right"></i>
                    </button>
                  </div>
                )}
              </>
            )
            )}
          </div>
        )}

        {viewMode === 'group-details' && selectedGroupId && (
          <ScheduleGroupDetailsView
            groupId={selectedGroupId}
            onBack={() => {
              setViewMode('groups')
              setSelectedGroupId(null)
              setSelectedGroupName('')
            }}
            onViewSchedules={handleViewGroupSchedules}
          />
        )}

        {viewMode === 'schedule-details' && selectedScheduleId && (
          <ScheduleDetailsView
            scheduleId={selectedScheduleId}
            onBack={handleBackFromDetails}
            onUpdate={() => {
              // Recarregar escalas se necessário
              if (displayMode === 'table') {
                loadOptimizedSchedules(optimizedSchedulesPage, selectedGroupId || undefined)
              } else {
                loadSchedules(schedulesPage, selectedGroupId || undefined)
              }
            }}
          />
        )}
      </div>
    </div>
  )
}

