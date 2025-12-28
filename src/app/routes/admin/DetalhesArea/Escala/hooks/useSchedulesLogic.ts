import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { scheduleService, type ScheduleOptimizedResponseDto } from '../../../../../../services/basic/scheduleService'
import { useToast } from '../../../../../../components/ui/Toast/ToastProvider'
import { type NotificationConfigDto } from '../../../../../../services/basic/scheduleService'

export function useSchedulesLogic() {
    const { id: scheduledAreaId } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const grupoId = searchParams.get('grupo')
    const toast = useToast()

    // Estados para escalas otimizadas (modo tabela)
    const [optimizedSchedules, setOptimizedSchedules] = useState<ScheduleOptimizedResponseDto[]>([])
    const [optimizedSchedulesPage, setOptimizedSchedulesPage] = useState(1)
    const [optimizedSchedulesTotalPages, setOptimizedSchedulesTotalPages] = useState(1)
    const [optimizedSchedulesLoading, setOptimizedSchedulesLoading] = useState(false)
    const schedulesLimit = 10

    // Estados para filtros de data (modo tabela)
    const [filterStartDate, setFilterStartDate] = useState<string>('')
    const [filterEndDate, setFilterEndDate] = useState<string>('')

    // Estados para agrupamento por data
    const [groupByDate, setGroupByDate] = useState(false)
    const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())

    // Estados para seleção múltipla e remoção
    const [selectedSchedules, setSelectedSchedules] = useState<Set<string>>(new Set())
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
    const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Estados para notificação WhatsApp
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
    const [scheduleNotifications, setScheduleNotifications] = useState<Map<string, NotificationConfigDto[]>>(new Map())

    // Ref para evitar execuções duplicadas
    const isLoadingRef = useRef(false)
    const lastLoadParamsRef = useRef<string>('')

    // Função auxiliar para recarregar escalas
    const reloadSchedules = useCallback(async () => {
        if (!scheduledAreaId) return

        setOptimizedSchedulesLoading(true)
        try {
            const filters: any = {
                page: optimizedSchedulesPage,
                limit: schedulesLimit,
            }

            if (grupoId) {
                filters.scheduleGenerationId = grupoId
            }

            if (filterStartDate) {
                filters.startDate = filterStartDate
            }

            if (filterEndDate) {
                filters.endDate = filterEndDate
            }

            const response = await scheduleService.getSchedulesOptimized(scheduledAreaId, filters)
            setOptimizedSchedules(response.data)
            setOptimizedSchedulesTotalPages(response.meta.totalPages)

            // Ajustar página se necessário
            if (response.data.length === 0 && optimizedSchedulesPage > 1) {
                setOptimizedSchedulesPage(prev => Math.max(1, prev - 1))
            }
        } catch (error) {
            console.error('Erro ao recarregar escalas:', error)
        } finally {
            setOptimizedSchedulesLoading(false)
        }
    }, [scheduledAreaId, grupoId, filterStartDate, filterEndDate, optimizedSchedulesPage, schedulesLimit])

    // Carregar escalas quando mudar modo, grupo, displayMode ou filtros
    useEffect(() => {
        if (!scheduledAreaId) {
            return
        }

        const loadKey = `${scheduledAreaId}-${grupoId || 'all'}-${filterStartDate}-${filterEndDate}-${optimizedSchedulesPage}`

        if (isLoadingRef.current || lastLoadParamsRef.current === loadKey) {
            return
        }

        isLoadingRef.current = true
        lastLoadParamsRef.current = loadKey

        const loadData = async () => {
            setOptimizedSchedulesLoading(true)
            try {
                const filters: any = {
                    page: optimizedSchedulesPage,
                    limit: schedulesLimit,
                }

                if (grupoId) {
                    filters.scheduleGenerationId = grupoId
                }

                if (filterStartDate) {
                    filters.startDate = filterStartDate
                }

                if (filterEndDate) {
                    filters.endDate = filterEndDate
                }

                const response = await scheduleService.getSchedulesOptimized(scheduledAreaId, filters)
                setOptimizedSchedules(response.data)
                setOptimizedSchedulesTotalPages(response.meta.totalPages)
                setSelectedSchedules(new Set())
            } catch (error) {
                console.error('Erro ao carregar escalas otimizadas:', error)
            } finally {
                setOptimizedSchedulesLoading(false)
                isLoadingRef.current = false
            }
        }
        loadData()
    }, [scheduledAreaId, grupoId, filterStartDate, filterEndDate, optimizedSchedulesPage, schedulesLimit])

    const handleSelectSchedule = useCallback((scheduleId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation()
        setSelectedSchedules(prev => {
            const newSet = new Set(prev)
            if (newSet.has(scheduleId)) {
                newSet.delete(scheduleId)
            } else {
                newSet.add(scheduleId)
            }
            return newSet
        })
    }, [])

    const handleSelectAll = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation()
        const allVisibleIds = new Set(optimizedSchedules.map(s => s.id))
        const allSelected = allVisibleIds.size > 0 && Array.from(allVisibleIds).every(id => selectedSchedules.has(id))

        if (allSelected) {
            setSelectedSchedules(prev => {
                const newSet = new Set(prev)
                allVisibleIds.forEach(id => newSet.delete(id))
                return newSet
            })
        } else {
            setSelectedSchedules(prev => {
                const newSet = new Set(prev)
                allVisibleIds.forEach(id => newSet.add(id))
                return newSet
            })
        }
    }, [optimizedSchedules, selectedSchedules])

    const confirmDeleteSchedule = async () => {
        if (!scheduleToDelete || !scheduledAreaId || isDeleting) return

        setIsDeleting(true)
        try {
            await scheduleService.deleteSchedule(scheduledAreaId, scheduleToDelete)
            setSelectedSchedules(prev => {
                const newSet = new Set(prev)
                newSet.delete(scheduleToDelete)
                return newSet
            })
            setShowDeleteModal(false)
            setScheduleToDelete(null)
            toast.showSuccess('Escala removida com sucesso!')
            await reloadSchedules()
        } catch (err: any) {
            console.error('Erro ao remover escala:', err)
            toast.showError(err.message || 'Erro ao remover escala')
        } finally {
            setIsDeleting(false)
        }
    }

    const confirmBulkDeleteSchedules = async () => {
        if (selectedSchedules.size === 0 || !scheduledAreaId || isDeleting) return

        setIsDeleting(true)
        const scheduleIds = Array.from(selectedSchedules)
        let successCount = 0
        let errorCount = 0

        try {
            const results = await Promise.allSettled(
                scheduleIds.map(id => scheduleService.deleteSchedule(scheduledAreaId, id))
            )

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    successCount++
                } else {
                    errorCount++
                    console.error(`Erro ao remover escala ${scheduleIds[index]}:`, result.reason)
                }
            })

            setSelectedSchedules(new Set())
            setShowBulkDeleteModal(false)

            if (errorCount === 0) {
                toast.showSuccess(`${successCount} escala(s) removida(s) com sucesso!`)
            } else if (successCount > 0) {
                toast.showWarning(`${successCount} escala(s) removida(s), ${errorCount} falharam`)
            } else {
                toast.showError('Erro ao remover escalas')
            }

            await reloadSchedules()
        } catch (err: any) {
            console.error('Erro ao remover escalas:', err)
            toast.showError('Erro ao remover escalas')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleSaveWhatsAppConfig = async (configs: NotificationConfigDto[]) => {
        if (selectedSchedules.size === 0) return

        setOptimizedSchedulesLoading(true)
        try {
            const promises = Array.from(selectedSchedules).map(scheduleId =>
                scheduleService.saveScheduleNotifications(scheduledAreaId!, scheduleId, configs)
            )

            await Promise.all(promises)

            setScheduleNotifications(prev => {
                const newMap = new Map(prev)
                selectedSchedules.forEach(scheduleId => {
                    newMap.set(scheduleId, configs)
                })
                return newMap
            })

            toast.showSuccess(`Notificações configuradas para ${selectedSchedules.size} escala(s)!`)
            setSelectedSchedules(new Set())
            setShowWhatsAppModal(false)

            // Recarregar para garantir consistência
            await reloadSchedules()
        } catch (error) {
            console.error('Erro ao salvar notificações:', error)
            toast.showError('Erro ao salvar configurações de notificação')
        } finally {
            setOptimizedSchedulesLoading(false)
        }
    }

    return {
        scheduledAreaId,
        grupoId,
        navigate,
        optimizedSchedules,
        optimizedSchedulesPage,
        setOptimizedSchedulesPage,
        optimizedSchedulesTotalPages,
        optimizedSchedulesLoading,
        filterStartDate,
        setFilterStartDate,
        filterEndDate,
        setFilterEndDate,
        groupByDate,
        setGroupByDate,
        expandedDates,
        setExpandedDates,
        selectedSchedules,
        setSelectedSchedules,
        showDeleteModal,
        setShowDeleteModal,
        showBulkDeleteModal,
        setShowBulkDeleteModal,
        scheduleToDelete,
        setScheduleToDelete,
        isDeleting,
        showWhatsAppModal,
        setShowWhatsAppModal,
        scheduleNotifications,
        handleSelectSchedule,
        handleSelectAll,
        confirmDeleteSchedule,
        confirmBulkDeleteSchedules,
        handleSaveWhatsAppConfig,
        reloadSchedules
    }
}
