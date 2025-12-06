import '../shared/TabPanel.css'
import './EquipesTabPanel.css'

export default function EquipesTabPanel() {
  const handleAdicionarEquipe = () => {
    // TODO: Implementar adicionar equipe
  }

  return (
    <div className="tab-panel">
      <div className="tab-panel-header">
        <h3 className="tab-panel-title">
          <i className="fa-solid fa-user-group"></i> Equipes
        </h3>
        <button className="btn-primary" onClick={handleAdicionarEquipe}>
          <i className="fa-solid fa-plus"></i> Adicionar Equipe
        </button>
      </div>
      <div className="tab-panel-body">
        <div className="empty-state">
          <i className="fa-solid fa-user-group"></i>
          <p>Nenhuma equipe cadastrada</p>
          <button className="btn-secondary" onClick={handleAdicionarEquipe}>
            <i className="fa-solid fa-plus"></i> Criar Primeira Equipe
          </button>
        </div>
      </div>
    </div>
  )
}

