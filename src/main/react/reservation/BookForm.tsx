import { useEffect, useState, type ChangeEvent, type SubmitEvent } from 'react'
import { bookTable, fetchReservedTables } from './api'
import { DatePicker, today } from '../components/DatePicker'
import { Alerts, Errors, Field } from '../components/Field'
import { TableGrid } from '../components/TableGrid'
import {errorsOf, useAction} from '../useAction'

const TABLES = Array.from({ length: 10 }, (_, i) => i + 1)

interface Props {
  onDone: (message: string) => void
  onBack: () => void
}

/** Шаг «Забронировать»: схема зала и форма с данными гостя. */
export const BookForm = ({ onDone, onBack }: Props) => {
  const [date, setDate] = useState(today)
  const [table, setTable] = useState<number | null>(null)
  const [form, setForm] = useState({ phone: '', firstName: '', lastName: '' })
  const [reservedTables, setReservedTables] = useState<number[] | null>(null)
  const [version, setVersion] = useState(0)
  const reload = () => setVersion((v) => v + 1)

  // со столом что-то не так (например, его только что заняли): обновляем схему
  const { busy, errors, setErrors, run } = useAction((e) => {
    if (e.tableNumber) reload()
  })

  useEffect(() => {
    let ignore = false // ответ на устаревший запрос (дата уже сменилась) отбрасываем
    fetchReservedTables(date)
      .then((tables) => {
        if (ignore) return
        setReservedTables(tables)
        setTable((t) => (t !== null && tables.includes(t) ? null : t))
      })
      .catch((e) => {
        if (!ignore) setErrors(errorsOf(e))
      })
    return () => {
      ignore = true
    }
  }, [date, version, setErrors])

  const isTaken = (t: number) => reservedTables?.includes(t) ?? false

  const changeDate = (value: string) => {
    setDate(value)
    setReservedTables(null)
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (table === null) {
      setErrors({ tableNumber: ['Сначала выберите стол на схеме'] })
      return
    }
    run(async () => {
      const result = await bookTable({ tableNumber: table, date, ...form })
      onDone(`Готово! Стол ${result.tableNumber} ждёт вас ${result.date}, ${result.firstName}`)
    })
  }

  // поле определяется атрибутом name у input
  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <span>Номер стола</span>
          <TableGrid tables={TABLES} selected={table} isTaken={isTaken} onSelect={setTable} />
          <ul className="legend">
            <li className="free">свободен</li>
            <li className="taken">занят</li>
            <li className="count">
              {reservedTables ? `свободно ${TABLES.length - reservedTables.length} из ${TABLES.length}` : 'загружаем…'}
            </li>
          </ul>
          <Errors messages={errors.tableNumber} />
        </div>

        <div className="row">
          <Field label="Имя" errors={errors.firstName}>
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder="Иван"
              maxLength={20}
              autoComplete="given-name"
            />
          </Field>
          <Field label="Фамилия" errors={errors.lastName}>
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              placeholder="Петров"
              maxLength={20}
              autoComplete="family-name"
            />
          </Field>
        </div>

        <div className="row">
          <Field label="Телефон для связи" errors={errors.phone}>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="20000000"
              inputMode="numeric"
              maxLength={8}
              autoComplete="tel"
            />
          </Field>
          <div className="field">
            <span>Дата</span>
            <DatePicker value={date} min={today()} onChange={changeDate} />
            <Errors messages={errors.date} />
          </div>
        </div>

        <div className="actions">
          <button type="submit" disabled={busy}>
            Забронировать
          </button>
          <button type="button" className="secondary" disabled={busy} onClick={onBack}>
            Назад
          </button>
        </div>
      </form>

      <Alerts messages={errors.error} />
    </>
  )
}
