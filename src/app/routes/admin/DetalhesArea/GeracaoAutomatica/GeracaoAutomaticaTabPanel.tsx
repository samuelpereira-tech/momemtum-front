import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import '../shared/TabPanel.css'
import './GeracaoAutomaticaTabPanel.css'
import type { GenerationConfiguration, GenerationPreview, GenerationType, PeriodType, DistributionOrder, ParticipantSelection } from './types'
import { generatePreviewMock, confirmGenerationMock } from './mockServices'
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
    periodType: 'weekly',
    periodStartDate: new Date().toISOString().split('T')[0],
    periodEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    groupConfig: {
      groupIds: [],
      groupsPerSchedule: 1,
      distributionOrder: 'balanced',
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
      duration: 7,
      interval: 7,
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
  
  // Função para obter pessoas por grupo
  const getPersonsByGroup = useCallback(async (groupId: string): Promise<string[]> => {
    if (!scheduledAreaId) return []
    
    try {
      let members: any[] = []
      let page = 1
      let hasMore = true
      const limit = 100
      
      while (hasMore) {
        const response = await groupMemberService.getMembersInGroup(scheduledAreaId, groupId, { page, limit })
        members = [...members, ...response.data]
        
        if (page >= response.meta.totalPages || response.data.length === 0) {
          hasMore = false
        } else {
          page++
        }
      }
      
      return members.map(m => m.personId).filter(Boolean)
    } catch (error) {
      console.error('Erro ao carregar membros do grupo:', error)
      return []
    }
  }, [scheduledAreaId])
  
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
      const previewData = await generatePreviewMock(config, groups, teams, persons, absences)
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
      const result = await confirmGenerationMock(config)
      toast.showSuccess(`Geração concluída! ${result.schedulesCreated} escalas criadas.`)
      // Resetar formulário
      setCurrentStep(1)
      setPreview(null)
      setConfig({
        scheduledAreaId: scheduledAreaId || '',
        generationType: 'group',
        periodType: 'weekly',
        periodStartDate: new Date().toISOString().split('T')[0],
        periodEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        groupConfig: {
          groupIds: [],
          groupsPerSchedule: 1,
          distributionOrder: 'balanced',
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
          duration: 7,
          interval: 7,
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
                responsibilities={responsibilities}
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
                getPersonsByGroup={getPersonsByGroup}
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
    onUpdate({ generationType: type })
  }
  
  return (
    <div className="form-card">
      <h4 className="form-section-title">
        <i className="fa-solid fa-list"></i> Selecione o Tipo de Geração
      </h4>
      <p className="form-section-description">
        Escolha como as escalas serão geradas: por grupos, por equipe sem restrição de papéis, ou por equipe com restrição de papéis.
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
function Step2Configurations({ config, groups, teams, responsibilities, getResponsibilityImage, onUpdate, onBack, onNext, isLoading }: {
  config: GenerationConfiguration
  groups: GroupResponseDto[]
  teams: TeamResponseDto[]
  responsibilities: ResponsibilityResponseDto[]
  getResponsibilityImage: (id: string) => string | null
  onUpdate: (updates: Partial<GenerationConfiguration>) => void
  onBack: () => void
  onNext: () => void
  isLoading: boolean
}) {
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
            />
          </div>
          
          <div className="form-group">
            <label>
              <i className="fa-solid fa-sort"></i> Ordem de Distribuição
            </label>
            <select
              value={config.groupConfig?.distributionOrder || 'balanced'}
              onChange={(e) => onUpdate({
                groupConfig: {
                  ...config.groupConfig!,
                  distributionOrder: e.target.value as DistributionOrder,
                },
              })}
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
            />
            <span className="checkbox-custom"></span>
            <span className="checkbox-text">Considerar ausências ao escalar grupos</span>
          </label>
        </div>
        
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onBack}>
            <i className="fa-solid fa-arrow-left"></i> Voltar
          </button>
          <button type="button" className="btn-primary" onClick={onNext} disabled={!config.groupConfig?.groupIds.length}>
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
        <div className="form-group">
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
        <button type="button" className="btn-secondary" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i> Voltar
        </button>
        <button type="button" className="btn-primary" onClick={onNext} disabled={!config.teamConfig?.teamId}>
          <i className="fa-solid fa-arrow-right"></i> Próximo
        </button>
      </div>
    </div>
  )
}

// Step 3: Participantes
function Step3Participants({ config, groups, persons, onUpdate, onBack, onNext, getPersonsByGroup, isLoading }: {
  config: GenerationConfiguration
  groups: GroupResponseDto[]
  persons: PersonAreaResponseDto[]
  onUpdate: (updates: Partial<GenerationConfiguration>) => void
  onBack: () => void
  onNext: () => void
  getPersonsByGroup: (groupId: string) => Promise<string[]>
  isLoading: boolean
}) {
  if (config.generationType === 'group') {
    // Para grupos, não precisa selecionar participantes
    return (
      <div className="form-card">
        <h4 className="form-section-title">
          <i className="fa-solid fa-user-check"></i> Participantes
        </h4>
        <p className="form-section-description">
          Para geração por grupos, todos os membros dos grupos selecionados participarão automaticamente.
        </p>
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
  
  return (
    <div className="form-card">
      <h4 className="form-section-title">
        <i className="fa-solid fa-user-check"></i> Seleção de Participantes
      </h4>
      
      <div className="form-group">
        <label>
          <i className="fa-solid fa-users"></i> Modo de Seleção
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
              },
            })
          }}
        >
          <option value="all">TODOS - Todas as pessoas da área</option>
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
      
      {config.teamConfig?.participantSelection === 'individual' && (
        <div className="form-group">
          <label>
            <i className="fa-solid fa-user"></i> Pessoas
          </label>
          {isLoading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <i className="fa-solid fa-spinner fa-spin"></i> Carregando pessoas...
            </div>
          ) : persons.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-light)' }}>
              <i className="fa-solid fa-info-circle"></i> Nenhuma pessoa cadastrada nesta área
            </div>
          ) : (
            <div className="checkbox-group">
              {persons.map(person => (
                <label key={person.id} className="checkbox-label">
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
                  <span className="checkbox-text">
                    {person.person?.fullName || person.personId}
                    {person.responsibilities && person.responsibilities.length > 0 && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginLeft: '8px' }}>
                        ({person.responsibilities.map(r => r.name).join(', ')})
                      </span>
                    )}
                  </span>
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
      
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i> Voltar
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={onGeneratePreview}
          disabled={isGenerating}
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
function Step5Preview({ preview, onBack, onConfirm, isConfirming }: {
  preview: GenerationPreview
  onBack: () => void
  onConfirm: () => void
  isConfirming: boolean
}) {
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
                  <ul>
                    {schedule.groups.map(group => (
                      <li key={group.id}>{group.name}</li>
                    ))}
                  </ul>
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
                  <ul>
                    {schedule.assignments.map((assignment, i) => (
                      <li key={i}>
                        <strong>{assignment.personName}</strong> - {assignment.roleName}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i> Voltar
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={onConfirm}
          disabled={isConfirming || preview.summary.errors > 0}
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
