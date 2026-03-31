'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface HeroCardProps {
  hero?: {
    id: number
    name: string
    images?: {
      top_bar_vertical_image_webp?: string
      icon_hero_card_webp?: string
      hero_card_critical_webp?: string
      hero_card_gloat_webp?: string
      hero_card_gloat?: string
      minimap_image_webp?: string
      top_bar_vertical_image?: string
      icon_hero_card?: string
      hero_card_critical?: string
      minimap_image?: string
    }
  }
  variant?: 'default' | 'banned'
  gloat?: boolean
  showName?: boolean
  className?: string
  imageClassName?: string
  style?: React.CSSProperties
  imageOpacity?: number
  children?: React.ReactNode
}

function getHeroImageUrl(hero: HeroCardProps['hero'], variant: 'default' | 'banned' = 'default', gloat = false): string | null {
  if (!hero?.images) return null
  const img = hero.images

  if (gloat) {
    return img.hero_card_gloat_webp
      ?? img.hero_card_gloat
      ?? img.top_bar_vertical_image_webp
      ?? img.top_bar_vertical_image
      ?? null
  }

  if (variant === 'banned') {
    return img.hero_card_critical_webp
      ?? img.hero_card_critical
      ?? img.top_bar_vertical_image_webp
      ?? img.top_bar_vertical_image
      ?? null
  }

  return img.top_bar_vertical_image_webp
    ?? img.top_bar_vertical_image
    ?? img.icon_hero_card_webp
    ?? img.icon_hero_card
    ?? img.minimap_image_webp
    ?? img.minimap_image
    ?? null
}

export function HeroCard({ hero, variant = 'default', gloat = false, showName = true, imageOpacity, className, imageClassName, style, children }: HeroCardProps) {
  const imageUrl = getHeroImageUrl(hero, variant, gloat)

  return (
    <div
      className={cn('relative overflow-hidden select-none', className)}
      style={{ width: 72, height: 120, ...style }}
    >
      {hero && imageUrl ? (
        <Image
          src={imageUrl}
          alt={hero.name}
          width={72}
          height={120}
          className={imageClassName ?? 'w-full h-full object-cover'}
          style={imageOpacity !== undefined ? { opacity: imageOpacity } : undefined}
          unoptimized
        />
      ) : (
        <div className="w-full h-full" style={{ background: 'var(--muted)' }} />
      )}
      {hero && showName && (
        <div className="absolute inset-x-0 bottom-0 px-1 pt-4 pb-1 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none">
          <span
            className="text-[9px] text-white leading-tight line-clamp-1 font-semibold text-center block"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.5)' }}
          >
            {hero.name}
          </span>
        </div>
      )}
      {children}
    </div>
  )
}

export { getHeroImageUrl }
