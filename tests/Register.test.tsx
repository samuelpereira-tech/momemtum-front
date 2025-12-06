import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../src/app/providers/AuthContext'
import { ToastProvider } from '../src/components/ui/Toast/ToastProvider'
import Register from '../src/app/routes/public/Register/Register'

const renderRegister = () => {
  return render(
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Register />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}

describe('Register - Visualização de Componentes', () => {
  it('deve renderizar o título "Crie sua conta!"', () => {
    renderRegister()
    
    const title = screen.getByText('Crie sua conta!')
    
    expect(title).toBeVisible()
    expect(title.tagName).toBe('H2')
  })

  it('deve renderizar a descrição do formulário', () => {
    renderRegister()
    
    const description = screen.getByText('Preencha os dados abaixo para se cadastrar.')
    
    expect(description).toBeVisible()
  })

  it('deve renderizar o campo de e-mail', () => {
    renderRegister()
    
    const emailLabel = screen.getByLabelText('E-mail')
    const emailInput = screen.getByPlaceholderText('Digite seu e-mail')
    
    expect(emailLabel).toBeVisible()
    expect(emailInput).toBeVisible()
    expect(emailInput).toHaveAttribute('type', 'email')
  })

  it('deve renderizar o campo de senha', () => {
    renderRegister()
    
    const passwordLabel = screen.getByLabelText('Senha')
    const passwordInput = screen.getByPlaceholderText('Digite sua senha')
    
    expect(passwordLabel).toBeVisible()
    expect(passwordInput).toBeVisible()
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('deve renderizar o campo de confirmar senha', () => {
    renderRegister()
    
    const confirmPasswordLabel = screen.getByLabelText('Confirmar Senha')
    const confirmPasswordInput = screen.getByPlaceholderText('Confirme sua senha')
    
    expect(confirmPasswordLabel).toBeVisible()
    expect(confirmPasswordInput).toBeVisible()
    expect(confirmPasswordInput).toHaveAttribute('type', 'password')
  })

  it('deve renderizar o botão "Cadastrar"', () => {
    renderRegister()
    
    const cadastrarButton = screen.getByRole('button', { name: /cadastrar/i })
    
    expect(cadastrarButton).toBeVisible()
    expect(cadastrarButton).not.toBeDisabled()
  })

  it('deve renderizar o link "Entrar" no rodapé', () => {
    renderRegister()
    
    const entrarLink = screen.getByRole('link', { name: /entrar/i })
    
    expect(entrarLink).toBeVisible()
    expect(entrarLink).toHaveAttribute('href', '/')
  })

  it('deve renderizar o texto "Já tem uma conta?"', () => {
    renderRegister()
    
    const footerText = screen.getByText(/já tem uma conta\?/i)
    
    expect(footerText).toBeVisible()
  })

  it('deve renderizar o container principal', () => {
    renderRegister()
    
    const container = document.querySelector('.register-container')
    
    expect(container).toBeInTheDocument()
  })

  it('deve renderizar o card de cadastro', () => {
    renderRegister()
    
    const card = document.querySelector('.register-card')
    
    expect(card).toBeInTheDocument()
  })

  it('deve renderizar todos os campos do formulário', () => {
    renderRegister()
    
    const emailInput = screen.getByLabelText('E-mail')
    const passwordInput = screen.getByLabelText('Senha')
    const confirmPasswordInput = screen.getByLabelText('Confirmar Senha')
    
    expect(emailInput).toBeVisible()
    expect(passwordInput).toBeVisible()
    expect(confirmPasswordInput).toBeVisible()
  })
})

