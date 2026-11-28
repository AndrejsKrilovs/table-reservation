import { Alerts, Field } from '../components/Field'
import { useLogin } from './hooks'
import './LoginModal.scss'

/** Окно входа администратора: показывается поверх страницы, пока нет сессии. */
export const LoginModal = ({ onSuccess }: { onSuccess: () => void }) => {
  const { username, setUsername, password, setPassword, busy, errors, handleSubmit } = useLogin(onSuccess)

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
