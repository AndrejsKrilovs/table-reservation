import { useState, type SubmitEvent } from 'react'
import { cancelReservation } from './api'
import { DatePicker, today } from '../components/DatePicker'
import { Alerts, Errors, Field } from '../components/Field'
import { useAction } from '../useAction'

interface Props {
  onDone: (message: string) => void
  onBack: () => void
}

/** Шаг «Отменить бронирование»: телефон и дата. */
export const CancelForm = ({ onDone, onBack }: Props) => {
  const [phone, setPhone] = useState('')
  const [date, setDate] = useState(today)
  const { busy, errors, run } = useAction()

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!window.confirm(`Отменить бронь на ${date} для телефона ${phone}?`)) return
    run(async () => {
      await cancelReservation(phone, date)
      onDone(`Бронь на ${date} для телефона ${phone} отменена`)
    })
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="row">
          <Field label="Телефон" errors={errors.phone}>
            <input
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="20000000"
              inputMode="numeric"
              maxLength={8}
              autoComplete="tel"
            />
          </Field>
          <div className="field">
            <span>Дата брони</span>
            <DatePicker value={date} min={today()} onChange={setDate} />
            <Errors messages={errors.date} />
          </div>
        </div>

        <div className="actions">
          <button type="submit" disabled={busy}>
            Отменить бронь
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
