import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useToast } from '../../../../../components/ui/Toast/ToastProvider'
import { scheduleGenerationService } from '../../../../../services/basic/scheduleGenerationService'
import { groupService, type GroupResponseDto } from '../../../../../services/basic/groupService'
import { addCacheBusting } from '../../../../../utils/fileUtils'
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
      // Também verificar se há um campo 'groups' separado com os objetos completos
      if (config.groupConfig.groups && Array.isArray(config.groupConfig.groups)) {
        // Campo 'groups' com objetos completos
        mapped.selectedGroups = config.groupConfig.groups.map((g: any) => ({
          id: g.id || g,
          name: g.name || g.id || g,
          imageUrl: g.imageUrl || g.image || null,
        }))
          mapped.selectedGroupIds = mapped.selectedGroups?.map(g => g.id) || []
          mapped.selectedGroupNames = mapped.selectedGroups?.map(g => g.name) || []
      } else if (config.groupConfig.groupIds && Array.isArray(config.groupConfig.groupIds)) {
        const firstItem = config.groupConfig.groupIds[0]
        if (firstItem && typeof firstItem === 'object' && firstItem.id) {
          // É um array de objetos com id, name, imageUrl
          mapped.selectedGroups = config.groupConfig.groupIds.map((g: any) => ({
            id: g.id,
            name: g.name || g.id,
            imageUrl: g.imageUrl || g.image || null,
          }))
          mapped.selectedGroupIds = mapped.selectedGroups?.map(g => g.id) || []
          mapped.selectedGroupNames = mapped.selectedGroups?.map(g => g.name) || []
        } else {
          // É um array de strings (IDs) - tentar buscar grupos completos em outro lugar
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
      // Também verificar se há um campo 'selectedGroups' separado com os objetos completos
      if (config.teamConfig.selectedGroups && Array.isArray(config.teamConfig.selectedGroups)) {
        // Campo 'selectedGroups' com objetos completos
        mapped.selectedGroups = config.teamConfig.selectedGroups.map((g: any) => ({
          id: g.id || g,
          name: g.name || g.id || g,
          imageUrl: g.imageUrl || g.image || null,
        }))
          mapped.selectedGroupIds = mapped.selectedGroups?.map(g => g.id) || []
          mapped.selectedGroupNames = mapped.selectedGroups?.map(g => g.name) || []
      } else if (config.teamConfig.selectedGroupIds && Array.isArray(config.teamConfig.selectedGroupIds)) {
        const firstItem = config.teamConfig.selectedGroupIds[0]
        if (firstItem && typeof firstItem === 'object' && firstItem.id) {
          // É um array de objetos com id, name, imageUrl
          mapped.selectedGroups = config.teamConfig.selectedGroupIds.map((g: any) => ({
            id: g.id,
            name: g.name || g.id,
            imageUrl: g.imageUrl || g.image || null,
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

  // Função para buscar dados completos dos grupos quando apenas IDs estão disponíveis
  const enrichGroupsWithDetails = async (groupIds: string[]): Promise<Array<{ id: string; name: string; imageUrl: string | null }>> => {
    if (!scheduledAreaId || !groupIds || groupIds.length === 0) return []
    
    try {
      const groupsPromises = groupIds.map(id => 
        groupService.getGroupById(scheduledAreaId, id).catch(() => null)
      )
      const groups = await Promise.all(groupsPromises)
      
      return groups
        .filter((g): g is GroupResponseDto => g !== null)
        .map(g => ({
          id: g.id,
          name: g.name,
          imageUrl: null, // GroupResponseDto não tem imageUrl, mas mantemos para compatibilidade
        }))
    } catch (error) {
      console.error('Erro ao buscar detalhes dos grupos:', error)
      return groupIds.map(id => ({ id, name: id, imageUrl: null }))
    }
  }

  const loadGroupDetails = async () => {
    if (!scheduledAreaId) return
    
    setLoading(true)
    try {
      const generation = await scheduleGenerationService.getGenerationById(scheduledAreaId, groupId)
      
      // Converter ScheduleGenerationResponseDto para ScheduleGroupDto para compatibilidade
      const mappedConfiguration = mapConfiguration(
        generation.configuration,
        generation.generationType,
        generation.periodType,
        generation.periodStartDate,
        generation.periodEndDate
      )
      
      // Se temos apenas IDs e não temos grupos completos, buscar os detalhes
      if (mappedConfiguration.selectedGroupIds && 
          mappedConfiguration.selectedGroupIds.length > 0 && 
          (!mappedConfiguration.selectedGroups || mappedConfiguration.selectedGroups.length === 0)) {
        const enrichedGroups = await enrichGroupsWithDetails(mappedConfiguration.selectedGroupIds)
        if (enrichedGroups.length > 0) {
          mappedConfiguration.selectedGroups = enrichedGroups
          mappedConfiguration.selectedGroupNames = enrichedGroups.map(g => g.name)
        }
      }
      
      const convertedGroup: ScheduleGroupDto = {
        id: generation.id,
        name: `Geração ${generation.generationType} - ${generation.periodType}`,
        description: `Período: ${generation.periodStartDate} a ${generation.periodEndDate}`,
        scheduledAreaId: generation.scheduledAreaId,
        schedulesCount: generation.totalSchedulesGenerated,
        configuration: mappedConfiguration,
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
              {config.selectedGroups && config.selectedGroups.length > 0 ? (
                // Exibir grupos com nome e imagem
                config.selectedGroups.map((group) => (
                  <div key={group.id} className="selected-item">
                    {group.imageUrl ? (
                      <img
                        src={addCacheBusting(group.imageUrl)}
                        alt={group.name}
                        className="selected-item-image"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="selected-item-placeholder">
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span>{group.name}</span>
                  </div>
                ))
              ) : config.selectedGroupNames && config.selectedGroupNames.length > 0 ? (
                // Exibir apenas nomes se disponíveis
                config.selectedGroupNames.map((name, index) => (
                  <div key={config.selectedGroupIds![index]} className="selected-item">
                    <div className="selected-item-placeholder">
                      <i className="fa-solid fa-users"></i>
                    </div>
                    <span>{name}</span>
                  </div>
                ))
              ) : (
                // Fallback: exibir apenas IDs
                config.selectedGroupIds.map((id) => (
                  <div key={id} className="selected-item">
                    <div className="selected-item-placeholder">
                      <i className="fa-solid fa-users"></i>
                    </div>
                    <span>{id}</span>
                  </div>
                ))
              )}
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

