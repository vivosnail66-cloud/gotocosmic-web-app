import React from 'react'

import { getCachedSiteSettings } from '@/utilities/getSiteSettings'
import { AnnouncementBarClient } from './index.client'

/**
 * Announcement bar. Renders nothing when the feature is disabled or the
 * message is empty, so a fresh DB shows no bar by default.
 */
export const AnnouncementBar = async ({ locale }: { locale?: string }) => {
  const settings = await getCachedSiteSettings(locale)()
  const announcement = settings?.announcement

  if (!announcement?.enabled || !announcement?.text) return null

  return (
    <AnnouncementBarClient
      text={announcement.text}
      link={announcement.link}
      autoHideSeconds={announcement.autoHideSeconds || 0}
    />
  )
}
