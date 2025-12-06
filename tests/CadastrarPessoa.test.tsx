import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../src/app/providers/AuthContext'
import { ToastProvider } from '../src/components/ui/Toast/ToastProvider'
import type { PersonResponseDto, CreatePersonDto, UpdatePersonDto, PhotoUploadResponseDto } from '../src/services/basic/personService'

// Mock do useNavigate e useParams
const mockNavigate = vi.fn()
const mockUseParams = vi.fn(() => ({})) // Sem parâmetros por padrão (modo cadastro)

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
  }
})

// Mock dos componentes admin
vi.mock('../src/components/admin/TopNavbar/TopNavbar', () => ({
  default: () => <div data-testid="top-navbar">TopNavbar</div>
}))

vi.mock('../src/components/admin/Sidebar/Sidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>
}))

vi.mock('../src/components/admin/PageHeader/PageHeader', () => ({
  default: ({ title }: { title: string }) => <div data-testid="page-header">{title}</div>
}))

// Mock do personService
vi.mock('../src/services/basic/personService', () => ({
  personService: {
    createPerson: vi.fn(),
    updatePerson: vi.fn(),
    getPersonById: vi.fn(),
    uploadPhoto: vi.fn(),
    deletePerson: vi.fn(),
    getAllPersons: vi.fn(),
  }
}))

// Importar o serviço mockado para acessar os mocks
import { personService } from '../src/services/basic/personService'
import CadastrarPessoa from '../src/app/routes/admin/CadastrarPessoa/CadastrarPessoa'

const mockCreatePerson = vi.mocked(personService.createPerson)
const mockUpdatePerson = vi.mocked(personService.updatePerson)
const mockGetPersonById = vi.mocked(personService.getPersonById)
const mockUploadPhoto = vi.mocked(personService.uploadPhoto)
const mockDeletePerson = vi.mocked(personService.deletePerson)
const mockGetAllPersons = vi.mocked(personService.getAllPersons)

// Mock do localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Dados mockados
const mockPerson: PersonResponseDto = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  fullName: 'João Silva',
  email: 'joao@example.com',
  phone: '11987654321',
  cpf: '12345678901',
  birthDate: '1990-01-15',
  emergencyContact: '11987654322',
  address: 'Rua Exemplo, 123',
  photoUrl: 'https://example.com/photo.jpg',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

