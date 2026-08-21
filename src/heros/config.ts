import type { Field } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { linkGroup } from '@/fields/linkGroup'

export const bookingCardBlock = {
  slug: 'bookingCard',
  fields: [
    {
      name: 'icon',
      type: 'text',
      required: true,
      admin: { placeholder: 'Emoji icon, e.g. ✂️ 🏨 🍽️ 🎪' },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'subtitle',
      type: 'text',
      localized: true,
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h3', 'h4'] }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
      localized: true,
    },
    {
      name: 'accentColor',
      type: 'select',
      defaultValue: 'violet',
      options: [
        { label: 'Violet', value: 'violet' },
        { label: 'Blue', value: 'blue' },
        { label: 'Amber', value: 'amber' },
        { label: 'Emerald', value: 'emerald' },
        { label: 'Red', value: 'red' },
        { label: 'Gray', value: 'gray' },
      ],
    },
    {
      name: 'buttonLabel',
      type: 'text',
      localized: true,
    },
    {
      name: 'buttonLink',
      type: 'text',
    },
  ],
}

export const hero: Field = {
  name: 'hero',
  type: 'group',
  fields: [
    {
      name: 'type',
      type: 'select',
      defaultValue: 'lowImpact',
      label: 'Type',
      options: [
        { label: 'None', value: 'none' },
        { label: 'High Impact', value: 'highImpact' },
        { label: 'Medium Impact', value: 'mediumImpact' },
        { label: 'Low Impact', value: 'lowImpact' },
        { label: 'Split Image (Left text + Right image)', value: 'splitImage' },
        { label: 'Split Cards (Left text + Right cards)', value: 'splitCards' },
      ],
      required: true,
    },
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
      label: false,
      localized: true,
    },
    linkGroup({
      overrides: {
        maxRows: 2,
      },
    }),
    {
      name: 'media',
      type: 'upload',
      admin: {
        condition: (_, { type } = {}) =>
          ['highImpact', 'mediumImpact', 'splitImage'].includes(type),
      },
      relationTo: 'media',
      required: true,
    },
    {
      name: 'reversed',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        condition: (_, { type } = {}) => ['splitImage', 'splitCards'].includes(type),
        description: 'Swap layout: image/cards on left, text on right',
      },
      label: 'Reverse Layout',
    },
    {
      name: 'cards',
      type: 'blocks',
      admin: {
        condition: (_, { type } = {}) => type === 'splitCards',
        initCollapsed: true,
      },
      blocks: [bookingCardBlock],
      label: 'Booking Cards',
      maxRows: 4,
    },
  ],
  label: false,
}
