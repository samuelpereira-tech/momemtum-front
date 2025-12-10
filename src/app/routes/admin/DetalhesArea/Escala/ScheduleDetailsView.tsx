import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { addCacheBusting } from '../../../../../utils/fileUtils'
import { useToast } from '../../../../../components/ui/Toast/ToastProvider'
import ConfirmModal from '../../../../../components/ui/ConfirmModal/ConfirmModal'
import { scheduleService, type ScheduleDetailsResponseDto, type ScheduleMemberLogDto } from '../../../../../services/basic/scheduleService'
import { scheduleCommentService } from '../../../../../services/basic/scheduleCommentService'
import { scheduleMemberService } from '../../../../../services/basic/scheduleMemberService'
import { responsibilityService } from '../../../../../services/basic/responsibilityService'
import './ScheduleDetailsView.css'

interface ScheduleDetailsViewProps {
  scheduleId: string
  onBack: () => void
  onUpdate?: () => void
}

// Tipo para compatibilidade
type ScheduleDetailsDto = ScheduleDetailsResponseDto

export default function ScheduleDetailsView({ scheduleId, onBack, onUpdate }: ScheduleDetailsViewProps) {
  const { id: scheduledAreaId } = useParams<{ id: string }>()
  const toast = useToast()
  const [schedule, setSchedule] = useState<ScheduleDetailsDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [responsibilities, setResponsibilities] = useState<Array<{ id: string; name: string }>>([])
  const [newComment, setNewComment] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentContent, setEditingCommentContent] = useState('')
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState<string | null>(null)
  const [showDeleteMemberModal, setShowDeleteMemberModal] = useState<string | null>(null)
  const [editingSchedule, setEditingSchedule] = useState(false)
  const [editStartDatetime, setEditStartDatetime] = useState('')
  const [editEndDatetime, setEditEndDatetime] = useState('')
  const [editStatus, setEditStatus] = useState<'pending' | 'confirmed' | 'cancelled'>('pending')
  const [logs, setLogs] = useState<ScheduleMemberLogDto[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  useEffect(() => {
    if (scheduledAreaId) {
      loadScheduleDetails()
      loadResponsibilities()
      loadScheduleLogs()
    }
  }, [scheduleId, scheduledAreaId])

  const loadResponsibilities = async () => {
    if (!scheduledAreaId) return

    try {
      let allResponsibilities: Array<{ id: string; name: string }> = []
      let page = 1
      let hasMore = true
      const limit = 100

      while (hasMore) {
        const response = await responsibilityService.getAllResponsibilities({
          scheduledAreaId,
          page,
          limit,
        })
        allResponsibilities = [...allResponsibilities, ...response.data.map(r => ({ id: r.id, name: r.name }))]

        if (page >= response.meta.totalPages || response.data.length === 0) {
          hasMore = false
        } else {
          page++
        }
      }

      setResponsibilities(allResponsibilities)
    } catch (error) {
      console.error('Erro ao carregar responsabilidades:', error)
    }
  }

  const loadScheduleDetails = async (showLoading = true) => {
    if (!scheduledAreaId) return

    if (showLoading) setLoading(true)
    try {
      const details = await scheduleService.getScheduleById(scheduledAreaId, scheduleId)
      setSchedule(details)
    } catch (error: any) {
      toast.showError('Erro ao carregar detalhes da escala: ' + (error.message || 'Erro desconhecido'))
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const loadScheduleLogs = async () => {
    if (!scheduledAreaId) return

    setLoadingLogs(true)
    try {
      const scheduleLogs = await scheduleService.getScheduleLogs(scheduledAreaId, scheduleId)
      setLogs(scheduleLogs)
    } catch (error: any) {
      console.error('Erro ao carregar logs da escala:', error)
      // Não mostrar erro para o usuário, apenas logar no console
    } finally {
      setLoadingLogs(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !schedule || !scheduledAreaId) return

    try {
      await scheduleCommentService.addComment(scheduledAreaId, scheduleId, { content: newComment.trim() })
      setNewComment('')
      await loadScheduleDetails()
      await loadScheduleLogs()
      onUpdate?.()
      toast.showSuccess('Comentário adicionado com sucesso')
    } catch (error: any) {
      toast.showError('Erro ao adicionar comentário: ' + (error.message || 'Erro desconhecido'))
    }
  }

  const handleStartEditComment = (comment: { id: string; content: string }) => {
    setEditingCommentId(comment.id)
    setEditingCommentContent(comment.content)
  }

  const handleSaveComment = async () => {
    if (!editingCommentId || !editingCommentContent.trim() || !schedule || !scheduledAreaId) return

    try {
      await scheduleCommentService.updateComment(scheduledAreaId, scheduleId, editingCommentId, { content: editingCommentContent.trim() })
      setEditingCommentId(null)
      setEditingCommentContent('')
      await loadScheduleDetails()
      await loadScheduleLogs()
      onUpdate?.()
      toast.showSuccess('Comentário atualizado com sucesso')
    } catch (error: any) {
      toast.showError('Erro ao atualizar comentário: ' + (error.message || 'Erro desconhecido'))
    }
  }

  const handleDeleteComment = async () => {
    if (!showDeleteCommentModal || !schedule || !scheduledAreaId) return

    try {
      await scheduleCommentService.deleteComment(scheduledAreaId, scheduleId, showDeleteCommentModal)
      setShowDeleteCommentModal(null)
      await loadScheduleDetails()
      await loadScheduleLogs()
      onUpdate?.()
      toast.showSuccess('Comentário removido com sucesso')
    } catch (error: any) {
      toast.showError('Erro ao remover comentário: ' + (error.message || 'Erro desconhecido'))
    }
  }

  const handleRemoveMember = async () => {
    if (!showDeleteMemberModal || !schedule || !scheduledAreaId) return

    try {
      await scheduleMemberService.removeMember(scheduledAreaId, scheduleId, showDeleteMemberModal)
      setShowDeleteMemberModal(null)
      await loadScheduleDetails()
      await loadScheduleLogs()
      onUpdate?.()
      toast.showSuccess('Membro removido com sucesso')
    } catch (error: any) {
      toast.showError('Erro ao remover membro: ' + (error.message || 'Erro desconhecido'))
    }
  }

  const handleUpdateMemberResponsibility = async (memberId: string, responsibilityId: string, responsibilityName: string) => {
    if (!scheduledAreaId) return

    try {
      await scheduleMemberService.updateMember(scheduledAreaId, scheduleId, memberId, { responsibilityId })
      await loadScheduleDetails()
      await loadScheduleLogs()
      onUpdate?.()
      toast.showSuccess('Função do membro atualizada com sucesso')
    } catch (error: any) {
      toast.showError('Erro ao atualizar membro: ' + (error.message || 'Erro desconhecido'))
    }
  }

  const handleUpdateMemberStatus = async (memberId: string, status: 'pending' | 'accepted' | 'rejected') => {
    if (!scheduledAreaId) return

    try {
      await scheduleMemberService.updateMember(scheduledAreaId, scheduleId, memberId, { status })
      await loadScheduleDetails()
      await loadScheduleLogs()
      onUpdate?.()
      toast.showSuccess('Status do membro atualizado com sucesso')
    } catch (error: any) {
      toast.showError('Erro ao atualizar status do membro: ' + (error.message || 'Erro desconhecido'))
    }
  }

  const handleUpdateMemberPresence = async (memberId: string, present: boolean | null) => {
    if (!scheduledAreaId || !schedule) return

    // Optimistic Update
    const originalSchedule = { ...schedule }
    const updatedMembers = schedule.members.map(m =>
      m.id === memberId ? { ...m, present: present === true } : m
    )
    setSchedule({ ...schedule, members: updatedMembers })

    try {
      await scheduleMemberService.updateMember(scheduledAreaId, scheduleId, memberId, { present })
      // Reload silently to ensure data consistency
      await loadScheduleDetails(false)
      await loadScheduleLogs()
      onUpdate?.()
      const message = present === true ? 'Presença marcada' : 'Presença removida'
      toast.showSuccess(message)
    } catch (error: any) {
      // Rollback on error
      setSchedule(originalSchedule)
      toast.showError('Erro ao atualizar presença: ' + (error.message || 'Erro desconhecido'))
    }
  }

  const handleStartEditDatetime = () => {
    if (!schedule) return
    setEditStartDatetime(new Date(schedule.startDatetime).toISOString().slice(0, 16))
    setEditEndDatetime(new Date(schedule.endDatetime).toISOString().slice(0, 16))
    setEditStatus(schedule.status)
    setEditingSchedule(true)
  }

  const handleCancelEditSchedule = () => {
    setEditingSchedule(false)
  }

  const handleSaveSchedule = async () => {
    if (!schedule || !scheduledAreaId) return

    try {
      const updateData: {
        startDatetime?: string
        endDatetime?: string
        status?: 'pending' | 'confirmed' | 'cancelled'
      } = {}

      // Verificar se as datas foram alteradas
      const startDate = new Date(editStartDatetime)
      const endDate = new Date(editEndDatetime)

      if (startDate.toISOString() !== new Date(schedule.startDatetime).toISOString()) {
        updateData.startDatetime = startDate.toISOString()
      }

      if (endDate.toISOString() !== new Date(schedule.endDatetime).toISOString()) {
        updateData.endDatetime = endDate.toISOString()
      }

      // Validar que a data fim é depois da data início
      if (endDate <= startDate) {
        toast.showError('A data de fim deve ser posterior à data de início')
        return
      }

      if (editStatus !== schedule.status) {
        updateData.status = editStatus
      }

      // Só atualizar se houver mudanças
      if (Object.keys(updateData).length > 0) {
        await scheduleService.updateSchedule(scheduledAreaId, scheduleId, updateData)
        await loadScheduleDetails()
        await loadScheduleLogs()
        onUpdate?.()
        setEditingSchedule(false)
        toast.showSuccess('Escala atualizada com sucesso')
      } else {
        setEditingSchedule(false)
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Erro desconhecido'
      console.error('Erro ao atualizar escala:', error)
      toast.showError(errorMessage)
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'accepted':
        return 'status-badge status-confirmed'
      case 'cancelled':
      case 'rejected':
        return 'status-badge status-cancelled'
      default:
        return 'status-badge status-pending'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'accepted':
        return 'Confirmado'
      case 'cancelled':
      case 'rejected':
        return 'Rejeitado'
      default:
        return 'Pendente'
    }
  }

  if (loading) {
    return (
      <div className="schedule-details-container">
        <div className="schedule-details-header">
          <div className="loading-container">
            <i className="fa-solid fa-spinner fa-spin"></i>
            <span style={{ marginLeft: '10px' }}>Carregando detalhes...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!schedule) {
    return null
  }

  console.log(schedule.members)

  return (
    <>
      <div className="schedule-details-container">
        {/* Header Principal */}
        <div className="schedule-details-header" style={{ display: 'none' }}>
          <h3 className="schedule-details-title">Detalhes da Escala</h3>
        </div>

        <div className="schedule-details-body">
          {/* Sidebar: Informações e Status */}
          <div className="sidebar-section">
            <div className="detail-card">
              <div className="info-card-header">
                <h4 className="info-card-title">
                  <i className="fa-solid fa-circle-info"></i> Informações
                </h4>
              </div>

              <div className="date-time-grid">
                <div className="date-time-item">
                  <div className="date-time-icon">
                    <i className="fa-solid fa-calendar-check"></i>
                  </div>
                  <div className="date-time-content">
                    <span className="date-time-label">Início</span>
                    {editingSchedule ? (
                      <input
                        type="datetime-local"
                        value={editStartDatetime}
                        onChange={(e) => setEditStartDatetime(e.target.value)}
                        className="date-time-input"
                      />
                    ) : (
                      <span
                        className="date-time-value date-time-editable"
                        onClick={handleStartEditDatetime}
                        title="Clique para editar"
                      >
                        {formatDateTime(schedule.startDatetime)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="date-time-item">
                  <div className="date-time-icon">
                    <i className="fa-solid fa-calendar-xmark"></i>
                  </div>
                  <div className="date-time-content">
                    <span className="date-time-label">Fim</span>
                    {editingSchedule ? (
                      <input
                        type="datetime-local"
                        value={editEndDatetime}
                        onChange={(e) => setEditEndDatetime(e.target.value)}
                        className="date-time-input"
                      />
                    ) : (
                      <span
                        className="date-time-value date-time-editable"
                        onClick={handleStartEditDatetime}
                        title="Clique para editar"
                      >
                        {formatDateTime(schedule.endDatetime)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="status-section">
                {editingSchedule ? (
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'pending' | 'confirmed' | 'cancelled')}
                    className="status-select"
                  >
                    <option value="pending">Pendente</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                ) : (
                  <span
                    className={`status-label-large status-${schedule.status === 'confirmed' ? 'confirmed' : schedule.status === 'cancelled' ? 'cancelled' : 'pending'}-large status-editable`}
                    onClick={handleStartEditDatetime}
                    title="Clique para editar"
                  >
                    {getStatusLabel(schedule.status)}
                  </span>
                )}
              </div>

              {editingSchedule && (
                <div className="schedule-edit-actions">
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={handleCancelEditSchedule}
                  >
                    <i className="fa-solid fa-xmark"></i> Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn-primary btn-sm"
                    onClick={handleSaveSchedule}
                  >
                    <i className="fa-solid fa-check"></i> Salvar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Conteúdo Principal: Membros e Comentários */}
          <div className="main-content-section">

            {/* Seção de Membros */}
            <div className="detail-card">
              <div className="info-card-header">
                <h4 className="info-card-title">
                  <i className="fa-solid fa-users"></i> Equipe Escalada ({schedule.members.length})
                </h4>
              </div>

              {schedule.members.length === 0 ? (
                <div className="empty-members">
                  <i className="fa-solid fa-user-slash"></i>
                  <p>Nenhum membro nesta escala</p>
                </div>
              ) : (
                <div className="members-grid">
                  {schedule.members.map((member) => (
                    <div key={member.id} className="member-card">
                      <div className="member-photo-wrapper">
                        {member.person?.photoUrl ? (
                          <img
                            src={addCacheBusting(member.person.photoUrl)}
                            alt={member.person.fullName}
                            className="member-card-photo"
                          />
                        ) : (
                          <div className="member-card-placeholder">
                            {member.person?.fullName?.charAt(0).toUpperCase() || member.personId.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="member-card-name">{member.person?.fullName || member.personId}</div>

                      {editingMemberId === member.id ? (
                        <div className="member-edit-mode">
                          <label className="edit-label">Função:</label>
                          <select
                            value={member.responsibilityId}
                            onChange={(e) => {
                              const selected = responsibilities.find(r => r.id === e.target.value)
                              if (selected) {
                                handleUpdateMemberResponsibility(member.id, selected.id, selected.name)
                              }
                            }}
                            className="member-edit-select"
                          >
                            {responsibilities.map((resp) => (
                              <option key={resp.id} value={resp.id}>
                                {resp.name}
                              </option>
                            ))}
                          </select>

                          <label className="edit-label">Status:</label>
                          <select
                            value={member.status}
                            onChange={(e) => handleUpdateMemberStatus(member.id, e.target.value as any)}
                            className="member-edit-select"
                          >
                            <option value="pending">Pendente</option>
                            <option value="accepted">Confirmado</option>
                            <option value="rejected">Rejeitado</option>
                          </select>

                          <button
                            className="btn-secondary btn-sm"
                            style={{ marginTop: '5px', width: '100%' }}
                            onClick={() => setEditingMemberId(null)}
                          >
                            Concluir
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="member-card-role">
                            {member.responsibility?.imageUrl && (
                              <img
                                src={addCacheBusting(member.responsibility.imageUrl)}
                                alt={member.responsibility.name}
                                style={{ width: '16px', height: '16px', borderRadius: '4px' }}
                              />
                            )}
                            <span>{member.responsibility?.name || 'Sem função'}</span>
                          </div>

                          <div className={`member-status-badge status-${member.status}`}>
                            {member.status === 'accepted' && <i className="fa-solid fa-check"></i>}
                            {member.status === 'rejected' && <i className="fa-solid fa-xmark"></i>}
                            {member.status === 'pending' && <i className="fa-solid fa-clock"></i>}
                            {getStatusLabel(member.status)}
                          </div>

                          <div className="member-presence-section">
                            <label className={`presence-label ${member.present === true ? 'presence-checked' : ''}`}>
                              <input
                                type="checkbox"
                                checked={member.present === true}
                                onChange={(e) => handleUpdateMemberPresence(member.id, e.target.checked ? true : null)}
                                className="presence-checkbox"
                              />
                              <span className="presence-text">
                                {member.present === true ? (
                                  <>
                                    <i className="fa-solid fa-check-circle"></i> Presente
                                  </>
                                ) : (
                                  <>
                                    <i className="fa-regular fa-circle"></i> Marcar presença
                                  </>
                                )}
                              </span>
                            </label>
                          </div>
                        </>
                      )}

                      <div className="member-card-actions">
                        {editingMemberId !== member.id && (
                          <>
                            <button
                              type="button"
                              className="btn-card-action"
                              onClick={() => setEditingMemberId(member.id)}
                              title="Editar função"
                            >
                              <i className="fa-solid fa-pen"></i>
                            </button>
                            <button
                              type="button"
                              className="btn-card-action danger"
                              onClick={() => setShowDeleteMemberModal(member.id)}
                              title="Remover membro"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Seção de Logs */}
            <div className="detail-card">
              <div className="info-card-header">
                <h4 className="info-card-title">
                  <i className="fa-solid fa-history"></i> Histórico de Alterações {logs.length > 0 && `(${logs.length})`}
                </h4>
              </div>

              {loadingLogs ? (
                <div className="loading-container" style={{ padding: '20px', textAlign: 'center' }}>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span style={{ marginLeft: '10px' }}>Carregando logs...</span>
                </div>
              ) : logs.length === 0 ? (
                <div className="empty-logs" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  <i className="fa-solid fa-history" style={{ fontSize: '2rem', marginBottom: '10px', opacity: 0.5 }}></i>
                  <p>Nenhuma alteração registrada ainda</p>
                </div>
              ) : (
                <div className="logs-container">
                  {logs.map((log) => (
                    <div key={log.id} className="log-item">
                      <div className="log-icon">
                        {log.action === 'schedule_created' && <i className="fa-solid fa-plus-circle"></i>}
                        {log.action === 'schedule_updated' && <i className="fa-solid fa-edit"></i>}
                        {(log.action === 'schedule_status_changed') && <i className="fa-solid fa-toggle-on"></i>}
                        {(log.action === 'schedule_datetime_changed' || log.action === 'schedule_start_date_changed' || log.action === 'schedule_end_date_changed') && <i className="fa-solid fa-calendar-alt"></i>}
                        {log.action === 'member_added' && <i className="fa-solid fa-user-plus"></i>}
                        {log.action === 'member_removed' && <i className="fa-solid fa-user-minus"></i>}
                        {log.action === 'member_status_changed' && <i className="fa-solid fa-user-check"></i>}
                        {log.action === 'member_present_changed' && <i className="fa-solid fa-clipboard-check"></i>}
                        {log.action === 'member_responsibility_changed' && <i className="fa-solid fa-briefcase"></i>}
                        {log.action === 'team_changed' && <i className="fa-solid fa-users"></i>}
                        {log.action === 'team_member_status_changed' && <i className="fa-solid fa-user-gear"></i>}
                        {!log.action && <i className="fa-solid fa-info-circle"></i>}
                      </div>
                      <div className="log-content">
                        <div className="log-description">{log.description}</div>
                        <div className="log-meta">
                          <span className="log-user">{log.userName || 'Sistema'}</span>
                          <span className="log-separator">•</span>
                          <span className="log-time">{formatDateTime(log.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Seção de Comentários */}
            <div className="detail-card">
              <div className="info-card-header">
                <h4 className="info-card-title">
                  <i className="fa-solid fa-comments"></i> Discussão ({schedule.comments.length})
                </h4>
              </div>

              <div className="comments-container">
                {schedule.comments.length === 0 && (
                  <div className="empty-comments">
                    <i className="fa-regular fa-comments"></i>
                    <p>Nenhum comentário ainda. Inicie a conversa!</p>
                  </div>
                )}

                {schedule.comments.map((comment) => (
                  <div key={comment.id} className="comment-bubble">
                    <div className="comment-avatar-placeholder">
                      {comment.authorName.charAt(0).toUpperCase()}
                    </div>

                    <div className="comment-body">
                      <div className="comment-header">
                        <span className="comment-author-name">{comment.authorName}</span>
                        <span className="comment-timestamp">{formatDateTime(comment.createdAt)}</span>
                      </div>

                      {editingCommentId === comment.id ? (
                        <div className="comment-edit">
                          <textarea
                            value={editingCommentContent}
                            onChange={(e) => setEditingCommentContent(e.target.value)}
                            className="comment-textarea"
                          />
                          <div style={{ marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button className="btn-secondary" onClick={() => setEditingCommentId(null)}>Cancelar</button>
                            <button className="btn-primary" onClick={handleSaveComment} style={{ background: 'var(--color-purple)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px' }}>Salvar</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="comment-text">{comment.content}</div>
                          <div className="comment-footer-actions">
                            <button className="comment-action-link" onClick={() => handleStartEditComment(comment)}>Editar</button>
                            <button className="comment-action-link danger" onClick={() => setShowDeleteCommentModal(comment.id)}>Excluir</button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="add-comment-area">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escreva um comentário..."
                  className="comment-textarea"
                  rows={3}
                />
                <button
                  type="button"
                  className="comment-submit-btn"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  Enviar Comentário
                </button>
                <div style={{ clear: 'both' }}></div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!showDeleteCommentModal}
        title="Remover Comentário"
        message="Tem certeza que deseja remover este comentário?"
        confirmText="Remover"
        cancelText="Cancelar"
        type="warning"
        onConfirm={handleDeleteComment}
        onCancel={() => setShowDeleteCommentModal(null)}
      />

      <ConfirmModal
        isOpen={!!showDeleteMemberModal}
        title="Remover Membro"
        message="Tem certeza que deseja remover este membro da escala?"
        confirmText="Remover"
        cancelText="Cancelar"
        type="warning"
        onConfirm={handleRemoveMember}
        onCancel={() => setShowDeleteMemberModal(null)}
      />
    </>
  )
}
