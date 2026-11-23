import { useEffect, useRef, useState } from 'react'
import './DatePicker.scss'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`

// сегодня в формате yyyy-MM-dd; шведская локаль даёт именно его (lv-LV вернул бы "18.11.2026.")
export const today = () => new Date().toLocaleDateString('sv-SE')

interface Props {
  value: string // yyyy-MM-dd
  min: string // более ранние дни недоступны
  onChange: (value: string) => void
}

/** Выбор даты: выпадающий календарь той же ширины, что и поле (у нативного input[type=date] её не задать). */
export const DatePicker = ({ value, min, onChange }: Props) => {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => new Date(`${value}T00:00:00`)) // любой день показываемого месяца
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const closeOnOutsideClick = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const year = view.getFullYear()
  const month = view.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = (new Date(year, month, 1).getDay() + 6) % 7 // неделя начинается с понедельника
  const monthTitle = `${view.toLocaleDateString('ru-RU', { month: 'long' })} ${year}`

  const toggle = () => {
    setView(new Date(`${value}T00:00:00`))
    setOpen(!open)
  }
  const shift = (delta: number) => setView(new Date(year, month + delta, 1))

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
                  onClick={() => {
                    onChange(day)
                    setOpen(false)
                  }}
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
