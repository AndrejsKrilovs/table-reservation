import { iso, today, useDatePicker } from './hooks'
import './DatePicker.scss'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

interface Props {
  value: string // yyyy-MM-dd
  min: string // более ранние дни недоступны
  onChange: (value: string) => void
}

/** Выбор даты: выпадающий календарь той же ширины, что и поле (у нативного input[type=date] её не задать). */
export const DatePicker = ({ value, min, onChange }: Props) => {
  const { open, root, year, month, daysInMonth, offset, monthTitle, toggle, shift, select } = useDatePicker(value, onChange)

  return (
    <div className="datepicker" ref={root}>
      <button type="button" className="date-input" aria-haspopup="dialog" aria-expanded={open} onClick={toggle}>
        {value}
        <span aria-hidden>▾</span>
      </button>

      {open && (
        <div className="calendar" role="dialog" aria-label="Выбор даты">
          <div className="calendar-head">
            <button type="button" aria-label="Предыдущий месяц" disabled={iso(year, month, 1) <= min} onClick={() => shift(-1)}>
              ‹
            </button>
            <span>{monthTitle}</span>
            <button type="button" aria-label="Следующий месяц" onClick={() => shift(1)}>
              ›
            </button>
          </div>

          <div className="days">
            {WEEKDAYS.map((weekday) => (
              <span key={weekday} className="weekday">
                {weekday}
              </span>
            ))}
            {Array.from({ length: offset }, (_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = iso(year, month, i + 1)
              return (
                <button
                  key={day}
                  type="button"
                  className={`day${day === value ? ' selected' : ''}${day === today() ? ' today' : ''}`}
                  disabled={day < min}
                  onClick={() => select(day)}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
