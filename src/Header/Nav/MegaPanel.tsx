'use client'

import React from 'react'

import type { Media as MediaType } from '@/payload-types'
import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import type { MenuTreeNode } from '@/utilities/getMenuData'
import { toCmsLinkProps } from './linkProps'

/**
 * Renders the content of a mega panel for a top-level item that has children.
 *
 * Layout (see docs/superpowers/specs/2026-08-21-mega-menu-design.md):
 * children are grouped by their `column` number into columns; `columnTitle`
 * children become column headings; `link` children become rows (optional badge +
 * description); `featured` children render as image cards on the right; `cta`
 * children render as a full-width bottom bar.
 */

const LinkRow: React.FC<{ node: MenuTreeNode }> = ({ node }) => {
  const { link, label, badge, description } = node

  if (!link) return null

  const linkProps = toCmsLinkProps(link)

  if (!linkProps) return null

  return (
    <li>
      <div className="flex items-center gap-2">
        <CMSLink
          {...linkProps}
          label={label || undefined}
          appearance="link"
          className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
        />
        {badge ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold leading-none text-primary">
            {badge}
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="mt-1 max-w-[14rem] text-xs leading-snug text-muted-foreground">{description}</p>
      ) : null}
    </li>
  )
}

const ColumnTitle: React.FC<{ node: MenuTreeNode }> = ({ node }) => {
  const { link, label } = node

  if (!label) return null

  const linkProps = toCmsLinkProps(link)

  if (linkProps) {
    return (
      <CMSLink
        {...linkProps}
        label={label}
        appearance="inline"
        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-primary"
      />
    )
  }

  return <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h3>
}

const FeaturedCard: React.FC<{ node: MenuTreeNode }> = ({ node }) => {
  const { image, label, description, link } = node

  const linkProps = toCmsLinkProps(link)

  return (
    <div className="w-60 shrink-0 overflow-hidden rounded-lg border border-border bg-card">
      {image && typeof image === 'object' && image.url ? (
        <Media
          resource={image as unknown as MediaType}
          className="aspect-[4/3] w-full overflow-hidden bg-muted"
          imgClassName="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="aspect-[4/3] w-full bg-muted" />
      )}
      <div className="p-4">
        {label ? <p className="text-sm font-semibold text-foreground">{label}</p> : null}
        {description ? (
          <p className="mt-1 text-xs leading-snug text-muted-foreground">{description}</p>
        ) : null}
        {linkProps ? (
          <CMSLink
            {...linkProps}
            appearance="inline"
            className="mt-2 inline-block text-sm font-medium text-primary"
          >
            Learn more →
          </CMSLink>
        ) : null}
      </div>
    </div>
  )
}

const CTABar: React.FC<{ node: MenuTreeNode }> = ({ node }) => {
  const { link, label, description } = node

  const linkProps = toCmsLinkProps(link)

  if (!linkProps) return null

  return (
    <div className="mt-6 flex items-center justify-between gap-6 rounded-lg bg-muted px-5 py-4">
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : (
        <span />
      )}
      <CMSLink {...linkProps} label={label || 'Learn more'} appearance="default" size="sm" />
    </div>
  )
}

export const MegaPanel: React.FC<{ node: MenuTreeNode }> = ({ node }) => {
  const children = node.children || []

  const featured = children.filter((child) => child.type === 'featured')
  const cta = children.filter((child) => child.type === 'cta')
  const regular = children.filter((child) => child.type !== 'featured' && child.type !== 'cta')

  // Group the remaining children into columns by their `column` number.
  const columns = new Map<number, MenuTreeNode[]>()
  for (const child of regular) {
    const col = child.column ?? 1
    const existing = columns.get(col) ?? []
    existing.push(child)
    columns.set(col, existing)
  }

  const sortedColumns = [...columns.entries()].sort((a, b) => a[0] - b[0])

  return (
    <div className="w-max rounded-xl border border-border bg-background p-6 shadow-lg shadow-black/5">
      <div className="flex items-start gap-10">
        {sortedColumns.map(([colNum, items]) => (
          <div key={colNum} className="min-w-[11rem]">
            <ul className="space-y-3">
              {items.map((item) =>
                item.type === 'columnTitle' ? (
                  <li key={item.id}>
                    <ColumnTitle node={item} />
                  </li>
                ) : (
                  <LinkRow key={item.id} node={item} />
                ),
              )}
            </ul>
          </div>
        ))}

        {featured.map((item) => (
          <FeaturedCard key={item.id} node={item} />
        ))}
      </div>

      {cta.map((item) => (
        <CTABar key={item.id} node={item} />
      ))}
    </div>
  )
}
