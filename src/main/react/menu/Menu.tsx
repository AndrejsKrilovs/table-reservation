import { useMenu } from './hooks'
import type { MenuSectionId } from './types'
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

/** Меню по разделам: название, состав, объём и цена. Колонки раскладывает CSS (Menu.scss). */
export const Menu = () => {
  const menu = useMenu()

  return (
    <div className="menu">
      {(Object.keys(titles) as MenuSectionId[]).map((id) => {
        const items = menu[id]
        if (!items?.length) return null

        return (
          <section key={id} className="panel">
            <h2>{titles[id]}</h2>
            <ul>
              {items.map((item) => (
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
        )
      })}
    </div>
  )
}
