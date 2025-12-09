import { API_BASE_URL, API_ENDPOINTS, SUPABASE_URL, SUPABASE_ANON_KEY, AUTH_SERVICE_PROVIDER } from '../config/api'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface SignInRequest {
  email: string
  password: string
}

export interface SignUpRequest {
  email: string
  password: string
}

export interface User {
  id: string
  email: string
  emailVerified: boolean
  phone?: string
  phoneVerified?: boolean
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface Session {
  accessToken: string
  refreshToken: string
  expiresIn: number
  expiresAt: number
  tokenType: string
  user: User
}

export interface AuthResult {
  user: User
  session?: Session
  accessToken?: string
  refreshToken?: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

/**
 * Tipo de autenticação disponível
 */
export type AuthProviderType = 'localhost' | 'supabase'

/**
 * Interface de configuração para o AuthService (localhost)
 */
export interface IAuthServiceConfig {
  baseUrl: string
  endpoints: {
    signup: string
    signInEmailPassword: string
    refreshToken: string
    me: string
    signOut: string
  }
}

/**
 * Interface de configuração para o SupabaseAuthService
 */
export interface ISupabaseAuthServiceConfig {
  supabaseUrl: string
  supabaseAnonKey: string
}

/**
 * Interface que define os métodos do serviço de autenticação
 */
export interface IAuthService {
  signUp(email: string, password: string): Promise<AuthResult>
  signInWithEmailPassword(email: string, password: string): Promise<AuthResult>
  refreshToken(refreshToken: string): Promise<AuthResult>
  getCurrentUser(accessToken: string): Promise<User>
  signOut(accessToken: string): Promise<void>
}

/**
 * Classe que implementa o serviço de autenticação via localhost:3000
 */
export class AuthService implements IAuthService {
  private config: IAuthServiceConfig

  constructor(config: IAuthServiceConfig) {
    this.config = config
  }

  /**
   * Registra um novo usuário com email e senha
   */
  async signUp(email: string, password: string): Promise<AuthResult> {
    const response = await fetch(`${this.config.baseUrl}${this.config.endpoints.signup}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password } as SignUpRequest),
    })

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error('Dados inválidos')
      }
      if (response.status === 403) {
        throw new Error('Rate limit excedido. Aguarde antes de tentar novamente')
      }
      if (response.status === 409) {
        throw new Error('Email já cadastrado')
      }
      throw new Error('Erro ao criar conta')
    }

    return response.json()
  }

  /**
   * Realiza login com email e senha
   */
  async signInWithEmailPassword(email: string, password: string): Promise<AuthResult> {
    const response = await fetch(`${this.config.baseUrl}${this.config.endpoints.signInEmailPassword}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password } as SignInRequest),
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Credenciais inválidas')
      }
      if (response.status === 403) {
        throw new Error('Rate limit excedido. Aguarde antes de tentar novamente')
      }
      throw new Error('Erro ao realizar login')
    }

