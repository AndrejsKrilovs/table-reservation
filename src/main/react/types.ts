/** Бронь: тело POST /api/v1/reservations и элемент ответов. Длины совпадают с бэкендом. */
export interface Reservation {
  tableNumber: number
  date: string // yyyy-MM-dd
  phone: string
  firstName: string
  lastName: string
}

/** Ответ 400 при проверке данных: {"поле": ["сообщение", ...]}. */
export type FieldErrors = Record<string, string[]>

export type ReservationsByDate = Record<string, Reservation[]>