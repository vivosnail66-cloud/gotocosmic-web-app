import type { CollectionSlug, GlobalSlug, Payload, PayloadRequest, File } from 'payload'

import { contactForm as contactFormData } from './contact-form'
import { contact as contactPageData } from './contact-page'
import { home } from './home'
import { image1 } from './image-1'
import { image2 } from './image-2'
import { imageHero1 } from './image-hero-1'
import { post1 } from './post-1'
import { post2 } from './post-2'
import { post3 } from './post-3'

// `menu-items` is cast because `payload-types.ts` doesn't know the collection
// until `pnpm generate:types` re-runs (see docs/development-log.md).
const collections = [
  'categories',
  'media',
  'pages',
  'posts',
  'menu-items',
  'forms',
  'form-submissions',
  'search',
] as CollectionSlug[]

const globals: GlobalSlug[] = ['header', 'footer']

const categories = ['Technology', 'News', 'Finance', 'Design', 'Software', 'Engineering']

// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available
// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding database...')

  // we need to clear the media directory before seeding
  // as well as the collections and globals
  // this is because while `yarn seed` drops the database
  // the custom `/api/seed` endpoint does not
  payload.logger.info(`— Clearing collections and globals...`)

  // clear the database
  await Promise.all(
    globals.map((global) =>
      payload.updateGlobal({
        slug: global,
        data: {
          navItems: [],
        },
        depth: 0,
        context: {
          disableRevalidate: true,
        },
      }),
    ),
  )

  await Promise.all(
    collections.map((collection) => payload.db.deleteMany({ collection, req, where: {} })),
  )

  await Promise.all(
    collections
      .filter((collection) => Boolean(payload.collections[collection].config.versions))
      .map((collection) => payload.db.deleteVersions({ collection, req, where: {} })),
  )

  payload.logger.info(`— Seeding demo author and user...`)

  await payload.delete({
    collection: 'users',
    depth: 0,
    where: {
      email: {
        equals: 'demo-author@example.com',
      },
    },
  })

  payload.logger.info(`— Seeding media...`)

  const [image1Buffer, image2Buffer, image3Buffer, hero1Buffer] = await Promise.all([
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/3.x/templates/website/src/endpoints/seed/image-post1.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/3.x/templates/website/src/endpoints/seed/image-post2.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/3.x/templates/website/src/endpoints/seed/image-post3.webp',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/3.x/templates/website/src/endpoints/seed/image-hero1.webp',
    ),
  ])

  const [demoAuthor, image1Doc, image2Doc, image3Doc, imageHomeDoc] = await Promise.all([
    payload.create({
      collection: 'users',
      data: {
        name: 'Demo Author',
        email: 'demo-author@example.com',
        password: 'password',
      },
    }),
    payload.create({
      collection: 'media',
      data: image1,
      file: image1Buffer,
    }),
    payload.create({
      collection: 'media',
      data: image2,
      file: image2Buffer,
    }),
    payload.create({
      collection: 'media',
      data: image2,
      file: image3Buffer,
    }),
    payload.create({
      collection: 'media',
      data: imageHero1,
      file: hero1Buffer,
    }),
    categories.map((category) =>
      payload.create({
        collection: 'categories',
        data: {
          title: category,
          slug: category,
        },
      }),
    ),
  ])

  payload.logger.info(`— Seeding posts...`)

  // Do not create posts with `Promise.all` because we want the posts to be created in order
  // This way we can sort them by `createdAt` or `publishedAt` and they will be in the expected order
  const post1Doc = await payload.create({
    collection: 'posts',
    depth: 0,
    context: {
      disableRevalidate: true,
    },
    data: post1({ heroImage: image1Doc, blockImage: image2Doc, author: demoAuthor }),
  })

  const post2Doc = await payload.create({
    collection: 'posts',
    depth: 0,
    context: {
      disableRevalidate: true,
    },
    data: post2({ heroImage: image2Doc, blockImage: image3Doc, author: demoAuthor }),
  })

  const post3Doc = await payload.create({
    collection: 'posts',
    depth: 0,
    context: {
      disableRevalidate: true,
    },
    data: post3({ heroImage: image3Doc, blockImage: image1Doc, author: demoAuthor }),
  })

  // update each post with related posts
  await payload.update({
    id: post1Doc.id,
    collection: 'posts',
    data: {
      relatedPosts: [post2Doc.id, post3Doc.id],
    },
  })
  await payload.update({
    id: post2Doc.id,
    collection: 'posts',
    data: {
      relatedPosts: [post1Doc.id, post3Doc.id],
    },
  })
  await payload.update({
    id: post3Doc.id,
    collection: 'posts',
    data: {
      relatedPosts: [post1Doc.id, post2Doc.id],
    },
  })

  payload.logger.info(`— Seeding contact form...`)

  const contactForm = await payload.create({
    collection: 'forms',
    depth: 0,
    data: contactFormData,
  })

  payload.logger.info(`— Seeding pages...`)

  const [homePage, contactPage] = await Promise.all([
    payload.create({
      collection: 'pages',
      depth: 0,
      data: home({ heroImage: imageHomeDoc, metaImage: image2Doc }),
    }),
    payload.create({
      collection: 'pages',
      depth: 0,
      data: contactPageData({ contactForm: contactForm }),
    }),
  ])

  payload.logger.info(`— Seeding menu items...`)

  type SeedMenuItemData = {
    label: string
    type?: 'link' | 'columnTitle' | 'featured' | 'cta'
    link?: {
      type?: 'custom' | 'reference'
      url?: string
      reference?: { relationTo: string; value: string | number }
    }
    parent?: string | number
    order?: number
    column?: number
    badge?: string
    description?: string
    image?: string | number
  }

  const createMenuItem = (data: SeedMenuItemData) =>
    payload.create({
      collection: 'menu-items' as never,
      depth: 0,
      context: { disableRevalidate: true },
      data: data as never,
    }) as unknown as Promise<{ id: string | number }>

  // Top-level items — curated + ordered by the header global. "Solutions" has
  // children, so it becomes a mega-panel trigger (and also carries a link so
  // editors can see both behaviours).
  const [postsMenuItem, solutionsMenuItem, contactMenuItem] = await Promise.all([
    createMenuItem({
      label: 'Posts',
      type: 'link',
      order: 0,
      link: { type: 'custom', url: '/posts' },
    }),
    createMenuItem({
      label: 'Solutions',
      type: 'link',
      order: 1,
      link: { type: 'reference', reference: { relationTo: 'pages', value: homePage.id } },
    }),
    createMenuItem({
      label: 'Contact',
      type: 'link',
      order: 2,
      link: { type: 'reference', reference: { relationTo: 'pages', value: contactPage.id } },
    }),
  ])

  // Children of "Solutions" exercise every mega-panel element: two columns with
  // column titles, link rows (badge + description), a featured image card, and a
  // bottom CTA bar.
  await Promise.all([
    createMenuItem({
      label: 'Fulfillment',
      type: 'columnTitle',
      parent: solutionsMenuItem.id,
      column: 1,
      order: 0,
    }),
    createMenuItem({
      label: 'Global Shipping',
      type: 'link',
      parent: solutionsMenuItem.id,
      column: 1,
      order: 1,
      badge: 'New',
      description: 'Deliver to 100+ countries in 5–8 days.',
      link: { type: 'custom', url: '/posts' },
    }),
    createMenuItem({
      label: 'Warehousing',
      type: 'link',
      parent: solutionsMenuItem.id,
      column: 1,
      order: 2,
      description: 'Compliance-first storage and packing.',
      link: { type: 'custom', url: '/posts' },
    }),
    createMenuItem({
      label: 'Integrations',
      type: 'columnTitle',
      parent: solutionsMenuItem.id,
      column: 2,
      order: 3,
    }),
    createMenuItem({
      label: 'Shopify',
      type: 'link',
      parent: solutionsMenuItem.id,
      column: 2,
      order: 4,
      link: { type: 'custom', url: '/posts' },
    }),
    createMenuItem({
      label: 'TikTok Shop',
      type: 'link',
      parent: solutionsMenuItem.id,
      column: 2,
      order: 5,
      badge: 'Hot',
      link: { type: 'custom', url: '/posts' },
    }),
    createMenuItem({
      label: 'See it in action',
      type: 'featured',
      parent: solutionsMenuItem.id,
      order: 6,
      description: 'A cross-border order from checkout to delivery.',
      image: image2Doc.id,
      link: { type: 'reference', reference: { relationTo: 'posts', value: post1Doc.id } },
    }),
    createMenuItem({
      label: 'Talk to our team',
      type: 'cta',
      parent: solutionsMenuItem.id,
      order: 7,
      description: 'Get a fulfillment plan tailored to your store.',
      link: { type: 'reference', reference: { relationTo: 'pages', value: contactPage.id } },
    }),
  ])

  payload.logger.info(`— Seeding globals...`)

  await Promise.all([
    payload.updateGlobal({
      slug: 'header',
      // `navItems[].item` is cast until `generate:types` refreshes the Header type
      data: {
        navItems: [
          {
            item: postsMenuItem.id,
          },
          {
            item: solutionsMenuItem.id,
          },
          {
            item: contactMenuItem.id,
          },
        ],
      } as never,
    }),
    payload.updateGlobal({
      slug: 'footer',
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Admin',
              url: '/admin',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Source Code',
              newTab: true,
              url: 'https://github.com/payloadcms/payload/tree/3.x/templates/website',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Payload',
              newTab: true,
              url: 'https://payloadcms.com/',
            },
          },
        ],
      },
    }),
  ])

  payload.logger.info('Seeded database successfully!')
}

async function fetchFileByURL(url: string): Promise<File> {
  const res = await fetch(url, {
    credentials: 'include',
    method: 'GET',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch file from ${url}, status: ${res.status}`)
  }

  const data = await res.arrayBuffer()

  return {
    name: url.split('/').pop() || `file-${Date.now()}`,
    data: Buffer.from(data),
    mimetype: `image/${url.split('.').pop()}`,
    size: data.byteLength,
  }
}
