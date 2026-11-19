import { useEffect, useState, type ChangeEvent, type ReactNode, type SubmitEvent } from 'react'
import { bookTable, cancelReservation, errorsOf, fetchReservations } from './api'
import { DatePicker, today } from './DatePicker'
import { TableGrid } from './TableGrid'
import type { FieldErrors, Reservation } from './types'

const TABLES = Array.from({ length: 10 }, (_, i) => i + 1)

const Errors = ({ messages }: { messages?: string[] }) =>
  messages?.map((message) => (
    <small key={message} className="error">
      {message}
    </small>
  ))

const Field = ({ label, errors, children }: { label: string; errors?: string[]; children: ReactNode }) => (
  <label className="field">
    <span>{label}</span>
    {children}
    <Errors messages={errors} />
  </label>
)

export const App = () => {
  const [date, setDate] = useState(today)
  const [table, setTable] = useState<number | null>(null)
  const [form, setForm] = useState({ phone: '', firstName: '', lastName: '' })
  // ошибки сервера: у каждого поля свой список, ошибки без поля - под ключом "error"
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [success, setSuccess] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [reservations, setReservations] = useState<Reservation[] | null>(null)
  const [version, setVersion] = useState(0)
  const reload = () => setVersion((v) => v + 1)

  useEffect(() => {
    let ignore = false // ответ на устаревший запрос (дата уже сменилась) отбрасываем
    fetchReservations(date)
      .then((list) => {
        if (!ignore) setReservations(list)
      })
      .catch((e) => {
        if (!ignore) setFieldErrors(errorsOf(e))
      })
    return () => {
      ignore = true
    }
  }, [date, version])

  const isTaken = (t: number) => reservations?.some((r) => r.tableNumber === t) ?? false
  const selectedTaken = table !== null && isTaken(table)

  const changeDate = (value: string) => {
    setDate(value)
    setReservations(null)
  }

  // Общий сценарий для брони и отмены: action возвращает текст успеха.
  // Функция ничего не возвращает: цепочка заканчивается catch, поэтому «забытых» promise нет
  const run = (action: () => Promise<string>) => {
    setBusy(true)
    setFieldErrors({})
    setSuccess(null)
    action()
      .then((message) => {
        setSuccess(message)
        reload()
      })
      .finally(() => setBusy(false))
      .catch((e) => {
        const errors = errorsOf(e)
        setFieldErrors(errors)
        if (errors.tableNumber) reload() // со столом что-то не так (например, его заняли): обновляем схему
      })
  }

  const handleBook = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (table === null) {
      setFieldErrors({ tableNumber: ['Сначала выберите стол на схеме'] })
      return
    }
    run(async () => {
      const result = await bookTable({ tableNumber: table, date, ...form })
      setTable(null)
      return `Готово! Стол ${result.tableNumber} ждёт вас ${result.date}, ${result.firstName}`
    })
  }

  const handleCancel = () => {
    if (table === null || !window.confirm(`Отменить бронь стола ${table} на ${date}?`)) return
    run(async () => {
      await cancelReservation(table, date)
      return `Бронь стола ${table} на ${date} отменена`
    })
  }

  // поле определяется атрибутом name у input
  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  return (
    <main>
      <h1>Резервация/Отмена столов</h1>

      <form onSubmit={handleBook}>
        <div className="field">
          <span>Номер стола</span>
          <TableGrid tables={TABLES} selected={table} isTaken={isTaken} onSelect={setTable} />
          <ul className="legend">
            <li className="free">свободен</li>
            <li className="taken">занят</li>
            <li className="count">
              {reservations ? `свободно ${TABLES.length - reservations.length} из ${TABLES.length}` : 'загружаем…'}
            </li>
          </ul>
          {selectedTaken && (
            <small className="error">Стол {table} уже занят на эту дату. Выберите другой или отмените бронь.</small>
          )}
          <Errors messages={selectedTaken ? undefined : fieldErrors.tableNumber} />
        </div>

        <div className="row">
          <Field label="Имя" errors={fieldErrors.firstName}>
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder="Иван"
              maxLength={20}
              autoComplete="given-name"
              required
            />
          </Field>
          <Field label="Фамилия" errors={fieldErrors.lastName}>
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              placeholder="Петров"
              maxLength={20}
              autoComplete="family-name"
              required
            />
          </Field>
        </div>

        <div className="row">
          <Field label="Телефон для связи" errors={fieldErrors.phone}>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="20000000"
              inputMode="numeric"
              maxLength={8}
              autoComplete="tel"
              required
            />
          </Field>
          <div className="field">
            <span>Дата</span>
            <DatePicker value={date} min={today()} onChange={changeDate} />
            <Errors messages={fieldErrors.date} />
          </div>
        </div>

        <div className="actions">
          <button type="submit" disabled={busy || selectedTaken}>
            Забронировать
          </button>
          {/* отменять есть что только у занятого стола */}
          <button type="button" className="secondary" disabled={busy || !selectedTaken} onClick={handleCancel}>
            Отменить бронь
          </button>
        </div>
      </form>

      {fieldErrors.error?.map((message) => (
        <p key={message} className="notice error" role="alert">
          {message}
        </p>
      ))}
      {success && (
        <p className="notice ok" role="status">
          {success}
        </p>
      )}
    </main>
  )
}
