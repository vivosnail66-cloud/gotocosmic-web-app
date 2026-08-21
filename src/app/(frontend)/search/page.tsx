import { redirect } from 'next/navigation'

import { defaultLocale } from '@/i18n/locales'

// Deprecated non-localized route. Middleware redirects unprefixed paths to the
// default locale; this stub is a safety net.
export default async function Page() {
  redirect(`/${defaultLocale}/search`)
}
