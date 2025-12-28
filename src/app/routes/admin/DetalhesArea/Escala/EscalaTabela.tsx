import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { scheduleService, type ScheduleOptimizedResponseDto } from '../../../../../services/basic/scheduleService'
import { addCacheBusting } from '../../../../../utils/fileUtils'
import { useToast } from '../../../../../components/ui/Toast/ToastProvider'
import ConfirmModal from '../../../../../components/ui/ConfirmModal/ConfirmModal'
import WhatsAppNotificationModal, { type NotificationConfig } from './WhatsAppNotificationModal'
import './EscalaTabPanel.css'

export default function EscalaTabela() {
  const { id: scheduledAreaId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const grupoId = searchParams.get('grupo')
  const toast = useToast()

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

  // Estados para seleção múltipla e remoção
  const [selectedSchedules, setSelectedSchedules] = useState<Set<string>>(new Set())
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Estados para notificação WhatsApp
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [scheduleNotifications, setScheduleNotifications] = useState<Map<string, NotificationConfig[]>>(new Map())


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

        // Limpar seleção quando os dados mudarem
        setSelectedSchedules(new Set())
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

  // Renderizar grupos ou roles (se sem grupo)
  const renderGroupsOrRoles = (schedule: ScheduleOptimizedResponseDto) => {
    if (schedule.groups && schedule.groups.length > 0) {
      return (
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
      )
    }

    // Se não tiver grupo, exibe roles distintos
    const roles = (schedule.people || schedule.participants || [])
      .map(p => p.role)
      .filter((role): role is string => !!role)

    const distinctRoles = Array.from(new Set(roles)).sort()

    if (distinctRoles.length > 0) {
      return (
        <div className="table-groups-list">
          {distinctRoles.map((role, index) => (
            <span key={`role-${index}`} className="table-group-badge" style={{ opacity: 0.8 }}>
              {role}
            </span>
          ))}
        </div>
      )
    }

    return <span className="table-group-empty">-</span>
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

  // Funções de seleção
  const handleSelectSchedule = (scheduleId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    setSelectedSchedules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(scheduleId)) {
        newSet.delete(scheduleId)
      } else {
        newSet.add(scheduleId)
      }
      return newSet
    })
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    const allVisibleIds = new Set(optimizedSchedules.map(s => s.id))
    const allSelected = allVisibleIds.size > 0 && Array.from(allVisibleIds).every(id => selectedSchedules.has(id))

    if (allSelected) {
      // Deselecionar todas as visíveis
      setSelectedSchedules(prev => {
        const newSet = new Set(prev)
        allVisibleIds.forEach(id => newSet.delete(id))
        return newSet
      })
    } else {
      // Selecionar todas as visíveis
      setSelectedSchedules(prev => {
        const newSet = new Set(prev)
        allVisibleIds.forEach(id => newSet.add(id))
        return newSet
      })
    }
  }

  // Funções de remoção
  const handleDeleteClick = (scheduleId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setScheduleToDelete(scheduleId)
    setShowDeleteModal(true)
  }

  const handleBulkDeleteClick = () => {
    if (selectedSchedules.size > 0) {
      setShowBulkDeleteModal(true)
    }
  }

  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete || !scheduledAreaId || isDeleting) return

    setIsDeleting(true)
    try {
      await scheduleService.deleteSchedule(scheduledAreaId, scheduleToDelete)
      setSelectedSchedules(prev => {
        const newSet = new Set(prev)
        newSet.delete(scheduleToDelete)
        return newSet
      })
      setShowDeleteModal(false)
      setScheduleToDelete(null)
      toast.showSuccess('Escala removida com sucesso!')

      // Recarregar escalas
      await reloadSchedules()
    } catch (err: any) {
      console.error('Erro ao remover escala:', err)
      toast.showError(err.message || 'Erro ao remover escala')
    } finally {
      setIsDeleting(false)
    }
  }

  const confirmBulkDeleteSchedules = async () => {
    if (selectedSchedules.size === 0 || !scheduledAreaId || isDeleting) return

    setIsDeleting(true)
    const scheduleIds = Array.from(selectedSchedules)
    let successCount = 0
    let errorCount = 0

    try {
      // Usar Promise.allSettled para processar todas as remoções mesmo se algumas falharem
      const results = await Promise.allSettled(
        scheduleIds.map(id => scheduleService.deleteSchedule(scheduledAreaId, id))
      )

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount++
        } else {
          errorCount++
          console.error(`Erro ao remover escala ${scheduleIds[index]}:`, result.reason)
        }
      })

      setSelectedSchedules(new Set())
      setShowBulkDeleteModal(false)

      if (errorCount === 0) {
        toast.showSuccess(`${successCount} escala(s) removida(s) com sucesso!`)
      } else if (successCount > 0) {
        toast.showWarning(`${successCount} escala(s) removida(s), ${errorCount} falharam`)
      } else {
        toast.showError('Erro ao remover escalas')
      }

      // Recarregar escalas
      await reloadSchedules()
    } catch (err: any) {
      console.error('Erro ao remover escalas:', err)
      toast.showError('Erro ao remover escalas')
    } finally {
      setIsDeleting(false)
    }
  }

  // Handler para configurar notificações WhatsApp
  const handleOpenWhatsAppModal = () => {
    if (selectedSchedules.size > 0) {
      setShowWhatsAppModal(true)
    }
  }

  const handleSaveWhatsAppConfig = (configs: NotificationConfig[]) => {
    // Atualizar estado local para demonstração
    setScheduleNotifications(prev => {
      const newMap = new Map(prev)
      selectedSchedules.forEach(scheduleId => {
        // Em um cenário real, enviaríamos para a API aqui
        // scheduleService.updateNotificationConfig(scheduledAreaId, scheduleId, configs)
        newMap.set(scheduleId, configs)
      })
      return newMap
    })

    toast.showSuccess(`Notificações configuradas para ${selectedSchedules.size} escala(s)!`)
    setSelectedSchedules(new Set()) // Limpar seleção após configurar
  }


  // Função auxiliar para recarregar escalas
  const reloadSchedules = useCallback(async () => {
    if (!scheduledAreaId) return

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
        filters.startDate = filterStartDate
      }

      if (filterEndDate) {
        filters.endDate = filterEndDate
      }

      const response = await scheduleService.getSchedulesOptimized(scheduledAreaId, filters)
      setOptimizedSchedules(response.data)
      setOptimizedSchedulesTotalPages(response.meta.totalPages)

      // Ajustar página se necessário
      if (response.data.length === 0 && optimizedSchedulesPage > 1) {
        setOptimizedSchedulesPage(prev => Math.max(1, prev - 1))
      }
    } catch (error) {
      console.error('Erro ao recarregar escalas:', error)
    } finally {
      setOptimizedSchedulesLoading(false)
    }
  }, [scheduledAreaId, grupoId, filterStartDate, filterEndDate, optimizedSchedulesPage, schedulesLimit])

  // Calcular estado do checkbox "selecionar todos"
  const allVisibleIds = new Set(optimizedSchedules.map(s => s.id))
  const allSelected = allVisibleIds.size > 0 && Array.from(allVisibleIds).every(id => selectedSchedules.has(id))
  const someSelected = Array.from(allVisibleIds).some(id => selectedSchedules.has(id))

  return (
    <div className="escala-tab-panel">
      <WhatsAppNotificationModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        onSave={handleSaveWhatsAppConfig}
        selectedCount={selectedSchedules.size}
      />
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

          {/* Controles de Ação */}
          {!optimizedSchedulesLoading && optimizedSchedules.length > 0 && (
            <div className="table-group-controls">
              {selectedSchedules.size > 0 && (
                <>
                  <button
                    type="button"
                    className="btn-success btn-sm"
                    onClick={handleOpenWhatsAppModal}
                  >
                    <i className="fa-brands fa-whatsapp"></i> Configurar Notificação ({selectedSchedules.size})
                  </button>
                  <button
                    type="button"
                    className="btn-danger btn-sm"
                    onClick={handleBulkDeleteClick}
                    disabled={isDeleting}
                  >
                    <i className="fa-solid fa-trash"></i> Remover ({selectedSchedules.size})
                  </button>
                </>
              )}

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
                                <th style={{ width: '40px' }}>
                                  <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={(input) => {
                                      if (input) input.indeterminate = someSelected && !allSelected
                                    }}
                                    onChange={(e) => handleSelectAll(e)}
                                    onClick={(e) => e.stopPropagation()}
                                    title={allSelected ? 'Deselecionar todas' : 'Selecionar todas'}
                                  />
                                </th>
                                <th>Grupos / Funções</th>
                                <th>Descrição</th>
                                <th>Participantes</th>
                                <th style={{ width: '60px' }}>Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dateGroup.schedules.map((schedule) => {

                                const isSelected = selectedSchedules.has(schedule.id)
                                const hasNotification = scheduleNotifications.has(schedule.id) || (schedule.notifications && schedule.notifications.rulesCount > 0)

                                return (
                                  <tr
                                    key={schedule.id}
                                    className={`schedule-table-row ${isSelected ? 'row-selected' : ''}`}
                                    onClick={(e) => handleTableRowClick(schedule, e)}
                                  >
                                    <td onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => handleSelectSchedule(schedule.id, e)}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </td>

                                    <td className="schedule-table-groups">
                                      {renderGroupsOrRoles(schedule)}
                                      {hasNotification && (
                                        <span className="notification-icon" title="Notificações WhatsApp configuradas">
                                          <i className="fa-brands fa-whatsapp text-success" style={{ marginLeft: '8px' }}></i>
                                        </span>
                                      )}
                                    </td>
                                    <td className="schedule-table-description">
                                      {schedule.description || '-'}
                                    </td>
                                    <td className="schedule-table-participants">
                                      <div className="table-participants-avatars">

                                        {(schedule.people || schedule.participants || []).map((person, index) => {
                                          const isRejected = person.status === 'rejected'

                                          return (
                                            <div
                                              key={index}
                                              className="table-participant-avatar-wrapper"

                                              style={{ zIndex: (schedule.people || schedule.participants || []).length - index }}
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
                                        })
                                        }
                                      </div >
                                    </td >
                                    <td onClick={(e) => e.stopPropagation()}>
                                      <button
                                        type="button"
                                        className="btn-action btn-delete"
                                        onClick={(e) => handleDeleteClick(schedule.id, e)}
                                        title="Remover escala"
                                        disabled={isDeleting}
                                      >
                                        <i className="fa-solid fa-trash"></i>
                                      </button>
                                    </td>
                                  </tr >
                                )
                              })}
                            </tbody >
                          </table >
                        )}
                      </div >
                    )
                  })}
                </div >
              ) : (
                // Visualização normal (não agrupada)
                <div className="schedules-table-container">
                  <table className="schedules-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(input) => {
                              if (input) input.indeterminate = someSelected && !allSelected
                            }}
                            onChange={(e) => handleSelectAll(e)}
                            onClick={(e) => e.stopPropagation()}
                            title={allSelected ? 'Deselecionar todas' : 'Selecionar todas'}
                          />
                        </th>
                        <th>Data</th>
                        <th>Grupos / Funções</th>
                        <th>Descrição</th>
                        <th>Participantes</th>
                        <th style={{ width: '60px' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {optimizedSchedules.map((schedule) => {
                        const isSelected = selectedSchedules.has(schedule.id)
                        const hasNotification = scheduleNotifications.has(schedule.id) || (schedule.notifications && schedule.notifications.rulesCount > 0)

                        return (
                          <tr
                            key={schedule.id}
                            className={`schedule-table-row ${isSelected ? 'row-selected' : ''}`}
                            onClick={(e) => handleTableRowClick(schedule, e)}
                          >
                            <td onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleSelectSchedule(schedule.id, e)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
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
                              {renderGroupsOrRoles(schedule)}
                              {hasNotification && (
                                <span className="notification-icon" title="Notificações WhatsApp configuradas">
                                  <i className="fa-brands fa-whatsapp text-success" style={{ marginLeft: '8px' }}></i>
                                </span>
                              )}
                            </td>
                            <td className="schedule-table-description">
                              {schedule.description || '-'}
                            </td>
                            <td className="schedule-table-participants">
                              <div className="table-participants-avatars">
                                {(schedule.people || schedule.participants || []).map((person, index) => {
                                  const isRejected = person.status === 'rejected'

                                  return (
                                    <div
                                      key={index}
                                      className="table-participant-avatar-wrapper"
                                      style={{ zIndex: (schedule.people || schedule.participants || []).length - index }}
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
                                })
                                }
                              </div >
                            </td >
                            <td onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="btn-action btn-delete"
                                onClick={(e) => handleDeleteClick(schedule.id, e)}
                                title="Remover escala"
                                disabled={isDeleting}
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </td>
                          </tr >
                        )
                      })}
                    </tbody >
                  </table >
                </div >
              )}

              {
                optimizedSchedulesTotalPages > 1 && (
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
                )
              }
            </>
          )}
        </div >
      </div >

      {/* Modal de confirmação para remoção individual */}
      < ConfirmModal
        isOpen={showDeleteModal}
        title="Remover Escala"
        message="Tem certeza que deseja remover esta escala? Esta ação não pode ser desfeita."
        confirmText="Remover"
        cancelText="Cancelar"
        type="danger"
        onConfirm={confirmDeleteSchedule}
        onCancel={() => {
          setShowDeleteModal(false)
          setScheduleToDelete(null)
        }}
      />

      {/* Modal de confirmação para remoção em massa */}
      <ConfirmModal
        isOpen={showBulkDeleteModal}
        title="Remover Escalas Selecionadas"
        message={`Tem certeza que deseja remover ${selectedSchedules.size} escala(s) selecionada(s)? Esta ação não pode ser desfeita.`}
        confirmText="Remover"
        cancelText="Cancelar"
        type="danger"
        onConfirm={confirmBulkDeleteSchedules}
        onCancel={() => setShowBulkDeleteModal(false)}
      />
    </div >
  )
}

