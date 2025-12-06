import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../src/app/providers/AuthContext'
import Login from '../src/app/routes/public/Login/Login'

// Mock do useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

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

const renderLogin = () => {
  return render(
    <AuthProvider>
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    </AuthProvider>
  )
}

// Dados mockados
const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'user@example.com',
  emailVerified: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

const mockAuthResult = {
  user: mockUser,
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
}

describe('Login - Visualização de Componentes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deve renderizar o título "Bem-vindo de volta!"', () => {
    renderLogin()
    
    const title = screen.getByText('Bem-vindo de volta!')
    
    expect(title).toBeVisible()
    expect(title.tagName).toBe('H2')
  })

  it('deve renderizar a descrição do formulário', () => {
    renderLogin()
    
    const description = screen.getByText('Por favor, insira seus dados para entrar.')
    
    expect(description).toBeVisible()
  })

  it('deve renderizar o campo de e-mail/usuário', () => {
    renderLogin()
    
    const emailLabel = screen.getByLabelText('E-mail / Usuário')
    const emailInput = screen.getByPlaceholderText('Digite seu e-mail ou usuário')
    
    expect(emailLabel).toBeVisible()
    expect(emailInput).toBeVisible()
    expect(emailInput).toHaveAttribute('type', 'text')
  })

  it('deve renderizar o campo de senha', () => {
    renderLogin()
    
    const passwordLabel = screen.getByLabelText('Senha')
    const passwordInput = screen.getByPlaceholderText('Digite sua senha')
    
    expect(passwordLabel).toBeVisible()
    expect(passwordInput).toBeVisible()
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('deve renderizar o checkbox "Lembrar-me"', () => {
    renderLogin()
    
    const rememberCheckbox = screen.getByLabelText('Lembrar-me')
    
    expect(rememberCheckbox).toBeVisible()
    expect(rememberCheckbox).toHaveAttribute('type', 'checkbox')
  })

  it('deve renderizar o botão "Entrar"', () => {
    renderLogin()
    
    const entrarButton = screen.getByRole('button', { name: /entrar/i })
    
    expect(entrarButton).toBeVisible()
    expect(entrarButton).not.toBeDisabled()
  })

  it('deve renderizar o link "Cadastre-se" no rodapé', () => {
    renderLogin()
    
    const cadastreSeLink = screen.getByRole('link', { name: /cadastre-se/i })
    
    expect(cadastreSeLink).toBeVisible()
    expect(cadastreSeLink).toHaveAttribute('href', '/register')
  })

  it('deve renderizar o texto "Não tem uma conta?"', () => {
    renderLogin()
    
    const footerText = screen.getByText(/não tem uma conta\?/i)
    
    expect(footerText).toBeVisible()
  })

  it('deve renderizar o container principal', () => {
    renderLogin()
    
    const container = document.querySelector('.login-container')
    
    expect(container).toBeInTheDocument()
  })

  it('deve renderizar o card de login', () => {
    renderLogin()
    
    const card = document.querySelector('.login-card')
    
    expect(card).toBeInTheDocument()
  })
})

describe('Login - Interações do Usuário', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deve permitir digitar no campo de e-mail', async () => {
    const user = userEvent.setup()
    renderLogin()
    
    const emailInput = screen.getByPlaceholderText('Digite seu e-mail ou usuário') as HTMLInputElement
    
    await user.type(emailInput, 'test@example.com')
    
    expect(emailInput.value).toBe('test@example.com')
  })

  it('deve permitir digitar no campo de senha', async () => {
    const user = userEvent.setup()
    renderLogin()
    
    const passwordInput = screen.getByPlaceholderText('Digite sua senha') as HTMLInputElement
    
    await user.type(passwordInput, 'password123')
    
    expect(passwordInput.value).toBe('password123')
  })

  it('deve alternar a visibilidade da senha ao clicar no ícone', async () => {
    const user = userEvent.setup()
    renderLogin()
    
    const passwordInput = screen.getByPlaceholderText('Digite sua senha') as HTMLInputElement
    const toggleIcon = document.querySelector('.toggle-password')
    
    expect(passwordInput).toHaveAttribute('type', 'password')
    
    if (toggleIcon) {
      await user.click(toggleIcon)
      expect(passwordInput).toHaveAttribute('type', 'text')
      
      await user.click(toggleIcon)
      expect(passwordInput).toHaveAttribute('type', 'password')
    }
  })

  it('deve permitir marcar/desmarcar o checkbox "Lembrar-me"', async () => {
    const user = userEvent.setup()
    renderLogin()
    
    const rememberCheckbox = screen.getByLabelText('Lembrar-me') as HTMLInputElement
    
    expect(rememberCheckbox.checked).toBe(false)
    
    await user.click(rememberCheckbox)
    expect(rememberCheckbox.checked).toBe(true)
    
    await user.click(rememberCheckbox)
    expect(rememberCheckbox.checked).toBe(false)
  })
})

