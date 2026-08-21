'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/utilities/ui'

import { locales, type Locale } from '@/i18n/locales'

const localeLabels: Record<Locale, string> = {
  en: 'EN',
  zh: '中文',
}

export const LocaleSwitch: React.FC<{ currentLocale: string }> = ({ currentLocale }) => {
  const pathname = usePathname()

  // Strip any leading `/en` or `/zh` segment so we can rebuild the path for the
  // target locale. Falls back to the full pathname if the prefix is missing.
  const segments = pathname?.split('/').filter(Boolean) || []
  const rest =
    segments.length > 0 && (locales as readonly string[]).includes(segments[0])
      ? '/' + segments.slice(1).join('/')
      : pathname || '/'

  return (
    <nav className="flex items-center gap-1" aria-label="Language switcher">
      {locales.map((locale) => {
        const isActive = locale === currentLocale

        return (
          <Link
            key={locale}
            href={`/${locale}${rest === '/' ? '' : rest}`}
            aria-current={isActive ? 'true' : undefined}
            className={cn(
              'px-2 py-1 text-xs font-medium rounded transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {localeLabels[locale]}
          </Link>
        )
      })}
    </nav>
  )
}
