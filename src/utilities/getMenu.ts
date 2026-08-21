import { unstable_cache } from 'next/cache'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { buildMenuTree, type MenuItemRecord, type MenuTreeNode } from './getMenuData'

export type { MenuItemLink, MenuItemMedia, MenuItemRecord, MenuItemType } from './getMenuData'
export type { HeaderNavRow, MenuHeaderData, MenuTreeNode } from './getMenuData'
export { resolveTopLevel, buildMenuTree } from './getMenuData'

export const getCachedMenu = (locale?: string) =>
  unstable_cache(
    async (): Promise<MenuTreeNode[]> => {
      const payload = await getPayload({ config: configPromise })

      const { docs } = await payload.find({
        collection: 'menu-items' as never,
        depth: 1,
        limit: 500,
        sort: 'order',
        locale: locale as never,
      })

      return buildMenuTree(docs as unknown as MenuItemRecord[])
    },
    ['menu_items', locale],
    {
      tags: ['menu_items'],
    },
  )
