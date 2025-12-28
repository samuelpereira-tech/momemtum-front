interface SchedulePaginationProps {
    currentPage: number
    totalPages: number
    loading: boolean
    onPageChange: (page: number) => void
}

export function SchedulePagination({
    currentPage,
    totalPages,
    loading,
    onPageChange
}: SchedulePaginationProps) {
    if (totalPages <= 1) return null

    return (
        <div className="pagination">
            <button
                type="button"
                className="btn-pagination"
                onClick={() => {
                    const newPage = currentPage - 1
                    if (newPage >= 1) {
                        onPageChange(newPage)
                    }
                }}
                disabled={currentPage === 1 || loading}
            >
                <i className="fa-solid fa-chevron-left"></i> Anterior
            </button>
            <span className="pagination-info">
                Página {currentPage} de {totalPages}
            </span>
            <button
                type="button"
                className="btn-pagination"
                onClick={() => {
                    const newPage = currentPage + 1
                    if (newPage <= totalPages) {
                        onPageChange(newPage)
                    }
                }}
                disabled={currentPage === totalPages || loading}
            >
                Próxima <i className="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    )
}
