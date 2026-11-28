import { useState } from 'react'
import { BookForm } from './BookForm'
import { CancelForm } from './CancelForm'

type Step = 'menu' | 'book' | 'cancel'

export const Reservation = () => {
  const [step, setStep] = useState<Step>('menu')
  const [notice, setNotice] = useState<string | null>(null)

  const open = (next: Step) => {
    setNotice(null)
    setStep(next)
  }
  // после успешной брони или отмены возвращаемся в меню и показываем результат
  const done = (message: string) => {
    setNotice(message)
    setStep('menu')
  }

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
