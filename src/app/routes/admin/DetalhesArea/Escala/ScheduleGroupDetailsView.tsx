import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useToast } from '../../../../../components/ui/Toast/ToastProvider'
import { scheduleGenerationService } from '../../../../../services/basic/scheduleGenerationService'
import type { ScheduleGroupDto, ScheduleGroupConfiguration } from './EscalaTabPanel'
import './ScheduleGroupDetailsView.css'

interface ScheduleGroupDetailsViewProps {
  groupId: string
  onBack: () => void
  onViewSchedules: () => void
}

export default function ScheduleGroupDetailsView({ groupId, onBack, onViewSchedules }: ScheduleGroupDetailsViewProps) {
  const { id: scheduledAreaId } = useParams<{ id: string }>()
  const toast = useToast()
  const [group, setGroup] = useState<ScheduleGroupDto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (scheduledAreaId) {
      loadGroupDetails()
    }
  }, [groupId, scheduledAreaId])

  const loadGroupDetails = async () => {
    if (!scheduledAreaId) return
    
    setLoading(true)
    try {
      const generation = await scheduleGenerationService.getGenerationById(scheduledAreaId, groupId)
      // Converter ScheduleGenerationResponseDto para ScheduleGroupDto para compatibilidade
      const convertedGroup: ScheduleGroupDto = {
        id: generation.id,
        name: `Geração ${generation.generationType} - ${generation.periodType}`,
        description: `Período: ${generation.periodStartDate} a ${generation.periodEndDate}`,
        scheduledAreaId: generation.scheduledAreaId,
        schedulesCount: generation.totalSchedulesGenerated,
        configuration: generation.configuration as ScheduleGroupConfiguration,
        createdAt: generation.createdAt,
        updatedAt: generation.createdAt,
      }
      setGroup(convertedGroup)
    } catch (error: any) {
      toast.showError('Erro ao carregar detalhes do grupo: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getWeekdayName = (day: number) => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
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

  const getDistributionOrderLabel = (order?: string) => {
    switch (order) {
      case 'sequential':
        return 'Sequencial'
      case 'random':
        return 'Aleatória'
      case 'balanced':
        return 'Balanceada'
      default:
        return 'Não definido'
    }
  }

  const getParticipantSelectionLabel = (selection?: string) => {
    switch (selection) {
      case 'all':
        return 'Todos'
      case 'all_with_exclusions':
        return 'Todos (com exclusões)'
      case 'by_group':
        return 'Por Grupo'
      case 'individual':
        return 'Individual'
      default:
        return 'Não definido'
    }
  }

  if (loading) {
    return (
      <div className="schedule-group-details-container">
        <div className="schedule-group-details-header">
          <button type="button" className="btn-secondary" onClick={onBack}>
            <i className="fa-solid fa-arrow-left"></i> Voltar
          </button>
          <h3 className="schedule-group-details-title">Configuração do Grupo</h3>
        </div>
        <div className="schedule-group-details-body">
          <div className="loading-container">
            <i className="fa-solid fa-spinner fa-spin"></i>
            <p>Carregando configuração...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!group) {
    return null
  }

  const config = group.configuration

  return (
    <div className="schedule-group-details-container">
      <div className="schedule-group-details-header">
        <button type="button" className="btn-secondary" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i> Voltar
        </button>
        <div className="header-content">
          <h3 className="schedule-group-details-title">{group.name}</h3>
          {group.description && (
            <p className="schedule-group-description">{group.description}</p>
          )}
        </div>
        <button type="button" className="btn-primary" onClick={onViewSchedules}>
          <i className="fa-solid fa-calendar-check"></i> Ver Escalas
        </button>
      </div>

      <div className="schedule-group-details-body">
        <div className="config-section">
          <h4 className="config-section-title">
            <i className="fa-solid fa-calendar"></i> Período
          </h4>
          <div className="config-grid">
            <div className="config-item">
              <span className="config-label">Data de Início:</span>
              <span className="config-value">{formatDate(config.periodStartDate)}</span>
            </div>
            <div className="config-item">
              <span className="config-label">Data de Fim:</span>
              <span className="config-value">{formatDate(config.periodEndDate)}</span>
            </div>
            <div className="config-item">
              <span className="config-label">Tipo de Período:</span>
              <span className="config-value">{getPeriodTypeLabel(config.periodType)}</span>
            </div>
          </div>
        </div>

        {config.weekdays && config.weekdays.length > 0 && (
          <div className="config-section">
            <h4 className="config-section-title">
              <i className="fa-solid fa-calendar-week"></i> Dias da Semana
            </h4>
            <div className="weekdays-list">
              {config.weekdays.map((day) => (
                <span key={day} className="weekday-badge">
                  {getWeekdayName(day)}
                </span>
              ))}
            </div>
          </div>
        )}

        {(config.startTime || config.endTime) && (
          <div className="config-section">
            <h4 className="config-section-title">
              <i className="fa-solid fa-clock"></i> Horários
            </h4>
            <div className="config-grid">
              {config.startTime && (
                <div className="config-item">
                  <span className="config-label">Horário de Início:</span>
                  <span className="config-value">{config.startTime}</span>
                </div>
              )}
              {config.endTime && (
                <div className="config-item">
                  <span className="config-label">Horário de Fim:</span>
                  <span className="config-value">{config.endTime}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {config.selectedGroupIds && config.selectedGroupIds.length > 0 && (
          <div className="config-section">
            <h4 className="config-section-title">
              <i className="fa-solid fa-users"></i> Grupos Selecionados
            </h4>
            <div className="selected-items-list">
              {config.selectedGroupNames?.map((name, index) => (
                <div key={config.selectedGroupIds![index]} className="selected-item">
                  <i className="fa-solid fa-users"></i>
                  <span>{name}</span>
                </div>
              )) || config.selectedGroupIds.map((id) => (
                <div key={id} className="selected-item">
                  <i className="fa-solid fa-users"></i>
                  <span>{id}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {config.selectedTeamId && (
          <div className="config-section">
            <h4 className="config-section-title">
              <i className="fa-solid fa-user-group"></i> Equipe Selecionada
            </h4>
            <div className="selected-items-list">
              <div className="selected-item">
                <i className="fa-solid fa-user-group"></i>
                <span>{config.selectedTeamName || config.selectedTeamId}</span>
              </div>
            </div>
          </div>
        )}

        <div className="config-section">
          <h4 className="config-section-title">
            <i className="fa-solid fa-cog"></i> Regras e Configurações
          </h4>
          <div className="rules-grid">
            <div className="rule-item">
              <i className="fa-solid fa-check-circle"></i>
              <span className="rule-label">Considerar Ausências:</span>
              <span className={`rule-value ${config.considerAbsences ? 'enabled' : 'disabled'}`}>
                {config.considerAbsences ? 'Sim' : 'Não'}
              </span>
            </div>

            {config.requireResponsibilities !== undefined && (
              <div className="rule-item">
                <i className="fa-solid fa-check-circle"></i>
                <span className="rule-label">Exigir Responsabilidades:</span>
                <span className={`rule-value ${config.requireResponsibilities ? 'enabled' : 'disabled'}`}>
                  {config.requireResponsibilities ? 'Sim' : 'Não'}
                </span>
              </div>
            )}

            {config.distributionOrder && (
              <div className="rule-item">
                <i className="fa-solid fa-sort"></i>
                <span className="rule-label">Ordem de Distribuição:</span>
                <span className="rule-value">{getDistributionOrderLabel(config.distributionOrder)}</span>
              </div>
            )}

            {config.groupsPerSchedule && (
              <div className="rule-item">
                <i className="fa-solid fa-hashtag"></i>
                <span className="rule-label">Grupos por Escala:</span>
                <span className="rule-value">{config.groupsPerSchedule}</span>
              </div>
            )}

            {config.participantSelection && (
              <div className="rule-item">
                <i className="fa-solid fa-user-check"></i>
                <span className="rule-label">Seleção de Participantes:</span>
                <span className="rule-value">{getParticipantSelectionLabel(config.participantSelection)}</span>
              </div>
            )}
          </div>
        </div>

        {(config.excludedDates && config.excludedDates.length > 0) && (
          <div className="config-section">
            <h4 className="config-section-title">
              <i className="fa-solid fa-calendar-xmark"></i> Datas Excluídas
            </h4>
            <div className="dates-list">
              {config.excludedDates.map((date) => (
                <span key={date} className="date-badge excluded">
                  {formatDate(date)}
                </span>
              ))}
            </div>
          </div>
        )}

        {(config.includedDates && config.includedDates.length > 0) && (
          <div className="config-section">
            <h4 className="config-section-title">
              <i className="fa-solid fa-calendar-check"></i> Datas Incluídas
            </h4>
            <div className="dates-list">
              {config.includedDates.map((date) => (
                <span key={date} className="date-badge included">
                  {formatDate(date)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

