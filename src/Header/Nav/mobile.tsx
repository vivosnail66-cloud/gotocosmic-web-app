'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { CMSLink } from '@/components/Link'
import { resolveTopLevel, type MenuHeaderData, type MenuTreeNode } from '@/utilities/getMenuData'
import { toCmsLinkProps } from './linkProps'

/**
 * Mobile nav (lg hidden) — controlled accordion. Top-level items with children
 * toggle open a list of their children; items without children render as plain
 * links. `onNavigate` closes the panel after tapping a destination.
 */
export const MobileMenu: React.FC<{
  data: MenuHeaderData
  menu: MenuTreeNode[]
  onNavigate?: () => void
}> = ({ data, menu, onNavigate }) => {
  const [openId, setOpenId] = useState<string | number | null>(null)

  const topLevel = resolveTopLevel(data, menu)

  return (
    <nav className="border-t border-border/60 py-2 lg:hidden" aria-label="Mobile navigation">
      <ul>
        {topLevel.map((node) => {
          const hasChildren = node.children.length > 0
          const isOpen = openId === node.id

          return (
            <li key={node.id} className="border-b border-border/40 last:border-b-0">
              {hasChildren ? (
                <>
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : node.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-2 py-3 text-left text-sm font-medium text-foreground/80"
                  >
                    <span>{node.label}</span>
                    <ChevronDown
                      className={`w-4 shrink-0 opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isOpen ? (
                    <ul className="pb-3 pl-4">
                      {node.children.map((child) => (
                        <MobileChildRow key={child.id} node={child} onNavigate={onNavigate} />
                      ))}
                    </ul>
                  ) : null}
                </>
              ) : (
                <div className="py-3">
                  <MobileChildRow node={node} onNavigate={onNavigate} />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

const MobileChildRow: React.FC<{ node: MenuTreeNode; onNavigate?: () => void }> = ({
  node,
  onNavigate,
}) => {
  const { link, label, badge, description } = node

  const content = (
    <>
      <span className="flex items-center gap-2">
        <span className="font-medium">{label}</span>
        {badge ? (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold leading-none text-primary">
            {badge}
          </span>
        ) : null}
      </span>
      {description ? (
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      ) : null}
    </>
  )

  if (node.type === 'columnTitle') {
    return (
      <div className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    )
  }

  const linkProps = toCmsLinkProps(link)

  if (linkProps) {
    return (
      <div className="px-3 py-1.5 text-sm text-foreground/80">
        <CMSLink {...linkProps} appearance="link" onClick={onNavigate}>
          {content}
        </CMSLink>
      </div>
    )
  }

  return <div className="px-3 py-1.5 text-sm text-foreground/80">{content}</div>
}
