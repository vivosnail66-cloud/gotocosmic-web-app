'use client'
import { Header } from '@/payload-types'
import { RowLabelProps, useRowLabel } from '@payloadcms/ui'

/**
 * Row label for the header's navItems array. Each row is now a relationship to
 * a `menu-items` doc, so we show that item's label. `payload-types.ts` still
 * describes the old `link` shape until `pnpm generate:types` re-runs — the
 * `item` object is accessed defensively via a local cast (object or id).
 */
export const RowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<NonNullable<Header['navItems']>[number]>()

  // `data?.data` is typed as the stale `{ link }` row until generate:types
  const row = data?.data as unknown as
    | { item?: string | number | { label?: string | null } | null }
    | undefined

  const rawItem = row?.item

  const label =
    rawItem && typeof rawItem === 'object' && rawItem.label
      ? rawItem.label
      : typeof rawItem === 'string' || typeof rawItem === 'number'
        ? `Menu item ${rawItem}`
        : null

  const text = label
    ? `Nav item ${data.rowNumber !== undefined ? data.rowNumber + 1 : ''}: ${label}`
    : 'Row'

  return <div>{text}</div>
}
