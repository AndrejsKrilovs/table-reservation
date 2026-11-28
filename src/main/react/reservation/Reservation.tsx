import { BookForm } from './BookForm'
import { CancelForm } from './CancelForm'
import { useReservationSteps } from './hooks'

export const Reservation = () => {
  const { step, notice, open, done } = useReservationSteps()

  return (
    <main className="reservation">
      {step === 'menu' && (
        <div className="panel actions">
          <button type="button" className="primary" onClick={() => open('book')}>
            Забронировать стол
          </button>
          <button type="button" className="secondary" onClick={() => open('cancel')}>
            Отменить бронирование
          </button>
        </div>
      )}

      {step === 'book' && <BookForm onDone={done} onBack={() => open('menu')} />}
      {step === 'cancel' && <CancelForm onDone={done} onBack={() => open('menu')} />}

      {notice && (
        <p className="notice ok" role="status">
          {notice}
        </p>
      )}
    </main>
  )
}
