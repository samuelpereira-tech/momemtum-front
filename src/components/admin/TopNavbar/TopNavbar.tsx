import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../app/providers/AuthContext'
import { useSidebar } from '../SidebarContext'
import SettingsModal from '../SettingsModal/SettingsModal'
import '../admin.css'
import './TopNavbar.css'

export default function TopNavbar() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { isPinned, togglePin } = useSidebar()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <h1 className="company-name">Momentum</h1>
        <button
          className="sidebar-toggle-button"
          onClick={togglePin}
          title={isPinned ? 'Ocultar menu lateral' : 'Mostrar menu lateral'}
        >
          <i className={`fa-solid fa-bars ${isPinned ? '' : 'collapsed'}`}></i>
        </button>
      </div>
      <div className="navbar-right">
        <div
          className="nav-icon"
          title="Configurações"
          onClick={() => setIsSettingsOpen(true)}
        >
          <i className="fa-solid fa-gear"></i>
        </div>
        {/* <div className="nav-icon" title="Notificações">
          <i className="fa-solid fa-bell"></i>
          <span className="notification-badge">3</span>
        </div> */}
        {/* <div className="nav-icon" title="Mensagens">
          <i className="fa-solid fa-envelope"></i>
          <span className="notification-badge">2</span>
        </div> */}
        {/* <div className="nav-icon" title="Alerta">
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div> */}
        <div className="user-profile">
          <img src="https://ui-avatars.com/api/?name=Admin+User&background=AD82D9&color=fff&size=128" alt="Usuário" className="user-avatar" />
          <span className="user-name">Admin</span>
          <i className="fa-solid fa-chevron-down"></i>
        </div>
        <button
          onClick={handleLogout}
          className="logout-button"
          title="Sair"
          style={{
            marginLeft: '15px',
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #F29C94, #F2B33D)',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '0.9rem',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(242, 156, 148, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <i className="fa-solid fa-sign-out-alt" style={{ marginRight: '5px' }}></i>
          Sair
        </button>
      </div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </header>
  )
}

