'use client'

import { Globe, Mail, MessageCircle, Phone } from 'lucide-react'
import React, { useEffect, useState } from 'react'

import type { FloatingButtonItem } from '@/utilities/getSiteSettings'

const resolveHref = (button: FloatingButtonItem): string | null => {
  const value = button.value?.trim()
  if (!value) return null

  switch (button.type) {
    case 'whatsapp':
      return `https://wa.me/${value.replace(/[^0-9]/g, '')}`
    case 'email':
      return `mailto:${value}`
    case 'phone':
      return `tel:${value}`
    case 'custom':
      return value
    default:
      return null
  }
}

const resolveIcon = (type?: FloatingButtonItem['type']) => {
  switch (type) {
    case 'whatsapp':
      return MessageCircle
    case 'email':
      return Mail
    case 'phone':
      return Phone
    default:
      return Globe
  }
}

export const FloatingButtonsClient: React.FC<{
  buttons: FloatingButtonItem[]
  showOnMobile?: boolean
}> = ({ buttons, showOnMobile = true }) => {
  // Track whether the viewport is mobile (≤768px) so "hide on mobile" can be
  // honored without a server-side user-agent guess.
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(max-width: 768px)')
    const update = () => setIsMobile(query.matches)

    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  const visible = showOnMobile || !isMobile

  if (!visible) return null

  return (
    <div className="fixed bottom-6 right-4 z-40 flex flex-col gap-3">
      {buttons.map((button) => {
        const href = resolveHref(button)
        if (!href) return null

        const Icon = resolveIcon(button.type)
        const external =
          button.type === 'whatsapp' ||
          (button.type === 'custom' && /^https?:\/\//i.test(href))

        return (
          <a
            key={button.id}
            href={href}
            aria-label={button.label || button.value || undefined}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
          >
            <Icon size={22} />
          </a>
        )
      })}
    </div>
  )
}
