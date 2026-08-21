import Script from 'next/script'
import React from 'react'

import { getCachedSiteSettings, type AnalyticsItem } from '@/utilities/getSiteSettings'

type ScriptPart = { src?: string; body?: string }

/**
 * Split a raw tracking snippet into renderable `<script>` parts.
 * Accepts either a full `<script>...</script>` snippet (e.g. TikTok Pixel,
 * Clarity) or plain JavaScript. Non-script HTML (e.g. `<noscript>` fallbacks)
 * is intentionally ignored.
 */
const normalizeCustomCode = (code: string): ScriptPart[] => {
  const trimmed = code.trim()

  // Plain JavaScript — treat the whole string as one inline script.
  if (!trimmed.startsWith('<')) return [{ body: trimmed }]

  const scripts: ScriptPart[] = []
  const tagRe = /<script([^>]*)>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null

  while ((match = tagRe.exec(trimmed))) {
    const attrs = match[1] || ''
    const srcMatch = attrs.match(/\bsrc=["']([^"']+)["']/i)
    const body = match[2]?.trim()

    scripts.push({
      src: srcMatch ? srcMatch[1] : undefined,
      body: body || undefined,
    })
  }

  return scripts.length > 0 ? scripts : [{ body: trimmed }]
}

const ga4Parts = (trackerId: string): ScriptPart[] => [
  { src: `https://www.googletagmanager.com/gtag/js?id=${trackerId}` },
  {
    body: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${trackerId}');`,
  },
]

const facebookPixelParts = (pixelId: string): ScriptPart[] => [
  {
    body: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');`,
  },
]

/**
 * Injects the enabled analytics trackers into the document.
 *
 * Renders nothing when the feature is disabled or every tracker is
 * disabled/missing its ID — so a fresh DB emits zero third-party code.
 */
export const Analytics = async ({ locale }: { locale?: string }) => {
  const settings = await getCachedSiteSettings(locale)()
  const items = (settings?.analytics?.items || []).filter(
    (item): item is AnalyticsItem => item.enabled !== false,
  )

  const parts: Array<{ id: string } & ScriptPart> = []

  for (const item of items) {
    if (item.platform === 'ga4' && item.trackerId) {
      ga4Parts(item.trackerId).forEach((part, index) => {
        parts.push({ id: `ga4-${item.id || item.trackerId}-${index}`, ...part })
      })
    } else if (item.platform === 'facebookPixel' && item.trackerId) {
      facebookPixelParts(item.trackerId).forEach((part, index) => {
        parts.push({ id: `fbp-${item.id || item.trackerId}-${index}`, ...part })
      })
    } else if (item.platform === 'custom' && item.code) {
      normalizeCustomCode(item.code).forEach((part, index) => {
        parts.push({ id: `custom-${item.id || 'code'}-${index}`, ...part })
      })
    }
  }

  if (parts.length === 0) return null

  return (
    <>
      {parts.map((part) =>
        part.src ? (
          <Script key={part.id} src={part.src} strategy="afterInteractive" />
        ) : (
          <Script
            key={part.id}
            id={part.id}
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: part.body || '' }}
          />
        ),
      )}
    </>
  )
}
