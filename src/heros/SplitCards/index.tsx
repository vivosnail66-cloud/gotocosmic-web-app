'use client'

import React from 'react'

import type { Page } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import RichText from '@/components/RichText'

const accentColors = {
  violet: {
    card: 'shadow-violet-100/60 dark:shadow-black/30',
    button: 'bg-violet-600 text-white shadow-sm shadow-violet-400/20',
  },
  blue: {
    card: 'shadow-blue-100/60 dark:shadow-black/30',
    button: 'bg-blue-600 text-white',
  },
  amber: {
    card: 'shadow-amber-100/60 dark:shadow-black/30',
    button: 'bg-amber-500 text-black',
  },
  emerald: {
    card: 'shadow-emerald-100/60 dark:shadow-black/30',
    button: 'bg-emerald-600 text-white',
  },
  red: {
    card: 'shadow-red-100/60 dark:shadow-black/30',
    button: 'bg-red-600 text-white',
  },
  gray: {
    card: 'shadow-gray-100/60 dark:shadow-black/30',
    button: 'bg-gray-600 text-white',
  },
}

type CardData = {
  icon: string
  title: string
  subtitle?: string
  content?: unknown
  accentColor?: keyof typeof accentColors
  buttonLabel?: string
  buttonLink?: string
}

const BookingCard: React.FC<{ card: CardData }> = ({ card }) => {
  const colors = accentColors[card.accentColor || 'violet']

  return (
    <div
      className={`bg-white dark:bg-stone-800 rounded-2xl border border-gray-100 dark:border-stone-700 shadow-xl ${colors.card} p-5`}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{card.icon}</span>
        <div>
          <p className="text-xs font-bold text-[#1C1917] dark:text-stone-100">{card.title}</p>
          {card.subtitle && (
            <p className="text-[10px] text-[#78716C] dark:text-stone-400">{card.subtitle}</p>
          )}
        </div>
      </div>

      {card.content && (
        <div className="mb-3 text-[11px] text-[#78716C] dark:text-stone-400 leading-relaxed">
          <RichText data={card.content} enableGutter={false} />
        </div>
      )}

      {card.buttonLabel && (
        <div
          className={`w-full ${colors.button} text-[11px] font-bold py-2 rounded-xl text-center`}
        >
          {card.buttonLabel}
        </div>
      )}
    </div>
  )
}

export const SplitCardsHero: React.FC<Page['hero']> = ({ links, richText, cards, reversed }) => {
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

  const cardsContent = (
    <div className="relative" aria-hidden="true">
      <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
        <div className="w-3/4 h-3/4 rounded-full bg-violet-100/60 dark:bg-violet-900/20 blur-3xl" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.isArray(cards) &&
          cards.map((block, i) => {
            if (block.blockType === 'bookingCard') {
              return <BookingCard key={i} card={block as unknown as CardData} />
            }
            return null
          })}
      </div>
    </div>
  )

  return (
    <section className="relative overflow-hidden bg-[#FAFAF8] dark:bg-stone-900 pt-16">
      <div className="relative max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr_1.05fr] gap-16 items-center py-20 lg:py-28 min-h-[calc(100vh-4rem)]">
          {reversed ? <>{cardsContent}{textContent}</> : <>{textContent}{cardsContent}</>}
        </div>
      </div>
    </section>
  )
}
