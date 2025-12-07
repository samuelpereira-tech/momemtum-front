import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import '../shared/TabPanel.css'
import './EscalaTabPanel.css'
import { getScheduleGroups, getSchedules, type ScheduleGroupDto, type ScheduleDto } from './mockServices'
import ScheduleDetailsView from './ScheduleDetailsView'

export default function EscalaTabPanel() {
  const { id: scheduledAreaId } = useParams<{ id: string }>()
  const [viewMode, setViewMode] = useState<'groups' | 'all-schedules' | 'group-schedules' | 'schedule-details'>('groups')
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
    setViewMode('group-schedules')
    setSchedulesPage(1)
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

  return (
    <div className="tab-panel">
      <div className="tab-panel-header">
        <h3 className="tab-panel-title">
          <i className="fa-solid fa-calendar-check"></i> Escalas
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
        </div>
      </div>

      <div className="tab-panel-body">
        {viewMode === 'groups' && (
          <div className="schedule-groups-container">
            <div className="schedule-groups-header">
              <h4 className="section-title">
                <i className="fa-solid fa-users"></i> Grupos de Escalas
              </h4>
              <p className="section-description">
                Clique em um grupo para visualizar suas escalas
              </p>
            </div>

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
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className="schedule-group-card"
                      onClick={() => handleGroupClick(group)}
                    >
                      <div className="schedule-group-header">
                        <h5 className="schedule-group-name">
                          <i className="fa-solid fa-users"></i>
                          {group.name}
                        </h5>
                        <span className="schedule-group-count">
                          {group.schedulesCount} {group.schedulesCount === 1 ? 'escala' : 'escalas'}
                        </span>
                      </div>
                      {group.description && (
                        <p className="schedule-group-description">{group.description}</p>
                      )}
                      <div className="schedule-group-footer">
                        <span className="schedule-group-date">
                          <i className="fa-solid fa-calendar"></i>
                          Atualizado em {formatDate(group.updatedAt)}
                        </span>
                        <i className="fa-solid fa-chevron-right schedule-group-arrow"></i>
                      </div>
                    </div>
                  ))}
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
                        <div className="schedule-dates">
                          <i className="fa-solid fa-calendar"></i>
                          <div>
                            <div className="schedule-date-start">
                              Início: {formatDateTime(schedule.startDatetime)}
                            </div>
                            <div className="schedule-date-end">
                              Fim: {formatDateTime(schedule.endDatetime)}
                            </div>
                          </div>
                        </div>
                        <div className="schedule-meta">
                          <span className={getStatusBadgeClass(schedule.status)}>
                            {getStatusLabel(schedule.status)}
                          </span>
                          <span className="schedule-participants">
                            <i className="fa-solid fa-users"></i>
                            {schedule.participantsCount} {schedule.participantsCount === 1 ? 'participante' : 'participantes'}
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

