import { redirect } from 'next/navigation'

import { defaultLocale } from '@/i18n/locales'

// Deprecated non-localized route. Middleware redirects unprefixed paths to the
// default locale; this stub is a safety net.
export default async function Page({ params }: { params: Promise<{ pageNumber: string }> }) {
  const { pageNumber } = await params
  redirect(`/${defaultLocale}/posts/page/${encodeURIComponent(pageNumber)}`)
}
