interface Props {
  tables: number[]
  selected: number | null
  isTaken: (table: number) => boolean
  onSelect: (table: number) => void
}

/** Схема зала: занятость приходит с сервера (GET /api/v1/reservations?date=...). */
export const TableGrid = ({ tables, selected, isTaken, onSelect }: Props) => (
  <div className="grid" role="radiogroup" aria-label="Выбор стола">
    {tables.map((table) => (
      <button
        key={table}
        type="button"
        role="radio"
        aria-checked={table === selected}
        className={`table${isTaken(table) ? ' taken' : ''}${table === selected ? ' selected' : ''}`}
        onClick={() => onSelect(table)}
      >
        <span className="number">{table}</span>
        <span className="status">{isTaken(table) && 'занят'}</span>
      </button>
    ))}
  </div>
)
