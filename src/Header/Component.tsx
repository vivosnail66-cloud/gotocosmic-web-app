import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getCachedMenu } from '@/utilities/getMenu'
import { getCachedSiteSettings, getSiteLogoUrl } from '@/utilities/getSiteSettings'
import React from 'react'
import { defaultLocale } from '@/i18n/locales'

export async function Header({ locale }: { locale?: string }) {
  const [headerData, settings, menu] = await Promise.all([
    getCachedGlobal('header', 1, locale)(),
    getCachedSiteSettings(locale)(),
    getCachedMenu(locale)(),
  ])

  const siteLogo = getSiteLogoUrl(settings)

  return (
    <HeaderClient data={headerData} locale={locale || defaultLocale} siteLogo={siteLogo} menu={menu} />
  )
}
