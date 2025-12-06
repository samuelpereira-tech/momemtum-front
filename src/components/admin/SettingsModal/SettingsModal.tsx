import { useState } from 'react'
import './SettingsModal.css'
import TipoAusencia from './TipoAusencia/TipoAusencia'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type SettingsSection = 'tipo-ausencia'

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('tipo-ausencia')

  if (!isOpen) return null

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h2 className="settings-modal-title">
            <i className="fa-solid fa-gear"></i> Configurações
          </h2>
          <button className="settings-modal-close" onClick={onClose}>
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
        
        <div className="settings-modal-body">
          <div className="settings-sidebar">
            <nav className="settings-nav">
              <button
                className={`settings-nav-item ${activeSection === 'tipo-ausencia' ? 'active' : ''}`}
                onClick={() => setActiveSection('tipo-ausencia')}
              >
                <i className="fa-solid fa-tag"></i>
                <span>Tipo de Ausência</span>
              </button>
            </nav>
          </div>
          
          <div className="settings-content">
            {activeSection === 'tipo-ausencia' && <TipoAusencia />}
          </div>
        </div>
      </div>
    </div>
  )
}
