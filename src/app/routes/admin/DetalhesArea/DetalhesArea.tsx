import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import TopNavbar from '../../../../components/admin/TopNavbar/TopNavbar'
import Sidebar from '../../../../components/admin/Sidebar/Sidebar'
import PageHeader from '../../../../components/admin/PageHeader/PageHeader'
import { scheduledAreaService, type ScheduledAreaResponseDto } from '../../../../services/basic/scheduledAreaService'
import { addCacheBusting } from '../../../../utils/fileUtils'
import { useToast } from '../../../../components/ui/Toast/ToastProvider'
import PessoasTabPanel from './Pessoas/PessoasTabPanel'
import FuncoesTabPanel from './Funcoes/FuncoesTabPanel'
import GruposTabPanel from './Grupos/GruposTabPanel'
import EquipesTabPanel from './Equipes/EquipesTabPanel'
import GeracaoAutomaticaTabPanel from './GeracaoAutomatica/GeracaoAutomaticaTabPanel'
import EscalaTabPanel from './Escala/EscalaTabPanel'
import type { TabType } from './shared/types'
import '../../../../components/admin/admin.css'
import '../ListarAreas/ListarAreas.css'
import './DetalhesArea.css'

export default function DetalhesArea() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  
  // Determinar a aba ativa pela URL
  const getActiveTabFromPath = (): TabType => {
    const path = location.pathname
    if (path.includes('/pessoas')) return 'pessoas'
    if (path.includes('/grupos')) return 'grupos'
    if (path.includes('/funcoes')) return 'funcoes'
    if (path.includes('/equipes')) return 'equipes'
    if (path.includes('/geracao-automatica')) return 'geracao-automatica'
    if (path.includes('/escala')) return 'escala'
    return 'pessoas' // padrão
  }
  
  const [activeTab, setActiveTab] = useState<TabType>(getActiveTabFromPath())
  const [area, setArea] = useState<ScheduledAreaResponseDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [areasFavoritas, setAreasFavoritas] = useState<Array<{ id: string; nome: string }>>([])
  const loadingAreaRef = useRef(false)
  const loadingFavoritasRef = useRef(false)

  const loadAreaData = useCallback(async () => {
    if (!id || loadingAreaRef.current) return
    loadingAreaRef.current = true
    
    setIsLoading(true)
    setError(null)
    try {
      const data = await scheduledAreaService.getScheduledAreaById(id)
      setArea(data)
    } catch (err: any) {
      console.error('Erro ao carregar área:', err)
      setError(err.message || 'Erro ao carregar dados da área')
      toast.showError(err.message || 'Erro ao carregar dados da área')
      navigate('/Dashboard/escala/areas')
    } finally {
      setIsLoading(false)
      loadingAreaRef.current = false
    }
  }, [id, navigate, toast])

  const loadAreasFavoritas = useCallback(async () => {
    if (loadingFavoritasRef.current) return
    loadingFavoritasRef.current = true
    try {
      // Carregar todas as áreas favoritas
      let todasAreas: ScheduledAreaResponseDto[] = []
      let pagina = 1
      let temMaisPaginas = true
      const limitePorRequisicao = 100

      while (temMaisPaginas) {
        const response = await scheduledAreaService.getAllScheduledAreas({
          page: pagina,
          limit: limitePorRequisicao,
          favorite: true
        })
        
        if (!response || !response.data) {
          break
        }
        
        todasAreas = [...todasAreas, ...response.data]
        
        if (response.meta && typeof response.meta.totalPages === 'number') {
          if (pagina >= response.meta.totalPages || response.data.length === 0) {
            temMaisPaginas = false
          } else {
            pagina++
          }
        } else {
          if (response.data.length === 0 || response.data.length < limitePorRequisicao) {
            temMaisPaginas = false
          } else {
            pagina++
          }
        }
      }

      // Filtrar apenas as favoritas e mapear para o formato esperado
      const favoritas = todasAreas
        .filter(area => area.favorite)
        .map(area => ({ id: area.id, nome: area.name }))
      
      setAreasFavoritas(favoritas)
    } catch (err: any) {
      console.error('Erro ao carregar áreas favoritas:', err)
      // Não mostrar erro para o usuário, apenas logar
    } finally {
      loadingFavoritasRef.current = false
    }
  }, [])

  useEffect(() => {
    if (id) {
      loadAreaData()
      loadAreasFavoritas()
    } else {
      navigate('/Dashboard/escala/areas')
    }
  }, [id, loadAreaData, loadAreasFavoritas, navigate])

  // Atualizar aba ativa quando a rota mudar
  useEffect(() => {
    const tab = getActiveTabFromPath()
    setActiveTab(tab)
    // Redirecionar para a rota correta se acessar a rota base sem especificar a aba
    if (id && location.pathname === `/Dashboard/escala/areas/${id}`) {
      navigate(`/Dashboard/escala/areas/${id}/pessoas`, { replace: true })
    }
  }, [location.pathname, id, navigate])

  const tabs = [
    { id: 'pessoas' as TabType, label: 'Pessoas', icon: 'fa-solid fa-user-plus' },
    { id: 'grupos' as TabType, label: 'Grupos', icon: 'fa-solid fa-users' },
    { id: 'funcoes' as TabType, label: 'Função', icon: 'fa-solid fa-briefcase' },
    { id: 'equipes' as TabType, label: 'Equipes', icon: 'fa-solid fa-user-group' },
    { id: 'geracao-automatica' as TabType, label: 'Geração de Escala Automática', icon: 'fa-solid fa-robot' },
    { id: 'escala' as TabType, label: 'Escala', icon: 'fa-solid fa-calendar-check' }
  ]

  if (isLoading) {
    return (
      <>
        <TopNavbar />
        <div className="admin-container">
          <Sidebar />
          <PageHeader
            title="Carregando..."
            breadcrumbs={[
              { label: 'Home', icon: 'fa-solid fa-home', link: '/Dashboard' },
              { label: 'Escala', icon: 'fa-solid fa-calendar-alt', link: '#' },
              { label: 'Áreas', icon: 'fa-solid fa-map-marked-alt', link: '/Dashboard/escala/areas' }
            ]}
          />
          <main className="main-content">
            <div className="form-card" style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '20px' }}></i>
              <p>Carregando dados da área...</p>
            </div>
          </main>
        </div>
      </>
    )
  }

  if (error || !area) {
    return (
      <>
        <TopNavbar />
        <div className="admin-container">
          <Sidebar />
          <PageHeader
            title="Erro"
            breadcrumbs={[
              { label: 'Home', icon: 'fa-solid fa-home', link: '/Dashboard' },
              { label: 'Escala', icon: 'fa-solid fa-calendar-alt', link: '#' },
              { label: 'Áreas', icon: 'fa-solid fa-map-marked-alt', link: '/Dashboard/escala/areas' }
            ]}
          />
          <main className="main-content">
            <div className="form-card" style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fa-solid fa-exclamation-triangle" style={{ fontSize: '2rem', marginBottom: '20px', color: 'var(--color-pink)' }}></i>
              <p>{error || 'Área não encontrada'}</p>
              <button className="btn-primary" onClick={() => navigate('/Dashboard/escala/areas')}>
                <i className="fa-solid fa-arrow-left"></i> Voltar para Lista
              </button>
            </div>
          </main>
        </div>
      </>
    )
  }

  return (
    <>
      <TopNavbar />
      <div className="admin-container">
        <Sidebar />
        <div className="page-header">
          <div className="page-title-card">
            <h2 className="page-title">{area.name}</h2>
          </div>
          <div className="breadcrumbs-card contextual-menu-container">
            <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <span className="breadcrumb-item">
                <Link to="/Dashboard">
                  <i className="fa-solid fa-home"></i> Home
                </Link>
              </span>
              <span className="breadcrumb-item">
                <i className="fa-solid fa-chevron-right"></i>
                <span>Escala</span>
              </span>
              <span className="breadcrumb-item">
                <i className="fa-solid fa-chevron-right"></i>
                <Link to="/Dashboard/escala/areas">
                  <i className="fa-solid fa-map-marked-alt"></i> Áreas
                </Link>
              </span>
              <span className="breadcrumb-item">
                <i className="fa-solid fa-chevron-right"></i>
                <span>{area.name}</span>
              </span>
            </nav>
            <div className="contextual-menu">
              <div className="favorites-list">
                {areasFavoritas.map((areaFav) => {
                  const isActive = areaFav.id === id
                  return (
                    <Link 
                      key={areaFav.id} 
                      to={`/Dashboard/escala/areas/${areaFav.id}/pessoas`}
                      className={`favorite-item-inline ${isActive ? 'active' : ''}`}
                    >
                      <i className="fa-solid fa-star"></i>
                      <span>{areaFav.nome}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
        <main className="main-content">
          <div className="area-details-container">
            {/* Informações da Área */}
            <div className="area-info-card">
              <div className="area-info-header">
                {area.imageUrl ? (
                  <img src={addCacheBusting(area.imageUrl)} alt={area.name} className="area-info-image" />
                ) : (
                  <div className="area-info-image-placeholder">
                    <i className="fa-solid fa-map-marked-alt"></i>
                  </div>
                )}
                <div className="area-info-content">
                  <h2 className="area-info-title">{area.name}</h2>
                  <p className="area-info-description">{area.description || 'Sem descrição'}</p>
                  <div className="area-info-meta">
                    <span className="area-info-meta-item">
                      <i className="fa-solid fa-user"></i>
                      Responsável: {area.responsiblePerson?.fullName || 'Não definido'}
                    </span>
                    {area.favorite && (
                      <span className="area-info-meta-item">
                        <i className="fa-solid fa-star"></i>
                        Favorita
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu de Abas */}
            <div className="area-tabs-container">
              <div className="area-tabs">
                {tabs.map((tab) => {
                  const tabPath = tab.id === 'pessoas' 
                    ? `/Dashboard/escala/areas/${id}` 
                    : `/Dashboard/escala/areas/${id}/${tab.id}`
                  return (
                    <Link
                      key={tab.id}
                      to={tabPath}
                      className={`area-tab ${activeTab === tab.id ? 'active' : ''}`}
                    >
                      <i className={tab.icon}></i>
                      <span>{tab.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Conteúdo das Abas */}
            <div className="area-tab-content">
              {activeTab === 'pessoas' && <PessoasTabPanel key="pessoas" />}
              {activeTab === 'grupos' && <GruposTabPanel key="grupos" />}
              {activeTab === 'funcoes' && <FuncoesTabPanel key="funcoes" />}
              {activeTab === 'equipes' && <EquipesTabPanel key="equipes" />}
              {activeTab === 'geracao-automatica' && <GeracaoAutomaticaTabPanel key="geracao-automatica" />}
              {activeTab === 'escala' && <EscalaTabPanel key="escala" />}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

