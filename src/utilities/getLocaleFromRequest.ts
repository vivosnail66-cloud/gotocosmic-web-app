import type { PayloadRequest } from 'payload'

import { defaultLocale, isLocale } from '@/i18n/locales'

/**
 * Derives the active locale from a PayloadRequest's URL. In the admin panel the
 * locale is encoded in the pathname (`/admin`, `/zh/admin`, ...), so this lets
 * live preview / preview links resolve to the correct locale-prefixed page.
 */
export const getLocaleFromRequest = (req: PayloadRequest): string => {
  const url = req.url || req.headers?.get('referer') || ''
  const path = url.split('?')[0]

  const segment = path.split('/').filter(Boolean)[0]

  if (segment && isLocale(segment)) {
    return segment
  }

  return defaultLocale
}
