'use client'

import { cn } from '@/lib/utils'

export function TimerDisplay({ seconds, className }: { seconds: number | null; className?: string }) {
  if (seconds === null) return null

  const isLow = seconds <= 5
  const display = String(seconds).padStart(2, '0')

  return (
    <div
      className={cn(
        'text-4xl font-mono font-bold tabular-nums transition-colors',
        isLow ? 'text-red-400 animate-pulse' : 'text-foreground/80',
        className,
      )}
    >
      {display}
    </div>
  )
}
