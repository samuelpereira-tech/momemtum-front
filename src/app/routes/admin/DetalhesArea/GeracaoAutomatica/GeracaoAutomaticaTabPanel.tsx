import '../shared/TabPanel.css'
import './GeracaoAutomaticaTabPanel.css'

export default function GeracaoAutomaticaTabPanel() {
  return (
    <div className="tab-panel">
      <div className="tab-panel-header">
        <h3 className="tab-panel-title">
          <i className="fa-solid fa-robot"></i> Geração de Escala Automática
        </h3>
      </div>
      <div className="tab-panel-body">
        <div className="generation-settings">
          <div className="form-card">
            <h4 className="form-section-title">Configurações de Geração</h4>
            <div className="form-row">
              <div className="form-group">
                <label>
                  <i className="fa-solid fa-calendar"></i> Período
                </label>
                <select>
                  <option>Mensal</option>
                  <option>Semanal</option>
                  <option>Quinzenal</option>
                </select>
              </div>
              <div className="form-group">
                <label>
                  <i className="fa-solid fa-clock"></i> Horário de Trabalho
                </label>
                <input type="text" placeholder="Ex: 08:00 - 17:00" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>
                  <i className="fa-solid fa-users"></i> Pessoas por Turno
                </label>
                <input type="number" placeholder="Ex: 5" min="1" />
              </div>
              <div className="form-group">
                <label>
                  <i className="fa-solid fa-calendar-check"></i> Data de Início
                </label>
                <input type="date" />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-secondary">
                <i className="fa-solid fa-times"></i> Cancelar
              </button>
              <button className="btn-primary">
                <i className="fa-solid fa-magic"></i> Gerar Escala
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

