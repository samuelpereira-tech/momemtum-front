import { useParams, useNavigate } from 'react-router-dom'
import ScheduleDetailsView from './ScheduleDetailsView'

export default function EscalaScheduleDetails() {
  const { id: _scheduledAreaId, scheduleId } = useParams<{ id: string; scheduleId: string }>()
  const navigate = useNavigate()

  const handleBack = () => {
    // Voltar para a rota anterior (tabela ou cards)
    navigate(-1)
  }

  const handleUpdate = () => {
    // Recarregar pode ser feito pelo ScheduleDetailsView internamente
    // ou podemos navegar de volta e recarregar
  }

  if (!scheduleId) {
    return (
      <div className="error-container">
        <p>ID da escala não encontrado</p>
      </div>
    )
  }

  return (
    <ScheduleDetailsView
      scheduleId={scheduleId}
      onBack={handleBack}
      onUpdate={handleUpdate}
    />
  )
}

