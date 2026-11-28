import axios from 'axios'
import { useEffect, useState } from 'react'
import type { MenuBySection } from './types'

/** Меню с сервера; пока оно не пришло (или запрос не удался) список пустой, страница остаётся рабочей. */
export const useMenu = () => {
  const [menu, setMenu] = useState<MenuBySection>({})

  useEffect(() => {
    let ignore = false
    axios
      .get<MenuBySection>('/api/v1/menu')
      .then((response) => response.data)
      .then((result) => !ignore && setMenu(result))
      .catch(() => {})
    return () => {
      ignore = true
    }
  }, [])

  return menu
}
