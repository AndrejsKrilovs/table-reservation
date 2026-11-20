import { useState } from 'react'
import { errorsOf } from './reservation/api'
import type { FieldErrors } from './reservation/types'

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
