import { useEffect, useState } from 'react'
import { fetchMenu } from './api'
import type { MenuBySection, MenuSectionId } from './types'
import './Menu.scss'

const titles: Record<MenuSectionId, string> = {
  COCKTAILS: 'Коктейли',
  DRINKS: 'Напитки',
  BEER_AND_WINE: 'Пиво и вино',
  NON_ALCOHOLIC: 'Безалкогольные',
}

const money = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'EUR' })

// объём приходит в литрах: меньше литра показываем в миллилитрах
const volumeOf = (litres: number) => (litres < 1 ? `${Math.round(litres * 1000)} мл` : `${litres} л`)

// число колонок по ширине экрана (в тех же точках, что и в Menu.scss)
const columnsFor = (width: number) => (width >= 900 ? 3 : width >= 481 ? 2 : 1)

const useColumnCount = () => {
  const [count, setCount] = useState(() => columnsFor(window.innerWidth))
  useEffect(() => {
    const onResize = () => setCount(columnsFor(window.innerWidth))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return count
}

/** Раскладывает разделы по колонкам: каждый следующий кладётся в самую короткую колонку. */
const distribute = (ids: MenuSectionId[], menu: MenuBySection, count: number) => {
  const columns: MenuSectionId[][] = Array.from({ length: count }, () => [])
  const heights = new Array<number>(count).fill(0)
  ids.forEach((id) => {
    const shortest = heights.indexOf(Math.min(...heights))
    columns[shortest].push(id)
    // высота ~ число позиций (+ строка состава) и заголовок
    heights[shortest] += 1.5 + menu[id]!.reduce((sum, item) => sum + (item.description ? 2 : 1), 0)
  })
  return columns.filter((column) => column.length)
}

/** Меню по разделам: название, состав, объём и цена. Грузится с сервера при открытии; без него страница остаётся рабочей. */
export const Menu = () => {
  const [menu, setMenu] = useState<MenuBySection>({})
  const count = useColumnCount()

  useEffect(() => {
    let ignore = false
    fetchMenu()
      .then((result) => !ignore && setMenu(result))
      .catch(() => {})
    return () => {
      ignore = true
    }
  }, [])

  const ids = (Object.keys(titles) as MenuSectionId[]).filter((id) => menu[id]?.length)

  return (
    <div className="menu">
      {distribute(ids, menu, count).map((column) => (
        <div key={column[0]} className="menu-column">
          {column.map((id) => (
            <section key={id} className="panel">
              <h2>{titles[id]}</h2>
              <ul>
                {menu[id]!.map((item) => (
                  <li key={item.name}>
                    <div>
                      <span className="menu-name">{item.name}</span>
                      {item.description && <span className="menu-desc">{item.description}</span>}
                    </div>
                    <span className="menu-volume">{volumeOf(item.volume)}</span>
                    <span className="menu-price">{money.format(item.price)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ))}
    </div>
  )
}
