import type React from 'react'
import type { Page, Post } from '@/payload-types'

import { getCachedDocument } from '@/utilities/getDocument'
import { getCachedRedirects } from '@/utilities/getRedirects'
import { notFound, redirect } from 'next/navigation'
import { defaultLocale } from '@/i18n/locales'

interface Props {
  disableNotFound?: boolean
  locale?: string
  url: string
}

/* This component helps us with SSR based dynamic redirects */
export const PayloadRedirects: React.FC<Props> = async ({ disableNotFound, locale, url }) => {
  const redirects = await getCachedRedirects()()

  const localePrefix = locale || defaultLocale

  // Redirect sources in the admin are stored as raw paths (e.g. `/old-page`).
  // The incoming `url` is locale-prefixed, so strip the prefix before matching.
  const unprefixedUrl = url.startsWith(`/${localePrefix}`) ? url.slice(localePrefix.length + 1) : url

  const redirectItem = redirects.find((redirect) => redirect.from === unprefixedUrl)

  if (redirectItem) {
    if (redirectItem.to?.url) {
      const toUrl = redirectItem.to.url
      const resolvedToUrl =
        toUrl.startsWith('/') && !toUrl.startsWith(`/${localePrefix}`)
          ? `/${localePrefix}${toUrl}`
          : toUrl
      redirect(resolvedToUrl)
    }

    let redirectUrl: string

    if (typeof redirectItem.to?.reference?.value === 'string') {
      const collection = redirectItem.to?.reference?.relationTo
      const id = redirectItem.to?.reference?.value

      const document = (await getCachedDocument(collection, id)()) as Page | Post
      redirectUrl = `/${localePrefix}${
        redirectItem.to?.reference?.relationTo !== 'pages'
          ? `/${redirectItem.to?.reference?.relationTo}`
          : ''
      }/${document?.slug}`
    } else {
      redirectUrl = `/${localePrefix}${
        redirectItem.to?.reference?.relationTo !== 'pages'
          ? `/${redirectItem.to?.reference?.relationTo}`
          : ''
      }/${
        typeof redirectItem.to?.reference?.value === 'object'
          ? redirectItem.to?.reference?.value?.slug
          : ''
      }`
    }

    if (redirectUrl) redirect(redirectUrl)
  }

  if (disableNotFound) return null

  notFound()
}
