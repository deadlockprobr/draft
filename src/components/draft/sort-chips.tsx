'use client'

import { parseSortVisual } from '@/lib/draft'
import { cn } from '@/lib/utils'

export function SortChips({ sortString, className }: { sortString: string; className?: string }) {
  const chips = parseSortVisual(sortString)
  return (
    <div className={cn('flex flex-wrap gap-0.5', className)}>
      {chips.map((chip, i) => (
        <span
          key={i}
          className="flex items-center justify-center rounded-sm"
          style={{
            width: 14,
            height: 11,
            fontSize: 8,
            fontWeight: 700,
            background: chip.team === 'a' ? 'rgba(196,134,46,0.65)' : 'rgba(55,79,153,0.65)',
            color: chip.team === 'a' ? '#fff' : '#adc8ff',
          }}
        >
          {chip.type === 'ban' ? '✕' : ''}
        </span>
      ))}
    </div>
  )
}
