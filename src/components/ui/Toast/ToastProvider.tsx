import { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode, memo } from 'react'
import ToastComponent from './Toast'
import type { Toast, ToastType } from './Toast'
import './Toast.css'

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  showSuccess: (message: string, duration?: number) => void
  showError: (message: string, duration?: number) => void
  showWarning: (message: string, duration?: number) => void
  showInfo: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

// Ref global para armazenar a função de adicionar toast sem causar re-renders
const toastStateRef = {
  addToast: (toast: Toast) => {},
  removeToast: (id: string) => {},
}

export function ToastProvider({ children }: ToastProviderProps) {
  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 5000) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast: Toast = {
        id,
        message,
        type,
        duration,
      }
      toastStateRef.addToast(newToast)
    },
    []
  )

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'success', duration)
    },
    [showToast]
  )

  const showError = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'error', duration)
    },
    [showToast]
  )

  const showWarning = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'warning', duration)
    },
    [showToast]
  )

  const showInfo = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'info', duration)
    },
    [showToast]
  )

  // Memoizar o valor do contexto para evitar re-renders desnecessários
  // As funções são estáveis (useCallback), então o contexto só muda se as dependências mudarem
  const contextValue = useMemo(
    () => ({
      showToast,
      showSuccess,
      showError,
      showWarning,
      showInfo,
    }),
    [showToast, showSuccess, showError, showWarning, showInfo]
  )

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastManager />
    </ToastContext.Provider>
  )
}

// Componente separado que gerencia apenas o estado dos toasts
// Isso isola os re-renders dos toasts do Provider principal
function ToastManager() {
  const [toasts, setToasts] = useState<Toast[]>([])

  // Atualizar as referências quando o componente monta
  useEffect(() => {
    toastStateRef.addToast = (toast: Toast) => {
      setToasts((prev) => [...prev, toast])
    }
    toastStateRef.removeToast = (id: string) => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContainer toasts={toasts} onRemove={removeToast} />
  )
}

// Componente separado memoizado para isolar re-renders dos toasts
const ToastContainer = memo(function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onClose={onRemove} />
      ))}
    </div>
  )
})

