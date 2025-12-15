import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import TopNavbar from '../../../../components/admin/TopNavbar/TopNavbar'
import Sidebar from '../../../../components/admin/Sidebar/Sidebar'
import PageHeader from '../../../../components/admin/PageHeader/PageHeader'
import { scheduledAbsenceService } from '../../../../services/basic/scheduledAbsenceService'
import { absenceTypeService } from '../../../../services/basic/absenceTypeService'
import type { ScheduledAbsenceResponseDto } from '../../../../services/basic/scheduledAbsenceService'
import type { AbsenceTypeResponseDto } from '../../../../services/basic/absenceTypeService'
import { useToast } from '../../../../components/ui/Toast/ToastProvider'
import { formatarData } from '../../../../utils/formatters'
import { formatDateForAPI } from '../../../../utils/dateUtils'
import ConfirmModal from '../../../../components/ui/ConfirmModal/ConfirmModal'
import '../../../../components/admin/admin.css'
import './ListarAusencias.css'

export default function ListarAusencias() {
  const toast = useToast()
  const [filtroNome, setFiltroNome] = useState('')
  const [filtroTipoId, setFiltroTipoId] = useState('')
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [ausencias, setAusencias] = useState<ScheduledAbsenceResponseDto[]>([])
  const [absenceTypes, setAbsenceTypes] = useState<AbsenceTypeResponseDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const itensPorPagina = 10
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  })

  // Carregar tipos de ausência para o filtro
  useEffect(() => {
    loadAbsenceTypes()
  }, [])

  // Carregar ausências quando filtros ou página mudarem
  useEffect(() => {
    loadAusencias()
  }, [paginaAtual, filtroNome, filtroTipoId, filtroDataInicio])

  const loadAbsenceTypes = async () => {
    try {
      const response = await absenceTypeService.getAllAbsenceTypes({ limit: 100, active: true })
      setAbsenceTypes(response.data)
    } catch (err: any) {
      console.error('Erro ao carregar tipos de ausência:', err)
    }
  }

  const loadAusencias = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const filters: any = {
        page: paginaAtual,
        limit: itensPorPagina,
      }

      if (filtroNome.trim()) {
        filters.personName = filtroNome.trim()
      }

      if (filtroTipoId) {
        filters.absenceTypeId = filtroTipoId
      }

      if (filtroDataInicio) {
        filters.startDate = formatDateForAPI(filtroDataInicio)
      }

      const response = await scheduledAbsenceService.getAllScheduledAbsences(filters)
      setAusencias(response.data)
      setTotal(response.total)
      setTotalPages(response.totalPages)
    } catch (err: any) {
      console.error('Erro ao carregar ausências:', err)
      setError(err.message || 'Erro ao carregar ausências programadas')
      toast.showError(err.message || 'Erro ao carregar ausências programadas')
    } finally {
      setIsLoading(false)
    }
  }

  const getTipoLabel = (absenceType: AbsenceTypeResponseDto | undefined) => {
    return absenceType?.name || '-'
  }

  const getTipoIcon = (absenceType: AbsenceTypeResponseDto | undefined) => {
    if (!absenceType) return 'fa-calendar'
    const name = absenceType.name.toLowerCase()
    if (name.includes('férias')) return 'fa-umbrella-beach'
    if (name.includes('feriado')) return 'fa-calendar-day'
    if (name.includes('licença') || name.includes('licenca')) return 'fa-file-medical'
    return 'fa-calendar-alt'
  }

  const handleDelete = (id: string) => {
    setConfirmDelete({ isOpen: true, id })
  }

  const confirmDeleteAction = async () => {
    if (!confirmDelete.id) return

    try {
      await scheduledAbsenceService.deleteScheduledAbsence(confirmDelete.id)
      toast.showSuccess('Ausência programada excluída com sucesso!')
      setConfirmDelete({ isOpen: false, id: null })
      await loadAusencias()
    } catch (err: any) {
      console.error('Erro ao excluir ausência:', err)
      toast.showError(err.message || 'Erro ao excluir ausência programada')
    }
  }

  const cancelDelete = () => {
    setConfirmDelete({ isOpen: false, id: null })
  }

  const handleLimparFiltros = () => {
    setFiltroNome('')
    setFiltroTipoId('')
    setFiltroDataInicio('')
    setPaginaAtual(1)
  }

  // Buscar tipo de ausência pelo ID
  const getAbsenceTypeById = (id: string) => {
    return absenceTypes.find(t => t.id === id)
  }

  return (
    <>
      <TopNavbar />
      <div className="admin-container">
        <Sidebar />
        <PageHeader
          title="Listar Ausências Programadas"
          breadcrumbs={[
            { label: 'Home', icon: 'fa-solid fa-home', link: '/Dashboard' },
            { label: 'Ausências Programadas', icon: 'fa-solid fa-calendar-times', link: '#' },
            { label: 'Listar Ausências' }
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
                      setPaginaAtual(1)
                    }}
                    className="filter-input"
                  />
                </div>
                <div className="filter-group">
                  <i className="fa-solid fa-filter"></i>
                  <select
                    value={filtroTipoId}
                    onChange={(e) => {
                      setFiltroTipoId(e.target.value)
                      setPaginaAtual(1)
                    }}
                    className="filter-input"
                    style={{ paddingLeft: '35px' }}
                  >
                    <option value="">Todos os tipos</option>
                    {absenceTypes.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <i className="fa-solid fa-calendar"></i>
                  <input
                    type="date"
                    placeholder="Data início..."
                    value={filtroDataInicio}
                    onChange={(e) => {
                      setFiltroDataInicio(e.target.value)
                      setPaginaAtual(1)
                    }}
                    className="filter-input"
                  />
                </div>
                {(filtroNome || filtroTipoId || filtroDataInicio) && (
                  <button
                    type="button"
                    onClick={handleLimparFiltros}
                    className="btn-filter-clear"
                  >
                    <i className="fa-solid fa-times"></i> Limpar
                  </button>
                )}
              </div>
              <Link to="/Dashboard/adicionar-ausencia" className="btn-primary">
                <i className="fa-solid fa-plus"></i> Adicionar Ausência
              </Link>
            </div>

            <div className="table-info">
              <span>
                {isLoading ? (
                  'Carregando...'
                ) : error ? (
                  <span style={{ color: '#c33' }}>{error}</span>
                ) : (
                  `Mostrando ${ausencias.length} de ${total} ausência(s)`
                )}
              </span>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Pessoa</th>
                    <th>Tipo</th>
                    <th>Data Início</th>
                    <th>Data Fim</th>
                    <th>Descrição</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="table-empty">
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <span>Carregando...</span>
                      </td>
                    </tr>
                  ) : ausencias.length > 0 ? (
                    ausencias.map((ausencia) => {
                      const absenceType = getAbsenceTypeById(ausencia.absenceTypeId)
                      const personName = ausencia.person?.fullName || 'Pessoa não encontrada'
                      return (
                        <tr key={ausencia.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div className="table-photo-placeholder" style={{ width: '40px', height: '40px' }}>
                                <i className="fa-solid fa-user"></i>
                              </div>
                              <span style={{ fontWeight: 500 }}>{personName}</span>
                            </div>
                          </td>
                          <td>
                            <span 
                              className="badge-tipo" 
                              data-tipo={absenceType?.name.toLowerCase() || 'outro'}
                              style={absenceType?.color ? { 
                                backgroundColor: `${absenceType.color}20`,
                                color: absenceType.color 
                              } : {}}
                            >
                              <i className={`fa-solid ${getTipoIcon(absenceType)}`}></i>
                              {getTipoLabel(absenceType)}
                            </span>
                          </td>
                          <td>{formatarData(ausencia.startDate)}</td>
                          <td>{formatarData(ausencia.endDate)}</td>
                          <td>{ausencia.description || '-'}</td>
                          <td>
                            <div className="table-actions">
                              <Link
                                to={`/Dashboard/editar-ausencia/${ausencia.id}`}
                                className="btn-action btn-edit"
                                title="Editar"
                              >
                                <i className="fa-solid fa-pencil"></i>
                              </Link>
                              <button
                                type="button"
                                className="btn-action btn-delete"
                                onClick={() => handleDelete(ausencia.id)}
                                title="Excluir"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="table-empty">
                        <i className="fa-solid fa-inbox"></i>
                        <span>Nenhuma ausência encontrada</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && !isLoading && (
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
                    Página {paginaAtual} de {totalPages}
                  </span>
                </div>

                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => setPaginaAtual(p => Math.min(totalPages, p + 1))}
                  disabled={paginaAtual === totalPages || isLoading}
                >
                  Próxima <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            )}
          </div>
          <ConfirmModal
            isOpen={confirmDelete.isOpen}
            title="Excluir Ausência Programada"
            message="Tem certeza que deseja excluir esta ausência programada? Esta ação não pode ser desfeita."
            confirmText="Excluir"
            cancelText="Cancelar"
            onConfirm={confirmDeleteAction}
            onCancel={cancelDelete}
            type="danger"
          />
        </main>
      </div>
    </>
  )
}
