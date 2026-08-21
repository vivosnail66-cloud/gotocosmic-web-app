import React from 'react'

import {
  getCachedSiteSettings,
  type FloatingButtonItem,
} from '@/utilities/getSiteSettings'
import { FloatingButtonsClient } from './index.client'

/**
 * Right-hand floating contact buttons. Renders nothing when the feature is
 * disabled or no enabled buttons are configured.
 */
export const FloatingButtons = async ({ locale }: { locale?: string }) => {
  const settings = await getCachedSiteSettings(locale)()
  const group = settings?.floatingButtons

  if (!group?.enabled) return null

  const buttons = (group.buttons || []).filter(
    (button): button is FloatingButtonItem => button.enabled !== false,
  )

  if (buttons.length === 0) return null

  return (
    <FloatingButtonsClient
      buttons={buttons}
      showOnMobile={group.showOnMobile !== false}
    />
  )
}
