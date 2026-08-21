import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'
import { defaultLocale } from '@/i18n/locales'

export async function Header({ locale }: { locale?: string }) {
  const headerData = await getCachedGlobal('header', 1, locale)()

  return <HeaderClient data={headerData} locale={locale || defaultLocale} />
}
