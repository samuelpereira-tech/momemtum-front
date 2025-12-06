import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import '../shared/TabPanel.css'
import './GruposTabPanel.css'
import ConfirmModal from '../../../../../components/ui/ConfirmModal/ConfirmModal'
import { responsibilityService, type ResponsibilityResponseDto } from '../../../../../services/basic/responsibilityService'
import { personAreaService, type PersonAreaResponseDto } from '../../../../../services/basic/personAreaService'
import { groupService, type GroupResponseDto } from '../../../../../services/basic/groupService'
import { groupMemberService, type GroupMemberResponseDto } from '../../../../../services/basic/groupMemberService'
import { useToast } from '../../../../../components/ui/Toast/ToastProvider'
import { addCacheBusting } from '../../../../../utils/fileUtils'
import { withCache, clearCache } from '../../../../../utils/apiCache'
import Modal from '../shared/Modal'

export default function GruposTabPanel() {
  const { id: scheduledAreaId } = useParams<{ id: string }>()
  const toast = useToast()

  // Estados
  const [grupos, setGrupos] = useState<GroupResponseDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [availableFunctions, setAvailableFunctions] = useState<ResponsibilityResponseDto[]>([])
  const [availablePersons, setAvailablePersons] = useState<PersonAreaResponseDto[]>([])
  const [grupoSelecionado, setGrupoSelecionado] = useState<GroupResponseDto | null>(null)
  const [membrosDoGrupo, setMembrosDoGrupo] = useState<GroupMemberResponseDto[]>([])

  // Modais Estado
  const [showAddGrupoModal, setShowAddGrupoModal] = useState(false)
  const [showAddPessoaModal, setShowAddPessoaModal] = useState(false)
  const [showDeleteGrupoModal, setShowDeleteGrupoModal] = useState(false)
  const [showEditGrupoModal, setShowEditGrupoModal] = useState(false)
  const [showDeleteMembroModal, setShowDeleteMembroModal] = useState(false)
  const [grupoParaDeletar, setGrupoParaDeletar] = useState<GroupResponseDto | null>(null)
  const [grupoParaEditar, setGrupoParaEditar] = useState<GroupResponseDto | null>(null)
  const [membroParaDeletar, setMembroParaDeletar] = useState<string | null>(null)

  // Form States
  const [novoGrupoNome, setNovoGrupoNome] = useState('')
  const [novoGrupoDescricao, setNovoGrupoDescricao] = useState('')
  const [editGrupoNome, setEditGrupoNome] = useState('')
  const [editGrupoDescricao, setEditGrupoDescricao] = useState('')

  const [novaPessoaId, setNovaPessoaId] = useState('')
  const [novasFuncoesIds, setNovasFuncoesIds] = useState<string[]>([])

  // Refs para evitar chamadas duplicadas durante StrictMode
  const loadingGroupsRef = useRef(false)
  const loadingMembersRef = useRef<string | null>(null)

  const loadMembrosDoGrupo = useCallback(async (groupId: string) => {
    if (!scheduledAreaId || loadingMembersRef.current === groupId) return
    
    loadingMembersRef.current = groupId
    try {
      const allMembers = await withCache(
        `group-members-${scheduledAreaId}-${groupId}`,
        async () => {
          let members: GroupMemberResponseDto[] = []
          let page = 1
          let hasMore = true
          const limit = 100

          while (hasMore) {
            const response = await groupMemberService.getMembersInGroup(
              scheduledAreaId,
              groupId,
              { page, limit }
            )
            members = [...members, ...response.data]

            if (page >= response.meta.totalPages || response.data.length === 0) {
              hasMore = false
            } else {
              page++
            }
          }
          return members
        }
      )

      setMembrosDoGrupo(allMembers)
    } catch (error: any) {
      console.error('Erro ao carregar membros:', error)
      toast.showError(error.message || 'Erro ao carregar membros do grupo')
    } finally {
      loadingMembersRef.current = null
    }
  }, [scheduledAreaId, toast])

  const loadGroups = useCallback(async () => {
    if (!scheduledAreaId || loadingGroupsRef.current) return
    
    loadingGroupsRef.current = true
    try {
      const allGroups = await withCache(
        `groups-${scheduledAreaId}`,
        async () => {
          let groups: GroupResponseDto[] = []
          let page = 1
          let hasMore = true
          const limit = 100

          while (hasMore) {
            const response = await groupService.getGroupsInArea(scheduledAreaId, {
              page,
              limit,
            })
            groups = [...groups, ...response.data]

            if (page >= response.meta.totalPages || response.data.length === 0) {
              hasMore = false
            } else {
              page++
            }
          }
          return groups
        }
      )

      setGrupos(allGroups)
      
      // Atualizar grupo selecionado usando função de callback para acessar o estado atual
      setGrupoSelecionado(prev => {
        if (prev) {
          const updated = allGroups.find(g => g.id === prev.id)
          if (updated) {
            // Carregar membros do grupo atualizado
            loadMembrosDoGrupo(updated.id)
            return updated
          } else {
            setMembrosDoGrupo([])
            return null
          }
        }
        return prev
      })
    } catch (error: any) {
      console.error('Erro ao carregar grupos:', error)
      toast.showError(error.message || 'Erro ao carregar grupos')
    } finally {
      loadingGroupsRef.current = false
    }
  }, [scheduledAreaId, toast, loadMembrosDoGrupo])

  const loadFunctions = useCallback(async () => {
    if (!scheduledAreaId) return
    try {
      const response = await withCache(
        `responsibilities-${scheduledAreaId}`,
        () => responsibilityService.getAllResponsibilities({
          scheduledAreaId,
          limit: 100
        })
      )
      setAvailableFunctions(response.data)
    } catch (error) {
      console.error('Erro ao carregar funções:', error)
      toast.showError('Erro ao carregar lista de funções')
    }
  }, [scheduledAreaId, toast])

  const loadPersons = useCallback(async () => {
    if (!scheduledAreaId) return
    try {
      const allPersons = await withCache(
        `person-areas-${scheduledAreaId}`,
        async () => {
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
          return persons
        }
      )

      setAvailablePersons(allPersons)
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
        loadGroups(),
        loadFunctions(),
        loadPersons()
      ])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setIsLoading(false)
    }
  }, [scheduledAreaId, loadGroups, loadFunctions, loadPersons])

  useEffect(() => {
    if (scheduledAreaId) {
      loadData()
    }
  }, [scheduledAreaId, loadData])

  // Handlers Grupo
  const handleSaveGrupo = async () => {
    if (!scheduledAreaId || !novoGrupoNome.trim()) {
      toast.showError('Nome do grupo é obrigatório')
      return
    }

    try {
      const newGroup = await groupService.createGroup(scheduledAreaId, {
        name: novoGrupoNome.trim(),
        description: novoGrupoDescricao.trim() || undefined
      })

      setGrupos([...grupos, newGroup])
      clearCache(`groups-${scheduledAreaId}`)
      setNovoGrupoNome('')
      setNovoGrupoDescricao('')
      setShowAddGrupoModal(false)
      toast.showSuccess('Grupo criado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao criar grupo:', error)
      const errorMessage = error.message || 'Erro ao criar grupo'
      
      if (errorMessage.includes('409') || errorMessage.includes('Conflict')) {
        toast.showError('Já existe um grupo com este nome na área')
      } else {
        toast.showError(errorMessage)
      }
    }
  }

  const handleEditGrupo = async () => {
    if (!scheduledAreaId || !grupoParaEditar || !editGrupoNome.trim()) {
      toast.showError('Nome do grupo é obrigatório')
      return
    }

    try {
      const updatedGroup = await groupService.updateGroup(
        scheduledAreaId,
        grupoParaEditar.id,
        {
          name: editGrupoNome.trim(),
          description: editGrupoDescricao.trim() || undefined
        }
      )

      setGrupos(grupos.map(g => g.id === grupoParaEditar.id ? updatedGroup : g))
      clearCache(`groups-${scheduledAreaId}`)
      
      // Se o grupo editado era o selecionado, atualizar a seleção
      if (grupoSelecionado?.id === grupoParaEditar.id) {
        setGrupoSelecionado(updatedGroup)
      }
      
      setShowEditGrupoModal(false)
      setGrupoParaEditar(null)
      toast.showSuccess('Grupo atualizado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao atualizar grupo:', error)
      const errorMessage = error.message || 'Erro ao atualizar grupo'
      
      if (errorMessage.includes('409') || errorMessage.includes('Conflict')) {
        toast.showError('Já existe um grupo com este nome na área')
      } else {
        toast.showError(errorMessage)
      }
    }
  }

  const handleDeleteGrupo = async () => {
    if (!scheduledAreaId || !grupoParaDeletar) return

    try {
      await groupService.deleteGroup(scheduledAreaId, grupoParaDeletar.id)
      setGrupos(grupos.filter(g => g.id !== grupoParaDeletar.id))
      clearCache(`groups-${scheduledAreaId}`)
      if (grupoSelecionado?.id === grupoParaDeletar.id) {
        setGrupoSelecionado(null)
        setMembrosDoGrupo([])
      }
      setShowDeleteGrupoModal(false)
      setGrupoParaDeletar(null)
      toast.showSuccess('Grupo excluído com sucesso!')
    } catch (error: any) {
      console.error('Erro ao excluir grupo:', error)
      toast.showError(error.message || 'Erro ao excluir grupo')
    }
  }

  const confirmDeleteGrupo = (grupo: GroupResponseDto, e: React.MouseEvent) => {
    e.stopPropagation()
    setGrupoParaDeletar(grupo)
    setShowDeleteGrupoModal(true)
  }

  const handleSelectGrupo = async (grupo: GroupResponseDto) => {
    setGrupoSelecionado(grupo)
    await loadMembrosDoGrupo(grupo.id)
  }

  const handleOpenEditModal = (grupo: GroupResponseDto, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    // Selecionar o grupo se não estiver selecionado
    if (grupoSelecionado?.id !== grupo.id) {
      handleSelectGrupo(grupo)
    }
    setGrupoParaEditar(grupo)
    setEditGrupoNome(grupo.name)
    setEditGrupoDescricao(grupo.description || '')
    setShowEditGrupoModal(true)
  }

  // Funções auxiliares
  const getResponsibilityName = (responsibilityId: string): string => {
    const responsibility = availableFunctions.find(f => f.id === responsibilityId)
    return responsibility?.name || `Função ${responsibilityId}`
  }

  const getResponsibilityImage = (responsibilityId: string): string | null => {
    const responsibility = availableFunctions.find(f => f.id === responsibilityId)
    return responsibility?.imageUrl || null
  }

  // Handlers Pessoa
  const handleAddPessoa = async () => {
    if (!scheduledAreaId || !novaPessoaId || !grupoSelecionado) {
      toast.showError('Selecione uma pessoa')
      return
    }

    if (novasFuncoesIds.length === 0) {
      toast.showError('Selecione pelo menos uma função')
      return
    }

    try {
      await groupMemberService.addMemberToGroup(
        scheduledAreaId,
        grupoSelecionado.id,
        {
          personId: novaPessoaId,
          responsibilityIds: novasFuncoesIds
        }
      )

      // Invalidar cache e recarregar membros do grupo
      clearCache(`group-members-${scheduledAreaId}-${grupoSelecionado.id}`)
      clearCache(`groups-${scheduledAreaId}`)
      await loadMembrosDoGrupo(grupoSelecionado.id)
      await loadGroups()

      setNovaPessoaId('')
      setNovasFuncoesIds([])
      setShowAddPessoaModal(false)
      toast.showSuccess('Pessoa adicionada ao grupo com sucesso!')
    } catch (error: any) {
      console.error('Erro ao adicionar pessoa:', error)
      const errorMessage = error.message || 'Erro ao adicionar pessoa ao grupo'
      
      if (errorMessage.includes('409') || errorMessage.includes('Conflict')) {
        toast.showError('Esta pessoa já é membro deste grupo')
      } else if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
        toast.showError('Dados inválidos. Verifique se a pessoa está na área e se as funções pertencem à área')
      } else {
        toast.showError(errorMessage)
      }
    }
  }

  const handleRemoveMembro = (memberId: string) => {
    if (!scheduledAreaId || !grupoSelecionado) return

    setMembroParaDeletar(memberId)
    setShowDeleteMembroModal(true)
  }

  const confirmRemoveMembro = async () => {
    if (!scheduledAreaId || !grupoSelecionado || !membroParaDeletar) return

    try {
      await groupMemberService.removeMemberFromGroup(
        scheduledAreaId,
        grupoSelecionado.id,
        membroParaDeletar
      )

      // Invalidar cache e recarregar membros do grupo
      clearCache(`group-members-${scheduledAreaId}-${grupoSelecionado.id}`)
      clearCache(`groups-${scheduledAreaId}`)
      await loadMembrosDoGrupo(grupoSelecionado.id)
      await loadGroups()

      setShowDeleteMembroModal(false)
      setMembroParaDeletar(null)
      toast.showSuccess('Pessoa removida do grupo com sucesso!')
    } catch (error: any) {
      console.error('Erro ao remover membro:', error)
      toast.showError(error.message || 'Erro ao remover pessoa do grupo')
    }
  }

  return (
    <div className="tab-panel">
      {/* Lista de Grupos (Sidebar ou Grid) */}
      <div className="grupos-layout">
        <aside className="grupos-sidebar">
          <div className="grupos-sidebar-header">
            <h3>Grupos</h3>
            <button 
              className="btn-icon-primary" 
              onClick={() => {
                setNovoGrupoNome('')
                setNovoGrupoDescricao('')
                setShowAddGrupoModal(true)
              }} 
              title="Adicionar Grupo"
            >
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>
          <div className="grupos-list">
            {isLoading ? (
              <div className="empty-grupos">
                <i className="fa-solid fa-spinner fa-spin"></i> Carregando...
              </div>
            ) : grupos.length === 0 ? (
              <div className="empty-grupos">Nenhum grupo criado.</div>
            ) : (
              grupos.map(grupo => (
                <div
                  key={grupo.id}
                  className={`grupo-item ${grupoSelecionado?.id === grupo.id ? 'active' : ''}`}
                  onClick={() => handleSelectGrupo(grupo)}
                >
                  <div className="grupo-item-content">
                    <span className="grupo-name">{grupo.name}</span>
                    <span className="grupo-meta">{grupo.membersCount} membros</span>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      className="btn-icon-edit-sm"
                      onClick={(e) => handleOpenEditModal(grupo, e)}
                      title="Editar grupo"
                    >
                      <i className="fa-solid fa-pencil"></i>
                    </button>
                    <button
                      className="btn-icon-delete-sm"
                      onClick={(e) => confirmDeleteGrupo(grupo, e)}
                      title="Excluir grupo"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Detalhes do Grupo */}
        <div className="grupo-detalhes">
          {grupoSelecionado ? (
            <>
              <div className="grupo-header">
                <div>
                  <h2>{grupoSelecionado.name}</h2>
                  <p>{grupoSelecionado.description || 'Sem descrição'}</p>
                </div>
                <button 
                  className="btn-primary" 
                  onClick={() => {
                    setNovaPessoaId('')
                    setNovasFuncoesIds([])
                    setShowAddPessoaModal(true)
                  }}
                >
                  <i className="fa-solid fa-user-plus"></i> Adicionar Pessoa
                </button>
              </div>

              <div className="membros-list">
                <h3>Membros ({membrosDoGrupo.length})</h3>

                {membrosDoGrupo.length === 0 ? (
                  <div className="empty-state">
                    <i className="fa-solid fa-users" style={{ fontSize: '2.5rem', marginBottom: '15px' }}></i>
                    <p>Nenhum membro neste grupo.</p>
                  </div>
                ) : (
                  <div className="membros-grid">
                    {membrosDoGrupo.map(membro => (
                      <div key={membro.id} className="membro-card">
                        <div className="membro-card-header">
                          <div className="membro-photo-container">
                            {membro.person?.photoUrl ? (
                              <img
                                src={addCacheBusting(membro.person.photoUrl)}
                                alt={membro.person.fullName}
                                className="membro-photo"
                              />
                            ) : (
                              <div className="membro-photo-placeholder">
                                {membro.person?.fullName?.charAt(0).toUpperCase() || '?'}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="membro-info">
                          <h4 className="membro-name" title={membro.person?.fullName || ''}>
                            {membro.person?.fullName || 'Sem nome'}
                          </h4>
                          <p className="membro-cargo">{membro.person?.email || ''}</p>

                          {/* Renderiza múltiplas funções */}
                          <div className="membro-roles" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', marginBottom: '10px' }}>
                            {membro.responsibilities && membro.responsibilities.length > 0 ? (
                              membro.responsibilities.map((role) => {
                                const roleImage = getResponsibilityImage(role.id)
                                return (
                                  <span key={role.id} className="membro-role-badge has-role">
                                    {roleImage ? (
                                      <img 
                                        src={addCacheBusting(roleImage)} 
                                        alt={role.name}
                                        className="membro-role-badge-image"
                                      />
                                    ) : null}
                                    {role.name}
                                  </span>
                                )
                              })
                            ) : (
                              <span className="membro-role-badge">Membro</span>
                            )}
                          </div>
                        </div>

                        <div className="membro-actions">
                          <button
                            className="btn-remove-membro"
                            onClick={() => handleRemoveMembro(membro.id)}
                            title="Remover do grupo"
                          >
                            <i className="fa-solid fa-trash"></i> Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="grupo-placeholder">
              <i className="fa-solid fa-users-viewfinder"></i>
              <p>Selecione um grupo para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Adicionar Grupo */}
      {showAddGrupoModal && (
        <Modal
          title="Novo Grupo"
          onClose={() => {
            setShowAddGrupoModal(false)
            setNovoGrupoNome('')
            setNovoGrupoDescricao('')
          }}
        >
          <form onSubmit={(e) => {
            e.preventDefault()
            handleSaveGrupo()
          }}>
            <div className="form-group">
              <label>
                <i className="fa-solid fa-users"></i> Nome do Grupo *
              </label>
              <input
                type="text"
                className="form-control"
                value={novoGrupoNome}
                onChange={e => setNovoGrupoNome(e.target.value)}
                placeholder="Ex: Plantão A"
                required
              />
            </div>
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label>
                <i className="fa-solid fa-align-left"></i> Descrição (Opcional)
              </label>
              <textarea
                className="form-control"
                value={novoGrupoDescricao}
                onChange={e => setNovoGrupoDescricao(e.target.value)}
                placeholder="Descrição do grupo..."
                rows={3}
              />
            </div>
            <div className="form-actions">
              <button 
                type="button"
                className="btn-secondary" 
                onClick={() => {
                  setShowAddGrupoModal(false)
                  setNovoGrupoNome('')
                  setNovoGrupoDescricao('')
                }}
              >
                <i className="fa-solid fa-times"></i> Cancelar
              </button>
              <button 
                type="submit"
                className="btn-primary" 
                disabled={!novoGrupoNome.trim()}
              >
                <i className="fa-solid fa-check"></i> Criar Grupo
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Editar Grupo */}
      {showEditGrupoModal && grupoParaEditar && (
        <Modal
          title="Editar Grupo"
          onClose={() => {
            setShowEditGrupoModal(false)
            setGrupoParaEditar(null)
            setEditGrupoNome('')
            setEditGrupoDescricao('')
          }}
        >
          <form onSubmit={(e) => {
            e.preventDefault()
            handleEditGrupo()
          }}>
            <div className="form-group">
              <label>
                <i className="fa-solid fa-users"></i> Nome do Grupo *
              </label>
              <input
                type="text"
                className="form-control"
                value={editGrupoNome}
                onChange={e => setEditGrupoNome(e.target.value)}
                placeholder="Ex: Plantão A"
                required
              />
            </div>
            <div className="form-group">
              <label>
                <i className="fa-solid fa-align-left"></i> Descrição (Opcional)
              </label>
              <textarea
                className="form-control"
                value={editGrupoDescricao}
                onChange={e => setEditGrupoDescricao(e.target.value)}
                placeholder="Descrição do grupo..."
                rows={3}
              />
            </div>
            <div className="form-actions">
              <button 
                type="button"
                className="btn-secondary" 
                onClick={() => {
                  setShowEditGrupoModal(false)
                  setEditGrupoNome('')
                  setEditGrupoDescricao('')
                }}
              >
                <i className="fa-solid fa-times"></i> Cancelar
              </button>
              <button 
                type="submit"
                className="btn-primary" 
                disabled={!editGrupoNome.trim()}
              >
                <i className="fa-solid fa-check"></i> Salvar Alterações
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Adicionar Pessoa */}
      {showAddPessoaModal && grupoSelecionado && (
        <Modal
          title="Adicionar Pessoa ao Grupo"
          onClose={() => {
            setShowAddPessoaModal(false)
            setNovaPessoaId('')
            setNovasFuncoesIds([])
          }}
        >
          <form onSubmit={(e) => {
            e.preventDefault()
            handleAddPessoa()
          }}>
            <div className="form-group">
              <label>Pessoa *</label>
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
                  {availablePersons
                    .filter(p => !membrosDoGrupo.some(m => m.personId === p.personId))
                    .map(p => (
                      <div
                        key={p.id}
                        className={`option-item person-item ${novaPessoaId === p.personId ? 'selected' : ''}`}
                        onClick={() => setNovaPessoaId(p.personId)}
                        data-name={p.person?.fullName || ''}
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
                        {novaPessoaId === p.personId && (
                          <i className="fa-solid fa-check check-icon"></i>
                        )}
                      </div>
                    ))}
                  {availablePersons.filter(p => !membrosDoGrupo.some(m => m.personId === p.personId)).length === 0 && (
                    <div className="empty-state" style={{ padding: '20px' }}>
                      <p>Nenhuma pessoa disponível para adicionar.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label>Funções no Grupo *</label>
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
                      className={`option-item function-item ${novasFuncoesIds.includes(func.id) ? 'selected' : ''}`}
                      onClick={() => {
                        if (novasFuncoesIds.includes(func.id)) {
                          setNovasFuncoesIds(novasFuncoesIds.filter(id => id !== func.id))
                        } else {
                          setNovasFuncoesIds([...novasFuncoesIds, func.id])
                        }
                      }}
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
                      {novasFuncoesIds.includes(func.id) && (
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
              <small className="form-help">Selecione uma ou mais funções.</small>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowAddPessoaModal(false)
                  setNovaPessoaId('')
                  setNovasFuncoesIds([])
                }}
              >
                <i className="fa-solid fa-times"></i> Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={!novaPessoaId || novasFuncoesIds.length === 0}
              >
                <i className="fa-solid fa-check"></i> Adicionar Selecionado
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmModal
        isOpen={showDeleteGrupoModal}
        title="Excluir Grupo"
        message={`Tem certeza que deseja excluir o grupo "${grupoParaDeletar?.name}"? Todos os membros serão removidos do grupo.`}
        onConfirm={handleDeleteGrupo}
        onCancel={() => {
          setShowDeleteGrupoModal(false)
          setGrupoParaDeletar(null)
        }}
      />

      <ConfirmModal
        isOpen={showDeleteMembroModal}
        title="Remover Pessoa do Grupo"
        message="Tem certeza que deseja remover esta pessoa do grupo?"
        onConfirm={confirmRemoveMembro}
        onCancel={() => {
          setShowDeleteMembroModal(false)
          setMembroParaDeletar(null)
        }}
      />
    </div>
  )
}
