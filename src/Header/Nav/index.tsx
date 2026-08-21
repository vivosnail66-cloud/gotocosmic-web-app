'use client'

import React from 'react'
import { ChevronDown } from 'lucide-react'

import { CMSLink } from '@/components/Link'
import { resolveTopLevel, type MenuHeaderData, type MenuTreeNode } from '@/utilities/getMenuData'
import { MegaPanel } from './MegaPanel'
import { toCmsLinkProps } from './linkProps'

/**
 * Desktop nav (lg+). The header global curates which top-level items appear
 * (and their order) via `navItems[] -> item`; the full structure comes from the
 * menu tree fetched server-side.
 *
 * - Top-level item with children → trigger that opens a MegaPanel on hover/focus.
 * - Top-level item without children → plain link.
 */
export const HeaderNav: React.FC<{ data: MenuHeaderData; menu: MenuTreeNode[] }> = ({
  data,
  menu,
}) => {
  const topLevel = resolveTopLevel(data, menu)

  return (
    <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
      {topLevel.map((node) =>
        node.children.length > 0 ? (
          <NavItemWithPanel key={node.id} node={node} />
        ) : (
          <MenuLink key={node.id} node={node} />
        ),
      )}
    </nav>
  )
}

const MenuLink: React.FC<{ node: MenuTreeNode }> = ({ node }) => {
  const { link, label, badge } = node

  const linkProps = toCmsLinkProps(link)

  if (!linkProps) return null

  return (
    <div className="relative flex items-center gap-1 px-3 py-2">
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
  )
}

const NavItemWithPanel: React.FC<{ node: MenuTreeNode }> = ({ node }) => {
  const { link, label } = node
  const linkProps = toCmsLinkProps(link)

  return (
    <div className="group relative">
      {linkProps ? (
        <CMSLink
          {...linkProps}
          label={label || undefined}
          appearance="link"
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
        >
          <ChevronDown className="w-3.5 opacity-60 transition-transform group-hover:rotate-180" />
        </CMSLink>
      ) : (
        <button
          type="button"
          className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
        >
          {label}
          <ChevronDown className="w-3.5 opacity-60 transition-transform group-hover:rotate-180" />
        </button>
      )}

      <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 translate-y-1 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <div className="max-w-[calc(100vw-2rem)] overflow-hidden">
          <MegaPanel node={node} />
        </div>
      </div>
    </div>
  )
}
