import { useState } from 'react'
import { isAxiosError } from 'axios'
import type { FieldErrors } from './types'

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

/**
 * Общий сценарий отправки формы: busy на время запроса и ошибки сервера по полям
 * (ошибки без поля лежат под ключом "error"). Функция run ничего не возвращает:
 * цепочка заканчивается catch, поэтому «забытых» promise нет.
 */
export const useAction = (onError?: (errors: FieldErrors) => void) => {
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})

  const run = (action: () => Promise<void>) => {
    setBusy(true)
    setErrors({})
    action()
      .finally(() => setBusy(false))
      .catch((e) => {
        const next = errorsOf(e)
        setErrors(next)
        onError?.(next)
      })
  }

  return { busy, errors, setErrors, run }
}
