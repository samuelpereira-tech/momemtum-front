import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useToast } from '../../../../../components/ui/Toast/ToastProvider'
import ConfirmModal from '../../../../../components/ui/ConfirmModal/ConfirmModal'
import { personService, type PersonResponseDto } from '../../../../../services/basic/personService'
import { responsibilityService, type ResponsibilityResponseDto } from '../../../../../services/basic/responsibilityService'
import { personAreaService, type PersonAreaResponseDto, type ResponsibilityInfoDto } from '../../../../../services/basic/personAreaService'
import { addCacheBusting } from '../../../../../utils/fileUtils'
import { withCache, clearCache } from '../../../../../utils/apiCache'
import Modal from '../shared/Modal'
import '../shared/TabPanel.css'
import './PessoasTabPanel.css'

// Interface para pessoa com seus papéis (responsabilidades) na área
interface PersonWithRoles {
  personAreaId: string
  person: PersonResponseDto
  roles: ResponsibilityInfoDto[]
}

export default function PessoasTabPanel() {
  const { id: scheduledAreaId } = useParams<{ id: string }>()
  const toast = useToast()
  const [personsWithRoles, setPersonsWithRoles] = useState<PersonWithRoles[]>([])
  const [availablePersons, setAvailablePersons] = useState<PersonResponseDto[]>([])
  const [availableRoles, setAvailableRoles] = useState<ResponsibilityResponseDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showDeletePessoaModal, setShowDeletePessoaModal] = useState(false)
  const [editingPerson, setEditingPerson] = useState<PersonWithRoles | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPerson, setSelectedPerson] = useState<PersonResponseDto | null>(null)
  const [selectedPersons, setSelectedPersons] = useState<PersonResponseDto[]>([])
  const [pessoaParaRemover, setPessoaParaRemover] = useState<{ personAreaId: string; personName: string } | null>(null)
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])

  const loadData = useCallback(async () => {
    if (!scheduledAreaId) return
    
    setIsLoading(true)
    try {
      // Carregar todos os dados em paralelo e aguardar todos antes de atualizar o estado
      const [todasPessoas, rolesResponse, todasPersonAreas] = await Promise.all([
        // Carregar todas as pessoas com cache
        withCache(
          'all-persons',
          async () => {
            let pessoas: PersonResponseDto[] = []
            let pagina = 1
            let temMaisPaginas = true
            const limitePorRequisicao = 100

            while (temMaisPaginas) {
              const response = await personService.getAllPersons(pagina, limitePorRequisicao)
              pessoas = [...pessoas, ...response.data]
              
              if (pagina >= response.totalPages || response.data.length === 0) {
                temMaisPaginas = false
              } else {
                pagina++
              }
            }
            return pessoas
          }
        ),
        // Carregar funções (responsabilidades) da área com cache
        withCache(
          `responsibilities-${scheduledAreaId}`,
          () => responsibilityService.getAllResponsibilities({
            scheduledAreaId,
            limit: 100
          })
        ),
        // Carregar pessoas associadas à área com cache
        withCache(
          `person-areas-${scheduledAreaId}`,
          async () => {
            let personAreas: PersonAreaResponseDto[] = []
            let paginaPersonAreas = 1
            let temMaisPaginasPersonAreas = true
            const limitePersonAreas = 100

            while (temMaisPaginasPersonAreas) {
              const personAreasResponse = await personAreaService.getPersonsInArea(scheduledAreaId, {
                page: paginaPersonAreas,
                limit: limitePersonAreas
              })
              personAreas = [...personAreas, ...personAreasResponse.data]
              
              if (paginaPersonAreas >= personAreasResponse.meta.totalPages || personAreasResponse.data.length === 0) {
                temMaisPaginasPersonAreas = false
              } else {
                paginaPersonAreas++
              }
            }
            return personAreas
          }
        )
      ])

      // Converter PersonAreaResponseDto para PersonWithRoles
      const personsWithRolesData: PersonWithRoles[] = todasPersonAreas.map((personArea) => {
        // Buscar a pessoa completa na lista de pessoas disponíveis
        const person = todasPessoas.find(p => p.id === personArea.personId)
        
        // Se não encontrar, usar os dados básicos do personArea.person
        const personData: PersonResponseDto = person || {
          id: personArea.personId,
          fullName: personArea.person?.fullName || '',
          email: personArea.person?.email || '',
          phone: '',
          cpf: '',
          birthDate: '',
          emergencyContact: '',
          address: '',
          photoUrl: personArea.person?.photoUrl || null,
          createdAt: personArea.createdAt,
          updatedAt: personArea.updatedAt
        }

        return {
          personAreaId: personArea.id,
          person: personData,
          roles: personArea.responsibilities
        }
      })

      // Atualizar todos os estados de uma vez
      // React 18+ faz batching automático de setState dentro de callbacks assíncronos
      // Isso resulta em um único re-render ao invés de três
      setAvailablePersons(todasPessoas)
      setAvailableRoles(rolesResponse.data)
      setPersonsWithRoles(personsWithRolesData)
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      toast.showError(error.message || 'Erro ao carregar dados')
    } finally {
      setIsLoading(false)
    }
  }, [scheduledAreaId, toast])

  useEffect(() => {
    if (scheduledAreaId) {
      loadData()
    }
  }, [scheduledAreaId, loadData])

  const handleAdicionarPessoa = () => {
    setEditingPerson(null)
    setSelectedPerson(null)
    setSelectedPersons([])
    setSelectedRoleIds([])
    setSearchTerm('')
    setShowModal(true)
  }

  const handleEditarPessoa = (personWithRoles: PersonWithRoles) => {
    setEditingPerson(personWithRoles)
    setSelectedPerson(personWithRoles.person)
    setSelectedRoleIds(personWithRoles.roles.map(r => r.id))
    setSearchTerm('')
    setShowModal(true)
  }

  const handleRemoverPessoa = (personAreaId: string, personName: string) => {
    if (!scheduledAreaId) return
    
    setPessoaParaRemover({ personAreaId, personName })
    setShowDeletePessoaModal(true)
  }

  const confirmRemoverPessoa = async () => {
    if (!scheduledAreaId || !pessoaParaRemover) return

    try {
      await personAreaService.removePersonFromArea(scheduledAreaId, pessoaParaRemover.personAreaId)
      
      // Remover da lista imediatamente
      setPersonsWithRoles(prev => prev.filter(p => p.personAreaId !== pessoaParaRemover.personAreaId))
      
      // Invalidar cache para garantir dados atualizados
      clearCache(`person-areas-${scheduledAreaId}`)
      
      setShowDeletePessoaModal(false)
      setPessoaParaRemover(null)
      toast.showSuccess(`${pessoaParaRemover.personName} removido(a) da área com sucesso!`)
    } catch (error: any) {
      console.error('Erro ao remover pessoa:', error)
      toast.showError(error.message || 'Erro ao remover pessoa')
    }
  }

  const handleToggleRole = (roleId: string) => {
    setSelectedRoleIds(prev => {
      if (prev.includes(roleId)) {
        return prev.filter(id => id !== roleId)
      } else {
        return [...prev, roleId]
      }
    })
  }

  const handleSelectPerson = (person: PersonResponseDto) => {
    if (editingPerson) {
      // No modo de edição, seleciona apenas uma pessoa
      setSelectedPerson(person)
      setSearchTerm('')
    } else {
      // No modo de adicionar, permite seleção múltipla
      setSelectedPersons(prev => {
        const isSelected = prev.some(p => p.id === person.id)
        if (isSelected) {
          return prev.filter(p => p.id !== person.id)
        } else {
          return [...prev, person]
        }
      })
    }
  }

  const handleSavePerson = async () => {
    if (editingPerson) {
      // Modo de edição: apenas uma pessoa
      if (!scheduledAreaId || !selectedPerson) {
        toast.showError('Selecione uma pessoa')
        return
      }

      try {
        // Atualizar responsabilidades da pessoa na área
        const updatedPersonArea = await personAreaService.updatePersonArea(
          scheduledAreaId,
          editingPerson.personAreaId,
          { responsibilityIds: selectedRoleIds }
        )

        // Buscar a pessoa completa
        const person = availablePersons.find(p => p.id === selectedPerson.id) || selectedPerson

        // Converter para PersonWithRoles
        const updatedPersonWithRoles: PersonWithRoles = {
          personAreaId: updatedPersonArea.id,
          person: person,
          roles: updatedPersonArea.responsibilities
        }

        // Atualizar na lista (a ordenação será feita pelo useMemo)
        setPersonsWithRoles(prev => 
          prev.map(p => 
            p.personAreaId === editingPerson.personAreaId 
              ? updatedPersonWithRoles
              : p
          )
        )
        
        // Invalidar cache para garantir dados atualizados
        clearCache(`person-areas-${scheduledAreaId}`)
        
        toast.showSuccess('Pessoa atualizada com sucesso!')
        
        setShowModal(false)
        setEditingPerson(null)
        setSelectedPerson(null)
        setSelectedRoleIds([])
      } catch (error: any) {
        console.error('Erro ao salvar pessoa:', error)
        const errorMessage = error.message || 'Erro ao salvar pessoa'
        
        // Tratar erros específicos da API
        if (errorMessage.includes('409') || errorMessage.includes('Conflict')) {
          toast.showError('Esta pessoa já está associada à área')
        } else if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
          toast.showError('Dados inválidos. Verifique se as funções pertencem à área')
        } else {
          toast.showError(errorMessage)
        }
      }
    } else {
      // Modo de adicionar: múltiplas pessoas
      if (!scheduledAreaId || selectedPersons.length === 0) {
        toast.showError('Selecione pelo menos uma pessoa')
        return
      }

      try {
        const personsToAdd = selectedPersons.length
        let successCount = 0
        let errorCount = 0
        const errors: string[] = []

        // Adicionar todas as pessoas selecionadas
        const addPromises = selectedPersons.map(async (person) => {
          try {
            const newPersonArea = await personAreaService.addPersonToArea(scheduledAreaId, {
              personId: person.id,
              responsibilityIds: selectedRoleIds
            })

            // Buscar a pessoa completa
            const personData = availablePersons.find(p => p.id === person.id) || person

            // Converter para PersonWithRoles
            const newPersonWithRoles: PersonWithRoles = {
              personAreaId: newPersonArea.id,
              person: personData,
              roles: newPersonArea.responsibilities
            }

            return newPersonWithRoles
          } catch (error: any) {
            errorCount++
            const errorMessage = error.message || 'Erro ao adicionar pessoa'
            if (errorMessage.includes('409') || errorMessage.includes('Conflict')) {
              errors.push(`${person.fullName}: já está associada à área`)
            } else {
              errors.push(`${person.fullName}: ${errorMessage}`)
            }
            return null
          }
        })

        const results = await Promise.all(addPromises)
        const successfulPersons = results.filter((p): p is PersonWithRoles => p !== null)
        successCount = successfulPersons.length

        // Adicionar pessoas bem-sucedidas à lista
        if (successfulPersons.length > 0) {
          setPersonsWithRoles(prev => [...prev, ...successfulPersons])
          clearCache(`person-areas-${scheduledAreaId}`)
        }

        // Mostrar mensagens de sucesso/erro
        if (successCount === personsToAdd) {
          toast.showSuccess(`${successCount} pessoa(s) adicionada(s) à área com sucesso!`)
        } else if (successCount > 0) {
          toast.showError(
            `${successCount} pessoa(s) adicionada(s), ${errorCount} erro(s). ${errors.join('; ')}`
          )
        } else {
          toast.showError(`Erro ao adicionar pessoas: ${errors.join('; ')}`)
        }

        setShowModal(false)
        setSelectedPersons([])
        setSelectedRoleIds([])
        setSearchTerm('')
      } catch (error: any) {
        console.error('Erro ao salvar pessoas:', error)
        toast.showError(error.message || 'Erro ao adicionar pessoas')
      }
    }
  }

  // Filtrar pessoas disponíveis (excluir as que já estão na área quando não estiver editando)
  const filteredAvailablePersons: PersonResponseDto[] = useMemo(() => {
    const personsInAreaIds = new Set(personsWithRoles.map(p => p.person.id))
    const searchTermLower = searchTerm.toLowerCase()
    
    return availablePersons.filter(person => {
      // Filtrar por termo de busca (com verificação de null/undefined)
      const fullName = person.fullName || ''
      const email = person.email || ''
      const matchesSearch = fullName.toLowerCase().includes(searchTermLower) ||
        email.toLowerCase().includes(searchTermLower)
      
      if (!matchesSearch) return false
      
      // Se estiver editando, mostrar todas as pessoas (incluindo a que está sendo editada)
      if (editingPerson) return true
      
      // Se não estiver editando, excluir pessoas que já estão na área
      return !personsInAreaIds.has(person.id)
    })
  }, [availablePersons, searchTerm, personsWithRoles, editingPerson])

  const isPersonSelected = (personId: string): boolean => {
    if (editingPerson) {
      return selectedPerson !== null && selectedPerson.id === personId
    } else {
      return selectedPersons.some(p => p.id === personId)
    }
  }

  // Ordenar pessoas alfabeticamente usando useMemo para evitar re-ordenação desnecessária
  const sortedPersonsWithRoles = useMemo(() => {
    return [...personsWithRoles].sort((a, b) => 
      a.person.fullName.localeCompare(b.person.fullName)
    )
  }, [personsWithRoles])

  return (
    <div className="tab-panel">
      <div className="tab-panel-header">
        <h3 className="tab-panel-title">
          <i className="fa-solid fa-user-plus"></i> Pessoas na Área
        </h3>
        <button className="btn-primary" onClick={handleAdicionarPessoa}>
          <i className="fa-solid fa-plus"></i> Adicionar Pessoa
        </button>
      </div>
      <div className="tab-panel-body">
        {isLoading ? (
          <div className="empty-state">
            <i className="fa-solid fa-spinner fa-spin"></i>
            <p>Carregando pessoas...</p>
          </div>
        ) : personsWithRoles.length === 0 ? (
          <div className="empty-state">
            <i className="fa-solid fa-user-plus"></i>
            <p>Nenhuma pessoa adicionada à área</p>
            <button className="btn-secondary" onClick={handleAdicionarPessoa}>
              <i className="fa-solid fa-plus"></i> Adicionar Primeira Pessoa
            </button>
          </div>
        ) : (
          <div className="area-persons-list">
            {sortedPersonsWithRoles.map((personWithRoles) => (
                <div key={personWithRoles.personAreaId} className="area-person-group-card">
                  <div className="area-person-card-header">
                    <div className="area-person-photo-container">
                      {personWithRoles.person.photoUrl ? (
                        <img 
                          src={addCacheBusting(personWithRoles.person.photoUrl)} 
                          alt={personWithRoles.person.fullName}
                          className="area-person-photo"
                        />
                      ) : (
                        <div className="area-person-photo-placeholder">
                          {personWithRoles.person.fullName?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="area-person-info">
                    <h4 className="area-person-name" title={personWithRoles.person.fullName}>
                      {personWithRoles.person.fullName}
                    </h4>
                    <p className="area-person-email" title={personWithRoles.person.email}>
                      {personWithRoles.person.email}
                    </p>

                    {/* Renderiza múltiplas funções */}
                    <div className="area-person-roles">
                      {personWithRoles.roles.length === 0 ? (
                        <span className="area-person-role-badge">Sem função</span>
                      ) : (
                        personWithRoles.roles.map((role) => (
                          <span key={role.id} className="area-person-role-badge has-role">
                            {role.imageUrl ? (
                              <img 
                                src={addCacheBusting(role.imageUrl)} 
                                alt={role.name}
                                className="area-person-role-badge-image"
                              />
                            ) : null}
                            {role.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="area-person-actions">
                    <button
                      className="btn-icon btn-icon-edit"
                      onClick={() => handleEditarPessoa(personWithRoles)}
                      title="Editar funções da pessoa"
                    >
                      <i className="fa-solid fa-pencil"></i>
                    </button>
                    <button
                      className="btn-icon btn-icon-delete"
                      onClick={() => handleRemoverPessoa(personWithRoles.personAreaId, personWithRoles.person.fullName)}
                      title="Remover pessoa da área"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {showModal && scheduledAreaId && (
        <Modal
          title={editingPerson ? 'Editar Funções da Pessoa' : 'Adicionar Pessoa à Área'}
          onClose={() => {
            setShowModal(false)
            setEditingPerson(null)
            setSelectedPerson(null)
            setSelectedPersons([])
            setSelectedRoleIds([])
            setSearchTerm('')
          }}
        >
          <form onSubmit={(e) => {
            e.preventDefault()
            handleSavePerson()
          }}>
            {!editingPerson && (
              <div className="form-group">
                <label>
                  <i className="fa-solid fa-user"></i> Buscar Pessoa *
                  {selectedPersons.length > 0 && (
                    <span className="selected-count">({selectedPersons.length} selecionada(s))</span>
                  )}
                </label>
                <div className="person-select-container">
                  <input
                    type="text"
                    className="person-search-input"
                    placeholder="Buscar pessoa por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="person-select-list">
                    {filteredAvailablePersons.length === 0 ? (
                      <div className="person-select-empty">
                        {searchTerm ? 'Nenhuma pessoa encontrada' : 'Digite para buscar pessoas'}
                      </div>
                    ) : (
                      filteredAvailablePersons.map((person: PersonResponseDto) => {
                        const isSelected = isPersonSelected(person.id)
                        return (
                          <div
                            key={person.id}
                            className={`person-select-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleSelectPerson(person)}
                          >
                            <div className="person-select-photo">
                              {person.photoUrl ? (
                                <img src={addCacheBusting(person.photoUrl)} alt={person.fullName} />
                              ) : (
                                <div className="person-select-photo-placeholder">
                                  <i className="fa-solid fa-user"></i>
                                </div>
                              )}
                            </div>
                            <div className="person-select-info">
                              <div className="person-select-name">{person.fullName}</div>
                              <div className="person-select-email">{person.email}</div>
                            </div>
                            {isSelected && (
                              <i className="fa-solid fa-check person-select-check"></i>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
                {selectedPersons.length > 0 && (
                  <div className="selected-persons-preview">
                    <div className="selected-persons-list">
                      {selectedPersons.map((person) => (
                        <div key={person.id} className="selected-person-chip">
                          <div className="selected-person-chip-photo">
                            {person.photoUrl ? (
                              <img src={addCacheBusting(person.photoUrl)} alt={person.fullName} />
                            ) : (
                              <div className="selected-person-chip-photo-placeholder">
                                {person.fullName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="selected-person-chip-name">{person.fullName}</span>
                          <button
                            type="button"
                            className="selected-person-chip-remove"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedPersons(prev => prev.filter(p => p.id !== person.id))
                            }}
                          >
                            <i className="fa-solid fa-times"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {editingPerson && selectedPerson && (
              <div className="form-group">
                <label>
                  <i className="fa-solid fa-user"></i> Pessoa
                </label>
                <div className="person-display">
                  <div className="person-display-photo">
                    {editingPerson?.person.photoUrl || selectedPerson?.photoUrl ? (
                      <img 
                        src={addCacheBusting(editingPerson?.person.photoUrl || selectedPerson!.photoUrl!)} 
                        alt={editingPerson?.person.fullName || selectedPerson!.fullName} 
                      />
                    ) : (
                      <div className="person-display-photo-placeholder">
                        <i className="fa-solid fa-user"></i>
                      </div>
                    )}
                  </div>
                  <div className="person-display-info">
                    <div className="person-display-name">
                      {editingPerson?.person.fullName || selectedPerson?.fullName}
                    </div>
                    <div className="person-display-email">
                      {editingPerson?.person.email || selectedPerson?.email}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label>
                <i className="fa-solid fa-briefcase"></i> Funções (opcional)
              </label>
              {availableRoles.length === 0 ? (
                <div className="empty-state">
                  <i className="fa-solid fa-briefcase"></i>
                  <p>Nenhuma função cadastrada na área</p>
                  <small className="form-help-text">
                    Você pode adicionar a pessoa sem funções ou cadastrar funções na aba "Função"
                  </small>
                </div>
              ) : (
                <>
                  <div className="roles-checkbox-list">
                    {availableRoles.map((role) => (
                      <label key={role.id} className="role-checkbox-item">
                        <input
                          type="checkbox"
                          checked={selectedRoleIds.includes(role.id)}
                          onChange={() => handleToggleRole(role.id)}
                        />
                        <span className="role-checkbox-label">{role.name}</span>
                      </label>
                    ))}
                  </div>
                  {selectedRoleIds.length === 0 && (
                    <small className="form-help-text">
                      Nenhuma função selecionada (opcional)
                    </small>
                  )}
                  {selectedRoleIds.length > 0 && (
                    <small className="form-help-text">
                      {selectedRoleIds.length} função(ões) selecionada(s)
                    </small>
                  )}
                </>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowModal(false)
                  setEditingPerson(null)
                  setSelectedPerson(null)
                  setSelectedPersons([])
                  setSelectedRoleIds([])
                  setSearchTerm('')
                }}
              >
                <i className="fa-solid fa-times"></i> Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={
                  (editingPerson ? !selectedPerson : selectedPersons.length === 0)
                }
              >
                <i className="fa-solid fa-check"></i> {editingPerson ? 'Salvar' : `Adicionar ${selectedPersons.length > 0 ? `(${selectedPersons.length})` : ''}`}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmModal
        isOpen={showDeletePessoaModal}
        title="Remover Pessoa da Área"
        message={pessoaParaRemover ? `Tem certeza que deseja remover ${pessoaParaRemover.personName} da área?` : ''}
        onConfirm={confirmRemoverPessoa}
        onCancel={() => {
          setShowDeletePessoaModal(false)
          setPessoaParaRemover(null)
        }}
      />
    </div>
  )
}