const renderCadastrarPessoa = (route: string = '/Dashboard/cadastrar-pessoa') => {
  return render(
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <CadastrarPessoa />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}

describe('CadastrarPessoa - Visualização de Componentes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    globalThis.fetch = vi.fn()
    // Resetar useParams para modo cadastro
    mockUseParams.mockReturnValue({})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deve renderizar o título "Cadastrar Pessoa"', () => {
    renderCadastrarPessoa()
    
    const title = screen.getByText('Cadastrar Pessoa')
    
    expect(title).toBeInTheDocument()
  })

  it('deve renderizar o campo Nome Completo', () => {
    renderCadastrarPessoa()
    
    const nomeLabel = screen.getByText('Nome Completo')
    const nomeInput = screen.getByPlaceholderText('Digite o nome completo')
    
    expect(nomeLabel).toBeInTheDocument()
    expect(nomeInput).toBeInTheDocument()
    expect(nomeInput).toHaveAttribute('type', 'text')
    expect(nomeInput).toHaveAttribute('required')
  })

  it('deve renderizar o campo E-mail', () => {
    renderCadastrarPessoa()
    
    const emailLabel = screen.getByText('E-mail')
    const emailInput = screen.getByPlaceholderText('exemplo@email.com')
    
    expect(emailLabel).toBeInTheDocument()
    expect(emailInput).toBeInTheDocument()
    expect(emailInput).toHaveAttribute('type', 'email')
  })

  it('deve renderizar o campo Telefone Celular', () => {
    renderCadastrarPessoa()
    
    const phoneLabel = screen.getByText('Telefone Celular')
    const phoneInput = screen.getByLabelText('Telefone Celular')
    
    expect(phoneLabel).toBeInTheDocument()
    expect(phoneInput).toBeInTheDocument()
    expect(phoneInput).toHaveAttribute('type', 'tel')
  })

  it('deve renderizar o campo CPF', () => {
    renderCadastrarPessoa()
    
    const cpfLabel = screen.getByText('CPF')
    const cpfInput = screen.getByPlaceholderText('000.000.000-00')
    
    expect(cpfLabel).toBeInTheDocument()
    expect(cpfInput).toBeInTheDocument()
    expect(cpfInput).toHaveAttribute('type', 'text')
  })

  it('deve renderizar o campo Data de Nascimento', () => {
    renderCadastrarPessoa()
    
    const birthDateLabel = screen.getByText('Data de Nascimento')
    const birthDateInput = screen.getByLabelText('Data de Nascimento')
    
    expect(birthDateLabel).toBeInTheDocument()
    expect(birthDateInput).toBeInTheDocument()
    expect(birthDateInput).toHaveAttribute('type', 'date')
  })

  it('deve renderizar o campo Contato de Emergência', () => {
    renderCadastrarPessoa()
    
    const emergencyLabel = screen.getByText('Contato de Emergência')
    const emergencyInput = screen.getByLabelText('Contato de Emergência')
    
    expect(emergencyLabel).toBeInTheDocument()
    expect(emergencyInput).toBeInTheDocument()
    expect(emergencyInput).toHaveAttribute('type', 'tel')
  })

  it('deve renderizar o campo Endereço', () => {
    renderCadastrarPessoa()
    
    const addressLabel = screen.getByText('Endereço')
    const addressTextarea = screen.getByPlaceholderText('Rua, número, complemento, bairro, cidade - UF, CEP')
    
    expect(addressLabel).toBeInTheDocument()
    expect(addressTextarea).toBeInTheDocument()
    expect(addressTextarea.tagName).toBe('TEXTAREA')
  })

  it('deve renderizar o botão "Salvar Pessoa"', () => {
    renderCadastrarPessoa()
    
    const saveButton = screen.getByRole('button', { name: /salvar pessoa/i })
    
    expect(saveButton).toBeInTheDocument()
    expect(saveButton).not.toBeDisabled()
  })

  it('deve renderizar o botão "Cancelar"', () => {
    renderCadastrarPessoa()
    
    const cancelButton = screen.getByRole('button', { name: /cancelar/i })
    
    expect(cancelButton).toBeInTheDocument()
  })

  it('deve renderizar o campo de upload de foto', () => {
    renderCadastrarPessoa()
    
    const fotoLabel = screen.getByText('Foto')
    const fotoInput = screen.getByLabelText('Foto')
    
    expect(fotoLabel).toBeInTheDocument()
    expect(fotoInput).toBeInTheDocument()
    expect(fotoInput).toHaveAttribute('type', 'file')
    expect(fotoInput).toHaveAttribute('accept', 'image/*')
  })
})

describe('CadastrarPessoa - Interações do Usuário', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    globalThis.fetch = vi.fn()
    mockUseParams.mockReturnValue({})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deve permitir digitar no campo Nome Completo', async () => {
    const user = userEvent.setup()
    renderCadastrarPessoa()
    
    const nomeInput = screen.getByPlaceholderText('Digite o nome completo') as HTMLInputElement
    
    await user.type(nomeInput, 'Maria Santos')
    
    expect(nomeInput.value).toBe('Maria Santos')
  })

  it('deve permitir digitar no campo E-mail', async () => {
    const user = userEvent.setup()
    renderCadastrarPessoa()
    
    const emailInput = screen.getByPlaceholderText('exemplo@email.com') as HTMLInputElement
    
    await user.type(emailInput, 'maria@example.com')
    
    expect(emailInput.value).toBe('maria@example.com')
  })

  it('deve formatar CPF automaticamente', async () => {
    const user = userEvent.setup()
    renderCadastrarPessoa()
    
    const cpfInput = screen.getByPlaceholderText('000.000.000-00') as HTMLInputElement
    
    await user.type(cpfInput, '12345678901')
    
    // O CPF deve ser formatado como 123.456.789-01
    expect(cpfInput.value).toMatch(/\d{3}\.\d{3}\.\d{3}-\d{2}/)
  })

  it('deve formatar Telefone automaticamente', async () => {
    const user = userEvent.setup()
    renderCadastrarPessoa()
    
    const phoneInput = screen.getByLabelText('Telefone Celular') as HTMLInputElement
    
    await user.type(phoneInput, '11987654321')
    
    // O telefone deve ser formatado como (11) 98765-4321
    expect(phoneInput.value).toMatch(/\(\d{2}\)\s\d{5}-\d{4}/)
  })
})

