import axios from 'axios'
import type { MenuBySection } from './types'

export const fetchMenu = async () => (await axios.get<MenuBySection>('/api/v1/menu')).data
