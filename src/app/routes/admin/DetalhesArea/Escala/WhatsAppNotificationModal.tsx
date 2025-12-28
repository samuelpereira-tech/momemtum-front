import { useState } from 'react'
import { type NotificationConfigDto } from '../../../../../services/basic/scheduleService'
import './WhatsAppNotificationModal.css'

interface WhatsAppNotificationModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (configs: NotificationConfigDto[]) => void
    selectedCount: number
}

export default function WhatsAppNotificationModal({
    isOpen,
    onClose,
    onSave,
    selectedCount
}: WhatsAppNotificationModalProps) {
    const [configs, setConfigs] = useState<NotificationConfigDto[]>([])
    const [time, setTime] = useState<number>(1)
    const [unit, setUnit] = useState<'hours' | 'days' | 'weeks'>('days')
    const [message, setMessage] = useState<string>('Olá {nome}, você está escalado para o dia {data} na função {funcao}.')

    if (!isOpen) return null

    const handleAddConfig = () => {
        if (time <= 0) return

        const newConfig: NotificationConfigDto = {
            id: crypto.randomUUID(),
            time,
            unit,
            message
        }

        setConfigs([...configs, newConfig])
        // Reset defaults (optional)
        // setTime(1)
        // setUnit('days')
    }

    const handleRemoveConfig = (id: string) => {
        setConfigs(configs.filter(c => c.id !== id))
    }

    const handleSave = () => {
        onSave(configs)
        onClose()
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content whatsapp-modal">
                <div className="modal-header">
                    <h3>
                        <i className="fa-brands fa-whatsapp"></i> Configurar Notificações WhatsApp
                    </h3>
                    <button className="close-btn" onClick={onClose}>
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>

                <div className="modal-body">
                    <p className="modal-description">
                        Configurando notificações para <strong>{selectedCount}</strong> escala(s) selecionada(s).
                    </p>

                    <div className="config-form-section">
                        <h4>Nova Regra de Notificação</h4>

                        <div className="time-config-row">
                            <div className="form-group">
                                <label>Enviar</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={time}
                                    onChange={(e) => setTime(parseInt(e.target.value) || 0)}
                                    className="form-input time-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Unidade</label>
                                <select
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value as any)}
                                    className="form-input unit-select"
                                >
                                    <option value="hours">Horas</option>
                                    <option value="days">Dias</option>
                                    <option value="weeks">Semanas</option>
                                </select>
                            </div>

                            <span className="static-text">antes da escala.</span>
                        </div>

                        <div className="form-group">
                            <label>Mensagem</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="form-input message-textarea"
                                rows={3}
                            />
                            <p className="helper-text">
                                Templates disponíveis: <code>{`{nome}`}</code>, <code>{`{data}`}</code>, <code>{`{funcao}`}</code>
                            </p>
                        </div>

                        <button
                            type="button"
                            className="btn-secondary add-rule-btn"
                            onClick={handleAddConfig}
                            disabled={time <= 0 || !message.trim()}
                        >
                            <i className="fa-solid fa-plus"></i> Adicionar Regra
                        </button>
                    </div>

                    {configs.length > 0 && (
                        <div className="configured-list-section">
                            <h4>Regras Adicionadas</h4>
                            <div className="rules-list">
                                {configs.map(config => (
                                    <div key={config.id} className="rule-item">
                                        <div className="rule-info">
                                            <span className="rule-time">
                                                <i className="fa-regular fa-clock"></i> {config.time} {
                                                    config.unit === 'hours' ? (config.time === 1 ? 'hora' : 'horas') :
                                                        config.unit === 'days' ? (config.time === 1 ? 'dia' : 'dias') :
                                                            (config.time === 1 ? 'semana' : 'semanas')
                                                } antes
                                            </span>
                                            <p className="rule-message-preview">{config.message}</p>
                                        </div>
                                        <button
                                            className="btn-icon-danger"
                                            onClick={() => handleRemoveConfig(config.id)}
                                            title="Remover regra"
                                        >
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Cancelar</button>
                    <button
                        className="btn-primary"
                        onClick={handleSave}
                        disabled={configs.length === 0}
                    >
                        Salvar Configurações
                    </button>
                </div>
            </div>
        </div>
    )
}
