import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateSiteSettings } from './hooks/revalidateSiteSettings'

/**
 * Global "Site Settings" — cross-cutting site configuration surfaced in the
 * admin as a tab group. Everything is opt-in: when the global is empty (fresh
 * DB), the frontend renders nothing extra and emits no analytics code.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        // Tab 1 — General: logo, company info, copyright
        {
          name: 'general',
          label: 'General',
          fields: [
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Desktop/site logo. Used in the header and footer. Leave empty to keep the default logo.',
              },
            },
            {
              name: 'company',
              type: 'group',
              label: 'Company Info',
              fields: [
                {
                  name: 'name',
                  type: 'text',
                  localized: true,
                },
                {
                  name: 'address',
                  type: 'text',
                  localized: true,
                },
                {
                  name: 'email',
                  type: 'email',
                },
                {
                  name: 'phone',
                  type: 'text',
                  admin: {
                    description: 'Phone number shown in the footer.',
                  },
                },
              ],
            },
            {
              name: 'copyright',
              type: 'group',
              label: 'Copyright',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                  localized: true,
                  admin: {
                    description: 'e.g. "© 2026 Gotocosmic. All rights reserved."',
                  },
                },
              ],
            },
          ],
        },
        // Tab 2 — Announcement bar
        {
          name: 'announcement',
          label: 'Announcement Bar',
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              defaultValue: false,
              label: 'Enable announcement bar',
            },
            {
              name: 'text',
              type: 'text',
              localized: true,
              label: 'Message',
            },
            link({ appearances: false }),
            {
              name: 'autoHideSeconds',
              type: 'number',
              defaultValue: 0,
              min: 0,
              admin: {
                description: 'Seconds before the bar auto-hides. 0 = never auto-hides. Users can always dismiss it with ×.',
              },
            },
          ],
        },
        // Tab 3 — Floating contact buttons
        {
          name: 'floatingButtons',
          label: 'Floating Buttons',
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              defaultValue: false,
              label: 'Enable floating buttons',
            },
            {
              name: 'showOnMobile',
              type: 'checkbox',
              defaultValue: true,
              label: 'Show on mobile',
              admin: {
                description: 'When unchecked, all floating buttons are hidden on screens ≤ 768px.',
              },
            },
            {
              name: 'buttons',
              type: 'array',
              labels: {
                singular: 'Button',
                plural: 'Buttons',
              },
              fields: [
                {
                  name: 'type',
                  type: 'select',
                  required: true,
                  defaultValue: 'whatsapp',
                  options: [
                    { label: 'WhatsApp', value: 'whatsapp' },
                    { label: 'Email', value: 'email' },
                    { label: 'Phone', value: 'phone' },
                    { label: 'Custom link', value: 'custom' },
                  ],
                },
                {
                  name: 'label',
                  type: 'text',
                  localized: true,
                  admin: {
                    description: 'Tooltip/aria label, e.g. "Chat with us".',
                  },
                },
                {
                  name: 'value',
                  type: 'text',
                  required: true,
                  admin: {
                    description: 'WhatsApp: number with country code (no "+"). Email: address. Phone: number. Custom: full URL.',
                  },
                },
                {
                  name: 'enabled',
                  type: 'checkbox',
                  defaultValue: true,
                  label: 'Enabled',
                },
              ],
            },
          ],
        },
        // Tab 4 — Analytics
        {
          name: 'analytics',
          label: 'Analytics',
          fields: [
            {
              name: 'items',
              type: 'array',
              labels: {
                singular: 'Tracker',
                plural: 'Trackers',
              },
              admin: {
                description: 'Enabled trackers with a non-empty ID/code are injected into the site <head>. Others are skipped.',
              },
              fields: [
                {
                  name: 'platform',
                  type: 'select',
                  required: true,
                  defaultValue: 'ga4',
                  options: [
                    { label: 'Google Analytics (GA4)', value: 'ga4' },
                    { label: 'Facebook Pixel', value: 'facebookPixel' },
                    { label: 'Custom code', value: 'custom' },
                  ],
                },
                {
                  name: 'trackerId',
                  type: 'text',
                  admin: {
                    condition: (_, siblingData) => siblingData?.platform !== 'custom',
                    description: 'GA4: G-XXXXXXXXXX. Facebook Pixel: a 15–16 digit ID.',
                  },
                },
                {
                  name: 'code',
                  type: 'textarea',
                  admin: {
                    condition: (_, siblingData) => siblingData?.platform === 'custom',
                    description:
                      'Paste a full <script> snippet (e.g. TikTok Pixel, Clarity) or plain JS. Injected verbatim.',
                    style: {
                      fontFamily: 'monospace',
                    },
                  },
                },
                {
                  name: 'enabled',
                  type: 'checkbox',
                  defaultValue: true,
                  label: 'Enabled',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateSiteSettings],
  },
}
