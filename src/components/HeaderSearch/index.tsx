'use client'

import { useRouter } from 'next/navigation'
import { SearchIcon, X } from 'lucide-react'
import React, { useRef, useState } from 'react'

import { cn } from '@/utilities/ui'

/**
 * Standalone search entry in the header — a search icon that expands into an
 * inline input, then navigates to `/{locale}/search?q=<query>`.
 *
 * Kept separate from the nav so it can be enhanced later (suggestions, result
 * dropdown, keyboard shortcuts) without touching the menu structure.
 *
 * This component lives directly in the client header (`Header/Component.client`)
 * so it must be a client component itself.
 */
export const HeaderSearch: React.FC<{ locale: string }> = ({ locale }) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const submit = () => {
    const q = query.trim()
    if (!q) return

    router.push(`/${locale}/search?q=${encodeURIComponent(q)}`)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="relative flex items-center" role="search">
      <div
        className={cn(
          'flex items-center overflow-hidden transition-all duration-300',
          open ? 'w-48 pr-1' : 'w-0',
        )}
      >
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
            if (e.key === 'Escape') {
              setQuery('')
              setOpen(false)
            }
          }}
          onBlur={() => setOpen(false)}
          placeholder="Search…"
          aria-label="Search"
          className="w-full bg-transparent border-b border-primary/30 py-1 pr-2 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setQuery('')
          }}
          aria-label="Close search"
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setOpen(true)
            // focus the input on the next frame once it is mounted
            requestAnimationFrame(() => inputRef.current?.focus())
          }}
          aria-label="Open search"
          className="p-1 text-foreground hover:text-primary transition-colors"
        >
          <SearchIcon className="w-5" />
        </button>
      )}
    </div>
  )
}
