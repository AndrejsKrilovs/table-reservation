import axios from 'axios'
import type { ReservationsByDate } from '../types'

const http = axios.create({ baseURL: '/api/v1' })

export const login = (username: string, password: string) => http.post('/login', new URLSearchParams({ username, password }))

export const logout = () => http.post('/logout')

export const fetchReservations = async (start: string, end: string) =>
  (await http.get<ReservationsByDate>('/admin/reservations', { params: { start, end } })).data
