'use client'

import { X } from 'lucide-react'
import React, { useEffect, useState } from 'react'

import { CMSLink } from '@/components/Link'
import type { SiteSettings } from '@/utilities/getSiteSettings'

type AnnouncementLink = NonNullable<SiteSettings['announcement']>['link']

export const AnnouncementBarClient: React.FC<{
  text: string
  link?: AnnouncementLink | null
  autoHideSeconds?: number
}> = ({ text, link, autoHideSeconds = 0 }) => {
  const [hidden, setHidden] = useState(false)

  // Auto-hide after N seconds (0 = never). Users can always dismiss with ×.
  useEffect(() => {
    if (autoHideSeconds <= 0) return

    const timer = setTimeout(() => setHidden(true), autoHideSeconds * 1000)
    return () => clearTimeout(timer)
  }, [autoHideSeconds])

  if (hidden) return null

  const hasHref = Boolean(
    link && (link.url || (link.reference && typeof link.reference === 'object')),
  )

  return (
    <div role="region" aria-label="Announcement" className="bg-primary text-primary-foreground">
      <div className="container flex items-center justify-center gap-3 py-2 text-sm">
        <div className="min-w-0 text-center">
          {hasHref && link ? (
            <CMSLink
              {...(link as unknown as React.ComponentProps<typeof CMSLink>)}
              label={undefined}
              className="text-primary-foreground underline-offset-4 hover:underline"
            >
              {text}
            </CMSLink>
          ) : (
            <span>{text}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setHidden(true)}
          aria-label="Dismiss announcement"
          className="shrink-0 rounded p-0.5 transition-colors hover:bg-primary-foreground/20"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
