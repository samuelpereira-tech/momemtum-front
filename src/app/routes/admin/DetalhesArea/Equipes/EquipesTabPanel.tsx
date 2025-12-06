import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import '../shared/TabPanel.css'
import './EquipesTabPanel.css'
import ConfirmModal from '../../../../../components/ui/ConfirmModal/ConfirmModal'
import { teamService, type TeamResponseDto, type TeamRoleDto } from '../../../../../services/basic/teamService'
import { responsibilityService, type ResponsibilityResponseDto } from '../../../../../services/basic/responsibilityService'
import { personAreaService, type PersonAreaResponseDto } from '../../../../../services/basic/personAreaService'
import { useToast } from '../../../../../components/ui/Toast/ToastProvider'
import { addCacheBusting } from '../../../../../utils/fileUtils'
import Modal from '../shared/Modal'

export default function EquipesTabPanel() {
  const { id: scheduledAreaId } = useParams<{ id: string }>()
  const toast = useToast()

  // Estados
  const [equipes, setEquipes] = useState<TeamResponseDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [availableFunctions, setAvailableFunctions] = useState<ResponsibilityResponseDto[]>([])
  const [availablePersons, setAvailablePersons] = useState<PersonAreaResponseDto[]>([])
  const [equipeSelecionada, setEquipeSelecionada] = useState<TeamResponseDto | null>(null)

  // Modais Estado
  const [showAddEquipeModal, setShowAddEquipeModal] = useState(false)
  const [showAddPapelModal, setShowAddPapelModal] = useState(false)
  const [showDeleteEquipeModal, setShowDeleteEquipeModal] = useState(false)
  const [showEditEquipeModal, setShowEditEquipeModal] = useState(false)
  const [equipeParaDeletar, setEquipeParaDeletar] = useState<TeamResponseDto | null>(null)
  const [equipeParaEditar, setEquipeParaEditar] = useState<TeamResponseDto | null>(null)

  // Form States
  const [novaEquipeNome, setNovaEquipeNome] = useState('')
  const [novaEquipeDescricao, setNovaEquipeDescricao] = useState('')
  const [editEquipeNome, setEditEquipeNome] = useState('')
  const [editEquipeDescricao, setEditEquipeDescricao] = useState('')

  // Form States para Papel
  const [novoPapelResponsibilityId, setNovoPapelResponsibilityId] = useState('')
  const [novoPapelQuantidade, setNovoPapelQuantidade] = useState(1)
  const [novoPapelPrioridade, setNovoPapelPrioridade] = useState(1)
  const [novoPapelIsFixo, setNovoPapelIsFixo] = useState(false)
  const [novoPapelPessoasFixas, setNovoPapelPessoasFixas] = useState<string[]>([])

  // Refs para evitar chamadas duplicadas durante StrictMode
  const loadingTeamsRef = useRef(false)

  const loadEquipes = useCallback(async () => {
    if (!scheduledAreaId || loadingTeamsRef.current) return
    
    loadingTeamsRef.current = true
    try {
      const response = await teamService.getTeamsInArea(scheduledAreaId, {
        page: 1,
        limit: 100
      })

      setEquipes(response.data)
      
      // Atualizar equipe selecionada usando função de callback para acessar o estado atual
      setEquipeSelecionada(prev => {
        if (prev) {
          const updated = response.data.find(e => e.id === prev.id)
          return updated || null
        }
        return prev
      })
    } catch (error: any) {
      console.error('Erro ao carregar equipes:', error)
      toast.showError(error.message || 'Erro ao carregar equipes')
    } finally {
      loadingTeamsRef.current = false
    }
  }, [scheduledAreaId, toast])

  const loadFunctions = useCallback(async () => {
    if (!scheduledAreaId) return
    try {
      const response = await responsibilityService.getAllResponsibilities({
        scheduledAreaId,
        limit: 100
      })
      setAvailableFunctions(response.data)
    } catch (error) {
      console.error('Erro ao carregar funções:', error)
      toast.showError('Erro ao carregar lista de funções')
    }
  }, [scheduledAreaId, toast])

  const loadPersons = useCallback(async () => {
    if (!scheduledAreaId) return
    try {
      let persons: PersonAreaResponseDto[] = []
      let page = 1
      let hasMore = true
      const limit = 100

      while (hasMore) {
        const response = await personAreaService.getPersonsInArea(scheduledAreaId, { 
          page, 
          limit 
        })
        persons = [...persons, ...response.data]

        if (page >= response.meta.totalPages || response.data.length === 0) {
          hasMore = false
        } else {
          page++
        }
      }

      setAvailablePersons(persons)
    } catch (error) {
      console.error('Erro ao carregar pessoas da área:', error)
      toast.showError('Erro ao carregar lista de pessoas')
    }
  }, [scheduledAreaId, toast])

  const loadData = useCallback(async () => {
    if (!scheduledAreaId) return
    
    setIsLoading(true)
    try {
      await Promise.all([
        loadEquipes(),
        loadFunctions(),
        loadPersons()
      ])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setIsLoading(false)
    }
  }, [scheduledAreaId, loadEquipes, loadFunctions, loadPersons])

  useEffect(() => {
    if (scheduledAreaId) {
      loadData()
    }
  }, [scheduledAreaId, loadData])

  // Handlers Equipe
  const handleSaveEquipe = async () => {
    if (!scheduledAreaId || !novaEquipeNome.trim()) {
      toast.showError('Nome da equipe é obrigatório')
      return
    }

    try {
      const newTeam = await teamService.createTeam(scheduledAreaId, {
        name: novaEquipeNome.trim(),
        description: novaEquipeDescricao.trim() || undefined,
        scheduledAreaId,
        roles: []
      })

      setEquipes([...equipes, newTeam])
      setNovaEquipeNome('')
      setNovaEquipeDescricao('')
      setShowAddEquipeModal(false)
      toast.showSuccess('Equipe criada com sucesso!')
    } catch (error: any) {
      console.error('Erro ao criar equipe:', error)
      toast.showError(error.message || 'Erro ao criar equipe')
    }
  }

  const handleEditEquipe = async () => {
    if (!scheduledAreaId || !equipeParaEditar || !editEquipeNome.trim()) {
      toast.showError('Nome da equipe é obrigatório')
      return
    }

    try {
      const updatedTeam = await teamService.updateTeam(
        scheduledAreaId,
        equipeParaEditar.id,
        {
          name: editEquipeNome.trim(),
          description: editEquipeDescricao.trim() || undefined
        }
      )

      setEquipes(equipes.map(e => e.id === equipeParaEditar.id ? updatedTeam : e))
      
      // Se a equipe editada era a selecionada, atualizar a seleção
      if (equipeSelecionada?.id === equipeParaEditar.id) {
        setEquipeSelecionada(updatedTeam)
      }
      
      setShowEditEquipeModal(false)
      setEquipeParaEditar(null)
      toast.showSuccess('Equipe atualizada com sucesso!')
    } catch (error: any) {
      console.error('Erro ao atualizar equipe:', error)
      toast.showError(error.message || 'Erro ao atualizar equipe')
    }
  }

  const handleDeleteEquipe = async () => {
    if (!scheduledAreaId || !equipeParaDeletar) return

    try {
      await teamService.deleteTeam(scheduledAreaId, equipeParaDeletar.id)
      setEquipes(equipes.filter(e => e.id !== equipeParaDeletar.id))
      if (equipeSelecionada?.id === equipeParaDeletar.id) {
        setEquipeSelecionada(null)
      }
      setShowDeleteEquipeModal(false)
      setEquipeParaDeletar(null)
      toast.showSuccess('Equipe excluída com sucesso!')
    } catch (error: any) {
      console.error('Erro ao excluir equipe:', error)
      toast.showError(error.message || 'Erro ao excluir equipe')
    }
  }

  const confirmDeleteEquipe = (equipe: TeamResponseDto, e: React.MouseEvent) => {
    e.stopPropagation()
    setEquipeParaDeletar(equipe)
    setShowDeleteEquipeModal(true)
  }

  const handleSelectEquipe = (equipe: TeamResponseDto) => {
    setEquipeSelecionada(equipe)
  }

  const handleOpenEditModal = (equipe: TeamResponseDto, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    // Selecionar a equipe se não estiver selecionada
    if (equipeSelecionada?.id !== equipe.id) {
      handleSelectEquipe(equipe)
    }
    setEquipeParaEditar(equipe)
    setEditEquipeNome(equipe.name)
    setEditEquipeDescricao(equipe.description || '')
    setShowEditEquipeModal(true)
  }

  // Funções auxiliares
  const getResponsibilityName = (responsibilityId: string): string => {
    const responsibility = availableFunctions.find(f => f.id === responsibilityId)
    return responsibility?.name || `Função ${responsibilityId}`
  }

  const getPersonName = (personId: string): string => {
    const person = availablePersons.find(p => p.personId === personId)
    return person?.person?.fullName || `Pessoa ${personId}`
  }

  // Handlers Papel
  const handleAddPapel = async () => {
    if (!scheduledAreaId || !equipeSelecionada || !novoPapelResponsibilityId) {
      toast.showError('Selecione uma função')
      return
    }

    if (novoPapelQuantidade < 1) {
      toast.showError('A quantidade deve ser pelo menos 1')
      return
    }

    if (novoPapelIsFixo && novoPapelPessoasFixas.length === 0) {
      toast.showError('Selecione pelo menos uma pessoa fixa')
      return
    }

    if (novoPapelIsFixo && novoPapelPessoasFixas.length > novoPapelQuantidade) {
      toast.showError(`Você selecionou ${novoPapelPessoasFixas.length} pessoas, mas a quantidade é ${novoPapelQuantidade}. Remova algumas pessoas ou aumente a quantidade.`)
      return
    }

    try {
      const responsibilityName = getResponsibilityName(novoPapelResponsibilityId)
      const newRole: Omit<TeamRoleDto, 'id'> & { responsibilityName: string } = {
        responsibilityId: novoPapelResponsibilityId,
        responsibilityName,
        quantity: novoPapelQuantidade,
        priority: novoPapelPrioridade,
        isFree: !novoPapelIsFixo,
        fixedPersonIds: novoPapelIsFixo ? novoPapelPessoasFixas : []
      }

      const updatedTeam = await teamService.updateTeam(
        scheduledAreaId,
        equipeSelecionada.id,
        {
          roles: [...equipeSelecionada.roles, newRole]
        }
      )

      setEquipes(equipes.map(e => e.id === equipeSelecionada.id ? updatedTeam : e))
      setEquipeSelecionada(updatedTeam)

      // Reset form
      setNovoPapelResponsibilityId('')
      setNovoPapelQuantidade(1)
      setNovoPapelPrioridade(1)
      setNovoPapelIsFixo(false)
      setNovoPapelPessoasFixas([])
      setShowAddPapelModal(false)
      toast.showSuccess('Papel adicionado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao adicionar papel:', error)
      toast.showError(error.message || 'Erro ao adicionar papel')
    }
  }

  const handleRemovePapel = async (roleId: string) => {
    if (!scheduledAreaId || !equipeSelecionada) return

    if (!confirm('Tem certeza que deseja remover este papel da equipe?')) {
      return
    }

    try {
      const updatedRoles = equipeSelecionada.roles.filter(r => r.id !== roleId)
      const updatedTeam = await teamService.updateTeam(
        scheduledAreaId,
        equipeSelecionada.id,
        {
          roles: updatedRoles
        }
      )

      setEquipes(equipes.map(e => e.id === equipeSelecionada.id ? updatedTeam : e))
      setEquipeSelecionada(updatedTeam)
      toast.showSuccess('Papel removido com sucesso!')
    } catch (error: any) {
      console.error('Erro ao remover papel:', error)
      toast.showError(error.message || 'Erro ao remover papel')
    }
  }

  return (
    <div className="tab-panel">
      {/* Lista de Equipes (Sidebar ou Grid) */}
      <div className="equipes-layout">
        <aside className="equipes-sidebar">
          <div className="equipes-sidebar-header">
            <h3>Equipes</h3>
            <button 
              className="btn-icon-primary" 
              onClick={() => {
                setNovaEquipeNome('')
                setNovaEquipeDescricao('')
                setShowAddEquipeModal(true)
              }} 
              title="Adicionar Equipe"
            >
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
          <div className="equipes-list">
            {isLoading ? (
              <div className="empty-equipes">
                <i className="fa-solid fa-spinner fa-spin"></i> Carregando...
              </div>
            ) : equipes.length === 0 ? (
              <div className="empty-equipes">Nenhuma equipe criada.</div>
            ) : (
              equipes.map(equipe => (
                <div
                  key={equipe.id}
                  className={`equipe-item ${equipeSelecionada?.id === equipe.id ? 'active' : ''}`}
                  onClick={() => handleSelectEquipe(equipe)}
                >
                  <div className="equipe-item-content">
                    <span className="equipe-name">{equipe.name}</span>
                    <span className="equipe-meta">{equipe.roles.length} papel(is)</span>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      className="btn-icon-edit-sm"
                      onClick={(e) => handleOpenEditModal(equipe, e)}
                      title="Editar equipe"
                    >
                      <i className="fa-solid fa-pencil"></i>
                    </button>
                    <button
                      className="btn-icon-delete-sm"
                      onClick={(e) => confirmDeleteEquipe(equipe, e)}
                      title="Excluir equipe"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Detalhes da Equipe */}
        <div className="equipe-detalhes">
          {equipeSelecionada ? (
            <>
              <div className="equipe-header">
                <div>
                  <h2>{equipeSelecionada.name}</h2>
                  <p>{equipeSelecionada.description || 'Sem descrição'}</p>
                </div>
                <button 
                  className="btn-primary" 
                  onClick={() => {
                    setNovoPapelResponsibilityId('')
                    setNovoPapelQuantidade(1)
                    setNovoPapelPrioridade(1)
                    setNovoPapelIsFixo(false)
                    setNovoPapelPessoasFixas([])
                    setShowAddPapelModal(true)
                  }}
                >
                  <i className="fa-solid fa-plus"></i> Adicionar Papel
                </button>
              </div>

              <div className="papeis-list">
                <h3>Papéis ({equipeSelecionada.roles.length})</h3>

                {equipeSelecionada.roles.length === 0 ? (
                  <div className="empty-state">
                    <i className="fa-solid fa-briefcase" style={{ fontSize: '2.5rem', marginBottom: '15px' }}></i>
                    <p>Nenhum papel cadastrado nesta equipe.</p>
                  </div>
                ) : (
                  <div className="papeis-grid">
                    {equipeSelecionada.roles
                      .sort((a, b) => a.priority - b.priority)
                      .map(papel => (
                        <div key={papel.id} className="papel-card">
                          <div className="papel-card-header">
                            <div className="papel-info-main">
                              <h4 className="papel-name">{getResponsibilityName(papel.responsibilityId)}</h4>
                              <div className="papel-badges">
                                <span className="papel-badge quantidade">
                                  <i className="fa-solid fa-users"></i> {papel.quantity}
                                </span>
                                <span className="papel-badge prioridade">
                                  <i className="fa-solid fa-star"></i> Prioridade {papel.priority}
                                </span>
                                {!papel.isFree && (
                                  <span className="papel-badge fixo">
                                    <i className="fa-solid fa-lock"></i>
                                    Fixo
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              className="btn-icon-delete-sm"
                              onClick={() => handleRemovePapel(papel.id)}
                              title="Remover papel"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>

                          {!papel.isFree && papel.fixedPersonIds.length > 0 && (
                            <div className="papel-pessoas-fixas">
                              <h5>Pessoas Fixas:</h5>
                              <div className="pessoas-fixas-list">
                                {papel.fixedPersonIds.map(personId => (
                                  <div key={personId} className="pessoa-fixa-item">
                                    {availablePersons.find(p => p.personId === personId)?.person?.photoUrl ? (
                                      <img
                                        src={addCacheBusting(availablePersons.find(p => p.personId === personId)!.person!.photoUrl!)}
                                        alt={getPersonName(personId)}
                                        className="pessoa-fixa-photo"
                                      />
                                    ) : (
                                      <div className="pessoa-fixa-photo-placeholder">
                                        {getPersonName(personId).charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <span className="pessoa-fixa-name">{getPersonName(personId)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="equipe-placeholder">
              <i className="fa-solid fa-user-group"></i>
              <p>Selecione uma equipe para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Adicionar Equipe */}
      {showAddEquipeModal && (
        <Modal
          title="Nova Equipe"
          onClose={() => {
            setShowAddEquipeModal(false)
            setNovaEquipeNome('')
            setNovaEquipeDescricao('')
          }}
        >
          <form onSubmit={(e) => {
            e.preventDefault()
            handleSaveEquipe()
          }}>
            <div className="form-group">
              <label>
                <i className="fa-solid fa-user-group"></i> Nome da Equipe *
              </label>
              <input
                type="text"
                className="form-control"
                value={novaEquipeNome}
                onChange={e => setNovaEquipeNome(e.target.value)}
                placeholder="Ex: Equipe Plantão A"
                required
              />
            </div>
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label>
                <i className="fa-solid fa-align-left"></i> Descrição (Opcional)
              </label>
              <textarea
                className="form-control"
                value={novaEquipeDescricao}
                onChange={e => setNovaEquipeDescricao(e.target.value)}
                placeholder="Descrição da equipe..."
                rows={3}
              />
            </div>
            <div className="form-actions">
              <button 
                type="button"
                className="btn-secondary" 
                onClick={() => {
                  setShowAddEquipeModal(false)
                  setNovaEquipeNome('')
                  setNovaEquipeDescricao('')
                }}
              >
                <i className="fa-solid fa-times"></i> Cancelar
              </button>
              <button 
                type="submit"
                className="btn-primary" 
                disabled={!novaEquipeNome.trim()}
              >
                <i className="fa-solid fa-check"></i> Criar Equipe
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Editar Equipe */}
      {showEditEquipeModal && equipeParaEditar && (
        <Modal
          title="Editar Equipe"
          onClose={() => {
            setShowEditEquipeModal(false)
            setEquipeParaEditar(null)
            setEditEquipeNome('')
            setEditEquipeDescricao('')
          }}
        >
          <form onSubmit={(e) => {
            e.preventDefault()
            handleEditEquipe()
          }}>
            <div className="form-group">
              <label>
                <i className="fa-solid fa-user-group"></i> Nome da Equipe *
              </label>
              <input
                type="text"
                className="form-control"
                value={editEquipeNome}
                onChange={e => setEditEquipeNome(e.target.value)}
                placeholder="Ex: Equipe Plantão A"
                required
              />
            </div>
            <div className="form-group">
              <label>
                <i className="fa-solid fa-align-left"></i> Descrição (Opcional)
              </label>
              <textarea
                className="form-control"
                value={editEquipeDescricao}
                onChange={e => setEditEquipeDescricao(e.target.value)}
                placeholder="Descrição da equipe..."
                rows={3}
              />
            </div>
            <div className="form-actions">
              <button 
                type="button"
                className="btn-secondary" 
                onClick={() => {
                  setShowEditEquipeModal(false)
                  setEditEquipeNome('')
                  setEditEquipeDescricao('')
                }}
              >
                <i className="fa-solid fa-times"></i> Cancelar
              </button>
              <button 
                type="submit"
                className="btn-primary" 
                disabled={!editEquipeNome.trim()}
              >
                <i className="fa-solid fa-check"></i> Salvar Alterações
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Adicionar Papel */}
      {showAddPapelModal && equipeSelecionada && (
        <Modal
          title="Adicionar Papel à Equipe"
          onClose={() => {
            setShowAddPapelModal(false)
            setNovoPapelResponsibilityId('')
            setNovoPapelQuantidade(1)
            setNovoPapelPrioridade(1)
            setNovoPapelIsFixo(false)
            setNovoPapelPessoasFixas([])
          }}
        >
          <form onSubmit={(e) => {
            e.preventDefault()
            handleAddPapel()
          }}>
            <div className="form-group">
              <label>Função (Papel) *</label>
              <div className="selector-container">
                <input
                  type="text"
                  placeholder="Buscar função..."
                  className="search-input"
                  onChange={(e) => {
                    const term = e.target.value.toLowerCase();
                    const items = document.querySelectorAll('.function-item');
                    items.forEach((item: any) => {
                      const name = item.getAttribute('data-name').toLowerCase();
                      if (name.includes(term)) {
                        item.style.display = 'flex';
                      } else {
                        item.style.display = 'none';
                      }
                    });
                  }}
                />
                <div className="list-container">
                  {availableFunctions.map(func => (
                    <div
                      key={func.id}
                      className={`option-item function-item ${novoPapelResponsibilityId === func.id ? 'selected' : ''}`}
                      onClick={() => setNovoPapelResponsibilityId(func.id)}
                      data-name={func.name}
                    >
                      {func.imageUrl ? (
                        <img
                          src={addCacheBusting(func.imageUrl)}
                          alt={func.name}
                          className="option-avatar function-avatar"
                        />
                      ) : (
                        <div className="option-icon-placeholder function-icon-placeholder">
                          <i className="fa-solid fa-briefcase"></i>
                        </div>
                      )}
                      <div className="option-info">
                        <span className="option-title">{func.name}</span>
                      </div>
                      {novoPapelResponsibilityId === func.id && (
                        <i className="fa-solid fa-check check-icon"></i>
                      )}
                    </div>
                  ))}
                  {availableFunctions.length === 0 && (
                    <div className="empty-state" style={{ padding: '20px' }}>
                      <p>Nenhuma função disponível.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-group-row" style={{ marginTop: '20px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>
                  <i className="fa-solid fa-users"></i> Quantidade *
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={novoPapelQuantidade}
                  onChange={e => {
                    const newQuantity = Math.max(1, parseInt(e.target.value) || 1)
                    setNovoPapelQuantidade(newQuantity)
                    // Se a quantidade for reduzida e houver mais pessoas selecionadas, remover as excedentes
                    if (novoPapelIsFixo && novoPapelPessoasFixas.length > newQuantity) {
                      setNovoPapelPessoasFixas(novoPapelPessoasFixas.slice(0, newQuantity))
                      toast.showInfo(`${novoPapelPessoasFixas.length - newQuantity} pessoa(s) removida(s) para ajustar à nova quantidade`)
                    }
                  }}
                  min="1"
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1, marginLeft: '15px' }}>
                <label>
                  <i className="fa-solid fa-star"></i> Prioridade *
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={novoPapelPrioridade}
                  onChange={e => setNovoPapelPrioridade(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  required
                />
                <small className="form-help">Número menor = maior prioridade</small>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="checkbox-label-custom">
                <div className={`checkbox-wrapper ${novoPapelIsFixo ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    className="checkbox-custom"
                    checked={novoPapelIsFixo}
                    onChange={(e) => {
                      setNovoPapelIsFixo(e.target.checked)
                      if (!e.target.checked) {
                        setNovoPapelPessoasFixas([])
                      }
                    }}
                  />
                  <span className="checkbox-custom-label">
                    <i className="fa-solid fa-lock"></i>
                    Fixo (pessoas específicas)
                  </span>
                </div>
                <small className="form-help">Marque para definir pessoas fixas para este papel</small>
              </label>
            </div>

            {novoPapelIsFixo && (
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>Pessoas Fixas *</label>
                <div className="selector-container">
                  <input
                    type="text"
                    placeholder="Buscar pessoa por nome..."
                    className="search-input"
                    onChange={(e) => {
                      const term = e.target.value.toLowerCase();
                      const items = document.querySelectorAll('.person-item');
                      items.forEach((item: any) => {
                        const name = item.getAttribute('data-name').toLowerCase();
                        if (name.includes(term)) {
                          item.style.display = 'flex';
                        } else {
                          item.style.display = 'none';
                        }
                      });
                    }}
                  />
                  <div className="list-container">
                    {availablePersons.map(p => {
                      const isSelected = novoPapelPessoasFixas.includes(p.personId)
                      const isMaxReached = novoPapelIsFixo && !isSelected && novoPapelPessoasFixas.length >= novoPapelQuantidade
                      
                      return (
                      <div
                        key={p.id}
                        className={`option-item person-item ${isSelected ? 'selected' : ''} ${isMaxReached ? 'disabled' : ''}`}
                        onClick={() => {
                          if (isMaxReached) {
                            toast.showError(`Você já selecionou o máximo de ${novoPapelQuantidade} pessoa(s) fixa(s)`)
                            return
                          }
                          if (isSelected) {
                            setNovoPapelPessoasFixas(novoPapelPessoasFixas.filter(id => id !== p.personId))
                          } else {
                            if (novoPapelIsFixo && novoPapelPessoasFixas.length >= novoPapelQuantidade) {
                              toast.showError(`Você já selecionou o máximo de ${novoPapelQuantidade} pessoa(s) fixa(s)`)
                              return
                            }
                            setNovoPapelPessoasFixas([...novoPapelPessoasFixas, p.personId])
                          }
                        }}
                        data-name={p.person?.fullName || ''}
                        title={isMaxReached ? `Limite de ${novoPapelQuantidade} pessoa(s) atingido` : ''}
                      >
                        {p.person?.photoUrl ? (
                          <img
                            src={addCacheBusting(p.person.photoUrl)}
                            alt={p.person.fullName}
                            className="option-avatar"
                          />
                        ) : (
                          <div className="option-icon-placeholder">
                            {p.person?.fullName?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                        <div className="option-info">
                          <span className="option-title">{p.person?.fullName || 'Sem nome'}</span>
                          <span className="option-subtitle">
                            {p.responsibilities && p.responsibilities.length > 0
                              ? p.responsibilities.map(r => r.name).join(', ')
                              : 'Sem função principal'}
                          </span>
                        </div>
                        {isSelected && (
                          <i className="fa-solid fa-check check-icon"></i>
                        )}
                      </div>
                    )
                    })}
                    {availablePersons.length === 0 && (
                      <div className="empty-state" style={{ padding: '20px' }}>
                        <p>Nenhuma pessoa disponível.</p>
                      </div>
                    )}
                  </div>
                </div>
                <small className="form-help">
                  {novoPapelPessoasFixas.length > 0 
                    ? `Selecionado: ${novoPapelPessoasFixas.length} de ${novoPapelQuantidade} pessoa(s)`
                    : `Selecione até ${novoPapelQuantidade} pessoa(s) fixa(s) para este papel.`}
                  {novoPapelPessoasFixas.length >= novoPapelQuantidade && (
                    <span style={{ color: 'var(--color-teal)', marginLeft: '8px' }}>
                      <i className="fa-solid fa-check-circle"></i> Limite atingido
                    </span>
                  )}
                </small>
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowAddPapelModal(false)
                  setNovoPapelResponsibilityId('')
                  setNovoPapelQuantidade(1)
                  setNovoPapelPrioridade(1)
                  setNovoPapelIsFixo(false)
                  setNovoPapelPessoasFixas([])
                }}
              >
                <i className="fa-solid fa-times"></i> Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={
                  !novoPapelResponsibilityId || 
                  novoPapelQuantidade < 1 || 
                  (novoPapelIsFixo && novoPapelPessoasFixas.length === 0) ||
                  (novoPapelIsFixo && novoPapelPessoasFixas.length > novoPapelQuantidade)
                }
              >
                <i className="fa-solid fa-check"></i> Adicionar Papel
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmModal
        isOpen={showDeleteEquipeModal}
        title="Excluir Equipe"
        message={`Tem certeza que deseja excluir a equipe "${equipeParaDeletar?.name}"? Todos os papéis serão removidos.`}
        onConfirm={handleDeleteEquipe}
        onCancel={() => {
          setShowDeleteEquipeModal(false)
          setEquipeParaDeletar(null)
        }}
      />
    </div>
  )
}
