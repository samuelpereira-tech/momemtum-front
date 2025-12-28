import React, { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { type ScheduleOptimizedResponseDto } from '../../../../../services/basic/scheduleService'
import ConfirmModal from '../../../../../components/ui/ConfirmModal/ConfirmModal'
import WhatsAppNotificationModal from './WhatsAppNotificationModal'
import { useSchedulesLogic } from './hooks/useSchedulesLogic'
import { ScheduleTableRow } from './components/ScheduleTableRow'
import { ScheduleTableFilters } from './components/ScheduleTableFilters'
import { ScheduleTableControls } from './components/ScheduleTableControls'
import { SchedulePagination } from './components/SchedulePagination'
import { formatDateRange, groupSchedulesByDate } from './utils'
import './EscalaTabPanel.css'

export default function EscalaTabela() {
  const {
    scheduledAreaId,
    grupoId,
    navigate,
    optimizedSchedules,
    optimizedSchedulesPage,
    setOptimizedSchedulesPage,
    optimizedSchedulesTotalPages,
    optimizedSchedulesLoading,
    filterStartDate,
    setFilterStartDate,
    filterEndDate,
    setFilterEndDate,
    groupByDate,
    setGroupByDate,
    expandedDates,
    setExpandedDates,
    selectedSchedules,
    showDeleteModal,
    setShowDeleteModal,
    showBulkDeleteModal,
    setShowBulkDeleteModal,
    isDeleting,
    showWhatsAppModal,
    setShowWhatsAppModal,
    scheduleNotifications,
    handleSelectSchedule,
    handleSelectAll,
    confirmDeleteSchedule,
    confirmBulkDeleteSchedules,
    handleSaveWhatsAppConfig,
    setScheduleToDelete
  } = useSchedulesLogic()

  // Handler para clicar na linha da tabela
  const handleTableRowClick = useCallback((schedule: ScheduleOptimizedResponseDto, e?: React.MouseEvent) => {
    if (e) {
      const target = e.target as HTMLElement
      if (target.closest('.table-participant-avatar') || target.closest('.table-participant-tooltip')) {
        return
      }
    }

    if (schedule.id) {
      navigate(`/Dashboard/escala/areas/${scheduledAreaId}/escala/schedule/${schedule.id}`)
    }
  }, [navigate, scheduledAreaId])

  // Renderizar grupos ou roles
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

  // Calcular estado do checkbox "selecionar todos"
  const allVisibleIds = new Set(optimizedSchedules.map(s => s.id))
  const allSelected = allVisibleIds.size > 0 && Array.from(allVisibleIds).every(id => selectedSchedules.has(id))
  const someSelected = Array.from(allVisibleIds).some(id => selectedSchedules.has(id))

  const handleDeleteClick = (scheduleId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setScheduleToDelete(scheduleId)
    setShowDeleteModal(true)
  }

  return (
    <div className="escala-tab-panel">
      <WhatsAppNotificationModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        onSave={handleSaveWhatsAppConfig}
        selectedCount={selectedSchedules.size}
      />

      <div className="tab-content">
        <div className="schedules-header">
          <div className="header-left">
            <h3>Todas as Escalas</h3>
            {grupoId && (
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => navigate(`/Dashboard/escala/areas/${scheduledAreaId}/escala/tabela`)}
              >
                <i className="fa-solid fa-arrow-left"></i> Ver Todas
              </button>
            )}
          </div>
          <div className="header-right">
            <Link to={`/Dashboard/escala/areas/${scheduledAreaId}/escala/grupos`} className="btn-secondary btn-sm">
              <i className="fa-solid fa-users"></i> Grupos
            </Link>
            <Link to={`/Dashboard/escala/areas/${scheduledAreaId}/escala/cards${grupoId ? `?grupo=${grupoId}` : ''}`} className="btn-secondary btn-sm">
              <i className="fa-solid fa-th-large"></i> Cards
            </Link>
          </div>
        </div>

        <div className="schedules-container">
          <ScheduleTableFilters
            filterStartDate={filterStartDate}
            filterEndDate={filterEndDate}
            setFilterStartDate={(d) => { setFilterStartDate(d); setOptimizedSchedulesPage(1) }}
            setFilterEndDate={(d) => { setFilterEndDate(d); setOptimizedSchedulesPage(1) }}
            onClear={() => { setFilterStartDate(''); setFilterEndDate(''); setOptimizedSchedulesPage(1) }}
          />

          {!optimizedSchedulesLoading && optimizedSchedules.length > 0 && (
            <ScheduleTableControls
              selectedCount={selectedSchedules.size}
              groupByDate={groupByDate}
              isDeleting={isDeleting}
              onOpenWhatsApp={() => setShowWhatsAppModal(true)}
              onBulkDelete={() => setShowBulkDeleteModal(true)}
              onToggleGroupByDate={() => {
                const newValue = !groupByDate
                setGroupByDate(newValue)
                if (newValue) {
                  const grouped = groupSchedulesByDate(optimizedSchedules)
                  setExpandedDates(new Set(grouped.map(g => g.date)))
                } else {
                  setExpandedDates(new Set())
                }
              }}
            />
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
              <div className="schedules-table-container">
                {groupByDate ? (
                  groupSchedulesByDate(optimizedSchedules).map((dateGroup) => {
                    const isExpanded = expandedDates.has(dateGroup.date)
                    return (
                      <div key={dateGroup.date} className="date-group-container">
                        <div className="date-group-header" onClick={() => toggleDateGroup(dateGroup.date)}>
                          <div className="date-group-title">
                            <i className={`fa-solid fa-chevron-${isExpanded ? 'down' : 'right'}`}></i>
                            <span className="date-group-date">{dateGroup.dateFormatted}</span>
                            <span className="date-group-count">
                              {dateGroup.schedules.length} {dateGroup.schedules.length === 1 ? 'escala' : 'escalas'}
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
                                    ref={(input) => { if (input) input.indeterminate = someSelected && !allSelected }}
                                    onChange={handleSelectAll}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </th>
                                <th>Grupos / Funções</th>
                                <th>Descrição</th>
                                <th>Participantes</th>
                                <th style={{ width: '60px' }}>Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dateGroup.schedules.map((schedule) => (
                                <ScheduleTableRow
                                  key={schedule.id}
                                  schedule={schedule}
                                  isSelected={selectedSchedules.has(schedule.id)}
                                  hasNotification={scheduleNotifications.has(schedule.id) || !!(schedule.notifications && schedule.notifications.rulesCount > 0)}
                                  isDeleting={isDeleting}
                                  onSelect={handleSelectSchedule}
                                  onClick={handleTableRowClick}
                                  onDelete={handleDeleteClick}
                                  renderGroupsOrRoles={renderGroupsOrRoles}
                                />
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <table className="schedules-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(input) => { if (input) input.indeterminate = someSelected && !allSelected }}
                            onChange={handleSelectAll}
                            onClick={(e) => e.stopPropagation()}
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
                      {optimizedSchedules.map((schedule) => (
                        <ScheduleTableRow
                          key={schedule.id}
                          schedule={schedule}
                          isSelected={selectedSchedules.has(schedule.id)}
                          hasNotification={scheduleNotifications.has(schedule.id) || !!(schedule.notifications && schedule.notifications.rulesCount > 0)}
                          isDeleting={isDeleting}
                          showDate
                          onSelect={handleSelectSchedule}
                          onClick={handleTableRowClick}
                          onDelete={handleDeleteClick}
                          formatDateRange={formatDateRange}
                          renderGroupsOrRoles={renderGroupsOrRoles}
                        />
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <SchedulePagination
                currentPage={optimizedSchedulesPage}
                totalPages={optimizedSchedulesTotalPages}
                loading={optimizedSchedulesLoading}
                onPageChange={setOptimizedSchedulesPage}
              />
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Remover Escala"
        message="Tem certeza que deseja remover esta escala? Esta ação não pode ser desfeita."
        confirmText="Remover"
        cancelText="Cancelar"
        type="danger"
        onConfirm={confirmDeleteSchedule}
        onCancel={() => { setShowDeleteModal(false); setScheduleToDelete(null) }}
      />

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
    </div>
  )
}
