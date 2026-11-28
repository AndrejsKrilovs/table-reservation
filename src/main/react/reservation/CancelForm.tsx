import { useCancelForm } from './hooks'
import { DatePicker } from '../components/DatePicker'
import { today } from '../components/hooks'
import { Alerts, Errors, Field } from '../components/Field'

interface Props {
  onDone: (message: string) => void
  onBack: () => void
}

/** Шаг «Отменить бронирование»: телефон и дата. */
export const CancelForm = ({ onDone, onBack }: Props) => {
  const { phone, setPhone, date, setDate, busy, errors, handleSubmit } = useCancelForm(onDone)

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
