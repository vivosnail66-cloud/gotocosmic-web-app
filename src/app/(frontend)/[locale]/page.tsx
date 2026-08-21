import { locales } from '@/i18n/locales'

// The locale root (`/en`, `/zh`) IS the homepage. `[slug]/page.tsx` already
// defaults `slug` to `'home'`, so reuse it rather than duplicating the logic.
export { default, generateMetadata } from './[slug]/page'

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}
