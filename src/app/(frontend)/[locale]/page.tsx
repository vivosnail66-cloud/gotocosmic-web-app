import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import { homeStatic } from '@/endpoints/seed/home-static'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { isLocale, locales } from '@/i18n/locales'

// The locale root (`/en`, `/zh`) IS the homepage. `[slug]/page.tsx` already
// defaults `slug` to `'home'`, but this file deliberately does NOT re-export
// it or render `<Page/>`: under Turbopack dev, a page segment whose module
// graph pulls in a sibling route segment's page module can fail to emit its
// own build-manifest (`.next/.../[locale]/page/build-manifest.json` → ENOENT
// 500 on `/en`). So this is a self-contained copy of the home logic.

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

type Args = {
  params: Promise<{
    locale?: string
  }>
}

export default async function LocaleHomePage({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { locale: localeParam } = await paramsPromise
  const locale = isLocale(localeParam) ? localeParam : undefined
  const url = `/${locale || 'en'}`
  let page: RequiredDataFromCollectionSlug<'pages'> | null

  page = await queryPageBySlug({
    slug: 'home',
    locale,
  })

  // Remove this code once your website is seeded
  if (!page) {
    page = homeStatic
  }

  const { hero, layout } = page

  return (
    <article className="pt-16 pb-24">
      <PageClient />
      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} locale={locale} />

      {draft && <LivePreviewListener />}

      <RenderHero {...hero} />
      <RenderBlocks blocks={layout} locale={locale} />
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { locale: localeParam } = await paramsPromise
  const locale = isLocale(localeParam) ? localeParam : undefined
  const page = await queryPageBySlug({
    slug: 'home',
    locale,
  })

  return generateMeta({ doc: page, locale })
}

const queryPageBySlug = cache(async ({ slug, locale }: { slug: string; locale?: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'pages',
    draft,
    limit: 1,
    pagination: false,
    overrideAccess: draft,
    locale: locale as never,
    where: {
      slug: {
        equals: slug,
      },
    },
  })

  return result.docs?.[0] || null
})
