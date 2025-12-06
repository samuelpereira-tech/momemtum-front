import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import TopNavbar from '../../../../components/admin/TopNavbar/TopNavbar'
import Sidebar from '../../../../components/admin/Sidebar/Sidebar'
import PageHeader from '../../../../components/admin/PageHeader/PageHeader'
import { personService } from '../../../../services/basic/personService'
import type { PersonResponseDto } from '../../../../services/basic/personService'
import { useToast } from '../../../../components/ui/Toast/ToastProvider'
import { formatCPF, formatPhone, formatarCPF, formatarTelefone, formatarData, removeMask } from '../../../../utils/formatters'
import { validateImageFile, createImagePreview, addCacheBusting } from '../../../../utils/fileUtils'
import '../../../../components/admin/admin.css'
import './ListarPessoas.css'

export default function ListarPessoas() {
  const toast = useToast()
  const [pessoas, setPessoas] = useState<PersonResponseDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroNome, setFiltroNome] = useState('')
  const [filtroEmail, setFiltroEmail] = useState('')
  const [filtroCPF, setFiltroCPF] = useState('')
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [total, setTotal] = useState(0)
  const itensPorPagina = 10 // Itens por página na exibição
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<PersonResponseDto>>({})
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null)
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null)
  const [photoCacheBuster, setPhotoCacheBuster] = useState(Date.now())

  // Função para adicionar cache-busting à URL da foto
  const getPhotoUrl = (photoUrl: string | null | undefined) => {
    if (!photoUrl) return null
    // Adiciona timestamp para forçar atualização
    const separator = photoUrl.includes('?') ? '&' : '?'
    return `${photoUrl}${separator}_t=${photoCacheBuster}`
  }

  // Carregar todas as pessoas
  useEffect(() => {
    loadPessoas()
  }, [])

  const loadPessoas = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Carregar todas as pessoas usando o limite máximo da API (100)
      // Se houver mais de 100, carregar múltiplas páginas
      let todasPessoas: PersonResponseDto[] = []
      let pagina = 1
      let temMaisPaginas = true
      const limitePorRequisicao = 100 // Limite máximo da API

      while (temMaisPaginas) {
        const response = await personService.getAllPersons(pagina, limitePorRequisicao)
        todasPessoas = [...todasPessoas, ...response.data]
        
        // Se não há mais páginas ou já carregamos tudo
        if (pagina >= response.totalPages || response.data.length === 0) {
          temMaisPaginas = false
        } else {
          pagina++
        }
      }

      setPessoas(todasPessoas)
      setTotal(todasPessoas.length)
      setTotalPaginas(Math.ceil(todasPessoas.length / itensPorPagina))
      setPaginaAtual(1) // Resetar para primeira página da exibição
    } catch (err: any) {
      console.error('Erro ao carregar pessoas:', err)
      setError(err.message || 'Erro ao carregar pessoas')
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar pessoas localmente (a API não tem filtros, então filtramos no cliente)
  const pessoasFiltradas = useMemo(() => {
    return pessoas.filter(pessoa => {
      // Se o filtro estiver vazio, sempre retorna true (match)
      const nomeMatch = filtroNome.trim() === '' 
        ? true 
        : (pessoa.fullName?.toLowerCase().includes(filtroNome.toLowerCase()) ?? false)
      
      const emailMatch = filtroEmail.trim() === '' 
        ? true 
        : (pessoa.email?.toLowerCase().includes(filtroEmail.toLowerCase()) ?? false)
      
      const cpfMatch = filtroCPF.trim() === '' 
        ? true 
        : (pessoa.cpf?.replace(/\D/g, '').includes(filtroCPF.replace(/\D/g, '')) ?? false)
      
      return nomeMatch && emailMatch && cpfMatch
    })
  }, [pessoas, filtroNome, filtroEmail, filtroCPF])

  // Paginação local após filtros
  const pessoasPagina = useMemo(() => {
    const indiceInicial = (paginaAtual - 1) * itensPorPagina
    const indiceFinal = indiceInicial + itensPorPagina
    return pessoasFiltradas.slice(indiceInicial, indiceFinal)
  }, [pessoasFiltradas, paginaAtual, itensPorPagina])

  // Recalcular total de páginas baseado nos filtros
  const totalPaginasFiltradas = useMemo(() => {
    return Math.ceil(pessoasFiltradas.length / itensPorPagina)
  }, [pessoasFiltradas.length, itensPorPagina])

  // Resetar para primeira página quando filtros mudarem
  useEffect(() => {
    setPaginaAtual(1)
  }, [filtroNome, filtroEmail, filtroCPF])

  const handleLimparFiltros = () => {
    setFiltroNome('')
    setFiltroEmail('')
    setFiltroCPF('')
    setPaginaAtual(1)
  }

  const handleEdit = async (pessoa: PersonResponseDto) => {
    setEditingId(pessoa.id)
    setEditForm({
      fullName: pessoa.fullName,
      email: pessoa.email,
      phone: pessoa.phone,
      cpf: pessoa.cpf,
      birthDate: pessoa.birthDate,
      emergencyContact: pessoa.emergencyContact,
      address: pessoa.address,
    })
    setEditPhotoFile(null)
    setEditPhotoPreview(null)
  }

  const handleSaveEdit = async (id: string) => {
    try {
      // Remover máscaras dos campos numéricos
      const updateData: any = {
        fullName: editForm.fullName,
        email: editForm.email,
        address: editForm.address,
        birthDate: editForm.birthDate,
      }

      if (editForm.phone) {
        updateData.phone = removeMask(editForm.phone)
      }
      if (editForm.cpf) {
        updateData.cpf = removeMask(editForm.cpf)
      }
      if (editForm.emergencyContact) {
        updateData.emergencyContact = removeMask(editForm.emergencyContact)
      }

      await personService.updatePerson(id, updateData)

      // Fazer upload da foto se houver uma nova foto selecionada
      if (editPhotoFile) {
        try {
          await personService.uploadPhoto(id, editPhotoFile)
        } catch (photoError) {
          console.error('Erro ao fazer upload da foto:', photoError)
          // Não falhar a edição se o upload da foto falhar
          toast.showWarning('Pessoa atualizada, mas houve erro ao atualizar a foto')
        }
      }

      setEditingId(null)
      setEditForm({})
      setEditPhotoFile(null)
      setEditPhotoPreview(null)
      // Atualizar cache buster para forçar reload das fotos
      setPhotoCacheBuster(Date.now())
      await loadPessoas()
      toast.showSuccess('Pessoa atualizada com sucesso!')
    } catch (err: any) {
      console.error('Erro ao atualizar pessoa:', err)
      toast.showError(err.message || 'Erro ao atualizar pessoa')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({})
    setEditPhotoFile(null)
    setEditPhotoPreview(null)
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>, pessoaId: string) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar arquivo
      const validation = validateImageFile(file, 5)
      if (!validation.isValid) {
        toast.showError(validation.errorMessage || 'Arquivo inválido')
        e.target.value = ''
        return
      }

      setEditPhotoFile(file)
      
      // Criar preview
      try {
        const preview = await createImagePreview(file)
        setEditPhotoPreview(preview)
      } catch (error) {
        console.error('Erro ao criar preview da imagem:', error)
        toast.showError('Erro ao processar a imagem')
        e.target.value = ''
        setEditPhotoFile(null)
      }
    }
  }

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir ${nome}?`)) {
      return
    }

    try {
      await personService.deletePerson(id)
      // Atualizar cache buster para forçar reload das fotos
      setPhotoCacheBuster(Date.now())
      await loadPessoas()
      toast.showSuccess('Pessoa excluída com sucesso!')
    } catch (err: any) {
      console.error('Erro ao excluir pessoa:', err)
      toast.showError(err.message || 'Erro ao excluir pessoa')
    }
  }


  return (
    <>
      <TopNavbar />
      <div className="admin-container">
        <Sidebar />
        <PageHeader
          title="Listar Pessoas"
          breadcrumbs={[
            { label: 'Home', icon: 'fa-solid fa-home', link: '/Dashboard' },
            { label: 'Pessoas', icon: 'fa-solid fa-user-group', link: '#' },
            { label: 'Listar Pessoas' }
          ]}
        />
        <main className="main-content">
          <div className="table-card">
            <div className="table-header">
              <div className="table-filters">
                <div className="filter-group">
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <input
                    type="text"
                    placeholder="Filtrar por nome..."
                    value={filtroNome}
                    onChange={(e) => {
                      setFiltroNome(e.target.value)
                    }}
                    className="filter-input"
                  />
                </div>
                <div className="filter-group">
                  <i className="fa-solid fa-envelope"></i>
                  <input
                    type="text"
                    placeholder="Filtrar por e-mail..."
                    value={filtroEmail}
                    onChange={(e) => {
                      setFiltroEmail(e.target.value)
                    }}
                    className="filter-input"
                  />
                </div>
                <div className="filter-group">
                  <i className="fa-solid fa-id-card"></i>
                  <input
                    type="text"
                    placeholder="Filtrar por CPF..."
                    value={filtroCPF}
                    onChange={(e) => {
                      setFiltroCPF(e.target.value)
                    }}
                    className="filter-input"
                  />
                </div>
                {(filtroNome || filtroEmail || filtroCPF) && (
                  <button
                    type="button"
                    onClick={handleLimparFiltros}
                    className="btn-filter-clear"
                  >
                    <i className="fa-solid fa-times"></i> Limpar
                  </button>
                )}
              </div>
              <Link to="/Dashboard/cadastrar-pessoa" className="btn-primary">
                <i className="fa-solid fa-plus"></i> Adicionar Pessoa
              </Link>
            </div>

            <div className="table-info">
              <span>
                {isLoading ? (
                  'Carregando...'
                ) : error ? (
                  <span style={{ color: '#c33' }}>{error}</span>
                ) : (
                  `Mostrando ${pessoasPagina.length} de ${pessoasFiltradas.length} pessoa(s)${pessoasFiltradas.length !== total ? ` (Total: ${total})` : ''}`
                )}
              </span>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Foto</th>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Telefone</th>
                    <th>CPF</th>
                    <th>Data de Nascimento</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="table-empty">
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <span>Carregando...</span>
                      </td>
                    </tr>
                  ) : pessoasPagina.length > 0 ? (
                    pessoasPagina.map((pessoa) => (
                      <tr key={pessoa.id}>
                        {editingId === pessoa.id ? (
                          <>
                            <td>
                              <div className="table-photo-edit">
                                <label htmlFor={`photo-${pessoa.id}`} className="table-photo-label">
                                  {editPhotoPreview ? (
                                    <img src={editPhotoPreview} alt="Preview" className="table-photo" />
                                  ) : getPhotoUrl(pessoa.photoUrl) ? (
                                    <img src={getPhotoUrl(pessoa.photoUrl)!} alt={pessoa.fullName || 'Foto'} className="table-photo" />
                                  ) : (
                                    <div className="table-photo-placeholder">
                                      <i className="fa-solid fa-user"></i>
                                    </div>
                                  )}
                                  <div className="table-photo-overlay">
                                    <i className="fa-solid fa-camera"></i>
                                    <span>Alterar</span>
                                  </div>
                                </label>
                                <input
                                  type="file"
                                  id={`photo-${pessoa.id}`}
                                  accept="image/*"
                                  onChange={(e) => handlePhotoChange(e, pessoa.id)}
                                  style={{ display: 'none' }}
                                />
                              </div>
                            </td>
                            <td>
                              <input
                                type="text"
                                value={editForm.fullName || ''}
                                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                style={{ width: '100%', padding: '4px' }}
                              />
                            </td>
                            <td>
                              <input
                                type="email"
                                value={editForm.email || ''}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                style={{ width: '100%', padding: '4px' }}
                              />
                            </td>
                            <td>
                              <input
                                type="tel"
                                value={editForm.phone ? formatPhone(editForm.phone) : ''}
                                onChange={(e) => {
                                  const value = removeMask(e.target.value)
                                  setEditForm({ ...editForm, phone: value })
                                }}
                                style={{ width: '100%', padding: '4px' }}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={editForm.cpf ? formatCPF(editForm.cpf) : ''}
                                onChange={(e) => {
                                  const value = removeMask(e.target.value)
                                  setEditForm({ ...editForm, cpf: value })
                                }}
                                style={{ width: '100%', padding: '4px' }}
                              />
                            </td>
                            <td>
                              <input
                                type="date"
                                value={editForm.birthDate || ''}
                                onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                                style={{ width: '100%', padding: '4px' }}
                              />
                            </td>
                            <td>
                              <div className="table-actions">
                                <button
                                  type="button"
                                  className="btn-action btn-save"
                                  onClick={() => handleSaveEdit(pessoa.id)}
                                  title="Salvar"
                                >
                                  <i className="fa-solid fa-check"></i>
                                </button>
                                <button
                                  type="button"
                                  className="btn-action btn-cancel"
                                  onClick={handleCancelEdit}
                                  title="Cancelar"
                                >
                                  <i className="fa-solid fa-times"></i>
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>
                              <Link 
                                to={`/Dashboard/editar-pessoa/${pessoa.id}`}
                                style={{ display: 'block' }}
                              >
                                <div className="table-photo" style={{ cursor: 'pointer' }}>
                                  {getPhotoUrl(pessoa.photoUrl) ? (
                                    <img src={getPhotoUrl(pessoa.photoUrl)!} alt={pessoa.fullName || 'Foto'} />
                                  ) : (
                                    <div className="table-photo-placeholder">
                                      <i className="fa-solid fa-user"></i>
                                    </div>
                                  )}
                                </div>
                              </Link>
                            </td>
                            <td>
                              <Link 
                                to={`/Dashboard/editar-pessoa/${pessoa.id}`}
                                style={{ 
                                  color: 'inherit', 
                                  textDecoration: 'none',
                                  cursor: 'pointer',
                                  fontWeight: 500
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = 'var(--color-purple)'
                                  e.currentTarget.style.textDecoration = 'underline'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = 'inherit'
                                  e.currentTarget.style.textDecoration = 'none'
                                }}
                              >
                                {pessoa.fullName || '-'}
                              </Link>
                            </td>
                            <td>{pessoa.email || '-'}</td>
                            <td>{formatarTelefone(pessoa.phone)}</td>
                            <td>{formatarCPF(pessoa.cpf)}</td>
                            <td>{formatarData(pessoa.birthDate)}</td>
                            <td>
                              <div className="table-actions">
                                <button
                                  type="button"
                                  className="btn-action btn-edit"
                                  onClick={() => handleEdit(pessoa)}
                                  title="Editar"
                                >
                                  <i className="fa-solid fa-pencil"></i>
                                </button>
                                <button
                                  type="button"
                                  className="btn-action btn-delete"
                                  onClick={() => handleDelete(pessoa.id, pessoa.fullName)}
                                  title="Excluir"
                                >
                                  <i className="fa-solid fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="table-empty">
                        <i className="fa-solid fa-inbox"></i>
                        <span>Nenhuma pessoa encontrada</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPaginasFiltradas > 1 && !isLoading && (
              <div className="pagination">
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1 || isLoading}
                >
                  <i className="fa-solid fa-chevron-left"></i> Anterior
                </button>
                
                <div className="pagination-info">
                  <span>
                    Página {paginaAtual} de {totalPaginasFiltradas}
                  </span>
                </div>

                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => setPaginaAtual(p => Math.min(totalPaginasFiltradas, p + 1))}
                  disabled={paginaAtual === totalPaginasFiltradas || isLoading}
                >
                  Próxima <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}

