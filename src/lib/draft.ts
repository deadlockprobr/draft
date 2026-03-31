export const HEROES_API_URL = process.env.NEXT_PUBLIC_HEROES_API_URL || 'https://assets.deadlock-api.com/v2/heroes'

export function random(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let s = ''
  for (let i = 0; i < length; i++) {
    s += chars[Math.floor(Math.random() * chars.length)]
  }
  return s
}

export interface SortStep {
  team: 'a' | 'b'
  type: 'pick' | 'ban'
  hero?: { key: number; collection: string } | null
  current?: boolean
  auto?: boolean
}

/**
 * Parse the sort string into individual steps.
 * Format: "a#-b#-a1-b2-a2-b1" where:
 *   - first char is team (a/b)
 *   - # means ban, number means pick count
 *   - number indicates how many picks in a row for that team
 */
export function parseSortSteps(sortString: string): { team: 'a' | 'b'; type: 'pick' | 'ban' }[] {
  if (!sortString) return []
  const steps: { team: 'a' | 'b'; type: 'pick' | 'ban' }[] = []

  for (const block of sortString.split('-')) {
    if (block.length < 2) continue
    const team = block[0] as 'a' | 'b'
    const rest = block.slice(1)

    if (rest === '#') {
      steps.push({ team, type: 'ban' })
    } else {
      const count = parseInt(rest, 10) || 1
      for (let i = 0; i < count; i++) {
        steps.push({ team, type: 'pick' })
      }
    }
  }

  return steps
}

/**
 * Merge sort steps with the current items array, marking the current step.
 */
export function parseSortString(sortString: string | null | undefined, items: any[]): SortStep[] {
  if (!sortString) return []
  const base = parseSortSteps(sortString)
  const result: SortStep[] = base.map((step, i) => {
    if (i < items.length) {
      return { ...step, hero: items[i]?.hero ?? null, auto: items[i]?.auto }
    }
    return { ...step }
  })

  // Mark the first unfilled step as current
  for (let i = 0; i < result.length; i++) {
    if (i >= items.length) {
      result[i].current = true
      break
    }
  }

  return result
}

export function parseSortVisual(sortString: string) {
  return parseSortSteps(sortString)
}

export function isDraftFinished(sortString: string, items: any[]): boolean {
  const steps = parseSortSteps(sortString)
  return steps.length > 0 && items.length >= steps.length
}

export function getCurrentStep(sortString: string, items: any[]): { team: 'a' | 'b'; type: 'pick' | 'ban' } | undefined {
  const steps = parseSortSteps(sortString)
  if (items.length >= steps.length) return undefined
  return steps[items.length]
}

export interface Draft {
  id: number
  code_url: string
  code_admin: string
  code_a: string
  code_b: string
  name_a: string
  name_b: string
  sort: string
  stream: boolean
  ready_a: boolean
  ready_b: boolean
  items: string // JSON string
  timer_seconds: number
  callback_url: string | null
  status: 'waiting' | 'active' | 'finished'
  created_at: string
}
