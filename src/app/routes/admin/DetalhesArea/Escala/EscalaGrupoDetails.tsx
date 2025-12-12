import { useParams, useNavigate } from 'react-router-dom'
import ScheduleGroupDetailsView from './ScheduleGroupDetailsView'

export default function EscalaGrupoDetails() {
  const { id: scheduledAreaId, groupId } = useParams<{ id: string; groupId: string }>()
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(`/Dashboard/escala/areas/${scheduledAreaId}/escala/grupos`)
  }

  const handleViewSchedules = () => {
    // Navegar para tabela com filtro de grupo
    navigate(`/Dashboard/escala/areas/${scheduledAreaId}/escala/tabela?grupo=${groupId}`)
  }

  if (!groupId) {
    return (
      <div className="error-container">
        <p>ID do grupo não encontrado</p>
      </div>
    )
  }

  return (
    <ScheduleGroupDetailsView
      groupId={groupId}
      onBack={handleBack}
      onViewSchedules={handleViewSchedules}
    />
  )
}

