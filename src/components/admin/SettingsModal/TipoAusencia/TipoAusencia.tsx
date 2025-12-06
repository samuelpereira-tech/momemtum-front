import { useState, useEffect } from 'react'
import ConfirmModal from '../../../ui/ConfirmModal/ConfirmModal'
import { absenceTypeService } from '../../../../services/basic/absenceTypeService'
import type { AbsenceTypeResponseDto } from '../../../../services/basic/absenceTypeService'
import { useToast } from '../../../ui/Toast/ToastProvider'
import './TipoAusencia.css'

export default function TipoAusencia() {
  const toast = useToast()
  const [tipos, setTipos] = useState<AbsenceTypeResponseDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState<Partial<AbsenceTypeResponseDto>>({
    name: '',
    description: undefined,
    color: '#AD82D9',
    active: true
  })
  const [tempColorInput, setTempColorInput] = useState('#AD82D9')
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  })

  useEffect(() => {
    loadTipos()
  }, [])

  const loadTipos = async () => {
    setIsLoading(true)
    try {
      const response = await absenceTypeService.getAllAbsenceTypes({ limit: 100 })
      setTipos(response.data)
    } catch (err: any) {
      console.error('Erro ao carregar tipos de ausência:', err)
      toast.showError('Erro ao carregar tipos de ausência')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = () => {
    setIsAdding(true)
    setIsEditing(null)
    setFormData({
      name: '',
      description: undefined,
      color: '#AD82D9',
      active: true
    })
    setTempColorInput('#AD82D9')
  }

  const handleEdit = (tipo: AbsenceTypeResponseDto) => {
    setIsEditing(tipo.id)
    setIsAdding(false)
    setFormData({
      name: tipo.name,
      description: tipo.description || undefined,
      color: tipo.color,
      active: tipo.active
    })
    setTempColorInput(tipo.color)
  }

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast.showError('O nome é obrigatório')
      return
    }

    try {
      if (isAdding) {
        await absenceTypeService.createAbsenceType({
          name: formData.name!,
          description: formData.description,
          color: formData.color || '#AD82D9',
          active: formData.active ?? true
        })
        toast.showSuccess('Tipo de ausência criado com sucesso!')
      } else if (isEditing) {
        await absenceTypeService.updateAbsenceType(isEditing, {
          name: formData.name!,
          description: formData.description,
          color: formData.color || '#AD82D9',
          active: formData.active ?? true
        })
        toast.showSuccess('Tipo de ausência atualizado com sucesso!')
      }
      await loadTipos()
      handleCancel()
    } catch (err: any) {
      console.error('Erro ao salvar tipo de ausência:', err)
      toast.showError(err.message || 'Erro ao salvar tipo de ausência')
    }
  }

  const handleCancel = () => {
    setIsAdding(false)
    setIsEditing(null)
    setFormData({
      name: '',
      description: undefined,
      color: '#AD82D9',
      active: true
    })
    setTempColorInput('#AD82D9')
  }

  const handleDelete = (id: string) => {
    setConfirmDelete({ isOpen: true, id })
  }

  const confirmDeleteAction = async () => {
    if (!confirmDelete.id) return

    try {
      await absenceTypeService.deleteAbsenceType(confirmDelete.id)
      toast.showSuccess('Tipo de ausência excluído com sucesso!')
      setConfirmDelete({ isOpen: false, id: null })
      await loadTipos()
    } catch (err: any) {
      console.error('Erro ao excluir tipo de ausência:', err)
      toast.showError(err.message || 'Erro ao excluir tipo de ausência')
      setConfirmDelete({ isOpen: false, id: null })
    }
  }

  const cancelDelete = () => {
    setConfirmDelete({ isOpen: false, id: null })
  }

  const handleToggleAtivo = async (id: string) => {
    try {
      await absenceTypeService.toggleAbsenceType(id)
      toast.showSuccess('Status do tipo de ausência alterado com sucesso!')
      await loadTipos()
    } catch (err: any) {
      console.error('Erro ao alterar status:', err)
      toast.showError(err.message || 'Erro ao alterar status do tipo de ausência')
    }
  }

  return (
    <div className="tipo-ausencia-container">
      <div className="tipo-ausencia-header">
        <h3 className="tipo-ausencia-title">Gerenciar Tipos de Ausência</h3>
        <button className="btn-primary" onClick={handleAdd}>
          <i className="fa-solid fa-plus"></i> Adicionar Tipo
        </button>
      </div>

      {(isAdding || isEditing) && (
        <div className="tipo-ausencia-form-card">
          <h4 className="form-card-title">
            {isAdding ? 'Adicionar Novo Tipo' : 'Editar Tipo'}
          </h4>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nome">
                <i className="fa-solid fa-tag"></i> Nome *
              </label>
              <input
                type="text"
                id="nome"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Férias, Feriado, Licença..."
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="descricao">
                <i className="fa-solid fa-file-text"></i> Descrição
              </label>
              <textarea
                id="descricao"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value || undefined })}
                placeholder="Descrição do tipo de ausência..."
                rows={3}
                maxLength={500}
              />
            </div>
          </div>
          <div className="form-row form-row-2">
            <div className="form-group">
              <label htmlFor="cor">
                <i className="fa-solid fa-palette"></i> Cor
              </label>
              <div className="color-picker-group">
                <input
                  type="color"
                  id="cor"
                  value={
                    formData.color && formData.color.length === 7 && /^#[0-9A-Fa-f]{6}$/.test(formData.color)
                      ? formData.color
                      : '#AD82D9'
                  }
                  onChange={(e) => {
                    const validColor = e.target.value.toUpperCase()
                    setFormData({ ...formData, color: validColor })
                    setTempColorInput(validColor)
                  }}
                  className="color-input"
                />
                <input
                  type="text"
                  value={tempColorInput}
                  onChange={(e) => {
                    let value = e.target.value.toUpperCase()
                    value = value.replace(/[^0-9A-F#]/g, '')
                    if (value && !value.startsWith('#')) {
                      value = '#' + value.replace(/#/g, '')
                    }
                    if (value.length > 7) {
                      value = value.substring(0, 7)
                    }
                    setTempColorInput(value)
                    if (value.length === 7 && /^#[0-9A-F]{6}$/.test(value)) {
                      setFormData({ ...formData, color: value })
                    }
                  }}
                  onBlur={(e) => {
                    let value = e.target.value.toUpperCase()
                    if (!value || value === '#') {
                      const defaultColor = '#AD82D9'
                      setTempColorInput(defaultColor)
                      setFormData({ ...formData, color: defaultColor })
                    } else if (value.startsWith('#') && value.length < 7) {
                      const hexPart = value.substring(1)
                      const paddedHex = hexPart.padEnd(6, '0').substring(0, 6)
                      if (/^[0-9A-F]{6}$/.test(paddedHex)) {
                        const finalColor = '#' + paddedHex
                        setTempColorInput(finalColor)
                        setFormData({ ...formData, color: finalColor })
                      } else {
                        const defaultColor = '#AD82D9'
                        setTempColorInput(defaultColor)
                        setFormData({ ...formData, color: defaultColor })
                      }
                    } else if (!/^#[0-9A-F]{6}$/.test(value)) {
                      const defaultColor = '#AD82D9'
                      setTempColorInput(defaultColor)
                      setFormData({ ...formData, color: defaultColor })
                    }
                  }}
                  placeholder="#AD82D9"
                  className="color-text-input"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="form-group">
              <label>
                <i className="fa-solid fa-toggle-on"></i> Status
              </label>
              <div className="toggle-group">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formData.active ?? true}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  <span className="toggle-label">
                    {formData.active ? 'Ativo' : 'Inativo'}
                  </span>
                </label>
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              <i className="fa-solid fa-times"></i> Cancelar
            </button>
            <button type="button" className="btn-primary" onClick={handleSave}>
              <i className="fa-solid fa-check"></i> Salvar
            </button>
          </div>
        </div>
      )}

      <div className="tipo-ausencia-table-card">
        <div className="table-info">
          <span>Total de tipos: {tipos.length}</span>
        </div>
        {isLoading ? (
          <div className="table-loading">
            <i className="fa-solid fa-spinner fa-spin"></i>
            <span>Carregando...</span>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Descrição</th>
                  <th>Cor</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {tipos.length > 0 ? (
                  tipos.map((tipo) => (
                    <tr key={tipo.id}>
                      <td>
                        <strong>{tipo.name}</strong>
                      </td>
                      <td>{tipo.description || '-'}</td>
                      <td>
                        <div className="color-preview">
                          <span 
                            className="color-badge" 
                            style={{ backgroundColor: tipo.color }}
                          ></span>
                          <span className="color-code">{tipo.color}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${tipo.active ? 'ativo' : 'inativo'}`}>
                          {tipo.active ? (
                            <>
                              <i className="fa-solid fa-check-circle"></i> Ativo
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-times-circle"></i> Inativo
                            </>
                          )}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn-action btn-toggle"
                            onClick={() => handleToggleAtivo(tipo.id)}
                            title={tipo.active ? 'Desativar' : 'Ativar'}
                          >
                            <i className={`fa-solid ${tipo.active ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-edit"
                            onClick={() => handleEdit(tipo)}
                            title="Editar"
                          >
                            <i className="fa-solid fa-pencil"></i>
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-delete"
                            onClick={() => handleDelete(tipo.id)}
                            title="Excluir"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="table-empty">
                      <i className="fa-solid fa-inbox"></i>
                      <span>Nenhum tipo de ausência cadastrado</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Excluir Tipo de Ausência"
        message="Tem certeza que deseja excluir este tipo de ausência? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={confirmDeleteAction}
        onCancel={cancelDelete}
        type="danger"
      />
    </div>
  )
}
