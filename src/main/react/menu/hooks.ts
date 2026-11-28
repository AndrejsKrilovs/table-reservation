import { useEffect, useState } from 'react'
import { fetchMenu } from './api'
import type { MenuBySection } from './types'

/** Меню с сервера; пока оно не пришло (или запрос не удался) список пустой, страница остаётся рабочей. */
export const useMenu = () => {
  const [menu, setMenu] = useState<MenuBySection>({})

  useEffect(() => {
    let ignore = false
    fetchMenu()
      .then((result) => !ignore && setMenu(result))
      .catch(() => {})
    return () => {
      ignore = true
    }
  }, [])

  return menu
}
