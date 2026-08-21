'use client'

import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import React from 'react'

import type { Page, Post } from '@/payload-types'
import { defaultLocale, isLocale } from '@/i18n/locales'

type CMSLinkType = {
  appearance?: 'inline' | ButtonProps['variant']
  children?: React.ReactNode
  className?: string
  label?: string | null
  newTab?: boolean | null
  onClick?: React.MouseEventHandler<HTMLAnchorElement>
  reference?: {
    relationTo: 'pages' | 'posts'
    value: Page | Post | string | number
  } | null
  size?: ButtonProps['size'] | null
  type?: 'custom' | 'reference' | null
  url?: string | null
}

export const CMSLink: React.FC<CMSLinkType> = (props) => {
  const {
    type,
    appearance = 'inline',
    children,
    className,
    label,
    newTab,
    onClick,
    reference,
    size: sizeFromProps,
    url,
  } = props

  const params = useParams()
  const localeParam = Array.isArray(params.locale) ? params.locale?.[0] : params?.locale
  const locale = isLocale(localeParam) ? localeParam : defaultLocale

  const href =
    type === 'reference' && typeof reference?.value === 'object' && reference.value.slug
      ? `/${locale}${reference?.relationTo !== 'pages' ? `/${reference?.relationTo}` : ''}/${
          reference.value.slug
        }`
      : url

  if (!href) return null

  // Prefix internal links with the active locale when the URL is relative and
  // not already locale-prefixed.
  const resolvedHref =
    href.startsWith('/') &&
    !href.startsWith(`/${locale}`) &&
    !href.startsWith('/_next') &&
    !href.startsWith('/api') &&
    !href.startsWith('/admin') &&
    !href.startsWith('/next/')
      ? `/${locale}${href}`
      : href

  const size = appearance === 'link' ? 'clear' : sizeFromProps
  const newTabProps = newTab ? { rel: 'noopener noreferrer', target: '_blank' } : {}

  /* Ensure we don't break any styles set by richText */
  if (appearance === 'inline') {
    return (
      <Link className={cn(className)} href={resolvedHref} onClick={onClick} {...newTabProps}>
        {label && label}
        {children && children}
      </Link>
    )
  }

  return (
    <Button asChild className={className} size={size} variant={appearance}>
      <Link className={cn(className)} href={resolvedHref} onClick={onClick} {...newTabProps}>
        {label && label}
        {children && children}
      </Link>
    </Button>
  )
}
