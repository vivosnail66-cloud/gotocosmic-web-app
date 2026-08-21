'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'

import type { Header } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'
import { MobileMenu } from './Nav/mobile'
import { LocaleSwitch } from '@/components/LocaleSwitch'
import { HeaderSearch } from '@/components/HeaderSearch'
import type { MenuHeaderData, MenuTreeNode } from '@/utilities/getMenuData'

interface HeaderClientProps {
  data: Header
  locale: string
  /** Absolute URL of the configured site logo, or null to keep the default. */
  siteLogo?: string | null
  menu: MenuTreeNode[]
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data, locale, siteLogo, menu }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  // `payload-types.ts` still describes the old header `link` rows until
  // `pnpm generate:types` re-runs — the runtime data carries `navItems[].item`.
  const menuData = data as unknown as MenuHeaderData

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
          <HeaderNav data={menuData} menu={menu} />
          <HeaderSearch locale={locale} />
          <LocaleSwitch currentLocale={locale} />
          <button
            type="button"
            className="p-1 text-foreground transition-colors hover:text-primary lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            {mobileOpen ? <X className="w-6" /> : <Menu className="w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div id="mobile-nav" className="lg:hidden">
          <MobileMenu data={menuData} menu={menu} onNavigate={() => setMobileOpen(false)} />
        </div>
      ) : null}
    </header>
  )
}
