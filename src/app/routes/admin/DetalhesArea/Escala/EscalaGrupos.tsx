import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { scheduleGenerationService } from '../../../../../services/basic/scheduleGenerationService'
import type { ScheduleGroupDto } from './types'
import { mapConfiguration } from './utils'
import './EscalaTabPanel.css'

export default function EscalaGrupos() {
  const { id: scheduledAreaId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Estados para grupos
  const [groups, setGroups] = useState<ScheduleGroupDto[]>([])
  const [groupsPage, setGroupsPage] = useState(1)
  const [groupsTotalPages, setGroupsTotalPages] = useState(1)
  const [groupsLoading, setGroupsLoading] = useState(false)
  const groupsLimit = 10

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

  // Carregar grupos na montagem
  useEffect(() => {
    if (scheduledAreaId) {
      loadGroups(1)
      setGroupsPage(1)
    }
  }, [scheduledAreaId, loadGroups])

  // Handlers
  const handleGroupClick = (groupId: string) => {
    navigate(`/Dashboard/escala/areas/${scheduledAreaId}/escala/grupo/${groupId}`)
  }

  // Funções auxiliares
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const getPeriodTypeLabel = (periodType: string) => {
    const labels: Record<string, string> = {
      fixed: 'Período Fixo',
      daily: 'Diário',
      weekly: 'Semanal',
      monthly: 'Mensal',
    }
    return labels[periodType] || periodType
  }

  const getWeekdayName = (day: number) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    return days[day] || `Dia ${day}`
  }

  return (
    <div className="escala-tab-panel">
      <div className="tab-content">
        {/* Header com navegação */}
        <div className="schedules-header">
          <div className="header-left">
            <h3>Grupos de Escalas</h3>
          </div>
          <div className="header-right">
            <Link
              to={`/Dashboard/escala/areas/${scheduledAreaId}/escala/cards`}
              className="btn-secondary btn-sm"
            >
              <i className="fa-solid fa-th-large"></i> Cards
            </Link>
            <Link
              to={`/Dashboard/escala/areas/${scheduledAreaId}/escala/tabela`}
              className="btn-secondary btn-sm"
            >
              <i className="fa-solid fa-table"></i> Tabela
            </Link>
          </div>
        </div>

        <div className="groups-container">
          {groupsLoading ? (
            <div className="loading-container">
              <i className="fa-solid fa-spinner fa-spin"></i>
              <p>Carregando grupos...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="empty-state">
              <i className="fa-solid fa-inbox"></i>
              <p>Nenhum grupo de escalas encontrado</p>
            </div>
          ) : (
            <>
              <div className="schedule-groups-grid">
                {groups.map((group) => {
                  const config = group.configuration
                  return (
                    <div
                      key={group.id}
                      className="schedule-group-card"
                      onClick={() => handleGroupClick(group.id)}
                    >
                      {/* Header do Card */}
                      <div className="schedule-group-card-header">
                        <div className="schedule-group-title-section">
                          <h4 className="schedule-group-name">{group.name}</h4>
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
      </div>
    </div>
  )
}

