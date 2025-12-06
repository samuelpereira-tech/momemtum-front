import { useEffect } from 'react'
import './Toast.css'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastProps {
  toast: Toast
  onClose: (id: string) => void
}

export default function ToastComponent({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id)
    }, toast.duration || 5000)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onClose])

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return 'fa-solid fa-check-circle'
      case 'error':
        return 'fa-solid fa-exclamation-circle'
      case 'warning':
        return 'fa-solid fa-triangle-exclamation'
      case 'info':
        return 'fa-solid fa-info-circle'
      default:
        return 'fa-solid fa-info-circle'
    }
  }

  return (
    <div className={`toast toast-${toast.type}`} role="alert">
      <div className="toast-content">
        <i className={getIcon()}></i>
        <span className="toast-message">{toast.message}</span>
      </div>
      <button
        className="toast-close"
        onClick={() => onClose(toast.id)}
        aria-label="Fechar notificação"
      >
        <i className="fa-solid fa-times"></i>
      </button>
    </div>
  )
}

