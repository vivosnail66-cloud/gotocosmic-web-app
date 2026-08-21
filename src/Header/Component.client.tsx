'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Header } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'
import { LocaleSwitch } from '@/components/LocaleSwitch'

interface HeaderClientProps {
  data: Header
  locale: string
  /** Absolute URL of the configured site logo, or null to keep the default. */
  siteLogo?: string | null
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data, locale, siteLogo }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  return (
    <header className="container relative z-20   " {...(theme ? { 'data-theme': theme } : {})}>
      <div className="py-8 flex justify-between">
        <Link href={`/${locale}`}>
          <Logo
            loading="eager"
            priority="high"
            src={siteLogo || undefined}
            className={siteLogo ? '' : 'invert dark:invert-0'}
          />
        </Link>
        <div className="flex items-center gap-4">
          <HeaderNav data={data} />
          <LocaleSwitch currentLocale={locale} />
        </div>
      </div>
    </header>
  )
}
