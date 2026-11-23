import { useState, type SubmitEvent } from 'react'
import { Alerts, Field } from '../components/Field'
import { useAction } from '../useAction'
import { login } from './api'
import './LoginModal.scss'

/** Окно входа администратора: показывается поверх страницы, пока нет сессии. */
export const LoginModal = ({ onSuccess }: { onSuccess: () => void }) => {
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

  return (
    <div className="modal-backdrop">
      <form className="modal" role="dialog" aria-modal="true" aria-label="Вход" onSubmit={handleSubmit}>
        <h1>Вход администратора</h1>
        <Field label="Логин" errors={errors.username}>
          <input name="username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus />
        </Field>
        <Field label="Пароль" errors={errors.password}>
          <input name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </Field>
        <div className="actions">
          <button type="submit" disabled={busy}>
            Войти
          </button>
        </div>
        <Alerts messages={errors.error} />
      </form>
    </div>
  )
}
