import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

const SIDEBAR_PINNED_KEY = 'sidebar-pinned'

interface SidebarContextType {
  isPinned: boolean
  togglePin: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isPinned, setIsPinned] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_PINNED_KEY)
    return saved !== null ? saved === 'true' : true // Por padrão, sempre aberto
  })

  // Inicializar e atualizar largura do sidebar
  useEffect(() => {
    localStorage.setItem(SIDEBAR_PINNED_KEY, String(isPinned))
    // Atualizar CSS custom property para ajustar layout
    document.documentElement.style.setProperty('--sidebar-width', isPinned ? '260px' : '0px')
  }, [isPinned])

  const togglePin = () => {
    setIsPinned(!isPinned)
  }

  return (
    <SidebarContext.Provider value={{ isPinned, togglePin }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

