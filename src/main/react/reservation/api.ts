import axios, { isAxiosError } from 'axios'
import type { FieldErrors, Reservation } from './types'

const http = axios.create({ baseURL: '/api/v1/reservations' })

export const fetchReservedTables = async (date: string) => (await http.get<number[]>('', { params: { date } })).data

export const bookTable = async (reservation: Reservation) => (await http.post<Reservation>('', reservation)).data

export const cancelReservation = (phone: string, date: string) => http.delete(`/${phone}/${date}`)

/**
 * Любую ошибку приводит к виду {"поле": ["сообщение", ...]}: у каждого поля список ошибок сервера.
 * Ошибки без поля (сервер отвечает {"error": "текст"}) лежат под ключом "error".
 */
export const errorsOf = (e: unknown): FieldErrors => {
  if (!isAxiosError<Record<string, string | string[]>>(e) || !e.response) {
    return { error: ['Не получается связаться с сервером. Попробуйте ещё раз чуть позже'] }
  }
  const { status, data } = e.response
  const fields = Object.entries(typeof data === 'object' && data !== null ? data : {})
  if (fields.length === 0) return { error: [`Ошибка сервера (${status})`] }

  // тексты ошибок приходят с сервера; 409 и 404 показываем у поля, к которому они относятся
  const errors: FieldErrors = Object.fromEntries(fields.map(([field, messages]) => [field, [messages].flat()]))
  if (errors.error && status === 409) return { tableNumber: errors.error }
  if (errors.error && status === 404) return { phone: errors.error }
  return errors
}