describe('Login - Fluxo de Autenticação', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    globalThis.fetch = vi.fn()
    // Mock do console.error para evitar mensagens no stderr durante os testes
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deve realizar login com sucesso e redirecionar', async () => {
    const user = userEvent.setup()
    
    // Mock da resposta de sucesso com delay para permitir verificar o loading
    ;(globalThis.fetch as any).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        json: async () => mockAuthResult,
      }), 50))
    )

    renderLogin()
    
    const emailInput = screen.getByPlaceholderText('Digite seu e-mail ou usuário')
    const passwordInput = screen.getByPlaceholderText('Digite sua senha')
    const submitButton = screen.getByRole('button', { name: /entrar/i })
    
    await user.type(emailInput, 'user@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    // Verificar se o botão mostra "Entrando..." durante o loading
    await waitFor(() => {
      expect(screen.getByText('Entrando...')).toBeInTheDocument()
    }, { timeout: 100 })
    
    // Verificar se a API foi chamada corretamente
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/signin/email-password'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'user@example.com',
            password: 'password123',
          }),
        })
      )
    })
    
    // Verificar se os tokens foram salvos no localStorage
    await waitFor(() => {
      expect(localStorage.getItem('accessToken')).toBe('mock-access-token')
      expect(localStorage.getItem('refreshToken')).toBe('mock-refresh-token')
    })
    
    // Verificar se houve redirecionamento
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/Dashboard')
    })
  })

  it('deve exibir erro quando as credenciais são inválidas (401)', async () => {
    const user = userEvent.setup()
    
    // Mock da resposta de erro 401
    ;(globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Credenciais inválidas' }),
    })

    renderLogin()
    
    const emailInput = screen.getByPlaceholderText('Digite seu e-mail ou usuário')
    const passwordInput = screen.getByPlaceholderText('Digite sua senha')
    const submitButton = screen.getByRole('button', { name: /entrar/i })
    
    await user.type(emailInput, 'wrong@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)
    
    // Verificar se a mensagem de erro é exibida
    await waitFor(() => {
      expect(screen.getByText('E-mail ou senha incorretos!')).toBeInTheDocument()
    })
    
    // Verificar que não houve redirecionamento
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('deve exibir erro quando há rate limit (403)', async () => {
    const user = userEvent.setup()
    
    // Mock da resposta de erro 403
    ;(globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ message: 'Rate limit excedido' }),
    })

    renderLogin()
    
    const emailInput = screen.getByPlaceholderText('Digite seu e-mail ou usuário')
    const passwordInput = screen.getByPlaceholderText('Digite sua senha')
    const submitButton = screen.getByRole('button', { name: /entrar/i })
    
    await user.type(emailInput, 'user@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    // Verificar se a mensagem de erro é exibida
    await waitFor(() => {
      expect(screen.getByText('E-mail ou senha incorretos!')).toBeInTheDocument()
    })
  })

  it('deve exibir erro quando ocorre um erro na requisição', async () => {
    const user = userEvent.setup()
    
    // Mock de erro na requisição (network error)
    ;(globalThis.fetch as any).mockRejectedValueOnce(new Error('Network error'))

    renderLogin()
    
    const emailInput = screen.getByPlaceholderText('Digite seu e-mail ou usuário')
    const passwordInput = screen.getByPlaceholderText('Digite sua senha')
    const submitButton = screen.getByRole('button', { name: /entrar/i })
    
    await user.type(emailInput, 'user@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    // Como o AuthContext captura todos os erros e retorna false,
    // a mensagem exibida será "E-mail ou senha incorretos!"
    await waitFor(() => {
      expect(screen.getByText('E-mail ou senha incorretos!')).toBeInTheDocument()
    })
    
    // Verificar que não houve redirecionamento
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('deve desabilitar o botão durante o carregamento', async () => {
    const user = userEvent.setup()
    
    // Mock de resposta lenta
    ;(globalThis.fetch as any).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        json: async () => mockAuthResult,
      }), 100))
    )

    renderLogin()
    
    const emailInput = screen.getByPlaceholderText('Digite seu e-mail ou usuário')
    const passwordInput = screen.getByPlaceholderText('Digite sua senha')
    const submitButton = screen.getByRole('button', { name: /entrar/i })
    
    await user.type(emailInput, 'user@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)
    
    // Verificar se o botão está desabilitado durante o loading
    await waitFor(() => {
      expect(submitButton).toBeDisabled()
    })
    
    // Aguardar o loading terminar
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    }, { timeout: 200 })
  })

  it('deve validar que os campos são obrigatórios', async () => {
    const user = userEvent.setup()
    renderLogin()
    
    const submitButton = screen.getByRole('button', { name: /entrar/i })
    
    // Tentar submeter sem preencher os campos
    await user.click(submitButton)
    
    // O HTML5 validation deve impedir o submit
    // Verificar que a API não foi chamada
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('deve redirecionar para Dashboard se já estiver autenticado', async () => {
    // Simular usuário já autenticado
    localStorageMock.setItem('accessToken', 'existing-token')
    localStorageMock.setItem('refreshToken', 'existing-refresh-token')
    localStorageMock.setItem('user', JSON.stringify(mockUser))
    
    // Mock da verificação de token válido
    ;(globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    })

    renderLogin()
    
    // Verificar se houve redirecionamento
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/Dashboard')
    })
  })
})

