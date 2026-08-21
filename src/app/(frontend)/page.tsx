import { redirect } from 'next/navigation'

import { defaultLocale } from '@/i18n/locales'

// Unprefixed root paths are redirected to the default locale by middleware.
// This is a safety net for paths middleware may not intercept.
export default function Page() {
  redirect(`/${defaultLocale}`)
}
