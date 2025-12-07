import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import '../shared/TabPanel.css'
import './GeracaoAutomaticaTabPanel.css'
import type { GenerationConfiguration, GenerationPreview, GenerationType, PeriodType, DistributionOrder, ParticipantSelection } from './types'
import { generatePreview, confirmGenerationMock } from './mockServices'
import { useToast } from '../../../../../components/ui/Toast/ToastProvider'
import ConfirmModal from '../../../../../components/ui/ConfirmModal/ConfirmModal'
import { groupService, type GroupResponseDto } from '../../../../../services/basic/groupService'
import { teamService, type TeamResponseDto } from '../../../../../services/basic/teamService'
import { personAreaService, type PersonAreaResponseDto } from '../../../../../services/basic/personAreaService'
import { groupMemberService } from '../../../../../services/basic/groupMemberService'
import { scheduledAbsenceService, type ScheduledAbsenceResponseDto } from '../../../../../services/basic/scheduledAbsenceService'
import { responsibilityService, type ResponsibilityResponseDto } from '../../../../../services/basic/responsibilityService'
import { addCacheBusting } from '../../../../../utils/fileUtils'

type Step = 1 | 2 | 3 | 4 | 5

export default function GeracaoAutomaticaTabPanel() {
  const { id: scheduledAreaId } = useParams<{ id: string }>()
  const toast = useToast()
  
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [preview, setPreview] = useState<GenerationPreview | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  
  // Estados para dados da API
  const [groups, setGroups] = useState<GroupResponseDto[]>([])
  const [teams, setTeams] = useState<TeamResponseDto[]>([])
  const [persons, setPersons] = useState<PersonAreaResponseDto[]>([])
  const [absences, setAbsences] = useState<ScheduledAbsenceResponseDto[]>([])
  const [responsibilities, setResponsibilities] = useState<ResponsibilityResponseDto[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  
  const [config, setConfig] = useState<GenerationConfiguration>({
    scheduledAreaId: scheduledAreaId || '',
    generationType: 'group',
    periodType: 'daily',
    periodStartDate: new Date().toISOString().split('T')[0],
    periodEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    groupConfig: {
      groupIds: [],
      groupsPerSchedule: 1,
      distributionOrder: 'balanced',
      considerAbsences: true,
    },
    peopleConfig: {
      considerAbsences: true,
    },
    teamConfig: {
      teamId: '',
      participantSelection: 'all',
      considerAbsences: true,
      requireResponsibilities: false,
    },
    periodConfig: {
      baseDateTime: new Date().toISOString(),
      duration: 1,
      startTime: '08:00',
      endTime: '17:00',
      weekdays: [0, 1, 2, 3, 4, 5, 6], // Todos os dias da semana por padrão
    },
  })
  
  // Carregar dados da API
  const loadData = useCallback(async () => {
    if (!scheduledAreaId) return
    
    setIsLoadingData(true)
    try {
      // Carregar grupos
      const groupsData = await loadAllGroups(scheduledAreaId)
      setGroups(groupsData)
      
      // Carregar equipes
      const teamsData = await loadAllTeams(scheduledAreaId)
      setTeams(teamsData)
      
      // Carregar pessoas da área
      const personsData = await loadAllPersonsInArea(scheduledAreaId)
      setPersons(personsData)
      
      // Carregar ausências (todas, serão filtradas depois)
      const absencesData = await loadAllAbsences()
      setAbsences(absencesData)
      
      // Carregar responsabilidades
      const responsibilitiesData = await loadAllResponsibilities(scheduledAreaId)
      setResponsibilities(responsibilitiesData)
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      toast.showError('Erro ao carregar dados: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setIsLoadingData(false)
    }
  }, [scheduledAreaId, toast])
  
  useEffect(() => {
    if (scheduledAreaId) {
      setConfig(prev => ({ ...prev, scheduledAreaId }))
      loadData()
    }
  }, [scheduledAreaId, loadData])
  
  // Funções auxiliares para carregar todos os dados paginados
  const loadAllGroups = async (areaId: string): Promise<GroupResponseDto[]> => {
    let allGroups: GroupResponseDto[] = []
    let page = 1
    let hasMore = true
    const limit = 100
    
    while (hasMore) {
      const response = await groupService.getGroupsInArea(areaId, { page, limit })
      allGroups = [...allGroups, ...response.data]
      
      if (page >= response.meta.totalPages || response.data.length === 0) {
        hasMore = false
      } else {
        page++
      }
    }
    
    return allGroups
  }
  
  const loadAllTeams = async (areaId: string): Promise<TeamResponseDto[]> => {
    let allTeams: TeamResponseDto[] = []
    let page = 1
    let hasMore = true
    const limit = 100
    
    while (hasMore) {
      const response = await teamService.getTeamsInArea(areaId, { page, limit })
      allTeams = [...allTeams, ...response.data]
      
      if (page >= response.meta.totalPages || response.data.length === 0) {
        hasMore = false
      } else {
        page++
      }
    }
    
    return allTeams
  }
  
  const loadAllPersonsInArea = async (areaId: string): Promise<PersonAreaResponseDto[]> => {
    let allPersons: PersonAreaResponseDto[] = []
    let page = 1
    let hasMore = true
    const limit = 100
    
    while (hasMore) {
      const response = await personAreaService.getPersonsInArea(areaId, { page, limit })
      allPersons = [...allPersons, ...response.data]
      
      if (page >= response.meta.totalPages || response.data.length === 0) {
        hasMore = false
      } else {
        page++
      }
    }
    
    return allPersons
  }
  
  const loadAllAbsences = async (): Promise<ScheduledAbsenceResponseDto[]> => {
    let allAbsences: ScheduledAbsenceResponseDto[] = []
    let page = 1
    let hasMore = true
    const limit = 100
    
    while (hasMore) {
      const response = await scheduledAbsenceService.getAllScheduledAbsences({ page, limit })
      allAbsences = [...allAbsences, ...response.data]
      
      if (page >= response.totalPages || response.data.length === 0) {
        hasMore = false
      } else {
        page++
      }
    }
    
    return allAbsences
  }
  
  const loadAllResponsibilities = async (areaId: string): Promise<ResponsibilityResponseDto[]> => {
    let allResponsibilities: ResponsibilityResponseDto[] = []
    let page = 1
    let hasMore = true
    const limit = 100
    
    while (hasMore) {
      const response = await responsibilityService.getAllResponsibilities({
        scheduledAreaId: areaId,
        page,
        limit,
      })
      allResponsibilities = [...allResponsibilities, ...response.data]
      
      if (page >= response.meta.totalPages || response.data.length === 0) {
        hasMore = false
      } else {
        page++
      }
    }
    
    return allResponsibilities
  }
  
  // Função auxiliar para obter imagem da responsabilidade
  const getResponsibilityImage = (responsibilityId: string): string | null => {
    const responsibility = responsibilities.find(r => r.id === responsibilityId)
    return responsibility?.imageUrl || null
  }
  
  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as Step)
    }
  }
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step)
    }
  }
  
  const handleGeneratePreview = async () => {
    setIsGeneratingPreview(true)
    try {
      // Carregar membros dos grupos se necessário
      let groupMembers: any[] = []
      
      // Carregar membros quando o tipo de geração é por grupo
      const groupIdsToLoad: string[] = []
      
      if (config.generationType === 'group' && config.groupConfig?.groupIds) {
        groupIdsToLoad.push(...config.groupConfig.groupIds)
      }
      
      // Carregar membros quando a seleção de participantes é por grupo
      if (config.teamConfig?.participantSelection === 'by_group' && config.teamConfig.selectedGroupIds) {
        for (const groupId of config.teamConfig.selectedGroupIds) {
          if (!groupIdsToLoad.includes(groupId)) {
            groupIdsToLoad.push(groupId)
          }
        }
      }
      
      // Carregar membros de todos os grupos necessários
      for (const groupId of groupIdsToLoad) {
        try {
          let members: any[] = []
          let page = 1
          let hasMore = true
          const limit = 100
          
          while (hasMore && scheduledAreaId) {
            const response = await groupMemberService.getMembersInGroup(scheduledAreaId, groupId, { page, limit })
            members = [...members, ...response.data]
            
            if (page >= response.meta.totalPages || response.data.length === 0) {
              hasMore = false
            } else {
              page++
            }
          }
          
          groupMembers = [...groupMembers, ...members]
        } catch (error) {
          console.error(`Erro ao carregar membros do grupo ${groupId}:`, error)
        }
      }
      
      const previewData = await generatePreview(config, groups, teams, persons, absences, groupMembers)
      setPreview(previewData)
      setCurrentStep(5)
    } catch (error: any) {
      toast.showError('Erro ao gerar preview: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setIsGeneratingPreview(false)
    }
  }
  
  const handleConfirmGeneration = async () => {
    setIsConfirming(true)
    setShowConfirmModal(false)
    try {
      // Carregar membros dos grupos se necessário
      let groupMembers: any[] = []
      if (config.teamConfig?.participantSelection === 'by_group' && config.teamConfig.selectedGroupIds) {
        for (const groupId of config.teamConfig.selectedGroupIds) {
          try {
            let members: any[] = []
            let page = 1
            let hasMore = true
            const limit = 100
            
            while (hasMore && scheduledAreaId) {
              const response = await groupMemberService.getMembersInGroup(scheduledAreaId, groupId, { page, limit })
              members = [...members, ...response.data]
              
              if (page >= response.meta.totalPages || response.data.length === 0) {
                hasMore = false
              } else {
                page++
              }
            }
            
            groupMembers = [...groupMembers, ...members]
          } catch (error) {
            console.error(`Erro ao carregar membros do grupo ${groupId}:`, error)
          }
        }
      }
      
      const result = await confirmGenerationMock(config, groups, teams, persons, absences, groupMembers)
      toast.showSuccess(`Geração concluída! ${result.schedulesCreated} escalas criadas.`)
      // Resetar formulário
      setCurrentStep(1)
      setPreview(null)
      setConfig({
        scheduledAreaId: scheduledAreaId || '',
        generationType: 'group',
        periodType: 'daily',
        periodStartDate: new Date().toISOString().split('T')[0],
        periodEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        groupConfig: {
          groupIds: [],
          groupsPerSchedule: 1,
          distributionOrder: 'balanced',
          considerAbsences: true,
        },
        peopleConfig: {
          considerAbsences: true,
        },
        teamConfig: {
          teamId: '',
          participantSelection: 'all',
          considerAbsences: true,
          requireResponsibilities: false,
        },
        periodConfig: {
          baseDateTime: new Date().toISOString(),
          duration: 1,
          startTime: '08:00',
          endTime: '17:00',
          weekdays: [0, 1, 2, 3, 4, 5, 6], // Todos os dias da semana por padrão
        },
      })
    } catch (error: any) {
      toast.showError('Erro ao confirmar geração: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setIsConfirming(false)
    }
  }
  
  const updateConfig = (updates: Partial<GenerationConfiguration>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }
  
  if (isLoadingData) {
    return (
      <div className="tab-panel">
        <div className="tab-panel-header">
          <h3 className="tab-panel-title">
            <i className="fa-solid fa-robot"></i> Geração de Escala Automática
          </h3>
        </div>
        <div className="tab-panel-body">
          <div className="form-card" style={{ textAlign: 'center', padding: '40px' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '20px' }}></i>
            <p>Carregando dados...</p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="tab-panel">
      <div className="tab-panel-header">
        <h3 className="tab-panel-title">
          <i className="fa-solid fa-robot"></i> Geração de Escala Automática
        </h3>
      </div>
      <div className="tab-panel-body">
        <div className="generation-wizard">
          {/* Stepper */}
          <div className="wizard-stepper">
            <div className={`stepper-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
              <div className="stepper-step-number">1</div>
              <div className="stepper-step-label">Tipo de Geração</div>
            </div>
            <div className="stepper-line"></div>
            <div className={`stepper-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
              <div className="stepper-step-number">2</div>
              <div className="stepper-step-label">Configurações</div>
            </div>
            <div className="stepper-line"></div>
            <div className={`stepper-step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
              <div className="stepper-step-number">3</div>
              <div className="stepper-step-label">Participantes</div>
            </div>
            <div className="stepper-line"></div>
            <div className={`stepper-step ${currentStep >= 4 ? 'active' : ''} ${currentStep > 4 ? 'completed' : ''}`}>
              <div className="stepper-step-number">4</div>
              <div className="stepper-step-label">Período</div>
            </div>
            <div className="stepper-line"></div>
            <div className={`stepper-step ${currentStep >= 5 ? 'active' : ''}`}>
              <div className="stepper-step-number">5</div>
              <div className="stepper-step-label">Preview</div>
            </div>
          </div>
          
          {/* Conteúdo do Step */}
          <div className="wizard-content">
            {currentStep === 1 && (
              <Step1TypeSelection
                config={config}
                onUpdate={(updates) => {
                  updateConfig(updates)
                  handleNext()
                }}
              />
            )}
            
            {currentStep === 2 && (
              <Step2Configurations
                config={config}
                groups={groups}
                teams={teams}
                getResponsibilityImage={getResponsibilityImage}
                onUpdate={updateConfig}
                onBack={handleBack}
                onNext={handleNext}
                isLoading={isLoadingData}
              />
            )}
            
            {currentStep === 3 && (
              <Step3Participants
                config={config}
                groups={groups}
                persons={persons}
                onUpdate={updateConfig}
                onBack={handleBack}
                onNext={handleNext}
                isLoading={isLoadingData}
              />
            )}
            
            {currentStep === 4 && (
              <Step4Period
                config={config}
                onUpdate={updateConfig}
                onBack={handleBack}
                onGeneratePreview={handleGeneratePreview}
                isGenerating={isGeneratingPreview}
              />
            )}
            
            {currentStep === 5 && preview && (
              <Step5Preview
                preview={preview}
                persons={persons}
                teams={teams}
                responsibilities={responsibilities}
                getResponsibilityImage={getResponsibilityImage}
                onBack={handleBack}
                onConfirm={() => setShowConfirmModal(true)}
                isConfirming={isConfirming}
              />
            )}
          </div>
        </div>
      </div>
      
      <ConfirmModal
        isOpen={showConfirmModal}
        title="Confirmar Geração de Escalas"
        message={`Deseja confirmar a geração de ${preview?.summary.totalSchedules || 0} escalas? Esta ação não pode ser desfeita.`}
        confirmText="Confirmar Geração"
        cancelText="Cancelar"
        type="info"
        onConfirm={handleConfirmGeneration}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  )
}

// Step 1: Tipo de Geração
function Step1TypeSelection({ config, onUpdate }: { config: GenerationConfiguration; onUpdate: (updates: Partial<GenerationConfiguration>) => void }) {
  const handleTypeSelect = (type: GenerationType) => {
    const updates: Partial<GenerationConfiguration> = { generationType: type }
    
    // Se selecionar "Por Equipe (Com Restrição)", marcar "Validar responsabilidades obrigatoriamente" por padrão
    if (type === 'team_with_restriction') {
      updates.teamConfig = {
        ...config.teamConfig,
        requireResponsibilities: true,
      }
    }
    
    onUpdate(updates)
  }
  
  return (
    <div className="form-card">
      <h4 className="form-section-title">
        <i className="fa-solid fa-list"></i> Selecione o Tipo de Geração
      </h4>
      <p className="form-section-description">
        Escolha como as escalas serão geradas: por grupos, por pessoas, por equipe sem restrição de papéis, ou por equipe com restrição de papéis.
      </p>
      
      <div className="type-selection-grid">
        <div
          className={`type-option ${config.generationType === 'group' ? 'selected' : ''}`}
          onClick={() => handleTypeSelect('group')}
        >
          <div className="type-option-icon">
            <i className="fa-solid fa-users"></i>
          </div>
          <h5 className="type-option-title">Por Grupos</h5>
          <p className="type-option-description">
            Gera escalas atribuindo grupos completos a cada período. Ideal para escalas onde grupos inteiros trabalham juntos.
          </p>
        </div>
        
        <div
          className={`type-option ${config.generationType === 'people' ? 'selected' : ''}`}
          onClick={() => handleTypeSelect('people')}
        >
          <div className="type-option-icon">
            <i className="fa-solid fa-user-friends"></i>
          </div>
          <h5 className="type-option-title">Por Pessoas</h5>
          <p className="type-option-description">
            Gera escalas com todas as pessoas da área selecionadas por padrão. Você pode remover pessoas específicas que não devem participar.
          </p>
        </div>
        
        <div
          className={`type-option ${config.generationType === 'team_without_restriction' ? 'selected' : ''}`}
          onClick={() => handleTypeSelect('team_without_restriction')}
        >
          <div className="type-option-icon">
            <i className="fa-solid fa-user-group"></i>
          </div>
          <h5 className="type-option-title">Por Equipe (Sem Restrição)</h5>
          <p className="type-option-description">
            Gera escalas por equipe onde qualquer pessoa pode assumir qualquer papel, sem necessidade de responsabilidade específica.
          </p>
        </div>
        
        <div
          className={`type-option ${config.generationType === 'team_with_restriction' ? 'selected' : ''}`}
          onClick={() => handleTypeSelect('team_with_restriction')}
        >
          <div className="type-option-icon">
            <i className="fa-solid fa-user-check"></i>
          </div>
          <h5 className="type-option-title">Por Equipe (Com Restrição)</h5>
          <p className="type-option-description">
            Gera escalas por equipe onde cada pessoa precisa ter a responsabilidade correspondente cadastrada para assumir o papel.
          </p>
        </div>
      </div>
    </div>
  )
}

// Step 2: Configurações
function Step2Configurations({ config, groups, teams, getResponsibilityImage, onUpdate, onBack, onNext, isLoading }: {
  config: GenerationConfiguration
  groups: GroupResponseDto[]
  teams: TeamResponseDto[]
  getResponsibilityImage: (id: string) => string | null
  onUpdate: (updates: Partial<GenerationConfiguration>) => void
  onBack: () => void
  onNext: () => void
  isLoading: boolean
}) {
  if (config.generationType === 'people') {
    return (
      <div className="form-card">
        <h4 className="form-section-title">
          <i className="fa-solid fa-cog"></i> Configurações de Pessoas
        </h4>
        
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={config.peopleConfig?.considerAbsences || false}
              onChange={(e) => onUpdate({
                peopleConfig: {
                  ...config.peopleConfig!,
                  considerAbsences: e.target.checked,
                },
              })}
              aria-label="Considerar ausências ao escalar pessoas"
            />
            <span className="checkbox-custom"></span>
            <span className="checkbox-text">
              Considerar ausências ao escalar pessoas
              <span className="tooltip-trigger" title="Se habilitado, pessoas com ausências agendadas no período da escala não serão incluídas.">
                <i className="fa-solid fa-circle-question"></i>
              </span>
            </span>
          </label>
        </div>
        
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onBack} aria-label="Voltar para etapa anterior">
            <i className="fa-solid fa-arrow-left"></i> Voltar
          </button>
          <button type="button" className="btn-primary" onClick={onNext} aria-label="Avançar para próxima etapa">
            <i className="fa-solid fa-arrow-right"></i> Próximo
          </button>
        </div>
      </div>
    )
  }
  
  if (config.generationType === 'group') {
    return (
      <div className="form-card">
        <h4 className="form-section-title">
          <i className="fa-solid fa-cog"></i> Configurações de Grupos
        </h4>
        
        <div className="form-group">
          <label>
            <i className="fa-solid fa-users"></i> Grupos Participantes
          </label>
          {isLoading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <i className="fa-solid fa-spinner fa-spin"></i> Carregando grupos...
            </div>
          ) : groups.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-light)' }}>
              <i className="fa-solid fa-info-circle"></i> Nenhum grupo cadastrado nesta área
            </div>
          ) : (
            <div className="checkbox-group">
              {groups.map(group => (
                <label key={group.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={config.groupConfig?.groupIds.includes(group.id) || false}
                    onChange={(e) => {
                      const currentIds = config.groupConfig?.groupIds || []
                      const newIds = e.target.checked
                        ? [...currentIds, group.id]
                        : currentIds.filter(id => id !== group.id)
                      onUpdate({
                        groupConfig: {
                          ...config.groupConfig!,
                          groupIds: newIds,
                        },
                      })
                    }}
                  />
                  <span className="checkbox-custom"></span>
                  <span className="checkbox-text">
                    {group.name} ({group.membersCount || 0} membros)
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>
              <i className="fa-solid fa-hashtag"></i> Quantidade de Grupos por Escala
              <span className="tooltip-trigger" title="Define quantos grupos serão atribuídos a cada escala gerada.">
                <i className="fa-solid fa-circle-question"></i>
              </span>
            </label>
            <input
              type="number"
              min="1"
              value={config.groupConfig?.groupsPerSchedule || 1}
              onChange={(e) => onUpdate({
                groupConfig: {
                  ...config.groupConfig!,
                  groupsPerSchedule: parseInt(e.target.value) || 1,
                },
              })}
              aria-label="Quantidade de grupos por escala"
            />
          </div>
          
          <div className="form-group">
            <label>
              <i className="fa-solid fa-sort"></i> Ordem de Distribuição
              <span className="tooltip-trigger" title="Sequencial: ordem fixa | Aleatória: ordem aleatória | Balanceada: distribuição equilibrada evitando repetições">
                <i className="fa-solid fa-circle-question"></i>
              </span>
            </label>
            <select
              value={config.groupConfig?.distributionOrder || 'balanced'}
              onChange={(e) => onUpdate({
                groupConfig: {
                  ...config.groupConfig!,
                  distributionOrder: e.target.value as DistributionOrder,
                },
              })}
              aria-label="Ordem de distribuição dos grupos"
            >
              <option value="sequential">Sequencial</option>
              <option value="random">Aleatória</option>
              <option value="balanced">Balanceada</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={config.groupConfig?.considerAbsences || false}
              onChange={(e) => onUpdate({
                groupConfig: {
                  ...config.groupConfig!,
                  considerAbsences: e.target.checked,
                },
              })}
              aria-label="Considerar ausências ao escalar grupos"
            />
            <span className="checkbox-custom"></span>
            <span className="checkbox-text">
              Considerar ausências ao escalar grupos
              <span className="tooltip-trigger" title="Se habilitado, grupos com membros ausentes no período da escala não serão selecionados.">
                <i className="fa-solid fa-circle-question"></i>
              </span>
            </span>
          </label>
        </div>
        
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onBack} aria-label="Voltar para etapa anterior">
            <i className="fa-solid fa-arrow-left"></i> Voltar
          </button>
          <button type="button" className="btn-primary" onClick={onNext} disabled={!config.groupConfig?.groupIds.length} aria-label="Avançar para próxima etapa">
            <i className="fa-solid fa-arrow-right"></i> Próximo
          </button>
        </div>
      </div>
    )
  }
  
  // Configuração para equipes
  const selectedTeam = teams.find(t => t.id === config.teamConfig?.teamId)
  const sortedRoles = selectedTeam?.roles ? [...selectedTeam.roles].sort((a, b) => a.priority - b.priority) : []
  const totalPeopleNeeded = sortedRoles.reduce((sum, role) => sum + role.quantity, 0)
  
  return (
    <div className="form-card">
      <h4 className="form-section-title">
        <i className="fa-solid fa-cog"></i> Configurações de Equipe
      </h4>
      
      <div className="form-group">
        <label>
          <i className="fa-solid fa-user-group"></i> Equipe
        </label>
        {isLoading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <i className="fa-solid fa-spinner fa-spin"></i> Carregando equipes...
          </div>
        ) : (
          <select
            value={config.teamConfig?.teamId || ''}
            onChange={(e) => onUpdate({
              teamConfig: {
                ...config.teamConfig!,
                teamId: e.target.value,
              },
            })}
            disabled={teams.length === 0}
          >
            <option value="">{teams.length === 0 ? 'Nenhuma equipe cadastrada' : 'Selecione uma equipe'}</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        )}
      </div>
      
      {config.teamConfig?.teamId && selectedTeam && (
        <div className="team-details-section">
          <div className="team-header-compact">
            <h5 className="team-title-compact">
              <i className="fa-solid fa-list-check"></i> Papéis da Equipe
            </h5>
            {sortedRoles.length > 0 && (
              <div className="team-summary-compact">
                <span className="summary-badge-compact">
                  <i className="fa-solid fa-users"></i> {totalPeopleNeeded}
                </span>
                <span className="summary-badge-compact">
                  <i className="fa-solid fa-list"></i> {sortedRoles.length}
                </span>
              </div>
            )}
          </div>
          
          {sortedRoles.length === 0 ? (
            <div className="empty-roles-message">
              <i className="fa-solid fa-inbox"></i>
              <p>Nenhum papel cadastrado nesta equipe</p>
            </div>
          ) : (
            <div className="roles-list-compact">
              {sortedRoles.map((role) => {
                const roleImage = getResponsibilityImage(role.responsibilityId)
                return (
                  <div key={role.id} className="role-item-compact">
                    <div className="role-image-container">
                      {roleImage ? (
                        <img
                          src={addCacheBusting(roleImage)}
                          alt={role.responsibilityName}
                          className="role-image"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="role-image-placeholder">
                          <i className="fa-solid fa-briefcase"></i>
                        </div>
                      )}
                      <div className="role-priority-compact">{role.priority}º</div>
                    </div>
                    <div className="role-info-compact">
                      <div className="role-name-compact">{role.responsibilityName}</div>
                      <div className="role-meta-compact">
                        <span className="role-quantity">
                          <i className="fa-solid fa-user-plus"></i> {role.quantity} {role.quantity === 1 ? 'pessoa' : 'pessoas'}
                        </span>
                        {!role.isFree && (
                          <span className="role-fixed-badge">
                            <i className="fa-solid fa-lock"></i> Fixa
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
      
      {config.generationType === 'team_with_restriction' && (
        <div className="form-group" style={{ marginTop: '16px' }}>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={config.teamConfig?.requireResponsibilities || false}
              onChange={(e) => onUpdate({
                teamConfig: {
                  ...config.teamConfig!,
                  requireResponsibilities: e.target.checked,
                },
              })}
            />
            <span className="checkbox-custom"></span>
            <span className="checkbox-text">Validar responsabilidades obrigatoriamente</span>
          </label>
          <small className="form-help">
            Apenas pessoas com a responsabilidade correspondente poderão ser atribuídas ao papel
          </small>
        </div>
      )}
      
      <div className="form-group" style={{ marginTop: '16px' }}>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={config.teamConfig?.considerAbsences || false}
            onChange={(e) => onUpdate({
              teamConfig: {
                ...config.teamConfig!,
                considerAbsences: e.target.checked,
              },
            })}
          />
          <span className="checkbox-custom"></span>
          <span className="checkbox-text">Considerar ausências ao escalar pessoas</span>
        </label>
      </div>
      
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onBack} aria-label="Voltar para etapa anterior">
          <i className="fa-solid fa-arrow-left"></i> Voltar
        </button>
        <button type="button" className="btn-primary" onClick={onNext} disabled={!config.teamConfig?.teamId} aria-label="Avançar para próxima etapa">
          <i className="fa-solid fa-arrow-right"></i> Próximo
        </button>
      </div>
    </div>
  )
}

// Step 3: Participantes
function Step3Participants({ config, groups, persons, onUpdate, onBack, onNext, isLoading }: {
  config: GenerationConfiguration
  groups: GroupResponseDto[]
  persons: PersonAreaResponseDto[]
  onUpdate: (updates: Partial<GenerationConfiguration>) => void
  onBack: () => void
  onNext: () => void
  isLoading: boolean
}) {
  if (config.generationType === 'people') {
    // Para pessoas, todas selecionadas por padrão, pode remover
    return (
      <div className="form-card">
        <h4 className="form-section-title">
          <i className="fa-solid fa-user-check"></i> Seleção de Pessoas
        </h4>
        <p className="form-section-description">
          Todas as pessoas da área estão selecionadas por padrão. Desmarque as pessoas que deseja excluir da geração.
        </p>
        
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ margin: 0 }}>
              <i className="fa-solid fa-users"></i> Pessoas (Todas selecionadas - desmarque para remover)
              <span className="tooltip-trigger" title="Todas as pessoas da área estão selecionadas por padrão. Desmarque as pessoas que deseja excluir da geração.">
                <i className="fa-solid fa-circle-question"></i>
              </span>
            </label>
            {!isLoading && persons.length > 0 && (
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  const allExcluded = persons.map(p => p.personId)
                  const hasExcluded = (config.peopleConfig?.excludedPersonIds?.length || 0) > 0
                  onUpdate({
                    peopleConfig: {
                      ...config.peopleConfig!,
                      excludedPersonIds: hasExcluded ? undefined : allExcluded,
                    },
                  })
                }}
                style={{ fontSize: '0.9rem', padding: '4px 8px' }}
              >
                {(config.peopleConfig?.excludedPersonIds?.length || 0) > 0 ? (
                  <>
                    <i className="fa-solid fa-check-double"></i> Marcar Todos
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-square"></i> Desmarcar Todos
                  </>
                )}
              </button>
            )}
          </div>
          {isLoading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <i className="fa-solid fa-spinner fa-spin"></i> Carregando pessoas...
            </div>
          ) : persons.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-light)' }}>
              <i className="fa-solid fa-info-circle"></i> Nenhuma pessoa cadastrada nesta área
            </div>
          ) : (
            <div className="checkbox-group checkbox-group-with-photos">
              {persons.map(person => {
                const isExcluded = config.peopleConfig?.excludedPersonIds?.includes(person.personId) || false
                return (
                  <label key={person.id} className="checkbox-label checkbox-label-with-photo">
                    <input
                      type="checkbox"
                      checked={!isExcluded}
                      onChange={(e) => {
                        const currentExcluded = config.peopleConfig?.excludedPersonIds || []
                        const newExcluded = e.target.checked
                          ? currentExcluded.filter(id => id !== person.personId)
                          : [...currentExcluded, person.personId]
                        onUpdate({
                          peopleConfig: {
                            ...config.peopleConfig!,
                            excludedPersonIds: newExcluded.length > 0 ? newExcluded : undefined,
                          },
                        })
                      }}
                    />
                    <span className="checkbox-custom"></span>
                    <div className="person-photo-container-small">
                      {person.person?.photoUrl ? (
                        <img
                          src={addCacheBusting(person.person.photoUrl)}
                          alt={person.person?.fullName || person.personId}
                          className="person-photo-small"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="person-photo-placeholder-small">
                          {person.person?.fullName?.charAt(0).toUpperCase() || person.personId.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="checkbox-text-container">
                      <span className="checkbox-text">
                        {person.person?.fullName || person.personId}
                      </span>
                      {person.responsibilities && person.responsibilities.length > 0 && (
                        <span className="checkbox-text-meta">
                          {person.responsibilities.map(r => r.name).join(', ')}
                        </span>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>
        
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onBack} aria-label="Voltar para etapa anterior">
            <i className="fa-solid fa-arrow-left"></i> Voltar
          </button>
          <button type="button" className="btn-primary" onClick={onNext} aria-label="Avançar para próxima etapa">
            <i className="fa-solid fa-arrow-right"></i> Próximo
          </button>
        </div>
      </div>
    )
  }
  
  if (config.generationType === 'group') {
    // Para grupos, permite excluir pessoas específicas
    return (
      <div className="form-card">
        <h4 className="form-section-title">
          <i className="fa-solid fa-user-check"></i> Participantes
        </h4>
        <p className="form-section-description">
          Para geração por grupos, todos os membros dos grupos selecionados participarão automaticamente. Você pode excluir pessoas específicas abaixo.
        </p>
        
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ margin: 0 }}>
              <i className="fa-solid fa-users"></i> Pessoas (Todas incluídas - desmarque para excluir)
              <span className="tooltip-trigger" title="Todas as pessoas dos grupos selecionados estão incluídas por padrão. Desmarque as pessoas que deseja excluir da geração.">
                <i className="fa-solid fa-circle-question"></i>
              </span>
            </label>
            {!isLoading && persons.length > 0 && (
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  const allExcluded = persons.map(p => p.personId)
                  const hasExcluded = (config.groupConfig?.excludedPersonIds?.length || 0) > 0
                  onUpdate({
                    groupConfig: {
                      ...config.groupConfig!,
                      excludedPersonIds: hasExcluded ? undefined : allExcluded,
                    },
                  })
                }}
                style={{ fontSize: '0.9rem', padding: '4px 8px' }}
              >
                {(config.groupConfig?.excludedPersonIds?.length || 0) > 0 ? (
                  <>
                    <i className="fa-solid fa-check-double"></i> Marcar Todos
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-square"></i> Desmarcar Todos
                  </>
                )}
              </button>
            )}
          </div>
          {isLoading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <i className="fa-solid fa-spinner fa-spin"></i> Carregando pessoas...
            </div>
          ) : persons.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-light)' }}>
              <i className="fa-solid fa-info-circle"></i> Nenhuma pessoa cadastrada nesta área
            </div>
          ) : (
            <div className="checkbox-group checkbox-group-with-photos">
              {persons.map(person => {
                const isExcluded = config.groupConfig?.excludedPersonIds?.includes(person.personId) || false
                return (
                  <label key={person.id} className="checkbox-label checkbox-label-with-photo">
                    <input
                      type="checkbox"
                      checked={!isExcluded}
                      onChange={(e) => {
                        const currentExcluded = config.groupConfig?.excludedPersonIds || []
                        const newExcluded = e.target.checked
                          ? currentExcluded.filter(id => id !== person.personId)
                          : [...currentExcluded, person.personId]
                        onUpdate({
                          groupConfig: {
                            ...config.groupConfig!,
                            excludedPersonIds: newExcluded.length > 0 ? newExcluded : undefined,
                          },
                        })
                      }}
                    />
                    <span className="checkbox-custom"></span>
                    <div className="person-photo-container-small">
                      {person.person?.photoUrl ? (
                        <img
                          src={addCacheBusting(person.person.photoUrl)}
                          alt={person.person?.fullName || person.personId}
                          className="person-photo-small"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="person-photo-placeholder-small">
                          {person.person?.fullName?.charAt(0).toUpperCase() || person.personId.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="checkbox-text-container">
                      <span className="checkbox-text">
                        {person.person?.fullName || person.personId}
                      </span>
                      {person.responsibilities && person.responsibilities.length > 0 && (
                        <span className="checkbox-text-meta">
                          {person.responsibilities.map(r => r.name).join(', ')}
                        </span>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>
        
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onBack} aria-label="Voltar para etapa anterior">
            <i className="fa-solid fa-arrow-left"></i> Voltar
          </button>
          <button type="button" className="btn-primary" onClick={onNext} disabled={!config.groupConfig?.groupIds.length} aria-label="Avançar para próxima etapa">
            <i className="fa-solid fa-arrow-right"></i> Próximo
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="form-card">
      <h4 className="form-section-title">
        <i className="fa-solid fa-user-check"></i> Seleção de Participantes
      </h4>
      
      <div className="form-group">
        <label>
          <i className="fa-solid fa-users"></i> Modo de Seleção
          <span className="tooltip-trigger" title="TODOS: inclui todas as pessoas da área | Por Pessoas: todas selecionadas (pode remover) | Por Grupo: filtra por grupos específicos | Individual: seleção manual de pessoas">
            <i className="fa-solid fa-circle-question"></i>
          </span>
        </label>
        <select
          value={config.teamConfig?.participantSelection || 'all'}
          onChange={(e) => {
            const selection = e.target.value as ParticipantSelection
            onUpdate({
              teamConfig: {
                ...config.teamConfig!,
                participantSelection: selection,
                selectedGroupIds: selection === 'by_group' ? [] : undefined,
                selectedPersonIds: selection === 'individual' ? [] : undefined,
                excludedPersonIds: selection === 'all_with_exclusions' ? [] : undefined,
              },
            })
          }}
          aria-label="Modo de seleção de participantes"
        >
          <option value="all">TODOS - Todas as pessoas da área</option>
          <option value="all_with_exclusions">Por Pessoas - Todas selecionadas (pode remover)</option>
          <option value="by_group">Por Grupo - Filtrar por grupos específicos</option>
          <option value="individual">Individual - Seleção manual de pessoas</option>
        </select>
      </div>
      
      {config.teamConfig?.participantSelection === 'by_group' && (
        <div className="form-group">
          <label>
            <i className="fa-solid fa-users"></i> Grupos
          </label>
          {isLoading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <i className="fa-solid fa-spinner fa-spin"></i> Carregando grupos...
            </div>
          ) : groups.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-light)' }}>
              <i className="fa-solid fa-info-circle"></i> Nenhum grupo cadastrado nesta área
            </div>
          ) : (
            <div className="checkbox-group">
              {groups.map(group => (
                <label key={group.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={config.teamConfig?.selectedGroupIds?.includes(group.id) || false}
                    onChange={(e) => {
                      const currentIds = config.teamConfig?.selectedGroupIds || []
                      const newIds = e.target.checked
                        ? [...currentIds, group.id]
                        : currentIds.filter(id => id !== group.id)
                      onUpdate({
                        teamConfig: {
                          ...config.teamConfig!,
                          selectedGroupIds: newIds,
                        },
                      })
                    }}
                  />
                  <span className="checkbox-custom"></span>
                  <span className="checkbox-text">{group.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
      
      {config.teamConfig?.participantSelection === 'all_with_exclusions' && (
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ margin: 0 }}>
              <i className="fa-solid fa-users"></i> Pessoas (Todas selecionadas - desmarque para remover)
              <span className="tooltip-trigger" title="Todas as pessoas da área estão selecionadas por padrão. Desmarque as pessoas que deseja excluir da geração.">
                <i className="fa-solid fa-circle-question"></i>
              </span>
            </label>
            {!isLoading && persons.length > 0 && (
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  const allExcluded = persons.map(p => p.personId)
                  const hasExcluded = (config.teamConfig?.excludedPersonIds?.length || 0) > 0
                  onUpdate({
                    teamConfig: {
                      ...config.teamConfig!,
                      excludedPersonIds: hasExcluded ? undefined : allExcluded,
                    },
                  })
                }}
                style={{ fontSize: '0.9rem', padding: '4px 8px' }}
              >
                {(config.teamConfig?.excludedPersonIds?.length || 0) > 0 ? (
                  <>
                    <i className="fa-solid fa-check-double"></i> Marcar Todos
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-square"></i> Desmarcar Todos
                  </>
                )}
              </button>
            )}
          </div>
          {isLoading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <i className="fa-solid fa-spinner fa-spin"></i> Carregando pessoas...
            </div>
          ) : persons.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-light)' }}>
              <i className="fa-solid fa-info-circle"></i> Nenhuma pessoa cadastrada nesta área
            </div>
          ) : (
            <div className="checkbox-group checkbox-group-with-photos">
              {persons.map(person => {
                const isExcluded = config.teamConfig?.excludedPersonIds?.includes(person.personId) || false
                return (
                  <label key={person.id} className="checkbox-label checkbox-label-with-photo">
                    <input
                      type="checkbox"
                      checked={!isExcluded}
                      onChange={(e) => {
                        const currentExcluded = config.teamConfig?.excludedPersonIds || []
                        const newExcluded = e.target.checked
                          ? currentExcluded.filter(id => id !== person.personId)
                          : [...currentExcluded, person.personId]
                        onUpdate({
                          teamConfig: {
                            ...config.teamConfig!,
                            excludedPersonIds: newExcluded.length > 0 ? newExcluded : undefined,
                          },
                        })
                      }}
                    />
                    <span className="checkbox-custom"></span>
                    <div className="person-photo-container-small">
                      {person.person?.photoUrl ? (
                        <img
                          src={addCacheBusting(person.person.photoUrl)}
                          alt={person.person?.fullName || person.personId}
                          className="person-photo-small"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="person-photo-placeholder-small">
                          {person.person?.fullName?.charAt(0).toUpperCase() || person.personId.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="checkbox-text-container">
                      <span className="checkbox-text">
                        {person.person?.fullName || person.personId}
                      </span>
                      {person.responsibilities && person.responsibilities.length > 0 && (
                        <span className="checkbox-text-meta">
                          {person.responsibilities.map(r => r.name).join(', ')}
                        </span>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      )}
      
      {config.teamConfig?.participantSelection === 'individual' && (
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ margin: 0 }}>
              <i className="fa-solid fa-user"></i> Pessoas
            </label>
            {!isLoading && persons.length > 0 && (
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  const allSelected = persons.map(p => p.personId)
                  const hasSelected = (config.teamConfig?.selectedPersonIds?.length || 0) > 0
                  onUpdate({
                    teamConfig: {
                      ...config.teamConfig!,
                      selectedPersonIds: hasSelected ? [] : allSelected,
                    },
                  })
                }}
                style={{ fontSize: '0.9rem', padding: '4px 8px' }}
              >
                {(config.teamConfig?.selectedPersonIds?.length || 0) > 0 ? (
                  <>
                    <i className="fa-solid fa-square"></i> Desmarcar Todos
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check-double"></i> Selecionar Todos
                  </>
                )}
              </button>
            )}
          </div>
          {isLoading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <i className="fa-solid fa-spinner fa-spin"></i> Carregando pessoas...
            </div>
          ) : persons.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-light)' }}>
              <i className="fa-solid fa-info-circle"></i> Nenhuma pessoa cadastrada nesta área
            </div>
          ) : (
            <div className="checkbox-group checkbox-group-with-photos">
              {persons.map(person => (
                <label key={person.id} className="checkbox-label checkbox-label-with-photo">
                  <input
                    type="checkbox"
                    checked={config.teamConfig?.selectedPersonIds?.includes(person.personId) || false}
                    onChange={(e) => {
                      const currentIds = config.teamConfig?.selectedPersonIds || []
                      const newIds = e.target.checked
                        ? [...currentIds, person.personId]
                        : currentIds.filter(id => id !== person.personId)
                      onUpdate({
                        teamConfig: {
                          ...config.teamConfig!,
                          selectedPersonIds: newIds,
                        },
                      })
                    }}
                  />
                  <span className="checkbox-custom"></span>
                  <div className="person-photo-container-small">
                    {person.person?.photoUrl ? (
                      <img
                        src={addCacheBusting(person.person.photoUrl)}
                        alt={person.person?.fullName || person.personId}
                        className="person-photo-small"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="person-photo-placeholder-small">
                        {person.person?.fullName?.charAt(0).toUpperCase() || person.personId.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="checkbox-text-container">
                    <span className="checkbox-text">
                      {person.person?.fullName || person.personId}
                    </span>
                    {person.responsibilities && person.responsibilities.length > 0 && (
                      <span className="checkbox-text-meta">
                        {person.responsibilities.map(r => r.name).join(', ')}
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i> Voltar
        </button>
        <button type="button" className="btn-primary" onClick={onNext}>
          <i className="fa-solid fa-arrow-right"></i> Próximo
        </button>
      </div>
    </div>
  )
}

// Step 4: Período
function Step4Period({ config, onUpdate, onBack, onGeneratePreview, isGenerating }: {
  config: GenerationConfiguration
  onUpdate: (updates: Partial<GenerationConfiguration>) => void
  onBack: () => void
  onGeneratePreview: () => void
  isGenerating: boolean
}) {
  return (
    <div className="form-card">
      <h4 className="form-section-title">
        <i className="fa-solid fa-calendar"></i> Configuração de Período
      </h4>
      
      <div className="form-group">
        <label>
          <i className="fa-solid fa-calendar-alt"></i> Tipo de Período
        </label>
        <select
          value={config.periodType}
          onChange={(e) => {
            const periodType = e.target.value as PeriodType
            onUpdate({
              periodType,
              periodConfig: {
                ...config.periodConfig!,
                baseDateTime: new Date().toISOString(),
                duration: periodType === 'daily' ? 1 : periodType === 'weekly' ? 7 : periodType === 'monthly' ? 1 : 1,
                interval: periodType === 'weekly' ? 7 : undefined,
              },
            })
          }}
        >
          <option value="fixed">Fixo - Escala única com data/hora específicas</option>
          <option value="weekly">Semanal - Repete semanalmente</option>
          <option value="monthly">Mensal - Repete mensalmente</option>
          <option value="daily">Diário - Repete diariamente (com restrições)</option>
        </select>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>
            <i className="fa-solid fa-calendar-check"></i> Data de Início do Período
          </label>
          <input
            type="date"
            value={config.periodStartDate}
            onChange={(e) => onUpdate({ periodStartDate: e.target.value })}
          />
        </div>
        
        <div className="form-group">
          <label>
            <i className="fa-solid fa-calendar-times"></i> Data de Fim do Período
          </label>
          <input
            type="date"
            value={config.periodEndDate}
            onChange={(e) => onUpdate({ periodEndDate: e.target.value })}
          />
        </div>
      </div>
      
      {config.periodType === 'fixed' && (
        <div className="form-row">
          <div className="form-group">
            <label>
              <i className="fa-solid fa-clock"></i> Data/Hora de Início
            </label>
            <input
              type="datetime-local"
              value={config.periodConfig?.baseDateTime ? new Date(config.periodConfig.baseDateTime).toISOString().slice(0, 16) : ''}
              onChange={(e) => onUpdate({
                periodConfig: {
                  ...config.periodConfig!,
                  baseDateTime: new Date(e.target.value).toISOString(),
                },
              })}
            />
          </div>
          
          <div className="form-group">
            <label>
              <i className="fa-solid fa-clock"></i> Data/Hora de Fim
            </label>
            <input
              type="datetime-local"
              value={config.periodConfig?.baseDateTime ? new Date(new Date(config.periodConfig.baseDateTime).getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16) : ''}
              onChange={(e) => {
                // Ajustar endDate baseado na duração
                const endDate = new Date(e.target.value)
                onUpdate({ periodEndDate: endDate.toISOString().split('T')[0] })
              }}
            />
          </div>
        </div>
      )}
      
      {config.periodType === 'weekly' && (
        <div className="form-row">
          <div className="form-group">
            <label>
              <i className="fa-solid fa-calendar-day"></i> Duração de Cada Escala (dias)
            </label>
            <input
              type="number"
              min="1"
              value={config.periodConfig?.duration || 7}
              onChange={(e) => onUpdate({
                periodConfig: {
                  ...config.periodConfig!,
                  duration: parseInt(e.target.value) || 7,
                },
              })}
            />
          </div>
          
          <div className="form-group">
            <label>
              <i className="fa-solid fa-calendar-week"></i> Intervalo Entre Escalas (dias)
            </label>
            <input
              type="number"
              min="1"
              value={config.periodConfig?.interval || 7}
              onChange={(e) => onUpdate({
                periodConfig: {
                  ...config.periodConfig!,
                  interval: parseInt(e.target.value) || 7,
                },
              })}
            />
          </div>
        </div>
      )}
      
      {config.periodType === 'monthly' && (
        <div className="form-group">
          <label>
            <i className="fa-solid fa-calendar-day"></i> Duração de Cada Escala (dias)
          </label>
          <input
            type="number"
            min="1"
            value={config.periodConfig?.duration || 1}
            onChange={(e) => onUpdate({
              periodConfig: {
                ...config.periodConfig!,
                duration: parseInt(e.target.value) || 1,
              },
            })}
          />
        </div>
      )}
      
      {config.periodType === 'daily' && (
        <>
          <div className="form-row">
            <div className="form-group">
              <label>
                <i className="fa-solid fa-clock"></i> Horário de Início
              </label>
              <input
                type="time"
                value={config.periodConfig?.startTime || '08:00'}
                onChange={(e) => onUpdate({
                  periodConfig: {
                    ...config.periodConfig!,
                    startTime: e.target.value,
                  },
                })}
              />
            </div>
            
            <div className="form-group">
              <label>
                <i className="fa-solid fa-clock"></i> Horário de Fim
              </label>
              <input
                type="time"
                value={config.periodConfig?.endTime || '17:00'}
                onChange={(e) => onUpdate({
                  periodConfig: {
                    ...config.periodConfig!,
                    endTime: e.target.value,
                  },
                })}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>
              <i className="fa-solid fa-calendar-week"></i> Dias da Semana
            </label>
            <div className="checkbox-group checkbox-group-inline">
              {[
                { value: 0, label: 'Dom' },
                { value: 1, label: 'Seg' },
                { value: 2, label: 'Ter' },
                { value: 3, label: 'Qua' },
                { value: 4, label: 'Qui' },
                { value: 5, label: 'Sex' },
                { value: 6, label: 'Sáb' },
              ].map(day => (
                <label key={day.value} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={config.periodConfig?.weekdays?.includes(day.value) || false}
                    onChange={(e) => {
                      const current = config.periodConfig?.weekdays || []
                      const newWeekdays = e.target.checked
                        ? [...current, day.value]
                        : current.filter(d => d !== day.value)
                      onUpdate({
                        periodConfig: {
                          ...config.periodConfig!,
                          weekdays: newWeekdays,
                        },
                      })
                    }}
                  />
                  <span className="checkbox-custom"></span>
                  <span className="checkbox-text">{day.label}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
      
      {/* Exceções de Datas */}
      {(config.periodType === 'daily' || config.periodType === 'weekly' || config.periodType === 'monthly') && (
        <div className="form-group">
          <label>
            <i className="fa-solid fa-calendar-xmark"></i> Datas a Excluir
            <span className="tooltip-trigger" title="Datas que serão excluídas da geração de escalas. Útil para feriados ou dias específicos.">
              <i className="fa-solid fa-circle-question"></i>
            </span>
          </label>
          <div className="dates-list">
            {(config.periodConfig?.excludedDates || []).map((date, index) => (
              <div key={index} className="date-tag">
                <span>{new Date(date).toLocaleDateString('pt-BR')}</span>
                <button
                  type="button"
                  className="date-tag-remove"
                  onClick={() => {
                    const newExcluded = (config.periodConfig?.excludedDates || []).filter((_, i) => i !== index)
                    onUpdate({
                      periodConfig: {
                        ...config.periodConfig!,
                        excludedDates: newExcluded.length > 0 ? newExcluded : undefined,
                      },
                    })
                  }}
                  aria-label={`Remover data ${date}`}
                >
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
            ))}
            <input
              type="date"
              className="date-input-inline"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  const newExcluded = [...(config.periodConfig?.excludedDates || []), e.target.value]
                  onUpdate({
                    periodConfig: {
                      ...config.periodConfig!,
                      excludedDates: newExcluded,
                    },
                  })
                  e.target.value = ''
                }
              }}
              aria-label="Adicionar data a excluir"
            />
          </div>
        </div>
      )}
      
      {(config.periodType === 'daily' || config.periodType === 'weekly' || config.periodType === 'monthly') && (
        <div className="form-group">
          <label>
            <i className="fa-solid fa-calendar-check"></i> Datas a Incluir (Opcional)
            <span className="tooltip-trigger" title="Datas específicas que serão incluídas mesmo que não estejam no padrão configurado. Útil para incluir dias especiais.">
              <i className="fa-solid fa-circle-question"></i>
            </span>
          </label>
          <div className="dates-list">
            {(config.periodConfig?.includedDates || []).map((date, index) => (
              <div key={index} className="date-tag">
                <span>{new Date(date).toLocaleDateString('pt-BR')}</span>
                <button
                  type="button"
                  className="date-tag-remove"
                  onClick={() => {
                    const newIncluded = (config.periodConfig?.includedDates || []).filter((_, i) => i !== index)
                    onUpdate({
                      periodConfig: {
                        ...config.periodConfig!,
                        includedDates: newIncluded.length > 0 ? newIncluded : undefined,
                      },
                    })
                  }}
                  aria-label={`Remover data ${date}`}
                >
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
            ))}
            <input
              type="date"
              className="date-input-inline"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  const newIncluded = [...(config.periodConfig?.includedDates || []), e.target.value]
                  onUpdate({
                    periodConfig: {
                      ...config.periodConfig!,
                      includedDates: newIncluded,
                    },
                  })
                  e.target.value = ''
                }
              }}
              aria-label="Adicionar data a incluir"
            />
          </div>
        </div>
      )}
      
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onBack} aria-label="Voltar para etapa anterior">
          <i className="fa-solid fa-arrow-left"></i> Voltar
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={onGeneratePreview}
          disabled={isGenerating}
          aria-label="Gerar preview das escalas"
        >
          {isGenerating ? (
            <>
              <i className="fa-solid fa-spinner fa-spin"></i> Gerando Preview...
            </>
          ) : (
            <>
              <i className="fa-solid fa-eye"></i> Gerar Preview
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// Step 5: Preview
function Step5Preview({ preview, persons, teams, responsibilities, getResponsibilityImage, onBack, onConfirm, isConfirming }: {
  preview: GenerationPreview
  persons: PersonAreaResponseDto[]
  teams: TeamResponseDto[]
  responsibilities: ResponsibilityResponseDto[]
  getResponsibilityImage: (id: string) => string | null
  onBack: () => void
  onConfirm: () => void
  isConfirming: boolean
}) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(true)
  
  useEffect(() => {
    const checkVisibility = () => {
      if (!confirmButtonRef.current) {
        setShowScrollButton(true)
        return
      }
      
      const rect = confirmButtonRef.current.getBoundingClientRect()
      // Verificar se o botão está visível na viewport (com uma margem de 100px)
      const isVisible = rect.top < window.innerHeight - 100 && rect.bottom > 0
      
      setShowScrollButton(!isVisible)
    }
    
    // Verificar inicialmente
    checkVisibility()
    
    // Verificar durante o scroll
    window.addEventListener('scroll', checkVisibility, { passive: true })
    window.addEventListener('resize', checkVisibility, { passive: true })
    
    // Usar IntersectionObserver para melhor performance
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setShowScrollButton(!entry.isIntersecting)
        })
      },
      {
        root: null,
        rootMargin: '-100px 0px',
        threshold: 0.1,
      }
    )
    
    if (confirmButtonRef.current) {
      observer.observe(confirmButtonRef.current)
    }
    
    return () => {
      window.removeEventListener('scroll', checkVisibility)
      window.removeEventListener('resize', checkVisibility)
      if (confirmButtonRef.current) {
        observer.unobserve(confirmButtonRef.current)
      }
    }
  }, [])
  
  const scrollToConfirm = () => {
    confirmButtonRef.current?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    })
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
  
  // Função para obter a imagem da pessoa
  const getPersonImage = (personId: string): string | null => {
    const personArea = persons.find(p => p.personId === personId)
    return personArea?.person?.photoUrl || null
  }
  
  // Função para obter a imagem da função/responsabilidade
  const getRoleImage = (roleId: string, teamId?: string): string | null => {
    // Se temos o teamId, buscar através do team
    if (teamId) {
      const team = teams.find(t => t.id === teamId)
      if (team) {
        const role = team.roles.find(r => r.id === roleId)
        if (role) {
          // Buscar a responsabilidade pelo responsibilityId
          const responsibility = responsibilities.find(r => r.id === role.responsibilityId)
          if (responsibility?.imageUrl) {
            return responsibility.imageUrl
          }
          // Tentar usar getResponsibilityImage
          return getResponsibilityImage(role.responsibilityId)
        }
      }
    }
    
    // Fallback: tentar encontrar diretamente pelo roleId (caso seja o ID da responsabilidade)
    const responsibility = responsibilities.find(r => r.id === roleId)
    if (responsibility?.imageUrl) {
      return responsibility.imageUrl
    }
    // Último fallback: usar getResponsibilityImage
    return getResponsibilityImage(roleId)
  }
  
  return (
    <div className="form-card">
      <h4 className="form-section-title">
        <i className="fa-solid fa-eye"></i> Preview das Escalas
      </h4>
      
      <div className="preview-summary">
        <div className="summary-card">
          <div className="summary-icon">
            <i className="fa-solid fa-calendar-check"></i>
          </div>
          <div className="summary-content">
            <div className="summary-value">{preview.summary.totalSchedules}</div>
            <div className="summary-label">Escalas Geradas</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="summary-icon">
            <i className="fa-solid fa-users"></i>
          </div>
          <div className="summary-content">
            <div className="summary-value">{preview.summary.totalParticipants}</div>
            <div className="summary-label">Participantes</div>
          </div>
        </div>
        
        <div className={`summary-card ${preview.summary.warnings > 0 ? 'warning' : ''}`}>
          <div className="summary-icon">
            <i className="fa-solid fa-exclamation-triangle"></i>
          </div>
          <div className="summary-content">
            <div className="summary-value">{preview.summary.warnings}</div>
            <div className="summary-label">Avisos</div>
          </div>
        </div>
        
        <div className={`summary-card ${preview.summary.errors > 0 ? 'error' : ''}`}>
          <div className="summary-icon">
            <i className="fa-solid fa-times-circle"></i>
          </div>
          <div className="summary-content">
            <div className="summary-value">{preview.summary.errors}</div>
            <div className="summary-label">Erros</div>
          </div>
        </div>
      </div>
      
      {showScrollButton && (
        <button 
          type="button" 
          className="btn-scroll-to-confirm"
          onClick={scrollToConfirm}
          title="Ir para confirmar geração"
        >
          <i className="fa-solid fa-arrow-down"></i>
          <span>Ir para Confirmar</span>
        </button>
      )}
      
      <div className="preview-schedules">
        <h5>Escalas Geradas:</h5>
        <div className="schedules-list">
          {preview.schedules.map((schedule, index) => (
            <div key={schedule.id} className="schedule-item">
              <div className="schedule-header">
                <div className="schedule-number">#{index + 1}</div>
                <div className="schedule-dates">
                  <i className="fa-solid fa-calendar"></i>
                  {formatDateTime(schedule.startDatetime)} - {formatDateTime(schedule.endDatetime)}
                </div>
                {schedule.warnings && schedule.warnings.length > 0 && (
                  <div className="schedule-warnings">
                    {schedule.warnings.map((warning, i) => (
                      <span key={i} className="warning-badge">
                        <i className="fa-solid fa-exclamation-triangle"></i> {warning}
                      </span>
                    ))}
                  </div>
                )}
                {schedule.errors && schedule.errors.length > 0 && (
                  <div className="schedule-errors">
                    {schedule.errors.map((error, i) => (
                      <span key={i} className="error-badge">
                        <i className="fa-solid fa-times-circle"></i> {error}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {schedule.groups && schedule.groups.length > 0 && (
                <div className="schedule-content">
                  <strong>Grupos:</strong>
                  <div className="schedule-groups-list">
                    {schedule.groups.map(group => (
                      <div key={group.id} className="schedule-group-card">
                        <div className="schedule-group-header">
                          <h6 className="schedule-group-name">
                            <i className="fa-solid fa-users"></i> {group.name}
                          </h6>
                          {group.members && (
                            <span className="schedule-group-member-count">
                              {group.members.length} {group.members.length === 1 ? 'membro' : 'membros'}
                            </span>
                          )}
                        </div>
                        {group.members && group.members.length > 0 ? (
                          <div className="schedule-group-members">
                            {group.members.map((member, memberIndex) => (
                              <div key={memberIndex} className="schedule-group-member">
                                <div className="schedule-member-photo-container">
                                  {member.personPhotoUrl ? (
                                    <img
                                      src={addCacheBusting(member.personPhotoUrl)}
                                      alt={member.personName}
                                      className="schedule-member-photo"
                                      loading="lazy"
                                      decoding="async"
                                    />
                                  ) : (
                                    <div className="schedule-member-photo-placeholder">
                                      {member.personName.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <div className="schedule-member-info">
                                  <div className="schedule-member-name">{member.personName}</div>
                                  {member.responsibilities && member.responsibilities.length > 0 && (
                                    <div className="schedule-member-roles">
                                      {member.responsibilities.map((responsibility) => (
                                        <span key={responsibility.id} className="schedule-member-role-badge">
                                          {responsibility.imageUrl ? (
                                            <img
                                              src={addCacheBusting(responsibility.imageUrl)}
                                              alt={responsibility.name}
                                              className="schedule-member-role-image"
                                              loading="lazy"
                                              decoding="async"
                                            />
                                          ) : null}
                                          <span className="schedule-member-role-name">{responsibility.name}</span>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="schedule-group-empty">
                            <i className="fa-solid fa-info-circle"></i>
                            <span>Nenhum membro cadastrado neste grupo</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {schedule.team && (
                <div className="schedule-content">
                  <strong>Equipe:</strong> {schedule.team.name}
                </div>
              )}
              
              {schedule.assignments && schedule.assignments.length > 0 && (
                <div className="schedule-content">
                  <strong>Atribuições:</strong>
                  <div className="assignments-grid">
                    {schedule.assignments.map((assignment, i) => {
                      const personImage = getPersonImage(assignment.personId)
                      const roleImage = getRoleImage(assignment.roleId, schedule.team?.id)
                      return (
                        <div key={i} className="assignment-card">
                          <div className="assignment-person">
                            <div className="assignment-image-container">
                              {personImage ? (
                                <img
                                  src={addCacheBusting(personImage)}
                                  alt={assignment.personName}
                                  className="assignment-person-image"
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : (
                                <div className="assignment-image-placeholder">
                                  <i className="fa-solid fa-user"></i>
                                </div>
                              )}
                            </div>
                            <div className="assignment-person-name">{assignment.personName}</div>
                          </div>
                          <div className="assignment-arrow">
                            <i className="fa-solid fa-arrow-right"></i>
                          </div>
                          <div className="assignment-role">
                            <div className="assignment-image-container">
                              {roleImage ? (
                                <img
                                  src={addCacheBusting(roleImage)}
                                  alt={assignment.roleName}
                                  className="assignment-role-image"
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : (
                                <div className="assignment-image-placeholder">
                                  <i className="fa-solid fa-briefcase"></i>
                                </div>
                              )}
                            </div>
                            <div className="assignment-role-name">{assignment.roleName}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onBack} aria-label="Voltar para etapa anterior">
          <i className="fa-solid fa-arrow-left"></i> Voltar
        </button>
        <button
          ref={confirmButtonRef}
          type="button"
          className="btn-primary"
          onClick={onConfirm}
          disabled={isConfirming || preview.summary.errors > 0}
          aria-label="Confirmar geração das escalas"
        >
          {isConfirming ? (
            <>
              <i className="fa-solid fa-spinner fa-spin"></i> Gerando...
            </>
          ) : (
            <>
              <i className="fa-solid fa-check"></i> Confirmar Geração
            </>
          )}
        </button>
      </div>
    </div>
  )
}
