import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TopNavbar from '../../../../components/admin/TopNavbar/TopNavbar'
import Sidebar from '../../../../components/admin/Sidebar/Sidebar'
import PageHeader from '../../../../components/admin/PageHeader/PageHeader'
import { validateImageFile, createImagePreview, addCacheBusting } from '../../../../utils/fileUtils'
import { useToast } from '../../../../components/ui/Toast/ToastProvider'
import { scheduledAreaService } from '../../../../services/basic/scheduledAreaService'
import { personService, type PersonResponseDto } from '../../../../services/basic/personService'
import '../../../../components/admin/admin.css'
import './CadastrarArea.css'

export default function CadastrarArea() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const formRef = useRef<HTMLFormElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(!!id)
  const [imagemPreview, setImagemPreview] = useState<string | null>(null)
  const [imagemFile, setImagemFile] = useState<File | null>(null)
  const [pessoas, setPessoas] = useState<PersonResponseDto[]>([])
  const isEditMode = !!id

  // Carregar pessoas para o select
  useEffect(() => {
    loadPessoas()
    if (isEditMode && id) {
      loadAreaData()
    }
  }, [id, isEditMode])

  const loadPessoas = async () => {
    try {
      // Carregar todas as pessoas
      let todasPessoas: PersonResponseDto[] = []
      let pagina = 1
      let temMaisPaginas = true
      const limitePorRequisicao = 100

      while (temMaisPaginas) {
        const response = await personService.getAllPersons(pagina, limitePorRequisicao)
        todasPessoas = [...todasPessoas, ...response.data]
        
        if (pagina >= response.totalPages || response.data.length === 0) {
          temMaisPaginas = false
        } else {
          pagina++
        }
      }

      setPessoas(todasPessoas)
    } catch (err: any) {
      console.error('Erro ao carregar pessoas:', err)
      toast.showError('Erro ao carregar lista de pessoas')
    }
  }

  const loadAreaData = async () => {
    if (!id) return
    
    setIsLoadingData(true)
    try {
      const data = await scheduledAreaService.getScheduledAreaById(id)
      
      // Preencher formulário
      if (formRef.current) {
        const form = formRef.current
        ;(form.querySelector('[name="nome"]') as HTMLInputElement).value = data.name || ''
        ;(form.querySelector('[name="descricao"]') as HTMLTextAreaElement).value = data.description || ''
        ;(form.querySelector('[name="pessoaResponsavelId"]') as HTMLSelectElement).value = data.responsiblePersonId || ''
        ;(form.querySelector('[name="favorito"]') as HTMLInputElement).checked = data.favorite || false
      }

      // Carregar imagem existente
      if (data.imageUrl) {
        setImagemPreview(addCacheBusting(data.imageUrl))
      }
    } catch (err: any) {
      console.error('Erro ao carregar área:', err)
      toast.showError(err.message || 'Erro ao carregar dados da área')
      navigate('/Dashboard/escala/areas')
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const form = e.currentTarget || formRef.current
    if (!form) return

    try {
      const formData = new FormData(form)
      const nome = formData.get('nome') as string
      const descricao = formData.get('descricao') as string
      const pessoaResponsavelId = formData.get('pessoaResponsavelId') as string
      const favorito = formData.get('favorito') === 'on'

      if (isEditMode && id) {
        // Modo de edição - atualizar área
        const updateData: any = {
          name: nome,
          description: descricao || undefined,
          responsiblePersonId: pessoaResponsavelId,
          favorite: favorito,
        }

        await scheduledAreaService.updateScheduledArea(id, updateData)

        // Fazer upload da imagem se houver uma nova imagem selecionada
        if (imagemFile) {
          try {
            await scheduledAreaService.uploadImage(id, imagemFile)
          } catch (imageError) {
            console.error('Erro ao fazer upload da imagem:', imageError)
            toast.showWarning('Área atualizada, mas houve erro ao atualizar a imagem')
          }
        }

        toast.showSuccess('Área atualizada com sucesso!')
      } else {
        // Modo de cadastro - criar área
        const createData = {
          name: nome,
          description: descricao || undefined,
          responsiblePersonId: pessoaResponsavelId,
          favorite: favorito,
        }

        const createdArea = await scheduledAreaService.createScheduledArea(createData)

        // Fazer upload da imagem se houver
        if (imagemFile) {
          try {
            await scheduledAreaService.uploadImage(createdArea.id, imagemFile)
          } catch (imageError) {
            console.error('Erro ao fazer upload da imagem:', imageError)
            // Não falhar o cadastro se o upload da imagem falhar
          }
        }

        toast.showSuccess('Área cadastrada com sucesso!')
        
        // Resetar formulário
        if (formRef.current) {
          formRef.current.reset()
        }
        setImagemPreview(null)
        setImagemFile(null)
      }
      
      // Navegar de volta para a lista
      setTimeout(() => {
        navigate('/Dashboard/escala/areas')
      }, 500)
    } catch (err: any) {
      console.error(`Erro ao ${isEditMode ? 'atualizar' : 'cadastrar'} área:`, err)
      const errorMessage = err.message || `Erro ao ${isEditMode ? 'atualizar' : 'cadastrar'} área. Por favor, tente novamente.`
      toast.showError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

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

  const handleRemoverImagem = () => {
    setImagemPreview(null)
    setImagemFile(null)
    const fileInput = document.getElementById('imagem') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handlePlaceholderClick = () => {
    const fileInput = document.getElementById('imagem') as HTMLInputElement
    if (fileInput) {
      fileInput.click()
    }
  }

  if (isLoadingData) {
    return (
      <>
        <TopNavbar />
        <div className="admin-container">
          <Sidebar />
          <PageHeader
            title="Editar Área"
            breadcrumbs={[
              { label: 'Home', icon: 'fa-solid fa-home', link: '/Dashboard' },
              { label: 'Escala', icon: 'fa-solid fa-calendar-alt', link: '#' },
              { label: 'Áreas', icon: 'fa-solid fa-map-marked-alt', link: '/Dashboard/escala/areas' },
              { label: 'Editar Área' }
            ]}
          />
          <main className="main-content">
            <div className="form-card" style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '20px' }}></i>
              <p>Carregando dados da área...</p>
            </div>
          </main>
        </div>
      </>
    )
  }

  return (
    <>
      <TopNavbar />
      <div className="admin-container">
        <Sidebar />
        <PageHeader
          title={isEditMode ? 'Editar Área' : 'Cadastrar Área'}
          breadcrumbs={[
            { label: 'Home', icon: 'fa-solid fa-home', link: '/Dashboard' },
            { label: 'Escala', icon: 'fa-solid fa-calendar-alt', link: '#' },
            { label: 'Áreas', icon: 'fa-solid fa-map-marked-alt', link: '/Dashboard/escala/areas' },
            { label: isEditMode ? 'Editar Área' : 'Cadastrar Área' }
          ]}
        />
        <main className="main-content">
          <div className="form-card">
            <form ref={formRef} onSubmit={handleSubmit}>
              {/* Imagem à esquerda e campos à direita */}
              <div className="form-row form-row-photo-name">
                <div className="form-group-photo-compact">
                  <label htmlFor="imagem">
                    <i className="fa-solid fa-image"></i> Imagem
                  </label>
                  <div className="photo-upload-compact">
                    {imagemPreview ? (
                      <div className="photo-preview-compact">
                        <img src={imagemPreview} alt="Preview" />
                        <button
                          type="button"
                          className="btn-remove-photo-compact"
                          onClick={handleRemoverImagem}
                          title="Remover imagem"
                        >
                          <i className="fa-solid fa-times"></i>
                        </button>
                      </div>
                    ) : (
                      <div 
                        className="photo-placeholder-compact" 
                        onClick={handlePlaceholderClick}
                        style={{ cursor: 'pointer' }}
                      >
                        <i className="fa-solid fa-image"></i>
                      </div>
                    )}
                    <input
                      type="file"
                      id="imagem"
                      name="imagem"
                      accept="image/*"
                      onChange={handleImagemChange}
                      className="photo-input"
                    />
                    {imagemPreview && (
                      <label htmlFor="imagem" className="btn-upload-photo-compact">
                        <i className="fa-solid fa-upload"></i> Alterar
                      </label>
                    )}
                  </div>
                </div>
                <div className="form-group-name-email">
                  {/* Nome */}
                  <div className="form-group">
                    <label htmlFor="nome">
                      <i className="fa-solid fa-tag"></i> Nome da Área
                    </label>
                    <input 
                      type="text" 
                      id="nome" 
                      name="nome" 
                      placeholder="Digite o nome da área" 
                      required
                      disabled={isLoadingData}
                    />
                  </div>

                  {/* Pessoa Responsável */}
                  <div className="form-group">
                    <label htmlFor="pessoaResponsavelId">
                      <i className="fa-solid fa-user"></i> Pessoa Responsável
                    </label>
                    <select 
                      id="pessoaResponsavelId" 
                      name="pessoaResponsavelId" 
                      required
                      disabled={isLoadingData}
                    >
                      <option value="">Selecione uma pessoa</option>
                      {pessoas.map((pessoa) => (
                        <option key={pessoa.id} value={pessoa.id}>
                          {pessoa.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Favorito */}
                  <div className="form-group">
                    <label htmlFor="favorito" className="checkbox-label">
                      <input 
                        type="checkbox" 
                        id="favorito" 
                        name="favorito"
                        className="checkbox-input"
                        disabled={isLoadingData}
                      />
                      <span className="checkbox-custom">
                        <i className="fa-solid fa-star"></i>
                      </span>
                      <span className="checkbox-text">Marcar como favorito</span>
                    </label>
                    <small className="form-help">
                      Áreas favoritas aparecem no menu superior
                    </small>
                  </div>
                </div>
              </div>

              {/* Descrição abaixo de tudo */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="descricao">
                    <i className="fa-solid fa-file-text"></i> Descrição
                  </label>
                    <textarea 
                      id="descricao" 
                      name="descricao" 
                      rows={4} 
                      placeholder="Descreva a área (opcional)"
                      disabled={isLoadingData}
                    ></textarea>
                  <small className="form-help">
                    Informações adicionais sobre a área
                  </small>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => navigate('/Dashboard/escala/areas')}
                >
                  <i className="fa-solid fa-times"></i> Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={isLoading || isLoadingData}
                >
                  {isLoading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Salvando...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check"></i> {isEditMode ? 'Salvar Alterações' : 'Salvar Área'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </>
  )
}

