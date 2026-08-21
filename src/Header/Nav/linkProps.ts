import type { ComponentProps } from 'react'

import { CMSLink } from '@/components/Link'
import type { MenuItemLink } from '@/utilities/getMenuData'

/**
 * Bridge between the local `MenuItemLink` shape (see `utilities/getMenu.ts`)
 * and `CMSLink`'s props.
 *
 * `payload-types.ts` does not know about `menu-items` yet (and `MenuTreeNode`
 * is intentionally a local type), so `MenuItemLink` is not structurally
 * assignable to `CMSLink`'s props. Casting through `unknown` here keeps all the
 * call sites clean and stays valid once `pnpm generate:types` re-runs.
 */
export const toCmsLinkProps = (
  link: MenuItemLink | null | undefined,
): ComponentProps<typeof CMSLink> | undefined => {
  if (!link) return undefined

  // Payload can materialize a default `{ type: 'reference' }` group even when no
  // link was supplied (e.g. columnTitle items). Treat a target-less link as "no
  // link" so call sites render the non-clickable fallback instead of a broken href.
  const hasTarget = link.type === 'custom' ? Boolean(link.url) : Boolean(link.reference)

  if (!hasTarget) return undefined

  return link as unknown as ComponentProps<typeof CMSLink>
}
