import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../../../../components/ui/Toast/ToastProvider'
import './Register.css'

export default function Register() {
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.showError('As senhas não coincidem!')
      return
    }
    
    setIsLoading(true)
    
    // Simular chamada de API
    setTimeout(() => {
      setIsLoading(false)
      // Aqui você pode redirecionar ou fazer a lógica de cadastro
      console.log('Cadastro:', { email, password })
    }, 1500)
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h2>Crie sua conta!</h2>
          <p>Preencha os dados abaixo para se cadastrar.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">E-mail</label>
            <div className="input-wrapper">
              <i className="fa-solid fa-envelope"></i>
              <input
                type="email"
                id="email"
                placeholder="Digite seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="input-group">
            <label htmlFor="password">Senha</label>
            <div className="input-wrapper">
              <i className="fa-solid fa-lock"></i>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <i
                className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} toggle-password`}
                onClick={() => setShowPassword(!showPassword)}
              ></i>
            </div>
          </div>
          <div className="input-group">
            <label htmlFor="confirmPassword">Confirmar Senha</label>
            <div className="input-wrapper">
              <i className="fa-solid fa-lock"></i>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <i
                className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} toggle-password`}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              ></i>
            </div>
          </div>
          <button type="submit" className="btn-register" disabled={isLoading}>
            {isLoading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
        <div className="register-footer">
          <p>Já tem uma conta? <Link to="/">Entrar</Link></p>
        </div>
      </div>
    </div>
  )
}

