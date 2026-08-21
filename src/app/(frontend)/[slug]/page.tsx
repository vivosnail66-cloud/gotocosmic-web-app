import { redirect } from 'next/navigation'

import { defaultLocale } from '@/i18n/locales'

// Deprecated non-localized route. Middleware redirects unprefixed paths to the
// default locale; this stub is a safety net for requests that reach the route
// handler directly.
export default async function Page({ params }: { params: Promise<{ slug?: string }> }) {
  const { slug = 'home' } = await params
  redirect(`/${defaultLocale}/${encodeURIComponent(slug)}`)
}
