import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useToast } from '../../../../../components/ui/Toast/ToastProvider'
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
  const [editingPerson, setEditingPerson] = useState<PersonWithRoles | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPerson, setSelectedPerson] = useState<PersonResponseDto | null>(null)
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

  const handleRemoverPessoa = async (personAreaId: string, personName: string) => {
    if (!scheduledAreaId) return
    
    if (!confirm(`Tem certeza que deseja remover ${personName} da área?`)) {
      return
    }

    try {
      await personAreaService.removePersonFromArea(scheduledAreaId, personAreaId)
      
      // Remover da lista imediatamente
      setPersonsWithRoles(prev => prev.filter(p => p.personAreaId !== personAreaId))
      
      // Invalidar cache para garantir dados atualizados
      clearCache(`person-areas-${scheduledAreaId}`)
      
      toast.showSuccess(`${personName} removido(a) da área com sucesso!`)
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
    setSelectedPerson(person)
    setSearchTerm('')
  }

  const handleSavePerson = async () => {
    if (!scheduledAreaId || !selectedPerson) {
      toast.showError('Selecione uma pessoa')
      return
    }

    if (selectedRoleIds.length === 0) {
      toast.showError('Selecione pelo menos uma função')
      return
    }

    try {
      if (editingPerson) {
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
      } else {
        // Adicionar nova pessoa à área
        const newPersonArea = await personAreaService.addPersonToArea(scheduledAreaId, {
          personId: selectedPerson.id,
          responsibilityIds: selectedRoleIds
        })

        // Buscar a pessoa completa
        const person = availablePersons.find(p => p.id === selectedPerson.id) || selectedPerson

        // Converter para PersonWithRoles
        const newPersonWithRoles: PersonWithRoles = {
          personAreaId: newPersonArea.id,
          person: person,
          roles: newPersonArea.responsibilities
        }

        // Adicionar à lista (a ordenação será feita pelo useMemo)
        setPersonsWithRoles(prev => [...prev, newPersonWithRoles])
        
        // Invalidar cache para garantir dados atualizados na próxima vez
        clearCache(`person-areas-${scheduledAreaId}`)
        
        toast.showSuccess('Pessoa adicionada à área com sucesso!')
      }
      
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
  }

  const filteredAvailablePersons: PersonResponseDto[] = availablePersons.filter(person =>
    person.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isPersonSelected = (personId: string): boolean => {
    return selectedPerson !== null && selectedPerson.id === personId
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
                  <div className="area-person-main-info">
                    <div className="area-person-photo">
                      {personWithRoles.person.photoUrl ? (
                        <img src={addCacheBusting(personWithRoles.person.photoUrl)} alt={personWithRoles.person.fullName} />
                      ) : (
                        <div className="area-person-photo-placeholder">
                          <i className="fa-solid fa-user"></i>
                        </div>
                      )}
                    </div>
                    <div className="area-person-details">
                      <div className="area-person-name">{personWithRoles.person.fullName}</div>
                      <div className="area-person-email">{personWithRoles.person.email}</div>
                    </div>
                    <div className="area-person-main-actions">
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
                  <div className="area-person-roles-list">
                    <div className="area-person-section">
                      <div className="area-person-section-title">
                        <i className="fa-solid fa-briefcase"></i> Funções
                      </div>
                      {personWithRoles.roles.length === 0 ? (
                        <div className="area-person-role-item">
                          <span className="area-person-role-name" style={{ color: 'var(--text-light)' }}>
                            Nenhuma função atribuída
                          </span>
                        </div>
                      ) : (
                        personWithRoles.roles.map((role) => (
                          <div key={role.id} className="area-person-role-item">
                            <span className="area-person-role-name">{role.name}</span>
                          </div>
                        ))
                      )}
                    </div>
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
            setSelectedRoleIds([])
            setSearchTerm('')
          }}
        >
          <form onSubmit={(e) => {
            e.preventDefault()
            handleSavePerson()
          }}>
            {!editingPerson && !selectedPerson && (
              <div className="form-group">
                <label>
                  <i className="fa-solid fa-user"></i> Buscar Pessoa *
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
              </div>
            )}

            {(editingPerson || selectedPerson) && (
              <div className="form-group">
                <label>
                  <i className="fa-solid fa-user"></i> Pessoa
                </label>
                <div className="person-display">
                  <div className="person-display-photo">
                    {(editingPerson?.person.photoUrl || selectedPerson?.photoUrl) ? (
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
                  {!editingPerson && (
                    <button
                      type="button"
                      className="btn-secondary btn-change-person"
                      onClick={() => {
                        setSelectedPerson(null)
                        setSearchTerm('')
                      }}
                    >
                      <i className="fa-solid fa-arrow-left"></i> Trocar
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label>
                <i className="fa-solid fa-briefcase"></i> Funções *
              </label>
              {availableRoles.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px' }}>
                  <i className="fa-solid fa-briefcase"></i>
                  <p>Nenhuma função cadastrada na área</p>
                  <small className="form-help-text">
                    Cadastre funções na aba "Função" primeiro
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
                    <small className="form-help-text" style={{ color: 'var(--color-pink)' }}>
                      Selecione pelo menos uma função
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
                  setSelectedRoleIds([])
                  setSearchTerm('')
                }}
              >
                <i className="fa-solid fa-times"></i> Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={(!editingPerson && !selectedPerson) || selectedRoleIds.length === 0 || availableRoles.length === 0}
              >
                <i className="fa-solid fa-check"></i> {editingPerson ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

