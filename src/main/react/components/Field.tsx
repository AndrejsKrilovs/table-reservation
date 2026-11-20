import type { ReactNode } from 'react'

export const Errors = ({ messages }: { messages?: string[] }) =>
  messages?.map((message) => (
    <small key={message} className="error">
      {message}
    </small>
  ))

export const Field = ({ label, errors, children }: { label: string; errors?: string[]; children: ReactNode }) => (
  <label className="field">
    <span>{label}</span>
    {children}
    <Errors messages={errors} />
  </label>
)

/** Ошибки без привязки к полю (сервер недоступен, ошибка 500 и т.п.) - плашкой под формой. */
export const Alerts = ({ messages }: { messages?: string[] }) =>
  messages?.map((message) => (
    <p key={message} className="notice error" role="alert">
      {message}
    </p>
  ))
