// Configuração da API
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// Configuração do Supabase
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Provedor de autenticação a ser usado (localhost ou supabase)
export const AUTH_SERVICE_PROVIDER = (import.meta.env.VITE_AUTH_SERVICE_PROVIDER || 'localhost') as 'localhost' | 'supabase'

export const API_ENDPOINTS = {
  AUTH: {
    SIGNIN_EMAIL_PASSWORD: '/auth/signin/email-password',
    REFRESH_TOKEN: '/auth/refresh',
    ME: '/auth/me',
    SIGNOUT: '/auth/signout',
  },
} as const

