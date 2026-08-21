'use client'

import React from 'react'

import type { Page } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'

export const SplitImageHero: React.FC<Page['hero']> = ({ links, media, richText, reversed }) => {
  const textContent = (
    <div className="space-y-8">
      {richText && <RichText className="mb-6" data={richText} enableGutter={false} />}
      {Array.isArray(links) && links.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {links.map(({ link }, i) => (
            <li key={i}>
              <CMSLink {...link} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  const imageContent = (
    <div className="relative">
      {media && typeof media === 'object' && (
        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
          <Media imgClassName="w-full h-auto object-cover" resource={media} />
        </div>
      )}
    </div>
  )

  return (
    <section className="relative overflow-hidden bg-[#FAFAF8] dark:bg-stone-900 pt-16">
      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center py-20 lg:py-28 min-h-[calc(100vh-4rem)]">
          {reversed ? <>{imageContent}{textContent}</> : <>{textContent}{imageContent}</>}
        </div>
      </div>
    </section>
  )
}
