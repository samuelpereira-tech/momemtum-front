import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../src/app/providers/AuthContext'
import ListarAreas from '../src/app/routes/admin/ListarAreas/ListarAreas'

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

const renderListarAreas = () => {
  return render(
    <AuthProvider>
      <BrowserRouter>
        <ListarAreas />
      </BrowserRouter>
    </AuthProvider>
  )
}

describe('ListarAreas - Visibilidade dos Botões', () => {
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

  it('deve renderizar o botão "+ Áreas" e estar visível', () => {
    renderListarAreas()
    
    // Buscar o link pelo href que leva para adicionar área
    const adicionarAreasLink = screen.getByRole('link', { 
      name: (content, element) => {
        return element?.getAttribute('href') === '/Dashboard/escala/areas/adicionar' &&
               element?.textContent?.includes('Áreas') === true
      }
    })
    
    expect(adicionarAreasLink).toBeVisible()
    expect(adicionarAreasLink).toHaveAttribute('href', '/Dashboard/escala/areas/adicionar')
    
    // Verificar se contém o ícone de plus
    const plusIcon = adicionarAreasLink.querySelector('.fa-plus')
    expect(plusIcon).toBeInTheDocument()
    
    // Verificar se contém o texto "Áreas"
    expect(adicionarAreasLink).toHaveTextContent('Áreas')
  })


  it('deve renderizar as áreas favoritas', () => {
    renderListarAreas()
    
    // Verificar se as áreas favoritas estão visíveis nos links do menu
    const areaProducaoLink = screen.getByRole('link', { name: /área de produção/i })
    const areaVendasLink = screen.getByRole('link', { name: /área de vendas/i })
    const areaMarketingLink = screen.getByRole('link', { name: /área de marketing/i })
    
    expect(areaProducaoLink).toBeVisible()
    expect(areaVendasLink).toBeVisible()
    expect(areaMarketingLink).toBeVisible()
    
    // Verificar se os links das áreas favoritas têm os hrefs corretos
    expect(areaProducaoLink).toHaveAttribute('href', '/Dashboard/escala/areas/1')
    expect(areaVendasLink).toHaveAttribute('href', '/Dashboard/escala/areas/2')
    expect(areaMarketingLink).toHaveAttribute('href', '/Dashboard/escala/areas/5')
  })
})

