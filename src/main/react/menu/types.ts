/** Раздел меню: значения enum MenuSection на бэкенде. */
export type MenuSectionId = 'COCKTAILS' | 'DRINKS' | 'BEER_AND_WINE' | 'NON_ALCOHOLIC'

/** Элемент ответа GET /api/v1/menu. Объём в литрах, цена в евро. */
export interface MenuItem {
  section: MenuSectionId
  name: string
  price: number
  volume: number
  description: string | null
}

export type MenuBySection = Partial<Record<MenuSectionId, MenuItem[]>>
