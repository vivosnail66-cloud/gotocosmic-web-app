import type { CollectionConfig, GroupField } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { link } from '@/fields/link'
import { revalidateMenuItems } from './MenuItems/hooks/revalidateMenuItems'

/**
 * The `link()` factory marks `reference`/`url` as required. Menu items may be
 * link-less (columnTitle), and Payload activates the link group's default
 * `type: 'reference'` even when the group is omitted — which would force
 * `link.reference` as required and break column-title rows in both the seed
 * and the admin UI. So relax the two target fields here; a FIELD-level
 * `validate` on the link group enforces a target only for item types that
 * need one.
 */
const menuLinkField: GroupField = link({
  appearances: false,
  disableLabel: true,
  overrides: {
    label: 'Link target',
    admin: {
      description: 'Where the item points to. Column titles may be left empty.',
    },
  },
}) as GroupField

for (const field of menuLinkField.fields) {
  const f = field as { name?: string; required?: boolean }
  if ((f.name === 'reference' || f.name === 'url') && f.required !== undefined) {
    f.required = false
  }
}

// Business rule: `link`, `featured` and `cta` items must point somewhere;
// `columnTitle` items deliberately have no link. Enforced as a FIELD-level
// `validate` (not collection-level): Payload does NOT strip a top-level
// collection `validate` from the config it sends to the admin client, which
// breaks the RSC boundary ("Functions cannot be passed directly to Client
// Components"). Field-level validates are stripped and safe.
menuLinkField.validate = ((value, { siblingData }) => {
  const type = (siblingData as Record<string, unknown> | undefined)?.type

  if (type === 'link' || type === 'featured' || type === 'cta') {
    const linkGroup = (value as Record<string, unknown> | null | undefined) || undefined
    const hasTarget = linkGroup
      ? linkGroup.type === 'custom'
        ? Boolean(linkGroup.url)
        : Boolean(linkGroup.reference)
      : false

    if (!hasTarget) {
      return 'A link target is required for this item type.'
    }
  }

  return true
}) as GroupField['validate']

/**
 * Flat, self-referencing menu item collection (see docs/superpowers/specs/
 * 2026-08-21-mega-menu-design.md).
 *
 * Rationale (Payload discussion #16007): deep nested arrays/blocks inside a
 * global get slow in the admin once you go 3+ levels deep. Instead each menu
 * node is a DB row here; `parent` (self-relationship) encodes hierarchy and the
 * Header global only references top-level items. The frontend fetches the whole
 * set in ONE query and builds the tree in memory.
 *
 * Two levels are supported today: a top-level item (parent empty) → its
 * children (parent set) render inside the mega panel. Panel elements:
 * `link` (plain row, optional badge/description), `columnTitle` (column header),
 * `featured` (image card), `cta` (full-width bottom bar).
 */
export const MenuItems: CollectionConfig = {
  slug: 'menu-items',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'label',
    group: 'Navigation',
    defaultColumns: ['label', 'type', 'parent', 'order'],
  },
  hooks: {
    afterChange: [revalidateMenuItems],
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      defaultValue: 'link',
      options: [
        {
          label: 'Link',
          value: 'link',
        },
        {
          label: 'Column title',
          value: 'columnTitle',
        },
        {
          label: 'Featured card',
          value: 'featured',
        },
        {
          label: 'Bottom CTA',
          value: 'cta',
        },
      ],
    },
    menuLinkField,
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'menu-items',
      admin: {
        description: 'Leave empty to make this a top-level item.',
        position: 'sidebar',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Sorts siblings. Lower numbers appear first.',
        position: 'sidebar',
      },
    },
    {
      name: 'column',
      type: 'number',
      min: 1,
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.parent),
        description: 'Which column (1-based) this child appears in inside the panel.',
        width: '50%',
      },
    },
    {
      name: 'badge',
      type: 'text',
      localized: true,
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'link',
        description: 'Small tag next to the label, e.g. New / Hot.',
        width: '50%',
      },
    },
    {
      name: 'description',
      type: 'text',
      localized: true,
      admin: {
        condition: (_, siblingData) =>
          siblingData?.type === 'link' || siblingData?.type === 'featured' || siblingData?.type === 'cta',
        description: 'One-line description.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'featured',
        description: 'Image used by the featured card.',
      },
    },
  ],
}
