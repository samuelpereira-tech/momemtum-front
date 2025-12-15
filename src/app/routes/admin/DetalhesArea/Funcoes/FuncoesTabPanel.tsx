import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useToast } from '../../../../../components/ui/Toast/ToastProvider'
import { responsibilityService, type ResponsibilityResponseDto } from '../../../../../services/basic/responsibilityService'
import { scheduledAreaService, type ScheduledAreaResponseDto } from '../../../../../services/basic/scheduledAreaService'
import { validateImageFile, createImagePreview, addCacheBusting } from '../../../../../utils/fileUtils'
import ConfirmModal from '../../../../../components/ui/ConfirmModal/ConfirmModal'
import Modal from '../shared/Modal'
import '../shared/TabPanel.css'
import './FuncoesTabPanel.css'

export default function FuncoesTabPanel() {
  const { id: scheduledAreaId } = useParams<{ id: string }>()
  const toast = useToast()
  const [funcoes, setFuncoes] = useState<ResponsibilityResponseDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showCloneModal, setShowCloneModal] = useState(false)
  const [showDeleteFuncaoModal, setShowDeleteFuncaoModal] = useState(false)
  const [funcaoEditando, setFuncaoEditando] = useState<ResponsibilityResponseDto | null>(null)
  const [funcaoParaDeletar, setFuncaoParaDeletar] = useState<{ id: string; nome: string } | null>(null)

  useEffect(() => {
    if (scheduledAreaId) {
      loadFuncoes()
    }
  }, [scheduledAreaId])

  const loadFuncoes = async () => {
    if (!scheduledAreaId) return

    setIsLoading(true)
    try {
      const response = await responsibilityService.getAllResponsibilities({
        scheduledAreaId,
        limit: 100
      })
      setFuncoes(response.data)
    } catch (error: any) {
      console.error('Erro ao carregar funções:', error)
      toast.showError(error.message || 'Erro ao carregar funções')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExcluirFuncao = (funcaoId: string, funcaoNome: string) => {
    setFuncaoParaDeletar({ id: funcaoId, nome: funcaoNome })
    setShowDeleteFuncaoModal(true)
  }

  const confirmExcluirFuncao = async () => {
    if (!funcaoParaDeletar) return

    try {
      await responsibilityService.deleteResponsibility(funcaoParaDeletar.id)
      setFuncoes(prevFuncoes => prevFuncoes.filter(funcao => funcao.id !== funcaoParaDeletar.id))
      setShowDeleteFuncaoModal(false)
      setFuncaoParaDeletar(null)
      toast.showSuccess(`Função "${funcaoParaDeletar.nome}" excluída com sucesso!`)
    } catch (error: any) {
      console.error('Erro ao excluir função:', error)
      toast.showError(error.message || 'Erro ao excluir função')
    }
  }

  const handleAdicionarFuncao = () => {
    setFuncaoEditando(null)
    setShowModal(true)
  }

  const handleEditarFuncao = (funcao: ResponsibilityResponseDto) => {
    setFuncaoEditando(funcao)
    setShowModal(true)
  }

  const handleClonarFuncoes = () => {
    setShowCloneModal(true)
  }

  return (
    <div className="tab-panel">
      <div className="tab-panel-header">
        <h3 className="tab-panel-title">
          <i className="fa-solid fa-briefcase"></i> Funções
        </h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={handleClonarFuncoes}>
            <i className="fa-solid fa-copy"></i> Clonar Funções
          </button>
          <button className="btn-primary" onClick={handleAdicionarFuncao}>
            <i className="fa-solid fa-plus"></i> Adicionar Função
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="empty-state">
          <i className="fa-solid fa-spinner fa-spin"></i>
          <p>Carregando funções...</p>
        </div>
      ) : funcoes.length === 0 ? (
        <div className="empty-state">
          <i className="fa-solid fa-briefcase"></i>
          <p>Nenhuma função cadastrada</p>
          <button className="btn-secondary" onClick={handleAdicionarFuncao}>
            <i className="fa-solid fa-plus"></i> Criar Primeira Função
          </button>
        </div>
      ) : (
        <div className="funcoes-grid">
          {funcoes.map((funcao) => (
            <div key={funcao.id} className="funcao-card">
              <div className="funcao-card-header">
                <div className="funcao-image-container">
                  {funcao.imageUrl ? (
                    <img
                      src={addCacheBusting(funcao.imageUrl)}
                      alt={funcao.name}
                      className="funcao-image"
                    />
                  ) : (
                    <div className="funcao-image-placeholder">
                      <i className="fa-solid fa-briefcase"></i>
                    </div>
                  )}
                </div>
              </div>
              <div className="funcao-info">
                <h4 className="funcao-title" title={funcao.name}>{funcao.name}</h4>
                <p className="funcao-description" title={funcao.description || ''}>
                  {funcao.description || 'Sem descrição'}
                </p>
              </div>
              <div className="funcao-card-footer">
                <button
                  type="button"
                  className="btn-icon btn-icon-edit"
                  onClick={() => handleEditarFuncao(funcao)}
                  title="Editar função"
                >
                  <i className="fa-solid fa-pencil"></i>
                </button>
                <button
                  type="button"
                  className="btn-icon btn-icon-delete"
                  onClick={() => handleExcluirFuncao(funcao.id, funcao.name)}
                  title="Excluir função"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && scheduledAreaId && (
        <FuncaoModal
          funcao={funcaoEditando}
          scheduledAreaId={scheduledAreaId}
          onClose={() => {
            setShowModal(false)
            setFuncaoEditando(null)
          }}
          onSave={async (funcao, imageFile) => {
            try {
              if (funcaoEditando) {
                // Atualizar dados da função
                const updated = await responsibilityService.updateResponsibility(funcao.id, {
                  name: funcao.name,
                  description: funcao.description || undefined,
                })

                // Fazer upload da imagem se houver uma nova imagem selecionada
                if (imageFile) {
                  try {
                    const imageResult = await responsibilityService.uploadImage(updated.id, imageFile)
                    updated.imageUrl = imageResult.imageUrl
                  } catch (imageError: any) {
                    console.error('Erro ao fazer upload da imagem:', imageError)
                    toast.showWarning('Função atualizada, mas houve erro ao atualizar a imagem')
                  }
                }

                setFuncoes(prev => prev.map(f => f.id === updated.id ? updated : f))
                toast.showSuccess('Função atualizada com sucesso!')
              } else {
                // Criar nova função
                const created = await responsibilityService.createResponsibility({
                  name: funcao.name,
                  description: funcao.description || undefined,
                  scheduledAreaId,
                })

                // Fazer upload da imagem se houver
                if (imageFile) {
                  try {
                    const imageResult = await responsibilityService.uploadImage(created.id, imageFile)
                    created.imageUrl = imageResult.imageUrl
                  } catch (imageError: any) {
                    console.error('Erro ao fazer upload da imagem:', imageError)
                    // Não falhar o cadastro se o upload da imagem falhar
                  }
                }

                setFuncoes(prev => [...prev, created])
                toast.showSuccess('Função cadastrada com sucesso!')
              }
              setShowModal(false)
              setFuncaoEditando(null)
            } catch (error: any) {
              console.error('Erro ao salvar função:', error)
              toast.showError(error.message || 'Erro ao salvar função')
            }
          }}
        />
      )}

      {showCloneModal && scheduledAreaId && (
        <CloneFuncoesModal
          currentAreaId={scheduledAreaId}
          onClose={() => setShowCloneModal(false)}
          onCloneSuccess={() => {
            setShowCloneModal(false)
            loadFuncoes()
          }}
        />
      )}

      <ConfirmModal
        isOpen={showDeleteFuncaoModal}
        title="Excluir Função"
        message={funcaoParaDeletar ? `Tem certeza que deseja excluir a função "${funcaoParaDeletar.nome}"?` : ''}
        onConfirm={confirmExcluirFuncao}
        onCancel={() => {
          setShowDeleteFuncaoModal(false)
          setFuncaoParaDeletar(null)
        }}
      />
    </div>
  )
}

// Componente Modal para adicionar/editar função
function FuncaoModal({
  funcao,
  scheduledAreaId,
  onClose,
  onSave
}: {
  funcao: ResponsibilityResponseDto | null
  scheduledAreaId: string
  onClose: () => void
  onSave: (funcao: ResponsibilityResponseDto, imageFile: File | null) => Promise<void>
}) {
  const [nome, setNome] = useState(funcao?.name || '')
  const [descricao, setDescricao] = useState(funcao?.description || '')
  const [imagemPreview, setImagemPreview] = useState<string | null>(funcao?.imageUrl || null)
  const [imagemFile, setImagemFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const toast = useToast()

  const handleImagemChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar arquivo
      const validation = validateImageFile(file, 5)
      if (!validation.isValid) {
        toast.showError(validation.errorMessage || 'Arquivo inválido')
        e.target.value = ''
        return
      }

      setImagemFile(file)

      // Criar preview
      try {
        const preview = await createImagePreview(file)
        setImagemPreview(preview)
      } catch (error) {
        console.error('Erro ao criar preview da imagem:', error)
        toast.showError('Erro ao processar a imagem')
        e.target.value = ''
        setImagemFile(null)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      toast.showError('O nome da função é obrigatório')
      return
    }

    setIsSaving(true)
    try {
      const funcaoData: ResponsibilityResponseDto = {
        id: funcao?.id || '',
        name: nome.trim(),
        description: descricao.trim() || null,
        scheduledAreaId,
        scheduledArea: null,
        imageUrl: funcao?.imageUrl || null, // Mantém a URL existente, o upload será feito separadamente
        createdAt: funcao?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      await onSave(funcaoData, imagemFile)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      title={funcao ? 'Editar Função' : 'Adicionar Função'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-row form-row-photo-name">
          <div className="form-group-photo-compact">
            <label htmlFor="imagem-funcao">
              <i className="fa-solid fa-image"></i> Imagem
            </label>
            <div className="photo-upload-compact">
              {imagemPreview ? (
                <div className="photo-preview-compact">
                  <img src={imagemPreview} alt="Preview" />
                  <button
                    type="button"
                    className="btn-remove-photo-compact"
                    onClick={() => {
                      setImagemPreview(null)
                      setImagemFile(null)
                      const fileInput = document.getElementById('imagem-funcao') as HTMLInputElement
                      if (fileInput) fileInput.value = ''
                    }}
                    title="Remover imagem"
                  >
                    <i className="fa-solid fa-times"></i>
                  </button>
                </div>
              ) : (
                <div
                  className="photo-placeholder-compact"
                  onClick={() => document.getElementById('imagem-funcao')?.click()}
                  style={{ cursor: 'pointer' }}
                >
                  <i className="fa-solid fa-image"></i>
                </div>
              )}
              <input
                type="file"
                id="imagem-funcao"
                accept="image/*"
                onChange={handleImagemChange}
                className="photo-input"
              />
              {imagemPreview && (
                <label htmlFor="imagem-funcao" className="btn-upload-photo-compact">
                  <i className="fa-solid fa-upload"></i> Alterar
                </label>
              )}
            </div>
          </div>
          <div className="form-group-name-email">
            <div className="form-group">
              <label htmlFor="nome-funcao">
                <i className="fa-solid fa-tag"></i> Nome da Função
              </label>
              <input
                type="text"
                id="nome-funcao"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite o nome da função"
                required
              />
            </div>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="descricao-funcao">
              <i className="fa-solid fa-file-text"></i> Descrição
            </label>
            <textarea
              id="descricao-funcao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
              placeholder="Descreva a função (opcional)"
            ></textarea>
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving}>
            <i className="fa-solid fa-times"></i> Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={isSaving}>
            {isSaving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> Salvando...
              </>
            ) : (
              <>
                <i className="fa-solid fa-check"></i> {funcao ? 'Salvar Alterações' : 'Salvar Função'}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// Componente Modal para clonar funções de outra área
function CloneFuncoesModal({
  currentAreaId,
  onClose,
  onCloneSuccess
}: {
  currentAreaId: string
  onClose: () => void
  onCloneSuccess: () => void
}) {
  const [areas, setAreas] = useState<ScheduledAreaResponseDto[]>([])
  const [isLoadingAreas, setIsLoadingAreas] = useState(true)
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null)
  const [isCloning, setIsCloning] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const toast = useToast()

  useEffect(() => {
    loadAreas()
  }, [])

  const loadAreas = async () => {
    setIsLoadingAreas(true)
    try {
      // Carregar todas as áreas
      let todasAreas: ScheduledAreaResponseDto[] = []
      let pagina = 1
      let temMaisPaginas = true
      const limitePorRequisicao = 100

      while (temMaisPaginas) {
        const response = await scheduledAreaService.getAllScheduledAreas({
          page: pagina,
          limit: limitePorRequisicao
        })
        
        todasAreas = [...todasAreas, ...response.data]
        
        if (response.meta && typeof response.meta.totalPages === 'number') {
          if (pagina >= response.meta.totalPages || response.data.length === 0) {
            temMaisPaginas = false
          } else {
            pagina++
          }
        } else {
          if (response.data.length === 0 || response.data.length < limitePorRequisicao) {
            temMaisPaginas = false
          } else {
            pagina++
          }
        }
      }

      // Filtrar a área atual
      const areasFiltradas = todasAreas.filter(area => area.id !== currentAreaId)
      setAreas(areasFiltradas)
    } catch (error: any) {
      console.error('Erro ao carregar áreas:', error)
      toast.showError(error.message || 'Erro ao carregar áreas')
    } finally {
      setIsLoadingAreas(false)
    }
  }

  const handleClone = async () => {
    if (!selectedAreaId) {
      toast.showError('Selecione uma área para clonar as funções')
      return
    }

    setIsCloning(true)
    try {
      // Buscar funções da área selecionada
      const sourceFunctions = await responsibilityService.getAllResponsibilities({
        scheduledAreaId: selectedAreaId,
        limit: 100
      })

      if (sourceFunctions.data.length === 0) {
        toast.showWarning('A área selecionada não possui funções para clonar')
        setIsCloning(false)
        return
      }

      // Clonar cada função
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      for (const funcao of sourceFunctions.data) {
        try {
          // Criar nova função na área atual
          await responsibilityService.createResponsibility({
            name: funcao.name,
            description: funcao.description || undefined,
            scheduledAreaId: currentAreaId
          })

          // Se a função original tinha imagem, tentar fazer upload (se possível)
          // Nota: Não podemos copiar a imagem diretamente, mas podemos tentar fazer upload se houver URL
          // Por enquanto, vamos apenas criar a função sem imagem
          // Se necessário, o usuário pode adicionar as imagens manualmente depois

          successCount++
        } catch (error: any) {
          errorCount++
          const errorMessage = error.message || 'Erro ao clonar função'
          errors.push(`${funcao.name}: ${errorMessage}`)
        }
      }

      if (successCount > 0) {
        toast.showSuccess(`${successCount} função(ões) clonada(s) com sucesso!${errorCount > 0 ? ` ${errorCount} erro(s).` : ''}`)
        if (errorCount > 0 && errors.length > 0) {
          console.error('Erros ao clonar funções:', errors)
        }
        onCloneSuccess()
      } else {
        toast.showError(`Erro ao clonar funções: ${errors.join('; ')}`)
      }
    } catch (error: any) {
      console.error('Erro ao clonar funções:', error)
      toast.showError(error.message || 'Erro ao clonar funções')
    } finally {
      setIsCloning(false)
    }
  }

  const filteredAreas = areas.filter(area =>
    area.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Modal
      title="Clonar Funções de Outra Área"
      onClose={onClose}
    >
      <div style={{ marginBottom: '20px' }}>
        <p style={{ color: 'var(--text-color)', lineHeight: '1.6', marginBottom: '15px' }}>
          <i className="fa-solid fa-info-circle" style={{ color: 'var(--color-purple)', marginRight: '8px' }}></i>
          Selecione uma área para copiar todas as suas funções para esta área. 
          As funções serão criadas com os mesmos nomes e descrições, mas sem as imagens (você pode adicioná-las depois).
        </p>
      </div>

      <div className="form-group">
        <label>
          <i className="fa-solid fa-search"></i> Buscar Área
        </label>
        <input
          type="text"
          className="person-search-input"
          placeholder="Buscar área por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="form-group" style={{ marginTop: '20px' }}>
        <label>
          <i className="fa-solid fa-map"></i> Selecione a Área
        </label>
        {isLoadingAreas ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <i className="fa-solid fa-spinner fa-spin"></i>
            <p>Carregando áreas...</p>
          </div>
        ) : filteredAreas.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <i className="fa-solid fa-map"></i>
            <p>{searchTerm ? 'Nenhuma área encontrada' : 'Nenhuma outra área disponível'}</p>
          </div>
        ) : (
          <div className="person-select-list" style={{ maxHeight: '400px' }}>
            {filteredAreas.map((area) => (
              <div
                key={area.id}
                className={`person-select-item ${selectedAreaId === area.id ? 'selected' : ''}`}
                onClick={() => setSelectedAreaId(area.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="person-select-photo">
                  {area.imageUrl ? (
                    <img src={addCacheBusting(area.imageUrl)} alt={area.name} />
                  ) : (
                    <div className="person-select-photo-placeholder">
                      <i className="fa-solid fa-map"></i>
                    </div>
                  )}
                </div>
                <div className="person-select-info">
                  <div className="person-select-name">{area.name}</div>
                  <div className="person-select-email">
                    {area.description || 'Sem descrição'}
                  </div>
                </div>
                {selectedAreaId === area.id && (
                  <i className="fa-solid fa-check person-select-check"></i>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={onClose}
          disabled={isCloning}
        >
          <i className="fa-solid fa-times"></i> Cancelar
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={handleClone}
          disabled={!selectedAreaId || isCloning}
        >
          {isCloning ? (
            <>
              <i className="fa-solid fa-spinner fa-spin"></i> Clonando...
            </>
          ) : (
            <>
              <i className="fa-solid fa-copy"></i> Clonar Funções
            </>
          )}
        </button>
      </div>
    </Modal>
  )
}
