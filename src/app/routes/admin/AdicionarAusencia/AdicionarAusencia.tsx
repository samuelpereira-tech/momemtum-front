import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TopNavbar from '../../../../components/admin/TopNavbar/TopNavbar'
import Sidebar from '../../../../components/admin/Sidebar/Sidebar'
import PageHeader from '../../../../components/admin/PageHeader/PageHeader'
import { scheduledAbsenceService } from '../../../../services/basic/scheduledAbsenceService'
import { absenceTypeService } from '../../../../services/basic/absenceTypeService'
import { personService } from '../../../../services/basic/personService'
import type { PersonResponseDto } from '../../../../services/basic/personService'
import type { AbsenceTypeResponseDto } from '../../../../services/basic/absenceTypeService'
import { useToast } from '../../../../components/ui/Toast/ToastProvider'
import '../../../../components/admin/admin.css'
import './AdicionarAusencia.css'

export default function AdicionarAusencia() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const formRef = useRef<HTMLFormElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const isEditMode = !!id

  const [pessoas, setPessoas] = useState<PersonResponseDto[]>([])
  const [tiposAusencia, setTiposAusencia] = useState<AbsenceTypeResponseDto[]>([])

  const [formData, setFormData] = useState({
    personId: '',
    absenceTypeId: '',
    startDate: '',
    endDate: '',
    description: ''
  })

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData()
    if (isEditMode && id) {
      loadAbsenceData(id)
    }
  }, [id, isEditMode])

  const loadInitialData = async () => {
    setIsLoadingData(true)
    try {
      const [personsResponse, typesResponse] = await Promise.all([
        personService.getAllPersons(1, 100),
        absenceTypeService.getAllAbsenceTypes({ limit: 100, active: true })
      ])
      setPessoas(personsResponse.data)
      setTiposAusencia(typesResponse.data)
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err)
      toast.showError('Erro ao carregar dados do formulário')
    } finally {
      setIsLoadingData(false)
    }
  }

  const loadAbsenceData = async (absenceId: string) => {
    setIsLoadingData(true)
    try {
      const absence = await scheduledAbsenceService.getScheduledAbsenceById(absenceId)
      setFormData({
        personId: absence.personId,
        absenceTypeId: absence.absenceTypeId,
        startDate: absence.startDate,
        endDate: absence.endDate,
        description: absence.description || ''
      })
    } catch (err: any) {
      console.error('Erro ao carregar ausência:', err)
      toast.showError('Erro ao carregar dados da ausência')
      navigate('/Dashboard/listar-ausencias')
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isEditMode && id) {
        await scheduledAbsenceService.updateScheduledAbsence(id, {
          personId: formData.personId,
          absenceTypeId: formData.absenceTypeId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          description: formData.description || undefined
        })
        toast.showSuccess('Ausência programada atualizada com sucesso!')
      } else {
        await scheduledAbsenceService.createScheduledAbsence({
          personId: formData.personId,
          absenceTypeId: formData.absenceTypeId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          description: formData.description || undefined
        })
        toast.showSuccess('Ausência programada criada com sucesso!')
      }
      navigate('/Dashboard/listar-ausencias')
    } catch (err: any) {
      console.error('Erro ao salvar ausência:', err)
      toast.showError(err.message || 'Erro ao salvar ausência programada')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <TopNavbar />
      <div className="admin-container">
        <Sidebar />
        <PageHeader
          title={isEditMode ? 'Editar Ausência Programada' : 'Adicionar Ausência Programada'}
          breadcrumbs={[
            { label: 'Home', icon: 'fa-solid fa-home', link: '/Dashboard' },
            { label: 'Ausências Programadas', icon: 'fa-solid fa-calendar-times', link: '/Dashboard/listar-ausencias' },
            { label: isEditMode ? 'Editar Ausência' : 'Adicionar Ausência' }
          ]}
        />
        <main className="main-content">
          <div className="form-card">
            <form ref={formRef} onSubmit={handleSubmit}>
              {/* Pessoa e Tipo */}
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label htmlFor="pessoaId">
                    <i className="fa-solid fa-user"></i> Pessoa
                  </label>
                  <select 
                    id="pessoaId" 
                    name="pessoaId" 
                    required
                    value={formData.personId}
                    onChange={(e) => setFormData({ ...formData, personId: e.target.value })}
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
                <div className="form-group">
                  <label htmlFor="tipo">
                    <i className="fa-solid fa-tag"></i> Tipo de Ausência
                  </label>
                  <select 
                    id="tipo" 
                    name="tipo" 
                    required
                    value={formData.absenceTypeId}
                    onChange={(e) => setFormData({ ...formData, absenceTypeId: e.target.value })}
                    disabled={isLoadingData}
                  >
                    <option value="">Selecione o tipo</option>
                    {tiposAusencia.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Datas */}
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label htmlFor="dataInicio">
                    <i className="fa-solid fa-calendar-alt"></i> Data de Início
                  </label>
                  <input 
                    type="date" 
                    id="dataInicio" 
                    name="dataInicio" 
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    disabled={isLoadingData}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="dataFim">
                    <i className="fa-solid fa-calendar-check"></i> Data de Término
                  </label>
                  <input 
                    type="date" 
                    id="dataFim" 
                    name="dataFim" 
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    disabled={isLoadingData}
                    min={formData.startDate}
                  />
                </div>
              </div>

              {/* Descrição */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="descricao">
                    <i className="fa-solid fa-file-text"></i> Descrição
                  </label>
                  <textarea 
                    id="descricao" 
                    name="descricao" 
                    rows={4} 
                    placeholder="Descreva a ausência programada (opcional)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={isLoadingData}
                    maxLength={500}
                  ></textarea>
                  <small className="form-help">
                    Informações adicionais sobre a ausência programada
                  </small>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => navigate('/Dashboard/listar-ausencias')}
                >
                  <i className="fa-solid fa-times"></i> Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={isLoading || isLoadingData}
                >
                  {isLoading || isLoadingData ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> {isLoadingData ? 'Carregando...' : 'Salvando...'}
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check"></i> {isEditMode ? 'Salvar Alterações' : 'Salvar Ausência'}
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

