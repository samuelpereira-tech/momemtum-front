import React from 'react'
import { type ScheduleOptimizedResponseDto } from '../../../../../../services/basic/scheduleService'
import { ParticipantAvatars } from './ParticipantAvatars'

interface ScheduleTableRowProps {
    schedule: ScheduleOptimizedResponseDto
    isSelected: boolean
    hasNotification: boolean
    isDeleting: boolean
    showDate?: boolean
    onSelect: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void
    onClick: (schedule: ScheduleOptimizedResponseDto, e?: React.MouseEvent) => void
    onDelete: (id: string, e: React.MouseEvent) => void
    formatDateRange?: (start: string, end: string) => string
    renderGroupsOrRoles: (schedule: ScheduleOptimizedResponseDto) => React.ReactNode
}

export function ScheduleTableRow({
    schedule,
    isSelected,
    hasNotification,
    isDeleting,
    showDate = false,
    onSelect,
    onClick,
    onDelete,
    formatDateRange,
    renderGroupsOrRoles
}: ScheduleTableRowProps) {
    return (
        <tr
            className={`schedule-table-row ${isSelected ? 'row-selected' : ''}`}
            onClick={(e) => onClick(schedule, e)}
        >
            <td onClick={(e) => e.stopPropagation()}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onSelect(schedule.id, e)}
                    onClick={(e) => e.stopPropagation()}
                />
            </td>
            {showDate && (
                <td
                    className="schedule-table-date"
                    onClick={(e) => {
                        e.stopPropagation()
                        onClick(schedule, e)
                    }}
                >
                    {formatDateRange ? formatDateRange(schedule.startDatetime, schedule.endDatetime) : schedule.startDatetime}
                </td>
            )}
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
                <ParticipantAvatars participants={schedule.people || schedule.participants || []} />
            </td>
            <td onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    className="btn-action btn-delete"
                    onClick={(e) => onDelete(schedule.id, e)}
                    title="Remover escala"
                    disabled={isDeleting}
                >
                    <i className="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    )
}
