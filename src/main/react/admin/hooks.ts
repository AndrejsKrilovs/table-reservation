import { isAxiosError } from 'axios'
import { useEffect, useState, type SubmitEvent } from 'react'
import { today } from '../components/hooks'
import type { Reservation, ReservationsByDate } from '../types'
import { errorsOf, useAction } from '../useAction'
import { cancelReservation, fetchReservations, login, logout } from './api'

/** Страница админа: вход, период, список броней, отмена и выход. */
export const useAdmin = () => {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [start, setStart] = useState(today)
  const [end, setEnd] = useState(today)
  const [reservations, setReservations] = useState<ReservationsByDate | null>(null)
  const [version, setVersion] = useState(0) // растёт после входа или отмены: период тот же, но данные нужно загрузить заново
  const { busy, errors, setErrors, run } = useAction()
  const reload = () => setVersion((v) => v + 1)

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

  const handleLogout = () => {
    run(async () => {
      await logout()
      setReservations(null)
      setLoggedIn(false) // сессии больше нет: снова показываем окно входа
    })
  }

  const handleCancel = (r: Reservation) => {
    if (!window.confirm(`Отменить бронь: стол ${r.tableNumber}, ${r.firstName} ${r.lastName}?`)) return
    run(async () => {
      await cancelReservation(r.phone, r.date)
      reload()
    })
  }

  return { loggedIn, start, end, setEnd, changeStart, reservations, busy, errors, reload, handleLogout, handleCancel }
}

/** Окно входа: логин, пароль и отправка. */
export const useLogin = (onSuccess: () => void) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { busy, errors, run } = useAction()

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    run(async () => {
      await login(username, password)
      onSuccess()
    })
  }

  return { username, setUsername, password, setPassword, busy, errors, handleSubmit }
}
