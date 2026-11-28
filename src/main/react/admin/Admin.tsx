import { DatePicker } from '../components/DatePicker'
import { Alerts } from '../components/Field'
import { useAdmin } from './hooks'
import { LoginModal } from './LoginModal'
import { ReservationTable } from './ReservationTable'
import './Admin.scss'

export const Admin = () => {
  const { loggedIn, start, end, setEnd, changeStart, reservations, busy, errors, reload, handleLogout, handleCancel } =
    useAdmin()

  if (loggedIn === null) return null
  if (!loggedIn) return <LoginModal onSuccess={reload} />

  return (
    <main>
      <div className="admin_header">
        <Alerts messages={errors.error} />
        <h1>Страница для админа</h1>
        <div>
          <button type="button" className="secondary" disabled={busy} onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </div>

      <form className="admin_data" onSubmit={(e) => e.preventDefault()}>
        <div className="field">
          <span>Выберите период, за который показать резервации</span>
          <div className="row">
            <DatePicker value={start} min={start} onChange={changeStart} />
            <DatePicker value={end} min={start} onChange={setEnd} />
          </div>
        </div>
        {reservations && <ReservationTable reservations={reservations} busy={busy} onCancel={handleCancel} />}
      </form>
    </main>
  )
}
