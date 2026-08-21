import { PreviewSearchParams } from '@/app/(frontend)/next/preview/route'
import { defaultLocale } from '@/i18n/locales'
import { PayloadRequest, CollectionSlug } from 'payload'

const collectionPrefixMap: Partial<Record<CollectionSlug, string>> = {
  posts: '/posts',
  pages: '',
}

type Props = {
  collection: keyof typeof collectionPrefixMap
  locale?: string
  slug: string
  req: PayloadRequest
}

export const generatePreviewPath = ({ collection, locale, slug }: Props) => {
  if (slug === undefined || slug === null) {
    return null
  }

  // Encode to support slugs with special characters
  const encodedSlug = encodeURIComponent(slug)

  const localePrefix = locale || defaultLocale

  const encodedParams = new URLSearchParams({
    path: `/${localePrefix}${collectionPrefixMap[collection]}/${encodedSlug}`,
    previewSecret: process.env.PREVIEW_SECRET || '',
  } satisfies PreviewSearchParams)

  const url = `/next/preview?${encodedParams.toString()}`

  return url
}
