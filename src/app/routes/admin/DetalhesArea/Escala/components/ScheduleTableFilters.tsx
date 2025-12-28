
interface ScheduleTableFiltersProps {
    filterStartDate: string
    filterEndDate: string
    setFilterStartDate: (date: string) => void
    setFilterEndDate: (date: string) => void
    onClear: () => void
}

export function ScheduleTableFilters({
    filterStartDate,
    filterEndDate,
    setFilterStartDate,
    setFilterEndDate,
    onClear
}: ScheduleTableFiltersProps) {
    return (
        <div className="table-filters">
            <div className="filter-group">
                <label htmlFor="filter-start-date" className="filter-label">
                    <i className="fa-solid fa-calendar-alt"></i> Data Início
                </label>
                <input
                    type="date"
                    id="filter-start-date"
                    className="filter-input"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                />
            </div>
            <div className="filter-group">
                <label htmlFor="filter-end-date" className="filter-label">
                    <i className="fa-solid fa-calendar-check"></i> Data Fim
                </label>
                <input
                    type="date"
                    id="filter-end-date"
                    className="filter-input"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                />
            </div>
            {(filterStartDate || filterEndDate) && (
                <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={onClear}
                    title="Limpar filtros"
                >
                    <i className="fa-solid fa-times"></i> Limpar Filtros
                </button>
            )}
        </div>
    )
}
