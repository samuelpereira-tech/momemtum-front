import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSidebar } from '../SidebarContext'
import '../admin.css'
import './Sidebar.css'

export default function Sidebar() {
  const { isPinned } = useSidebar()
  const location = useLocation()
  const isDashboard = location.pathname === '/Dashboard'
  const isCadastrarPessoa = location.pathname === '/Dashboard/cadastrar-pessoa'
  const isListarPessoas = location.pathname === '/Dashboard/listar-pessoas'
  const isListarAusencias = location.pathname === '/Dashboard/listar-ausencias'
  const isAdicionarAusencia = location.pathname === '/Dashboard/adicionar-ausencia'
  const isEditarAusencia = location.pathname.startsWith('/Dashboard/editar-ausencia/')
  const isListarAreas = location.pathname === '/Dashboard/escala/areas'
  
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([])

  useEffect(() => {
    // Abre o submenu de Pessoas se estiver na página de cadastrar ou listar pessoas
    if (isCadastrarPessoa || isListarPessoas) {
      setOpenSubmenus(['pessoas'])
    }
    // Abre o submenu de Ausências se estiver em alguma página de ausências
    if (isListarAusencias || isAdicionarAusencia || isEditarAusencia) {
      setOpenSubmenus(['ausencias'])
    }
    // Abre o submenu de Escala se estiver na página de áreas
    if (isListarAreas) {
      setOpenSubmenus(['escala'])
    }
  }, [isCadastrarPessoa, isListarPessoas, isListarAusencias, isAdicionarAusencia, isEditarAusencia, isListarAreas])

  const toggleSubmenu = (submenuId: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setOpenSubmenus(prev => 
      prev.includes(submenuId) 
        ? prev.filter(id => id !== submenuId)
        : [...prev, submenuId]
    )
  }

  const handleMenuClick = () => {
    // Zerar a rolagem quando clicar em qualquer item do menu
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // Também zerar a rolagem do elemento main-content se existir
    const mainContent = document.querySelector('.main-content')
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Zerar rolagem quando a rota mudar
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    const mainContent = document.querySelector('.main-content')
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [location.pathname])

  return (
    <aside className={`sidebar ${!isPinned ? 'collapsed' : ''}`}>
      <nav className="sidebar-menu">
        <ul className="menu-list">
          <li className={`menu-item ${isDashboard ? 'active' : ''}`}>
            <Link to="/Dashboard" className="menu-link" onClick={handleMenuClick}>
              <i className="fa-solid fa-home"></i>
              <span>Dashboard</span>
            </Link>
          </li>
          <li className={`menu-item has-submenu ${openSubmenus.includes('pessoas') ? 'submenu-open' : ''}`}>
            <a href="#" className="menu-link" onClick={(e) => toggleSubmenu('pessoas', e)}>
              <i className="fa-solid fa-user-group"></i>
              <span>Pessoas</span>
              <i className="fa-solid fa-chevron-right submenu-arrow"></i>
            </a>
            <ul className="submenu">
              <li className={isListarPessoas ? 'active' : ''}>
                <Link to="/Dashboard/listar-pessoas" onClick={handleMenuClick}><i className="fa-solid fa-list"></i> Listar Pessoas</Link>
              </li>
              <li className={isCadastrarPessoa ? 'active' : ''}>
                <Link to="/Dashboard/cadastrar-pessoa" onClick={handleMenuClick}><i className="fa-solid fa-user-plus"></i> Adicionar Pessoa</Link>
              </li>
            </ul>
          </li>
          <li className={`menu-item has-submenu ${openSubmenus.includes('ausencias') ? 'submenu-open' : ''}`}>
            <a href="#" className="menu-link" onClick={(e) => toggleSubmenu('ausencias', e)}>
              <i className="fa-solid fa-calendar-times"></i>
              <span>Ausências</span>
              <i className="fa-solid fa-chevron-right submenu-arrow"></i>
            </a>
            <ul className="submenu">
              <li className={isListarAusencias ? 'active' : ''}>
                <Link to="/Dashboard/listar-ausencias" onClick={handleMenuClick}><i className="fa-solid fa-list"></i> Listar Ausências</Link>
              </li>
              <li className={isAdicionarAusencia || isEditarAusencia ? 'active' : ''}>
                <Link to="/Dashboard/adicionar-ausencia" onClick={handleMenuClick}><i className="fa-solid fa-plus"></i> Adicionar Ausência</Link>
              </li>
            </ul>
          </li>
          <li className={`menu-item has-submenu ${openSubmenus.includes('escala') ? 'submenu-open' : ''}`}>
            <a href="#" className="menu-link" onClick={(e) => toggleSubmenu('escala', e)}>
              <i className="fa-solid fa-calendar-alt"></i>
              <span>Escala</span>
              <i className="fa-solid fa-chevron-right submenu-arrow"></i>
            </a>
            <ul className="submenu">
              <li className={isListarAreas ? 'active' : ''}>
                <Link to="/Dashboard/escala/areas" onClick={handleMenuClick}><i className="fa-solid fa-map-marked-alt"></i> Áreas</Link>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </aside>
  )
}

