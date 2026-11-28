import { useEffect, useState, type ChangeEvent, type SubmitEvent } from 'react'
import { today } from '../components/hooks'
import { errorsOf, useAction } from '../useAction'
import { bookTable, cancelReservation, fetchReservedTables } from './api'

export type Step = 'menu' | 'book' | 'cancel'

/** Какой шаг показан и результат последнего действия. */
export const useReservationSteps = () => {
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

  return { step, notice, open, done }
}

/** Форма брони: схема зала на выбранную дату, выбранный стол и данные гостя. */
export const useBookForm = (onDone: (message: string) => void) => {
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

  // поле определяется атрибутом name у input
  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

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

  return { date, table, setTable, form, reservedTables, busy, errors, isTaken, changeDate, handleChange, handleSubmit }
}

/** Форма отмены: телефон и дата брони. */
export const useCancelForm = (onDone: (message: string) => void) => {
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

  return { phone, setPhone, date, setDate, busy, errors, handleSubmit }
}