    return response.json()
  }

  /**
   * Renova o access token usando o refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    const response = await fetch(`${this.config.baseUrl}${this.config.endpoints.refreshToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken } as RefreshTokenRequest),
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Refresh token inválido ou expirado')
      }
      throw new Error('Erro ao renovar token')
    }

    return response.json()
  }

  /**
   * Obtém os dados do usuário autenticado
   */
  async getCurrentUser(accessToken: string): Promise<User> {
    const response = await fetch(`${this.config.baseUrl}${this.config.endpoints.me}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Não autenticado')
      }
      throw new Error('Erro ao obter dados do usuário')
    }

    return response.json()
  }

  /**
   * Realiza logout
   */
  async signOut(accessToken: string): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}${this.config.endpoints.signOut}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Não autenticado')
      }
      throw new Error('Erro ao realizar logout')
    }
  }
}

/**
 * Classe que implementa o serviço de autenticação via Supabase
 */
export class SupabaseAuthService implements IAuthService {
  private supabase: SupabaseClient

  constructor(config: ISupabaseAuthServiceConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey)
  }

  /**
   * Registra um novo usuário com email e senha via Supabase
   */
  async signUp(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      if (error.message.includes('User already registered') || error.message.includes('already exists')) {
        throw new Error('Email já cadastrado')
      }
      if (error.message.includes('Invalid email') || error.message.includes('Password')) {
        throw new Error('Dados inválidos')
      }
      if (error.message.includes('rate limit')) {
        throw new Error('Rate limit excedido. Aguarde antes de tentar novamente')
      }
      throw new Error(error.message || 'Erro ao criar conta')
    }

    if (!data.user) {
      throw new Error('Erro ao criar conta')
    }

    // Converter o usuário do Supabase para o formato esperado
    const user: User = {
      id: data.user.id,
      email: data.user.email || '',
      emailVerified: data.user.email_confirmed_at !== null,
      phone: data.user.phone || undefined,
      phoneVerified: data.user.phone_confirmed_at !== null,
      metadata: data.user.user_metadata || {},
      createdAt: data.user.created_at,
      updatedAt: data.user.updated_at || data.user.created_at,
    }

    // Se houver sessão (email confirmado automaticamente), retornar com sessão
    if (data.session) {
      const session: Session = {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in || 3600,
        expiresAt: data.session.expires_at || Math.floor(Date.now() / 1000) + 3600,
        tokenType: data.session.token_type || 'bearer',
        user,
      }

      return {
        user,
        session,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      }
    }

    // Se não houver sessão (precisa confirmar email), retornar apenas o usuário
    return {
      user,
    }
  }

  /**
   * Realiza login com email e senha via Supabase
   */
  async signInWithEmailPassword(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message.includes('Invalid login credentials') || error.message.includes('Email not confirmed')) {
        throw new Error('Credenciais inválidas')
      }
      if (error.message.includes('rate limit')) {
        throw new Error('Rate limit excedido. Aguarde antes de tentar novamente')
      }
      throw new Error(error.message || 'Erro ao realizar login')
    }

    if (!data.user || !data.session) {
      throw new Error('Erro ao realizar login')
    }

    // Converter o usuário do Supabase para o formato esperado
    const user: User = {
      id: data.user.id,
      email: data.user.email || '',
      emailVerified: data.user.email_confirmed_at !== null,
      phone: data.user.phone || undefined,
      phoneVerified: data.user.phone_confirmed_at !== null,
      metadata: data.user.user_metadata || {},
      createdAt: data.user.created_at,
      updatedAt: data.user.updated_at || data.user.created_at,
    }

    const session: Session = {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in || 3600,
      expiresAt: data.session.expires_at || Math.floor(Date.now() / 1000) + 3600,
      tokenType: data.session.token_type || 'bearer',
      user,
    }

    return {
      user,
      session,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    }
  }

  /**
   * Renova o access token usando o refresh token via Supabase
   */
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    })

    if (error) {
      if (error.message.includes('Invalid refresh token') || error.message.includes('expired')) {
        throw new Error('Refresh token inválido ou expirado')
      }
      throw new Error(error.message || 'Erro ao renovar token')
    }

    if (!data.user || !data.session) {
      throw new Error('Erro ao renovar token')
    }

    // Converter o usuário do Supabase para o formato esperado
    const user: User = {
      id: data.user.id,
      email: data.user.email || '',
      emailVerified: data.user.email_confirmed_at !== null,
      phone: data.user.phone || undefined,
      phoneVerified: data.user.phone_confirmed_at !== null,
      metadata: data.user.user_metadata || {},
      createdAt: data.user.created_at,
      updatedAt: data.user.updated_at || data.user.created_at,
    }

    const session: Session = {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in || 3600,
      expiresAt: data.session.expires_at || Math.floor(Date.now() / 1000) + 3600,
      tokenType: data.session.token_type || 'bearer',
      user,
    }

    return {
      user,
      session,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    }
  }

  /**
   * Obtém os dados do usuário autenticado via Supabase
   */
  async getCurrentUser(accessToken: string): Promise<User> {
    // Usar a instância existente e obter o usuário com o token JWT
    // O método getUser() aceita o token JWT como parâmetro opcional
    const { data: { user }, error } = await this.supabase.auth.getUser(accessToken)

    if (error || !user) {
      if (error?.message.includes('JWT') || error?.message.includes('expired') || error?.message.includes('Invalid')) {
        throw new Error('Não autenticado')
      }
      throw new Error(error?.message || 'Erro ao obter dados do usuário')
    }

    return {
      id: user.id,
      email: user.email || '',
      emailVerified: user.email_confirmed_at !== null,
      phone: user.phone || undefined,
      phoneVerified: user.phone_confirmed_at !== null,
      metadata: user.user_metadata || {},
      createdAt: user.created_at,
      updatedAt: user.updated_at || user.created_at,
    }
  }

  /**
   * Realiza logout via Supabase
   */
  async signOut(accessToken: string): Promise<void> {
    // Validar o token primeiro
    const { data: { user }, error: getUserError } = await this.supabase.auth.getUser(accessToken)
    
    if (getUserError || !user) {
      if (getUserError?.message.includes('JWT') || getUserError?.message.includes('expired')) {
        throw new Error('Não autenticado')
      }
      throw new Error(getUserError?.message || 'Não autenticado')
    }

    // Usar a instância existente para fazer logout
    const { error } = await this.supabase.auth.signOut()

    if (error) {
      if (error.message.includes('JWT') || error.message.includes('expired')) {
        throw new Error('Não autenticado')
      }
      throw new Error(error.message || 'Erro ao realizar logout')
    }
  }
}

/**
 * Factory para criar instâncias do serviço de autenticação
 */
export class AuthServiceFactory {
  /**
   * Cria uma instância do serviço de autenticação baseado no tipo fornecido
   */
  static create(provider: AuthProviderType): IAuthService {
    switch (provider) {
      case 'supabase':
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
          throw new Error('Configuração do Supabase não encontrada. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY')
        }
        return new SupabaseAuthService({
          supabaseUrl: SUPABASE_URL,
          supabaseAnonKey: SUPABASE_ANON_KEY,
        })
      case 'localhost':
      default:
        return new AuthService({
          baseUrl: API_BASE_URL,
          endpoints: {
            signup: API_ENDPOINTS.AUTH.SIGNUP,
            signInEmailPassword: API_ENDPOINTS.AUTH.SIGNIN_EMAIL_PASSWORD,
            refreshToken: API_ENDPOINTS.AUTH.REFRESH_TOKEN,
            me: API_ENDPOINTS.AUTH.ME,
            signOut: API_ENDPOINTS.AUTH.SIGNOUT,
          },
        })
    }
  }
}

// Instância padrão do AuthService baseada na variável de ambiente AUTH_SERVICE_PROVIDER
const defaultAuthService = AuthServiceFactory.create(AUTH_SERVICE_PROVIDER)

/**
 * Funções de compatibilidade - mantidas para não quebrar código existente
 * @deprecated Use AuthService diretamente ou injete uma instância
 */
export async function signUp(
  email: string,
  password: string
): Promise<AuthResult> {
  return defaultAuthService.signUp(email, password)
}

/**
 * Funções de compatibilidade - mantidas para não quebrar código existente
 * @deprecated Use AuthService diretamente ou injete uma instância
 */
export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  return defaultAuthService.signInWithEmailPassword(email, password)
}

/**
 * @deprecated Use AuthService diretamente ou injete uma instância
 */
export async function refreshToken(refreshToken: string): Promise<AuthResult> {
  return defaultAuthService.refreshToken(refreshToken)
}

/**
 * @deprecated Use AuthService diretamente ou injete uma instância
 */
export async function getCurrentUser(accessToken: string): Promise<User> {
  return defaultAuthService.getCurrentUser(accessToken)
}

/**
 * @deprecated Use AuthService diretamente ou injete uma instância
 */
export async function signOut(accessToken: string): Promise<void> {
  return defaultAuthService.signOut(accessToken)
}

