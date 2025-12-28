interface ScheduleTableControlsProps {
    selectedCount: number
    groupByDate: boolean
    isDeleting: boolean
    onOpenWhatsApp: () => void
    onBulkDelete: () => void
    onToggleGroupByDate: () => void
}

export function ScheduleTableControls({
    selectedCount,
    groupByDate,
    isDeleting,
    onOpenWhatsApp,
    onBulkDelete,
    onToggleGroupByDate
}: ScheduleTableControlsProps) {
    return (
        <div className="table-group-controls">
            {selectedCount > 0 && (
                <>
                    <button
                        type="button"
                        className="btn-success btn-sm"
                        onClick={onOpenWhatsApp}
                    >
                        <i className="fa-brands fa-whatsapp"></i> Configurar Notificação ({selectedCount})
                    </button>
                    <button
                        type="button"
                        className="btn-danger btn-sm"
                        onClick={onBulkDelete}
                        disabled={isDeleting}
                    >
                        <i className="fa-solid fa-trash"></i> Remover ({selectedCount})
                    </button>
                </>
            )}

            <button
                type="button"
                className={`btn-secondary btn-sm ${groupByDate ? 'active' : ''}`}
                onClick={onToggleGroupByDate}
                title={groupByDate ? 'Desagrupar por data' : 'Agrupar por data'}
            >
                <i className={`fa-solid ${groupByDate ? 'fa-ungroup' : 'fa-layer-group'}`}></i>
                {groupByDate ? 'Desagrupar por Data' : 'Agrupar por Data'}
            </button>
        </div>
    )
}
