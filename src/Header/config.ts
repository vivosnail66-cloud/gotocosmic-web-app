import type { GlobalConfig } from 'payload'

import { revalidateHeader } from './hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
        description:
          'Top-level items shown in the nav, in order. The full menu structure lives in the menu-items collection.',
      },
      fields: [
        {
          name: 'item',
          type: 'relationship',
          relationTo: 'menu-items',
          required: true,
        },
      ],
      maxRows: 8,
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
