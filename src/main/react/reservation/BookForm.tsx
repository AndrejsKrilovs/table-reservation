import { useBookForm } from './hooks'
import { DatePicker } from '../components/DatePicker'
import { today } from '../components/hooks'
import { Alerts, Errors, Field } from '../components/Field'
import { TableGrid } from '../components/TableGrid'

const TABLES = Array.from({ length: 10 }, (_, i) => i + 1)

interface Props {
  onDone: (message: string) => void
  onBack: () => void
}

/** Шаг «Забронировать»: схема зала и форма с данными гостя. */
export const BookForm = ({ onDone, onBack }: Props) => {
  const { date, table, setTable, form, reservedTables, busy, errors, isTaken, changeDate, handleChange, handleSubmit } =
    useBookForm(onDone)

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

        <div className="row fields">
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
          <div className="actions">
            <button type="submit" disabled={busy}>
              Забронировать
            </button>
            <button type="button" className="secondary" disabled={busy} onClick={onBack}>
              Назад
            </button>
          </div>
        </div>
      </form>

      <Alerts messages={errors.error} />
    </>
  )
}
