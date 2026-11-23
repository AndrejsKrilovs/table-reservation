import axios from 'axios'
import type { Reservation } from '../types'

const http = axios.create({ baseURL: '/api/v1/reservations' })

export const fetchReservedTables = async (date: string) => (await http.get<number[]>('', { params: { date } })).data

export const bookTable = async (reservation: Reservation) => (await http.post<Reservation>('', reservation)).data

export const cancelReservation = (phone: string, date: string) => http.delete(`/${phone}/${date}`)
