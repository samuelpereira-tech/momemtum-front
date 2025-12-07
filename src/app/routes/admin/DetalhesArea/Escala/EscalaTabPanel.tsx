import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import '../shared/TabPanel.css'
import './EscalaTabPanel.css'
import { getScheduleGroups, getSchedules, type ScheduleGroupDto, type ScheduleDto } from './mockServices'
import ScheduleDetailsView from './ScheduleDetailsView'
import ScheduleGroupDetailsView from './ScheduleGroupDetailsView'

export default function EscalaTabPanel() {
  const { id: scheduledAreaId } = useParams<{ id: string }>()
  const [viewMode, setViewMode] = useState<'groups' | 'all-schedules' | 'group-schedules' | 'schedule-details' | 'group-details'>('groups')
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

  // Carregar grupos
  const loadGroups = useCallback(async (page: number) => {
    if (!scheduledAreaId) return

    setGroupsLoading(true)
    try {
      const response = await getScheduleGroups(scheduledAreaId, { page, limit: groupsLimit })
      setGroups(response.data)
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
      const response = await getSchedules(scheduledAreaId, {
        page,
        limit: schedulesLimit,
        scheduleGroupId: groupId,
      })
      setSchedules(response.data)
      setSchedulesTotalPages(response.meta.totalPages)
    } catch (error) {
      console.error('Erro ao carregar escalas:', error)
    } finally {
      setSchedulesLoading(false)
    }
  }, [scheduledAreaId, schedulesLimit])

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
      loadSchedules(1, viewMode === 'group-schedules' ? selectedGroupId || undefined : undefined)
      setSchedulesPage(1)
    }
  }, [scheduledAreaId, viewMode, selectedGroupId, loadSchedules])

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

  const handleScheduleClick = (scheduleId: string) => {
    setSelectedScheduleId(scheduleId)
    setViewMode('schedule-details')
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

  return (
    <div className="tab-panel">
      <div className="tab-panel-header">
        <h3 className="tab-panel-title">
          <i className="fa-solid fa-users"></i> Grupos de Escalas
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
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={handleBackToGroups}
            >
              <i className="fa-solid fa-arrow-left"></i> Voltar para Grupos
            </button>
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
            <div className="schedules-header">
              <h4 className="section-title">
                <i className="fa-solid fa-calendar-check"></i>
                {viewMode === 'group-schedules' ? `Escalas do Grupo: ${selectedGroupName}` : 'Todas as Escalas'}
              </h4>
            </div>

            {schedulesLoading ? (
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
                  {schedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="schedule-card"
                      onClick={() => handleScheduleClick(schedule.id)}
                    >
                      <div className="schedule-header">
                        <div className="schedule-main-info">
                          <div className="schedule-date-block">
                            <span className="date-day">
                              {new Date(schedule.startDatetime).getDate()}
                            </span>
                            <span className="date-month">
                              {new Date(schedule.startDatetime).toLocaleDateString('pt-BR', { month: 'short' })}
                            </span>
                          </div>

                          <div className="schedule-info-content">
                            {schedule.date && (
                              <div className="schedule-full-date">
                                {new Date(schedule.date).toLocaleDateString('pt-BR', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                            )}
                            <div className="schedule-time-range">
                              <i className="fa-regular fa-clock"></i>
                              {formatDateTime(schedule.startDatetime).split(' ')[1]} - {formatDateTime(schedule.endDatetime).split(' ')[1]}
                            </div>
                            {schedule.dayIndex && (
                              <div className="schedule-day-info">
                                <i className="fa-solid fa-calendar-day"></i>
                                Dia {schedule.dayIndex} do período
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="schedule-meta-row">
                          <span className={getStatusBadgeClass(schedule.status)}>
                            {getStatusLabel(schedule.status)}
                          </span>
                          <span className="schedule-participants">
                            <i className="fa-solid fa-users"></i>
                            {schedule.participantsCount} {schedule.participantsCount === 1 ? 'part.' : 'participantes'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
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
              loadSchedules(schedulesPage, selectedGroupId || undefined)
            }}
          />
        )}
      </div>
    </div>
  )
}

