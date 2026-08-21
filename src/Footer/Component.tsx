import { getCachedGlobal } from '@/utilities/getGlobals'
import { getCachedSiteSettings, getSiteLogoUrl } from '@/utilities/getSiteSettings'
import Link from 'next/link'
import React from 'react'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'

export async function Footer({ locale }: { locale?: string }) {
  const footerData = await getCachedGlobal('footer', 1, locale)()
  const settings = await getCachedSiteSettings(locale)()

  const navItems = footerData?.navItems || []
  const siteLogo = getSiteLogoUrl(settings)
  const company = settings?.general?.company
  const copyright = settings?.general?.copyright?.text

  return (
    <footer className="mt-auto border-t border-border bg-black dark:bg-card text-white">
      <div className="container py-8 gap-8 flex flex-col md:flex-row md:justify-between">
        <div className="flex flex-col gap-4">
          <Link className="flex items-center" href={`/${locale || 'en'}`}>
            <Logo src={siteLogo || undefined} />
          </Link>

          {company?.name || company?.address ? (
            <div className="flex flex-col gap-1 text-sm text-white/70">
              {company.name && <span className="font-medium text-white">{company.name}</span>}
              {company.address && <span>{company.address}</span>}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse items-start md:flex-row gap-4 md:items-center">
          {company?.phone || company?.email ? (
            <div className="flex flex-col gap-1 text-sm text-white/70">
              {company.phone && <span>{company.phone}</span>}
              {company.email && <span>{company.email}</span>}
            </div>
          ) : null}

          <ThemeSelector />

          <nav className="flex flex-col md:flex-row gap-4">
            {navItems.map(({ link }, i) => {
              return <CMSLink className="text-white" key={i} {...link} />
            })}
          </nav>
        </div>
      </div>

      {copyright ? (
        <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
          {copyright}
        </div>
      ) : null}
    </footer>
  )
}
