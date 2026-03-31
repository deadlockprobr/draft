import { describe, it, expect } from 'vitest'
import { parseSortString, getCurrentStep, isDraftFinished } from '../../src/lib/draft'

describe('WebSocket draft flow simulation', () => {
  it('simulates a full draft with auto-picks', () => {
    const sort = 'a#-b#-a1-b1'
    const items: any[] = []

    // Step 0: team A ban - auto-pick (timer expired)
    let step = getCurrentStep(sort, items)
    expect(step).toMatchObject({ team: 'a', type: 'ban' })
    items.push({ type: 'ban', team: 'a', hero: { key: 99 }, order: 1, auto: true })
    expect(isDraftFinished(sort, items)).toBe(false)

    // Step 1: team B ban - manual
    step = getCurrentStep(sort, items)
    expect(step).toMatchObject({ team: 'b', type: 'ban' })
    items.push({ type: 'ban', team: 'b', hero: { key: 5 }, order: 2 })

    // Step 2: team A pick
    step = getCurrentStep(sort, items)
    expect(step).toMatchObject({ team: 'a', type: 'pick' })
    items.push({ type: 'pick', team: 'a', hero: { key: 10 }, order: 3 })

    // Step 3: team B pick
    step = getCurrentStep(sort, items)
    expect(step).toMatchObject({ team: 'b', type: 'pick' })
    items.push({ type: 'pick', team: 'b', hero: { key: 15 }, order: 4 })

    expect(isDraftFinished(sort, items)).toBe(true)
    expect(getCurrentStep(sort, items)).toBeUndefined()
  })

  it('handles 6v6 alternating picks', () => {
    const sort = 'a1-b1-a1-b1-a1-b1-a1-b1-a1-b1-a1-b1'
    const steps = parseSortString(sort, [])
    expect(steps).toHaveLength(12)

    const items = Array.from({ length: 12 }, (_, i) => ({
      type: 'pick',
      team: i % 2 === 0 ? 'a' : 'b',
      hero: { key: i + 1 },
      order: i + 1,
    }))

    expect(isDraftFinished(sort, items)).toBe(true)
  })

  it('handles 3 bans per side', () => {
    const sort = 'a#-b#-a#-b#-a#-b#-a1-b1'
    const steps = parseSortString(sort, [])
    const bans = steps.filter(s => s.type === 'ban')
    const picks = steps.filter(s => s.type === 'pick')
    expect(bans).toHaveLength(6)
    expect(picks).toHaveLength(2)
  })

  it('broadcast payload can be serialized and deserialized', () => {
    const sort = 'a#-b1'
    const items = [{ type: 'ban', team: 'a', hero: { key: 1 }, order: 1 }]
    const steps = parseSortString(sort, items)

    const payload = {
      id: 1,
      code_url: 'test123',
      code_a: 'codeA',
      code_b: 'codeB',
      name_a: 'Alpha',
      name_b: 'Beta',
      sort,
      stream: false,
      ready_a: true,
      ready_b: true,
      steps,
      items,
      timer: 25,
      timer_seconds: 30,
      status: 'active',
    }

    const serialized = JSON.stringify(payload)
    const parsed = JSON.parse(serialized)
    expect(parsed.steps).toHaveLength(2)
    expect(parsed.steps[0].hero).toEqual({ key: 1 })
    expect(parsed.steps[1].current).toBe(true)
    expect(parsed.timer).toBe(25)
    expect(parsed.code_url).toBe('test123')
  })

  it('auto-pick items are flagged correctly', () => {
    const sort = 'a1-b1'
    const items = [
      { type: 'pick', team: 'a', hero: { key: 1 }, order: 1, auto: true },
      { type: 'pick', team: 'b', hero: { key: 2 }, order: 2 },
    ]

    const steps = parseSortString(sort, items)
    expect(steps[0].auto).toBe(true)
    expect(steps[1].auto).toBeUndefined()
    expect(isDraftFinished(sort, items)).toBe(true)
  })
})
