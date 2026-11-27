import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { DatePicker, today } from '../components/DatePicker'
import { Alerts } from '../components/Field'
import type { Reservation, ReservationsByDate } from '../types'
import { errorsOf, useAction } from '../useAction'
import { cancelReservation, fetchReservations, logout } from './api'
import { LoginModal } from './LoginModal'
import { ReservationTable } from './ReservationTable'
import './Admin.scss'

export const Admin = () => {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [start, setStart] = useState(today)
  const [end, setEnd] = useState(today)
  const [reservations, setReservations] = useState<ReservationsByDate | null>(null)
  const [version, setVersion] = useState(0) // растёт после входа: период тот же, но данные нужно загрузить заново
  const { busy, errors, setErrors, run } = useAction()

  // Один запрос и для проверки сессии, и для данных: 401 означает, что администратор не вошёл.
  // Срабатывает при открытии страницы, при любой смене периода (в том числе когда правая дата подтянулась за левой)
  // и после входа.
  useEffect(() => {
    let ignore = false // ответ на устаревший запрос (период уже сменился) отбрасываем
    fetchReservations(start, end)
      .then((result) => {
        if (ignore) return
        setErrors({})
        setReservations(result)
        setLoggedIn(true)
      })
      .catch((e) => {
        if (ignore) return
        if (isAxiosError(e) && e.response?.status === 401) {
          setLoggedIn(false)
        } else {
          setErrors(errorsOf(e))
        }
      })
    return () => {
      ignore = true
    }
  }, [start, end, version, setErrors])

  // сначала выбирается дата слева; если она оказалась позже даты справа, правую подтягиваем следом
  const changeStart = (value: string) => {
    setStart(value)
    if (end < value) {
      setEnd(value)
    }
  }

  const onClickEvent = () => {
    run(async () => {
      await logout()
      setReservations(null)
      setLoggedIn(false) // сессии больше нет: снова показываем окно входа
    })
  }

  const onCancel = (r: Reservation) => {
    if (!window.confirm(`Отменить бронь: стол ${r.tableNumber}, ${r.firstName} ${r.lastName}?`)) return
    run(async () => {
      await cancelReservation(r.phone, r.date)
      setVersion((v) => v + 1) // перезагружаем список
    })
  }

  if (loggedIn === null) return null
  if (!loggedIn) return <LoginModal onSuccess={() => setVersion((v) => v + 1)} />

  return (
    <main>
      <div className="admin_header">
        <Alerts messages={errors.error} />
        <h1>Страница для админа</h1>
        <div>
          <button type="button" className="secondary" disabled={busy} onClick={onClickEvent}>
            Выйти
          </button>
        </div>
      </div>

      <form className="admin_data" onSubmit={(e) => e.preventDefault()}>
        <div className="field">
          <span>Выберите период, за который показать резервации</span>
          <div className="row">
            <DatePicker value={start} min={'2026-11-01'} onChange={changeStart} />
            <DatePicker value={end} min={start} onChange={setEnd} />
          </div>
        </div>
        {reservations && <ReservationTable reservations={reservations} busy={busy} onCancel={onCancel} />}
      </form>
    </main>
  )
}
