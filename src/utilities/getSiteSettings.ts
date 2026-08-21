import { unstable_cache } from 'next/cache'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { getServerSideURL } from './getURL'

/**
 * Local type for the `site-settings` global.
 *
 * We intentionally do NOT rely on the generated `payload-types.ts` here so this
 * module compiles before `pnpm generate:types` has been re-run (the global is
 * not yet part of `Config['globals']`). After regenerating, both the cast in
 * `getCachedSiteSettings` and these types remain valid.
 */
export type SiteSettings = {
  general?: {
    logo?:
      | {
          url?: string | null
          alt?: string | null
        }
      | string
      | number
      | null
    company?: {
      name?: string | null
      address?: string | null
      email?: string | null
      phone?: string | null
    } | null
    copyright?: {
      text?: string | null
    } | null
  } | null
  announcement?: {
    enabled?: boolean | null
    text?: string | null
    link?: {
      type?: 'reference' | 'custom' | null
      newTab?: boolean | null
      label?: string | null
      url?: string | null
      reference?: unknown
    } | null
    autoHideSeconds?: number | null
  } | null
  floatingButtons?: {
    enabled?: boolean | null
    showOnMobile?: boolean | null
    buttons?: Array<{
      id?: string
      type?: 'whatsapp' | 'email' | 'phone' | 'custom' | null
      label?: string | null
      value?: string | null
      enabled?: boolean | null
    }> | null
  } | null
  analytics?: {
    items?: Array<{
      id?: string
      platform?: 'ga4' | 'facebookPixel' | 'custom' | null
      trackerId?: string | null
      code?: string | null
      enabled?: boolean | null
    }> | null
  } | null
}

export type AnalyticsItem = NonNullable<
  NonNullable<SiteSettings['analytics']>['items']
>[number]

export type FloatingButtonItem = NonNullable<
  NonNullable<SiteSettings['floatingButtons']>['buttons']
>[number]

/**
 * Cached fetch of the `site-settings` global.
 * The `slug` is cast because the global only enters `Config['globals']` after
 * `pnpm generate:types`; the cast keeps this safe both before and after.
 */
export const getCachedSiteSettings = (locale?: string) =>
  unstable_cache(
    async (): Promise<SiteSettings> => {
      const payload = await getPayload({ config: configPromise })

      const global = await payload.findGlobal({
        slug: 'site-settings' as never,
        depth: 1,
        locale: locale as never,
      })

      return global as unknown as SiteSettings
    },
    ['site-settings', locale],
    {
      tags: ['global_site-settings'],
    },
  )

/** Resolve the configured site logo to an absolute URL, or null when unset. */
export const getSiteLogoUrl = (settings?: SiteSettings | null): string | null => {
  const logo = settings?.general?.logo

  if (logo && typeof logo === 'object' && 'url' in logo && logo.url) {
    return logo.url.startsWith('/') ? getServerSideURL() + logo.url : logo.url
  }

  return null
}
