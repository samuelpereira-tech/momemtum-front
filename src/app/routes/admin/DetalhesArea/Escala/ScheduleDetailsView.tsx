import { useState, useEffect } from 'react'
import { addCacheBusting } from '../../../../../utils/fileUtils'
import { useToast } from '../../../../../components/ui/Toast/ToastProvider'
import ConfirmModal from '../../../../../components/ui/ConfirmModal/ConfirmModal'
import {
  getScheduleDetails,
  addScheduleComment,
  updateScheduleComment,
  deleteScheduleComment,
  removeScheduleMember,
  updateScheduleMember,
  updateScheduleMemberStatus,
  mockResponsibilities,
  type ScheduleDetailsDto,
} from './mockServices'
import './ScheduleDetailsView.css'

interface ScheduleDetailsViewProps {
  scheduleId: string
  onBack: () => void
  onUpdate?: () => void
}

export default function ScheduleDetailsView({ scheduleId, onBack, onUpdate }: ScheduleDetailsViewProps) {
  const toast = useToast()
  const [schedule, setSchedule] = useState<ScheduleDetailsDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentContent, setEditingCommentContent] = useState('')
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState<string | null>(null)
  const [showDeleteMemberModal, setShowDeleteMemberModal] = useState<string | null>(null)

  useEffect(() => {
    loadScheduleDetails()
  }, [scheduleId])

  const loadScheduleDetails = async () => {
    setLoading(true)
    try {
      const details = await getScheduleDetails(scheduleId)
      setSchedule(details)
    } catch (error: any) {
      toast.showError('Erro ao carregar detalhes da escala: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !schedule) return

    try {
      await addScheduleComment(scheduleId, newComment.trim())
      setNewComment('')
      await loadScheduleDetails()
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
    if (!editingCommentId || !editingCommentContent.trim() || !schedule) return

    try {
      await updateScheduleComment(scheduleId, editingCommentId, editingCommentContent.trim())
      setEditingCommentId(null)
      setEditingCommentContent('')
      await loadScheduleDetails()
      onUpdate?.()
      toast.showSuccess('Comentário atualizado com sucesso')
    } catch (error: any) {
      toast.showError('Erro ao atualizar comentário: ' + (error.message || 'Erro desconhecido'))
    }
  }

  const handleDeleteComment = async () => {
    if (!showDeleteCommentModal || !schedule) return

    try {
      await deleteScheduleComment(scheduleId, showDeleteCommentModal)
      setShowDeleteCommentModal(null)
      await loadScheduleDetails()
      onUpdate?.()
      toast.showSuccess('Comentário removido com sucesso')
    } catch (error: any) {
      toast.showError('Erro ao remover comentário: ' + (error.message || 'Erro desconhecido'))
    }
  }

  const handleRemoveMember = async () => {
    if (!showDeleteMemberModal || !schedule) return

    try {
      await removeScheduleMember(scheduleId, showDeleteMemberModal)
      setShowDeleteMemberModal(null)
      await loadScheduleDetails()
      onUpdate?.()
      toast.showSuccess('Membro removido com sucesso')
    } catch (error: any) {
      toast.showError('Erro ao remover membro: ' + (error.message || 'Erro desconhecido'))
    }
  }

  const handleUpdateMemberResponsibility = async (memberId: string, responsibilityId: string, responsibilityName: string) => {
    try {
      await updateScheduleMember(scheduleId, memberId, responsibilityId, responsibilityName)
      await loadScheduleDetails()
      onUpdate?.()
      toast.showSuccess('Função do membro atualizada com sucesso')
    } catch (error: any) {
      toast.showError('Erro ao atualizar membro: ' + (error.message || 'Erro desconhecido'))
    }
  }

  const handleUpdateMemberStatus = async (memberId: string, status: 'pending' | 'accepted' | 'rejected') => {
    try {
      await updateScheduleMemberStatus(scheduleId, memberId, status)
      await loadScheduleDetails()
      onUpdate?.()
      toast.showSuccess('Status do membro atualizado com sucesso')
    } catch (error: any) {
      toast.showError('Erro ao atualizar status do membro: ' + (error.message || 'Erro desconhecido'))
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

  return (
    <>
      <div className="schedule-details-container">
        {/* Header Principal */}
        <div className="schedule-details-header">
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
                    <span className="date-time-value">{formatDateTime(schedule.startDatetime)}</span>
                  </div>
                </div>

                <div className="date-time-item">
                  <div className="date-time-icon">
                    <i className="fa-solid fa-calendar-xmark"></i>
                  </div>
                  <div className="date-time-content">
                    <span className="date-time-label">Fim</span>
                    <span className="date-time-value">{formatDateTime(schedule.endDatetime)}</span>
                  </div>
                </div>
              </div>

              <div className="status-section">
                <span className={`status-label-large status-${schedule.status === 'confirmed' ? 'confirmed' : schedule.status === 'cancelled' ? 'cancelled' : 'pending'}-large`}>
                  {getStatusLabel(schedule.status)}
                </span>
              </div>
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
                        {member.personPhotoUrl ? (
                          <img
                            src={addCacheBusting(member.personPhotoUrl)}
                            alt={member.personName}
                            className="member-card-photo"
                          />
                        ) : (
                          <div className="member-card-placeholder">
                            {member.personName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="member-card-name">{member.personName}</div>

                      {editingMemberId === member.id ? (
                        <div className="member-edit-mode">
                          <label className="edit-label">Função:</label>
                          <select
                            value={member.responsibilityId}
                            onChange={(e) => {
                              const selected = mockResponsibilities.find(r => r.id === e.target.value)
                              if (selected) {
                                handleUpdateMemberResponsibility(member.id, selected.id, selected.name)
                              }
                            }}
                            className="member-edit-select"
                          >
                            {mockResponsibilities.map((resp) => (
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
                            {member.responsibilityImageUrl && (
                              <img
                                src={addCacheBusting(member.responsibilityImageUrl)}
                                alt={member.responsibilityName}
                                style={{ width: '16px', height: '16px', borderRadius: '4px' }}
                              />
                            )}
                            <span>{member.responsibilityName}</span>
                          </div>

                          <div className={`member-status-badge status-${member.status}`}>
                            {member.status === 'accepted' && <i className="fa-solid fa-check"></i>}
                            {member.status === 'rejected' && <i className="fa-solid fa-xmark"></i>}
                            {member.status === 'pending' && <i className="fa-solid fa-clock"></i>}
                            {getStatusLabel(member.status)}
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