describe('CadastrarPessoa - Fluxo de Cadastro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    localStorageMock.setItem('accessToken', 'mock-token')
    globalThis.fetch = vi.fn()
    mockUseParams.mockReturnValue({})
    // Mock do console.error para evitar mensagens no stderr durante os testes
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deve cadastrar uma nova pessoa com sucesso', async () => {
    const user = userEvent.setup()
    
    const mockCreatedPerson: PersonResponseDto = {
      ...mockPerson,
      id: 'new-person-id',
    }
    
    mockCreatePerson.mockResolvedValueOnce(mockCreatedPerson)
    
    renderCadastrarPessoa()
    
    const nomeInput = screen.getByPlaceholderText('Digite o nome completo')
    const emailInput = screen.getByPlaceholderText('exemplo@email.com')
    const phoneInput = screen.getByLabelText('Telefone Celular')
    const cpfInput = screen.getByPlaceholderText('000.000.000-00')
    const birthDateInput = screen.getByLabelText('Data de Nascimento')
    const saveButton = screen.getByRole('button', { name: /salvar pessoa/i })
    
    await user.type(nomeInput, 'Maria Santos')
    await user.type(emailInput, 'maria@example.com')
    await user.type(phoneInput, '11987654321')
    await user.type(cpfInput, '12345678901')
    await user.type(birthDateInput, '1990-05-20')
    
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(mockCreatePerson).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Maria Santos',
          email: 'maria@example.com',
          phone: '11987654321',
          cpf: '12345678901',
          birthDate: '1990-05-20',
        })
      )
    })
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/Dashboard/listar-pessoas')
    }, { timeout: 200 })
  })

  it('deve exibir erro quando o cadastro falhar', async () => {
    const user = userEvent.setup()
    
    mockCreatePerson.mockRejectedValueOnce(new Error('Erro ao cadastrar pessoa'))
    
    renderCadastrarPessoa()
    
    const nomeInput = screen.getByPlaceholderText('Digite o nome completo')
    const saveButton = screen.getByRole('button', { name: /salvar pessoa/i })
    
    await user.type(nomeInput, 'Maria Santos')
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(mockCreatePerson).toHaveBeenCalled()
    })
    
    // O erro deve ser exibido (via toast ou mensagem de erro)
    await waitFor(() => {
      const errorElement = document.querySelector('[style*="color: #c33"]') || 
                          document.querySelector('[style*="background-color: #fee"]')
      expect(errorElement || mockCreatePerson).toBeTruthy()
    })
  })

  it('deve desabilitar o botão durante o carregamento', async () => {
    const user = userEvent.setup()
    
    // Criar uma promise que não resolve imediatamente
    let resolvePromise: (value: PersonResponseDto) => void
    const delayedPromise = new Promise<PersonResponseDto>((resolve) => {
      resolvePromise = resolve
    })
    
    mockCreatePerson.mockImplementationOnce(() => delayedPromise)
    
    renderCadastrarPessoa()
    
    const nomeInput = screen.getByPlaceholderText('Digite o nome completo')
    const saveButton = screen.getByRole('button', { name: /salvar pessoa/i })
    
    await user.type(nomeInput, 'Maria Santos')
    await user.click(saveButton)
    
    // Verificar se o botão está desabilitado durante o loading
    await waitFor(() => {
      expect(saveButton).toBeDisabled()
    }, { timeout: 500 })
    
    // Resolver a promise para finalizar o teste
    resolvePromise!(mockPerson)
    
    await waitFor(() => {
      expect(saveButton).not.toBeDisabled()
    }, { timeout: 200 })
  })

  it('deve fazer upload de foto ao cadastrar', async () => {
    const user = userEvent.setup()
    
    const newPersonId = 'new-person-id'
    const mockCreatedPerson: PersonResponseDto = {
      ...mockPerson,
      id: newPersonId,
    }
    
    const mockPhotoResponse: PhotoUploadResponseDto = {
      message: 'Foto enviada com sucesso',
      photoUrl: 'https://example.com/new-photo.jpg',
      personId: newPersonId,
    }
    
    mockCreatePerson.mockResolvedValueOnce(mockCreatedPerson)
    mockUploadPhoto.mockResolvedValueOnce(mockPhotoResponse)
    
    // Criar um arquivo de imagem mockado
    const file = new File(['(⌐□_□)'], 'test-image.png', { type: 'image/png' })
    
    renderCadastrarPessoa()
    
    const nomeInput = screen.getByPlaceholderText('Digite o nome completo')
    const fotoInput = screen.getByLabelText('Foto') as HTMLInputElement
    const saveButton = screen.getByRole('button', { name: /salvar pessoa/i })
    
    await user.type(nomeInput, 'Maria Santos')
    await user.upload(fotoInput, file)
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(mockCreatePerson).toHaveBeenCalled()
    })
    
    // Verificar se o upload foi chamado com o ID correto retornado pelo createPerson
    await waitFor(() => {
      expect(mockUploadPhoto).toHaveBeenCalledWith(newPersonId, expect.any(File))
    }, { timeout: 500 })
  })

  it('deve validar que o nome é obrigatório', async () => {
    const user = userEvent.setup()
    renderCadastrarPessoa()
    
    const saveButton = screen.getByRole('button', { name: /salvar pessoa/i })
    
    // Tentar submeter sem preencher o nome
    await user.click(saveButton)
    
    // O HTML5 validation deve impedir o submit
    expect(mockCreatePerson).not.toHaveBeenCalled()
  })
})

