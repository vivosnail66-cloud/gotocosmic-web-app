'use client'
import Link from 'next/link'
import React from 'react'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { defaultLocale, isLocale } from '@/i18n/locales'

export default function NotFound() {
  const pathname = usePathname()
  const firstSegment = pathname?.split('/')[1]
  const locale = isLocale(firstSegment) ? firstSegment : defaultLocale

  return (
    <div className="container py-28">
      <div className="prose max-w-none">
        <h1 style={{ marginBottom: 0 }}>404</h1>
        <p className="mb-4">This page could not be found.</p>
      </div>
      <Button asChild variant="default">
        <Link href={`/${locale}`}>Go home</Link>
      </Button>
    </div>
  )
}
