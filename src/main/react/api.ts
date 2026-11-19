import axios, { isAxiosError } from 'axios'
import type { FieldErrors, Reservation } from './types'

const http = axios.create({ baseURL: '/api/v1/reservations' })

export const fetchReservations = async (date: string) => (await http.get<Reservation[]>('', { params: { date } })).data

export const bookTable = async (reservation: Reservation) => (await http.post<Reservation>('', reservation)).data

export const cancelReservation = (tableNumber: number, date: string) => http.delete(`/${tableNumber}/${date}`)

/**
 * Любую ошибку приводит к виду {"поле": ["сообщение", ...]}: у каждого поля список ошибок сервера.
 * Ошибки без поля (сервер отвечает {"error": "текст"}) лежат под ключом "error".
 */
export const errorsOf = (e: unknown): FieldErrors => {
  if (!isAxiosError<Record<string, string | string[]>>(e) || !e.response) {
    return { error: ['Не получается связаться с сервером. Попробуйте ещё раз чуть позже'] }
  }
  const { status, data } = e.response
  if (status === 409) return { tableNumber: ['Этот стол уже занят на выбранную дату'] }

  const fields = Object.entries(typeof data === 'object' && data !== null ? data : {})
  return fields.length > 0
    ? Object.fromEntries(fields.map(([field, messages]) => [field, [messages].flat()]))
    : { error: [`Ошибка сервера (${status})`] }
}
