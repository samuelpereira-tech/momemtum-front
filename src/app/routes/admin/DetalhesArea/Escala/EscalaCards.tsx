import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { scheduleService } from '../../../../../services/basic/scheduleService'
import type { ScheduleDto } from './types'
import { addCacheBusting } from '../../../../../utils/fileUtils'
import './EscalaTabPanel.css'

export default function EscalaCards() {
  const { id: scheduledAreaId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const grupoId = searchParams.get('grupo')

  // Estados para escalas
  const [schedules, setSchedules] = useState<ScheduleDto[]>([])
  const [schedulesPage, setSchedulesPage] = useState(1)
  const [schedulesTotalPages, setSchedulesTotalPages] = useState(1)
  const [schedulesLoading, setSchedulesLoading] = useState(false)
  const schedulesLimit = 10

  // Ref para evitar execuções duplicadas
  const isLoadingRef = useRef(false)
  const lastLoadParamsRef = useRef<string>('')

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

  // Carregar escalas quando mudar grupo ou página
  useEffect(() => {
    if (!scheduledAreaId) return

    const loadKey = `${scheduledAreaId}-${grupoId || 'all'}-${schedulesPage}`
    
    // Evitar execuções duplicadas
    if (isLoadingRef.current || lastLoadParamsRef.current === loadKey) {
      return
    }

    isLoadingRef.current = true
    lastLoadParamsRef.current = loadKey

    loadSchedules(schedulesPage, grupoId || undefined)
    isLoadingRef.current = false
  }, [scheduledAreaId, grupoId, schedulesPage, loadSchedules])

  // Handlers
  const handleScheduleClick = (scheduleId: string) => {
    navigate(`/Dashboard/escala/areas/${scheduledAreaId}/escala/schedule/${scheduleId}`)
  }

  // Funções auxiliares
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

  const getStatusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      pending: 'status-badge status-pending',
      confirmed: 'status-badge status-confirmed',
      cancelled: 'status-badge status-cancelled',
    }
    return classes[status] || 'status-badge'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      cancelled: 'Cancelado',
    }
    return labels[status] || status
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
                  navigate(`/Dashboard/escala/areas/${scheduledAreaId}/escala/cards`)
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
              to={`/Dashboard/escala/areas/${scheduledAreaId}/escala/tabela${grupoId ? `?grupo=${grupoId}` : ''}`}
              className="btn-secondary btn-sm"
            >
              <i className="fa-solid fa-table"></i> Tabela
            </Link>
          </div>
        </div>

        <div className="schedules-container">
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
      </div>
    </div>
  )
}

