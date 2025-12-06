import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TopNavbar from '../../../../components/admin/TopNavbar/TopNavbar'
import Sidebar from '../../../../components/admin/Sidebar/Sidebar'
import PageHeader from '../../../../components/admin/PageHeader/PageHeader'
import { personService } from '../../../../services/basic/personService'
import { useToast } from '../../../../components/ui/Toast/ToastProvider'
import { formatCPF, formatPhone, formatCPFFromRaw, formatPhoneFromRaw, removeMask } from '../../../../utils/formatters'
import { validateImageFile, createImagePreview, addCacheBusting } from '../../../../utils/fileUtils'
import '../../../../components/admin/admin.css'

export default function CadastrarPessoa() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const formRef = useRef<HTMLFormElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(!!id)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isEditMode = !!id

  // Carregar dados da pessoa se estiver em modo de edição
  useEffect(() => {
    if (id) {
      loadPersonData()
    }
  }, [id])

  const loadPersonData = async () => {
    if (!id) return
    
    setIsLoadingData(true)
    try {
      const data = await personService.getPersonById(id)
      
      // Preencher formulário
      if (formRef.current) {
        const form = formRef.current

        ;(form.querySelector('[name="fullName"]') as HTMLInputElement).value = data.fullName || ''
        ;(form.querySelector('[name="email"]') as HTMLInputElement).value = data.email || ''
        ;(form.querySelector('[name="phone"]') as HTMLInputElement).value = data.phone ? formatPhoneFromRaw(data.phone) : ''
        ;(form.querySelector('[name="cpf"]') as HTMLInputElement).value = data.cpf ? formatCPFFromRaw(data.cpf) : ''
        ;(form.querySelector('[name="birthDate"]') as HTMLInputElement).value = data.birthDate || ''
        ;(form.querySelector('[name="emergencyContact"]') as HTMLInputElement).value = data.emergencyContact ? formatPhoneFromRaw(data.emergencyContact) : ''
        ;(form.querySelector('[name="address"]') as HTMLTextAreaElement).value = data.address || ''
      }

      // Carregar foto existente com cache-busting
      if (data.photoUrl) {
        setFotoPreview(addCacheBusting(data.photoUrl))
      }
    } catch (err: any) {
      console.error('Erro ao carregar pessoa:', err)
      setError(err.message || 'Erro ao carregar dados da pessoa')
      toast.showError(err.message || 'Erro ao carregar dados da pessoa')
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const form = e.currentTarget || formRef.current
    if (!form) return

    try {
      const formData = new FormData(form)
      
      // Remover máscaras dos campos numéricos (apenas se preenchidos)
      const phoneValue = (formData.get('phone') as string) || ''
      const cpfValue = (formData.get('cpf') as string) || ''
      const emergencyContactValue = (formData.get('emergencyContact') as string) || ''
      
      const phone = phoneValue ? removeMask(phoneValue) : ''
      const cpf = cpfValue ? removeMask(cpfValue) : ''
      const emergencyContact = emergencyContactValue ? removeMask(emergencyContactValue) : ''

      if (isEditMode && id) {
        // Modo de edição - atualizar pessoa
        const updateData: any = {
          fullName: (formData.get('fullName') as string) || '',
          email: (formData.get('email') as string) || '',
          phone: phone || '',
          cpf: cpf || '',
          birthDate: (formData.get('birthDate') as string) || '',
          emergencyContact: emergencyContact || '',
          address: (formData.get('address') as string) || '',
        }

        await personService.updatePerson(id, updateData)

        // Fazer upload da foto se houver uma nova foto selecionada
        if (fotoFile) {
          try {
            await personService.uploadPhoto(id, fotoFile)
          } catch (photoError) {
            console.error('Erro ao fazer upload da foto:', photoError)
            toast.showWarning('Pessoa atualizada, mas houve erro ao atualizar a foto')
          }
        }

        toast.showSuccess('Pessoa atualizada com sucesso!')
      } else {
        // Modo de cadastro - criar pessoa
        const personData = {
          fullName: (formData.get('fullName') as string) || '',
          email: (formData.get('email') as string) || '',
          phone: phone || '',
          cpf: cpf || '',
          birthDate: (formData.get('birthDate') as string) || '',
          emergencyContact: emergencyContact || '',
          address: (formData.get('address') as string) || '',
        }

        const createdPerson = await personService.createPerson(personData)

        // Fazer upload da foto se houver
        if (fotoFile) {
          try {
            await personService.uploadPhoto(createdPerson.id, fotoFile)
          } catch (photoError) {
            console.error('Erro ao fazer upload da foto:', photoError)
            // Não falhar o cadastro se o upload da foto falhar
          }
        }

        toast.showSuccess('Pessoa cadastrada com sucesso!')
        
        // Resetar formulário antes de navegar
        if (formRef.current) {
          formRef.current.reset()
        }
        setFotoPreview(null)
        setFotoFile(null)
      }
      
      // Pequeno delay antes de navegar
      setTimeout(() => {
        navigate('/Dashboard/listar-pessoas')
      }, 100)
    } catch (err: any) {
      console.error(`Erro ao ${isEditMode ? 'atualizar' : 'cadastrar'} pessoa:`, err)
      const errorMessage = err.message || `Erro ao ${isEditMode ? 'atualizar' : 'cadastrar'} pessoa. Por favor, tente novamente.`
      setError(errorMessage)
      toast.showError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = formatCPF(e.target.value)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = formatPhone(e.target.value)
  }

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar arquivo
      const validation = validateImageFile(file, 5)
      if (!validation.isValid) {
        toast.showError(validation.errorMessage || 'Arquivo inválido')
        e.target.value = ''
        return
      }

      setFotoFile(file)
      
      // Criar preview
      try {
        const preview = await createImagePreview(file)
        setFotoPreview(preview)
      } catch (error) {
        console.error('Erro ao criar preview da imagem:', error)
        toast.showError('Erro ao processar a imagem')
        e.target.value = ''
        setFotoFile(null)
      }
    }
  }

  const handleRemoverFoto = () => {
    setFotoPreview(null)
    setFotoFile(null)
    const fileInput = document.getElementById('foto') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handlePlaceholderClick = () => {
    const fileInput = document.getElementById('foto') as HTMLInputElement
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
            title="Editar Pessoa"
            breadcrumbs={[
              { label: 'Home', icon: 'fa-solid fa-home', link: '/Dashboard' },
              { label: 'Pessoas', icon: 'fa-solid fa-users', link: '/Dashboard/listar-pessoas' },
              { label: 'Editar Pessoa' }
            ]}
          />
          <main className="main-content">
            <div className="form-card" style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '20px' }}></i>
              <p>Carregando dados da pessoa...</p>
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
          title={isEditMode ? 'Editar Pessoa' : 'Cadastrar Pessoa'}
          breadcrumbs={[
            { label: 'Home', icon: 'fa-solid fa-home', link: '/Dashboard' },
            { label: 'Pessoas', icon: 'fa-solid fa-users', link: '/Dashboard/listar-pessoas' },
            { label: isEditMode ? 'Editar Pessoa' : 'Cadastrar Pessoa' }
          ]}
        />
        <main className="main-content">
          <div className="form-card">
            {error && (
              <div style={{ 
                padding: '12px', 
                marginBottom: '20px', 
                backgroundColor: '#fee', 
                color: '#c33', 
                borderRadius: '4px',
                border: '1px solid #fcc'
              }}>
                <i className="fa-solid fa-exclamation-circle"></i> {error}
              </div>
            )}
            <form ref={formRef} onSubmit={handleSubmit}>
              {/* Foto + Nome e Email */}
              <div className="form-row form-row-photo-name">
                <div className="form-group-photo-compact">
                  <label htmlFor="foto">
                    <i className="fa-solid fa-image"></i> Foto
                  </label>
                  <div className="photo-upload-compact">
                    {fotoPreview ? (
                      <div className="photo-preview-compact">
                        <img src={fotoPreview} alt="Preview" />
                        <button
                          type="button"
                          className="btn-remove-photo-compact"
                          onClick={handleRemoverFoto}
                          title="Remover foto"
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
                        <i className="fa-solid fa-user"></i>
                      </div>
                    )}
                    <input
                      type="file"
                      id="foto"
                      name="foto"
                      accept="image/*"
                      onChange={handleFotoChange}
                      className="photo-input"
                    />
                    {fotoPreview && (
                      <label htmlFor="foto" className="btn-upload-photo-compact">
                        <i className="fa-solid fa-upload"></i> Alterar
                      </label>
                    )}
                  </div>
                </div>
                <div className="form-group-name-email" >
                  <div className="form-group">
                    <label htmlFor="fullName">
                      <i className="fa-solid fa-user"></i> Nome Completo
                    </label>
                    <input 
                      type="text" 
                      id="fullName" 
                      name="fullName" 
                      placeholder="Digite o nome completo" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">
                      <i className="fa-solid fa-envelope"></i> E-mail
                    </label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      placeholder="exemplo@email.com" 
                    />
                  </div>
                </div>
              </div>

              {/* Telefone e CPF */}
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label htmlFor="phone">
                    <i className="fa-solid fa-phone"></i> Telefone Celular
                  </label>
                  <input 
                    type="tel" 
                    id="phone" 
                    name="phone" 
                    placeholder="(00) 00000-0000" 
                    maxLength={15}
                    onChange={handlePhoneChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="cpf">
                    <i className="fa-solid fa-id-card"></i> CPF
                  </label>
                  <input 
                    type="text" 
                    id="cpf" 
                    name="cpf" 
                    placeholder="000.000.000-00" 
                    maxLength={14}
                    onChange={handleCPFChange}
                  />
                </div>
              </div>

              {/* Data de Nascimento e Contato de Emergência */}
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label htmlFor="birthDate">
                    <i className="fa-solid fa-calendar"></i> Data de Nascimento
                  </label>
                  <input 
                    type="date" 
                    id="birthDate" 
                    name="birthDate" 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="emergencyContact">
                    <i className="fa-solid fa-phone-volume"></i> Contato de Emergência
                  </label>
                  <input 
                    type="tel" 
                    id="emergencyContact" 
                    name="emergencyContact" 
                    placeholder="(00) 00000-0000" 
                    maxLength={15}
                    onChange={handlePhoneChange}
                  />
                  <small className="form-help">Telefone para contato em caso de emergência</small>
                </div>
              </div>

              {/* Endereço */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="address">
                    <i className="fa-solid fa-location-dot"></i> Endereço
                  </label>
                  <textarea 
                    id="address" 
                    name="address" 
                    rows={3} 
                    placeholder="Rua, número, complemento, bairro, cidade - UF, CEP"
                  ></textarea>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => navigate('/Dashboard/listar-pessoas')}>
                  <i className="fa-solid fa-times"></i> Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={isLoading || isLoadingData}>
                  {isLoading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> {isEditMode ? 'Salvando...' : 'Salvando...'}
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check"></i> {isEditMode ? 'Salvar Alterações' : 'Salvar Pessoa'}
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

