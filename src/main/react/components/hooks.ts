import { useEffect, useRef, useState } from 'react'

const pad = (n: number) => String(n).padStart(2, '0')
export const iso = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`

// сегодня в формате yyyy-MM-dd; шведская локаль даёт именно его (lv-LV вернул бы "18.11.2026.")
export const today = () => new Date().toLocaleDateString('sv-SE')

/** Календарь: открыт ли он, показываемый месяц и закрытие по клику снаружи и Escape. */
export const useDatePicker = (value: string, onChange: (value: string) => void) => {
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
  const select = (day: string) => {
    onChange(day)
    setOpen(false)
  }

  return { open, root, year, month, daysInMonth, offset, monthTitle, toggle, shift, select }
}
