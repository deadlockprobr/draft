'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getHeroImageUrl } from './hero-card'

interface HeroRouletteProps {
  heroes: any[]
  imageOpacity?: number
  className?: string
  style?: React.CSSProperties
}

export function HeroRoulette({ heroes, imageOpacity, className, style }: HeroRouletteProps) {
  const [index, setIndex] = useState(0)
  const [nextIndex, setNextIndex] = useState(1)
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    if (heroes.length <= 1) return

    const raf = requestAnimationFrame(() => setOpacity(1))

    const timeout = setTimeout(() => {
      setIndex(nextIndex)
      setNextIndex((nextIndex + 1) % heroes.length)
      setOpacity(0)
    }, 1500)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timeout)
    }
  }, [nextIndex, heroes.length])

  const srcCurrent = getHeroImageUrl(heroes[index])
  const srcNext = getHeroImageUrl(heroes[nextIndex])

  return (
    <div
      className={`relative overflow-hidden select-none ${className ?? ''}`}
      style={{ width: 72, height: 120, ...style }}
    >
      <div className="absolute inset-0" style={{ background: '#333' }}>
        {srcCurrent && (
          <Image
            src={srcCurrent}
            alt=""
            width={72}
            height={120}
            className="w-full h-full object-cover"
            style={{ filter: 'grayscale(1) brightness(0.7)', opacity: imageOpacity ?? 1 }}
            unoptimized
          />
        )}
      </div>
      <div
        className="absolute inset-0"
        style={{
          background: '#333',
          opacity,
          transition: opacity === 1 ? 'opacity 1.5s ease-in-out' : 'none',
        }}
      >
        {srcNext && (
          <Image
            src={srcNext}
            alt=""
            width={72}
            height={120}
            className="w-full h-full object-cover"
            style={{ filter: 'grayscale(1) brightness(0.7)', opacity: imageOpacity ?? 1 }}
            unoptimized
          />
        )}
      </div>
    </div>
  )
}
