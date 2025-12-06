import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TopNavbar from '../../../../components/admin/TopNavbar/TopNavbar'
import Sidebar from '../../../../components/admin/Sidebar/Sidebar'
import { useToast } from '../../../../components/ui/Toast/ToastProvider'
import ConfirmModal from '../../../../components/ui/ConfirmModal/ConfirmModal'
import { scheduledAreaService, type ScheduledAreaResponseDto } from '../../../../services/basic/scheduledAreaService'
import { addCacheBusting } from '../../../../utils/fileUtils'
import '../../../../components/admin/admin.css'
import './ListarAreas.css'

export default function ListarAreas() {
  const navigate = useNavigate()
  const toast = useToast()
  const [areas, setAreas] = useState<ScheduledAreaResponseDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteAreaModal, setShowDeleteAreaModal] = useState(false)
  const [areaParaDeletar, setAreaParaDeletar] = useState<{ id: string; nome: string } | null>(null)

  // Carregar áreas
  useEffect(() => {
    loadAreas()
  }, [])

  const loadAreas = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Carregar todas as áreas
      let todasAreas: ScheduledAreaResponseDto[] = []
      let pagina = 1
      let temMaisPaginas = true
      const limitePorRequisicao = 100

      while (temMaisPaginas) {
        const response = await scheduledAreaService.getAllScheduledAreas({
          page: pagina,
          limit: limitePorRequisicao
        })
        
        // Debug: log da resposta para entender a estrutura
        console.log('Resposta da API (página', pagina, '):', response)
        
        // Verificar se a resposta tem a estrutura esperada
        if (!response) {
          console.error('Resposta da API é null ou undefined')
          throw new Error('Resposta da API inválida: resposta vazia')
        }
        
        if (!response.data) {
          console.error('Resposta da API não contém propriedade "data":', response)
          throw new Error('Resposta da API inválida: propriedade "data" não encontrada')
        }
        
        todasAreas = [...todasAreas, ...response.data]
        
        // Verificar se há mais páginas
        if (response.meta && typeof response.meta.totalPages === 'number') {
          // Se temos meta.totalPages, usar para verificar
          if (pagina >= response.meta.totalPages || response.data.length === 0) {
            temMaisPaginas = false
          } else {
            pagina++
          }
        } else {
          // Se não temos meta ou totalPages, verificar se retornou dados
          console.warn('Resposta não contém meta.totalPages, usando fallback baseado no tamanho dos dados')
          if (response.data.length === 0 || response.data.length < limitePorRequisicao) {
            temMaisPaginas = false
          } else {
            pagina++
          }
        }
      }

      setAreas(todasAreas)
    } catch (err: any) {
      console.error('Erro ao carregar áreas:', err)
      setError(err.message || 'Erro ao carregar áreas')
      toast.showError(err.message || 'Erro ao carregar áreas')
    } finally {
      setIsLoading(false)
    }
  }

  // Calcular áreas favoritas baseado no estado atual
  const areasFavoritas = areas.filter(area => area.favorite).map(area => ({ id: area.id, nome: area.name }))

  const handleToggleFavorito = async (areaId: string) => {
    try {
      const area = areas.find(a => a.id === areaId)
      if (!area) return

      const novaFavorita = !area.favorite
      await scheduledAreaService.toggleFavorite(areaId, novaFavorita)
      
      // Atualizar estado local
      setAreas(prevAreas => 
        prevAreas.map(a => a.id === areaId ? { ...a, favorite: novaFavorita } : a)
      )
      
      toast.showSuccess(novaFavorita ? 'Área adicionada aos favoritos' : 'Área removida dos favoritos')
    } catch (err: any) {
      console.error('Erro ao alterar favorito:', err)
      toast.showError(err.message || 'Erro ao alterar favorito')
    }
  }

  const handleExcluirArea = (areaId: string, areaNome: string) => {
    setAreaParaDeletar({ id: areaId, nome: areaNome })
    setShowDeleteAreaModal(true)
  }

  const confirmExcluirArea = async () => {
    if (!areaParaDeletar) return

    try {
      await scheduledAreaService.deleteScheduledArea(areaParaDeletar.id)
      setAreas(prevAreas => prevAreas.filter(area => area.id !== areaParaDeletar.id))
      setShowDeleteAreaModal(false)
      setAreaParaDeletar(null)
      toast.showSuccess(`Área "${areaParaDeletar.nome}" excluída com sucesso!`)
    } catch (err: any) {
      console.error('Erro ao excluir área:', err)
      toast.showError(err.message || 'Erro ao excluir área')
    }
  }

  return (
    <>
      <TopNavbar />
      <div className="admin-container">
        <Sidebar />
        <div className="page-header">
          <div className="page-title-card">
            <h2 className="page-title"><Link to="/Dashboard/escala/areas/adicionar" className="contextual-btn contextual-btn-primary">
                <i className="fa-solid fa-plus"></i> Áreas
              </Link></h2>
          </div>
          <div className="breadcrumbs-card contextual-menu-container">
            <div className="contextual-menu">
              <div className="favorites-list">
                {areasFavoritas.map((area) => (
                  <Link 
                    key={area.id} 
                    to={`/Dashboard/escala/areas/${area.id}/pessoas`}
                    className="favorite-item-inline"
                  >
                    <i className="fa-solid fa-star"></i>
                    <span>{area.nome}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
        <main className="main-content">
          {isLoading ? (
            <div className="loading-state">
              <i className="fa-solid fa-spinner fa-spin"></i>
              <p>Carregando áreas...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <i className="fa-solid fa-exclamation-triangle"></i>
              <p>{error}</p>
              <button className="btn-primary" onClick={loadAreas}>
                <i className="fa-solid fa-refresh"></i> Tentar Novamente
              </button>
            </div>
          ) : areas.length === 0 ? (
            <div className="empty-state">
              <i className="fa-solid fa-map-marked-alt"></i>
              <p>Nenhuma área cadastrada</p>
              <Link to="/Dashboard/escala/areas/adicionar" className="btn-primary">
                <i className="fa-solid fa-plus"></i> Criar Primeira Área
              </Link>
            </div>
          ) : (
            <div className="areas-grid">
              {areas.map((area) => (
                <div key={area.id} className="area-card">
                  <div 
                    className="area-card-link"
                    onClick={() => navigate(`/Dashboard/escala/areas/${area.id}`)}
                  >
                    <div className="area-card-header">
                      <div className="table-photo">
                        {area.imageUrl ? (
                          <img src={addCacheBusting(area.imageUrl)} alt={area.name} />
                        ) : (
                          <div className="table-photo-placeholder">
                            <i className="fa-solid fa-map-marked-alt"></i>
                          </div>
                        )}
                      </div>
                      {area.responsiblePerson && (
                        <div className="area-responsible">
                          <Link
                            to={`/Dashboard/editar-pessoa/${area.responsiblePerson.id}`}
                            className="table-photo"
                            onClick={(e) => e.stopPropagation()}
                            title={`Editar ${area.responsiblePerson.fullName}`}
                          >
                            {area.responsiblePerson.photoUrl ? (
                              <img src={addCacheBusting(area.responsiblePerson.photoUrl)} alt={area.responsiblePerson.fullName} />
                            ) : (
                              <div className="table-photo-placeholder">
                                <i className="fa-solid fa-user"></i>
                              </div>
                            )}
                          </Link>
                          <div className="area-responsible-info">
                            <span className="area-responsible-label">Responsável:</span>
                            <span className="area-responsible-name">{area.responsiblePerson.fullName}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="area-card-body">
                      <h3 className="area-name">{area.name}</h3>
                      <p className="area-description">{area.description || 'Sem descrição'}</p>
                      
                    </div>
                  </div>
                  <div className="area-card-footer">
                    <div className="area-card-actions">
                      <button 
                        className={`btn-area-icon btn-area-favorite ${area.favorite ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleToggleFavorito(area.id)
                        }}
                        title={area.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                      >
                        <i className={`fa-solid fa-star ${area.favorite ? 'filled' : ''}`}></i>
                      </button>
                      <Link
                        to={`/Dashboard/escala/areas/editar/${area.id}`}
                        className="btn-area-icon btn-area-edit"
                        title="Editar área"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <i className="fa-solid fa-pencil"></i>
                      </Link>
                      <button 
                        className="btn-area-icon btn-area-delete"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleExcluirArea(area.id, area.name)
                        }}
                        title="Excluir área"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <ConfirmModal
        isOpen={showDeleteAreaModal}
        title="Excluir Área"
        message={areaParaDeletar ? `Tem certeza que deseja excluir a área "${areaParaDeletar.nome}"?` : ''}
        onConfirm={confirmExcluirArea}
        onCancel={() => {
          setShowDeleteAreaModal(false)
          setAreaParaDeletar(null)
        }}
      />
    </>
  )
}

