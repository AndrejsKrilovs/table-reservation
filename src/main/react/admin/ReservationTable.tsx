import type { Reservation, ReservationsByDate } from '../types'
import './ReservationTable.scss'

const title = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

/** Брони по дням: для каждой даты свой раскрывающийся блок с таблицей «стол - гость - телефон». */
interface Props {
  reservations: ReservationsByDate
  busy: boolean
  onCancel: (reservation: Reservation) => void
}

export const ReservationTable = ({ reservations, busy, onCancel }: Props) => {
  const days = Object.entries(reservations)
  if (days.length === 0) return <p className="notice">За выбранный период броней нет</p>

  return (
    <div className="booking-days">
      {days.map(([date, items], index) => (
        <details key={date} className="booking-day" name="booking-day" open={index === 0}>
          <summary>{title(date)}</summary>
          <table className="booking-table">
            <thead>
              <tr>
                <th>Стол</th>
                <th>Гость</th>
                <th colSpan={2}>Телефон</th>
              </tr>
            </thead>
            <tbody>
              {[...items]
                .sort((a, b) => a.tableNumber - b.tableNumber)
                .map((r) => (
                  <tr key={r.tableNumber}>
                    <td>
                      <span className="table-no">{r.tableNumber}</span>
                    </td>
                    <td>
                      {r.firstName} {r.lastName}
                    </td>
                    <td>
                      <a href={`https://wa.me/371${r.phone}`}>{r.phone}</a>
                    </td>
                    <td>
                      <button type="button" className="cancel-btn" disabled={busy} onClick={() => onCancel(r)}>
                        Отменить
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </details>
      ))}
    </div>
  )
}
