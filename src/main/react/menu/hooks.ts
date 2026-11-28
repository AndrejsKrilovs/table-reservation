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

// число колонок по ширине экрана (в тех же точках, что и в Menu.scss)
const columnsFor = (width: number) => (width >= 900 ? 3 : width >= 481 ? 2 : 1)

export const useColumnCount = () => {
  const [count, setCount] = useState(() => columnsFor(window.innerWidth))

  useEffect(() => {
    const onResize = () => setCount(columnsFor(window.innerWidth))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return count
}
