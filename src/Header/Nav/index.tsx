'use client'

import React from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { SearchIcon } from 'lucide-react'
import { defaultLocale, isLocale } from '@/i18n/locales'

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []
  const params = useParams()
  const localeParam = Array.isArray(params.locale) ? params.locale?.[0] : params?.locale
  const locale = isLocale(localeParam) ? localeParam : defaultLocale

  return (
    <nav className="flex gap-3 items-center">
      {navItems.map(({ link }, i) => {
        return <CMSLink key={i} {...link} appearance="link" />
      })}
      <Link href={`/${locale}/search`}>
        <span className="sr-only">Search</span>
        <SearchIcon className="w-5 text-primary" />
      </Link>
    </nav>
  )
}