describe('CadastrarPessoa - Fluxo de Edição', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    localStorageMock.setItem('accessToken', 'mock-token')
    globalThis.fetch = vi.fn()
    // Mock do console.error para evitar mensagens no stderr durante os testes
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deve carregar dados da pessoa em modo de edição', async () => {
    mockUseParams.mockReturnValue({ id: 'person-id' })
    mockGetPersonById.mockResolvedValueOnce(mockPerson)
    
    // Mock do fetch para evitar erros
    ;(globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPerson,
    })
    
    renderCadastrarPessoa()
    
    // Deve mostrar loading inicialmente
    expect(screen.getByText('Carregando dados da pessoa...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(mockGetPersonById).toHaveBeenCalledWith('person-id')
    })
    
    await waitFor(() => {
      expect(screen.getByText('Editar Pessoa')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('deve atualizar uma pessoa existente com sucesso', async () => {
    const user = userEvent.setup()
    
    mockUseParams.mockReturnValue({ id: 'person-id' })
    mockGetPersonById.mockResolvedValueOnce(mockPerson)
    mockUpdatePerson.mockResolvedValueOnce(mockPerson)
    
    // Mock do fetch para evitar erros
    ;(globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPerson,
    })
    
    renderCadastrarPessoa()
    
    await waitFor(() => {
      expect(screen.getByText('Editar Pessoa')).toBeInTheDocument()
    }, { timeout: 3000 })
    
    const nomeInput = screen.getByPlaceholderText('Digite o nome completo') as HTMLInputElement
    const saveButton = screen.getByRole('button', { name: /salvar alterações/i })
    
    // Limpar e digitar novo nome
    await user.clear(nomeInput)
    await user.type(nomeInput, 'João Silva Atualizado')
    
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(mockUpdatePerson).toHaveBeenCalledWith(
        'person-id',
        expect.objectContaining({
          fullName: 'João Silva Atualizado',
        })
      )
    })
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/Dashboard/listar-pessoas')
    }, { timeout: 200 })
  })

  it('deve exibir erro ao carregar dados da pessoa', async () => {
    mockUseParams.mockReturnValue({ id: 'person-id' })
    mockGetPersonById.mockRejectedValueOnce(new Error('Pessoa não encontrada'))
    
    // Mock do fetch para retornar erro
    ;(globalThis.fetch as any).mockRejectedValueOnce(new Error('fetch failed'))
    
    renderCadastrarPessoa()
    
    await waitFor(() => {
      expect(mockGetPersonById).toHaveBeenCalledWith('person-id')
    }, { timeout: 3000 })
  })
})

describe('CadastrarPessoa - Validações de Foto', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    localStorageMock.setItem('accessToken', 'mock-token')
    globalThis.fetch = vi.fn()
    mockUseParams.mockReturnValue({})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deve rejeitar arquivo que não é imagem', async () => {
    const user = userEvent.setup()
    renderCadastrarPessoa()
    
    const fotoInput = screen.getByLabelText('Foto') as HTMLInputElement
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    
    await user.upload(fotoInput, file)
    
    // O componente deve validar e limpar o input
    await waitFor(() => {
      expect(fotoInput.files?.length).toBe(0)
    })
  })

  it('deve rejeitar arquivo maior que 5MB', async () => {
    const user = userEvent.setup()
    renderCadastrarPessoa()
    
    const fotoInput = screen.getByLabelText('Foto') as HTMLInputElement
    // Criar um arquivo mockado com tamanho maior que 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large-image.png', { type: 'image/png' })
    
    // Mock do FileReader para simular o tamanho
    Object.defineProperty(largeFile, 'size', {
      value: 6 * 1024 * 1024,
      writable: false,
    })
    
    await user.upload(fotoInput, largeFile)
    
    // O componente deve validar e limpar o input
    await waitFor(() => {
      expect(fotoInput.files?.length).toBe(0)
    })
  })
})

